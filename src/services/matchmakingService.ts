import { db } from '../Firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';

export interface MatchmakingCriteria {
  sport?: string;
  maxDistance?: number; // en kilómetros
  priceRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  skillLevel?: 'beginner' | 'intermediate' | 'advanced' | 'any';
  preferredTimes?: string[]; // ['morning', 'afternoon', 'evening']
}

export interface MatchRecommendation {
  matchId: string;
  score: number; // 0-100, donde 100 es la mejor coincidencia
  reasons: string[]; // Razones por las que se recomienda este partido
  match: any; // Datos completos del partido
}

/**
 * Encuentra partidos disponibles basados en criterios de matchmaking
 */
export async function findMatchesForUser(
  userId: string, 
  criteria: MatchmakingCriteria = {},
  maxResults: number = 10
): Promise<MatchRecommendation[]> {
  try {
    // Construir query base para partidos abiertos
    let matchQuery = query(
      collection(db, 'matches'),
      where('status', '==', 'open'),
      where('date', '>', Timestamp.now()),
      orderBy('date', 'asc'),
      limit(maxResults * 2) // Obtenemos más para poder filtrar y rankear
    );

    // Aplicar filtros adicionales si se especifican
    if (criteria.sport) {
      matchQuery = query(
        collection(db, 'matches'),
        where('status', '==', 'open'),
        where('sport', '==', criteria.sport),
        where('date', '>', Timestamp.now()),
        orderBy('date', 'asc'),
        limit(maxResults * 2)
      );
    }

    const querySnapshot = await getDocs(matchQuery);
    const matches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filtrar partidos donde el usuario ya está inscrito
    const availableMatches = matches.filter(match => 
      !match.players?.includes(userId)
    );

    // Calcular puntuaciones y generar recomendaciones
    const recommendations: MatchRecommendation[] = [];

    for (const match of availableMatches) {
      const score = calculateMatchScore(match, criteria, userId);
      const reasons = generateRecommendationReasons(match, criteria);

      if (score > 0) { // Solo incluir partidos con puntuación positiva
        recommendations.push({
          matchId: match.id,
          score,
          reasons,
          match
        });
      }
    }

    // Ordenar por puntuación descendente y limitar resultados
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

  } catch (error) {
    console.error('Error finding matches for user:', error);
    throw new Error('Error al buscar partidos recomendados');
  }
}

/**
 * Calcula una puntuación de compatibilidad para un partido
 */
function calculateMatchScore(
  match: any, 
  criteria: MatchmakingCriteria, 
  userId: string
): number {
  let score = 50; // Puntuación base
  const reasons: string[] = [];

  // Factor 1: Disponibilidad de espacios (peso alto)
  const spotsAvailable = match.maxPlayers - match.currentPlayers;
  if (spotsAvailable > 0) {
    score += 20;
    if (spotsAvailable > 3) {
      score += 10; // Bonus por muchos espacios disponibles
    }
  } else {
    return 0; // No hay espacios disponibles
  }

  // Factor 2: Deporte preferido
  if (criteria.sport && match.sport === criteria.sport) {
    score += 15;
  }

  // Factor 3: Rango de precio
  if (criteria.priceRange) {
    const { min, max } = criteria.priceRange;
    if (match.pricePerPlayer >= min && match.pricePerPlayer <= max) {
      score += 10;
    } else if (match.pricePerPlayer < min) {
      score += 5; // Bonus por ser más barato
    } else {
      score -= 10; // Penalización por ser más caro
    }
  }

  // Factor 4: Proximidad en el tiempo (partidos más cercanos en el tiempo son mejores)
  const now = new Date();
  const matchDate = match.date.toDate ? match.date.toDate() : new Date(match.date);
  const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilMatch <= 24) {
    score += 15; // Bonus por partidos hoy o mañana
  } else if (hoursUntilMatch <= 72) {
    score += 10; // Bonus por partidos en los próximos 3 días
  } else if (hoursUntilMatch <= 168) {
    score += 5; // Bonus menor por partidos en la próxima semana
  }

  // Factor 5: Horario preferido
  if (criteria.preferredTimes && criteria.preferredTimes.length > 0) {
    const matchHour = parseInt(match.time.split(':')[0]);
    let timeMatch = false;

    for (const preferredTime of criteria.preferredTimes) {
      switch (preferredTime) {
        case 'morning':
          if (matchHour >= 6 && matchHour < 12) timeMatch = true;
          break;
        case 'afternoon':
          if (matchHour >= 12 && matchHour < 18) timeMatch = true;
          break;
        case 'evening':
          if (matchHour >= 18 && matchHour < 24) timeMatch = true;
          break;
      }
    }

    if (timeMatch) {
      score += 8;
    }
  }

  // Factor 6: Nivel de llenado del partido (partidos parcialmente llenos son más atractivos)
  const fillPercentage = match.currentPlayers / match.maxPlayers;
  if (fillPercentage >= 0.3 && fillPercentage <= 0.8) {
    score += 5; // Sweet spot: no muy vacío, no muy lleno
  }

  // Factor 7: Duración del partido (preferencia por duraciones estándar)
  if (match.duration >= 1 && match.duration <= 2) {
    score += 3;
  }

  // Asegurar que la puntuación esté en el rango 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Genera razones legibles para la recomendación
 */
function generateRecommendationReasons(
  match: any, 
  criteria: MatchmakingCriteria
): string[] {
  const reasons: string[] = [];

  // Espacios disponibles
  const spotsAvailable = match.maxPlayers - match.currentPlayers;
  if (spotsAvailable === 1) {
    reasons.push('¡Solo queda 1 lugar disponible!');
  } else if (spotsAvailable <= 3) {
    reasons.push(`Quedan ${spotsAvailable} lugares disponibles`);
  } else {
    reasons.push('Muchos lugares disponibles');
  }

  // Deporte coincidente
  if (criteria.sport && match.sport === criteria.sport) {
    reasons.push(`Coincide con tu deporte preferido: ${match.sport}`);
  }

  // Precio atractivo
  if (criteria.priceRange) {
    const { min, max } = criteria.priceRange;
    if (match.pricePerPlayer < min) {
      reasons.push('Precio muy económico');
    } else if (match.pricePerPlayer <= max) {
      reasons.push('Precio dentro de tu rango');
    }
  }

  // Proximidad temporal
  const now = new Date();
  const matchDate = match.date.toDate ? match.date.toDate() : new Date(match.date);
  const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilMatch <= 24) {
    reasons.push('Partido muy pronto');
  } else if (hoursUntilMatch <= 72) {
    reasons.push('Partido en los próximos días');
  }

  // Nivel de participación
  const fillPercentage = match.currentPlayers / match.maxPlayers;
  if (fillPercentage >= 0.5) {
    reasons.push('Partido popular con buena participación');
  }

  // Ubicación
  if (match.location?.address) {
    reasons.push(`Ubicación: ${match.location.address}`);
  }

  return reasons.slice(0, 3); // Limitar a las 3 razones más importantes
}

/**
 * Obtiene partidos recomendados para un usuario basado en su historial
 */
export async function getPersonalizedRecommendations(
  userId: string,
  maxResults: number = 5
): Promise<MatchRecommendation[]> {
  try {
    // TODO: En una implementación más avanzada, aquí analizaríamos:
    // - Deportes que el usuario ha jugado más frecuentemente
    // - Horarios preferidos basados en historial
    // - Rango de precios que suele pagar
    // - Ubicaciones frecuentes

    // Por ahora, usamos criterios generales
    const generalCriteria: MatchmakingCriteria = {
      preferredTimes: ['afternoon', 'evening'], // Horarios más populares
      priceRange: {
        min: 0,
        max: 15000 // Rango de precio razonable
      }
    };

    return await findMatchesForUser(userId, generalCriteria, maxResults);

  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    throw new Error('Error al obtener recomendaciones personalizadas');
  }
}

/**
 * Encuentra partidos similares a uno dado
 */
export async function findSimilarMatches(
  matchId: string,
  maxResults: number = 3
): Promise<MatchRecommendation[]> {
  try {
    // Obtener el partido de referencia
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    if (!matchDoc.exists()) {
      throw new Error('Partido no encontrado');
    }

    const referenceMatch = matchDoc.data();

    // Buscar partidos similares
    const criteria: MatchmakingCriteria = {
      sport: referenceMatch.sport,
      priceRange: {
        min: referenceMatch.pricePerPlayer * 0.8,
        max: referenceMatch.pricePerPlayer * 1.2
      }
    };

    const recommendations = await findMatchesForUser('', criteria, maxResults + 1);
    
    // Filtrar el partido original
    return recommendations.filter(rec => rec.matchId !== matchId).slice(0, maxResults);

  } catch (error) {
    console.error('Error finding similar matches:', error);
    throw new Error('Error al buscar partidos similares');
  }
}
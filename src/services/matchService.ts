import { db } from '../Firebase/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  DocumentData,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  orderBy,
} from 'firebase/firestore';

export interface MatchData {
  sport: string;
  courtId: string;
  courtName: string;
  date: Date;
  time: string;
  duration: number; // in hours
  maxPlayers: number;
  pricePerPlayer: number;
  captainId: string;
  captainName: string;
  description: string;
  location: {
    address: string;
  };
}

/**
 * Crea un nuevo partido en la base de datos.
 * @param matchData - Los datos del partido a crear.
 * @returns El ID del nuevo partido.
 */
export const createMatch = async (matchData: MatchData) => {
  try {
    const matchWithTimestamp = {
      ...matchData,
      date: Timestamp.fromDate(matchData.date),
      players: [matchData.captainId], // El capitán es el primer jugador
      currentPlayers: 1,
      status: 'open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'matches'), matchWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear el partido: ", error);
    throw new Error("No se pudo crear el partido. Inténtalo de nuevo.");
  }
};

/**
 * Obtiene todas las canchas disponibles.
 * @returns Un array con todas las canchas.
 */
export const getAllCourts = async (): Promise<DocumentData[]> => {
  try {
    const courtsRef = collection(db, 'cancha');
    const querySnapshot = await getDocs(courtsRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener las canchas: ", error);
    throw new Error("No se pudieron cargar las canchas.");
  }
};

/**
 * Obtiene todos los partidos en los que un jugador está inscrito.
 * @param playerId - El ID del jugador.
 * @returns Un array con todos los partidos del jugador.
 */
export const getMatchesForPlayer = async (playerId: string): Promise<DocumentData[]> => {
  try {
    const matchesRef = collection(db, 'matches');
    // Consulta los partidos donde el array 'players' contiene el ID del jugador.
    const q = query(matchesRef, where('players', 'array-contains', playerId));
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener los partidos del jugador: ", error);
    throw new Error("No se pudieron cargar tus partidos.");
  }
};

/**
 * Obtiene todos los partidos disponibles (abiertos) para unirse.
 * @returns Un array con todos los partidos disponibles.
 */
export const getAvailableMatches = async (): Promise<DocumentData[]> => {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(
      matchesRef, 
      where('status', '==', 'open'),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener partidos disponibles: ", error);
    throw new Error("No se pudieron cargar los partidos disponibles.");
  }
};

/**
 * Permite a un jugador unirse a un partido.
 * @param matchId - ID del partido.
 * @param playerId - ID del jugador.
 * @param playerName - Nombre del jugador.
 * @returns Éxito de la operación.
 */
export const joinMatch = async (matchId: string, playerId: string, playerName: string): Promise<boolean> => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      throw new Error("El partido no existe.");
    }
    
    const matchData = matchSnap.data();
    
    // Verificar si el partido está abierto
    if (matchData.status !== 'open') {
      throw new Error("Este partido ya no está disponible.");
    }
    
    // Verificar si el partido está lleno
    if (matchData.currentPlayers >= matchData.maxPlayers) {
      throw new Error("El partido está lleno.");
    }
    
    // Verificar si el jugador ya está en el partido
    if (matchData.players.includes(playerId)) {
      throw new Error("Ya estás inscrito en este partido.");
    }
    
    // Agregar el jugador al partido
    await updateDoc(matchRef, {
      players: arrayUnion(playerId),
      currentPlayers: increment(1),
      updatedAt: serverTimestamp(),
    });
    
    // Si el partido se llena, cambiar el estado a 'full'
    if (matchData.currentPlayers + 1 >= matchData.maxPlayers) {
      await updateDoc(matchRef, {
        status: 'full'
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error al unirse al partido: ", error);
    throw error;
  }
};

/**
 * Permite a un jugador salir de un partido.
 * @param matchId - ID del partido.
 * @param playerId - ID del jugador.
 * @returns Éxito de la operación.
 */
export const leaveMatch = async (matchId: string, playerId: string): Promise<boolean> => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) {
      throw new Error("El partido no existe.");
    }
    
    const matchData = matchSnap.data();
    
    // Verificar si el jugador es el capitán
    if (matchData.captainId === playerId) {
      throw new Error("El capitán no puede abandonar el partido. Cancela el partido si es necesario.");
    }
    
    // Remover el jugador del partido
    await updateDoc(matchRef, {
      players: arrayRemove(playerId),
      currentPlayers: increment(-1),
      updatedAt: serverTimestamp(),
    });
    
    // Si el partido estaba lleno, cambiar el estado a 'open'
    if (matchData.status === 'full') {
      await updateDoc(matchRef, {
        status: 'open'
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error al salir del partido: ", error);
    throw error;
  }
};

/**
 * Obtiene los detalles de un partido específico.
 * @param matchId - ID del partido.
 * @returns Datos del partido.
 */
export const getMatchById = async (matchId: string): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, 'matches', matchId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el partido: ", error);
    throw new Error("No se pudo cargar el partido.");
  }
};

/**
 * Busca partidos por deporte o ubicación.
 * @param searchTerm - Término de búsqueda.
 * @param sport - Deporte específico (opcional).
 * @returns Array de partidos que coinciden con la búsqueda.
 */
export const searchMatches = async (searchTerm: string, sport?: string): Promise<DocumentData[]> => {
  try {
    let q = query(
      collection(db, 'matches'),
      where('status', '==', 'open'),
      orderBy('date', 'asc')
    );
    
    if (sport) {
      q = query(q, where('sport', '==', sport));
    }
    
    const querySnapshot = await getDocs(q);
    const matches = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filtrar por término de búsqueda en el cliente
    if (searchTerm) {
      return matches.filter(match => 
        match.courtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.location.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return matches;
  } catch (error) {
    console.error("Error al buscar partidos: ", error);
    throw new Error("No se pudieron buscar los partidos.");
  }
};
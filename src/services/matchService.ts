import { db, auth } from '../Firebase/firebaseConfig';
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
  deleteDoc,
  writeBatch,
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
    lat?: number;
    lng?: number;
    address: string;
  };
}

/**
 * Calcula la distancia en kilómetros entre dos coordenadas (Haversine Formula).
 */
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radio de la tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

/**
 * Crea un nuevo partido en la base de datos y genera notificaciones de proximidad.
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
    
    // --- LÓGICA DE NOTIFICACIONES GEOLOCALIZADAS ---
    if (matchData.location?.lat && matchData.location?.lng) {
      // Obtener jugadores que tengan configurada su ubicación y preferencias
      const playersQuery = query(collection(db, 'jugador'), where('notificationRadius', '>', 0));
      const playersSnap = await getDocs(playersQuery);

      const batch = writeBatch(db);
      let notificationCount = 0;

      playersSnap.forEach(playerDoc => {
        // No notificar al creador del partido
        if (playerDoc.id === matchData.captainId) return;

        const playerData = playerDoc.data();
        
        // Verificar si el jugador tiene ubicación válida
        if (!playerData.location || !playerData.location.lat || !playerData.location.lng) return;

        // Verificar si tiene habilitadas las notificaciones (si existe el campo)
        if (playerData.notificationsEnabled === false) return;

        // Calcular distancia
        const distance = getDistanceFromLatLonInKm(
          matchData.location.lat!,
          matchData.location.lng!,
          playerData.location.lat,
          playerData.location.lng
        );

        // Obtener el radio de preferencia del jugador (default 10km si no está definido, pero la query ya filtró > 0)
        // Ajustamos para usar el valor exacto que el usuario configuró (1, 3, 5, 10km)
        const maxRadius = Number(playerData.notificationRadius) || 3; // Default a 3km si falla el dato

        if (distance <= maxRadius) {
          // Crear notificación
          const notifRef = doc(collection(db, 'notifications'));
          batch.set(notifRef, {
            userId: playerDoc.id,
            type: 'proximity', // Nuevo tipo para icono de mapa
            title: 'Nuevo partido cerca de ti',
            message: `Partido de ${matchData.sport} a ${distance.toFixed(1)}km en ${matchData.courtName}.`,
            data: {
              matchId: docRef.id,
              distance: distance,
              lat: matchData.location.lat,
              lng: matchData.location.lng
            },
            actions: [{ key: 'join', label: 'Ver Partido' }],
            read: false,
            createdAt: serverTimestamp()
          });
          notificationCount++;
        }
      });

      if (notificationCount > 0) {
        await batch.commit();
        console.log(`Notificaciones enviadas a ${notificationCount} jugadores cercanos.`);
      }
    }

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
    const q = query(courtsRef, where('isActive', '==', true));
    const querySnapshot = await getDocs(q);
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
    // Filtra solo partidos con estado 'open' y fecha futura
    const now = new Date();
    const q = query(
      matchesRef, 
      where('status', '==', 'open'),
      where('date', '>=', Timestamp.fromDate(now)),
      orderBy('date', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener partidos disponibles: ", error);
    // Si falla por índice compuesto, devolvemos array vacío o manejamos el error
    return [];
  }
};

export const joinMatch = async (matchId: string, userId: string, userName: string) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) throw new Error("El partido no existe");
    
    const data = matchSnap.data();
    if (data.currentPlayers >= data.maxPlayers) throw new Error("El partido está lleno");
    if (data.players.includes(userId)) throw new Error("Ya estás unido a este partido");

    await updateDoc(matchRef, {
      players: arrayUnion(userId),
      currentPlayers: increment(1)
    });
    return true;
  } catch (error) {
    console.error("Error al unirse al partido:", error);
    throw error;
  }
};

export const leaveMatch = async (matchId: string, userId: string) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) throw new Error("El partido no existe");
    
    const data = matchSnap.data();
    if (data.captainId === userId) throw new Error("El capitán no puede abandonar el partido. Debe cancelarlo.");

    await updateDoc(matchRef, {
      players: arrayRemove(userId),
      currentPlayers: increment(-1)
    });
    return true;
  } catch (error) {
    console.error("Error al salir del partido:", error);
    throw error;
  }
};

export const cancelMatch = async (matchId: string, userId: string) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const matchSnap = await getDoc(matchRef);
    
    if (!matchSnap.exists()) throw new Error("El partido no existe");
    if (matchSnap.data().captainId !== userId) throw new Error("Solo el capitán puede cancelar el partido");

    // En lugar de borrar, actualizamos estado a cancelled
    await updateDoc(matchRef, { status: 'cancelled' });
    return true;
  } catch (error) {
    console.error("Error al cancelar el partido:", error);
    throw error;
  }
};

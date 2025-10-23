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
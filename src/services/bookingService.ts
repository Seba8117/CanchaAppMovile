import { db } from '../Firebase/firebaseConfig';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

interface BookingData {
  courtId: string;
  courtName: string;
  ownerId: string;
  playerId: string;
  playerName: string;
  date: Date;
  startTime: string;
  endTime:string;
  duration: number;
  price: number;
}

/**
 * Crea una nueva reserva en la base de datos.
 * @param bookingData - Los datos de la reserva a crear.
 * @returns El ID de la nueva reserva.
 */
export const createBooking = async (bookingData: BookingData) => {
  try {
    const bookingWithTimestamp = {
      ...bookingData,
      date: Timestamp.fromDate(bookingData.date),
      status: 'confirmed', // O 'pending_payment' si tienes un sistema de pago
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'bookings'), bookingWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear la reserva: ", error);
    throw new Error("No se pudo completar la reserva. Inténtalo de nuevo.");
  }
};

/**
 * Obtiene las reservas para una cancha en una fecha específica para verificar disponibilidad.
 * @param courtId - El ID de la cancha.
 * @param date - La fecha para la cual se quiere consultar la disponibilidad.
 * @returns Un array con las reservas existentes para esa fecha.
 */
export const getBookingsForDate = async (courtId: string, date: Date) => {
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const bookingsRef = collection(db, 'bookings');
  const q = query(bookingsRef,
    where('courtId', '==', courtId),
    where('date', '>=', Timestamp.fromDate(startOfDay)),
    where('date', '<=', Timestamp.fromDate(endOfDay))
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};

/**
 * Obtiene todas las reservas de un jugador específico.
 * @param playerId - El ID del jugador.
 * @returns Un array con todas las reservas del jugador, ordenadas por fecha.
 */
export const getBookingsForPlayer = async (playerId: string) => {
  try {
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('playerId', '==', playerId)
      // orderBy('date', 'desc') // Puedes descomentar esto para ordenar por fecha
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error al obtener las reservas del jugador: ", error);
    throw new Error("No se pudieron cargar tus reservas.");
  }
};

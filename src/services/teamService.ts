import { db } from '../Firebase/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  DocumentData,
  runTransaction,
} from 'firebase/firestore';

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  image?: string;
  role: 'captain' | 'member';
  joinedAt: Date;
}

export interface TeamData {
  id?: string;
  name: string;
  description: string;
  sport: string;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  requiresApproval: boolean;
  captainId: string;
  captainName: string;
  members: string[]; // Array de IDs de usuarios
  memberDetails?: TeamMember[]; // Detalles completos de los miembros
  teamImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  status: 'active' | 'inactive';
}

/**
 * Crea un nuevo equipo en la base de datos.
 * @param teamData - Los datos del equipo a crear.
 * @returns El ID del nuevo equipo.
 */
export const createTeam = async (teamData: Omit<TeamData, 'id' | 'createdAt' | 'updatedAt' | 'currentPlayers' | 'members'>): Promise<string> => {
  try {
    const teamWithTimestamp = {
      ...teamData,
      members: [teamData.captainId], // El capitán es el primer miembro
      currentPlayers: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'teams'), teamWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear el equipo: ", error);
    throw new Error("No se pudo crear el equipo. Inténtalo de nuevo.");
  }
};

/**
 * Obtiene todos los equipos públicos disponibles.
 * @returns Array de equipos públicos.
 */
export const getPublicTeams = async (): Promise<DocumentData[]> => {
  try {
    const q = query(
      collection(db, 'teams'),
      where('isPrivate', '==', false),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener equipos públicos: ", error);
    throw new Error("No se pudieron cargar los equipos.");
  }
};

/**
 * Obtiene los equipos de un usuario específico.
 * @param userId - ID del usuario.
 * @returns Array de equipos del usuario.
 */
/**
 * Obtiene todos los equipos donde el usuario es miembro o capitán.
 * @param userId - ID del usuario.
 * @returns Array de equipos del usuario.
 */
export const getUserTeams = async (userId: string): Promise<DocumentData[]> => {
  try {
    console.log('getUserTeams - Buscando equipos para userId:', userId);
    
    // Buscar equipos donde el usuario es miembro
    const memberQuery = query(
      collection(db, 'teams'),
      where('members', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    
    // Buscar equipos donde el usuario es capitán
    const captainQuery = query(
      collection(db, 'teams'),
      where('captainId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    console.log('Ejecutando consultas...');
    
    // Ejecutar ambas consultas
    const [memberSnapshot, captainSnapshot] = await Promise.all([
      getDocs(memberQuery),
      getDocs(captainQuery)
    ]);
    
    console.log('Resultados de consulta miembro:', memberSnapshot.docs.length, 'equipos');
    console.log('Resultados de consulta capitán:', captainSnapshot.docs.length, 'equipos');
    
    // Combinar resultados y eliminar duplicados
    const allTeams = new Map();
    
    memberSnapshot.docs.forEach(doc => {
      console.log('Equipo como miembro:', doc.id, doc.data());
      allTeams.set(doc.id, {
        id: doc.id,
        ...doc.data()
      });
    });
    
    captainSnapshot.docs.forEach(doc => {
      console.log('Equipo como capitán:', doc.id, doc.data());
      allTeams.set(doc.id, {
        id: doc.id,
        ...doc.data()
      });
    });
    
    const finalTeams = Array.from(allTeams.values());
    console.log('Total de equipos únicos encontrados:', finalTeams.length);
    
    return finalTeams;
  } catch (error) {
    console.error("Error al obtener equipos del usuario: ", error);
    throw new Error("No se pudieron cargar tus equipos.");
  }
};

/**
 * Obtiene los detalles de un equipo específico.
 * @param teamId - ID del equipo.
 * @returns Datos del equipo.
 */
export const getTeamById = async (teamId: string): Promise<DocumentData | null> => {
  try {
    const docRef = doc(db, 'teams', teamId);
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
    console.error("Error al obtener el equipo: ", error);
    throw new Error("No se pudo cargar el equipo.");
  }
};

/**
 * Permite a un usuario unirse a un equipo.
 * @param teamId - ID del equipo.
 * @param userId - ID del usuario.
 * @param userName - Nombre del usuario.
 * @returns Éxito de la operación.
 */
export const joinTeam = async (teamId: string, userId: string, userName: string): Promise<boolean> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(teamRef);
      if (!snap.exists()) {
        throw new Error("El equipo no existe.");
      }
      const data = snap.data() as any;
      const members: string[] = Array.from(new Set((data.members || []).filter(Boolean)));
      if (members.includes(userId)) {
        throw new Error("Ya eres miembro de este equipo.");
      }
      if (typeof data.maxPlayers === 'number' && members.length >= data.maxPlayers) {
        throw new Error("El equipo está lleno.");
      }
      const newCount = members.length + 1;
      tx.update(teamRef, {
        members: arrayUnion(userId),
        currentPlayers: newCount,
        updatedAt: serverTimestamp(),
      });
    });
    return true;
  } catch (error) {
    console.error("Error al unirse al equipo: ", error);
    throw error;
  }
};

/**
 * Permite a un usuario salir de un equipo.
 * @param teamId - ID del equipo.
 * @param userId - ID del usuario.
 * @returns Éxito de la operación.
 */
export const leaveTeam = async (teamId: string, userId: string): Promise<boolean> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(teamRef);
      if (!snap.exists()) {
        throw new Error("El equipo no existe.");
      }
      const data = snap.data() as any;
      if (data.captainId === userId) {
        throw new Error("El capitán no puede abandonar el equipo. Transfiere el liderazgo primero.");
      }
      const members: string[] = Array.from(new Set((data.members || []).filter(Boolean)));
      const newCount = Math.max(0, members.includes(userId) ? members.length - 1 : members.length);
      tx.update(teamRef, {
        members: arrayRemove(userId),
        currentPlayers: newCount,
        updatedAt: serverTimestamp(),
      });
    });
    return true;
  } catch (error) {
    console.error("Error al salir del equipo: ", error);
    throw error;
  }
};

export const reconcileTeamCounts = async (teamId: string): Promise<void> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const snap = await getDoc(teamRef);
    if (!snap.exists()) return;
    const data = snap.data() as any;
    const members: string[] = Array.from(new Set((data.members || []).filter(Boolean)));
    const uniqueCount = members.length;
    if (typeof data.currentPlayers === 'number' && data.currentPlayers !== uniqueCount) {
      await updateDoc(teamRef, { currentPlayers: uniqueCount, updatedAt: serverTimestamp() });
      try {
        await addDoc(collection(db, 'teams', teamId, 'logs'), {
          type: 'consistency_fix',
          expected: uniqueCount,
          actual: data.currentPlayers,
          members,
          createdAt: serverTimestamp(),
        });
      } catch {}
    }
  } catch {}
};

/**
 * Actualiza la información de un equipo.
 * @param teamId - ID del equipo.
 * @param updateData - Datos a actualizar.
 * @returns Éxito de la operación.
 */
export const updateTeam = async (teamId: string, updateData: Partial<TeamData>): Promise<boolean> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    
    await updateDoc(teamRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error("Error al actualizar el equipo: ", error);
    throw new Error("No se pudo actualizar el equipo.");
  }
};

/**
 * Elimina un equipo de la base de datos.
 * @param teamId - ID del equipo.
 * @returns Éxito de la operación.
 */
export const deleteTeam = async (teamId: string): Promise<boolean> => {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await deleteDoc(teamRef);
    return true;
  } catch (error) {
    console.error("Error al eliminar el equipo: ", error);
    throw new Error("No se pudo eliminar el equipo.");
  }
};

/**
 * Busca equipos por nombre o deporte.
 * @param searchTerm - Término de búsqueda.
 * @param sport - Deporte específico (opcional).
 * @returns Array de equipos que coinciden con la búsqueda.
 */
export const searchTeams = async (searchTerm: string, sport?: string): Promise<DocumentData[]> => {
  try {
    let q = query(
      collection(db, 'teams'),
      where('isPrivate', '==', false),
      where('status', '==', 'active')
    );
    
    if (sport) {
      q = query(q, where('sport', '==', sport));
    }
    
    const querySnapshot = await getDocs(q);
    const teams = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filtrar por nombre en el cliente (Firestore no soporta búsqueda de texto completa)
    if (searchTerm) {
      return teams.filter(team => 
        team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return teams;
  } catch (error) {
    console.error("Error al buscar equipos: ", error);
    throw new Error("No se pudieron buscar los equipos.");
  }
};

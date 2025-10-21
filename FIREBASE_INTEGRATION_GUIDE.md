# Guía de Integración Firebase - CanchApp Mobile

## Índice
1. [Configuración Inicial de Firebase](#configuración-inicial-de-firebase)
2. [Servicios de Firebase Necesarios](#servicios-de-firebase-necesarios)
3. [Configuración por Componente](#configuración-por-componente)
4. [Estructura de Base de Datos](#estructura-de-base-de-datos)
5. [Implementación de Servicios](#implementación-de-servicios)
6. [Configuración de Seguridad](#configuración-de-seguridad)

---

## Configuración Inicial de Firebase

### 1. Crear Proyecto en Firebase Console
```bash
# 1. Ir a https://console.firebase.google.com/
# 2. Crear nuevo proyecto: "CanchApp-Mobile"
# 3. Habilitar Google Analytics (opcional)
# 4. Configurar región: us-central1 (recomendado para Chile)
```

### 2. Instalar Firebase SDK
```bash
npm install firebase
npm install @capacitor/push-notifications  # Para notificaciones push
```

### 3. Configuración Base
Crear archivo `src/config/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "tu-api-key",
  authDomain: "canchapp-mobile.firebaseapp.com",
  projectId: "canchapp-mobile",
  storageBucket: "canchapp-mobile.appspot.com",
  messagingSenderId: "123456789",
  appId: "tu-app-id"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export default app;
```

---

## Servicios de Firebase Necesarios

### Firebase Authentication
- **Propósito**: Autenticación de usuarios (jugadores y dueños)
- **Métodos**: Email/Password, Google Sign-In
- **Componentes**: LoginScreen, ProfileScreen, OwnerProfile

### Cloud Firestore
- **Propósito**: Base de datos principal
- **Colecciones**: users, matches, teams, tournaments, courts, chats
- **Componentes**: Todos los componentes principales

### Firebase Storage
- **Propósito**: Almacenamiento de imágenes
- **Archivos**: Fotos de perfil, imágenes de canchas, logos de equipos
- **Componentes**: ProfileScreen, OwnerProfile, AddCourtScreen

### Firebase Cloud Messaging (FCM)
- **Propósito**: Notificaciones push
- **Tipos**: Invitaciones a partidos, mensajes de chat, actualizaciones de torneos
- **Componentes**: NotificationsScreen, ChatScreen

### Firebase Cloud Functions (Opcional)
- **Propósito**: Lógica del servidor
- **Funciones**: Validaciones, notificaciones automáticas, cálculos de estadísticas

---

## Configuración por Componente

### 1. LoginScreen.tsx - Autenticación

#### Servicios Firebase Necesarios:
- **Firebase Auth**: Registro e inicio de sesión
- **Firestore**: Almacenar perfiles de usuario

#### Implementación:
```typescript
// src/services/authService.ts
import { auth, db } from '../config/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const registerPlayer = async (userData: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth, 
    userData.email, 
    userData.password
  );
  
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    type: 'player',
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    createdAt: new Date(),
    stats: {
      matchesPlayed: 0,
      rating: 0,
      wins: 0,
      losses: 0
    }
  });
  
  return userCredential.user;
};

export const registerOwner = async (ownerData: {
  email: string;
  password: string;
  ownerName: string;
  businessName: string;
  businessRut: string;
  businessAddress: string;
  businessPhone: string;
  businessDescription: string;
}) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth, 
    ownerData.email, 
    ownerData.password
  );
  
  await setDoc(doc(db, 'users', userCredential.user.uid), {
    type: 'owner',
    ownerName: ownerData.ownerName,
    email: ownerData.email,
    business: {
      name: ownerData.businessName,
      rut: ownerData.businessRut,
      address: ownerData.businessAddress,
      phone: ownerData.businessPhone,
      description: ownerData.businessDescription
    },
    createdAt: new Date(),
    stats: {
      totalCourts: 0,
      totalBookings: 0,
      rating: 0
    }
  });
  
  return userCredential.user;
};

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const logoutUser = async () => {
  return await signOut(auth);
};
```

### 2. HomeScreen.tsx - Pantalla Principal

#### Servicios Firebase Necesarios:
- **Firestore**: Obtener partidos cercanos
- **Geolocation**: Filtrar por ubicación

#### Implementación:
```typescript
// src/services/matchService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';

export const getNearbyMatches = async (userLocation: {lat: number, lng: number}) => {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('status', '==', 'open'),
    where('date', '>=', new Date()),
    orderBy('date', 'asc'),
    limit(10)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### 3. SearchScreen.tsx - Búsqueda

#### Servicios Firebase Necesarios:
- **Firestore**: Búsqueda de partidos, equipos, jugadores, canchas
- **Algolia** (opcional): Búsqueda avanzada

#### Implementación:
```typescript
// src/services/searchService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy 
} from 'firebase/firestore';

export const searchMatches = async (searchTerm: string) => {
  const matchesRef = collection(db, 'matches');
  const q = query(
    matchesRef,
    where('sport', '>=', searchTerm),
    where('sport', '<=', searchTerm + '\uf8ff'),
    orderBy('sport'),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const searchTeams = async (searchTerm: string) => {
  const teamsRef = collection(db, 'teams');
  const q = query(
    teamsRef,
    where('name', '>=', searchTerm),
    where('name', '<=', searchTerm + '\uf8ff'),
    orderBy('name')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### 4. ChatScreen.tsx - Sistema de Chat

#### Servicios Firebase Necesarios:
- **Firestore**: Mensajes en tiempo real
- **Firebase Cloud Messaging**: Notificaciones de mensajes

#### Implementación:
```typescript
// src/services/chatService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

export const sendMessage = async (chatId: string, message: {
  senderId: string;
  senderName: string;
  text: string;
  type: 'text' | 'image';
}) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  return await addDoc(messagesRef, {
    ...message,
    timestamp: serverTimestamp(),
    read: false
  });
};

export const subscribeToMessages = (chatId: string, callback: (messages: any[]) => void) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

export const createMatchChat = async (matchId: string, participants: string[]) => {
  const chatsRef = collection(db, 'chats');
  return await addDoc(chatsRef, {
    type: 'match',
    matchId,
    participants,
    createdAt: serverTimestamp(),
    lastMessage: null,
    lastMessageTime: null
  });
};
```

### 5. ProfileScreen.tsx - Perfil de Usuario

#### Servicios Firebase Necesarios:
- **Firestore**: Datos del perfil
- **Firebase Storage**: Foto de perfil

#### Implementación:
```typescript
// src/services/profileService.ts
import { db, storage } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const updateUserProfile = async (userId: string, profileData: any) => {
  const userRef = doc(db, 'users', userId);
  return await updateDoc(userRef, {
    ...profileData,
    updatedAt: new Date()
  });
};

export const uploadProfileImage = async (userId: string, imageFile: File) => {
  const imageRef = ref(storage, `profiles/${userId}/avatar.jpg`);
  const snapshot = await uploadBytes(imageRef, imageFile);
  const downloadURL = await getDownloadURL(snapshot.ref);
  
  // Actualizar URL en el perfil
  await updateUserProfile(userId, { profileImage: downloadURL });
  
  return downloadURL;
};

export const getUserProfile = async (userId: string) => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  }
  return null;
};
```

### 6. TournamentsScreen.tsx - Gestión de Torneos

#### Servicios Firebase Necesarios:
- **Firestore**: Datos de torneos
- **Cloud Functions**: Lógica de inscripciones

#### Implementación:
```typescript
// src/services/tournamentService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  updateDoc,
  doc,
  arrayUnion 
} from 'firebase/firestore';

export const createTournament = async (tournamentData: {
  name: string;
  sport: string;
  maxTeams: number;
  entryFee: number;
  startDate: Date;
  endDate: Date;
  organizerId: string;
  courts: string[];
  rules: string[];
  prizePools: string;
}) => {
  const tournamentsRef = collection(db, 'tournaments');
  return await addDoc(tournamentsRef, {
    ...tournamentData,
    status: 'open',
    registeredTeams: [],
    createdAt: new Date()
  });
};

export const registerTeamInTournament = async (tournamentId: string, teamData: {
  teamId: string;
  teamName: string;
  captainId: string;
  captainName: string;
  players: string[];
}) => {
  const tournamentRef = doc(db, 'tournaments', tournamentId);
  return await updateDoc(tournamentRef, {
    registeredTeams: arrayUnion(teamData),
    updatedAt: new Date()
  });
};

export const getTournamentsByOrganizer = async (organizerId: string) => {
  const tournamentsRef = collection(db, 'tournaments');
  const q = query(tournamentsRef, where('organizerId', '==', organizerId));
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

### 7. OwnerDashboard.tsx - Panel de Dueño

#### Servicios Firebase Necesarios:
- **Firestore**: Estadísticas y datos del negocio
- **Analytics**: Métricas de uso

#### Implementación:
```typescript
// src/services/ownerService.ts
import { db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit 
} from 'firebase/firestore';

export const getOwnerStats = async (ownerId: string) => {
  // Obtener canchas del dueño
  const courtsRef = collection(db, 'courts');
  const courtsQuery = query(courtsRef, where('ownerId', '==', ownerId));
  const courtsSnapshot = await getDocs(courtsQuery);
  
  // Obtener reservas recientes
  const bookingsRef = collection(db, 'bookings');
  const bookingsQuery = query(
    bookingsRef, 
    where('ownerId', '==', ownerId),
    orderBy('date', 'desc'),
    limit(10)
  );
  const bookingsSnapshot = await getDocs(bookingsQuery);
  
  return {
    totalCourts: courtsSnapshot.size,
    recentBookings: bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  };
};
```

### 8. NotificationsScreen.tsx - Notificaciones

#### Servicios Firebase Necesarios:
- **Firebase Cloud Messaging**: Notificaciones push
- **Firestore**: Historial de notificaciones

#### Implementación:
```typescript
// src/services/notificationService.ts
import { messaging, db } from '../config/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';

export const initializeNotifications = async (userId: string) => {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'tu-vapid-key'
    });
    
    // Guardar token en Firestore
    await addDoc(collection(db, 'fcmTokens'), {
      userId,
      token,
      createdAt: new Date()
    });
    
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};

export const subscribeToNotifications = (callback: (payload: any) => void) => {
  return onMessage(messaging, callback);
};

export const getUserNotifications = async (userId: string) => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

---

## Estructura de Base de Datos

### Colecciones Principales

#### users
```javascript
{
  uid: "user123",
  type: "player" | "owner",
  name: "Juan Pérez",
  email: "juan@email.com",
  phone: "+56912345678",
  profileImage: "https://...",
  location: {
    lat: -33.4489,
    lng: -70.6693,
    address: "Santiago, Chile"
  },
  stats: {
    matchesPlayed: 45,
    rating: 4.8,
    wins: 30,
    losses: 15
  },
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### matches
```javascript
{
  id: "match123",
  sport: "Fútbol",
  courtId: "court123",
  courtName: "Cancha Los Pinos",
  date: timestamp,
  time: "19:00",
  duration: 90,
  maxPlayers: 10,
  currentPlayers: 7,
  price: 5000,
  captainId: "user123",
  captainName: "Juan Pérez",
  players: ["user123", "user456"],
  status: "open" | "full" | "in_progress" | "completed",
  location: {
    lat: -33.4489,
    lng: -70.6693,
    address: "Santiago, Chile"
  },
  chatId: "chat123",
  createdAt: timestamp
}
```

#### teams
```javascript
{
  id: "team123",
  name: "Los Tigres FC",
  sport: "Fútbol",
  captainId: "user123",
  members: ["user123", "user456", "user789"],
  maxMembers: 15,
  level: "Intermedio",
  wins: 12,
  losses: 3,
  rating: 4.7,
  logo: "https://...",
  description: "Equipo amateur de fútbol",
  createdAt: timestamp
}
```

#### tournaments
```javascript
{
  id: "tournament123",
  name: "Copa Primavera 2024",
  sport: "Fútbol",
  organizerId: "owner123",
  organizerName: "Complejo Deportivo",
  maxTeams: 16,
  entryFee: 50000,
  prize: "500.000",
  startDate: timestamp,
  endDate: timestamp,
  registrationDeadline: timestamp,
  status: "open" | "in_progress" | "completed",
  registeredTeams: [
    {
      teamId: "team123",
      teamName: "Los Tigres FC",
      captainId: "user123",
      registrationDate: timestamp
    }
  ],
  courts: ["court123", "court456"],
  rules: ["Regla 1", "Regla 2"],
  format: "Eliminación Simple",
  createdAt: timestamp
}
```

#### courts
```javascript
{
  id: "court123",
  name: "Cancha Los Pinos",
  ownerId: "owner123",
  sports: ["Fútbol", "Futsal"],
  location: {
    lat: -33.4489,
    lng: -70.6693,
    address: "Santiago, Chile"
  },
  amenities: ["Estacionamiento", "Vestuarios", "Duchas"],
  pricePerHour: 25000,
  images: ["https://...", "https://..."],
  rating: 4.8,
  availability: {
    monday: ["09:00-22:00"],
    tuesday: ["09:00-22:00"],
    // ... otros días
  },
  createdAt: timestamp
}
```

#### chats
```javascript
{
  id: "chat123",
  type: "match" | "team" | "direct",
  matchId: "match123", // si es chat de partido
  teamId: "team123", // si es chat de equipo
  participants: ["user123", "user456"],
  lastMessage: "¿Confirmamos para las 7?",
  lastMessageTime: timestamp,
  createdAt: timestamp
}
```

#### messages (subcollection de chats)
```javascript
{
  id: "message123",
  senderId: "user123",
  senderName: "Juan Pérez",
  text: "¡Hola equipo!",
  type: "text" | "image",
  imageUrl: "https://...", // si es imagen
  timestamp: timestamp,
  read: false
}
```

---

## Configuración de Seguridad

### Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios solo pueden leer/escribir sus propios datos
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Partidos - todos pueden leer, solo creadores pueden modificar
    match /matches/{matchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == resource.data.captainId || 
         request.auth.uid in resource.data.players);
    }
    
    // Equipos - miembros pueden leer, capitanes pueden modificar
    match /teams/{teamId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.members;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.captainId;
    }
    
    // Torneos - todos pueden leer, solo organizadores pueden modificar
    match /tournaments/{tournamentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.organizerId;
    }
    
    // Canchas - todos pueden leer, solo dueños pueden modificar
    match /courts/{courtId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == resource.data.ownerId;
    }
    
    // Chats - solo participantes pueden acceder
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
      }
    }
  }
}
```

### Storage Security Rules
```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Perfiles - usuarios solo pueden subir sus propias fotos
    match /profiles/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Canchas - solo dueños pueden subir imágenes
    match /courts/{courtId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Validar ownership en Cloud Function
    }
    
    // Equipos - solo capitanes pueden subir logos
    match /teams/{teamId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Validar captaincy en Cloud Function
    }
  }
}
```

---

## Pasos de Implementación

### Fase 1: Configuración Base
1. ✅ Crear proyecto Firebase
2. ✅ Instalar dependencias
3. ✅ Configurar archivo firebase.ts
4. ✅ Implementar autenticación básica

### Fase 2: Funcionalidades Core
1. ✅ Implementar sistema de usuarios
2. ✅ Crear estructura de partidos
3. ✅ Implementar búsqueda básica
4. ✅ Sistema de chat en tiempo real

### Fase 3: Funcionalidades Avanzadas
1. ✅ Sistema de torneos
2. ✅ Gestión de canchas
3. ✅ Notificaciones push
4. ✅ Sistema de ratings

### Fase 4: Optimización
1. ✅ Implementar caché local
2. ✅ Optimizar consultas
3. ✅ Configurar índices
4. ✅ Testing y debugging

---

## Comandos Útiles

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login a Firebase
firebase login

# Inicializar proyecto
firebase init

# Deploy reglas de seguridad
firebase deploy --only firestore:rules
firebase deploy --only storage

# Deploy Cloud Functions
firebase deploy --only functions

# Emuladores locales
firebase emulators:start
```

---

## Consideraciones Importantes

### Performance
- Usar paginación en listas largas
- Implementar caché local con React Query
- Optimizar imágenes antes de subir
- Usar índices compuestos para consultas complejas

### Seguridad
- Validar datos en el cliente Y servidor
- Usar reglas de seguridad estrictas
- Implementar rate limiting
- Sanitizar inputs de usuario

### Costos
- Monitorear uso de Firestore
- Optimizar consultas para reducir lecturas
- Usar Storage de manera eficiente
- Considerar límites de FCM

### Escalabilidad
- Diseñar estructura de datos escalable
- Usar Cloud Functions para lógica compleja
- Implementar sharding si es necesario
- Considerar Firestore bundles para datos estáticos

---

¡Esta guía te permitirá integrar Firebase completamente en tu aplicación CanchApp Mobile! 🚀
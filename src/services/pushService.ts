import { PushNotifications } from '@capacitor/push-notifications';
import { db } from '../Firebase/firebaseConfig';
import { doc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { LatLng, haversineKm } from './locationService';

export type NotificationPayload = {
  type: 'proximity' | 'match-join' | 'booking';
  title: string;
  message: string;
  userId: string;
  data?: any;
  actions?: { key: string; label: string }[];
};

export async function initPush(userId: string) {
  try {
    const permStatus = await PushNotifications.requestPermissions();
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
    }

    PushNotifications.addListener('registration', async (token) => {
      await setDoc(doc(db, 'users', userId), { pushToken: token.value, updatedAt: serverTimestamp() }, { merge: true });
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.warn('Push registration error', error);
    });

    PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      const nDoc = {
        userId,
        type: (notification.data?.type as string) || 'proximity',
        title: notification.title || 'Notificación',
        message: notification.body || '',
        data: notification.data || {},
        createdAt: serverTimestamp(),
        read: false,
      };
      await addDoc(collection(db, 'notifications'), nDoc);
    });

    PushNotifications.addListener('pushNotificationActionPerformed', async (event) => {
      const action = event.actionId;
      const data = event.notification.data || {};
      const nDoc = {
        userId,
        type: (data?.type as string) || 'proximity',
        title: event.notification.title || 'Acción de notificación',
        message: event.notification.body || '',
        data: { ...data, action },
        createdAt: serverTimestamp(),
        read: false,
      };
      await addDoc(collection(db, 'notifications'), nDoc);
    });
  } catch (e) {
    console.warn('initPush error', e);
  }
}

export async function saveNotification(payload: NotificationPayload) {
  const docData = {
    userId: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
    actions: payload.actions || [],
    read: false,
    createdAt: serverTimestamp(),
  };
  await addDoc(collection(db, 'notifications'), docData);
}

export async function setUserNotificationPreferences(userId: string, prefs: any) {
  await setDoc(doc(db, 'users', userId), { notificationPreferences: prefs, updatedAt: serverTimestamp() }, { merge: true });
}

export async function triggerProximityNotifications(userId: string, userLoc: LatLng, radiusKmMin = 2, radiusKmMax = 5) {
  try {
    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('status', '==', 'active'));
    const snap = await getDocs(q);
    const candidates: any[] = [];
    snap.docs.forEach((d) => {
      const m = d.data() as any;
      const loc = m.location;
      const coords = loc && typeof loc.lat === 'number' && typeof loc.lng === 'number' ? { lat: loc.lat, lng: loc.lng } : null;
      if (!coords) return;
      const dist = haversineKm(userLoc, coords);
      if (dist >= radiusKmMin && dist <= radiusKmMax) {
        candidates.push({ id: d.id, ...m, distanceKm: dist });
      }
    });
    for (const m of candidates.slice(0, 5)) {
      await saveNotification({
        type: 'proximity',
        title: `Partido cerca: ${m.sport}`,
        message: `${m.courtName || m.location?.name || 'Cancha'} • ${m.time} • ${Math.max(0, m.maxPlayers - (m.currentPlayers || 0))} cupos • ${m.distanceKm.toFixed(1)} km`,
        userId,
        data: { matchId: m.id },
        actions: [{ key: 'join', label: 'Unirse' }],
      });
    }
  } catch (e) {
    console.warn('triggerProximityNotifications error', e);
  }
}
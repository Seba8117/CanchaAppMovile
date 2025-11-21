import { describe, it, expect, vi } from 'vitest';
import { saveNotification, triggerProximityNotifications } from '../services/pushService';

vi.mock('../Firebase/firebaseConfig', () => ({ db: {} }));

vi.mock('firebase/firestore', () => {
  const addDoc = vi.fn(async (_c: any, data: any) => ({ id: 'n1', data }));
  const getDocs = vi.fn(async () => ({ docs: [] }));
  const collection = vi.fn((_: any, __: any) => ({}));
  const serverTimestamp = vi.fn(() => new Date());
  const query = vi.fn((...args: any[]) => args);
  const where = vi.fn((...args: any[]) => args);
  return { addDoc, getDocs, collection, serverTimestamp, query, where } as any;
});

describe('pushService', () => {
  it('saveNotification stores minimal payload quickly', async () => {
    const firestore = await import('firebase/firestore');
    const start = performance.now();
    await saveNotification({ type: 'proximity', title: 'Partido cerca', message: 'Test', userId: 'u1' });
    const duration = performance.now() - start;
    expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    const args = (firestore.addDoc as any).mock.calls[0][1];
    expect(args.userId).toBe('u1');
    expect(args.data).toBeDefined();
    expect(duration).toBeLessThan(50);
  });

  it('triggerProximityNotifications only creates notifications for matches in 2-5km', async () => {
    const firestore = await import('firebase/firestore');
    (firestore.addDoc as any).mockClear();
    (firestore.getDocs as any).mockClear();
    (firestore.getDocs as any).mockResolvedValueOnce({ docs: [
      { id: 'm1', data: () => ({ status: 'active', location: { lat: 0, lng: 0.03 }, sport: 'Fútbol', time: '19:00', maxPlayers: 10, currentPlayers: 6, courtName: 'A' }) },
      { id: 'm2', data: () => ({ status: 'active', location: { lat: 0, lng: 0.08 }, sport: 'Fútbol', time: '20:00', maxPlayers: 10, currentPlayers: 6, courtName: 'B' }) },
      { id: 'm3', data: () => ({ status: 'active', location: { lat: 0, lng: 0.01 }, sport: 'Fútbol', time: '21:00', maxPlayers: 10, currentPlayers: 6, courtName: 'C' }) },
    ] } as any);
    await triggerProximityNotifications('u1', { lat: 0, lng: 0 });
    expect(firestore.addDoc).toHaveBeenCalledTimes(1);
    const args = (firestore.addDoc as any).mock.calls[0][1];
    expect(args.type).toBe('proximity');
  });
});
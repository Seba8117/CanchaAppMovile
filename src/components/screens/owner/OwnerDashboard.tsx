import { useEffect, useMemo, useState, useRef } from 'react';
// 1. AÑADIDO 'MessageSquare'
import { Building, Calendar, Trophy, Users, Plus, TrendingUp, Clock, MapPin, Settings, LogOut, MoreVertical, AlertTriangle, MessageSquare, Star } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../ui/dropdown-menu';
import { AppHeader } from '../../common/AppHeader';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';
// Firebase
import { auth, db } from '../../../Firebase/firebaseConfig';
  import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    Timestamp,
    onSnapshot,
  } from 'firebase/firestore';

interface OwnerDashboardProps {
  onNavigate: (screen: string, data?: any) => void;
  onLogout?: () => void;
}

export function OwnerDashboard({ onNavigate, onLogout }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState({
    totalCourts: 0,
    totalBookings: 0,
    monthlyRevenue: 0,
    revenueDeltaPct: 0,
    activeTournaments: 0,
    averageRating: 0,
  });
  const [bookingsToday, setBookingsToday] = useState(0);
  const today = useMemo(() => new Date(), []);
  const [todayLabel, setTodayLabel] = useState({ day: today.getDate(), month: today.toLocaleString('es-ES', { month: 'short' }) });

  const [recentBookings, setRecentBookings] = useState<Array<{
    id: string;
    courtName: string;
    playerName: string;
    date: string;
    time: string;
    amount: number;
    status: string;
  }>>([]);

  const [tournaments, setTournaments] = useState<Array<{
    id: string;
    name: string;
    sport: string;
    participants?: number;
    startDate: string;
    prize: number;
    status: string;
  }>>([]);
  
  const [dashboardTotals, setDashboardTotals] = useState({
    tournamentsRegistered: 0,
    tournamentsCompleted: 0,
    teamsTotal: 0,
  });

  const [screenLoading, setScreenLoading] = useState(true);
  const [screenError, setScreenError] = useState<string | null>(null);

  // Helpers de rango de fechas del mes actual y anterior
  const monthRanges = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { currentStart, currentEnd, prevStart, prevEnd };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const ensureBookingsIndex = async () => {
          try {
            const base = (import.meta as any).env?.VITE_MP_API_URL;
            if (!base) return;
            await fetch(`${String(base).replace(/\/$/, '')}/firestore/indexes/ensure-bookings`, { method: 'POST' });
          } catch {}
        };
        // 1) Canchas activas del dueño
        const courtsQ = query(
          collection(db, 'cancha'),
          where('ownerId', '==', currentUser.uid),
          where('isActive', '==', true)
        );
        const courtsSnap = await getDocs(courtsQ);
        const totalCourts = courtsSnap.size; // usamos este número como "Canchas Activas"

        // 2) Reservas del mes (counts + revenue)
        const bookingsRef = collection(db, 'bookings');
        const currentBookingsQ = query(
          bookingsRef,
          where('ownerId', '==', currentUser.uid),
          where('date', '>=', Timestamp.fromDate(monthRanges.currentStart)),
          where('date', '<=', Timestamp.fromDate(monthRanges.currentEnd))
        );
        let currentBookingsSnap;
        try {
          currentBookingsSnap = await getDocs(currentBookingsQ);
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (msg.includes('index') || msg.includes('requires an index')) {
            await ensureBookingsIndex();
            currentBookingsSnap = await getDocs(currentBookingsQ);
          } else {
            throw e;
          }
        }
        const currentBookings = currentBookingsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const totalBookings = currentBookings.length;
        const monthlyRevenue = currentBookings.reduce((sum, b: any) => sum + (Number(b.price) || 0), 0);

        // 2b) Reservas de HOY (conteo)
        const dayStart = new Date();
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date();
        dayEnd.setHours(23,59,59,999);
        const bookingsTodayQ = query(
          bookingsRef,
          where('ownerId', '==', currentUser.uid),
          where('date', '>=', Timestamp.fromDate(dayStart)),
          where('date', '<=', Timestamp.fromDate(dayEnd))
        );
        let bookingsTodaySnap;
        try {
          bookingsTodaySnap = await getDocs(bookingsTodayQ);
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (msg.includes('index') || msg.includes('requires an index')) {
            await ensureBookingsIndex();
            bookingsTodaySnap = await getDocs(bookingsTodayQ);
          } else {
            throw e;
          }
        }
        const bookingsTodayCount = bookingsTodaySnap.size;

        // 3) Ingresos del mes anterior para variación
        const prevBookingsQ = query(
          bookingsRef,
          where('ownerId', '==', currentUser.uid),
          where('date', '>=', Timestamp.fromDate(monthRanges.prevStart)),
          where('date', '<=', Timestamp.fromDate(monthRanges.prevEnd))
        );
        let prevBookingsSnap;
        try {
          prevBookingsSnap = await getDocs(prevBookingsQ);
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (msg.includes('index') || msg.includes('requires an index')) {
            await ensureBookingsIndex();
            prevBookingsSnap = await getDocs(prevBookingsQ);
          } else {
            throw e;
          }
        }
        const prevRevenue = prevBookingsSnap.docs
          .map(d => d.data())
          .reduce((sum, b: any) => sum + (Number(b.price) || 0), 0);
        const revenueDeltaPct = prevRevenue > 0
          ? Math.round(((monthlyRevenue - prevRevenue) / prevRevenue) * 100)
          : 100; // Si el mes anterior fue 0, mostramos +100% por simplicidad

        // 4) Torneos del dueño
        const tournamentsQ = query(collection(db, 'torneo'), where('ownerId', '==', currentUser.uid));
        const tournamentsSnap = await getDocs(tournamentsQ);
        const tournamentsData = tournamentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const activeTournaments = tournamentsData.filter((t: any) => t.status !== 'finalizado').length;

        // 5) Actividad reciente: últimas 5 reservas
        const recentQ = query(
          bookingsRef,
          where('ownerId', '==', currentUser.uid)
        );
        const recentSnap = await getDocs(recentQ);
        const recentAllRaw = recentSnap.docs.map(doc => ({ id: doc.id, data: doc.data() as any }));
        const recent = recentAllRaw
          .sort((a, b) => {
            const at = (a.data.date as Timestamp).toMillis?.() ?? (a.data.date?.toDate?.() as Date)?.getTime?.() ?? 0;
            const bt = (b.data.date as Timestamp).toMillis?.() ?? (b.data.date?.toDate?.() as Date)?.getTime?.() ?? 0;
            return bt - at;
          })
          .slice(0, 5)
          .map(({ id, data }) => {
            const dt = (data.date as Timestamp).toDate();
            const dateStr = dt.toLocaleDateString();
            return {
              id,
              courtName: data.courtName || 'Cancha',
              playerName: data.playerName || 'Jugador',
              date: dateStr,
              time: `${data.startTime ?? ''}${data.endTime ? ` - ${data.endTime}` : ''}`,
              amount: Number(data.price) || 0,
              status: data.status || 'confirmed',
            };
          });

        // 6) Mapear torneos para la UI
        const mappedTournaments = tournamentsData.map((t: any) => {
          const start: string = t.startDate ? new Date(t.startDate).toLocaleDateString() : '-';
          return {
            id: t.id,
            name: t.name || 'Torneo',
            sport: t.sport || 'futbol',
            participants: t.registeredTeams ?? 0,
            startDate: start,
            prize: Number(t.entryFee || 0) * Number(t.maxTeams || 0), // aproximación de premio si no hay campo
            status: t.status || 'registration',
          };
        });

        setStats(s => ({
          ...s,
          totalCourts,
          totalBookings,
          monthlyRevenue,
          revenueDeltaPct,
          activeTournaments,
          averageRating: s.averageRating,
        }));
        setBookingsToday(bookingsTodayCount);
        setRecentBookings(recent);
        setTournaments(mappedTournaments);
        setScreenError(null);
        setScreenLoading(false);
      } catch (e) {
        console.error('Error cargando dashboard del dueño:', e);
        setScreenError('Error al cargar el dashboard');
        setScreenLoading(false);
      }
    };

    fetchData();
  }, [monthRanges]);

  // Suscripción en tiempo real al conteo de canchas activas del dueño
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(
      collection(db, 'cancha'),
      where('ownerId', '==', currentUser.uid),
      where('isActive', '==', true)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setStats((s) => ({ ...s, totalCourts: snap.size }));
      setScreenLoading(false);
    });
    return () => unsubscribe();
  }, []);

  

  // Suscripción en tiempo real: torneos del dueño (registrados y finalizados)
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(collection(db, 'torneo'), where('ownerId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      const total = snap.size;
      const completed = snap.docs.filter((d) => (d.data() as any).status === 'finalizado').length;
      setDashboardTotals((t) => ({ ...t, tournamentsRegistered: total, tournamentsCompleted: completed }));
      // Mantener coherencia con tarjeta de "Torneos Activos"
      const activeCount = snap.docs.filter((d) => (d.data() as any).status !== 'finalizado').length;
      setStats((s) => ({ ...s, activeTournaments: activeCount }));
      setScreenLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Suscripción en tiempo real: equipos totales del dueño
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(collection(db, 'teams'), where('ownerId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snap) => {
      setDashboardTotals((t) => ({ ...t, teamsTotal: snap.size }));
      setScreenLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [courtsData, setCourtsData] = useState<Array<{
    id: string | number;
    name: string;
    sport: string;
    surface: string;
    capacity: number;
    pricePerHour: number;
    status: string;
    bookingsToday: number;
    rating: number;
  }>>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const [courtsError, setCourtsError] = useState<string | null>(null);
  const [courtsErrorType, setCourtsErrorType] = useState<string | null>(null);
  const [visibleCourtsCount, setVisibleCourtsCount] = useState(20);

  // Helpers compartidos para cache y mapeo de estados (disponibles en todos los efectos)
  const cacheKeyRef = useRef<string>(`courts:${auth.currentUser?.uid || 'anon'}`);
  const loadFromCache = () => {
    try {
      const raw = localStorage.getItem(cacheKeyRef.current);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return;
      setCourtsData(parsed.items);
    } catch {}
  };
  const saveToCache = (items: any) => {
    try {
      localStorage.setItem(cacheKeyRef.current, JSON.stringify({ items, ts: Date.now() }));
    } catch {}
  };
  const mapStatus = (s: string) => {
    if (!s) return 'available';
    const val = String(s).toLowerCase();
    if (val === 'active' || val === 'activo') return 'available';
    if (val === 'occupied' || val === 'ocupada' || val === 'ocupado') return 'occupied';
    if (val === 'maintenance' || val === 'mantenimiento') return 'maintenance';
    return s || 'available';
  };
  const mapItem = (it: any) => ({
    id: it.id ?? it._id ?? Math.random(),
    name: it.name ?? it.nombre ?? 'Cancha',
    sport: it.sport ?? it.deporte ?? 'Fútbol',
    surface: it.surface ?? it.superficie ?? 'Césped sintético',
    capacity: Number(it.capacity ?? it.capacidad ?? 10),
    pricePerHour: Number(it.pricePerHour ?? it.precioPorHora ?? it.price ?? 0),
    status: mapStatus(it.status ?? it.estado ?? (it.isActive ?? it.activo ? 'active' : 'maintenance')),
    bookingsToday: Number(it.bookingsToday ?? it.reservasHoy ?? 0),
    rating: Number(it.rating ?? it.puntuacion ?? 4.5),
  });
  const hasData = (stats.totalCourts > 0) || (stats.totalBookings > 0) || (tournaments.length > 0) || (recentBookings.length > 0);

  const sportSvg = (sport: string) => {
    const s = (sport || '').toLowerCase();
    if (s.includes('fut')) {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#FFF" stroke="#172c44" strokeWidth="1.5" />
          <path d="M12 2l3 4-3 3-3-3 3-4z" fill="#172c44" />
          <path d="M5 14l3-2 2 3-3 2-2-3z" fill="#172c44" />
          <path d="M16 12l3 2-2 3-3-2 2-3z" fill="#172c44" />
        </svg>
      );
    }
    if (s.includes('bás') || s.includes('basq')) {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#ff8f00" stroke="#6d4c41" strokeWidth="1.5" />
          <path d="M4 12h16M12 4v16M6 6l12 12M6 18L18 6" stroke="#6d4c41" strokeWidth="1.2" fill="none" />
        </svg>
      );
    }
    if (s.includes('ten')) {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#8bc34a" stroke="#33691e" strokeWidth="1.5" />
          <path d="M6 8c2.5 2 6.5 2 9 0M6 16c2.5-2 6.5-2 9 0" stroke="#33691e" strokeWidth="1.2" fill="none" />
        </svg>
      );
    }
    if (s.includes('pádel') || s.includes('padel') || s.includes('pade')) {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" aria-hidden>
          <circle cx="9" cy="10" r="6" fill="#cddc39" stroke="#827717" strokeWidth="1.5" />
          <rect x="14" y="12" width="6" height="2" rx="1" fill="#827717" />
        </svg>
      );
    }
    if (s.includes('vól') || s.includes('vole') || s.includes('vol')) {
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#eceff1" stroke="#37474f" strokeWidth="1.5" />
          <path d="M4 12c6-5 10-5 16 0M6 6c4 4 8 4 12 0M6 18c4-4 8-4 12 0" stroke="#37474f" strokeWidth="1.2" fill="none" />
        </svg>
      );
    }
    return (
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-700" aria-hidden>
        <circle cx="12" cy="12" r="10" fill="#e0e0e0" stroke="#616161" strokeWidth="1.5" />
      </svg>
    );
  };

  // recentBookings ahora viene de Firestore

  // tournaments ahora viene de Firestore

  useEffect(() => {
    let polling: any;
    const lastFetchRef: { current: number } = { current: 0 };
    const retryRef: { current: number } = { current: 0 };
    const apiUrlEnv = (import.meta as any).env?.VITE_COURTS_API_URL;
    const apiUrl = apiUrlEnv ? String(apiUrlEnv) : '';
    const apiKey = (import.meta as any).env?.VITE_COURTS_API_KEY;
    const fallbackFromFirestore = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const q = query(collection(db, 'cancha'), where('ownerId', '==', user.uid), where('isActive', '==', true));
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const mapped = items.map(mapItem);
        setCourtsData(mapped);
        saveToCache(mapped);
        setVisibleCourtsCount((c) => Math.min(mapped.length, 20));
      } catch (err) {
        console.error('Firestore fallback error', err);
      }
    };
    const refresh = async (manual = false) => {
      if (!navigator.onLine) {
        setCourtsError('Sin conexión a internet');
        setCourtsErrorType('offline');
        return;
      }
      if (!apiUrl) {
        await fallbackFromFirestore();
        setLoadingCourts(false);
        return;
      }
      const now = Date.now();
      if (now - lastFetchRef.current < 1000 && !manual) return;
      lastFetchRef.current = now;
      setLoadingCourts(true);
      setCourtsError(null);
      setCourtsErrorType(null);
      try {
        const user = auth.currentUser;
        const token = await user?.getIdToken?.();
        const ownerId = auth.currentUser?.uid;
        const url = ownerId ? `${apiUrl}?ownerId=${encodeURIComponent(ownerId)}` : apiUrl;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (apiKey) headers['X-API-Key'] = String(apiKey);
        const res = await fetch(url, { headers });
        if (res.status === 401) {
          setCourtsError('Sesión expirada');
          setCourtsErrorType('expired');
          throw new Error('Unauthorized');
        }
        if (!res.ok) {
          setCourtsError('Error del servidor');
          setCourtsErrorType('server');
          throw new Error(`Server error ${res.status}`);
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.canchas) ? data.canchas : null;
        if (!list) {
          setCourtsError('Datos corruptos');
          setCourtsErrorType('corrupt');
          throw new Error('Invalid data');
        }
        const filtered = list.filter((x: any) => {
          const st = (x.status ?? x.estado ?? '').toLowerCase();
          const activeFlag = Boolean(x.isActive ?? x.activo);
          return st === 'active' || st === 'activo' || activeFlag;
        });
        const mapped = filtered.map(mapItem);
        setCourtsData(mapped);
        saveToCache(mapped);
        retryRef.current = 0;
        setVisibleCourtsCount((c) => Math.min(mapped.length, 20));
        const schedule = () => {
          const grow = () => setVisibleCourtsCount((c) => (c < mapped.length ? Math.min(mapped.length, c + 20) : c));
          if ((window as any).requestIdleCallback) (window as any).requestIdleCallback(grow);
          else setTimeout(grow, 300);
        };
        schedule();
      } catch (e) {
        console.error('Courts API error', { type: courtsErrorType, error: e });
        // Fallback inmediato a Firestore para no ocultar canchas activas
        fallbackFromFirestore();
        retryRef.current = Math.min(retryRef.current + 1, 5);
        const delay = Math.min(30000, 2000 * Math.pow(2, retryRef.current));
        setTimeout(() => refresh(true), delay);
      } finally {
        setLoadingCourts(false);
      }
    };
    loadFromCache();
    refresh(true);
    const onManual = () => refresh(true);
    window.addEventListener('manual-refresh', onManual);
    if (apiUrl) {
      polling = setInterval(() => refresh(false), 15000);
    }
    return () => {
      if (polling) clearInterval(polling);
      window.removeEventListener('manual-refresh', onManual);
    };
  }, []);

  // Suscripción en tiempo real a canchas activas desde Firestore como respaldo
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const user = auth.currentUser;
    if (!user) return;
    if (courtsData.length > 0) return; // Si ya hay datos desde API, no duplicar
    try {
      const q = query(collection(db, 'cancha'), where('ownerId', '==', user.uid), where('isActive', '==', true));
      unsubscribe = onSnapshot(q, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const mapped = items.map(mapItem);
        setCourtsData(mapped);
        saveToCache(mapped);
        setVisibleCourtsCount((c) => Math.min(mapped.length, 20));
      });
    } catch (e) {
      console.error('Realtime courts subscription error', e);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [courtsData.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-[#E8F5E9] text-[#2E7D32]';
      case 'occupied': return 'bg-[#FFEBEE] text-[#C62828]';
      case 'maintenance': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'confirmed': return 'bg-[#E8F5E9] text-[#2E7D32]';
      case 'pending': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'completed': return 'bg-[#E3F2FD] text-[#1565C0]';
      case 'active': return 'bg-[#E3F2FD] text-[#1565C0]';
      case 'registration': return 'bg-[#FFF3E0] text-[#E65100]';
      default: return 'bg-[#E3F2FD] text-[#1565C0]';
    }
  };

  const formatCLP = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Activo';
      case 'occupied': return 'Ocupada';
      case 'maintenance': return 'Mantenimiento';
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Finalizada';
      case 'active': return 'Activo';
      case 'registration': return 'Inscripciones';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b] pb-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-[#00a884]/10"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#172c44]/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-gradient-to-tr from-[#00a884]/25 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#f4b400]/20 to-[#ffd54f]/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-tl from-[#172c44]/15 to-transparent rounded-full blur-2xl"></div>
      
      {/* Patrón de puntos dorados */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#172c44] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-16 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-[#172c44] rounded-full animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 right-8 w-1 h-1 bg-[#00a884] rounded-full animate-pulse animation-delay-500"></div>
        <div className="absolute top-60 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1500"></div>
      </div>
      
      <AppHeader 
        title="⚡ Dashboard" 
        showLogo={true}
        titleClassName="font-['Outfit'] font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent"
        rightContent={
          <div className="flex items-center gap-2">
            
            {/* --- BOTÓN DE CHAT AÑADIDO --- */}
            <Button 
              variant="outline" 
              size="sm" 
              className="text-cyan-600 border-cyan-200 bg-white/80 backdrop-blur-sm hover:bg-cyan-50 shadow-lg"
              onClick={() => onNavigate('owner-chat')}
            >
              <MessageSquare size={20} />
            </Button>
            {/* --- FIN DEL BOTÓN DE CHAT --- */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-indigo-600 border-indigo-200 bg-white/80 backdrop-blur-sm hover:bg-indigo-50 shadow-lg"
                >
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-sm bg-white/95">
                <DropdownMenuItem onClick={() => onNavigate('report-team')}>
                  <AlertTriangle size={18} className="mr-2" />
                  Reportar Equipo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('owner-settings')}>
                  <Settings size={18} className="mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onLogout?.()}
                >
                  <LogOut size={18} className="mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="px-4 py-6 relative z-10">
        {screenLoading && (
          <div className="mb-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow">
            <p className="font-['Outfit'] font-semibold text-sm text-slate-700">Cargando Dashboard...</p>
          </div>
        )}
        {screenError && !hasData && (
          <div className="mb-4 bg-rose-100 text-rose-700 rounded-2xl p-4 text-center font-['Outfit'] font-semibold">
            {screenError}
          </div>
        )}
        {/* Dynamic Sports Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Canchas Card */}
          <Card className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Building size={22} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-['Outfit'] font-black text-3xl text-white leading-none">{stats.totalCourts}</p>
                  </div>
                </div>
                <p className="font-['Outfit'] font-semibold text-sm text-indigo-100">🏟️ Canchas Activas</p>
              </div>
            </CardContent>
          </Card>

          {/* Reservas Card */}
          <Card className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Calendar size={22} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-['Outfit'] font-black text-3xl text-white leading-none">{stats.totalBookings}</p>
                  </div>
                </div>
                <p className="font-['Outfit'] font-semibold text-sm text-emerald-100">⚡ Reservas del Mes</p>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos Card - Wide */}
          <Card className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl col-span-2">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white/5 rounded-full translate-y-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TrendingUp size={26} className="text-white" />
                    </div>
                    <div>
                    <p className="font-['Outfit'] font-black text-4xl text-white leading-none">${(stats.monthlyRevenue / 1000).toFixed(0)}k</p>
                      <p className="font-['Outfit'] font-semibold text-sm text-orange-100 mt-1">💰 Ingresos Mensuales</p>
                    </div>
                  </div>
                  <div className="text-right text-white/80">
                    <p className="font-['Outfit'] font-medium text-xs">{stats.revenueDeltaPct >= 0 ? `+${stats.revenueDeltaPct}%` : `${stats.revenueDeltaPct}%`} vs mes anterior</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta de chats removida para simplificar la interfaz */}

          {/* Tarjeta de torneos removida para simplificar la interfaz */}

          {/* Rating Card - Wide to match Ingresos */}
          <Card className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl col-span-2">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white/5 rounded-full translate-y-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <Star size={26} className="text-white" />
                    </div>
                    <div>
                      <p className="font-['Outfit'] font-black text-4xl text-white leading-none">{stats.averageRating}</p>
                      <p className="font-['Outfit'] font-semibold text-sm text-orange-100 mt-1">🌟 Rating Promedio</p>
                    </div>
                  </div>
                  <div className="text-right text-white/80">
                    <p className="font-['Outfit'] font-medium text-xs">Promedio de reseñas</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/70 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 font-['Outfit'] font-semibold text-sm transition-all duration-300 data-[state=active]:scale-105"
            >
              📊 Overview
            </TabsTrigger>
            <TabsTrigger 
              value="courts" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 font-['Outfit'] font-semibold text-sm transition-all duration-300 data-[state=active]:scale-105"
            >
              🏟️ Canchas
            </TabsTrigger>
            {/* Trigger de Torneos removido */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">⚡ Actividad Reciente</h2>
                <p className="font-['Outfit'] font-medium text-sm text-slate-500 mt-1">Últimas reservas y movimientos</p>
              </div>
              <button className="font-['Outfit'] font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
                Ver Todas →
              </button>
            </div>

            <div className="space-y-4">
              {recentBookings.map((booking, index) => (
                <Card key={booking.id} className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${
                      booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      booking.status === 'pending' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                      'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-emerald-400' :
                            booking.status === 'pending' ? 'bg-orange-400' :
                            'bg-indigo-400'
                          } animate-pulse`}></div>
                          <h3 className="font-['Outfit'] font-bold text-lg text-slate-800">{booking.courtName}</h3>
                        </div>
                        <div className="ml-6">
                          <p className="font-['Outfit'] font-semibold text-base text-slate-700 mb-1">👤 {booking.playerName}</p>
                          <div className="flex items-center gap-4 font-['Outfit'] font-medium text-sm text-slate-500">
                            <span className="flex items-center gap-1">📅 {booking.date}</span>
                            <span className="flex items-center gap-1">⏰ {booking.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {formatCLP(booking.amount)}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">CLP</p>
                        
                        {/* Estado de la reserva */}
                        <div className="mt-2">
                          <Badge className={`text-xs font-['Outfit'] font-semibold px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-indigo-700">{bookingsToday}</p>
                <p className="font-['Outfit'] font-semibold text-xs text-indigo-600 mt-1">Reservas Hoy</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-emerald-700">{Number(stats.averageRating || 0).toFixed(1)}</p>
                <p className="font-['Outfit'] font-semibold text-xs text-emerald-600 mt-1">Rating Promedio</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-amber-700">{todayLabel.day}</p>
                <p className="font-['Outfit'] font-semibold text-xs text-amber-600 mt-1">{todayLabel.month}</p>
              </div>
            </div>
          </TabsContent>

          {/* Courts Tab */}
          <TabsContent value="courts" className="space-y-6">
            <div className="flex flex-col items-center text-center mb-6">
              <h2 className="font-['Outfit'] font-black text-2xl bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">🏟️ Centro Deportivo</h2>
              <p className="font-['Outfit'] font-medium text-sm text-slate-500 mt-1">Gestiona tus instalaciones</p>
              <div className="mt-4 flex gap-3 flex-wrap justify-center">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-['Outfit'] font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6"
                  onClick={() => onNavigate('add-court')}
                >
                  <Plus size={20} className="mr-2" />
                  Nueva Cancha
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-['Outfit'] font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6"
                  onClick={() => {
                    const ev = new Event('manual-refresh');
                    window.dispatchEvent(ev);
                  }}
                >
                  Actualizar
                </Button>
              </div>
            </div>

            {loadingCourts && courtsData.length === 0 && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="bg-white/60 backdrop-blur-sm border-0 rounded-2xl shadow-xl">
                    <CardContent className="p-5 relative">
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-200 to-indigo-200"></div>
                      <div className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                          <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {courtsError && (
              <div className="bg-orange-100 text-orange-700 rounded-2xl p-4 text-center font-['Outfit'] font-semibold">
                {courtsError}
              </div>
            )}

            {!loadingCourts && courtsData.length === 0 && !courtsError && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-indigo-700">0</p>
                <p className="font-['Outfit'] font-semibold text-xs text-indigo-600 mt-1">No existen canchas activas</p>
              </div>
            )}

            <div className="space-y-4">
              {courtsData.slice(0, visibleCourtsCount).map((court, index) => (
                <Card key={court.id} className={`bg-white/80 backdrop-blur-sm border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden ${
                  court.sport === 'Fútbol' ? 'shadow-emerald-200/50 hover:shadow-emerald-300/60' :
                  court.sport === 'Básquetball' ? 'shadow-orange-200/50 hover:shadow-orange-300/60' :
                  'shadow-blue-200/50 hover:shadow-blue-300/60'
                } shadow-xl hover:shadow-2xl`}>
                  <CardContent className="p-5 relative">
                    {/* Línea de color superior como en overview */}
                    <div className={`absolute top-0 inset-x-0 h-1.5 ${
                      court.sport === 'Fútbol' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                      court.sport === 'Básquetball' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            court.sport === 'Fútbol' ? 'bg-emerald-400' :
                            court.sport === 'Básquetball' ? 'bg-orange-400' :
                            'bg-blue-400'
                          } animate-pulse`}></div>
                          <h3 className="font-['Outfit'] font-bold text-lg text-slate-800">{court.name}</h3>
                        </div>
                        
                        <div className="ml-6">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {sportSvg(court.sport)}
                              <p className="font-['Outfit'] font-semibold text-base text-slate-700">
                                {court.sport}
                              </p>
                            </div>
                            <span className="text-slate-400">•</span>
                            <p className="font-['Outfit'] font-medium text-sm text-slate-600">{court.surface}</p>
                          </div>
                          <div className="flex items-center gap-3 font-['Outfit'] font-medium text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {court.capacity} jugadores
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          {formatCLP(court.pricePerHour)}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">CLP</p>
                        
                        {/* Estado de la cancha */}
                        <div className="mt-2">
                          <Badge className={`text-xs font-['Outfit'] font-semibold px-2 py-1 rounded-full ${getStatusColor(court.status)}`}>
                            {getStatusText(court.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      {/* Estado y reservas */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          court.status === 'available' ? 'bg-emerald-400 animate-pulse' :
                          court.status === 'occupied' ? 'bg-red-400 animate-pulse' :
                          'bg-yellow-400 animate-pulse'
                        }`}></div>
                        <span className="font-['Outfit'] font-semibold text-sm text-slate-600">
                          {court.status === 'available' ? 'Disponible ahora' :
                           court.status === 'occupied' ? 'En uso' :
                           'Mantenimiento'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-['Outfit'] font-medium text-sm text-slate-500">
                          {court.bookingsToday} reservas hoy
                        </span>
                      </div>
                      
                      {/* Botones */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-['Outfit'] font-semibold rounded-xl px-4 py-2 text-xs h-8 flex-1"
                          onClick={() => onNavigate('edit-court', court)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 font-['Outfit'] font-semibold rounded-xl px-4 py-2 text-xs h-8 flex-1"
                        >
                          Horarios
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sección de torneos removida */}
        </Tabs>
      </div>
    </div>
  );
}

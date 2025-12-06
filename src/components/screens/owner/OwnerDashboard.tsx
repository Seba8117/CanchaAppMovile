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
  
  // --- ESTADO DE MENSAJES NO LEÍDOS ---
  const [unreadMessages, setUnreadMessages] = useState(0);

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
            let dateStr = 'Fecha N/A';
            if (data.date?.toDate) dateStr = data.date.toDate().toLocaleDateString();
            else if (data.date) dateStr = String(data.date).split('T')[0];
            return {
              id,
              courtName: data.courtName || 'Cancha',
              playerName: data.userName || 'Usuario',
              date: dateStr,
              time: data.time || '00:00',
              amount: Number(data.price) || 0,
              status: data.status || 'pending'
            };
          });

        setStats({
          totalCourts,
          totalBookings,
          monthlyRevenue,
          revenueDeltaPct,
          activeTournaments,
          averageRating: 4.8, // Placeholder o calculado si tienes reseñas
        });
        setBookingsToday(bookingsTodayCount);
        setRecentBookings(recent);
        setTournaments(tournamentsData.map((t: any) => ({
          id: t.id,
          name: t.name,
          sport: t.sport,
          participants: t.registeredCount || 0,
          startDate: t.startDate?.toDate?.().toLocaleDateString() || String(t.startDate || '').split('T')[0],
          prize: Number(t.prizePool) || 0,
          status: t.status
        })).slice(0, 3));

      } catch (err: any) {
        console.error("Error loading dashboard:", err);
        setScreenError(err.message || "Error al cargar datos");
      } finally {
        setScreenLoading(false);
      }
    };

    fetchData();
  }, [monthRanges]);

  // --- EFECTO PARA CONTAR MENSAJES NO LEÍDOS ---
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Escuchar cambios en chats donde el dueño participa
    // Asumiendo que 'chats' tiene un campo 'unreadCounts' o similar, o escuchando mensajes
    // Aquí implementamos una lógica simplificada: escuchar chats con mensajes no leídos
    // Una mejor aproximación sería tener un contador global en el perfil del usuario o una colección 'unread_messages'
    
    // OPCIÓN 1: Consulta directa si tienes una estructura que lo soporte
    // const q = query(collection(db, 'chats'), where('participantsUids', 'array-contains', currentUser.uid));
    
    // OPCIÓN 2 (Más robusta para tiempo real): Escuchar todos los chats del usuario
    const q = query(
      collection(db, 'chats'), 
      where('participantsUids', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Verificar si hay mensajes no leídos para este usuario
        // Esto depende de cómo guardes el estado de lectura. 
        // Ejemplo: data.unreadCountMap?.[currentUser.uid] > 0
        if (data.unreadCountMap && typeof data.unreadCountMap[currentUser.uid] === 'number') {
          count += data.unreadCountMap[currentUser.uid];
        } else {
          // Fallback o lógica alternativa si no existe el mapa
          // Por ejemplo, si lastMessageSenderId !== currentUser.uid y !data.readBy?.includes(currentUser.uid)
          // Para simplificar, dejaremos 0 si no está implementado el mapa
        }
      });
      setUnreadMessages(count);
    });

    return () => unsubscribe();
  }, []);

  if (screenLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
        <p className="text-white mt-4 font-['Outfit']">Cargando Dashboard...</p>
      </div>
    );
  }

  if (screenError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-600 text-center font-bold">{screenError}</p>
        <Button className="mt-4" onClick={() => window.location.reload()}>Reintentar</Button>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gray-50 pb-20 font-['Outfit']">
      <AppHeader 
        title="Panel de Control" 
        showLogo={true}
        leftContent={
          <img src={logoIcon} alt="Logo" className="w-8 h-8" />
        }
        rightContent={
          <div className="flex items-center gap-2">
            {/* 2. BOTÓN DE CHAT CON BADGE */}
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-[#172c44] relative"
              onClick={() => onNavigate('owner-chat')}
            >
              <MessageSquare size={22} />
              {unreadMessages > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm animate-pulse">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#172c44]">
                  <MoreVertical size={22} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-0 bg-white/95 backdrop-blur-md">
                <DropdownMenuItem className="focus:bg-indigo-50 cursor-pointer" onClick={() => onNavigate('owner-profile')}>
                  <Building className="mr-2 h-4 w-4 text-indigo-600" />
                  <span>Mi Perfil de Negocio</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-indigo-50 cursor-pointer" onClick={() => onNavigate('owner-courts')}>
                  <Settings className="mr-2 h-4 w-4 text-indigo-600" />
                  <span>Administrar Canchas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro que quieres cerrar tu sesión empresarial?')) {
                      onLogout?.();
                    }
                  }}
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
                    <Building size={24} className="text-white" />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">Activo</Badge>
                </div>
                <div className="mt-4">
                  <p className="font-['Outfit'] font-black text-4xl text-white leading-none">{stats.totalCourts}</p>
                  <p className="font-['Outfit'] font-semibold text-sm text-indigo-100 mt-1">Canchas Activas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos Card */}
          <Card className="bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm">
                    {stats.revenueDeltaPct > 0 ? '+' : ''}{stats.revenueDeltaPct}%
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="font-['Outfit'] font-black text-3xl text-white leading-none">
                    ${(stats.monthlyRevenue / 1000).toFixed(0)}k
                  </p>
                  <p className="font-['Outfit'] font-semibold text-sm text-emerald-100 mt-1">Ingresos Mensuales</p>
                </div>
              </div>
            </CardContent>
          </Card>

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

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 grid w-full grid-cols-2 h-auto">
            <TabsTrigger 
              value="overview"
              className="rounded-lg data-[state=active]:bg-[#172c44] data-[state=active]:text-white font-['Outfit'] font-bold py-2.5 transition-all duration-300"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="tournaments"
              className="rounded-lg data-[state=active]:bg-[#172c44] data-[state=active]:text-white font-['Outfit'] font-bold py-2.5 transition-all duration-300"
            >
              Torneos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Recent Bookings */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-['Outfit'] font-black text-xl text-[#172c44]">Reservas Recientes</h2>
              <Button variant="link" className="text-[#00a884] font-bold" onClick={() => onNavigate('bookings')}>Ver Todo</Button>
            </div>
            
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">No hay reservas recientes</p>
                </div>
              ) : recentBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00a884] group-hover:w-2 transition-all"></div>
                  <CardContent className="p-4 pl-6">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                          {booking.playerName.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-['Outfit'] font-bold text-[#172c44]">{booking.playerName}</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            <Clock size={12} />
                            <span>{booking.time} • {booking.courtName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-['Outfit'] font-bold text-[#172c44]">{formatCLP(booking.amount)}</p>
                        <div className="mt-1">
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

          <TabsContent value="tournaments" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                className="h-auto py-4 bg-gradient-to-br from-[#172c44] to-[#2a4059] hover:shadow-lg transition-all"
                onClick={() => onNavigate('create-tournament')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-white/10 rounded-full">
                    <Trophy size={20} className="text-[#f4b400]" />
                  </div>
                  <span className="font-['Outfit'] font-bold text-sm">Crear Torneo</span>
                </div>
              </Button>
              <Button 
                className="h-auto py-4 bg-white border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#00a884] hover:text-[#00a884] transition-all"
                onClick={() => onNavigate('owner-courts')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Plus size={20} />
                  </div>
                  <span className="font-['Outfit'] font-bold text-sm">Nueva Cancha</span>
                </div>
              </Button>
            </div>

            <h3 className="font-['Outfit'] font-black text-xl text-[#172c44] mb-4">Torneos Activos</h3>
            
            {tournaments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay torneos activos</p>
                <Button variant="link" className="text-[#00a884] font-bold mt-2" onClick={() => onNavigate('create-tournament')}>
                  Crear el primero
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tournaments.map((tournament) => (
                  <Card 
                    key={tournament.id} 
                    className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => onNavigate('tournament-management', tournament)}
                  >
                    <div className="h-2 bg-gradient-to-r from-[#f4b400] to-[#ff6f00]"></div>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-['Outfit'] font-black text-lg text-[#172c44] group-hover:text-[#00a884] transition-colors">
                            {tournament.name}
                          </h3>
                          <Badge variant="secondary" className="mt-2 bg-indigo-50 text-indigo-700 border-indigo-100">
                            {tournament.sport}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Premio</span>
                          <p className="font-['Outfit'] font-black text-xl text-[#00a884]">{formatCLP(tournament.prize)}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={16} className="text-gray-400" />
                          <span className="font-medium">{tournament.participants} Equipos</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="font-medium">{tournament.startDate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
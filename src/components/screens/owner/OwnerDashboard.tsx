import { useEffect, useMemo, useState, useRef } from 'react';
import { Building, Calendar, Trophy, Users, Plus, TrendingUp, Clock, MapPin, Settings, LogOut, MoreVertical, AlertTriangle, MessageSquare, Star, Edit, Trash2 } from 'lucide-react';
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

  const [courts, setCourts] = useState<any[]>([]);
  
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
        const courtsList = courtsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalCourts = courtsList.length;
        
        // Calcular rating promedio de las canchas
        const totalRating = courtsList.reduce((acc, court: any) => acc + (Number(court.rating) || 0), 0);
        const avgRating = totalCourts > 0 ? (totalRating / totalCourts) : 0;

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

        // 4) Torneos del dueño - NO SE USA PERO MANTENEMOS LA VARIABLE EN STATS
        const activeTournaments = 0;

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
          averageRating: avgRating,
        });
        setBookingsToday(bookingsTodayCount);
        setRecentBookings(recent);
        setCourts(courtsList);

      } catch (err: any) {
        console.error("Error loading dashboard:", err);
        
        // Detectar error de índice faltante
        if (err.message && String(err.message).includes('requires an index')) {
            // Intentar extraer la URL
            const urlMatch = String(err.message).match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
            const indexUrl = urlMatch ? urlMatch[0] : null;
            
            // Usamos un formato especial JSON stringificado para pasar data compleja al estado de error
            setScreenError(JSON.stringify({
                type: 'index_error',
                message: 'Se requiere configurar un índice en la base de datos para ver las estadísticas.',
                url: indexUrl,
                raw: err.message
            }));
        } else {
            setScreenError(err.message || "Error al cargar datos");
        }
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

    const q = query(
      collection(db, 'chats'), 
      where('participantsUids', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.unreadCountMap && typeof data.unreadCountMap[currentUser.uid] === 'number') {
          count += data.unreadCountMap[currentUser.uid];
        }
      });
      setUnreadMessages(count);
    });

    return () => unsubscribe();
  }, []);

  if (screenLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884]">
        <p className="text-white mt-4 font-['Outfit']">Cargando Dashboard...</p>
      </div>
    );
  }

  if (screenError) {
    let errorData = { type: 'general', message: screenError, url: null };
    try {
        const parsed = JSON.parse(screenError);
        if (parsed && parsed.type) errorData = parsed;
    } catch {}

    if (errorData.type === 'index_error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] via-[#243b55] to-[#00a884] p-6 text-center font-['Outfit'] relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-[#f4b400]/10 rounded-full blur-3xl"></div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden z-10">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#f4b400] to-[#ff6f00]"></div>
                    
                    <div className="mb-6 relative">
                        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto backdrop-blur-sm">
                            <Settings className="h-10 w-10 text-[#f4b400] animate-[spin_10s_linear_infinite]" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-3">Optimización Necesaria</h2>
                    <p className="text-indigo-100 mb-8 text-sm leading-relaxed">
                        Para mostrarte las estadísticas detalladas y gráficos de rendimiento, necesitamos activar un índice de alto rendimiento en tu base de datos.
                    </p>
                    
                    {errorData.url && (
                        <Button 
                            className="w-full py-6 bg-gradient-to-r from-[#f4b400] to-[#ffca28] hover:from-[#ffca28] hover:to-[#ffd54f] text-[#172c44] font-black text-base shadow-lg hover:shadow-orange-500/20 transition-all transform hover:-translate-y-1 mb-4 border-0"
                            onClick={() => window.open(errorData.url!, '_blank')}
                        >
                            <TrendingUp className="mr-2 h-5 w-5" />
                            Activar Optimización
                        </Button>
                    )}
                    
                    <p className="text-xs text-white/50 mb-6 px-4">
                        Esta acción abrirá la consola de configuración. El proceso es automático y solo se realiza una vez.
                    </p>

                    <Button 
                        variant="outline" 
                        className="w-full border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
                        onClick={() => window.location.reload()}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        Ya lo activé, recargar
                    </Button>
                </div>
            </div>
        );
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
        <p className="text-red-600 text-center font-bold">{errorData.message}</p>
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

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'futbol': return '⚽';
      case 'basquet': return '🏀';
      case 'tenis': return '🎾';
      case 'padel': return '🏓';
      case 'volley': return '🏐';
      case 'futsal': return '⚽';
      default: return '🏟️';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20 font-['Outfit']">
      <AppHeader 
        title="Panel de Control" 
        showLogo={true}
        className="bg-transparent"
        titleClassName="text-white font-black"
        leftContent={
          <img src={logoIcon} alt="Logo" className="w-8 h-8" />
        }
        rightContent={
          <div className="flex items-center gap-2">
            {/* 2. BOTÓN DE CHAT CON BADGE */}
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white hover:bg-white/10 relative"
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
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
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
          <TabsList className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 grid w-full grid-cols-2 h-auto">
            <TabsTrigger 
              value="overview"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#172c44] text-white font-['Outfit'] font-bold py-2.5 transition-all duration-300"
            >
              Resumen
            </TabsTrigger>
            <TabsTrigger 
              value="courts"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#172c44] text-white font-['Outfit'] font-bold py-2.5 transition-all duration-300"
            >
              Canchas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Recent Bookings */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-['Outfit'] font-black text-xl text-white">Reservas Recientes</h2>
              <Button variant="link" className="text-white/90 hover:text-white font-bold" onClick={() => onNavigate('bookings')}>Ver Todo</Button>
            </div>
            
            <div className="space-y-3">
              {recentBookings.length === 0 ? (
                <div className="text-center py-8 bg-white/10 backdrop-blur-md rounded-xl border border-dashed border-white/20">
                  <p className="text-white/70">No hay reservas recientes</p>
                </div>
              ) : recentBookings.map((booking) => (
                <Card key={booking.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white/95 overflow-hidden group">
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
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-white">{bookingsToday}</p>
                <p className="font-['Outfit'] font-semibold text-xs text-indigo-100 mt-1">Reservas Hoy</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-white">{Number(stats.averageRating || 0).toFixed(1)}</p>
                <p className="font-['Outfit'] font-semibold text-xs text-emerald-100 mt-1">Rating Promedio</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-white">{todayLabel.day}</p>
                <p className="font-['Outfit'] font-semibold text-xs text-amber-100 mt-1">{todayLabel.month}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courts" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Button 
                className="h-auto py-4 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
                onClick={() => onNavigate('add-court')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Plus size={20} className="text-white" />
                  </div>
                  <span className="font-['Outfit'] font-bold text-sm text-white">Nueva Cancha</span>
                </div>
              </Button>
              <Button 
                className="h-auto py-4 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all"
                onClick={() => onNavigate('owner-courts')}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Settings size={20} className="text-white" />
                  </div>
                  <span className="font-['Outfit'] font-bold text-sm text-white">Administrar</span>
                </div>
              </Button>
            </div>

            <h3 className="font-['Outfit'] font-black text-xl text-white mb-4">Mis Canchas Activas</h3>
            
            {courts.length === 0 ? (
              <div className="text-center py-12 bg-white/10 backdrop-blur-md rounded-2xl border border-dashed border-white/20">
                <Building className="w-12 h-12 text-white/50 mx-auto mb-3" />
                <p className="text-white/70 font-medium">No hay canchas registradas</p>
                <Button variant="link" className="text-[#f4b400] font-bold mt-2" onClick={() => onNavigate('add-court')}>
                  Crear la primera
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {courts.map((court) => {
                   const bgImage = court.imageUrl || (court.images && court.images.length > 0 ? court.images[0] : null);
                   const amenitiesCount = court.amenities?.length || 0;
                   const rating = Number(court.rating) || 0;
                   const hasLighting = court.amenities?.some((a: string) => a.toLowerCase().includes('iluminación') || a.toLowerCase().includes('luz')) || false;
                   
                   return (
                    <Card key={court.id} className="bg-white/95 backdrop-blur-sm shadow-lg border-0 overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-300" onClick={() => onNavigate('court-detail', court)}>
                       {/* 1. Imagen Clara y de Alta Calidad */}
                       <div className="h-48 w-full relative">
                         {bgImage ? (
                           <img src={bgImage} alt={court.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                              <Building className="text-gray-400 w-12 h-12" />
                           </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                         
                         {/* Badge de Deporte */}
                         <div className="absolute top-3 left-3">
                            <Badge className="bg-white/90 text-[#172c44] backdrop-blur-md border-0 font-bold shadow-sm px-3 py-1">
                                {getSportIcon(court.sport)} {court.sport.charAt(0).toUpperCase() + court.sport.slice(1)}
                            </Badge>
                         </div>

                         {/* Badge de Rating */}
                         <div className="absolute top-3 right-3">
                            <Badge className="bg-[#f4b400] text-[#172c44] border-0 font-bold shadow-sm flex items-center gap-1">
                                <Star size={12} fill="currentColor" /> {rating > 0 ? rating.toFixed(1) : 'Nuevo'}
                            </Badge>
                         </div>

                         {/* Título y Precio sobre la imagen */}
                         <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="font-['Outfit'] font-black text-2xl text-white mb-1 leading-tight shadow-sm">{court.name}</h3>
                            <p className="text-white/90 font-medium text-sm flex items-center gap-2">
                                <MapPin size={14} className="text-[#f4b400]" />
                                {court.location?.address || 'Ubicación no disponible'}
                            </p>
                         </div>
                       </div>

                       <CardContent className="p-5 space-y-4">
                        {/* 2. Información Detallada */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Superficie</p>
                                <p className="font-['Outfit'] font-bold text-[#172c44] text-sm flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-[#00a884]"></div>
                                    {court.surface || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Capacidad</p>
                                <p className="font-['Outfit'] font-bold text-[#172c44] text-sm flex items-center gap-1.5">
                                    <Users size={14} className="text-indigo-500" />
                                    {court.capacity || '0'} Jugadores
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Dimensiones</p>
                                <p className="font-['Outfit'] font-bold text-[#172c44] text-sm flex items-center gap-1.5">
                                    <Settings size={14} className="text-gray-400" />
                                    Estándar
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Iluminación</p>
                                <p className={`font-['Outfit'] font-bold text-sm flex items-center gap-1.5 ${hasLighting ? 'text-amber-600' : 'text-gray-400'}`}>
                                    <div className={`w-2 h-2 rounded-full ${hasLighting ? 'bg-amber-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                    {hasLighting ? 'Disponible' : 'No disponible'}
                                </p>
                            </div>
                        </div>

                        {/* Servicios Adicionales */}
                        {amenitiesCount > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-500 font-semibold mb-2">Servicios Incluidos</p>
                                <div className="flex flex-wrap gap-2">
                                    {court.amenities.slice(0, 3).map((amenity: string, idx: number) => (
                                        <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] border-0">
                                            {amenity}
                                        </Badge>
                                    ))}
                                    {amenitiesCount > 3 && (
                                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-[10px] border-0">
                                            +{amenitiesCount - 3} más
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Precio y Disponibilidad */}
                        <div className="flex items-center justify-between pt-2 mt-2">
                             <div>
                                <p className="font-['Outfit'] font-black text-xl text-[#00a884]">
                                    {formatCLP(court.pricePerHour)}
                                </p>
                                <p className="text-xs text-gray-400 font-medium">por hora</p>
                             </div>
                             <Button 
                                size="sm" 
                                className="bg-[#172c44] hover:bg-[#2a4059] text-white font-bold rounded-lg shadow-md transition-all hover:scale-105"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate('court-detail', court);
                                }}
                             >
                                <Calendar className="w-4 h-4 mr-2" />
                                Ver Disponibilidad
                             </Button>
                        </div>
                      </CardContent>
                    </Card>
                   );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

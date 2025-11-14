import { useState, useEffect } from 'react';
// Añadido: ChevronDown para los filtros
import { Calendar, Clock, DollarSign, Loader2, AlertTriangle, Inbox, Search, Users, Shield, MapPin, LogOut, X, ChevronDown } from 'lucide-react';
import { AppHeader } from '../../common/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { getBookingsForPlayer } from '../../../services/bookingService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { DocumentData, Timestamp, doc, updateDoc, arrayRemove, increment } from 'firebase/firestore';
import { getMatchesForPlayer } from '../../../services/matchService';

interface MyBookingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function MyBookingsScreen({ onBack, onNavigate }: MyBookingsScreenProps) {
  const [masterList, setMasterList] = useState<DocumentData[]>([]);
  const [activities, setActivities] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');

  // Hook para cargar datos (sin cambios)
  useEffect(() => {
    const fetchActivities = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Debes iniciar sesión para ver tus reservas.");
        setLoading(false);
        return;
      }

      try {
        const [userBookings, userMatches] = await Promise.all([
          getBookingsForPlayer(currentUser.uid),
          getMatchesForPlayer(currentUser.uid)
        ]);

        const formattedBookings = userBookings.map(b => ({ ...b, type: 'booking' }));
        const formattedMatches = userMatches.map(m => ({ ...m, type: 'match' }));

        const allActivities = [...formattedBookings, ...formattedMatches].sort((a, b) => {
          const dateA = a.date?.toMillis() || 0;
          const dateB = b.date?.toMillis() || 0;
          return dateB - dateA;
        });

        setMasterList(allActivities);
        setActivities(allActivities);

      } catch (err: any) {
        console.error("Error fetching activities:", err);
        setError("No se pudieron cargar tus actividades.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Hook para filtros (sin cambios)
  useEffect(() => {
    let result = masterList;

    const lowerQuery = searchQuery.toLowerCase();
    if (lowerQuery) {
      result = result.filter(item =>
        (item.courtName || '').toLowerCase().includes(lowerQuery)
      );
    }

    if (sportFilter) {
      result = result.filter(item => item.sport === sportFilter);
    }

    const lowerCommune = communeFilter.toLowerCase();
    if (lowerCommune) {
      result = result.filter(item => {
        const commune = (item.commune || '').toLowerCase();
        const address = (item.location?.address || '').toLowerCase();
        return commune === lowerCommune || address.includes(lowerCommune);
      });
    }

    setActivities(result);
  }, [searchQuery, sportFilter, communeFilter, masterList]);

  // --- FUNCIÓN PARA CERRAR SESIÓN ---
  const handleSignOut = async () => {
    try {
      await auth.signOut();
      onNavigate('login');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setError("No se pudo cerrar sesión. Inténtalo de nuevo.");
    }
  };

  // --- FUNCIÓN: SALIR O CANCELAR ACTIVIDAD ---
  const handleLeaveActivity = async (item: DocumentData) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Debes estar logueado.");
      return;
    }

    const confirmAction = window.confirm(`¿Estás seguro de que quieres ${item.type === 'match' ? 'salir de este partido' : 'cancelar esta reserva'}?`);
    if (!confirmAction) {
      return;
    }

    setLoading(true);
    try {
      if (item.type === 'match') {
        const matchRef = doc(db, "matches", item.id);
        await updateDoc(matchRef, {
          players: arrayRemove(currentUser.uid),
          currentPlayers: increment(-1)
        });
        setMasterList(prev => prev.filter(a => a.id !== item.id));

      } else if (item.type === 'booking') {
        const bookingRef = doc(db, "bookings", item.id);
        await updateDoc(bookingRef, {
          status: 'cancelled'
        });
        setMasterList(prev => prev.map(a => 
          a.id === item.id ? { ...a, status: 'cancelled' } : a
        ));
      }
    } catch (err: any) {
      console.error("Error al salir de la actividad:", err);
      setError(err.message || "No se pudo completar la acción.");
    } finally {
      setLoading(false);
    }
  };

  // --- HELPERS (Sin cambios) ---
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case 'pending_payment': return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800">Completada</Badge>;
      case 'cancelled': return <Badge variant="destructive">Cancelada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Fecha no disponible';
    return timestamp.toDate().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };
  
  const formatMatchTime = (date: Timestamp, time: string) => {
      if (!date) return time || 'Hora no disp.';
      const dateStr = formatDate(date);
      if (!time) return dateStr;
      return `${dateStr} - ${time}`;
  }

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      
      <AppHeader 
        title="Mis Actividades" 
        showBackButton 
        onBack={onBack} 
        rightContent={
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-white">
            <LogOut size={20} />
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* --- BARRA DE FILTROS (DISEÑO MEJORADO) --- */}
        <div className="bg-white/10 p-3 rounded-lg border border-white/20 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre de cancha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-md border border-white/30 bg-white/10 focus:outline-none focus:border-white/50 w-full text-sm placeholder-gray-300 text-white"
            />
          </div>
          
          {/* --- FILTROS MEJORADOS (BLANCOS) --- */}
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="appearance-none w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-[#00a884] text-sm"
              >
                <option value="">Todos los deportes</option>
                <option value="football">Fútbol</option>
                <option value="basketball">Básquetball</option>
                <option value="tennis">Tenis</option>
                <option value="volleyball">Vóleibol</option>
                <option value="padel">Pádel</option>
                <option value="futsal">Futsal</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
            
            <div className="relative">
              <select
                value={communeFilter}
                onChange={(e) => setCommuneFilter(e.target.value)}
                className="appearance-none w-full py-2 px-3 rounded-md border border-gray-300 bg-white text-gray-900 focus:outline-none focus:border-[#00a884] text-sm"
              >
                <option value="">Todas las comunas</option>
                <option value="Providencia">Providencia</option>
                <option value="Santiago">Santiago</option>
                <option value="Las Condes">Las Condes</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* --- ESTADOS DE CARGA Y VACÍO (Sin cambios) --- */}
        {loading && <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-white" size={32} /></div>}
        {error && <p className="text-red-200 text-center p-4 bg-red-500/20 rounded-md">{error}</p>}
        {!loading && !error && activities.length === 0 && (
          <div className="text-center pt-20 text-gray-300">
            <Inbox size={48} className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">
              {masterList.length > 0 ? 'Sin resultados' : 'No tienes actividades'}
            </h3>
            <p className="text-sm px-4">
              {masterList.length > 0 ? 'Prueba con otros filtros.' : 'Cuando reserves una cancha o te unas a un partido, aparecerá aquí.'}
            </p>
          </div>
        )}

        {/* --- LISTA DE ACTIVIDADES (DISEÑO DE GRID CORREGIDO) --- */}
        {!loading && activities.map((item) => {
          
          // --- TARJETA PARA RESERVA DIRECTA ---
          if (item.type === 'booking') {
            const isCancelled = item.status === 'cancelled';
            return (
              <Card 
                key={item.id} 
                className="bg-white text-gray-900"
                onClick={() => !isCancelled && onNavigate('booking-detail', { bookingId: item.id })}
              >
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg text-[#172c44]">{item.courtName}</CardTitle>
                  {getStatusBadge(item.status)}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mt-2">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-500" /><span>{formatDate(item.date)}</span></div>
                    <div className="flex items-center gap-2"><Clock size={14} className="text-gray-500" /><span>{item.startTime} - {item.endTime}</span></div>
                    <div className="flex items-center gap-2"><DollarSign size={14} className="text-gray-500" /><span>${(item.price || 0).toLocaleString()}</span></div>
                    <div className="flex items-center gap-2"><Shield size={14} className="text-gray-500" /><span>Reserva Directa</span></div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      disabled={isCancelled}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveActivity(item);
                      }}
                    >
                      <X size={16} className="mr-2" />
                      {isCancelled ? 'Cancelada' : 'Cancelar Reserva'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }
          
          // --- TARJETA PARA PARTIDO AL QUE SE UNIÓ (DISEÑO DE GRID CORREGIDO) ---
          if (item.type === 'match') {
            return (
              <Card 
                key={item.id} 
                className="bg-white border-l-4 border-l-[#f4b400] text-gray-900"
                onClick={() => onNavigate('match-detail', item)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-[#172c44]">{item.courtName}</CardTitle>
                  <p className="text-sm text-gray-700 flex items-center gap-1">
                    <MapPin size={12} className="text-gray-500" />
                    {item.location?.address || 'Ubicación no especificada'}
                  </p>
                </CardHeader>
                <CardContent>
                  {/* --- ESTE ES EL GRID DE 2 COLUMNAS QUE ARREGLA TU DISEÑO --- */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700 mt-2">
                    <div className="flex items-center gap-2 col-span-2"><Calendar size={14} className="text-gray-500" /><span>{formatMatchTime(item.date, item.time)}</span></div>
                    <div className="flex items-center gap-2"><Users size={14} className="text-gray-500" /><span>{item.currentPlayers}/{item.maxPlayers} Jugadores</span></div>
                    <div className="flex items-center gap-2"><DollarSign size={14} className="text-gray-500" /><span>${(item.pricePerPlayer || 0).toLocaleString()} c/u</span></div>
                    <div className="flex items-center gap-2 col-span-2"><Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{item.sport}</Badge></div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLeaveActivity(item);
                      }}
                    >
                      <X size={16} className="mr-2" />
                      Salir del Partido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
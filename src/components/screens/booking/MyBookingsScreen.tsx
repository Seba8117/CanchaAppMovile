import { useState, useEffect } from 'react';
import { Calendar, Clock, DollarSign, Loader2, AlertTriangle, Inbox, Search, Filter, Users, Shield } from 'lucide-react';
import { AppHeader } from '../../common/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { getBookingsForPlayer } from '../../../services/bookingService';
import { auth } from '../../../Firebase/firebaseConfig';
import { DocumentData, Timestamp } from 'firebase/firestore';
import { Button } from '../../ui/button';
import { getMatchesForPlayer } from '../../../services/matchService';

interface MyBookingsScreenProps {
  onBack: () => void;
}

export function MyBookingsScreen({ onBack }: MyBookingsScreenProps) {
  const [bookings, setBookings] = useState<DocumentData[]>([]);
  const [activities, setActivities] = useState<DocumentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('');
  const [communeFilter, setCommuneFilter] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Debes iniciar sesión para ver tus reservas.");
        setLoading(false);
        return;
      }

      try {
        // Obtenemos ambas listas en paralelo
        const [userBookings, userMatches] = await Promise.all([
          getBookingsForPlayer(currentUser.uid),
          getMatchesForPlayer(currentUser.uid)
        ]);

        // Mapeamos las reservas y partidos a un formato común
        const formattedBookings = userBookings.map(b => ({ ...b, type: 'booking' }));
        const formattedMatches = userMatches.map(m => ({ ...m, type: 'match' }));

        // Combinamos y ordenamos por fecha
        const allActivities = [...formattedBookings, ...formattedMatches].sort((a, b) => {
          const dateA = a.date.toMillis();
          const dateB = b.date.toMillis();
          return dateB - dateA; // Orden descendente (más nuevo primero)
        });

        setActivities(allActivities);
        setBookings(allActivities); // Mantenemos el estado original para filtros

      } catch (err: any) {
        console.error("Error fetching activities:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    let result = bookings;

    if (searchQuery) {
      result = result.filter(booking =>
        booking.courtName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sportFilter) {
      // Asume que el objeto booking tiene un campo 'sport'
      result = result.filter(booking => booking.sport === sportFilter);
    }

    if (communeFilter) {
      // Asume que el objeto booking tiene un campo 'commune'
      result = result.filter(booking => booking.commune === communeFilter);
    }
    setActivities(result);
  }, [searchQuery, sportFilter, communeFilter, bookings]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case 'pending_payment':
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completada</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString('es-ES', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20 text-white">
      <AppHeader title="Mis Reservas" showBackButton onBack={onBack} />

      <div className="p-4 space-y-4">
        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white/10 p-3 rounded-lg border border-white/20 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={16} />
            <input
              type="text"
              placeholder="Buscar por nombre de cancha..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-md border border-white/30 bg-white/10 focus:outline-none focus:border-white/50 w-full text-sm placeholder-gray-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="form-select py-2 px-3 rounded-md border border-white/30 bg-[#172c44] focus:outline-none focus:border-white/50 text-sm"
            >
              <option value="">Todos los deportes</option>
              <option value="football">Fútbol</option>
              <option value="basketball">Básquetball</option>
              <option value="tennis">Tenis</option>
              <option value="volleyball">Vóleibol</option>
              <option value="padel">Pádel</option>
              <option value="futsal">Futsal</option>
            </select>
            <select
              value={communeFilter}
              onChange={(e) => setCommuneFilter(e.target.value)}
              className="form-select py-2 px-3 rounded-md border border-white/30 bg-[#172c44] focus:outline-none focus:border-white/50 text-sm"
            >
              <option value="">Todas las comunas</option>
              <option value="Providencia">Providencia</option>
              <option value="Santiago">Santiago</option>
              <option value="Las Condes">Las Condes</option>
            </select>
          </div>
        </div>

        {loading && <div className="flex justify-center pt-10"><Loader2 className="animate-spin text-white" size={32} /></div>}
        {error && <p className="text-red-200 text-center p-4 bg-red-500/20 rounded-md">{error}</p>}

        {!loading && !error && activities.length === 0 && (
          <div className="text-center pt-20 text-gray-300">
            <Inbox size={48} className="mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white">{bookings.length > 0 ? 'Sin resultados' : 'No tienes reservas'}</h3>
            <p>{bookings.length > 0 ? 'Prueba con otros filtros.' : 'Cuando reserves una cancha, aparecerá aquí.'}</p>
          </div>
        )}

        {!loading && activities.map((item) => {
          if (item.type === 'booking') {
            return (
              <Card key={item.id} className="bg-white/10 border-white/20 text-white">
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">{item.courtName}</CardTitle>
                  {getStatusBadge(item.status)}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-200 mt-2">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-white/80" /><span>{formatDate(item.date)}</span></div>
                    <div className="flex items-center gap-2"><Clock size={14} /><span>{item.startTime} - {item.endTime}</span></div>
                    <div className="flex items-center gap-2"><DollarSign size={14} /><span>${item.price.toLocaleString()}</span></div>
                    <div className="flex items-center gap-2"><Shield size={14} /><span>Reserva Directa</span></div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          if (item.type === 'match') {
            return (
              <Card key={item.id} className="bg-white/10 border-l-4 border-l-[#f4b400] text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{item.courtName}</CardTitle>
                  <p className="text-sm text-gray-300">{item.location?.address}</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-200 mt-2">
                    <div className="flex items-center gap-2"><Calendar size={14} className="text-white/80" /><span>{formatDate(item.date)} - {item.time}</span></div>
                    <div className="flex items-center gap-2"><Users size={14} /><span>{item.currentPlayers}/{item.maxPlayers} Jugadores</span></div>
                    <div className="flex items-center gap-2"><DollarSign size={14} /><span>${item.pricePerPlayer.toLocaleString()} c/u</span></div>
                    <div className="flex items-center gap-2"><Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{item.sport}</Badge></div>
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
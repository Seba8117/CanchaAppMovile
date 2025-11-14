import { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, MapPin, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { AppHeader } from '../../common/AppHeader';
import { OwnerNavigation } from '../../navigation/OwnerNavigation';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

interface TournamentsScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string, data?: any) => void;
  userType?: 'player' | 'owner';
}

export function TournamentsScreen({ onBack, onNavigate, userType = 'player' }: TournamentsScreenProps) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUser = auth.currentUser;
        let q;

        if (userType === 'owner') {
          if (!currentUser) throw new Error("Debes iniciar sesión como dueño para ver tus torneos.");
          q = query(collection(db, "tournaments"), where("ownerId", "==", currentUser.uid));
        } else {
          // Simplificamos la consulta para evitar la necesidad de un índice compuesto.
          q = query(collection(db, "tournaments"));
        }

        const querySnapshot = await getDocs(q);
        const tournamentsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Si es un jugador, filtramos los resultados en el cliente.
        if (userType === 'player') {
          const availableTournaments = tournamentsData.filter(t => t.status === 'registration' || t.status === 'Próximamente');
          setTournaments(availableTournaments);
        } else {
          setTournaments(tournamentsData);
        }
      } catch (err: any) {
        console.error("Error fetching tournaments:", err);
        setError("No se pudieron cargar los torneos.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournaments();
  }, [userType]);

  const getSportEmoji = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'futbol': return '⚽';
      case 'basquet': return '🏀';
      case 'tenis': return '🎾';
      case 'padel': return '🏓';
      case 'volley': return '🏐';
      default: return '🏆';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registration': return 'bg-green-100 text-green-700';
      case 'Próximamente': return 'bg-blue-100 text-blue-700';
      case 'active': return 'bg-yellow-100 text-yellow-700';
      case 'finalizado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registration': return 'Inscripciones abiertas';
      case 'active': return 'En curso';
      case 'finalizado': return 'Finalizado';
      default: return status;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatPrize = (prize: any) => {
    const numPrize = Number(prize);
    if (isNaN(numPrize)) return '$0';
    return `$${numPrize.toLocaleString('es-CL')}`;
  };

  return (
    <div className={`min-h-screen ${userType === 'owner' ? 'pb-24' : 'pb-20'} relative overflow-hidden ${
      userType === 'owner' 
        ? 'bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b]'
        : 'bg-gradient-to-br from-[#172c44] to-[#00a884]'
    }`}>
      {userType === 'owner' && (
        <>
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-[#00a884]/10"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#172c44]/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-gradient-to-tr from-[#00a884]/25 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#f4b400]/20 to-[#ffd54f]/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-tl from-[#172c44]/15 to-transparent rounded-full blur-2xl"></div>
          
          {/* Patrón de puntos */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-20 left-10 w-2 h-2 bg-[#172c44] rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-16 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1000"></div>
            <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-[#172c44] rounded-full animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-20 right-8 w-1 h-1 bg-[#00a884] rounded-full animate-pulse animation-delay-500"></div>
            <div className="absolute top-60 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1500"></div>
          </div>
        </>
      )}

      <div className={userType === 'owner' ? 'relative z-10' : ''}>
        <AppHeader 
          title={userType === 'owner' ? '🏆 Torneos' : 'Torneos'}
          showLogo={true}
          showBackButton={userType !== 'owner'}
          onBack={userType !== 'owner' ? onBack : undefined}
          titleClassName={userType === 'owner' ? "font-['Outfit'] font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent" : undefined}
          rightContent={
            userType === 'owner' ? (
              <Button 
                size="sm" 
                className="bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] border-none shadow-sm"
                onClick={() => onNavigate?.('create-tournament')}
              >
                + Torneo
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-[#172c44] border-[#172c44]">
                Filtros
              </Button>
            )
          }
        />

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className={userType === 'owner' ? 'text-[#172c44]' : 'text-white'}>
              {userType === 'owner' ? 'Mis Torneos' : 'Torneos Disponibles'}
            </h2>
            <span className={`text-sm ${userType === 'owner' ? 'text-[#172c44]/60' : 'text-white/80'}`}>{tournaments.length} torneos</span>
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-16">
              <Loader2 className={`animate-spin h-10 w-10 ${userType === 'owner' ? 'text-[#172c44]' : 'text-white'}`} />
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-16 bg-white/20 rounded-lg">
              <AlertTriangle className={`mx-auto h-10 w-10 mb-4 ${userType === 'owner' ? 'text-red-600' : 'text-red-300'}`} />
              <p className={`${userType === 'owner' ? 'text-red-700' : 'text-red-200'}`}>{error}</p>
            </div>
          )}

          {!isLoading && !error && tournaments.length === 0 && (
            <div className={`text-center py-16 ${userType === 'owner' ? 'bg-white/80' : 'bg-white/10'} rounded-lg`}>
              <Trophy className={`mx-auto h-12 w-12 mb-4 ${userType === 'owner' ? 'text-slate-400' : 'text-white/50'}`} />
              <p className={`font-semibold ${userType === 'owner' ? 'text-slate-700' : 'text-white'}`}>
                {userType === 'owner' ? 'Aún no has creado torneos' : 'No hay torneos disponibles'}
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className={`cursor-pointer transition-all ${
                userType === 'owner' 
                  ? 'border-2 border-gray-100 hover:border-[#f4b400] hover:shadow-sm bg-white' 
                  : 'hover:shadow-md'
              }`}>
                <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {getSportEmoji(tournament.sport)}
                    </div>
                    <div>
                      <h3 className="text-[#172c44] text-lg mb-1">{tournament.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{tournament.organizer}</p>
                      <Badge 
                        variant="secondary"
                        className={getStatusColor(tournament.status)}
                      >
                        {getStatusText(tournament.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#00a884] mb-1">{formatPrize(tournament.prize)}</div>
                    <div className="text-sm text-gray-600">Premio</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{tournament.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="text-[#172c44]" size={16} />
                    <span className="text-sm">{tournament.registeredTeams || 0}/{tournament.maxTeams} equipos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="text-[#172c44]" size={16} />
                    <span className="text-sm">{tournament.format}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-[#172c44]" size={16} />
                    <span className="text-sm">{formatDate(tournament.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="text-[#172c44]" size={16} />
                    <span className="text-sm">{tournament.courts?.join(', ') || 'Por definir'}</span>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="text-yellow-700" size={16} />
                    <span className="text-sm text-yellow-800">
                      <strong>Inscripciones hasta:</strong> {formatDate(tournament.registrationDeadline)}
                    </span>
                  </div>
                </div>

                {userType === 'owner' ? (
                  // Vista para dueños de canchas
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1 border-2 border-gray-200 text-[#172c44] hover:bg-gray-50"
                      onClick={() => onNavigate?.('tournament-management', tournament)}
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] shadow-sm"
                      onClick={() => onNavigate?.('tournament-management', tournament)}
                    >
                      Gestionar
                    </Button>
                  </div>
                ) : (
                  // Vista para jugadores
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => onNavigate?.('tournament-detail', tournament)}
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      className={`flex-1 ${
                        tournament.status === 'registration'
                          ? 'bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={tournament.status !== 'registration'}
                      onClick={() => onNavigate?.('tournament-detail', tournament)}
                    >
                      {tournament.status === 'registration' ? 'Inscribirse' : 'No disponible'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
          )}
        </div>
      </div>

      {userType === 'owner' && (
        <OwnerNavigation 
          activeTab="tournaments"
          onTabChange={(screen) => onNavigate?.(screen)}
        />
      )}
    </div>
  );
}

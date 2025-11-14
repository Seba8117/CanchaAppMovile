import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Star, Share2, Heart, Eye, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { toast } from 'sonner';
import { joinMatch } from '../../../services/matchService';

interface MatchDetailScreenProps {
  match: any;
  onBack: () => void;
  onNavigate?: (screen: string, data?: any) => void;
  userType?: 'player' | 'owner';
}

export function MatchDetailScreen({ match, onBack, onNavigate, userType }: MatchDetailScreenProps) {
  const [currentMatch, setCurrentMatch] = useState(match); // Estado local para el partido
  const [playerDetails, setPlayerDetails] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const currentUser = auth.currentUser;
  const isUserInMatch = currentUser && currentMatch.players?.includes(currentUser.uid);
  const isMatchFull = currentMatch.currentPlayers >= currentMatch.maxPlayers;

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      if (!currentMatch.players || currentMatch.players.length === 0) {
        setLoadingPlayers(false);
        return;
      }
      setLoadingPlayers(true);
      try {
        const playerPromises = currentMatch.players.map(async (playerId: string) => {
          const playerDocRef = doc(db, 'jugador', playerId);
          const playerDocSnap = await getDoc(playerDocRef);
          if (playerDocSnap.exists()) {
            return { id: playerId, ...playerDocSnap.data() };
          }
          return { id: playerId, name: 'Jugador Desconocido', rating: 0 };
        });
        const players = await Promise.all(playerPromises);
        setPlayerDetails(players);
      } catch (error) {
        console.error("Error fetching player details:", error);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayerDetails();
  }, [currentMatch.players]);

  const handleJoinMatch = async () => {
    if (!currentUser) {
      setJoinError("Debes iniciar sesión para unirte.");
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      await joinMatch(match.id, currentUser.uid, currentUser.displayName || 'Jugador Anónimo');

      // Obtener el nombre real del usuario desde Firestore
      const userDocRef = doc(db, 'jugador', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      let currentUserName = 'Jugador Anónimo';
      if (userDocSnap.exists()) {
        currentUserName = userDocSnap.data().name || 'Jugador Anónimo';
      }

      // Actualizar el estado local para reflejar el cambio inmediatamente
      const newPlayer = {
        id: currentUser.uid,
        name: currentUserName, // <-- CORRECCIÓN
        rating: 0, // O buscar el rating real si es necesario
      };
      
      setPlayerDetails(prevDetails => [...prevDetails, newPlayer]);
      setCurrentMatch((prevMatch: any) => ({
        ...prevMatch,
        players: [...prevMatch.players, currentUser.uid],
        currentPlayers: prevMatch.currentPlayers + 1,
      }));

      toast.success("¡Te has unido al partido!", {
        description: `Ahora eres parte del partido en "${currentMatch.courtName}".`,
      });

    } catch (error: any) {
      setJoinError(error.message || "No se pudo unir al partido.");
    } finally {
      setIsJoining(false);
    }
  };

  // Función para formatear fechas de Firestore
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // Buscar los detalles del capitán en la lista de jugadores cargada
  const captainDetails = playerDetails.find(p => p.id === currentMatch.captainId);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44]">Detalle del Partido</h1>
          <div className="flex gap-2">
            <button className="p-2">
              <Heart className="text-gray-400" size={20} />
            </button>
            <button className="p-2">
              <Share2 className="text-gray-400" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Match Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge className="bg-[#f4b400] text-[#172c44] mb-2">
                  {currentMatch.sport}
                </Badge>
                <h2 className="text-[#172c44] mb-1">{currentMatch.courtName || 'Cancha sin nombre'}</h2>
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                  <span className="text-sm text-gray-600">{currentMatch.rating || 'N/A'} • Cancha verificada</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl text-[#00a884] mb-1">${currentMatch.pricePerPlayer?.toLocaleString() || '0'}</p>
                <p className="text-sm text-gray-600">por jugador</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#172c44]" size={16} />
                <span className="text-sm">{formatDate(currentMatch.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-[#172c44]" size={16} />
                <span className="text-sm">{currentMatch.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-[#172c44]" size={16} />
                <span className="text-sm">{currentMatch.location?.address || 'Ubicación no disponible'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-[#172c44]" size={16} />
                <span className="text-sm">{currentMatch.currentPlayers || 0}/{currentMatch.maxPlayers || 0}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Partido de fútbol recreativo en una de las mejores canchas de la zona. 
                Césped sintético en excelente estado. Incluye vestuarios y estacionamiento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Captain Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] mb-3">Capitán del Equipo</h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-[#f4b400] text-[#172c44] font-bold">
                  {getInitials(captainDetails?.name || currentMatch.captainName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[#172c44]">{captainDetails?.name || currentMatch.captainName || 'Capitán sin nombre'}</p>
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                  <span className="text-sm text-gray-600">4.8 • 127 partidos</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-[#00a884] border-[#00a884]">
                Mensaje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#172c44]">Jugadores Confirmados</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[#00a884] text-white">
                  {currentMatch.currentPlayers || 0}/{currentMatch.maxPlayers || 0}
                </Badge>
                {userType === 'player' && onNavigate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('match-players', currentMatch)}
                    className="text-[#172c44] border-[#172c44] hover:bg-[#172c44] hover:text-white"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver Todos
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {loadingPlayers ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-500" /></div>
              ) : (
                playerDetails.map((player) => (
                  <div key={player.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-200 text-[#172c44] text-sm">
                        {getInitials(player.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-[#172c44]">{player.name}</p>
                      <p className="text-xs text-gray-600">{player.id === currentMatch.captainId ? 'Capitán' : 'Jugador'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                      <span className="text-xs text-gray-600">{player.rating || 'N/A'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] mb-3">Ubicación</h3>
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <p className="text-gray-500">Mapa de la cancha</p>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Av. Los Leones 1234, Providencia, Santiago
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Abrir en Google Maps
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 max-w-sm mx-auto">
        {joinError && <p className="text-red-500 text-center text-sm mb-2">{joinError}</p>}
        <Button 
          className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] h-12"
          onClick={handleJoinMatch}
          disabled={isJoining || isUserInMatch || isMatchFull}
        >
          {isJoining ? (
            <Loader2 className="animate-spin" />
          ) : isUserInMatch ? (
            'Ya estás en el partido'
          ) : isMatchFull ? (
            'Partido Lleno'
          ) : (
            `Unirse al Partido - $${currentMatch.pricePerPlayer?.toLocaleString() || '0'}`
          )}
        </Button>
      </div>
    </div>
  );
}

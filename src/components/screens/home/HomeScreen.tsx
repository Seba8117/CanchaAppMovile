import { useState, useEffect } from 'react';
// Íconos añadidos: Lightbulb y DocumentData de firestore
import { MapPin, Calendar, Users, Clock, Star, Plus, Loader2, AlertTriangle, MessageCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { getPersonalizedRecommendations, MatchRecommendation } from '../../../services/matchmakingService';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

// --- NUEVAS IMPORTACIONES DE FIREBASE ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment, DocumentData } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth'; // Tipo para el usuario

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const [recommendations, setRecommendations] = useState<MatchRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVOS ESTADOS ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null); // Para el loader del botón

  // --- useEffect MODIFICADO para cargar al usuario Y las recomendaciones ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        loadRecommendations(user.uid); // Cargar recomendaciones CON el ID real
      } else {
        // Si no hay usuario, no cargar nada
        setIsLoading(false);
        setError('Por favor, inicia sesión para ver tus recomendaciones.');
        setRecommendations([]);
      }
    });

    return () => unsubscribe(); // Limpiar el listener
  }, []);

  // --- loadRecommendations MODIFICADO para aceptar el userId ---
  const loadRecommendations = async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const matchRecommendations = await getPersonalizedRecommendations(userId, 3);
      setRecommendations(matchRecommendations);
    } catch (err) {
      console.error('Error loading recommendations:', err);
      setError('Error al cargar recomendaciones');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NUEVA FUNCIÓN: LÓGICA PARA UNIRSE AL PARTIDO ---
  // (Copiada de SearchScreen)
  const handleJoinMatch = async (match: DocumentData) => {
    if (!currentUser) {
      setError("Debes iniciar sesión para unirte.");
      return;
    }
    setJoiningMatchId(match.id);
    setError(null);
    try {
      const matchId = match.id;
      const matchRef = doc(db, "matches", matchId);
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) { throw new Error("Este partido ya no existe."); }
      const matchData = matchSnap.data();
      const ownerId = matchData.ownerId || matchData.captainId;
      const playersList: string[] = matchData.players || [];
      if (playersList.length >= matchData.maxPlayers) { throw new Error("¡Lo sentimos! El partido ya está lleno."); }
      if (playersList.includes(currentUser.uid)) { onNavigate('chat'); return; }
      await updateDoc(matchRef, {
        players: arrayUnion(currentUser.uid),
        currentPlayers: increment(1)
      });
      const chatRef = doc(db, "chats", matchId);
      const chatSnap = await getDoc(chatRef);
      const allParticipants = [ownerId, ...playersList, currentUser.uid];
      const uniqueParticipants = [...new Set(allParticipants.filter(Boolean))];
      if (chatSnap.exists()) {
        await updateDoc(chatRef, { participantsUids: uniqueParticipants });
      } else {
        await setDoc(chatRef, {
          id: matchId, name: `Partido - ${matchData.courtName || 'Chat de Partido'}`, type: 'match',
          participantsUids: uniqueParticipants, ownerId: ownerId,
          lastMessage: `${currentUser.displayName || 'Un nuevo jugador'} se ha unido al chat.`,
          lastMessageTimestamp: new Date(),
        });
      }
      onNavigate('chat');
    } catch (err: any) {
      console.error("Error al unirse al partido:", err);
      setError(err.message || "No se pudo unir al partido.");
    } finally {
      setJoiningMatchId(null);
    }
  };


  // --- FUNCIONES HELPER (Sin cambios) ---
  const formatDate = (date: any) => {
    if (!date) return 'Fecha no disponible';
    const matchDate = date.toDate ? date.toDate() : new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (matchDate.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (matchDate.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return matchDate.toLocaleDateString('es-ES', { 
        weekday: 'long', day: 'numeric', month: 'short'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  return (
    <div className="p-4 pb-32 bg-gradient-to-br from-[#172c44] to-[#00a884] min-h-screen">
      {/* --- HEADER (Personalizado con nombre de usuario) --- */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img 
            src={logoIcon} 
            alt="CanchApp" 
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="text-white mb-1 font-bold text-2xl">¡Hola, {currentUser?.displayName || 'Usuario'}!</h1>
            <p className="text-white font-semibold">Encuentra partidos cerca de ti</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('notifications')}
          className="p-2 bg-white rounded-full shadow-sm"
        >
          <div className="relative">
            <div className="w-2 h-2 bg-[#f4b400] rounded-full absolute -top-1 -right-1"></div>
            <svg className="w-5 h-5 text-[#172c44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5L19 11V7a7 7 0 00-14 0v4l2.5 2.5L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </button>
      </div>

      {/* Ubicación (Sin cambios) */}
      <div className="mb-6">
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <MapPin className="text-[#00a884]" size={20} />
          <span className="text-gray-700">Santiago Centro, Chile</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="ml-auto text-[#f4b400]"
          >
            Cambiar
          </Button>
        </div>
      </div>

      {/* Título "Partidos Recomendados" (Sin cambios) */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white">Partidos Recomendados</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onNavigate('available-matches')}
          className="text-white hover:text-white/90"
        >
          Ver todos
        </Button>
      </div>

      {/* --- ESTADOS DE CARGA Y VACÍO (Sin cambios) --- */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="animate-spin text-white" size={32} />
        </div>
      ) : error ? (
        <Card className="p-4 mb-4 bg-white text-gray-900">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        </Card>
      ) : recommendations.length === 0 ? (
        <Card className="p-4 mb-4 bg-white text-gray-900">
          <div className="text-center text-gray-600">
            <p>No hay partidos recomendados disponibles</p>
            <Button 
              variant="outline" 
              className="mt-2"
              onClick={() => onNavigate('available-matches')}
            >
              Explorar partidos disponibles
            </Button>
          </div>
        </Card>
      ) : (
        // --- LISTA DE RECOMENDACIONES (DISEÑO DE TARJETA MEJORADO) ---
        <div className="space-y-4">
          {recommendations.map((recommendation) => {
            const match = recommendation.match;
            const isFull = (match.currentPlayers || 0) >= (match.maxPlayers || 0);
            const isJoined = match.players?.includes(currentUser?.uid);
            const isJoining = joiningMatchId === match.id;
            const availableSlots = Math.max(0, (match.maxPlayers || 0) - (match.currentPlayers || 0));

            return (
              // --- INICIO DE LA NUEVA TARJETA ---
              <Card 
                key={recommendation.matchId} 
                className="bg-white text-gray-900 cursor-pointer hover:bg-gray-50"
                onClick={() => onNavigate('match-detail', match)}
              >
                <CardContent className="p-4 space-y-3">
                  
                  {/* Row 1: Badge, Rating, Price */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">
                        {match.sport}
                      </Badge>
                      <div className="flex items-center gap-1 text-gray-700">
                        <Star className="text-[#f4b400]" size={16} fill="currentColor" />
                        {/* Usamos el score de la recomendación */}
                        <span className="font-semibold">{recommendation.score}/100</span>
                      </div>
                    </div>
                    <span className="text-xl font-bold text-[#00a884]">
                      {formatPrice(match.pricePerPlayer)}
                    </span>
                  </div>

                  {/* Row 2: Title */}
                  <h3 className="text-lg font-bold text-[#172c44]">
                    {match.courtName || 'Partido sin nombre'}
                  </h3>

                  {/* Rows 3 & 4: Details Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-gray-500 mt-0.5" />
                      <span>{match.location?.address || 'Ubicación no especificada'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-500" />
                      <span>{formatDate(match.date)}</span>
                      <Clock size={14} className="text-gray-500" />
                      <span>{match.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-gray-500" />
                      <span>{match.currentPlayers || 0}/{match.maxPlayers || 0} jugadores</span>
                    </div>
                    {availableSlots > 0 && (
                      <div className="flex items-center gap-2 text-yellow-600 font-semibold">
                        <span>
                          {availableSlots} cupo{availableSlots > 1 ? 's' : ''} disponible{availableSlots > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Row 5: Razón de la recomendación */}
                  {recommendation.reasons.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 pt-1">
                      <Lightbulb size={14} className="text-yellow-500" />
                      <span>{recommendation.reasons[0]}</span>
                    </div>
                  )}

                  {/* Row 6: Botón de Unirse */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      className={isJoined ? "bg-gray-500 hover:bg-gray-600" : "bg-[#00a884] hover:bg-[#00a884]/90"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isJoined) {
                          onNavigate('chat');
                        } else {
                          handleJoinMatch(match);
                        }
                      }}
                      disabled={isJoining || (isFull && !isJoined)}
                    >
                      {isJoining ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : isJoined ? (
                        <><MessageCircle size={16} className="mr-2" />Ir al Chat</>
                      ) : isFull ? (
                        'Lleno'
                      ) : (
                        'Unirse'
                      )}
                    </Button>
                  </div>
                  
                </CardContent>
              </Card>
              // --- FIN DE LA NUEVA TARJETA ---
            );
          })}
        </div>
      )}

      {/* Accesos Rápidos (Sin cambios) */}
      <div className="mt-8">
        <h2 className="text-white mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* ... (todos tus botones de accesos rápidos van aquí sin cambios) ... */}
          <Button
            className="h-16 flex-col gap-2 bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            onClick={() => onNavigate('create')}
          >
            <Plus size={20} />
            Crear Partido
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#93c5fd] text-[#93c5fd] hover:bg-[#93c5fd] hover:text-white"
            onClick={() => onNavigate('chat')}
          >
            <MessageCircle size={20} />
            Chats
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#f4b400] text-[#f4b400] hover:bg-[#f4b400] hover:text-[#172c44]"
            onClick={() => onNavigate('joined-matches')}
          >
            <Users size={20} />
            Mis Partidos
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#f4b400] text-[#f4b400] hover:bg-[#f4b400] hover:text-[#172c44]"
            onClick={() => onNavigate('tournaments')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
              Torneos
            </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-purple-700 text-purple-700 hover:bg-purple-700 hover:text-white"
            onClick={() => onNavigate('my-teams')}
          >
            <Users size={20} />
            Mis Equipos
          </Button>
          <Button variant="outline" 
          className="h-16 flex-col gap-2 border-[#93c5fd] text-[#93c5fd] hover:bg-[#93c5fd] hover:text-white" 
          onClick={() => onNavigate('my-bookings')}>
            <Calendar size={20} />
            Mis Reservas
          </Button>
        </div>
      </div>
    </div>
  );
}
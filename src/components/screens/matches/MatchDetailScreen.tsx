import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Star, Share2, Heart, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';

// Importaciones de Firebase para datos y acciones
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment, DocumentData } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

interface MatchDetailScreenProps {
  match: DocumentData; // Usamos DocumentData en lugar de 'any'
  onBack: () => void;
  onNavigate?: (screen: string, data?: any) => void;
}

// --- Helpers de Formato (copiados de tus otras pantallas) ---

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

export function MatchDetailScreen({ match, onBack, onNavigate }: MatchDetailScreenProps) {
  // Estado para la lógica de "Unirse"
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estado para cargar los datos del capitán
  const [captainData, setCaptainData] = useState<DocumentData | null>(null);
  const [isLoadingCaptain, setIsLoadingCaptain] = useState(true);

  // Efecto para cargar el capitán y escuchar al usuario
  useEffect(() => {
    const fetchCaptain = async () => {
      // Usamos 'ownerId' o 'captainId' del partido
      const captainId = match.ownerId || match.captainId;
      if (captainId) {
        setIsLoadingCaptain(true);
        try {
          // Asumimos que los perfiles de jugador están en la colección 'jugador'
          const userRef = doc(db, 'jugador', captainId); 
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setCaptainData(userSnap.data());
          }
        } catch (err) {
          console.error("Error fetching captain:", err);
        } finally {
          setIsLoadingCaptain(false);
        }
      } else {
        setIsLoadingCaptain(false);
      }
    };

    fetchCaptain();

    const unsub = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => unsub();
  }, [match.ownerId, match.captainId]);

  // Lógica para unirse al partido
  const handleJoinMatch = async () => {
    if (!currentUser) {
      setError("Debes iniciar sesión para unirte.");
      return;
    }
    setIsJoining(true);
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
      if (playersList.includes(currentUser.uid)) { onNavigate?.('chat'); return; }
      
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
          lastMessage: `${currentUser?.displayName || 'Un nuevo jugador'} se ha unido al chat.`,
          lastMessageTimestamp: new Date(),
        });
      }
      onNavigate?.('chat');
    } catch (err: any) {
      console.error("Error al unirse al partido:", err);
      setError(err.message || "No se pudo unir al partido.");
    } finally {
      setIsJoining(false);
    }
  };

  // Variables de estado del partido
  const currentPlayers = match.currentPlayers || 0;
  const maxPlayers = match.maxPlayers || 0;
  const isFull = currentPlayers >= maxPlayers;
  const isJoined = match.players?.includes(currentUser?.uid);
  const captainName = captainData?.displayName || 'Capitán';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44] font-semibold">Detalle del Partido</h1>
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
                  {match.sport}
                </Badge>
                {/* --- AQUÍ ESTÁ EL ARREGLO --- */}
                <h2 className="text-xl font-bold text-[#172c44] mb-1">{match.courtName}</h2>
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                  <span className="text-sm text-gray-600">{match.rating || 0} • Cancha verificada</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-[#00a884] mb-1">{formatPrice(match.pricePerPlayer)}</p>
                <p className="text-sm text-gray-600">por jugador</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#172c44]" size={16} />
                <span className="text-sm">{formatDate(match.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-[#172c44]" size={16} />
                <span className="text-sm">{match.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-[#172c44]" size={16} />
                {/* --- AQUÍ ESTÁ EL ARREGLO --- */}
                <span className="text-sm">{match.location?.address || 'Ubicación no especificada'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-[#172c44]" size={16} />
                <span className="text-sm">{currentPlayers}/{maxPlayers}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {match.description || 'Partido amistoso. ¡Únete y juega!'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Captain Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] font-semibold mb-3">Capitán del Partido</h3>
            {isLoadingCaptain ? (
              <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
            ) : captainData ? (
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                    {captainName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-[#172c44]">{captainName}</p>
                  <div className="flex items-center gap-1">
                    <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                    <span className="text-sm text-gray-600">{captainData.rating || 0} • {captainData.matchesPlayed || 0} partidos</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-[#00a884] border-[#00a884]">
                  Mensaje
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No se pudo cargar la información del capitán.</p>
            )}
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#172c44] font-semibold">Jugadores Confirmados</h3>
              <Badge variant="secondary" className="bg-[#00a884] text-white">
                {currentPlayers}/{maxPlayers}
              </Badge>
            </div>
            {/* Reemplazamos la lista mock por un resumen */}
            <div className="text-center text-gray-600 space-y-3">
              <p className="text-sm">La lista completa de jugadores es visible en el chat del partido.</p>
              {onNavigate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onNavigate('chat')}
                  className="text-[#172c44] border-[#172c44] hover:bg-[#172c44] hover:text-white"
                >
                  Ir al Chat del Partido
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] font-semibold mb-3">Ubicación</h3>
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <p className="text-gray-500">Mapa de la cancha</p>
            </div>
            {/* --- AQUÍ ESTÁ EL ARREGLO --- */}
            <p className="text-sm text-gray-700 mb-2">
              {match.location?.address || 'Dirección no disponible'}
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Abrir en Google Maps
            </Button>
          </CardContent>
        </Card>

        {/* Mensaje de error, si existe */}
        {error && <p className="text-center text-red-300">{error}</p>}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button 
          className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white h-12"
          disabled={isJoining || (isFull && !isJoined)}
          onClick={handleJoinMatch}
        >
          {isJoining ? (
            <Loader2 size={20} className="animate-spin" />
          ) : isJoined ? (
            <><MessageCircle size={20} className="mr-2" />Ir al Chat</>
          ) : isFull ? (
            'Partido Lleno'
          ) : (
            `Unirse al Partido - ${formatPrice(match.pricePerPlayer)}`
          )}
        </Button>
      </div>
    </div>
  );
}
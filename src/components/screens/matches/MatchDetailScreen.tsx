import { ArrowLeft, MapPin, Calendar, Clock, Users, Star, Share2, Heart, Eye, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { useEffect, useState } from 'react';
import { getMatchById } from '../../../services/matchService';
import { getUserLocationCached, haversineKm, mapsUrlFor } from '../../../services/locationService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp, arrayUnion, increment } from 'firebase/firestore';
import { startMatchCheckout, checkPaymentStatus } from '../../../services/paymentService';

interface MatchDetailScreenProps {
  match: any;
  onBack: () => void;
  onNavigate?: (screen: string, data?: any) => void;
  userType?: 'player' | 'owner';
}

export function MatchDetailScreen({ match, onBack, onNavigate, userType }: MatchDetailScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(match || null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastClickTs, setLastClickTs] = useState<number>(0);
  const [joining, setJoining] = useState<boolean>(false);
  const [captainDisplayName, setCaptainDisplayName] = useState<string | null>(null);
  const [starting, setStarting] = useState<boolean>(false);
  const [paymentStatusLocal, setPaymentStatusLocal] = useState<string | null>(null);

  useEffect(() => {
    const mustFetch = !!match?.id && (!match?.courtName || !match?.players);
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const fresh = await getMatchById(match.id);
        setData(fresh || match);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el partido.');
      } finally {
        setLoading(false);
      }
    };
    if (mustFetch) fetchData();
    else setData(match);
  }, [match?.id]);

  useEffect(() => {
    const getLoc = async () => {
      const loc = await getUserLocationCached();
      setUserLocation(loc);
    };
    getLoc();
  }, []);

  useEffect(() => {
    const loadCaptain = async () => {
      try {
        const capId = data?.captainId || data?.ownerId;
        if (!capId) return;
        const ref = doc(db, 'users', capId);
        const snap = await getDoc(ref);
        const name = snap.exists() ? (snap.data() as any)?.displayName : null;
        setCaptainDisplayName(name || data?.captainName || null);
      } catch {}
    };
    loadCaptain();
  }, [data?.captainId, data?.ownerId, data?.captainName]);

  const handleViewAllClick = () => {
    const now = Date.now();
    if (now - lastClickTs < 600) return;
    setLastClickTs(now);
    if (onNavigate) onNavigate('match-players', data);
  };

  const toDate = (d: any) => {
    try {
      if (!d) return null;
      if (typeof d?.toDate === 'function') return d.toDate();
      if (typeof d?.toMillis === 'function') return new Date(d.toMillis());
      if (typeof d === 'string') return new Date(d);
      if (d instanceof Date) return d;
      return null;
    } catch { return null; }
  };
  const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
  const locationText = (loc: any) => {
    if (!loc) return 'Ubicación no especificada';
    if (typeof loc === 'string') return loc;
    if (typeof loc?.address === 'string') return loc.address;
    return 'Ubicación no especificada';
  };
  const playersArray: string[] = Array.isArray(data?.players) ? data.players : [];
  const currentPlayers = Number(data?.currentPlayers || playersArray.length || 0);
  const maxPlayers = Number(data?.maxPlayers || 0);
  const matchDate = toDate(data?.date);
  const teamIncluded = !!data?.teamId && !!data?.teamName;
  const pricePerPlayer = Number(data?.pricePerPlayer || data?.price || 0);
  const matchId = String(data?.id || match?.id || '');
  const ownerId = String(data?.ownerId || data?.captainId || '');
  const isJoined = !!playersArray.find((uid) => uid === auth?.currentUser?.uid);
  const isOwner = (auth?.currentUser?.uid && ownerId) ? auth.currentUser.uid === ownerId : false;
  const totalCost = Number((data?.totalCost as any) || pricePerPlayer * (maxPlayers || 0) || 0);

  const handleGoToChat = async () => {
    try {
      const uid = auth?.currentUser?.uid;
      if (!uid) { setError('Debes iniciar sesión para ver el chat.'); return; }
      if (!matchId) { setError('No se encontró el ID del partido.'); return; }
      const chatRef = doc(db, 'chats', matchId);
      const chatSnap = await getDoc(chatRef);
      const allParticipants = Array.from(new Set([ownerId, ...playersArray].filter(Boolean)));
      if (chatSnap.exists()) {
        await updateDoc(chatRef, { participantsUids: allParticipants });
      } else {
        await setDoc(chatRef, {
          id: matchId,
          name: `Partido - ${data?.courtName || 'Chat de Partido'}`,
          type: 'match',
          participantsUids: allParticipants,
          ownerId: ownerId,
          lastMessage: 'Chat creado automáticamente',
          lastMessageTimestamp: serverTimestamp(),
        });
      }
      onNavigate && onNavigate('chat');
    } catch (e) {
      setError('No se pudo abrir el chat del partido.');
    }
  };

  const handleStartMatch = async () => {
    try {
      const uid = auth?.currentUser?.uid;
      if (!uid || !isOwner) { setError('Solo el organizador puede iniciar el partido.'); return; }
      if (!matchId) { setError('No se encontró el ID del partido.'); return; }
      setStarting(true);
      const statusField = String(data?.paymentStatus || paymentStatusLocal || 'pending');
      if (statusField !== 'approved') {
        try {
          const chk = await checkPaymentStatus(matchId);
          setPaymentStatusLocal(chk.status);
          if (chk.status !== 'approved') {
            await startMatchCheckout({ matchId, title: `Pago de partido`, price: totalCost, payerEmail: auth?.currentUser?.email || null });
            setStarting(false);
            return;
          }
        } catch {
          await startMatchCheckout({ matchId, title: `Pago de partido`, price: totalCost, payerEmail: auth?.currentUser?.email || null });
          setStarting(false);
          return;
        }
      }
      await updateDoc(doc(db, 'matches', matchId), { status: 'active', paymentStatus: 'approved' });
      try {
        const paymentsRef = collection(db, 'payments');
        await addDoc(paymentsRef, {
          matchId,
          userId: ownerId,
          status: 'approved',
          amount: totalCost,
          createdAt: serverTimestamp(),
        });
      } catch {}
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: ownerId,
          type: 'payment',
          title: 'Pago confirmado',
          message: 'Puedes iniciar el partido. Pago aprobado.',
          data: { matchId },
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch {}
      setStarting(false);
      onNavigate && onNavigate('match-players', data);
    } catch (e: any) {
      setStarting(false);
      setError(e?.message || 'No se pudo iniciar el partido.');
    }
  };

  const handleJoinMatch = async () => {
    try {
      const uid = auth?.currentUser?.uid;
      if (!uid) { setError('Debes iniciar sesión para unirte.'); return; }
      if (!matchId) { setError('No se encontró el ID del partido.'); return; }
      setJoining(true);
      const matchRef = doc(db, 'matches', matchId);
      const snap = await getDoc(matchRef);
      if (!snap.exists()) { throw new Error('Este partido ya no existe.'); }
      const m = snap.data() as any;
      const playersList: string[] = m.players || [];
      if ((playersList.length || 0) >= (m.maxPlayers || maxPlayers)) { throw new Error('¡Lo sentimos! El partido ya está lleno.'); }
      if (playersList.includes(uid)) { handleGoToChat(); setJoining(false); return; }
      await updateDoc(matchRef, { players: arrayUnion(uid), currentPlayers: increment(1) });
      const chatRef = doc(db, 'chats', matchId);
      const chatSnap = await getDoc(chatRef);
      const allParticipants = Array.from(new Set([ownerId, ...playersList, uid].filter(Boolean)));
      if (chatSnap.exists()) {
        await updateDoc(chatRef, { participantsUids: allParticipants });
      } else {
        await setDoc(chatRef, {
          id: matchId,
          name: `Partido - ${m.courtName || 'Chat de Partido'}`,
          type: 'match',
          participantsUids: allParticipants,
          ownerId: ownerId,
          lastMessage: `${auth?.currentUser?.displayName || 'Un jugador'} se ha unido al chat.`,
          lastMessageTimestamp: serverTimestamp(),
        });
      }
      try {
        const creatorId = ownerId;
        if (creatorId) {
          await addDoc(collection(db, 'notifications'), {
            userId: creatorId,
            type: 'match-join',
            title: 'Nuevo jugador se unió',
            message: `${auth?.currentUser?.displayName || 'Jugador'} se unió a tu partido en ${m.courtName || m.location?.name || 'Cancha'}`,
            data: { matchId },
            createdAt: serverTimestamp(),
            read: false,
          });
        }
      } catch {}
      setJoining(false);
      onNavigate && onNavigate('chat');
    } catch (err: any) {
      setJoining(false);
      setError(err?.message || 'No se pudo unir al partido.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow">
            <Loader2 className="h-8 w-8 animate-spin text-[#172c44] mx-auto mb-2" />
            <p className="text-[#172c44] font-semibold">Cargando partido...</p>
          </div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-red-700 font-semibold">{error}</p>
            <Button variant="outline" className="mt-3" onClick={onBack}>Volver</Button>
          </div>
        </div>
      )}
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
                <Badge className="bg-[#f4b400] text-[#172c44] mb-2">{String(data?.sport || 'Deporte')}</Badge>
                <h2 className="text-[#172c44] mb-1">{locationText(data?.location)}</h2>
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                  <span className="text-sm text-gray-600">{String(data?.rating || 'N/A')} • Cancha verificada</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl text-[#00a884] mb-1">{formatCLP(pricePerPlayer)}</p>
                <p className="text-sm text-gray-600">por jugador</p>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#172c44]" size={16} />
                <span className="text-sm">{matchDate ? matchDate.toLocaleDateString() : 'Fecha no definida'}</span>
          </div>
          {isOwner && (
            <div className="mt-3">
              <Button className="w-full bg-[#00a884] hover:bg-[#008f73] text-white" onClick={handleStartMatch} disabled={starting}>
                {starting ? 'Verificando pago…' : (String(data?.paymentStatus || paymentStatusLocal) === 'approved' ? 'Iniciar Partido' : 'Pagar e Iniciar')}
              </Button>
              <p className="text-xs text-gray-600 mt-2">Estado de pago: {String(data?.paymentStatus || paymentStatusLocal || 'pending')}</p>
            </div>
          )}
              <div className="flex items-center gap-2">
                <Clock className="text-[#172c44]" size={16} />
                <span className="text-sm">{String(data?.time || 'Hora no definida')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-[#172c44]" size={16} />
                <span className="text-sm">{String(data?.courtName || 'Cancha')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-[#172c44]" size={16} />
                <span className="text-sm">{currentPlayers}/{maxPlayers || 'N/A'}</span>
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
                <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                  {String(captainDisplayName || data?.captainName || 'CA').substring(0,2).toUpperCase()}
                </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                <p className="text-[#172c44]">{String(captainDisplayName || data?.captainName || 'Capitán Anónimo')}</p>
                  <div className="flex items-center gap-1">
                    <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                    <span className="text-sm text-gray-600">4.8 • 127 partidos</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-[#00a884] border-[#00a884]" onClick={handleGoToChat}>
                  Ir al Chat
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
                  {currentPlayers}/{maxPlayers || 'N/A'}
                </Badge>
                {userType === 'player' && onNavigate && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Ver todos los jugadores"
                    tabIndex={0}
                    onClick={handleViewAllClick}
                    onTouchStart={handleViewAllClick}
                    className="text-[#172c44] border-[#172c44] hover:bg-[#172c44] hover:text-white"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver Todos
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {playersArray.length > 0 ? (
                playersArray.map((playerId) => (
                  <div key={playerId} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gray-200 text-[#172c44] text-sm">
                        {String(playerId).substring(0,2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm text-[#172c44]">Jugador</p>
                      <p className="text-xs text-gray-600">ID: {String(playerId)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                      <span className="text-xs text-gray-600">4.5</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-600">No hay jugadores confirmados aún.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] mb-3">Ubicación</h3>
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <p className="text-gray-500">Mapa de la cancha</p>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              {(() => {
                const loc = data?.location;
                if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                  return `${loc.lat}, ${loc.lng}`;
                }
                return locationText(loc);
              })()}
            </p>
            {(() => {
              const loc = data?.location;
              if (userLocation && loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
                const km = haversineKm(userLocation, { lat: loc.lat, lng: loc.lng });
                return <p className="text-sm text-gray-600 mb-2">Distancia: {km.toFixed(1)} km</p>;
              }
              return null;
            })()}
            <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(mapsUrlFor(data), '_blank')}>Abrir en Google Maps</Button>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button 
          className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] h-12"
          onClick={isJoined ? handleGoToChat : handleJoinMatch}
          disabled={joining}
        >
          {joining ? (
            <span>Procesando...</span>
          ) : isJoined ? (
            <span>Ir al Chat</span>
          ) : (
            <span>Unirse al Partido - {formatCLP(pricePerPlayer)}</span>
          )}
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Crown, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AppHeader } from '../../common/AppHeader';
import { createMatch, getAllCourts } from '../../../services/matchService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { DocumentData, collection, query, where, getDocs, Timestamp, doc, setDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface CreateMatchScreenProps {
  onBack: () => void;
}

export function CreateMatchScreen({ onBack }: CreateMatchScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [includeMyTeam, setIncludeMyTeam] = useState(false);
  const [courts, setCourts] = useState<DocumentData[]>([]);
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for match details
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [matchDuration, setMatchDuration] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [pricePerPlayer, setPricePerPlayer] = useState(5000);
  const [description, setDescription] = useState('');

  const compatibleTeams = myTeams.filter(team => (team.sport?.toLowerCase?.() || '') === selectedSport);
  const selectedTeam = compatibleTeams.length > 0 ? compatibleTeams[0] : null;

  const sports = [
    { id: 'football', name: 'Fútbol', icon: '⚽' },
    { id: 'basketball', name: 'Básquetball', icon: '🏀' },
    { id: 'tennis', name: 'Tenis', icon: '🎾' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
    { id: 'padel', name: 'Pádel', icon: '🏓' },
    { id: 'futsal', name: 'Futsal', icon: '⚽' },
  ];

  useEffect(() => {
    const loadCourts = async () => {
      try {
        setLoading(true);
        setError(null);
        const courtsData = await getAllCourts();
        setCourts(courtsData);
      } catch (err) {
        setError('Error al cargar las canchas disponibles');
        console.error('Error loading courts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourts();
  }, []);

  useEffect(() => {
    const loadTeams = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const q = query(collection(db, 'teams'), where('captainId', '==', user.uid), where('status', '==', 'active'));
        const snap = await getDocs(q);
        const teamsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMyTeams(teamsData);
      } catch {}
    };
    loadTeams();
  }, []);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedCourtId || !matchDate) return;
      setOccupiedSlots([]);
      try {
        const startOfDay = new Date(matchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(matchDate);
        endOfDay.setHours(23, 59, 59, 999);
        const q = query(collection(db, 'matches'), where('courtId', '==', selectedCourtId), where('date', '>=', Timestamp.fromDate(startOfDay)), where('date', '<=', Timestamp.fromDate(endOfDay)));
        const querySnapshot = await getDocs(q);
        const slots: string[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (data.time) slots.push(data.time);
        });
        setOccupiedSlots(slots);
      } catch {}
    };
    checkAvailability();
  }, [selectedCourtId, matchDate]);

  // Efecto para calcular el precio por jugador automáticamente
  useEffect(() => {
    const court = courts.find(c => c.id === selectedCourtId);
    if (court && court.pricePerHour > 0 && maxPlayers > 0 && matchDuration > 0) {
      const totalCost = court.pricePerHour * matchDuration;
      const calculatedPrice = Math.ceil(totalCost / maxPlayers); // Redondea hacia arriba para asegurar el costo total
      setPricePerPlayer(calculatedPrice);
    }
  }, [maxPlayers, selectedCourtId, matchDuration, courts]);

  const getAvailableTimeSlots = () => {
    const court = courts.find(c => c.id === selectedCourtId);
    if (!court) return [];
    const startHour = court.openingTime ? parseInt(String(court.openingTime).split(':')[0]) : 8;
    const endHour = court.closingTime ? parseInt(String(court.closingTime).split(':')[0]) : 23;
    const slots: string[] = [];
    for (let i = startHour; i < endHour; i++) {
      const t = `${String(i).padStart(2, '0')}:00`;
      if (!occupiedSlots.includes(t)) slots.push(t);
    }
    return slots;
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">¿Qué deporte quieres jugar?</h2>
      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`p-4 rounded-lg border-2 transition-colors text-center ${
              selectedSport === sport.id
                ? 'border-[#f4b400] bg-[#f4b400]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-2xl mb-2">{sport.icon}</div>
            <p className="text-sm text-[#172c44]">{sport.name}</p>
          </button>
        ))}
      </div>
      <Button 
        onClick={() => setStep(2)}
        disabled={!selectedSport}
        className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
      >
        Continuar
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">Selecciona una cancha</h2>
      <div className="space-y-3">
        {courts.map((court) => (
          <Card 
            key={court.id} 
            className={`cursor-pointer transition-colors ${
              selectedCourtId === court.id
                ? 'border-[#f4b400] bg-[#f4b400]'
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedCourtId(court.id)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[#172c44] mb-1">{court.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{court.location?.address || 'Ubicación no disponible'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⭐ {court.rating || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#00a884]">${court.pricePerHour?.toLocaleString() || 'N/A'}</p>
                  <p className="text-xs text-gray-600">por hora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(1)}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button 
          onClick={() => setStep(3)}
          disabled={!selectedCourtId}
          className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
        >
          Continuar
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">Configura tu partido</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white mb-2">
            Fecha del partido
          </label>
          <Input
            type="date"
            className="w-full"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            min={new Date().toISOString().split("T")[0]} // No se pueden crear partidos en el pasado
          />
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Hora de inicio
          </label>
          <Select value={matchTime} onValueChange={setMatchTime}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una hora" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableTimeSlots().map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Duración (horas)
          </label>
          <Select value={String(matchDuration)} onValueChange={(val) => setMatchDuration(Number(val))}>
            <SelectTrigger>
              <SelectValue placeholder="Duración" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora</SelectItem>
              <SelectItem value="1.5">1.5 horas</SelectItem>
              <SelectItem value="2">2 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Número de jugadores
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[6, 8, 10, 11, 14, 16, 18, 22].map((num) => (
              <Button
                key={num}
                variant="outline"
                className={`${maxPlayers === num
                  ? 'aspect-square bg-[#f4b400] text-[#172c44] border-transparent'
                  : 'aspect-square bg-white/20 text-white border-white/30 hover:bg-white/30'} `}
                onClick={() => setMaxPlayers(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Costo por jugador
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              type="number" 
              placeholder="Costo calculado"
              value={pricePerPlayer}
              readOnly
              className="pl-10 bg-white/10 border-white/30 focus:ring-0"
            />
          </div>
        </div>

        {/* Team inclusion option */}
        {selectedTeam && (
          <div className="border border-[rgba(23,44,68,0.1)] rounded-lg p-4 bg-[#f8f9fa]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-[#f4b400]" />
                <label className="text-[#172c44] cursor-pointer">
                  Incluir mi equipo oficial
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMyTeam}
                  onChange={(e) => setIncludeMyTeam(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f4b400]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f4b400]"></div>
              </label>
            </div>
            
            {includeMyTeam && selectedTeam && (
              <div className="bg-white p-3 rounded-lg border border-[rgba(23,44,68,0.1)]">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {selectedTeam.image ? (
                      <img
                        src={selectedTeam.image}
                        alt={selectedTeam.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#e5e5e5] rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#666666]" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#f4b400] rounded-full flex items-center justify-center">
                      <Crown className="h-2.5 w-2.5 text-[#172c44]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#172c44] text-sm">{selectedTeam.name}</h4>
                    <p className="text-[#666666] text-xs">
                      {selectedTeam.members}/{selectedTeam.maxMembers} miembros • Equipo oficial
                    </p>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-[#e8f5e8] rounded border-l-2 border-[#00a884]">
                  <p className="text-xs text-[#00a884]">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Tu equipo participará como una unidad. Los miembros del equipo tendrán prioridad para unirse al partido.
                  </p>
                </div>
              </div>
            )}
            
            {!includeMyTeam && (
              <p className="text-sm text-[#666666]">
                Los jugadores se organizarán en equipos temporales automáticamente cuando se unan al partido.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm text-white mb-2">
            Descripción (opcional)
          </label>
          <Textarea 
            placeholder="Describe tu partido, nivel de juego, reglas especiales..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(2)}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button 
          onClick={() => setStep(4)}
          disabled={!matchDate || !matchTime}
          className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
        >
          Continuar
        </Button>
      </div>
    </div>
  );

  const handlePublish = async () => {
    const currentUser = auth.currentUser;
    const court = courts.find(c => c.id === selectedCourtId);

    if (!currentUser) {
      setError("Debes iniciar sesión para crear un partido.");
      return;
    }
    if (!selectedSport || !selectedCourtId || !matchDate || !matchTime || !court) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }

    setLoading(true);
    setError(null);

    const matchData: any = {
      sport: selectedSport,
      courtId: selectedCourtId,
      courtName: court.name,
      location: court.location || { address: 'Ubicación no especificada' },
      date: new Date(matchDate + 'T' + matchTime),
      time: matchTime,
      duration: matchDuration,
      maxPlayers: maxPlayers,
      pricePerPlayer: pricePerPlayer,
      description: description,
      captainId: currentUser.uid,
      captainName: currentUser.displayName || "Capitán Anónimo",
      status: 'open',
      players: [currentUser.uid],
      currentPlayers: 1
    };

    // Añadir información del equipo si está incluido
    if (includeMyTeam && selectedTeam) {
      matchData.teamId = selectedTeam.id;
      matchData.teamName = selectedTeam.name;
    }

    try {
      let initialPlayers = [currentUser.uid];
      if (includeMyTeam && selectedTeam && Array.isArray(selectedTeam.members)) {
        initialPlayers = Array.from(new Set([...initialPlayers, ...selectedTeam.members]));
        matchData.players = initialPlayers;
        matchData.currentPlayers = initialPlayers.length;
        matchData.teamId = selectedTeam.id;
        matchData.teamName = selectedTeam.name;
      }
      const matchId = await createMatch(matchData);
      if (initialPlayers.length > 1) {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, { players: initialPlayers, currentPlayers: initialPlayers.length });
      }
      const chatParticipants = [...initialPlayers];
      if (court.ownerId) {
        chatParticipants.push(court.ownerId);
      }
      const uniqueParticipants = Array.from(new Set(chatParticipants));
      const chatRef = doc(db, 'chats', matchId);
      // TTL: 7 días post-finalización
      const matchEnd = new Date(matchData.date);
      matchEnd.setHours(matchEnd.getHours() + (Number(matchData.duration) || 1));
      const expiresDate = new Date(matchEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
      await setDoc(chatRef, {
        id: matchId,
        type: 'match',
        name: `Partido en ${court.name}`,
        participantsUids: uniqueParticipants,
        lastMessage: '¡Partido creado!',
        lastMessageTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        ownerId: currentUser.uid,
        matchId: matchId,
        sport: selectedSport,
        expiresAt: Timestamp.fromDate(expiresDate)
      });
      const messagesRef = collection(db, 'chats', matchId, 'messages');
      await addDoc(messagesRef, {
        text: includeMyTeam ? 'El equipo ha sido unido automáticamente.' : 'Coordinen aquí los detalles.',
        senderId: 'system',
        senderName: 'Sistema',
        createdAt: serverTimestamp(),
        system: true
      });
      alert('¡Partido y chat creados exitosamente!');
      onBack();
    } catch (err: any) {
      setError(err.message || 'Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  const renderStep4 = () => {
    const court = courts.find(c => c.id === selectedCourtId);
    const totalCost = court?.pricePerHour * matchDuration;

    return (<div className="space-y-6">
      <h2 className="text-white mb-4">Confirma y publica</h2>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Deporte:</span>
            <span className="text-[#172c44] font-bold">{sports.find(s => s.id === selectedSport)?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cancha:</span>
            <span className="text-[#172c44] font-bold">{court?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha:</span>
            <span className="text-[#172c44] font-bold">{new Date(matchDate).toLocaleDateString()} - {matchTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Jugadores:</span>
            <span className="text-[#172c44] font-bold">{maxPlayers} personas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Costo por persona:</span>
            <span className="text-[#00a884] font-bold">${pricePerPlayer.toLocaleString()}</span>
          </div>
          {includeMyTeam && selectedTeam && (
            <div className="flex justify-between">
              <span className="text-gray-600">Equipo incluido:</span>
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3 text-[#f4b400]" />
                <span className="text-[#172c44]">{selectedTeam.name}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between border-t pt-2">
            <span className="text-[#172c44]">Total arriendo cancha:</span>
            <span className="text-[#172c44] font-bold">${totalCost?.toLocaleString() || 'N/A'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de error visible si algo falla */}
      {error && (
        <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Team information based on inclusion */}
      {includeMyTeam && selectedTeam ? (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-4 w-4 text-[#00a884]" />
              <p className="text-sm text-green-800">
                <strong>Equipo oficial incluido:</strong> {selectedTeam.name}
              </p>
            </div>
            <p className="text-xs text-green-700">
              Los {selectedTeam.members} miembros de tu equipo tendrán prioridad para unirse. 
              Si hay espacios adicionales, otros jugadores podrán formar un equipo temporal.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Responsabilidad de capitán:</strong> Coordinarás el pago de la cancha y la participación de tu equipo.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Como organizador, serás responsable de coordinar el pago de la cancha. 
              Los jugadores pagarán su parte al unirse al partido.
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Equipos temporales:</strong> Al crear este partido, se formarán automáticamente 1 o 2 equipos temporales 
              cuando los jugadores se unan. Estos equipos son específicos para este partido.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(3)}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button 
          onClick={handlePublish} // Conectamos la función aquí
          disabled={loading}
          className="flex-1 bg-[#00a884] hover:bg-[#008f73] text-white"
        >
          {loading ? 'Publicando...' : 'Publicar Partido'}
        </Button>
      </div>
    </div>);
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header */}
      <AppHeader 
        title="Crear Partido" 
        showLogo={true}
        showBackButton={false}
      />
      
      {/* Progress bar */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step >= stepNum
                    ? 'bg-[#f4b400] text-[#172c44]'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#f4b400] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 pb-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Crown, Shield, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AppHeader } from '../../common/AppHeader';
import { createMatch, getAllCourts } from '../../../services/matchService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { startMatchCheckout } from '../../../services/paymentService';
import { DocumentData, collection, query, where, getDocs, Timestamp, doc, setDoc, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';

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
  const [paymentMode, setPaymentMode] = useState<'immediate' | 'deferred'>('deferred');

  // State for match details
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [matchDuration, setMatchDuration] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [pricePerPlayer, setPricePerPlayer] = useState(5000);
  const [description, setDescription] = useState('');

  const dayKeyFor = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const idx = d.getDay();
    return ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][idx];
  };

  const isUnavailableDay = (court: any | undefined, dateStr: string) => {
    if (!court || !dateStr) return false;
    const key = dayKeyFor(dateStr);
    const cfg: any = (court.availability || {})[key] || { enabled: false };
    return !cfg.enabled;
  };

  const clampHourRange = (court: any | undefined, dateStr: string) => {
    const key = dateStr ? dayKeyFor(dateStr) : '';
    const cfg: any = key ? (court?.availability || {})[key] : undefined;
    if (!cfg || cfg.enabled === false) return { start: null as number | null, end: null as number | null };
    const parseH = (t: string) => parseInt(String(t).split(':')[0], 10);
    const start = parseH(cfg.start || '00:00');
    const end = parseH(cfg.end || '00:00');
    return { start, end };
  };

  const isPastToday = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return false;
    const now = new Date();
    const selected = new Date(dateStr + 'T' + timeStr);
    const sameDay = now.toDateString() === selected.toDateString();
    return sameDay && selected.getTime() <= now.getTime();
  };

  const getCourtCapacity = (court: any | undefined) => {
    const cap = Number(court?.capacity || court?.maxPlayers || 0);
    return cap > 0 ? cap : 22;
  };

  const normalize = (s: any) => {
    if (!s) return '';
    return String(s)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z\s]/g, '')
      .trim();
  };

  const sportAliases: Record<string, string[]> = {
    football: ['futbol', 'futbol ', 'futbol  ', 'futbol', 'football', 'soccer'],
    basketball: ['basquetball', 'basquet', 'basketball'],
    tennis: ['tenis', 'tennis'],
    volleyball: ['voleibol', 'volley', 'volleyball', 'voley'],
    padel: ['padel', 'padel '],
    futsal: ['futsal']
  };

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

  const playerOptions = useMemo(() => {
    const court = courts.find(c => c.id === selectedCourtId);
    const cap = getCourtCapacity(court);
    const opts: number[] = [];
    for (let i = 2; i <= cap; i++) opts.push(i);
    return opts.length ? opts : [2, 4, 6];
  }, [selectedCourtId, courts]);

  useEffect(() => {
    const court = courts.find(c => c.id === selectedCourtId);
    const cap = getCourtCapacity(court);
    if (cap > 0) {
      setMaxPlayers(prev => Math.min(prev, cap));
    }
  }, [selectedCourtId, courts]);

  useEffect(() => {
    const court = courts.find(c => c.id === selectedCourtId);
    if (court && court.pricePerHour > 0 && maxPlayers > 0 && matchDuration > 0) {
      const totalCost = court.pricePerHour * matchDuration;
      const calculatedPrice = Math.ceil(totalCost / maxPlayers);
      setPricePerPlayer(calculatedPrice);
    }
  }, [maxPlayers, selectedCourtId, matchDuration, courts]);

  const getAvailableTimeSlots = () => {
    const court = courts.find(c => c.id === selectedCourtId);
    if (!court || !matchDate) return [];
    if (isUnavailableDay(court, matchDate)) return [];
    const { start: startHour, end: endHour } = clampHourRange(court, matchDate);
    if (startHour == null || endHour == null) return [];
    const slots: string[] = [];
    for (let i = startHour; i < endHour; i++) {
      const t = `${String(i).padStart(2, '0')}:00`;
      if (!occupiedSlots.includes(t)) slots.push(t);
    }
    const now = new Date();
    const sameDay = new Date(matchDate + 'T00:00:00').toDateString() === now.toDateString();
    if (sameDay) {
      const currentHour = now.getHours();
      return slots.filter(s => parseInt(s.split(':')[0], 10) > currentHour);
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

  const filteredCourts = courts.filter((court: any) => {
    if (!selectedSport) return true;
    const wantedList = sportAliases[selectedSport] || [normalize(selectedSport)];
    const courtSportNorm = normalize(court?.sport || '');
    const courtSportsArrNorm = Array.isArray(court?.sports) ? court.sports.map((s: any) => normalize(s)) : [];
    return wantedList.includes(courtSportNorm) || courtSportsArrNorm.some((s: string) => wantedList.includes(s));
  });

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">Selecciona una cancha</h2>
      <div className="space-y-3">
        {filteredCourts.map((court) => (
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
      {selectedCourtId && (() => {
        const court = courts.find(c => c.id === selectedCourtId);
        const av: any = (court?.availability || {});
        const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
        const labels: Record<string,string> = {monday:'Lunes',tuesday:'Martes',wednesday:'Miércoles',thursday:'Jueves',friday:'Viernes',saturday:'Sábado',sunday:'Domingo'};
        const enabledList = days.filter(d => av[d]?.enabled).map(d => `${labels[d]}: ${av[d]?.start} - ${av[d]?.end}`);
        return (
          <div className="p-3 bg-white/10 border border-white/20 rounded-lg text-sm text-white">
            <p><strong>Días disponibles:</strong> {enabledList.length > 0 ? enabledList.join(' • ') : 'Sin disponibilidad configurada'}</p>
            <p><strong>Capacidad máxima:</strong> {getCourtCapacity(court)} jugadores</p>
          </div>
        );
      })()}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white mb-2">
            Fecha del partido
          </label>
          <Input
            type="date"
            className="w-full"
            value={matchDate}
            onChange={(e) => {
              const val = e.target.value;
              const court = courts.find(c => c.id === selectedCourtId);
              if (court && isUnavailableDay(court, val)) {
                toast.error('Día no disponible', { description: 'Esta cancha no está disponible en el día seleccionado.' });
                setMatchDate('');
                return;
              }
              setMatchDate(val);
            }}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Hora de inicio
          </label>
          <Select value={matchTime} onValueChange={(val) => {
            const court = courts.find(c => c.id === selectedCourtId);
            const { start, end } = clampHourRange(court, matchDate);
            const hour = parseInt(val.split(':')[0], 10);
            if (hour < start || hour >= end) {
              toast.error('Hora fuera de rango', { description: `Selecciona entre ${String(start).padStart(2,'0')}:00 y ${String(end).padStart(2,'0')}:00.` });
              return;
            }
            if (isPastToday(matchDate, val)) {
              toast.error('Hora inválida', { description: 'No puedes reservar una hora pasada del día actual.' });
              return;
            }
            setMatchTime(val);
          }}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona una hora" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableTimeSlots().map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Duración (horas)
          </label>
          <Select value={String(matchDuration)} onValueChange={(v) => setMatchDuration(Number(v))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona duración" />
            </SelectTrigger>
            <SelectContent>
              {[1, 1.5, 2, 2.5, 3].map((hours) => (
                <SelectItem key={hours} value={String(hours)}>
                  {hours} hora{hours > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Número de jugadores
          </label>
          <div className="grid grid-cols-4 gap-2">
            {playerOptions.map((num) => {
              const court = courts.find(c => c.id === selectedCourtId);
              const cap = getCourtCapacity(court);
              const disabled = num > cap;
              return (
                <Button
                  key={num}
                  variant="outline"
                  className={`${maxPlayers === num
                    ? 'aspect-square bg-[#f4b400] text-[#172c44] border-transparent'
                    : 'aspect-square bg-white/20 text-white border-white/30 hover:bg-white/30'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={disabled}
                  onClick={() => !disabled && setMaxPlayers(num)}
                >
                  {num}
                </Button>
              );
            })}
          </div>
          {selectedCourtId && (
            <p className="text-white/80 text-xs mt-1">Capacidad máxima permitida: {getCourtCapacity(courts.find(c => c.id === selectedCourtId))} jugadores.</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Costo por jugador
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 text-gray-400" size={16} />
            <Input
              type="number"
              className="pl-10"
              value={pricePerPlayer}
              onChange={(e) => setPricePerPlayer(Number(e.target.value))}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Costo total de la cancha: ${(courts.find(c => c.id === selectedCourtId)?.pricePerHour || 0) * matchDuration}
          </p>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Descripción (opcional)
          </label>
          <Textarea
            placeholder="Describe tu partido, nivel de juego, reglas especiales..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {compatibleTeams.length > 0 && (
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="includeTeam" 
              checked={includeMyTeam}
              onChange={(e) => setIncludeMyTeam(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="includeTeam" className="text-white text-sm">
              Unir a mi equipo "{selectedTeam?.name}" automáticamente
            </label>
          </div>
        )}
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

    if (court && isUnavailableDay(court, matchDate)) {
      setError('La cancha no está disponible en el día seleccionado.');
      toast.error('Día no disponible', { description: 'Elige un día habilitado según disponibilidad de la cancha.' });
      return;
    }
    const { start, end } = clampHourRange(court, matchDate);
    const hour = parseInt(matchTime.split(':')[0], 10);
    if (hour < start || hour >= end) {
      setError(`La hora debe estar entre ${String(start).padStart(2,'0')}:00 y ${String(end).padStart(2,'0')}:00.`);
      toast.error('Hora fuera de rango', { description: `Selecciona entre ${String(start).padStart(2,'0')}:00 y ${String(end).padStart(2,'0')}:00.` });
      return;
    }
    if (isPastToday(matchDate, matchTime)) {
      setError('No puedes reservar una hora pasada del día actual.');
      toast.error('Hora inválida', { description: 'Elige una hora futura para hoy.' });
      return;
    }
    const cap = getCourtCapacity(court);
    if (maxPlayers > cap) {
      setError(`Número de jugadores excede la capacidad (${cap}).`);
      toast.error('Capacidad excedida', { description: `Selecciona hasta ${cap} jugadores.` });
      return;
    }

    setLoading(true);
    setError(null);

    let matchLocation = court.location;
    if (!matchLocation || !matchLocation.lat) {
      if (court.ownerId) {
        try {
          const ownerSnap = await getDoc(doc(db, 'dueno', court.ownerId));
          if (ownerSnap.exists()) {
            const od = ownerSnap.data();
            if (od.location) {
              matchLocation = { ...od.location, address: od.address || 'Ubicación no disponible' };
            } else if (od.address) {
              matchLocation = { address: od.address };
            }
          }
        } catch (e) { console.error("Error fetching owner location", e); }
      }
    }

    const matchData: any = {
      sport: selectedSport,
      courtId: selectedCourtId,
      courtName: court.name,
      location: matchLocation || { address: 'Ubicación no especificada' },
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
      currentPlayers: 1,
      totalCost: (courts.find(c => c.id === selectedCourtId)?.pricePerHour || 0) * matchDuration,
      paymentStatus: 'pending'
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

      if (paymentMode === 'immediate') {
        try {
          await updateDoc(doc(db, 'matches', matchId), { paymentStatus: 'pending' });
          await startMatchCheckout({ matchId, title: `Partido en ${court.name}`, price: (court.pricePerHour || 0) * matchDuration, payerEmail: currentUser.email || null, sellerId: court.ownerId || null, applicationFee: 0 });
        } catch (paymentError) {
          console.error('Error al iniciar el pago:', paymentError);
          toast.error('No se pudo iniciar el pago.', { description: 'El partido fue creado con pago pendiente. Puedes pagar más tarde.' });
          onBack();
        }
      } else {
        toast.success('¡Partido creado!', { description: 'Podrás pagar antes de iniciar el partido.' });
        onBack();
      }

    } catch (err: any) {
      console.error('Error general al crear el partido:', err);
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
      <Card className="border-gray-200">
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-[#172c44] font-bold text-lg">{court?.name}</h3>
              <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                <MapPin size={14} />
                <span>{court?.location?.address || 'Ubicación no disponible'}</span>
              </div>
            </div>
            <Badge className="bg-[#f4b400] text-[#172c44]">{selectedSport.toUpperCase()}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-1">Fecha</p>
              <div className="flex items-center gap-2 text-[#172c44]">
                <Calendar size={16} />
                <span>{matchDate}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Hora</p>
              <div className="flex items-center gap-2 text-[#172c44]">
                <Clock size={16} />
                <span>{matchTime} ({matchDuration}h)</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Jugadores</p>
              <div className="flex items-center gap-2 text-[#172c44]">
                <Users size={16} />
                <span>{maxPlayers} máx</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Precio/jugador</p>
              <div className="flex items-center gap-2 text-[#00a884] font-bold">
                <DollarSign size={16} />
                <span>${pricePerPlayer.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {includeMyTeam && selectedTeam && (
            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3">
              <Shield className="text-blue-600" size={20} />
              <div>
                <p className="text-sm font-bold text-blue-800">Equipo incluido</p>
                <p className="text-xs text-blue-600">Se unirán {selectedTeam.members?.length || 0} miembros de "{selectedTeam.name}"</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="font-medium text-[#172c44]">Modo de pago</p>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMode === 'immediate' ? 'border-[#00a884] bg-[#00a884]/10' : 'border-gray-200'}`}
                onClick={() => setPaymentMode('immediate')}
              >
                <p className="font-bold text-[#172c44] text-sm">Pago Inmediato</p>
                <p className="text-xs text-gray-500">Pagar ahora para confirmar</p>
              </div>
              <div 
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${paymentMode === 'deferred' ? 'border-[#f4b400] bg-[#f4b400]/10' : 'border-gray-200'}`}
                onClick={() => setPaymentMode('deferred')}
              >
                <p className="font-bold text-[#172c44] text-sm">Pago Diferido</p>
                <p className="text-xs text-gray-500">Pagar antes del partido</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-600">Costo total cancha</span>
            <span className="text-xl font-bold text-[#172c44]">${totalCost?.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
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
          onClick={handlePublish}
          disabled={loading}
          className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publicando...
            </>
          ) : (
            'Publicar Partido'
          )}
        </Button>
      </div>
    </div>);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] via-[#1f3a56] to-[#172c44] p-4">
      <AppHeader 
        title="Crear Partido" 
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/10">
            <ArrowLeft size={20} />
          </Button>
        }
        className="bg-transparent border-0 mb-6"
      />

      {/* Progress Steps */}
      <div className="flex justify-between items-center mb-8 px-4 relative">
        <div className="absolute left-0 right-0 top-1/2 h-1 bg-gray-700 -z-10 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 h-1 bg-[#f4b400] -z-10 rounded-full transition-all duration-300"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>
        {[1, 2, 3, 4].map((s) => (
          <div 
            key={s}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s ? 'bg-[#f4b400] text-[#172c44]' : 'bg-gray-700 text-gray-400'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
}
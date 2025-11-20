import React, { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Crown, Shield, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge'; 
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AppHeader } from '../../common/AppHeader';
import { createMatch, getAllCourts } from '../../../services/matchService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { 
  DocumentData, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';

interface CreateMatchScreenProps {
  onBack: () => void;
}

interface Court extends DocumentData {
  id: string;
  name: string;
  sports?: string[]; 
  sport?: string;    
  pricePerHour: number;
  maxPlayers?: number;
  openingTime?: string; 
  closingTime?: string;
  ownerId?: string; // AÑADIDO: ID del dueño para el chat
}

interface Team {
  id: string;
  name: string;
  sport: string;
  members: string[]; 
  maxMembers: number;
  image?: string;
}

export function CreateMatchScreen({ onBack }: CreateMatchScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCourtId, setSelectedCourtId] = useState('');
  const [includeMyTeam, setIncludeMyTeam] = useState(false);
  
  // Data states
  const [allCourts, setAllCourts] = useState<Court[]>([]);
  const [myTeams, setMyTeams] = useState<Team[]>([]);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Match Details State
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [matchDuration, setMatchDuration] = useState(1);
  const [maxPlayers, setMaxPlayers] = useState(0); 
  const [pricePerPlayer, setPricePerPlayer] = useState(0);
  const [description, setDescription] = useState('');

  const currentUser = auth.currentUser;

  const normalizeSport = (dbSport: string) => {
    const lower = dbSport?.toLowerCase() || '';
    if (lower === 'basquet' || lower === 'básquet' || lower === 'basket') return 'basketball';
    if (lower === 'futbol' || lower === 'fútbol') return 'football';
    if (lower === 'tenis') return 'tennis';
    if (lower === 'voley' || lower === 'voleibol') return 'volleyball';
    return lower; 
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        const courtsColl1 = collection(db, 'courts');
        const courtsColl2 = collection(db, 'cancha');
        
        const [snap1, snap2] = await Promise.all([
          getDocs(courtsColl1),
          getDocs(courtsColl2)
        ]);

        const courts1 = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const courts2 = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const combinedCourts = [...courts1, ...courts2].map((court: any) => ({
            ...court,
            sport: normalizeSport(court.sport || (court.sports && court.sports[0]))
        }));
        
        setAllCourts(combinedCourts as Court[]);

        if (currentUser) {
          const q = query(
            collection(db, 'teams'),
            where('captainId', '==', currentUser.uid),
            where('status', '==', 'active')
          );
          const querySnapshot = await getDocs(q);
          const teamsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Team[];
          setMyTeams(teamsData);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [currentUser]);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedCourtId || !matchDate) return;

      setLoadingSlots(true);
      setOccupiedSlots([]); 

      try {
        const startOfDay = new Date(matchDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(matchDate);
        endOfDay.setHours(23, 59, 59, 999);

        const q = query(
          collection(db, 'matches'),
          where('courtId', '==', selectedCourtId),
          where('date', '>=', Timestamp.fromDate(startOfDay)),
          where('date', '<=', Timestamp.fromDate(endOfDay))
        );

        const querySnapshot = await getDocs(q);
        const slots: string[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.time) slots.push(data.time);
        });

        setOccupiedSlots(slots);
      } catch (err) {
        console.error("Error checking slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    checkAvailability();
  }, [selectedCourtId, matchDate]);

  useEffect(() => {
    const court = allCourts.find(c => c.id === selectedCourtId);
    if (court && court.pricePerHour > 0 && maxPlayers > 0 && matchDuration > 0) {
      const totalCost = court.pricePerHour * matchDuration;
      const calculatedPrice = Math.ceil(totalCost / maxPlayers);
      setPricePerPlayer(calculatedPrice);
    }
  }, [maxPlayers, selectedCourtId, matchDuration, allCourts]);

  const filteredCourts = allCourts.filter(court => {
    return court.sport === selectedSport;
  });

  const compatibleTeams = myTeams.filter(team => {
     const teamSport = normalizeSport(team.sport);
     return teamSport === selectedSport;
  });
  const selectedTeam = compatibleTeams.length > 0 ? compatibleTeams[0] : null;

  const getAvailableTimeSlots = () => {
    const court = allCourts.find(c => c.id === selectedCourtId);
    if (!court) return [];

    const startHour = court.openingTime ? parseInt(court.openingTime.split(':')[0]) : 8; 
    const endHour = court.closingTime ? parseInt(court.closingTime.split(':')[0]) : 23; 

    const slots = [];
    for (let i = startHour; i < endHour; i++) {
      const timeString = `${i.toString().padStart(2, '0')}:00`;
      if (!occupiedSlots.includes(timeString)) {
        slots.push(timeString);
      }
    }
    return slots;
  };

  const getPlayerOptions = () => {
    const court = allCourts.find(c => c.id === selectedCourtId);
    const courtMax = court?.maxPlayers || (court?.capacity ? parseInt(court.capacity) : 22); 
    const options = [];

    if (selectedSport === 'tennis' || selectedSport === 'padel') {
      options.push(2, 4);
    } else {
      for (let i = 6; i <= courtMax; i += 2) {
        options.push(i);
      }
    }
    return options;
  };

  const sports = [
    { id: 'football', name: 'Fútbol', icon: '⚽' },
    { id: 'basketball', name: 'Básquetball', icon: '🏀' },
    { id: 'tennis', name: 'Tenis', icon: '🎾' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
    { id: 'padel', name: 'Pádel', icon: '🏓' },
    { id: 'futsal', name: 'Futsal', icon: '⚽' },
  ];

  const handlePublish = async () => {
    const court = allCourts.find(c => c.id === selectedCourtId);

    if (!currentUser) {
      setError("Debes iniciar sesión para crear un partido.");
      return;
    }
    if (!selectedSport || !selectedCourtId || !matchDate || !matchTime || !court) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }
    if (maxPlayers <= 0) {
      setError("Selecciona el número de jugadores.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Preparar lista de JUGADORES DEL PARTIDO (Capitán + Equipo)
      let initialPlayers = [currentUser.uid];
      
      if (includeMyTeam && selectedTeam && selectedTeam.members) {
        initialPlayers = [...initialPlayers, ...selectedTeam.members];
        initialPlayers = Array.from(new Set(initialPlayers)); // Eliminar duplicados
      }

      // 2. Preparar lista de PARTICIPANTES DEL CHAT (Jugadores + DUEÑO)
      let chatParticipants = [...initialPlayers];
      if (court.ownerId) {
          // AÑADIR AL DUEÑO SOLO AL CHAT
          chatParticipants.push(court.ownerId);
          chatParticipants = Array.from(new Set(chatParticipants));
      }

      const matchData = {
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
        captainName: currentUser.displayName || "Capitán",
        status: 'open',
        players: initialPlayers, // NOTA: Aquí van SOLO los jugadores
        currentPlayers: initialPlayers.length,
        createdAt: new Date()
      };

      if (includeMyTeam && selectedTeam) {
        // @ts-ignore
        matchData.teamId = selectedTeam.id;
        // @ts-ignore
        matchData.teamName = selectedTeam.name;
      }

      // 3. Crear el Partido en Firestore
      const matchId = await createMatch(matchData);

      // 4. FORZAR actualización de jugadores en el partido
      if (initialPlayers.length > 1) {
         const matchRef = doc(db, 'matches', matchId);
         await updateDoc(matchRef, {
            players: initialPlayers,
            currentPlayers: initialPlayers.length
         });
      }

      // 5. CREAR EL CHAT DEL PARTIDO
      const chatRef = doc(db, 'chats', matchId);
      
      await setDoc(chatRef, {
        id: matchId,
        type: 'match',
        name: `Partido en ${court.name}`,
        participantsUids: chatParticipants, // NOTA: Aquí van jugadores + DUEÑO
        lastMessage: '¡Partido creado!',
        lastMessageTimestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        ownerId: currentUser.uid,
        matchId: matchId,
        sport: selectedSport
      });

      // 6. Agregar mensaje de bienvenida
      const messagesRef = collection(db, 'chats', matchId, 'messages');
      await addDoc(messagesRef, {
        text: `¡Bienvenidos al partido! ${includeMyTeam ? 'El equipo ha sido unido automáticamente.' : 'Coordinen aquí los detalles.'}`,
        senderId: 'system',
        senderName: 'Sistema',
        createdAt: serverTimestamp(),
        system: true
      });

      alert("¡Partido y chat creados exitosamente!");
      onBack();

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al crear el partido');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4 font-semibold text-lg">¿Qué deporte quieres jugar?</h2>
      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`p-4 rounded-xl border-2 transition-all text-center hover:scale-[1.02] active:scale-95 ${
              selectedSport === sport.id
                ? 'border-[#f4b400] bg-[#f4b400] shadow-lg'
                : 'border-transparent bg-white/90 hover:bg-white'
            }`}
          >
            <div className="text-3xl mb-2">{sport.icon}</div>
            <p className="text-sm font-bold text-[#172c44]">{sport.name}</p>
          </button>
        ))}
      </div>
      <Button 
        onClick={() => setStep(2)}
        disabled={!selectedSport}
        className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] font-bold py-6"
      >
        Continuar
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white font-semibold text-lg">Selecciona una cancha</h2>
        <Badge className="bg-[#00a884]">{sports.find(s => s.id === selectedSport)?.name}</Badge>
      </div>
      
      <div className="space-y-3">
        {filteredCourts.length > 0 ? (
          filteredCourts.map((court) => (
            <Card 
              key={court.id} 
              className={`cursor-pointer transition-all border-2 ${
                selectedCourtId === court.id
                  ? 'border-[#f4b400] bg-white ring-2 ring-[#f4b400] ring-offset-2 ring-offset-[#172c44]'
                  : 'border-transparent bg-white/90 hover:bg-white'
              }`}
              onClick={() => setSelectedCourtId(court.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[#172c44] font-bold text-base mb-1">{court.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-[#00a884]"/>
                        <span>{court.location?.address || 'Ver mapa'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users size={14} />
                        <span>Max {court.maxPlayers || court.capacity || '22'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00a884] font-bold text-lg">${court.pricePerHour?.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-semibold">/hora</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-10 bg-white/10 rounded-xl">
            <p className="text-white">No hay canchas disponibles para {sports.find(s => s.id === selectedSport)?.name}</p>
            <p className="text-white/60 text-xs mt-2">Intenta seleccionar otro deporte.</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10">
          Atrás
        </Button>
        <Button 
          onClick={() => setStep(3)}
          disabled={!selectedCourtId}
          className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] font-bold"
        >
          Continuar
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const availableSlots = getAvailableTimeSlots();
    const playerOptions = getPlayerOptions();

    return (
    <div className="space-y-6">
      <h2 className="text-white mb-4 font-semibold text-lg">Configura tu partido</h2>
      
      <div className="space-y-5 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/10">
        {/* Fecha */}
        <div>
          <label className="block text-xs text-gray-300 uppercase font-bold mb-2 ml-1">Fecha del partido</label>
          <Input
            type="date"
            className="w-full bg-white/90 text-[#172c44] border-none h-12"
            value={matchDate}
            onChange={(e) => {
                setMatchDate(e.target.value);
                setMatchTime(''); 
            }}
            min={new Date().toISOString().split("T")[0]}
          />
        </div>

        {/* Hora */}
        <div>
          <label className="block text-xs text-gray-300 uppercase font-bold mb-2 ml-1">
             Hora de inicio {loadingSlots && <Loader2 className="inline h-3 w-3 animate-spin ml-2"/>}
          </label>
          <Select value={matchTime} onValueChange={setMatchTime} disabled={!matchDate}>
            <SelectTrigger className="bg-white/90 text-[#172c44] border-none h-12">
              <SelectValue placeholder={matchDate ? "Selecciona hora disponible" : "Primero elige una fecha"} />
            </SelectTrigger>
            <SelectContent>
              {availableSlots.length > 0 ? (
                availableSlots.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-500 text-center">
                  {matchDate ? "No hay horas disponibles" : "Selecciona una fecha"}
                </div>
              )}
            </SelectContent>
          </Select>
          {matchDate && availableSlots.length === 0 && !loadingSlots && (
             <p className="text-red-400 text-xs mt-1 ml-1">Todas las horas están ocupadas para esta fecha.</p>
          )}
        </div>

        {/* Duración */}
        <div>
          <label className="block text-xs text-gray-300 uppercase font-bold mb-2 ml-1">Duración</label>
          <div className="grid grid-cols-3 gap-2">
            {[1, 1.5, 2].map((dur) => (
                <button
                    key={dur}
                    onClick={() => setMatchDuration(dur)}
                    className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        matchDuration === dur 
                        ? 'bg-[#00a884] text-white' 
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                >
                    {dur}h
                </button>
            ))}
          </div>
        </div>

        {/* Jugadores */}
        <div>
          <label className="block text-xs text-gray-300 uppercase font-bold mb-2 ml-1">
            Jugadores {selectedSport === 'tennis' || selectedSport === 'padel' ? '(Máximo permitido)' : ''}
          </label>
          <div className="flex flex-wrap gap-2">
            {playerOptions.map((num) => (
              <Button
                key={num}
                variant="outline"
                className={`h-10 min-w-[3rem] ${
                  maxPlayers === num
                  ? 'bg-[#f4b400] text-[#172c44] border-transparent font-bold'
                  : 'bg-white/10 text-gray-300 border-white/20 hover:bg-white/20'
                } `}
                onClick={() => setMaxPlayers(num)}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Team inclusion */}
        {selectedTeam && (
          <div className="border border-[#f4b400]/30 rounded-xl p-4 bg-[#f4b400]/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-[#f4b400]" />
                <label className="text-white font-medium cursor-pointer select-none" htmlFor="team-check">
                  Jugar con {selectedTeam.name}
                </label>
              </div>
              <div className="relative inline-flex items-center cursor-pointer">
                <input
                  id="team-check"
                  type="checkbox"
                  checked={includeMyTeam}
                  onChange={(e) => setIncludeMyTeam(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f4b400]"></div>
              </div>
            </div>
            
            {includeMyTeam && (
               <div className="text-xs text-[#f4b400]/80 flex items-start gap-2">
                  <Shield size={12} className="mt-0.5 shrink-0" />
                  <span>
                    Se añadirán los <strong>{selectedTeam.members.length} miembros</strong> al partido y al chat automáticamente.
                  </span>
               </div>
            )}
          </div>
        )}

        {/* Descripción */}
        <Textarea 
          placeholder="Notas adicionales (nivel, reglas, etc.)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="bg-white/90 border-none resize-none min-h-[80px]"
        />
      </div>

      {/* Costo Resumen */}
      <div className="bg-white/10 rounded-xl p-4 flex justify-between items-center">
         <span className="text-gray-300 text-sm">Costo estimado por persona</span>
         <span className="text-[#f4b400] font-bold text-xl">${pricePerPlayer.toLocaleString()}</span>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => setStep(2)} className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10">
          Atrás
        </Button>
        <Button 
          onClick={() => setStep(4)}
          disabled={!matchDate || !matchTime || maxPlayers === 0}
          className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] font-bold"
        >
          Revisar
        </Button>
      </div>
    </div>
  )};

  const renderStep4 = () => {
    const court = allCourts.find(c => c.id === selectedCourtId);
    const totalCost = (court?.pricePerHour || 0) * matchDuration;

    return (<div className="space-y-6">
      <h2 className="text-white mb-4 font-semibold text-lg">Resumen y Confirmación</h2>
      
      <Card className="border-none shadow-xl overflow-hidden">
        <div className="h-2 bg-[#f4b400] w-full"></div>
        <CardContent className="p-6 space-y-5">
          <div className="flex justify-between items-center border-b border-gray-100 pb-4">
            <div>
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Deporte</p>
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{sports.find(s => s.id === selectedSport)?.icon}</span>
                    <span className="text-[#172c44] font-bold text-lg">{sports.find(s => s.id === selectedSport)?.name}</span>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Fecha</p>
                <p className="text-[#172c44] font-bold">{new Date(matchDate).toLocaleDateString()}</p>
                <p className="text-[#00a884] font-medium">{matchTime} hrs</p>
            </div>
          </div>

          <div className="space-y-3">
             <div className="flex justify-between">
                <span className="text-gray-600">Cancha</span>
                <span className="text-[#172c44] font-semibold">{court?.name}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-600">Jugadores</span>
                <span className="text-[#172c44] font-semibold">{maxPlayers}</span>
             </div>
             <div className="flex justify-between">
                <span className="text-gray-600">Duración</span>
                <span className="text-[#172c44] font-semibold">{matchDuration}h</span>
             </div>
             {includeMyTeam && selectedTeam && (
                <div className="flex justify-between text-sm bg-yellow-50 p-2 rounded">
                    <span className="text-yellow-800 flex items-center gap-1"><Crown size={14}/> Equipo</span>
                    <span className="text-[#172c44] font-bold">{selectedTeam.name}</span>
                </div>
             )}
          </div>

          <div className="border-t border-dashed border-gray-200 pt-4 mt-2">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 text-sm">Costo Total Cancha</span>
                <span className="text-gray-400 text-sm">${totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-[#172c44] font-bold">Tu cuota</span>
                <span className="text-[#00a884] font-black text-2xl">${pricePerPlayer.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-white">
          <AlertCircle className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={() => setStep(3)} className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10">
          Editar
        </Button>
        <Button 
          onClick={handlePublish}
          disabled={loading}
          className="flex-[2] bg-[#00a884] hover:bg-[#008f73] text-white font-bold py-6 text-lg shadow-lg shadow-[#00a884]/20"
        >
          {loading ? (
             <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creando...</>
          ) : 'Confirmar y Pagar'}
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
      <AppHeader 
        title="Crear Partido" 
        showLogo={false}
        showBackButton={true}
        onBack={step > 1 ? () => setStep(step - 1) : onBack}
      />
      
      {/* Progress bar */}
      <div className="bg-[#172c44]/20 backdrop-blur-md border-b border-white/5">
        <div className="px-6 py-4 max-w-md mx-auto">
          <div className="flex justify-between mb-2 px-1">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  step >= stepNum
                    ? 'bg-[#f4b400] text-[#172c44] scale-110 shadow-[0_0_10px_rgba(244,180,0,0.5)]'
                    : 'bg-white/10 text-white/50'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-[#f4b400] h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 pb-6 max-w-md mx-auto mt-2">
        {renderCurrentStep()}
      </div>
    </div>
  );
}
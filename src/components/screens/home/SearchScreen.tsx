import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, Star, Loader2, AlertTriangle, MessageCircle, User, Clock, X, Shield, ChevronRight } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';
import { getAvailableMatches } from '../../../services/matchService';
import { getPublicTeams, searchTeams } from '../../../services/teamService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { getUserLocationCached, haversineKm } from '../../../services/locationService';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment, DocumentData, collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// --- INICIO: COMPONENTE DE FILTRO (MEJORADO) ---

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  filters: { date: string; time: string; location: string };
  onFilterChange: (key: keyof FilterDrawerProps['filters'], value: string) => void;
}

function FilterDrawer({
  isOpen,
  onClose,
  onApply,
  onClear,
  filters,
  onFilterChange
}: FilterDrawerProps) {

  const handleClear = () => {
    onClear();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end" onClick={onClose}>
      {/* Contenido del Drawer con mejor contraste y visibilidad */}
      <div
        className="bg-white w-full rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300 border-t border-gray-200"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-[#172c44]">Filtrar Partidos</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-gray-100 rounded-full">
            <X size={24} />
          </Button>
        </div>

        <div className="space-y-5">
          {/* Filtro de Fecha */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => onFilterChange('date', e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Filtro de Hora */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Hora</label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="time"
                value={filters.time}
                onChange={(e) => onFilterChange('time', e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#00a884]"
              />
            </div>
          </div>

          {/* Filtro de Ubicación */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Ubicación</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                placeholder="Ej: Estadio Nacional, Santiago..."
                value={filters.location}
                onChange={(e) => onFilterChange('location', e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 focus:bg-white focus:border-[#00a884] placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleClear} className="border-gray-300 text-gray-700 hover:bg-gray-50">
            Limpiar
          </Button>
          <Button onClick={onApply} className="bg-[#00a884] hover:bg-[#00a884]/90 text-white shadow-md">
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  );
}
// --- FIN: COMPONENTE DE FILTRO ---

// --- INICIO: COMPONENTE DE SELECCIÓN DE EQUIPO ---
interface TeamSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  myTeams: any[];
  onSelectTeam: (team: any) => void;
  onJoinAsPlayer: () => void;
  isProcessing: boolean;
}

function TeamSelectorModal({
  isOpen,
  onClose,
  myTeams,
  onSelectTeam,
  onJoinAsPlayer,
  isProcessing
}: TeamSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#172c44] p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">¿Cómo quieres unirte?</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="p-4 space-y-4">
          <p className="text-gray-600 text-sm">Selecciona si deseas unirte solo tú o inscribir a todo tu equipo.</p>
          
          <Button 
            variant="outline" 
            className="w-full justify-between h-auto py-3 border-2 hover:border-[#00a884] hover:text-[#00a884]"
            onClick={onJoinAsPlayer}
            disabled={isProcessing}
          >
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-full"><User size={20} className="text-gray-600"/></div>
              <div className="text-left">
                <div className="font-semibold text-gray-800">Unirme solo yo</div>
                <div className="text-xs text-gray-500">Inscripción individual</div>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </Button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">O con tu equipo</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {myTeams.map(team => (
              <Button 
                key={team.id}
                variant="outline"
                className="w-full justify-between h-auto py-3 border hover:border-[#f4b400] hover:bg-[#fffdf0]"
                onClick={() => onSelectTeam(team)}
                disabled={isProcessing}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#f4b400]/20 p-2 rounded-full"><Shield size={20} className="text-[#f4b400]"/></div>
                  <div className="text-left">
                    <div className="font-semibold text-[#172c44]">{team.name}</div>
                    <div className="text-xs text-gray-500">
                      {team.members?.length || 0} miembros • {team.sport}
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </Button>
            ))}
            
            {myTeams.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm italic">
                No eres capitán de ningún equipo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// --- FIN: COMPONENTE DE SELECCIÓN DE EQUIPO ---


interface SearchScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack?: () => void;
}

export function SearchScreen({ onNavigate, onBack }: SearchScreenProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('matches');
  
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  
  const [captainTeams, setCaptainTeams] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null); 
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({ date: '', time: '', location: '' });
  const [tempFilters, setTempFilters] = useState(filters);

  const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);
  const [selectedMatchForJoin, setSelectedMatchForJoin] = useState<any | null>(null);

  useEffect(() => {
    loadData();
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) loadCaptainTeams(user.uid);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const getLoc = async () => {
      const loc = await getUserLocationCached();
      setUserLocation(loc);
    };
    getLoc();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [matchesData, teamsData] = await Promise.all([
        getAvailableMatches(),
        getPublicTeams()
      ]);
      setAllMatches(matchesData);
      setMatches(matchesData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCaptainTeams = async (uid: string) => {
    try {
      const q = query(collection(db, "teams"), where("captainId", "==", uid));
      const querySnapshot = await getDocs(q);
      const myTeamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCaptainTeams(myTeamsData);
    } catch (error) {
      console.error("Error cargando equipos del capitán:", error);
    }
  };

  // Buscar equipos y PARTIDOS
  useEffect(() => {
    if (activeTab === 'teams') {
        if (searchQuery.trim()) {
            searchTeamsData();
        } else {
            getPublicTeams().then(setTeams).catch(() => setError('Error al recargar equipos'));
        }
    }
  }, [searchQuery, activeTab]);

  // --- FILTRO Y BÚSQUEDA COMBINADOS ---
  // AQUI arreglamos que la barra de búsqueda funcione para partidos
  useEffect(() => {
    const timeToMinutes = (timeStr: string | null | undefined): number => {
      if (!timeStr) return -1;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return -1;
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      return (hours * 60) + minutes;
    };

    if (activeTab === 'matches') {
      let tempMatches = [...allMatches];

      // 1. Filtrar por BÚSQUEDA (Search Bar)
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase();
        tempMatches = tempMatches.filter(match => {
            const court = (match.courtName || '').toLowerCase();
            const address = (match.location?.address || '').toLowerCase();
            const sport = (match.sport || '').toLowerCase();
            return court.includes(lowerQuery) || address.includes(lowerQuery) || sport.includes(lowerQuery);
        });
      }

      // 2. Filtrar por FILTROS DEL DRAWER
      if (filters.date) {
        tempMatches = tempMatches.filter(match => {
          if (!match.date?.seconds) return false;
          const matchDate = new Date(match.date.seconds * 1000).toISOString().split('T')[0];
          return matchDate === filters.date;
        });
      }

      if (filters.time) {
        const filterMinutes = timeToMinutes(filters.time);
        tempMatches = tempMatches.filter(match => {
          const matchMinutes = timeToMinutes(match.time);
          if (matchMinutes === -1) return false;
          return matchMinutes === filterMinutes;
        });
      }

      if (filters.location) {
        const query = filters.location.toLowerCase();
        tempMatches = tempMatches.filter(match => {
          const address = (match.location?.address || '').toLowerCase();
          const courtName = (match.courtName || '').toLowerCase();
          return address.includes(query) || courtName.includes(query);
        });
      }
      setMatches(tempMatches);
    }
  }, [filters, allMatches, activeTab, searchQuery]); // Añadido searchQuery a dependencias

  // --- Ordenar por distancia ---
  useEffect(() => {
    if (!userLocation || activeTab !== 'matches') return;
    const mapped = matches.map((m) => {
      const lc = m.location;
      const coords = lc && typeof lc.lat === 'number' && typeof lc.lng === 'number' ? { lat: lc.lat, lng: lc.lng } : null;
      if (coords) {
        const km = haversineKm(userLocation, coords);
        return { ...m, distance: `${km.toFixed(1)} km` };
      }
      return { ...m, distance: 'N/A' };
    });
    const sorted = mapped.sort((a, b) => {
      const da = typeof a.distance === 'string' && a.distance.endsWith(' km') ? parseFloat(a.distance) : Number.POSITIVE_INFINITY;
      const db = typeof b.distance === 'string' && b.distance.endsWith(' km') ? parseFloat(b.distance) : Number.POSITIVE_INFINITY;
      return da - db;
    });
    setMatches(sorted);
  }, [userLocation, activeTab]);

  const searchTeamsData = async () => {
    setIsLoading(true);
    try {
      const searchResults = await searchTeams(searchQuery);
      setTeams(searchResults);
    } catch (err) {
      console.error('Error searching teams:', err);
      setError('Error al buscar equipos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateJoin = (match: DocumentData) => {
    if (!currentUser) {
      setError("Debes iniciar sesión para unirte.");
      return;
    }
    if (captainTeams.length > 0) {
      setSelectedMatchForJoin(match);
      setIsTeamSelectorOpen(true);
    } else {
      handleJoinMatch(match);
    }
  };

  const handleJoinMatch = async (match: DocumentData) => {
    setIsTeamSelectorOpen(false);
    setSelectedMatchForJoin(null);

    if (!currentUser) return;
    setJoiningMatchId(match.id);
    setError(null);
    
    try {
      const matchId = match.id;
      const matchRef = doc(db, "matches", matchId);
      const matchSnap = await getDoc(matchRef);
      
      if (!matchSnap.exists()) throw new Error("Este partido ya no existe.");
      
      const matchData = matchSnap.data();
      const playersList: string[] = matchData.players || [];
      
      if (playersList.length >= matchData.maxPlayers) throw new Error("¡Lo sentimos! El partido ya está lleno.");
      if (playersList.includes(currentUser.uid)) { onNavigate('chat'); return; }

      await updateDoc(matchRef, {
        players: arrayUnion(currentUser.uid),
        currentPlayers: increment(1)
      });
      
      await updateChatAndNotify(matchId, matchData, [currentUser.uid], currentUser.displayName || 'Jugador', 'individual');
      
      console.log("¡Unido al partido!");
      onNavigate('chat');
    } catch (err: any) {
      console.error("Error al unirse al partido:", err);
      setError(err.message || "No se pudo unir al partido.");
    } finally {
      setJoiningMatchId(null);
    }
  };

  // --- LÓGICA DE UNIRSE A PARTIDO (COMO EQUIPO - CORREGIDA) ---
  const handleJoinMatchAsTeam = async (team: any) => {
    if (!selectedMatchForJoin || !currentUser) return;
    
    setIsTeamSelectorOpen(false);
    setJoiningMatchId(selectedMatchForJoin.id);
    setError(null);

    try {
      const matchId = selectedMatchForJoin.id;
      const matchRef = doc(db, "matches", matchId);
      
      // 1. OBTENER INFORMACIÓN FRESCA DEL EQUIPO
      const teamRef = doc(db, "teams", team.id);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) throw new Error("El equipo no existe.");
      const teamData = teamSnap.data();

      // 2. OBTENER INFORMACIÓN DEL PARTIDO
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) throw new Error("El partido ya no existe.");

      const matchData = matchSnap.data();
      const currentPlayersCount = matchData.currentPlayers || 0;
      const maxPlayers = matchData.maxPlayers || 0;
      
      // 3. PROCESAR MIEMBROS DESDE LA DB
      const dbMembers = teamData.members || [];
      const teamMembers = [...dbMembers];
      if (!teamMembers.includes(currentUser.uid)) {
        teamMembers.push(currentUser.uid);
      }
      
      const uniqueMembers = [...new Set(teamMembers)] as string[];
      const neededSlots = uniqueMembers.length;
      const availableSlots = maxPlayers - currentPlayersCount;

      if (neededSlots > availableSlots) {
        throw new Error(`No hay espacio suficiente. Tu equipo son ${neededSlots} jugadores y solo quedan ${availableSlots} cupos.`);
      }

      // 4. ACTUALIZAR
      await updateDoc(matchRef, {
        players: arrayUnion(...uniqueMembers),
        currentPlayers: increment(neededSlots)
      });

      await updateChatAndNotify(matchId, matchData, uniqueMembers, team.name, 'team');
      
      console.log(`¡Equipo ${team.name} unido al partido!`);
      setSelectedMatchForJoin(null);
      onNavigate('chat');

    } catch (err: any) {
      console.error("Error uniendo equipo:", err);
      setError(err.message || "Error al unir el equipo.");
    } finally {
      setJoiningMatchId(null);
    }
  };

  const updateChatAndNotify = async (matchId: string, matchData: DocumentData, newParticipantIds: string[], nameOrUser: string, type: 'individual' | 'team') => {
    const ownerId = matchData.ownerId || matchData.captainId;
    const currentPlayers = matchData.players || [];
    const courtOwnerId = matchData.courtOwnerId; 

    const allParticipants = [ownerId, courtOwnerId, ...currentPlayers, ...newParticipantIds];
    const uniqueParticipants = [...new Set(allParticipants.filter(Boolean))];

    const chatRef = doc(db, "chats", matchId);
    const chatSnap = await getDoc(chatRef);

    const messageText = type === 'team' 
      ? `El equipo ${nameOrUser} se ha unido al partido.`
      : `${nameOrUser} se ha unido al partido.`;

    if (chatSnap.exists()) {
      await updateDoc(chatRef, { 
        participantsUids: uniqueParticipants,
        lastMessage: messageText,
        lastMessageTimestamp: new Date()
      });
    } else {
      await setDoc(chatRef, {
        id: matchId, 
        name: `Partido - ${matchData.courtName || 'Chat de Partido'}`, 
        type: 'match',
        participantsUids: uniqueParticipants, 
        ownerId: ownerId,
        lastMessage: messageText,
        lastMessageTimestamp: new Date(),
      });
    }

    const notifyIds = [ownerId, courtOwnerId].filter(Boolean).filter(id => id !== currentUser?.uid);
    const uniqueNotifyIds = [...new Set(notifyIds)];

    uniqueNotifyIds.forEach(async (targetId) => {
       try {
        await addDoc(collection(db, 'notifications'), {
          userId: targetId,
          type: 'match-join',
          title: type === 'team' ? 'Equipo unido' : 'Nuevo jugador',
          message: `${nameOrUser} se unió a tu partido en ${matchData.courtName || 'la cancha'}.`,
          data: { matchId },
          createdAt: serverTimestamp(),
          read: false,
        });
      } catch (e) { console.log("Error creando notificación", e); }
    });
  };

  const handleJoinTeam = async (team: DocumentData) => {
    if (!currentUser) { setError("Debes iniciar sesión."); return; }
    setJoiningTeamId(team.id);
    setError(null);
    try {
      const teamRef = doc(db, "teams", team.id);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) throw new Error("Equipo no existe.");
      const teamData = teamSnap.data();
      const membersList: string[] = teamData.members || [];
      
      if ((membersList.length + 1) > teamData.maxPlayers) throw new Error("El equipo está lleno.");
      if (membersList.includes(currentUser.uid)) { onNavigate('my-teams'); return; }

      await updateDoc(teamRef, {
        members: arrayUnion(currentUser.uid),
        currentPlayers: increment(1)
      });
      onNavigate('my-teams');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setJoiningTeamId(null);
    }
  };

  const handleOpenFilter = () => { setTempFilters(filters); setIsFilterOpen(true); };
  const handleFilterChange = (key: keyof typeof tempFilters, value: string) => setTempFilters(prev => ({ ...prev, [key]: value }));
  const handleApplyFilters = () => { setFilters(tempFilters); setIsFilterOpen(false); };
  const handleClearFilters = () => { 
    const clean = { date: '', time: '', location: '' };
    setFilters(clean); setTempFilters(clean); setIsFilterOpen(false); 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      <AppHeader 
        title="Buscar" 
        showLogo={true}
        showBackButton={false}
        rightContent={
          <Button variant="outline" size="icon" onClick={handleOpenFilter}>
            <Filter size={20} className="text-[#172c44]" />
          </Button>
        }
      />
      
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar partidos, equipos, jugadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="matches">Partidos</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
            <TabsTrigger value="players">Jugadores</TabsTrigger>
            <TabsTrigger value="courts">Canchas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 pb-4">
        <Tabs value={activeTab}>
          <TabsContent value="matches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Partidos Disponibles</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-white/90">{matches.length} resultados</span>
                <Button variant="outline" size="sm" onClick={async () => { const loc = await getUserLocationCached(0); setUserLocation(loc); }}>
                  Actualizar ubicación
                </Button>
              </div>
            </div>
            
            {isLoading && activeTab === 'matches' && <div className="text-center py-8"><Loader2 className="animate-spin text-white" /></div>}
            {error && activeTab === 'matches' && (
              <div className="text-center py-8 text-red-300">
                <AlertTriangle className="mx-auto mb-2" />
                {error}
              </div>
            )}
            
            {!isLoading && !error && matches.length === 0 && (
              <div className="text-center py-8">
                <div className="text-white/70">No se encontraron partidos.</div>
                {(filters.date || filters.time || filters.location || searchQuery) && (
                   <Button onClick={() => {handleClearFilters(); setSearchQuery('');}} className="mt-4 bg-[#f4b400] text-[#172c44]">Limpiar Búsqueda</Button>
                )}
              </div>
            )}
            
            {!isLoading && !error && matches.map((match) => { 
              const isFull = (match.currentPlayers || 0) >= (match.maxPlayers || 0);
              const isJoined = match.players?.includes(currentUser?.uid);
              const isJoining = joiningMatchId === match.id;

              return (
                <Card 
                  key={match.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigate('match-detail', match)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{match.sport}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                            <span className="text-sm text-gray-600">{match.rating || 0}</span>
                          </div>
                        </div>
                        <h3 className="text-[#172c44] mt-1 font-semibold">
                          {[match.courtName, match.location?.address].filter(Boolean).join(' - ') || 'Ubicación no disponible'}
                        </h3>
                      </div>
                      <span className="text-[#00a884] font-bold">
                        ${match.pricePerPlayer ? match.pricePerPlayer.toLocaleString() : 'Gratis'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1"><MapPin size={14} /><span>{match.distance || 'N/A'}</span></div>
                      <div className="flex items-center gap-1"><Calendar size={14} /><span>{match.date ? new Date(match.date.seconds * 1000).toLocaleDateString() : 'N/A'} {match.time}</span></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={14} className="text-[#172c44]" />
                        <span className="text-gray-600">{match.currentPlayers || 0}/{match.maxPlayers || 0} jugadores</span>
                      </div>
                      <Button
                        size="sm"
                        className={isJoined ? "bg-gray-500 hover:bg-gray-600" : "bg-[#00a884] hover:bg-[#00a884]/90"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isJoined) onNavigate('chat');
                          else handleInitiateJoin(match);
                        }}
                        disabled={isJoining || (isFull && !isJoined)}
                      >
                        {isJoining ? <Loader2 size={16} className="animate-spin" /> : isJoined ? <><MessageCircle size={16} className="mr-2" />Ir al Chat</> : isFull ? 'Lleno' : 'Unirse'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Equipos</h2>
              <span className="text-sm text-white/90">{teams.length} resultados</span>
            </div>
            {isLoading && activeTab === 'teams' ? <div className="text-center py-8"><Loader2 className="animate-spin text-white" /></div> : 
             teams.map((team) => {
                const membersCount = team.members?.length || 0;
                const isFullTeam = membersCount >= (team.maxPlayers || 10);
                const isMember = team.members?.includes(currentUser?.uid);
                const isJoiningTeam = joiningTeamId === team.id;
                
                return (
                  <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate('team-details', team)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-[#172c44] mb-1 font-bold">{team.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{team.sport}</Badge>
                            <span className="text-sm text-gray-600">{team.level || 'Intermedio'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1"><Users size={14} /><span>{membersCount} miembros</span></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-semibold ${!isFullTeam ? 'text-[#00a884]' : 'text-gray-500'}`}>{!isFullTeam ? 'Buscan jugadores' : 'Equipo completo'}</span>
                        <Button 
                          size="sm" 
                          className={isMember ? "bg-gray-500 hover:bg-gray-600" : "bg-[#00a884] hover:bg-[#00a884]/90"} 
                          onClick={(e) => { e.stopPropagation(); isMember ? onNavigate('my-teams') : handleJoinTeam(team); }} 
                          disabled={isJoiningTeam || (isFullTeam && !isMember)}
                        >
                          {isJoiningTeam ? <Loader2 size={16} className="animate-spin" /> : isMember ? 'Mis Equipos' : isFullTeam ? 'Lleno' : 'Unirse'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            }
          </TabsContent>
          
          <TabsContent value="players"><div className="text-center py-8 text-white/70">Búsqueda de jugadores no implementada</div></TabsContent>
          <TabsContent value="courts"><div className="text-center py-8 text-white/70">Búsqueda de canchas no implementada</div></TabsContent>
        </Tabs>
      </div>

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
      />

      <TeamSelectorModal 
        isOpen={isTeamSelectorOpen}
        onClose={() => { setIsTeamSelectorOpen(false); setSelectedMatchForJoin(null); }}
        myTeams={captainTeams}
        onSelectTeam={handleJoinMatchAsTeam}
        onJoinAsPlayer={() => selectedMatchForJoin && handleJoinMatch(selectedMatchForJoin)}
        isProcessing={joiningMatchId !== null}
      />
    </div>
  );
}
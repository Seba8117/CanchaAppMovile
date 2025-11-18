import { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Calendar, Users, Star, Loader2, AlertTriangle, MessageCircle, User, Clock, X } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';
import { getAvailableMatches } from '../../../services/matchService';
import { getPublicTeams, searchTeams } from '../../../services/teamService';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment, DocumentData } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// --- INICIO: COMPONENTE DE FILTRO ---

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
    // Overlay
    <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose}>
      {/* Contenido del Drawer */}
      <div
        className="fixed bottom-20 left-0 right-0 bg-white p-6 rounded-t-2xl shadow-lg z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#172c44]">Filtrar Partidos</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={24} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Filtro de Fecha */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="date"
              value={filters.date}
              onChange={(e) => onFilterChange('date', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de Hora */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="time"
              value={filters.time}
              onChange={(e) => onFilterChange('time', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro de Ubicación */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Buscar por ubicación (cancha o dirección)"
              value={filters.location}
              onChange={(e) => onFilterChange('location', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleClear} className="text-gray-700">
            Limpiar Filtros
          </Button>
          <Button onClick={onApply} className="bg-[#00a884] hover:bg-[#00a884]/90">
            Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}
// --- FIN: NUEVO COMPONENTE DE FILTRO ---


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
  const [players, setPlayers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null); 
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    date: '',
    time: '',
    location: '',
  });

  // Estado temporal para los filtros mientras el drawer está abierto
  const [tempFilters, setTempFilters] = useState(filters);

  // Cargar datos
  useEffect(() => {
    loadData();
    const unsubscribe = auth.onAuthStateChanged(user => setCurrentUser(user));
    return () => unsubscribe();
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

  // Buscar equipos (sin cambios)
  useEffect(() => {
    if (searchQuery.trim() && activeTab === 'teams') {
      searchTeamsData();
    } else if (!searchQuery.trim() && activeTab === 'teams') {
      getPublicTeams().then(setTeams).catch(() => setError('Error al recargar equipos'));
    }
  }, [searchQuery, activeTab]);

  
  // --- useEffect para aplicar filtros (CON HORA EXACTA) ---
  useEffect(() => {
    
    const timeToMinutes = (timeStr: string | null | undefined): number => {
      if (!timeStr) return -1;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return -1;
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (isNaN(hours) || isNaN(minutes)) return -1;
      return (hours * 60) + minutes;
    };

    if (activeTab === 'matches') {
      let tempMatches = [...allMatches];

      // Filtro de Fecha
      if (filters.date) {
        tempMatches = tempMatches.filter(match => {
          if (!match.date?.seconds) return false;
          const matchDate = new Date(match.date.seconds * 1000).toISOString().split('T')[0];
          return matchDate === filters.date;
        });
      }

      // Filtro de Hora
      if (filters.time) {
        const filterMinutes = timeToMinutes(filters.time);
        tempMatches = tempMatches.filter(match => {
          const matchMinutes = timeToMinutes(match.time);
          if (matchMinutes === -1) return false;
          
          // --- ¡CAMBIO CLAVE AQUÍ! ---
          // Compara que sea exactamente igual, no "mayor o igual"
          return matchMinutes === filterMinutes;
        });
      }

      // Filtro de Ubicación
      if (filters.location) {
        const query = filters.location.toLowerCase();
        tempMatches = tempMatches.filter(match => {
          const address = (match.location?.address || '').toLowerCase();
          const courtName = (match.courtName || '').toLowerCase();
          return address.includes(query) || courtName.includes(query);
        });
      }

      setMatches(tempMatches); // Actualiza la lista visible
    }
  }, [filters, allMatches, activeTab]);


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

  // --- Lógica de Unirse a Partido (sin cambios) ---
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
      console.log("¡Unido al partido y chat creado/actualizado!");
      onNavigate('chat');
    } catch (err: any) {
      console.error("Error al unirse al partido:", err);
      setError(err.message || "No se pudo unir al partido.");
    } finally {
      setJoiningMatchId(null);
    }
  };

  // --- Lógica de Unirse a Equipo (sin cambios) ---
  const handleJoinTeam = async (team: DocumentData) => {
    if (!currentUser) {
      setError("Debes iniciar sesión para unirte a un equipo.");
      return;
    }
    
    setJoiningTeamId(team.id);
    setError(null);

    try {
      const teamId = team.id;
      const teamRef = doc(db, "teams", teamId);

      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) {
        throw new Error("Este equipo ya no existe.");
      }
      
      const teamData = teamSnap.data();
      const captainId = teamData.captainId;
      const membersList: string[] = teamData.members || [];

      if ((membersList.length + 1) > teamData.maxPlayers) {
        throw new Error("¡Lo sentimos! El equipo ya está lleno.");
      }
      if (membersList.includes(currentUser.uid)) {
          onNavigate('my-teams'); 
          return;
      }

      await updateDoc(teamRef, {
        members: arrayUnion(currentUser.uid),
        currentPlayers: increment(1)
      });

      const chatRef = doc(db, "chats", teamId);
      const chatSnap = await getDoc(chatRef);
      
      const allParticipants = [captainId, ...membersList, currentUser.uid];
      const uniqueParticipants = [...new Set(allParticipants.filter(Boolean))];

      if (chatSnap.exists()) {
        await updateDoc(chatRef, { participantsUids: uniqueParticipants });
      } else {
        await setDoc(chatRef, {
          id: teamId,
          name: `Equipo - ${teamData.name}`,
          type: 'team',
          participantsUids: uniqueParticipants,
          ownerId: captainId,
          lastMessage: `${currentUser.displayName || 'Un nuevo jugador'} se ha unido al equipo.`,
          lastMessageTimestamp: new Date(),
        });
      }
      
      console.log("¡Unido al equipo y chat creado/actualizado!");
      onNavigate('my-teams');

    } catch (err: any) {
      console.error("Error al unirse al equipo:", err);
      setError(err.message || "No se pudo unir al equipo.");
    } finally {
      setJoiningTeamId(null);
    }
  };

  // --- FUNCIONES PARA EL FILTRO (sin cambios) ---
  
  const handleOpenFilter = () => {
    setTempFilters(filters);
    setIsFilterOpen(true);
  };
  
  const handleFilterChange = (key: keyof typeof tempFilters, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setIsFilterOpen(false);
  };

  const handleClearFilters = () => {
    setFilters({ date: '', time: '', location: '' });
    setTempFilters({ date: '', time: '', location: '' });
    setIsFilterOpen(false);
  };
  // --- FIN FUNCIONES FILTRO ---


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header */}
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
        {/* Input de búsqueda (sin cambios) */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar partidos, equipos, jugadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs (sin cambios) */}
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
          {/* Partidos Tab (sin cambios) */}
          <TabsContent value="matches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Partidos Disponibles</h2>
              <span className="text-sm text-white/90">{matches.length} resultados</span>
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
                <div className="text-white/70">No se encontraron partidos con esos filtros.</div>
                {(filters.date || filters.time || filters.location) && (
                   <Button onClick={handleClearFilters} className="mt-4 bg-[#f4b400] hover:bg-[#f4b400]/90 text-[#172c44]">
                     Limpiar Filtros
                   </Button>
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
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span>{match.distance || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{match.date ? new Date(match.date.seconds * 1000).toLocaleDateString('es-ES') : 'N/A'} {match.time}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1 text-sm">
                        <Users size={14} className="text-[#172c44]" />
                        <span className="text-gray-600">
                          {match.currentPlayers || 0}/{match.maxPlayers || 0} jugadores
                        </span>
                      </div>
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
              );
            })}
          </TabsContent>

          {/* Equipos Tab (sin cambios) */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Equipos</h2>
              <span className="text-sm text-white/90">{teams.length} resultados</span>
            </div>
            
            {isLoading && activeTab === 'teams' ? (
              <div className="text-center py-8"><Loader2 className="animate-spin text-white" /></div>
            ) : error && activeTab === 'teams' ? (
              <div className="text-center py-8">
                <div className="text-red-300">{error}</div>
                <Button onClick={loadData} className="mt-2 bg-[#00a884] hover:bg-[#00a884]/90">Reintentar</Button>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-8"><div className="text-white/70">No se encontraron equipos</div></div>
            ) : (
              teams.map((team) => {
                const membersCount = team.members?.length || 0;
                const maxPlayers = team.maxPlayers || 10;
                const isFullTeam = membersCount >= maxPlayers;
                const isMember = team.members?.includes(currentUser?.uid);
                const isJoiningTeam = joiningTeamId === team.id;
                
                return (
                  <Card 
                    key={team.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onNavigate('team-details', team)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-[#172c44] mb-1 font-bold">{team.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{team.sport}</Badge>
                            <span className="text-sm text-gray-600">{team.level || 'Intermedio'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                          <span className="text-sm text-gray-600">{team.rating || '4.5'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1"><Users size={14} /><span>{membersCount} miembros</span></div>
                        <span>Máx: {maxPlayers}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-semibold ${!isFullTeam ? 'text-[#00a884]' : 'text-gray-500'}`}>
                          {!isFullTeam ? 'Buscan jugadores' : 'Equipo completo'}
                        </span>
                        
                        <Button 
                          size="sm" 
                          className={isMember ? "bg-gray-500 hover:bg-gray-600" : "bg-[#00a884] hover:bg-[#00a884]/90"} 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if (isMember) {
                              onNavigate('my-teams'); 
                            } else {
                              handleJoinTeam(team);
                            }
                          }} 
                          disabled={isJoiningTeam || (isFullTeam && !isMember)}
                        >
                          {isJoiningTeam ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : isMember ? (
                            'Mis Equipos'
                          ) : isFullTeam ? (
                            'Lleno'
                          ) : (
                            'Unirse'
                          )}
                        </Button>

                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Jugadores Tab (sin cambios) */}
          <TabsContent value="players" className="space-y-4">
            <div className="text-center py-8"><div className="text-white/70">Búsqueda de jugadores no implementada</div></div>
          </TabsContent>

          {/* Canchas Tab (sin cambios) */}
          <TabsContent value="courts" className="space-y-4">
            <div className="text-center py-8"><div className="text-white/70">Búsqueda de canchas no implementada</div></div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Renderizado del Drawer de Filtros (sin cambios) */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        filters={tempFilters}
        onFilterChange={handleFilterChange}
      />
    </div>
  );
}
import { useState, useEffect } from 'react';
// Añadidos: MessageCircle y User
import { Search, Filter, MapPin, Calendar, Users, Star, Loader2, AlertTriangle, MessageCircle, User } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';
import { getAvailableMatches } from '../../../services/matchService';
import { getPublicTeams, searchTeams } from '../../../services/teamService';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, increment, DocumentData } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
// --- FIN: Importaciones de Firebase ---


interface SearchScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack?: () => void;
}

export function SearchScreen({ onNavigate, onBack }: SearchScreenProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('matches');
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [courts, setCourts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null); // <-- NUEVO ESTADO PARA EQUIPOS
  const [error, setError] = useState<string | null>(null);

  // Cargar datos reales de Firebase
  useEffect(() => {
    loadData();
    
    // Escuchar cambios de autenticación
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
      setMatches(matchesData);
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar equipos cuando cambie el query
  useEffect(() => {
    if (searchQuery.trim() && activeTab === 'teams') {
      searchTeamsData();
    } else if (!searchQuery.trim() && activeTab === 'teams') {
      getPublicTeams().then(setTeams).catch(() => setError('Error al recargar equipos'));
    }
    // TODO: Lógica de búsqueda para otras pestañas
  }, [searchQuery, activeTab]);

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

  // --- LÓGICA PARA UNIRSE AL PARTIDO (SIN CAMBIOS) ---
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
  // --- FIN LÓGICA PARTIDO ---

  // --- NUEVA LÓGICA PARA UNIRSE AL EQUIPO ---
  const handleJoinTeam = async (team: DocumentData) => {
    if (!currentUser) {
      setError("Debes iniciar sesión para unirte a un equipo.");
      return;
    }
    
    setJoiningTeamId(team.id); // Usar el estado de carga de equipo
    setError(null);

    try {
      const teamId = team.id;
      const teamRef = doc(db, "teams", teamId); // Colección 'teams'

      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) {
        throw new Error("Este equipo ya no existe.");
      }
      
      const teamData = teamSnap.data();
      const captainId = teamData.captainId;
      const membersList: string[] = teamData.members || [];

      if ((membersList.length + 1) > teamData.maxPlayers) { // +1 por el usuario actual
        throw new Error("¡Lo sentimos! El equipo ya está lleno.");
      }
      if (membersList.includes(currentUser.uid)) {
         onNavigate('my-teams'); // Si ya es miembro, ir a "Mis Equipos"
         return;
      }

      // 2. Unir al jugador al equipo en Firestore
      await updateDoc(teamRef, {
        members: arrayUnion(currentUser.uid), // Campo 'members'
        currentPlayers: increment(1)
      });

      // 3. Crear o actualizar el chat del equipo
      const chatRef = doc(db, "chats", teamId); // Usar ID del equipo como ID del chat
      const chatSnap = await getDoc(chatRef);
      
      const allParticipants = [captainId, ...membersList, currentUser.uid];
      const uniqueParticipants = [...new Set(allParticipants.filter(Boolean))];

      if (chatSnap.exists()) {
        await updateDoc(chatRef, { participantsUids: uniqueParticipants });
      } else {
        await setDoc(chatRef, {
          id: teamId,
          name: `Equipo - ${teamData.name}`, // Nombre del chat de equipo
          type: 'team', // Tipo 'team'
          participantsUids: uniqueParticipants,
          ownerId: captainId, // El "dueño" del chat es el capitán
          lastMessage: `${currentUser.displayName || 'Un nuevo jugador'} se ha unido al equipo.`,
          lastMessageTimestamp: new Date(),
        });
      }
      
      // 4. Redirigir a "Mis Equipos"
      console.log("¡Unido al equipo y chat creado/actualizado!");
      onNavigate('my-teams'); // Redirige a "Mis Equipos" para ver el equipo unido

    } catch (err: any) {
      console.error("Error al unirse al equipo:", err);
      setError(err.message || "No se pudo unir al equipo.");
    } finally {
      setJoiningTeamId(null); // Usar el estado de carga de equipo
    }
  };
  // --- FIN DE LA NUEVA LÓGICA ---


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header */}
      <AppHeader 
        title="Buscar" 
        showLogo={true}
        showBackButton={false}
        rightContent={
          <Button variant="outline" size="icon">
            <Filter size={20} className="text-[#172c44]" />
          </Button>
        }
      />
      
      <div className="p-4">
        {/* Input de búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            placeholder="Buscar partidos, equipos, jugadores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
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
          {/* Partidos Tab (SIN CAMBIOS) */}
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

          {/* Equipos Tab (BOTÓN CORREGIDO) */}
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
                // --- LÓGICA DE BOTÓN DE EQUIPO ---
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
                        
                        {/* --- BOTÓN DE EQUIPO CORREGIDO --- */}
                        <Button 
                          size="sm" 
                          className={isMember ? "bg-gray-500 hover:bg-gray-600" : "bg-[#00a884] hover:bg-[#00a884]/90"} 
                          onClick={(e) => { 
                            e.stopPropagation(); // Evita que el clic en el botón active el clic de la tarjeta
                            if (isMember) {
                              onNavigate('my-teams'); // Si ya es miembro, ir a "Mis Equipos"
                            } else {
                              handleJoinTeam(team); // Si no, unirse
                            }
                          }} 
                          disabled={isJoiningTeam || (isFullTeam && !isMember)}
                        >
                          {isJoiningTeam ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : isMember ? (
                            'Mis Equipos' // Texto para "ya unido"
                          ) : isFullTeam ? (
                            'Lleno'
                          ) : (
                            'Unirse'
                          )}
                        </Button>
                        {/* --- FIN DEL BOTÓN MODIFICADO --- */}

                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Jugadores Tab */}
          <TabsContent value="players" className="space-y-4">
            <div className="text-center py-8"><div className="text-white/70">Búsqueda de jugadores no implementada</div></div>
            {/* ... (map de players) ... */}
          </TabsContent>

          {/* Canchas Tab */}
          <TabsContent value="courts" className="space-y-4">
             <div className="text-center py-8"><div className="text-white/70">Búsqueda de canchas no implementada</div></div>
            
            {courts.map((court) => (
              <Card key={court.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  {/* ... (contenido de la tarjeta de cancha) ... */}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
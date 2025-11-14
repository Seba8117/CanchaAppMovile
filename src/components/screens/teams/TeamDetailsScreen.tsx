import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Users, User, Mail, Phone, Calendar, Trophy, Star, MoreVertical, Settings, Trash2, Loader2, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { AppHeader } from '../../common/AppHeader';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../Firebase/firebaseConfig';
import { auth } from '../../../Firebase/firebaseConfig';

interface TeamDetailsScreenProps {
  onBack: () => void;
  teamData?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export function TeamDetailsScreen({ onBack, teamData, onNavigate }: TeamDetailsScreenProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  
  // Usar useMemo para normalizar los datos solo cuando teamData cambia
  const team = useMemo(() => {
    if (!teamData) return null;
    return {
      ...teamData,
      captain: teamData.captain || { id: teamData.captainId, name: teamData.captainName },
      stats: teamData.stats || { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, trophies: 0 },
      members: teamData.members || [],
    };
  }, [teamData]);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!team || !team.members || team.members.length === 0) {
        setLoadingPlayers(false);
        return;
      }
      setLoadingPlayers(true);
      try {
        const playerPromises = team.members.map(async (memberId: string) => {
          const playerDocRef = doc(db, 'jugador', memberId);
          const playerDocSnap = await getDoc(playerDocRef);
          if (playerDocSnap.exists()) {
            return { 
              id: memberId, 
              ...playerDocSnap.data(),
              isCaptain: memberId === team.captainId,
            };
          }
          return { id: memberId, name: 'Jugador Desconocido', isCaptain: memberId === team.captainId };
        });
        const fetchedPlayers = await Promise.all(playerPromises);
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error("Error fetching team players:", error);
      } finally {
        setLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, [team]);

  // Datos de partidos recientes mock
  const recentMatches = [
    {
      id: 1,
      opponent: 'Águilas United',
      result: 'Victoria 3-1',
      date: '2024-02-28',
      competition: 'Liga Local'
    },
  ];

  // VERIFICACIÓN INICIAL: Si no hay datos del equipo, no se puede renderizar nada.
  if (!team) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  if (!team) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;
  }

  const isCaptain = auth.currentUser?.uid === team.captainId;
  const isOfficialTeam = team.type === 'official' || !team.type; // Assume official if not specified

  const handleDeleteTeam = () => {
    if (onNavigate) {
      onNavigate('delete-team', {
        ...team,
        captain: { ...team.captain, id: 1 }, // Add ID for captain
        members: players.map((player: any) => ({
          id: player.id,
          name: player.name,
          role: player.isCaptain ? 'captain' : 'member',
          image: undefined
        }))
      });
    }
  };

  const getPositionBadge = (position: string) => {
    const positionColors = {
      'Portero': 'bg-purple-500',
      'Defensor': 'bg-blue-500',
      'Mediocampista': 'bg-green-500',
      'Delantero': 'bg-red-500'
    };
    
    return (
      <Badge className={`${positionColors[position as keyof typeof positionColors] || 'bg-gray-500'} text-white text-xs`}>
        {position}
      </Badge>
    );
  };

  const getResultBadge = (result: string) => {
    if (result.includes('Victoria')) {
      return <Badge className="bg-green-500 text-white text-xs">Victoria</Badge>;
    } else if (result.includes('Empate')) {
      return <Badge className="bg-yellow-500 text-white text-xs">Empate</Badge>;
    } else {
      return <Badge className="bg-red-500 text-white text-xs">Derrota</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      <AppHeader 
        title="Detalles del Equipo" 
        showBackButton={true} 
        onBack={onBack}
        rightContent={
          isCaptain && isOfficialTeam && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="text-white">
                <Button variant="ghost" size="icon">
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar Equipo
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer text-red-600 focus:text-red-600"
                  onClick={handleDeleteTeam}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Equipo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }
      />

      <div className="p-4 pb-20 space-y-6">
        {/* Header del Equipo */}
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-2xl">
                  {team.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#172c44]">{team.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-[#00a884] text-white">{team.sport.charAt(0).toUpperCase() + team.sport.slice(1)}</Badge>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">Fundado en {team.founded}</span>
                  {isOfficialTeam && (
                    <>
                      <span className="text-gray-600">•</span>
                      <Badge className="bg-[#f4b400] text-[#172c44] text-xs font-bold">Oficial</Badge>
                    </>
                  )}
                </div>
              </div>
              <div className="text-center">
                <Trophy className="text-[#f4b400] mx-auto mb-1" size={24} />
                <p className="text-sm text-gray-600">{team.stats.trophies} Trofeos</p>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{team.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Capitán</p>
                <p className="text-[#172c44]">{team.captain.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Colores</p>
                <p className="text-[#172c44]">{team.colors}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning for temporary teams */}
        {!isOfficialTeam && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-yellow-800 mb-2">⏱️ Equipo Temporal</h3>
            <p className="text-yellow-700">
              Este equipo fue creado específicamente para un partido y se disolverá automáticamente al finalizar.
            </p>
          </div>
        )}

        {/* Tabs de Información */}
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 backdrop-blur-sm p-1 rounded-lg">
            <TabsTrigger value="players" className="text-white/70 data-[state=active]:bg-[#f4b400] data-[state=active]:text-[#172c44] data-[state=active]:shadow-md rounded-md font-semibold transition-all duration-200">Jugadores</TabsTrigger>
            <TabsTrigger value="stats" className="text-white/70 data-[state=active]:bg-[#f4b400] data-[state=active]:text-[#172c44] data-[state=active]:shadow-md rounded-md font-semibold transition-all duration-200">Estadísticas</TabsTrigger>
            <TabsTrigger value="history" className="text-white/70 data-[state=active]:bg-[#f4b400] data-[state=active]:text-[#172c44] data-[state=active]:shadow-md rounded-md font-semibold transition-all duration-200">Historial</TabsTrigger>
          </TabsList>

          {/* Tab Jugadores */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl">Plantilla</h2>
              <Badge className="bg-[#00a884] text-white">{players.length} jugadores</Badge>
            </div>

            {loadingPlayers ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div> :
            players.map((player: any) => (
              <Card key={player.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-[#172c44] text-white rounded-full flex items-center justify-center font-bold">
                      {player.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#172c44] font-medium">{player.name}</h3>
                        {player.id === team.captainId && (
                          <Badge className="bg-[#f4b400] text-[#172c44] text-xs flex items-center gap-1">
                            <Shield size={12} /> Capitán
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getPositionBadge(player.position)}
                        {player.age && <><span className="text-gray-600">•</span><span className="text-sm text-gray-600">{player.age} años</span></>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                        <span className="text-sm font-medium">{player.rating || 'N/A'}</span>
                      </div>
                      <p className="text-xs text-gray-600">{player.matchesPlayed} partidos</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-gray-600">Goles</p>
                      <p className="font-bold text-[#172c44]">{player.goals}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Asistencias</p>
                      <p className="font-bold text-[#172c44]">{player.assists}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600">Partidos</p>
                      <p className="font-bold text-[#172c44]">{player.matchesPlayed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab Estadísticas */}
          <TabsContent value="stats" className="space-y-4">
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-[#172c44]">Rendimiento General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-[#00a884] to-[#00a884]/80 text-white p-4 rounded-lg">
                    <p className="text-sm opacity-90">Partidos Jugados</p>
                    <p className="text-2xl font-bold">{team.stats.matchesPlayed}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-500 to-green-400 text-white p-4 rounded-lg">
                    <p className="text-sm opacity-90">Victorias</p>
                    <p className="text-2xl font-bold">{team.stats.wins}</p>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-white p-4 rounded-lg">
                    <p className="text-sm opacity-90">Empates</p>
                    <p className="text-2xl font-bold">{team.stats.draws}</p>
                  </div>
                  <div className="bg-gradient-to-r from-red-500 to-red-400 text-white p-4 rounded-lg">
                    <p className="text-sm opacity-90">Derrotas</p>
                    <p className="text-2xl font-bold">{team.stats.losses}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Efectividad</span>
                    <span className="font-bold text-[#172c44]">
                      {Math.round((team.stats.wins / team.stats.matchesPlayed) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#00a884] h-2 rounded-full" 
                      style={{width: `${(team.stats.wins / team.stats.matchesPlayed) * 100}%`}}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-gray-600">Goles a Favor</p>
                      <p className="font-bold text-[#172c44] text-xl">{team.stats.goalsFor}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Goles en Contra</p>
                      <p className="font-bold text-[#172c44] text-xl">{team.stats.goalsAgainst}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Historial */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-[#172c44] text-xl">Partidos Recientes</h2>
            </div>

            {recentMatches.map((match: any) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-[#172c44] font-medium">vs {match.opponent}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {match.competition}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(match.date).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getResultBadge(match.result)}
                      <span className="font-bold text-[#172c44]">{match.result.split(' ')[1]}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-gray-600">Información de contacto del capitán</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Mail size={16} className="text-[#00a884]" />
                    <span className="text-[#172c44]">{team.captain.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Phone size={16} className="text-[#00a884]" />
                    <span className="text-[#172c44]">{team.captain.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

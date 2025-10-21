import { useState } from 'react';
import { ArrowLeft, Users, User, Mail, Phone, Calendar, Trophy, Star, MoreVertical, Settings, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { AppHeader } from '../../common/AppHeader';

interface TeamDetailsScreenProps {
  onBack: () => void;
  teamData?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export function TeamDetailsScreen({ onBack, teamData, onNavigate }: TeamDetailsScreenProps) {
  // Mock current user data - in real app this would come from auth context
  const currentUserId = 1; // Assuming user is the captain for demo
  // Datos de ejemplo del equipo
  const team = teamData || {
    id: 1,
    name: 'Los Tigres FC',
    sport: 'Fútbol',
    captain: {
      name: 'Juan Pérez',
      email: 'juan@tigresfc.com',
      phone: '+56 9 8765 4321',
      position: 'Mediocampista'
    },
    founded: '2020',
    colors: 'Amarillo y Negro',
    homeGround: 'Estadio Municipal',
    description: 'Equipo amateur de fútbol con participación en ligas locales desde 2020. Enfoque en juego ofensivo y desarrollo de talentos jóvenes.',
    stats: {
      matchesPlayed: 45,
      wins: 28,
      draws: 10,
      losses: 7,
      goalsFor: 85,
      goalsAgainst: 32,
      trophies: 3
    },
    players: [
      {
        id: 1,
        name: 'Juan Pérez',
        position: 'Mediocampista',
        number: 10,
        age: 28,
        isCaptain: true,
        rating: 4.8,
        matchesPlayed: 42,
        goals: 15,
        assists: 8
      },
      {
        id: 2,
        name: 'Carlos Rodríguez',
        position: 'Portero',
        number: 1,
        age: 32,
        isCaptain: false,
        rating: 4.7,
        matchesPlayed: 45,
        goals: 0,
        assists: 2
      },
      {
        id: 3,
        name: 'Miguel Silva',
        position: 'Defensor',
        number: 4,
        age: 26,
        isCaptain: false,
        rating: 4.5,
        matchesPlayed: 38,
        goals: 3,
        assists: 5
      },
      {
        id: 4,
        name: 'Luis Torres',
        position: 'Delantero',
        number: 9,
        age: 24,
        isCaptain: false,
        rating: 4.6,
        matchesPlayed: 40,
        goals: 22,
        assists: 6
      },
      {
        id: 5,
        name: 'Diego Morales',
        position: 'Mediocampista',
        number: 8,
        age: 27,
        isCaptain: false,
        rating: 4.4,
        matchesPlayed: 35,
        goals: 8,
        assists: 12
      },
      {
        id: 6,
        name: 'Pedro Herrera',
        position: 'Defensor',
        number: 3,
        age: 29,
        isCaptain: false,
        rating: 4.3,
        matchesPlayed: 41,
        goals: 2,
        assists: 4
      }
    ],
    recentMatches: [
      {
        id: 1,
        opponent: 'Águilas United',
        result: 'Victoria 3-1',
        date: '2024-02-28',
        competition: 'Liga Local'
      },
      {
        id: 2,
        opponent: 'Leones de Oro',
        result: 'Empate 2-2',
        date: '2024-02-25',
        competition: 'Liga Local'
      },
      {
        id: 3,
        opponent: 'Dragones FC',
        result: 'Victoria 4-0',
        date: '2024-02-22',
        competition: 'Copa Regional'
      }
    ]
  };

  const isCaptain = currentUserId === team.captain.id || currentUserId === 1; // User is captain
  const isOfficialTeam = team.type === 'official' || !team.type; // Assume official if not specified

  const handleDeleteTeam = () => {
    if (onNavigate) {
      onNavigate('delete-team', {
        ...team,
        captain: { ...team.captain, id: 1 }, // Add ID for captain
        members: team.players.map((player: any) => ({
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
    <div className="min-h-screen bg-gray-50">
      <AppHeader 
        title="Detalles del Equipo" 
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
        }
        rightContent={
          isCaptain && isOfficialTeam && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
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
        <Card>
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
                  <Badge className="bg-[#00a884] text-white">{team.sport}</Badge>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">Fundado en {team.founded}</span>
                  {isOfficialTeam && (
                    <>
                      <span className="text-gray-600">•</span>
                      <Badge className="bg-[#f4b400] text-[#172c44] text-xs">Oficial</Badge>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">Jugadores</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
          </TabsList>

          {/* Tab Jugadores */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-[#172c44] text-xl">Plantilla</h2>
              <Badge className="bg-[#00a884] text-white">
                {team.players.length} jugadores
              </Badge>
            </div>

            {team.players.map((player: any) => (
              <Card key={player.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-[#172c44] text-white rounded-full flex items-center justify-center font-bold">
                      {player.number}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#172c44] font-medium">{player.name}</h3>
                        {player.isCaptain && (
                          <Badge className="bg-[#f4b400] text-[#172c44] text-xs">Capitán</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {getPositionBadge(player.position)}
                        <span className="text-gray-600">•</span>
                        <span className="text-sm text-gray-600">{player.age} años</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                        <span className="text-sm font-medium">{player.rating}</span>
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
            <Card>
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
            <div className="flex justify-between items-center">
              <h2 className="text-[#172c44] text-xl">Partidos Recientes</h2>
            </div>

            {team.recentMatches.map((match: any) => (
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

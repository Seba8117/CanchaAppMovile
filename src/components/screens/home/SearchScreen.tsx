import { useState } from 'react';
import { Search, Filter, MapPin, Calendar, Users, Star } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';

interface SearchScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack?: () => void;
}

export function SearchScreen({ onNavigate, onBack }: SearchScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('matches');

  const matches = [
    {
      id: 1,
      sport: 'Fútbol',
      location: 'Cancha Los Pinos',
      distance: '1.2 km',
      time: '19:00',
      date: 'Hoy',
      playersNeeded: 3,
      totalPlayers: 10,
      price: '$5.000',
      captain: 'Juan Pérez',
      rating: 4.8
    },
    {
      id: 2,
      sport: 'Básquetball',
      location: 'Polideportivo Central',
      distance: '2.5 km',
      time: '20:30',
      date: 'Mañana',
      playersNeeded: 2,
      totalPlayers: 8,
      price: '$3.500',
      captain: 'María González',
      rating: 4.9
    }
  ];

  const teams = [
    {
      id: 1,
      name: 'Los Tigres FC',
      members: 15,
      sport: 'Fútbol',
      level: 'Intermedio',
      wins: 12,
      losses: 3,
      rating: 4.7,
      looking: 'Buscan jugadores'
    },
    {
      id: 2,
      name: 'Basquet Pro',
      members: 8,
      sport: 'Básquetball',
      level: 'Avanzado',
      wins: 18,
      losses: 2,
      rating: 4.9,
      looking: 'Equipo completo'
    }
  ];

  const players = [
    {
      id: 1,
      name: 'Carlos Mendoza',
      position: 'Delantero',
      sport: 'Fútbol',
      level: 'Avanzado',
      matches: 45,
      rating: 4.8,
      available: true
    },
    {
      id: 2,
      name: 'Ana Gutierrez',
      position: 'Base',
      sport: 'Básquetball',
      level: 'Intermedio',
      matches: 23,
      rating: 4.6,
      available: true
    }
  ];

  const courts = [
    {
      id: 1,
      name: 'Cancha Los Pinos',
      location: 'Providencia',
      distance: '1.2 km',
      sports: ['Fútbol', 'Futsal'],
      price: '$25.000/hora',
      rating: 4.8,
      amenities: ['Estacionamiento', 'Vestuarios', 'Duchas']
    },
    {
      id: 2,
      name: 'Polideportivo Central',
      location: 'Santiago Centro',
      distance: '2.1 km',
      sports: ['Básquetball', 'Volleyball'],
      price: '$18.000/hora',
      rating: 4.5,
      amenities: ['Cafetería', 'Vestuarios']
    }
  ];

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
          {/* Partidos Tab */}
          <TabsContent value="matches" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Partidos Disponibles</h2>
              <span className="text-sm text-white/90">{matches.length} resultados</span>
            </div>
            
            {matches.map((match) => (
              <Card 
                key={match.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onNavigate('match-detail', match)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">
                          {match.sport}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                          <span className="text-sm text-gray-600">{match.rating}</span>
                        </div>
                      </div>
                      <h3 className="text-[#172c44] mt-1">{match.location}</h3>
                    </div>
                    <span className="text-[#00a884]">{match.price}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{match.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{match.date} {match.time}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm">
                      <Users size={14} className="text-[#172c44]" />
                      <span className="text-gray-600">
                        {match.totalPlayers - match.playersNeeded}/{match.totalPlayers} jugadores
                      </span>
                    </div>
                    <span className="text-sm text-[#f4b400]">
                      {match.playersNeeded} cupos disponibles
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Equipos Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Equipos</h2>
              <span className="text-sm text-white/90">{teams.length} resultados</span>
            </div>
            
            {teams.map((team) => (
              <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[#172c44] mb-1">{team.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">
                          {team.sport}
                        </Badge>
                        <span className="text-sm text-gray-600">{team.level}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                      <span className="text-sm text-gray-600">{team.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{team.members} miembros</span>
                    </div>
                    <span>W: {team.wins} L: {team.losses}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${team.looking === 'Buscan jugadores' ? 'text-[#00a884]' : 'text-gray-500'}`}>
                      {team.looking}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-[#00a884] border-[#00a884]"
                    >
                      Ver Equipo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Jugadores Tab */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Jugadores</h2>
              <span className="text-sm text-white/90">{players.length} resultados</span>
            </div>
            
            {players.map((player) => (
              <Card key={player.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[#172c44] mb-1">{player.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">
                          {player.sport}
                        </Badge>
                        <span className="text-sm text-gray-600">{player.position}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                      <span className="text-sm text-gray-600">{player.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>Nivel: {player.level}</span>
                    <span>{player.matches} partidos</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${player.available ? 'text-[#00a884]' : 'text-gray-500'}`}>
                      {player.available ? 'Disponible' : 'No disponible'}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-[#00a884] border-[#00a884]"
                    >
                      Ver Perfil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Canchas Tab */}
          <TabsContent value="courts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Canchas</h2>
              <span className="text-sm text-white/90">{courts.length} resultados</span>
            </div>
            
            {courts.map((court) => (
              <Card key={court.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-[#172c44] mb-1">{court.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <MapPin size={14} />
                        <span>{court.location} • {court.distance}</span>
                      </div>
                      <div className="flex gap-1">
                        {court.sports.map((sport) => (
                          <Badge 
                            key={sport}
                            variant="secondary" 
                            className="bg-[#f4b400] text-[#172c44] text-xs"
                          >
                            {sport}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 mb-1">
                        <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                        <span className="text-sm text-gray-600">{court.rating}</span>
                      </div>
                      <span className="text-[#00a884]">{court.price}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {court.amenities.map((amenity) => (
                      <span 
                        key={amenity}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full text-[#00a884] border-[#00a884]"
                  >
                    Ver Disponibilidad
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

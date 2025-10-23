import { MapPin, Calendar, Users, Clock, Star, Plus } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const nearbyMatches = [
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
    },
    {
      id: 3,
      sport: 'Tenis',
      location: 'Club Deportivo',
      distance: '800 m',
      time: '18:00',
      date: 'Miércoles',
      playersNeeded: 1,
      totalPlayers: 4,
      price: '$8.000',
      captain: 'Carlos Silva',
      rating: 4.7
    }
  ];

  return (
    <div className="p-4 pb-32 bg-gradient-to-br from-[#172c44] to-[#00a884] min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img 
            src={logoIcon} 
            alt="CanchApp" 
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="text-white mb-1 font-bold text-2xl">¡Hola, Usuario!</h1>
            <p className="text-white font-semibold">Encuentra partidos cerca de ti</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('notifications')}
          className="p-2 bg-white rounded-full shadow-sm"
        >
          <div className="relative">
            <div className="w-2 h-2 bg-[#f4b400] rounded-full absolute -top-1 -right-1"></div>
            <svg className="w-5 h-5 text-[#172c44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5L19 11V7a7 7 0 00-14 0v4l2.5 2.5L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <MapPin className="text-[#00a884]" size={20} />
          <span className="text-gray-700">Santiago Centro, Chile</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="ml-auto text-[#f4b400]"
          >
            Cambiar
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white">Partidos Cercanos</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onNavigate('search')}
          className="text-white hover:text-white/90"
        >
          Ver todos
        </Button>
      </div>

      <div className="space-y-4">
        {nearbyMatches.map((match) => (
          <Card 
            key={match.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('match-detail', match)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-[#f4b400] text-[#172c44]"
                    >
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
                  <span>{match.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{match.time}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm">
                  <Users size={14} className="text-[#172c44]" />
                  <span className="text-gray-600">
                    {match.totalPlayers - match.playersNeeded}/{match.totalPlayers} jugadores
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-[#f4b400]">
                    {match.playersNeeded} cupos disponibles
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Capitán: <span className="text-[#172c44]">{match.captain}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-white mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 gap-4">
           <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#00a884] text-[#00a884] hover:bg-[#00a884] hover:text-white"
            onClick={() => onNavigate('create')}
          >
            <Plus size={20} />
            Crear Partido
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#f4b400] text-[#f4b400] hover:bg-[#f4b400] hover:text-[#172c44]"
            onClick={() => onNavigate('tournaments')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
             Torneos
           </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-purple-700 text-purple-700 hover:bg-purple-700 hover:text-white"
            onClick={() => onNavigate('my-teams')}
          >
            <Users size={20} />
            Mis Equipos
          </Button>
          <Button variant="outline" 
          className="h-16 flex-col gap-2 border-[#93c5fd] text-[#93c5fd] hover:bg-[#93c5fd] hover:text-white" 
          onClick={() => onNavigate('my-bookings')}>
            <Calendar size={20} />
            Mis Reservas
          </Button>
        </div>
      </div>
    </div>
  );
}

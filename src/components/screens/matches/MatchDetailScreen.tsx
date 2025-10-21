import { ArrowLeft, MapPin, Calendar, Clock, Users, Star, Share2, Heart, Eye } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';

interface MatchDetailScreenProps {
  match: any;
  onBack: () => void;
  onNavigate?: (screen: string, data?: any) => void;
  userType?: 'player' | 'owner';
}

export function MatchDetailScreen({ match, onBack, onNavigate, userType }: MatchDetailScreenProps) {
  const players = [
    { id: 1, name: 'Juan Pérez', position: 'Capitán', rating: 4.8, avatar: 'JP' },
    { id: 2, name: 'María González', position: 'Defensa', rating: 4.5, avatar: 'MG' },
    { id: 3, name: 'Carlos Silva', position: 'Medio', rating: 4.7, avatar: 'CS' },
    { id: 4, name: 'Ana Torres', position: 'Delantera', rating: 4.9, avatar: 'AT' },
    { id: 5, name: 'Luis Morales', position: 'Portero', rating: 4.6, avatar: 'LM' },
    { id: 6, name: 'Sofia Ruiz', position: 'Medio', rating: 4.4, avatar: 'SR' },
    { id: 7, name: 'Diego Fernández', position: 'Defensa', rating: 4.8, avatar: 'DF' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44]">Detalle del Partido</h1>
          <div className="flex gap-2">
            <button className="p-2">
              <Heart className="text-gray-400" size={20} />
            </button>
            <button className="p-2">
              <Share2 className="text-gray-400" size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6 pb-24">
        {/* Match Info */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <Badge className="bg-[#f4b400] text-[#172c44] mb-2">
                  {match.sport}
                </Badge>
                <h2 className="text-[#172c44] mb-1">{match.location}</h2>
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                  <span className="text-sm text-gray-600">{match.rating} • Cancha verificada</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl text-[#00a884] mb-1">{match.price}</p>
                <p className="text-sm text-gray-600">por jugador</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-[#172c44]" size={16} />
                <span className="text-sm">{match.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-[#172c44]" size={16} />
                <span className="text-sm">{match.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="text-[#172c44]" size={16} />
                <span className="text-sm">{match.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="text-[#172c44]" size={16} />
                <span className="text-sm">{match.totalPlayers - match.playersNeeded}/{match.totalPlayers}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Partido de fútbol recreativo en una de las mejores canchas de la zona. 
                Césped sintético en excelente estado. Incluye vestuarios y estacionamiento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Captain Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] mb-3">Capitán del Equipo</h3>
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                  JP
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-[#172c44]">{match.captain}</p>
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                  <span className="text-sm text-gray-600">4.8 • 127 partidos</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-[#00a884] border-[#00a884]">
                Mensaje
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#172c44]">Jugadores Confirmados</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-[#00a884] text-white">
                  {players.length}/{match.totalPlayers}
                </Badge>
                {userType === 'player' && onNavigate && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigate('match-players', match)}
                    className="text-[#172c44] border-[#172c44] hover:bg-[#172c44] hover:text-white"
                  >
                    <Eye size={14} className="mr-1" />
                    Ver Todos
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {players.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gray-200 text-[#172c44] text-sm">
                      {player.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-[#172c44]">{player.name}</p>
                    <p className="text-xs text-gray-600">{player.position}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="text-[#f4b400]" size={12} fill="currentColor" />
                    <span className="text-xs text-gray-600">{player.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-[#172c44] mb-3">Ubicación</h3>
            <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center">
              <p className="text-gray-500">Mapa de la cancha</p>
            </div>
            <p className="text-sm text-gray-700 mb-2">
              Av. Los Leones 1234, Providencia, Santiago
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Abrir en Google Maps
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        <Button 
          className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] h-12"
        >
          Unirse al Partido - {match.price}
        </Button>
      </div>
    </div>
  );
}

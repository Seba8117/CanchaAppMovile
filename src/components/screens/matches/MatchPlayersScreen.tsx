import { ArrowLeft, Star, AlertTriangle, Users, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';

interface MatchPlayersScreenProps {
  match: any;
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
  userType: 'player' | 'owner';
}

export function MatchPlayersScreen({ match, onBack, onNavigate, userType }: MatchPlayersScreenProps) {
  const myTeam = [
    { id: 1, name: 'Juan Pérez', position: 'Capitán', rating: 4.8, avatar: 'JP', isCaptain: true },
    { id: 2, name: 'María González', position: 'Defensa', rating: 4.5, avatar: 'MG', isCaptain: false },
    { id: 3, name: 'Carlos Silva', position: 'Medio', rating: 4.7, avatar: 'CS', isCaptain: false },
    { id: 4, name: 'Ana Torres', position: 'Delantera', rating: 4.9, avatar: 'AT', isCaptain: false },
    { id: 5, name: 'Luis Morales', position: 'Portero', rating: 4.6, avatar: 'LM', isCaptain: false },
    { id: 6, name: 'Sofia Ruiz', position: 'Medio', rating: 4.4, avatar: 'SR', isCaptain: false },
  ];

  const rivalTeam = [
    { id: 7, name: 'Diego Fernández', position: 'Capitán', rating: 4.8, avatar: 'DF', isCaptain: true },
    { id: 8, name: 'Carmen López', position: 'Defensa', rating: 4.3, avatar: 'CL', isCaptain: false },
    { id: 9, name: 'Roberto Castro', position: 'Medio', rating: 4.6, avatar: 'RC', isCaptain: false },
    { id: 10, name: 'Elena Vega', position: 'Delantera', rating: 4.7, avatar: 'EV', isCaptain: false },
    { id: 11, name: 'Miguel Santos', position: 'Portero', rating: 4.5, avatar: 'MS', isCaptain: false },
    { id: 12, name: 'Patricia Herrera', position: 'Medio', rating: 4.4, avatar: 'PH', isCaptain: false },
  ];

  const handleReportPlayer = (player: any) => {
    onNavigate('report-player', { player, match });
  };

  const renderPlayerCard = (player: any, isMyTeam: boolean) => (
    <Card key={player.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarFallback className={`${isMyTeam ? 'bg-[#00a884]' : 'bg-[#172c44]'} text-white`}>
                {player.avatar}
              </AvatarFallback>
            </Avatar>
            {player.isCaptain && (
              <div className="absolute -top-1 -right-1 bg-[#f4b400] rounded-full p-1">
                <Shield size={12} className="text-[#172c44]" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[#172c44]">{player.name}</p>
              {player.isCaptain && (
                <Badge variant="outline" className="text-xs border-[#f4b400] text-[#f4b400]">
                  Capitán
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{player.position}</p>
            <div className="flex items-center gap-1">
              <Star className="text-[#f4b400]" size={12} fill="currentColor" />
              <span className="text-xs text-gray-600">{player.rating}</span>
            </div>
          </div>
          {userType === 'player' && !isMyTeam && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReportPlayer(player)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <AlertTriangle size={14} className="mr-1" />
              Reportar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44]">Jugadores del Partido</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 pb-6">
        {/* Match Info */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <Badge className="bg-[#f4b400] text-[#172c44] mb-2">
                  {match.sport}
                </Badge>
                <CardTitle className="text-[#172c44] text-lg">{match.location}</CardTitle>
                <p className="text-sm text-gray-600">{match.date} • {match.time}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-[#00a884]">
                  <Users size={16} />
                  <span>{myTeam.length + rivalTeam.length} jugadores</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Players Tabs */}
        <Tabs defaultValue="my-team" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-team" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00a884] rounded-full"></div>
              Mi Equipo ({myTeam.length})
            </TabsTrigger>
            <TabsTrigger value="rival-team" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#172c44] rounded-full"></div>
              Equipo Rival ({rivalTeam.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-team" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-[#172c44] mb-3 flex items-center gap-2">
                <div className="w-4 h-4 bg-[#00a884] rounded-full"></div>
                Tu Equipo
              </h3>
              {userType === 'player' && (
                <p className="text-sm text-gray-600 mb-4">
                  Estos son tus compañeros de equipo para este partido.
                </p>
              )}
            </div>
            {myTeam.map((player) => renderPlayerCard(player, true))}
          </TabsContent>

          <TabsContent value="rival-team" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-[#172c44] mb-3 flex items-center gap-2">
                <div className="w-4 h-4 bg-[#172c44] rounded-full"></div>
                Equipo Rival
              </h3>
              {userType === 'player' && (
                <p className="text-sm text-gray-600 mb-4">
                  Conoce a tus oponentes. Puedes reportar comportamientos inapropiados.
                </p>
              )}
            </div>
            {rivalTeam.map((player) => renderPlayerCard(player, false))}
          </TabsContent>
        </Tabs>

        {userType === 'player' && (
          <Card className="mt-6 border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-600 mt-1" size={20} />
                <div>
                  <h4 className="text-orange-800 mb-1">Código de Conducta</h4>
                  <p className="text-sm text-orange-700">
                    Mantén el respeto y fair play. Reporta cualquier comportamiento inadecuado 
                    para mantener una comunidad deportiva sana.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

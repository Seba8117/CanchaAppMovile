import { Settings, Edit, Star, Trophy, Calendar, Users, MapPin, LogOut } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const userStats = {
    matchesPlayed: 47,
    rating: 4.7,
    wins: 32,
    goals: 18,
    assists: 12,
    favoritePosition: 'Medio'
  };

  const recentMatches = [
    {
      id: 1,
      date: '15 Sep',
      sport: 'Fútbol',
      location: 'Cancha Los Pinos',
      result: 'Victoria 3-2',
      myStats: { goals: 1, assists: 0 }
    },
    {
      id: 2,
      date: '12 Sep',
      sport: 'Fútbol',
      location: 'Polideportivo Norte',
      result: 'Derrota 1-2',
      myStats: { goals: 0, assists: 1 }
    },
    {
      id: 3,
      date: '08 Sep',
      sport: 'Básquetball',
      location: 'Club Central',
      result: 'Victoria 85-78',
      myStats: { points: 12, rebounds: 5 }
    }
  ];

  const myTeams = [
    {
      id: 1,
      name: 'Los Tigres FC',
      sport: 'Fútbol',
      role: 'Capitán',
      members: 15,
      wins: 12,
      losses: 3
    },
    {
      id: 2,
      name: 'Warriors Basketball',
      sport: 'Básquetball',
      role: 'Jugador',
      members: 8,
      wins: 6,
      losses: 2
    }
  ];

  const achievements = [
    { id: 1, title: 'Primer Gol', description: 'Anotaste tu primer gol', icon: '⚽', unlocked: true },
    { id: 2, title: 'Jugador Activo', description: '10 partidos jugados', icon: '🏃', unlocked: true },
    { id: 3, title: 'Capitán Natural', description: 'Creaste 5 partidos', icon: '👑', unlocked: true },
    { id: 4, title: 'MVP', description: 'Mejor jugador del partido 3 veces', icon: '🏆', unlocked: false },
    { id: 5, title: 'Leyenda', description: '100 partidos jugados', icon: '⭐', unlocked: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header */}
      <div className="text-white p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-xl">
                JD
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl mb-1">Juan Doe</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={16} fill="currentColor" />
                  <span>{userStats.rating}</span>
                </div>
                <span className="text-sm opacity-80">{userStats.matchesPlayed} partidos</span>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white"
            onClick={() => onNavigate('edit-profile')}
          >
            <Settings size={20} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{userStats.wins}</p>
            <p className="text-sm opacity-80">Victorias</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{userStats.goals}</p>
            <p className="text-sm opacity-80">Goles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{userStats.assists}</p>
            <p className="text-sm opacity-80">Asistencias</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
            <TabsTrigger value="achievements">Logros</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                  <Users size={20} />
                  Perfil de Jugador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deporte Favorito</p>
                    <p className="text-[#172c44]">Fútbol</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Posición</p>
                    <p className="text-[#172c44]">{userStats.favoritePosition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Nivel</p>
                    <p className="text-[#172c44]">Intermedio</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="text-[#172c44]">Santiago, Chile</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full text-[#00a884] border-[#00a884]"
                    onClick={() => onNavigate('edit-profile')}
                  >
                    <Edit size={16} className="mr-2" />
                    Editar Perfil
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <LogOut size={16} className="mr-2" />
                        Cerrar Sesión
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder a tu cuenta.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={onLogout}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Cerrar Sesión
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44]">Deportes que Practicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#00a884] text-white">Fútbol ⚽</Badge>
                  <Badge className="bg-[#f4b400] text-[#172c44]">Básquetball 🏀</Badge>
                  <Badge variant="outline" className="text-gray-600">Tenis 🎾</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Partidos Recientes</h2>
              <Button variant="ghost" size="sm" className="text-[#00a884]">
                Ver Todos
              </Button>
            </div>

            {recentMatches.map((match) => (
              <Card key={match.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">
                          {match.sport}
                        </Badge>
                        <span className="text-sm text-gray-600">{match.date}</span>
                      </div>
                      <h3 className="text-[#172c44]">{match.location}</h3>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded ${
                      match.result.includes('Victoria')
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {match.result}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {match.sport === 'Fútbol' 
                      ? `Goles: ${match.myStats.goals} • Asistencias: ${match.myStats.assists}`
                      : `Puntos: ${match.myStats.points || 0} • Rebotes: ${match.myStats.rebounds || 0}`
                    }
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Teams Tab */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white">Mis Equipos</h2>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-[#00a884] border-[#00a884]"
                onClick={() => onNavigate('my-teams')}
              >
                Ver Todos
              </Button>
            </div>

            {myTeams.map((team) => (
              <Card key={team.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[#172c44]">{team.name}</h3>
                        <Badge 
                          variant={team.role === 'Capitán' ? 'default' : 'secondary'}
                          className={team.role === 'Capitán' 
                            ? 'bg-[#f4b400] text-[#172c44]' 
                            : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {team.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{team.sport}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{team.members} miembros</span>
                      <span>V: {team.wins} D: {team.losses}</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onNavigate('team-details')}
                    >
                      Ver Equipo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <h2 className="text-white">Logros Desbloqueados</h2>
            
            <div className="grid gap-3">
              {achievements.map((achievement) => (
                <Card 
                  key={achievement.id}
                  className={`${achievement.unlocked ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`${achievement.unlocked ? 'text-[#172c44]' : 'text-gray-500'}`}>
                          {achievement.title}
                        </h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && (
                        <div className="w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

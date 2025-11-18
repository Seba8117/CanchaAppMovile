import { useState, useEffect } from 'react';
import { Settings, Edit, Star, Users, MapPin, LogOut, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig'; // Asegúrate que la ruta es correcta
import { doc, getDoc, DocumentData } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const [profileData, setProfileData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- DATOS DE EJEMPLO PARA HISTORIAL Y EQUIPOS ---
  const userStatsPlaceholders = {
    matchesPlayed: 47,
    rating: 4.7,
    wins: 32,
    goals: 18,
    assists: 12,
  };

  const recentMatches = [
    { id: 1, date: '15 Sep', sport: 'Fútbol', location: 'Cancha Los Pinos', result: 'Victoria 3-2', myStats: { goals: 1, assists: 0 } },
    { id: 2, date: '12 Sep', sport: 'Fútbol', location: 'Polideportivo Norte', result: 'Derrota 1-2', myStats: { goals: 0, assists: 1 } },
    { id: 3, date: '08 Sep', sport: 'Básquetball', location: 'Club Central', result: 'Victoria 85-78', myStats: { points: 12, rebounds: 5 } }
  ];

  const myTeams = [
    { id: 1, name: 'Los Tigres FC', sport: 'Fútbol', role: 'Capitán', members: 15, wins: 12, losses: 3 },
    { id: 2, name: 'Warriors Basketball', sport: 'Básquetball', role: 'Jugador', members: 8, wins: 6, losses: 2 }
  ];
  // --- FIN DATOS DE EJEMPLO ---

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Usuario no autenticado.");
        setLoading(false);
        return;
      }
      try {
        const playerDocRef = doc(db, 'jugador', currentUser.uid);
        const playerDocSnap = await getDoc(playerDocRef);
        if (playerDocSnap.exists()) {
          setProfileData(playerDocSnap.data());
        } else {
          throw new Error("No se encontraron los datos del perfil del jugador.");
        }
      } catch (err: any) {
        console.error("Error al cargar el perfil del jugador:", err);
        setError("No se pudo cargar la información del perfil.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const getInitials = (name: string | undefined | null = '') => {
    // Añadida verificación extra por si name es null/undefined
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884] p-4 text-white">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="font-semibold text-lg">Cargando perfil...</p>
      </div>
    );
  }

  if (error) { // No necesitamos verificar !profileData aquí porque ya lo hacemos abajo con ?.
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884] p-4 text-center">
        <AlertTriangle className="h-12 w-12 mb-4 text-red-300" />
        <p className="font-bold text-lg text-white">Ocurrió un error</p>
        <p className="text-red-200">{error}</p>
        <Button onClick={onLogout} className="mt-4 bg-white text-[#172c44]">Cerrar Sesión</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header con encadenamiento opcional */}
      <div className="text-white p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-xl font-bold">
                {getInitials(profileData?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl mb-1 font-bold">{profileData?.name || 'Nombre no encontrado'}</h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="text-[#f4b400]" size={16} fill="currentColor" />
                  {/* Usamos ?? para mostrar placeholder si el dato real es null/undefined */}
                  <span>{profileData?.rating ?? userStatsPlaceholders.rating}</span>
                </div>
                <span className="text-sm opacity-80">{profileData?.matchesPlayed ?? userStatsPlaceholders.matchesPlayed} partidos</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => onNavigate('edit-profile')}>
            <Settings size={20} />
          </Button>
        </div>

        {/* Stats con ?? */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{profileData?.wins ?? userStatsPlaceholders.wins}</p>
            <p className="text-sm opacity-80">Victorias</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profileData?.goals ?? userStatsPlaceholders.goals}</p>
            <p className="text-sm opacity-80">Goles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{profileData?.assists ?? userStatsPlaceholders.assists}</p>
            <p className="text-sm opacity-80">Asistencias</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Tabs sin Logros */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
          </TabsList>

          {/* Pestaña Resumen con ?. y ?? */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2"><Users size={20} />Perfil de Jugador</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-600">Deporte Favorito</p><p className="text-[#172c44] font-semibold">{profileData?.favoriteSport || 'No especificado'}</p></div>
                  <div><p className="text-sm text-gray-600">Posición</p><p className="text-[#172c44] font-semibold">{profileData?.favoritePosition || 'No especificada'}</p></div>
                  <div><p className="text-sm text-gray-600">Nivel</p><p className="text-[#172c44] font-semibold">{profileData?.level || 'No especificado'}</p></div>
                  <div><p className="text-sm text-gray-600">Ubicación</p><p className="text-[#172c44] font-semibold">{profileData?.location || 'No especificada'}</p></div>
                </div>
                {/* Usamos ?. para verificar si bio existe antes de mostrarlo */}
                {profileData?.bio && (<div><p className="text-sm text-gray-600">Biografía</p><p className="text-[#172c44]">{profileData.bio}</p></div>)}
                <div className="space-y-3 pt-4 border-t">
                  <Button variant="outline" className="w-full text-[#00a884] border-[#00a884] hover:bg-[#00a884]/10" onClick={() => onNavigate('edit-profile')}><Edit size={16} className="mr-2" />Editar Perfil</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50"><LogOut size={16} className="mr-2" />Cerrar Sesión</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle><AlertDialogDescription>¿Estás seguro?</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={onLogout} className="bg-red-600 hover:bg-red-700 text-white">Cerrar Sesión</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
             <Card>
               <CardHeader><CardTitle className="text-[#172c44]">Deportes que Practicas</CardTitle></CardHeader>
               <CardContent>
                 <div className="flex flex-wrap gap-2">
                   {/* Usamos ?. */}
                   {profileData?.favoriteSport && <Badge className="bg-[#00a884] text-white">{profileData.favoriteSport} {profileData.favoriteSport === 'Fútbol' ? '⚽' : ''}</Badge>}
                   {/* Puedes añadir más lógica aquí si guardas una lista de deportes */}
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          {/* Pestaña Historial (datos de ejemplo) */}
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold">Partidos Recientes</h2>
              <Button variant="ghost" size="sm" className="text-white hover:text-white/80">Ver Todos</Button>
            </div>
            {recentMatches.map((match) => (
              <Card key={match.id} className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{match.sport}</Badge>
                        <span className="text-sm text-gray-600">{match.date}</span>
                      </div>
                      <h3 className="text-[#172c44] font-semibold">{match.location}</h3>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded font-medium ${match.result.includes('Victoria') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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

          {/* Pestaña Equipos (datos de ejemplo) */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold">Mis Equipos</h2>
              <Button variant="outline" size="sm" className="text-white border-white/50 hover:bg-white/10 hover:text-white" onClick={() => onNavigate('my-teams')}>Ver Todos</Button>
            </div>
            {myTeams.map((team) => (
              <Card key={team.id} className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[#172c44] font-bold">{team.name}</h3>
                        <Badge variant={team.role === 'Capitán' ? 'default' : 'secondary'} className={team.role === 'Capitán' ? 'bg-[#f4b400] text-[#172c44]' : 'bg-gray-100 text-gray-700'}>
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
                    <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50" onClick={() => onNavigate('team-details')}>Ver Equipo</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
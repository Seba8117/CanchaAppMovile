import { useState, useEffect } from 'react';
import { Settings, Edit, Users, LogOut, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../../ui/alert-dialog';

// Firebase
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs, DocumentData } from 'firebase/firestore';

interface ProfileScreenProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function ProfileScreen({ onNavigate, onLogout }: ProfileScreenProps) {
  const [profileData, setProfileData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<DocumentData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // ================================
  // CARGAR DATOS DEL PERFIL + EQUIPOS
  // ================================
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("Usuario no autenticado.");
        setLoading(false);
        return;
      }

      try {
        // Cargar perfil
        const ref = doc(db, 'jugador', currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfileData(snap.data());
        } else {
          setError("No se encontraron los datos del perfil del jugador.");
        }

        // Cargar equipos donde el usuario es miembro
        const teamsRef = collection(db, "teams");
        const q = query(teamsRef, where("members", "array-contains", currentUser.uid));
        const teamSnap = await getDocs(q);

        const fetchedTeams = teamSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setTeams(fetchedTeams);

      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la información del perfil.");
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const getInitials = (name: string | undefined | null = '') => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';
  };

  // =================
  // LOADING
  // =================
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884] p-4 text-white">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="font-semibold text-lg">Cargando perfil...</p>
      </div>
    );
  }

  // =================
  // ERROR
  // =================
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884] p-4 text-center">
        <AlertTriangle className="h-12 w-12 mb-4 text-red-300" />
        <p className="font-bold text-lg text-white">Ocurrió un error</p>
        <p className="text-red-200">{error}</p>
        <Button onClick={onLogout} className="mt-4 bg-white text-[#172c44]">Cerrar Sesión</Button>
      </div>
    );
  }

  // =================
  // UI PRINCIPAL
  // =================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      
      {/* Header */}
      <div className="text-white p-6">
        <div className="flex justify-between items-start mb-4">
          
          {/* Info del usuario */}
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-xl font-bold">
                {getInitials(profileData?.name)}
              </AvatarFallback>
            </Avatar>

            <div>
              <h1 className="text-xl mb-1 font-bold">
                {profileData?.name || 'Nombre no encontrado'}
              </h1>
            </div>
          </div>

          {/* Botón configuración */}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" 
            onClick={() => onNavigate('edit-profile')}>
            <Settings size={20} />
          </Button>

        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <Tabs defaultValue="overview" className="space-y-4">

          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Perfil</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
          </TabsList>

          {/* PERFIL SIMPLE */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                  <Users size={20} /> Información
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Deporte Favorito</p>
                    <p className="text-[#172c44] font-semibold">
                      {profileData?.favoriteSport || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Posición</p>
                    <p className="text-[#172c44] font-semibold">
                      {profileData?.favoritePosition || 'No especificada'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Nivel</p>
                    <p className="text-[#172c44] font-semibold">
                      {profileData?.level || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="text-[#172c44] font-semibold">
                      {profileData?.location || 'No especificada'}
                    </p>
                  </div>
                </div>

                {profileData?.bio && (
                  <div>
                    <p className="text-sm text-gray-600">Biografía</p>
                    <p className="text-[#172c44]">{profileData.bio}</p>
                  </div>
                )}

                <div className="space-y-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full text-[#00a884] border-[#00a884] hover:bg-[#00a884]/10"
                    onClick={() => onNavigate('edit-profile')}
                  >
                    <Edit size={16} className="mr-2" /> Editar Perfil
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                        <LogOut size={16} className="mr-2" /> Cerrar Sesión
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                        <AlertDialogDescription>¿Estás seguro?</AlertDialogDescription>
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
          </TabsContent>

          {/* EQUIPOS */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold">Mis Equipos</h2>
              <Button
                variant="outline"
                size="sm"
                className="text-white border-white/50 hover:bg-white/10 hover:text-white"
                onClick={() => onNavigate('my-teams')}
              >
                Ver Todos
              </Button>
            </div>

            {teams.length === 0 && (
              <p className="text-white opacity-80">No estás en ningún equipo aún.</p>
            )}

            {teams.map(team => (
              <Card key={team.id} className="bg-white/90">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[#172c44] font-bold">{team.name}</h3>

                        {team.captainId === auth.currentUser?.uid && (
                          <Badge className="bg-[#f4b400] text-[#172c44]">Capitán</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{team.sport}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>{team.currentPlayers} miembros</span>
                      <span>Máx: {team.maxPlayers}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-300 hover:bg-gray-50"
                      onClick={() => onNavigate('team-details')}
                    >
                      Ver Equipo
                    </Button>
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
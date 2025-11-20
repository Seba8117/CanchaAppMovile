import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Phone, Trophy, Star, MoreVertical, Settings, Trash2, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu';
import { AppHeader } from '../../common/AppHeader';
import { db, auth } from '../../../Firebase/firebaseConfig';
import { doc, onSnapshot, collection, query, where, getDocs, getDoc, documentId, updateDoc, arrayRemove, addDoc, serverTimestamp } from 'firebase/firestore';

interface TeamDetailsScreenProps {
  onBack: () => void;
  teamData?: any;
  onNavigate?: (screen: string, data?: any) => void;
}

export function TeamDetailsScreen({ onBack, teamData, onNavigate }: TeamDetailsScreenProps) {
  const [team, setTeam] = useState<any>(null);
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [permissionError, setPermissionError] = useState(false);

  // 0. Escuchar estado de autenticación
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 1. Cargar datos del equipo en tiempo real
  useEffect(() => {
    if (!teamData?.id) {
      setLoading(false);
      return;
    }

    const teamRef = doc(db, 'teams', teamData.id);
    const unsubscribe = onSnapshot(teamRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const normalizedTeam = {
            id: docSnap.id,
            ...data,
            members: data.members || [], 
            stats: data.stats || { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, trophies: 0 },
            founded: data.createdAt ? new Date(data.createdAt.seconds * 1000).getFullYear().toString() : new Date().getFullYear().toString(),
            colors: data.colors || 'Sin especificar',
            description: data.description || 'Sin descripción',
            captainName: data.captainName || 'Desconocido',
            captainEmail: data.captainEmail || '',
            captainPhone: data.captainPhone || '',
        };
        setTeam(normalizedTeam);
      } else {
        console.log("El documento del equipo no existe");
      }
      setLoading(false);
    }, (error) => {
        console.error("Error al cargar equipo:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [teamData]);

  // 2. Cargar datos de los jugadores (Colección 'jugador')
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!team || !team.members || team.members.length === 0 || !currentUser) {
        if (team && team.members && team.members.length === 0) setPlayersData([]);
        return;
      }

      const memberIds = team.members.slice(0, 10); 

      try {
        setPermissionError(false);
        const q = query(collection(db, 'jugador'), where(documentId(), 'in', memberIds));
        const querySnapshot = await getDocs(q);
        
        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setPlayersData(users);
      } catch (error: any) {
        console.error("Error fetching players:", error);
        if (error.code === 'permission-denied') {
          setPermissionError(true);
        }
      }
    };

    fetchPlayers();
  }, [team?.members, currentUser]);

  const isCaptain = currentUser?.uid === team?.captainId;

  // Obtener nombre real del capitán desde playersData si está disponible
  const getRealCaptainName = () => {
    if (!team) return 'Desconocido';
    const captainUser = playersData.find(p => p.id === team.captainId);
    return captainUser?.displayName || captainUser?.name || captainUser?.nombre || team.captainName || 'Desconocido';
  };

  const handleDeleteTeam = () => {
    if (onNavigate && team) {
      onNavigate('delete-team', team);
    }
  };

  const handleRemoveMember = async (playerId: string) => {
    if (!team?.id || !isCaptain) return;
    
    // Obtener nombre del jugador para el mensaje
    const playerToRemove = playersData.find(p => p.id === playerId);
    const playerName = playerToRemove?.displayName || playerToRemove?.name || playerToRemove?.nombre || playerToRemove?.email || 'Un miembro';

    if (window.confirm(`¿Estás seguro de que quieres eliminar a ${playerName} del equipo?`)) {
        try {
            // 1. Eliminar de la colección 'teams' (Acción Principal)
            const teamRef = doc(db, 'teams', team.id);
            await updateDoc(teamRef, {
                members: arrayRemove(playerId)
            });

            // 2. Actualizar chat: Eliminar participante y Enviar mensaje de sistema
            try {
                const chatRef = doc(db, 'chats', team.id);
                const chatSnap = await getDoc(chatRef);

                if (chatSnap.exists()) {
                     // Agregar mensaje de sistema al chat
                    const messagesRef = collection(db, 'chats', team.id, 'messages');
                    
                    // CAMBIO CLAVE: Usamos el ID del capitán (currentUser.uid) como senderId
                    // Esto asegura que el mensaje pase los filtros de seguridad/renderizado del ChatScreen
                    // aunque sea un mensaje de sistema.
                    await addDoc(messagesRef, {
                        text: `${playerName} ha sido eliminado del equipo`,
                        senderId: currentUser?.uid, // Usamos tu ID real para que se muestre
                        senderName: 'Sistema',      // Intentamos forzar el nombre "Sistema"
                        createdAt: serverTimestamp(),
                        system: true,               // Flag para estilos especiales si tu chat lo soporta
                        // Añadimos campos extra para compatibilidad con diferentes librerías de chat
                        user: {
                            _id: currentUser?.uid,
                            name: 'Sistema'
                        }
                    });
                    
                    // Eliminar al usuario de los participantes del chat y actualizar último mensaje
                    await updateDoc(chatRef, {
                        participantsUids: arrayRemove(playerId),
                        lastMessage: `${playerName} ha sido eliminado del equipo`,
                        lastMessageTimestamp: serverTimestamp()
                    });
                } else {
                    console.warn("Chat no encontrado, no se pudo enviar mensaje de sistema.");
                }

            } catch (chatError) {
                console.warn("Jugador eliminado del equipo, pero hubo un problema actualizando el chat:", chatError);
            }

        } catch (error) {
            console.error("Error al eliminar miembro:", error);
            alert("Hubo un error al eliminar al miembro.");
        }
    }
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884]">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
      );
  }

  if (!team) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] flex flex-col items-center justify-center p-4">
            <p className="text-white mb-4">No se encontró información del equipo.</p>
            <Button onClick={onBack} variant="secondary">Volver</Button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      <div className="sticky top-0 z-50">
        <AppHeader 
          title="Detalles del Equipo" 
          showBackButton={true} 
          onBack={onBack}
          leftContent={
            <button 
              onClick={onBack} 
              className="p-2 rounded-full hover:bg-white/10 transition-colors active:scale-95"
              aria-label="Volver"
            >
              <ArrowLeft size={24} className="text-white" /> 
            </button>
          }
          rightContent={
            isCaptain && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
                    <MoreVertical size={24} className="text-white" />
                  </button>
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
      </div>

      <div className="p-4 pb-20 space-y-6">
        {/* Tarjeta Principal */}
        <Card className="border-none shadow-lg bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-16 h-16 border-2 border-[#f4b400]">
                <AvatarImage src={team.teamImage} />
                <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-2xl font-bold">
                  {team.name ? team.name.substring(0, 2).toUpperCase() : 'EQ'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#172c44]">{team.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className="bg-[#00a884] text-white hover:bg-[#008f6f]">{team.sport}</Badge>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">Fundado en {team.founded}</span>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-[#172c44] text-sm mb-1">Descripción</h3>
            <p className="text-gray-600 mb-4 text-sm">{team.description}</p>

            <div className="pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Capitán</p>
                <p className="text-[#172c44] font-medium">{getRealCaptainName()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur-md p-1 rounded-xl">
            <TabsTrigger value="players" className="data-[state=active]:bg-white data-[state=active]:text-[#172c44] text-white">Jugadores</TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-white data-[state=active]:text-[#172c44] text-white">Estadísticas</TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-[#172c44] text-white">Historial</TabsTrigger>
          </TabsList>

          {/* Tab Jugadores */}
          <TabsContent value="players" className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-white text-xl font-semibold">Plantilla</h2>
              <Badge className="bg-white text-[#172c44] font-bold">
                {team.members ? team.members.length : 0} miembros
              </Badge>
            </div>

            {permissionError && (
               <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                 <AlertCircle size={16} />
                 <span>Error de permisos: No tienes acceso para ver los perfiles.</span>
               </div>
            )}

            {playersData.length > 0 ? (
              playersData.map((player: any) => {
                const playerName = player.displayName || player.name || player.nombre || player.email || 'Usuario sin nombre';
                
                return (
                <Card key={player.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12 border border-gray-100">
                        <AvatarImage src={player.photoURL || player.image || player.foto} />
                        <AvatarFallback className="bg-gray-100 text-gray-500">
                            {playerName !== 'Usuario sin nombre' ? playerName.charAt(0).toUpperCase() : <UserIcon size={20}/>}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[#172c44] font-bold text-base truncate">
                          {playerName}
                        </h3>
                        {player.id === team.captainId && (
                          <Badge className="bg-[#f4b400] text-[#172c44] text-[10px] px-1.5 py-0.5">CAPITÁN</Badge>
                        )}
                        {/* Badge TÚ para el usuario actual */}
                        {player.id === currentUser?.uid && (
                           <Badge className="bg-[#172c44] text-white text-[10px] px-1.5 py-0.5">TÚ</Badge>
                        )}
                      </div>

                      {/* Posición del Jugador */}
                      <div className="text-xs text-[#00a884] font-medium mt-0.5 mb-1">
                        {player.favoritePosition ? player.favoritePosition : "Sin posición específica"}
                      </div>
                      
                      <div className="flex flex-col gap-0.5">
                         <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Mail size={14} className="text-[#00a884]" />
                            <span className="truncate">{player.email || 'Sin correo'}</span>
                         </div>
                         <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                            <Phone size={14} className="text-[#00a884]" />
                            <span className="truncate">{player.phoneNumber || player.phone || player.telefono || 'Sin teléfono'}</span>
                         </div>
                      </div>
                    </div>

                    {/* Botón de Eliminar (Solo para Capitán y no para sí mismo) */}
                    {isCaptain && player.id !== currentUser?.uid && (
                        <button 
                            onClick={() => handleRemoveMember(player.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Eliminar miembro del equipo"
                        >
                            <Trash2 size={20} />
                        </button>
                    )}
                  </CardContent>
                </Card>
              )})
            ) : (
              !permissionError && (
                <div className="text-center py-12 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                  <UserIcon className="h-12 w-12 text-white/50 mx-auto mb-3" />
                  <p className="text-white font-medium">Cargando o sin jugadores...</p>
                </div>
              )
            )}
          </TabsContent>

          {/* Tab Estadísticas */}
          <TabsContent value="stats" className="space-y-4">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#172c44]">Rendimiento General</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-[#00a884] to-[#008f6f] text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs opacity-80 uppercase font-bold mb-1">Partidos</p>
                    <p className="text-3xl font-bold">{team.stats.matchesPlayed}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs opacity-80 uppercase font-bold mb-1">Victorias</p>
                    <p className="text-3xl font-bold">{team.stats.wins}</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs opacity-80 uppercase font-bold mb-1">Empates</p>
                    <p className="text-3xl font-bold">{team.stats.draws}</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-xl shadow-sm">
                    <p className="text-xs opacity-80 uppercase font-bold mb-1">Derrotas</p>
                    <p className="text-3xl font-bold">{team.stats.losses}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Efectividad</span>
                    <span className="font-bold text-[#172c44]">
                      {team.stats.matchesPlayed > 0 
                        ? Math.round((team.stats.wins / team.stats.matchesPlayed) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-[#00a884] h-3 rounded-full transition-all duration-1000" 
                      style={{width: `${team.stats.matchesPlayed > 0 ? (team.stats.wins / team.stats.matchesPlayed) * 100 : 0}%`}}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Historial */}
          <TabsContent value="history" className="space-y-4">
             <Card className="border-none shadow-lg">
              <CardContent className="p-4 text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trophy className="text-gray-400" size={32} />
                </div>
                <p className="text-[#172c44] font-semibold mb-1">Historial de partidos</p>
                <p className="text-sm text-gray-500">Próximamente se mostrarán aquí los partidos jugados.</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg mt-4">
              <CardContent className="p-6 text-center">
                <p className="text-gray-500 text-xs uppercase font-bold mb-4 tracking-wider">Contacto del capitán</p>
                <div className="space-y-3">
                  {team.captainEmail && (
                    <div className="flex items-center justify-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="bg-[#e6f7f3] p-2 rounded-full">
                            <Mail size={18} className="text-[#00a884]" />
                        </div>
                        <span className="text-[#172c44] font-medium">{team.captainEmail}</span>
                    </div>
                  )}
                  {team.captainPhone && (
                    <div className="flex items-center justify-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="bg-[#e6f7f3] p-2 rounded-full">
                            <Phone size={18} className="text-[#00a884]" />
                        </div>
                        <span className="text-[#172c44] font-medium">{team.captainPhone}</span>
                    </div>
                  )}
                  {!team.captainEmail && !team.captainPhone && (
                      <p className="text-sm text-gray-400 italic">No hay información de contacto pública.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { ArrowLeft, Star, AlertTriangle, Users, Shield, Loader2, MoreVertical, Trash2, Move } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../Firebase/firebaseConfig';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../../ui/alert-dialog";
import { leaveMatch } from '../../../services/matchService';
import { toast } from 'sonner';

interface MatchPlayersScreenProps {
  match: any;
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
  userType: 'player' | 'owner';
}

export function MatchPlayersScreen({ match, onBack, onNavigate, userType }: MatchPlayersScreenProps) {
  const [team1, setTeam1] = useState<any[]>([]);
  const [team2, setTeam2] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [isCaptain, setIsCaptain] = useState(false);

  // Estado para el diálogo de eliminación
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPlayerDetails = async () => {
      if (!match.players || match.players.length === 0) {
        setLoadingPlayers(false);
        return;
      }
      setLoadingPlayers(true);
      try {
        const playerPromises = match.players.map(async (playerId: string) => {
          const playerDocRef = doc(db, 'jugador', playerId);
          const playerDocSnap = await getDoc(playerDocRef);
          if (playerDocSnap.exists()) {
            return { id: playerId, ...playerDocSnap.data() };
          }
          return { id: playerId, name: 'Jugador Desconocido', rating: 0, position: 'Jugador' };
        });
        const allPlayers = await Promise.all(playerPromises);

        // Dividir jugadores en dos equipos
        const midIndex = Math.ceil(allPlayers.length / 2);
        setTeam1(allPlayers.slice(0, midIndex));
        setTeam2(allPlayers.slice(midIndex));

      } catch (error) {
        console.error("Error fetching player details:", error);
      } finally {
        setLoadingPlayers(false);
      }
    };

    // Determinar si el usuario actual es el capitán
    setIsCaptain(auth.currentUser?.uid === match.captainId);

    fetchPlayerDetails();
  }, [match.players]);

  const handleReportPlayer = (player: any) => {
    onNavigate('report-player', { player, match });
  };

  const handleMovePlayer = (player: any, fromTeam: 1 | 2) => {
    if (fromTeam === 1) {
      setTeam1(prev => prev.filter(p => p.id !== player.id));
      setTeam2(prev => [...prev, player]);
    } else {
      setTeam2(prev => prev.filter(p => p.id !== player.id));
      setTeam1(prev => [...prev, player]);
    }
  };

  const openDeleteDialog = (player: any) => {
    if (player.id === match.captainId) return; // No se puede eliminar al capitán
    setPlayerToDelete(player);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!playerToDelete) return;

    setIsDeleting(true);
    try {
      // Usar el servicio para eliminar al jugador del partido
      await leaveMatch(match.id, playerToDelete.id);

      // Simular notificación al jugador eliminado
      toast.info(`Se ha notificado a ${playerToDelete.name} que fue eliminado del partido.`);

      // Actualizar la UI eliminando al jugador de los equipos locales
      setTeam1(prev => prev.filter(p => p.id !== playerToDelete.id));
      setTeam2(prev => prev.filter(p => p.id !== playerToDelete.id));

      toast.success(`${playerToDelete.name} ha sido eliminado del partido.`);

    } catch (error: any) {
      console.error("Error al eliminar jugador:", error);
      toast.error("Error al eliminar", { description: error.message });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setPlayerToDelete(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Fecha no disponible';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderPlayerCard = (player: any, isMyTeam: boolean) => (
    <Card key={player.id} className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarFallback className={`${isMyTeam ? 'bg-[#00a884]' : 'bg-[#172c44]'} text-white font-bold`}>
                {getInitials(player.name)}
              </AvatarFallback>
            </Avatar>
            {player.id === match.captainId && (
              <div className="absolute -top-1 -right-1 bg-[#f4b400] rounded-full p-1">
                <Shield size={12} className="text-[#172c44]" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[#172c44]">{player.name}</p>
              {player.id === match.captainId && (
                <Badge variant="outline" className="text-xs border-[#f4b400] text-[#f4b400]">
                  Capitán
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{player.position || 'Jugador'}</p>
            <div className="flex items-center gap-1">
              <Star className="text-[#f4b400]" size={12} fill="currentColor" />
              <span className="text-xs text-gray-600">{player.rating || 'N/A'}</span>
            </div>
          </div>
          
          {/* Menú de acciones para el capitán */}
          {isCaptain && player.id !== match.captainId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleMovePlayer(player, isMyTeam ? 1 : 2)}>
                  <Move className="mr-2 h-4 w-4" />
                  <span>Mover a Equipo {isMyTeam ? 2 : 1}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleReportPlayer(player)}
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  <span>Reportar Jugador</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => openDeleteDialog(player)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Eliminar del partido</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
                <CardTitle className="text-[#172c44] text-lg">{match.location?.address || 'Ubicación no disponible'}</CardTitle>
                <p className="text-sm text-gray-600">{formatDate(match.date)} • {match.time}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-[#00a884]">
                  <Users size={16} />
                  <span>{match.currentPlayers || 0} jugadores</span>
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
              Equipo 1 ({team1.length})
            </TabsTrigger>
            <TabsTrigger value="rival-team" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#172c44] rounded-full"></div>
              Equipo 2 ({team2.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-team" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-[#172c44] mb-3 flex items-center gap-2">
                <div className="w-4 h-4 bg-[#00a884] rounded-full"></div>
                Equipo 1
              </h3>
              {userType === 'player' && (
                <p className="text-sm text-gray-600 mb-4">
                  Estos son los jugadores del primer equipo.
                </p>
              )}
            </div>
            {loadingPlayers ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-500" /></div>
            ) : (
              team1.map((player) => renderPlayerCard(player, true))
            )}
          </TabsContent>

          <TabsContent value="rival-team" className="space-y-0">
            <div className="mb-4">
              <h3 className="text-[#172c44] mb-3 flex items-center gap-2">
                <div className="w-4 h-4 bg-[#172c44] rounded-full"></div>
                Equipo Rival
              </h3>
              {userType === 'player' && (
                <p className="text-sm text-gray-600 mb-4">
                  Estos son los jugadores del segundo equipo.
                </p>
              )}
            </div>
            {loadingPlayers ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-500" /></div>
            ) : (
              team2.map((player) => renderPlayerCard(player, false))
            )}
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

      {/* Diálogo de confirmación para eliminar jugador */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {playerToDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará al jugador del partido. Se le enviará una notificación.
              ¿Estás seguro?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

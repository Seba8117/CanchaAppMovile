import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Users, Calendar, Settings, Eye, Edit, Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { AppHeader } from '../../common/AppHeader';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';

interface TournamentManagementScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
  tournament?: any;
}

export function TournamentManagementScreen({ onBack, onNavigate, tournament }: TournamentManagementScreenProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Datos de ejemplo del torneo
  const tournamentData = tournament || {
    id: 1,
    name: 'Copa Primavera 2024',
    sport: 'Fútbol ⚽',
    format: 'Eliminación Simple',
    maxTeams: 16,
    registeredTeams: 12,
    entryFee: 50000,
    startDate: '2024-03-15T10:00',
    endDate: '2024-03-17T18:00',
    status: 'registration',
    prizePools: '1° $500.000, 2° $300.000, 3° $150.000',
    description: 'Torneo de fútbol amateur para equipos locales',
    courts: ['Cancha Principal', 'Cancha Norte'],
    registeredTeamsData: [
      {
        id: 1,
        name: 'Los Tigres FC',
        captain: 'Juan Pérez',
        players: 15,
        registrationDate: '2024-02-20',
        status: 'confirmed',
        contact: 'juan@tigresfc.com'
      },
      {
        id: 2,
        name: 'Águilas United',
        captain: 'María González',
        players: 18,
        registrationDate: '2024-02-22',
        status: 'confirmed',
        contact: 'maria@aguilas.com'
      },
      {
        id: 3,
        name: 'Leones de Oro',
        captain: 'Carlos Rodríguez',
        players: 16,
        registrationDate: '2024-02-25',
        status: 'pending',
        contact: 'carlos@leones.com'
      },
      {
        id: 4,
        name: 'Dragones FC',
        captain: 'Ana Martínez',
        players: 14,
        registrationDate: '2024-02-28',
        status: 'confirmed',
        contact: 'ana@dragones.com'
      }
    ]
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'registration': { label: 'Inscripciones Abiertas', color: 'bg-blue-500' },
      'in-progress': { label: 'En Progreso', color: 'bg-[#f4b400]' },
      'completed': { label: 'Finalizado', color: 'bg-green-500' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-500' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.registration;
    
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTeamStatusBadge = (status: string) => {
    const statusMap = {
      'confirmed': { label: 'Confirmado', color: 'bg-green-500', icon: CheckCircle },
      'pending': { label: 'Pendiente', color: 'bg-[#f4b400]', icon: Clock },
      'rejected': { label: 'Rechazado', color: 'bg-red-500', icon: AlertCircle }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const Icon = statusInfo.icon;
    
    return (
      <Badge className={`${statusInfo.color} text-white flex items-center gap-1`}>
        <Icon size={12} />
        {statusInfo.label}
      </Badge>
    );
  };

  const handleTeamAction = (teamId: number, action: 'approve' | 'reject' | 'view') => {
    switch (action) {
      case 'approve':
        toast.success(`Equipo ${teamId} aprobado`);
        break;
      case 'reject':
<<<<<<< Updated upstream
        toast.warning(`Equipo ${teamId} rechazado`);
=======
        toast.error(`Equipo ${teamId} rechazado`);
>>>>>>> Stashed changes
        break;
      case 'view':
        // Navegar a detalles del equipo
        onNavigate('team-details', { teamId, tournamentId: tournamentData.id });
        break;
    }
  };

  const handleDeleteTournament = () => {
    toast.success('Torneo eliminado exitosamente');
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#f4b400] to-[#e6a200]">
      <AppHeader 
        title="Gestión de Torneo" 
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
          </Button>
        }
        rightContent={
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onNavigate('edit-tournament', tournamentData)}
          >
            <Edit size={16} />
          </Button>
        }
      />

      <div className="p-4 pb-20 space-y-6">
        {/* Header del Torneo */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-[#172c44] mb-2">{tournamentData.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{tournamentData.sport}</span>
                  {getStatusBadge(tournamentData.status)}
                </div>
                <p className="text-gray-600 text-sm">{tournamentData.description}</p>
              </div>
              <Trophy className="text-[#f4b400]" size={32} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-[#00a884] to-[#00a884]/80 text-white p-3 rounded-lg">
                <p className="text-sm opacity-90">Equipos Registrados</p>
                <p className="text-xl font-bold">{tournamentData.registeredTeams || 0}/{tournamentData.maxTeams || 0}</p>
              </div>
              <div className="bg-gradient-to-r from-[#f4b400] to-[#f4b400]/80 text-[#172c44] p-3 rounded-lg">
                <p className="text-sm opacity-90">Cuota de Inscripción</p>
                <p className="text-xl font-bold">${((tournamentData.entryFee || 0) / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Gestión */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Tab Resumen */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                  <Calendar size={20} />
                  Información del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Formato</p>
                    <p className="text-[#172c44]">{tournamentData.format || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Inicio</p>
                    <p className="text-[#172c44]">
                      {tournamentData.startDate 
                        ? new Date(tournamentData.startDate).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : 'Fecha no especificada'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Canchas</p>
                    <p className="text-[#172c44]">{tournamentData.courts?.join(', ') || 'No especificadas'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Premios</p>
                    <p className="text-[#172c44]">{tournamentData.prizePools || 'No especificados'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44]">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tasa de Ocupación</span>
                    <span className="font-bold text-[#172c44]">
                      {Math.round(((tournamentData.registeredTeams || 0) / (tournamentData.maxTeams || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#00a884] h-2 rounded-full" 
                      style={{width: `${((tournamentData.registeredTeams || 0) / (tournamentData.maxTeams || 1)) * 100}%`}}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ingresos Estimados</span>
                    <span className="font-bold text-[#172c44]">
                      ${(((tournamentData.registeredTeams || 0) * (tournamentData.entryFee || 0)) / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Equipos */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-[#172c44] text-xl">Equipos Registrados</h2>
              <Badge className="bg-[#00a884] text-white">
                {tournamentData.registeredTeamsData?.length || 0} equipos
              </Badge>
            </div>

            {tournamentData.registeredTeamsData?.length > 0 ? tournamentData.registeredTeamsData.map((team: any) => (
              <Card key={team.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                          {team.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || team.name?.slice(0, 2) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-[#172c44] font-medium">{team.name}</h3>
                        <p className="text-sm text-gray-600">Capitán: {team.captain}</p>
                      </div>
                    </div>
                    {getTeamStatusBadge(team.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-gray-600">Jugadores: </span>
                      <span className="text-[#172c44]">{team.players}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Registro: </span>
                      <span className="text-[#172c44]">
                        {new Date(team.registrationDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Contacto: </span>
                      <span className="text-[#172c44]">{team.contact}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleTeamAction(team.id, 'view')}
                    >
                      <Eye size={14} className="mr-1" />
                      Ver Detalles
                    </Button>
                    {team.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
                          onClick={() => handleTeamAction(team.id, 'approve')}
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Aprobar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-300"
                          onClick={() => handleTeamAction(team.id, 'reject')}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay equipos registrados aún</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Configuración */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                  <Settings size={20} />
                  Acciones del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full text-[#00a884] border-[#00a884]"
                  onClick={() => onNavigate('edit-tournament', tournamentData)}
                >
                  <Edit size={16} className="mr-2" />
                  Editar Información del Torneo
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast('Próximamente: Generar fixture')}
                >
                  <Calendar size={16} className="mr-2" />
                  Generar Fixture
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => toast('Próximamente: Exportar datos')}
                >
                  Exportar Lista de Equipos
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full text-red-600 border-red-300"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Eliminar Torneo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar torneo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el torneo "{tournamentData.name}" y todos los datos relacionados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteTournament}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

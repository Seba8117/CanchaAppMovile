import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Trophy, Users, Calendar, MapPin, Clock, Star, Award, Info, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { AppHeader } from '../../common/AppHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';

interface TournamentDetailScreenProps {
  onBack: () => void;
  tournament?: any;
  userType?: 'player' | 'owner';
}

export function TournamentDetailScreen({ onBack, tournament, userType = 'player' }: TournamentDetailScreenProps) {
  const [isRegistered, setIsRegistered] = useState(false);

  // Datos de ejemplo del torneo con valores por defecto
  const defaultTournamentData = {
    id: 1,
    name: 'Copa de Fútbol Santiago',
    sport: 'Fútbol ⚽',
    prize: '$50.000',
    teams: 16,
    registeredTeamsCount: 12,
    format: 'Eliminación directa',
    startDate: '25 Sep 2024',
    endDate: '15 Oct 2024',
    location: 'Múltiples canchas',
    registrationDeadline: '20 Sep 2024',
    status: 'Inscripciones abiertas',
    organizer: 'Liga Deportiva Santiago',
    description: 'El torneo de fútbol más grande de Santiago. 16 equipos compitiendo por el título y premios en efectivo.',
    rules: [
      'Equipos de máximo 15 jugadores',
      'Partidos de 90 minutos (2 tiempos de 45 min)',
      'Máximo 3 sustituciones por equipo',
      'Sistema de eliminación directa desde octavos',
      'En caso de empate: penales directos'
    ],
    requirements: [
      'Jugadores mayores de 18 años',
      'Seguro deportivo vigente',
      'Cédula de identidad',
      'Cuota de inscripción: $25.000 por equipo'
    ],
    courts: ['Cancha Municipal Norte', 'Cancha Municipal Sur', 'Estadio Central'],
    contact: {
      organizer: 'Liga Deportiva Santiago',
      phone: '+56 9 8888 7777',
      email: 'torneos@ligasantiago.cl',
      website: 'www.ligasantiago.cl'
    },
    registeredTeams: [
      {
        id: 1,
        name: 'Los Tigres FC',
        captain: 'Juan Pérez',
        registrationDate: '2024-09-10',
        players: 15
      },
      {
        id: 2,
        name: 'Águilas United',
        captain: 'María González',
        registrationDate: '2024-09-12',
        players: 18
      },
      {
        id: 3,
        name: 'Leones de Oro',
        captain: 'Carlos Rodríguez',
        registrationDate: '2024-09-14',
        players: 16
      },
      {
        id: 4,
        name: 'Dragones FC',
        captain: 'Ana Martínez',
        registrationDate: '2024-09-15',
        players: 14
      }
    ]
  };

  // Combinar datos del torneo pasado con valores por defecto
  const tournamentData = {
    ...defaultTournamentData,
    ...tournament,
    // Asegurar que registeredTeams sea siempre un array
    registeredTeams: Array.isArray(tournament?.registeredTeams) 
      ? tournament.registeredTeams 
      : defaultTournamentData.registeredTeams
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'Inscripciones abiertas': { label: 'Inscripciones Abiertas', color: 'bg-green-500' },
      'En curso': { label: 'En Progreso', color: 'bg-[#f4b400]' },
      'Finalizado': { label: 'Finalizado', color: 'bg-gray-500' },
      'Próximamente': { label: 'Próximamente', color: 'bg-blue-500' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['Próximamente'];
    
    return (
      <Badge className={`${statusInfo.color} text-white`}>
        {statusInfo.label}
      </Badge>
    );
  };

  const handleRegistration = () => {
    if (userType === 'owner') {
      toast.error('Los dueños de canchas no pueden inscribirse en torneos');
      return;
    }
    
    setIsRegistered(true);
    toast.success('¡Inscripción exitosa! Te contactaremos pronto con más detalles.');
  };

  const getRegisteredTeamsCount = () => {
    if (Array.isArray(tournamentData.registeredTeams)) {
      return tournamentData.registeredTeams.length;
    }
    return typeof tournamentData.registeredTeams === 'number' ? tournamentData.registeredTeams : 0;
  };

  const canRegister = tournamentData.status === 'Inscripciones abiertas' && 
                     getRegisteredTeamsCount() < tournamentData.teams &&
                     userType === 'player' &&
                     !isRegistered;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      <AppHeader 
        title="Detalles del Torneo" 
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft size={20} />
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
                <p className="text-gray-600 text-sm mb-3">{tournamentData.organizer}</p>
                <p className="text-gray-700">{tournamentData.description}</p>
              </div>
              <div className="text-center">
                <Trophy className="text-[#f4b400] mx-auto mb-2" size={32} />
                <p className="text-2xl font-bold text-[#00a884]">{tournamentData.prize}</p>
                <p className="text-sm text-gray-600">Premio</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-r from-[#00a884] to-[#00a884]/80 text-white p-3 rounded-lg">
                <p className="text-sm opacity-90">Equipos Inscritos</p>
                <p className="text-xl font-bold">{getRegisteredTeamsCount()}/{tournamentData.teams}</p>
              </div>
              <div className="bg-gradient-to-r from-[#f4b400] to-[#f4b400]/80 text-[#172c44] p-3 rounded-lg">
                <p className="text-sm opacity-90">Formato</p>
                <p className="text-lg font-bold">{tournamentData.format}</p>
              </div>
            </div>

            {/* Fecha límite de inscripción destacada */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-yellow-700" size={16} />
                <span className="text-sm text-yellow-800">
                  <strong>Inscripciones hasta:</strong> {tournamentData.registrationDeadline}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Información */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="rules">Reglas</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
          </TabsList>

          {/* Tab Información */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                  <Info size={20} />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Inicio</p>
                    <p className="text-[#172c44] font-medium">{tournamentData.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Fin</p>
                    <p className="text-[#172c44] font-medium">{tournamentData.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ubicación</p>
                    <p className="text-[#172c44] font-medium">{tournamentData.location}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Máximo Equipos</p>
                    <p className="text-[#172c44] font-medium">{tournamentData.teams} equipos</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Canchas Disponibles</p>
                  <div className="space-y-2">
                    {tournamentData.courts.map((court: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <MapPin size={14} className="text-[#00a884]" />
                        <span className="text-[#172c44]">{court}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Reglas */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                  <Award size={20} />
                  Reglas del Torneo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tournamentData.rules.map((rule: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-[#00a884] mt-0.5 flex-shrink-0" />
                      <span className="text-[#172c44]">{rule}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44]">Requisitos de Inscripción</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tournamentData.requirements.map((req: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Star size={16} className="text-[#f4b400] mt-0.5 flex-shrink-0" fill="currentColor" />
                      <span className="text-[#172c44]">{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Equipos */}
          <TabsContent value="teams" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-white text-xl">Equipos Inscritos</h2>
              <Badge className="bg-[#00a884] text-white">
                {getRegisteredTeamsCount()} de {tournamentData.teams}
              </Badge>
            </div>

            {Array.isArray(tournamentData.registeredTeams) ? 
              tournamentData.registeredTeams.map((team: any) => (
              <Card key={team.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                        {team.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-[#172c44] font-medium">{team.name}</h3>
                      <p className="text-sm text-gray-600">Capitán: {team.captain}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{team.players} jugadores</p>
                      <p className="text-xs text-gray-500">
                        Inscrito: {new Date(team.registrationDate).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              )) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="mx-auto text-gray-400 mb-2" size={32} />
                    <p className="text-gray-600">
                      {getRegisteredTeamsCount()} equipos inscritos
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Los detalles de los equipos se mostrarán próximamente
                    </p>
                  </CardContent>
                </Card>
              )
            }

            {getRegisteredTeamsCount() < tournamentData.teams && (
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="p-6 text-center">
                  <Users className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600">
                    {tournamentData.teams - getRegisteredTeamsCount()} cupos disponibles
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Contacto */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-[#172c44]">Información de Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Organizador</p>
                  <p className="text-[#172c44] font-medium">{tournamentData.contact.organizer}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="text-[#172c44] font-medium">{tournamentData.contact.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-[#172c44] font-medium">{tournamentData.contact.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sitio Web</p>
                  <p className="text-[#00a884] font-medium">{tournamentData.contact.website}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botón de Inscripción */}
        {userType === 'player' && (
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onBack}
                >
                  Volver
                </Button>
                
                {isRegistered ? (
                  <Button 
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    disabled
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Inscrito
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        className={`flex-1 ${
                          canRegister
                            ? 'bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        disabled={!canRegister}
                      >
                        {canRegister ? 'Inscribirse' : 'No Disponible'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Inscripción</AlertDialogTitle>
                        <AlertDialogDescription>
                          ¿Estás seguro que quieres inscribir tu equipo en "{tournamentData.name}"? 
                          Esta acción requiere el pago de la cuota de inscripción.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleRegistration}
                          className="bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
                        >
                          Confirmar Inscripción
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

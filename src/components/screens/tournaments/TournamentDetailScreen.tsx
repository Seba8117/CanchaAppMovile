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
        <div className="flex flex-col items-center text-center mb-2">
          <h2 className="text-white text-2xl font-bold">🏆 Torneos</h2>
          <p className="text-white/80 text-sm mt-1">Próximamente</p>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-[#172c44] font-semibold">Estamos trabajando en esta sección</p>
            <p className="text-[#172c44] text-sm">Pronto podrás ver detalles de torneos aquí</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

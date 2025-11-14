import { Trophy, Users, Calendar, MapPin, Clock } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { AppHeader } from '../../common/AppHeader';
import { OwnerNavigation } from '../../navigation/OwnerNavigation';

interface TournamentsScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string, data?: any) => void;
  userType?: 'player' | 'owner';
}

export function TournamentsScreen({ onBack, onNavigate, userType = 'player' }: TournamentsScreenProps) {
  // Diferentes torneos según el tipo de usuario
  const playerTournaments = [
    {
      id: 1,
      name: 'Copa de Fútbol Santiago',
      sport: 'Fútbol',
      prize: '$50.000',
      teams: 16,
      registeredTeams: 12,
      format: 'Eliminación directa',
      startDate: '25 Sep 2024',
      endDate: '15 Oct 2024',
      location: 'Múltiples canchas',
      registrationDeadline: '20 Sep 2024',
      status: 'Inscripciones abiertas',
      organizer: 'Liga Deportiva Santiago',
      description: 'El torneo de fútbol más grande de Santiago. 16 equipos compitiendo por el título.'
    },
    {
      id: 2,
      name: 'Torneo de Básquetball',
      sport: 'Básquetball',
      prize: '$30.000',
      teams: 8,
      registeredTeams: 6,
      format: 'Round Robin',
      startDate: '30 Sep 2024',
      endDate: '10 Oct 2024',
      location: 'Polideportivo Central',
      registrationDeadline: '25 Sep 2024',
      status: 'Inscripciones abiertas',
      organizer: 'Club Básquetball Pro',
      description: 'Torneo de básquetball 3x3. Formato round robin con playoffs.'
    },
    {
      id: 3,
      name: 'Liga de Tenis Mixto',
      sport: 'Tenis',
      prize: '$20.000',
      teams: 12,
      registeredTeams: 8,
      format: 'Liga',
      startDate: '05 Oct 2024',
      endDate: '25 Oct 2024',
      location: 'Club de Tenis Las Condes',
      registrationDeadline: '28 Sep 2024',
      status: 'Próximamente',
      organizer: 'Federación de Tenis Amateur',
      description: 'Liga de tenis en parejas mixtas. Todos los niveles bienvenidos.'
    }
  ];

  const ownerTournaments = [
    {
      id: 1,
      name: 'Copa Primavera 2024',
      sport: 'Fútbol',
      prize: '$500.000',
      teams: 16,
      registeredTeams: 12,
      format: 'Eliminación Simple',
      startDate: '15 Mar 2024',
      endDate: '17 Mar 2024',
      location: 'Mis Canchas',
      registrationDeadline: '10 Mar 2024',
      status: 'En curso',
      organizer: 'Mi Complejo Deportivo',
      description: 'Torneo de fútbol organizado en nuestras instalaciones. Gran participación.'
    },
    {
      id: 2,
      name: 'Torneo Básquetball Amateur',
      sport: 'Básquetball',
      prize: '$300.000',
      teams: 8,
      registeredTeams: 8,
      format: 'Round Robin',
      startDate: '25 Mar 2024',
      endDate: '27 Mar 2024',
      location: 'Cancha Básquetball',
      registrationDeadline: '20 Mar 2024',
      status: 'Inscripciones abiertas',
      organizer: 'Mi Complejo Deportivo',
      description: 'Torneo de básquetball 3x3 en nuestras modernas instalaciones.'
    },
    {
      id: 3,
      name: 'Copa de Tenis Mixto',
      sport: 'Tenis',
      prize: '$200.000',
      teams: 12,
      registeredTeams: 7,
      format: 'Liga',
      startDate: '05 Abr 2024',
      endDate: '15 Abr 2024',
      location: 'Canchas de Tenis',
      registrationDeadline: '01 Abr 2024',
      status: 'Finalizado',
      organizer: 'Mi Complejo Deportivo',
      description: 'Torneo de tenis en parejas mixtas con gran éxito de participación.'
    }
  ];

  const tournaments = userType === 'owner' ? ownerTournaments : playerTournaments;

  const getSportEmoji = (sport: string) => {
    switch (sport) {
      case 'Fútbol': return '⚽';
      case 'Básquetball': return '🏀';
      case 'Tenis': return '🎾';
      default: return '🏆';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Inscripciones abiertas': return 'bg-green-100 text-green-700';
      case 'Próximamente': return 'bg-blue-100 text-blue-700';
      case 'En curso': return 'bg-yellow-100 text-yellow-700';
      case 'Finalizado': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`min-h-screen ${userType === 'owner' ? 'pb-24' : 'pb-20'} relative overflow-hidden ${
      userType === 'owner' 
        ? 'bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b]'
        : 'bg-gradient-to-br from-[#172c44] to-[#00a884]'
    }`}>
      {userType === 'owner' && (
        <>
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-[#00a884]/10"></div>
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#172c44]/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-gradient-to-tr from-[#00a884]/25 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#f4b400]/20 to-[#ffd54f]/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-tl from-[#172c44]/15 to-transparent rounded-full blur-2xl"></div>
          
          {/* Patrón de puntos */}
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-20 left-10 w-2 h-2 bg-[#172c44] rounded-full animate-pulse"></div>
            <div className="absolute top-40 right-16 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1000"></div>
            <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-[#172c44] rounded-full animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-20 right-8 w-1 h-1 bg-[#00a884] rounded-full animate-pulse animation-delay-500"></div>
            <div className="absolute top-60 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1500"></div>
          </div>
        </>
      )}

      <div className={userType === 'owner' ? 'relative z-10' : ''}>
        <AppHeader 
          title={userType === 'owner' ? '🏆 Torneos' : 'Torneos'}
          showLogo={true}
          showBackButton={userType !== 'owner'}
          onBack={userType !== 'owner' ? onBack : undefined}
          titleClassName={userType === 'owner' ? "font-['Outfit'] font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent" : undefined}
          rightContent={
            userType === 'owner' ? (
              <Button 
                size="sm" 
                className="bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] border-none shadow-sm"
                onClick={() => onNavigate?.('create-tournament')}
              >
                + Torneo
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="text-[#172c44] border-[#172c44]">
                Filtros
              </Button>
            )
          }
        />

        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className={userType === 'owner' ? 'text-[#172c44]' : 'text-white'}>
              {userType === 'owner' ? 'Mis Torneos' : 'Torneos Disponibles'}
            </h2>
            <span className={`text-sm ${userType === 'owner' ? 'text-[#172c44]/60' : 'text-[#172c44]'}`}>{tournaments.length} torneos</span>
          </div>

          <div className="space-y-4">
            {tournaments.map((tournament) => (
              <Card key={tournament.id} className={`cursor-pointer transition-all ${
                userType === 'owner' 
                  ? 'border-2 border-gray-100 hover:border-[#f4b400] hover:shadow-sm bg-white' 
                  : 'hover:shadow-md'
              }`}>
                <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {getSportEmoji(tournament.sport)}
                    </div>
                    <div>
                      <h3 className="text-[#172c44] text-lg mb-1">{tournament.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{tournament.organizer}</p>
                      <Badge 
                        variant="secondary"
                        className={getStatusColor(tournament.status)}
                      >
                        {tournament.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-[#00a884] mb-1">{tournament.prize}</div>
                    <div className="text-sm text-gray-600">Premio</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-4">{tournament.description}</p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="text-[#172c44]" size={16} />
                    <span className="text-sm">
                      {Array.isArray(tournament.registeredTeams) 
                        ? tournament.registeredTeams.length 
                        : tournament.registeredTeams || 0}/{tournament.teams} equipos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="text-[#172c44]" size={16} />
                    <span className="text-sm">{tournament.format}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-[#172c44]" size={16} />
                    <span className="text-sm">{tournament.startDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="text-[#172c44]" size={16} />
                    <span className="text-sm">{tournament.location}</span>
                  </div>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="text-yellow-700" size={16} />
                    <span className="text-sm text-yellow-800">
                      <strong>Inscripciones hasta:</strong> {tournament.registrationDeadline}
                    </span>
                  </div>
                </div>

                {userType === 'owner' ? (
                  // Vista para dueños de canchas
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1 border-2 border-gray-200 text-[#172c44] hover:bg-gray-50"
                      onClick={() => onNavigate?.('tournament-management', tournament)}
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] shadow-sm"
                      onClick={() => onNavigate?.('tournament-management', tournament)}
                    >
                      Gestionar
                    </Button>
                  </div>
                ) : (
                  // Vista para jugadores
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="flex-1"
                      onClick={() => onNavigate?.('tournament-detail', tournament)}
                    >
                      Ver Detalles
                    </Button>
                    <Button 
                      className={`flex-1 ${
                        tournament.status === 'Inscripciones abiertas'
                          ? 'bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={tournament.status !== 'Inscripciones abiertas'}
                      onClick={() => onNavigate?.('tournament-detail', tournament)}
                    >
                      {tournament.status === 'Inscripciones abiertas' ? 'Inscribirse' : 'No disponible'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      </div>

      {userType === 'owner' && (
        <OwnerNavigation 
          activeTab="tournaments"
          onTabChange={(screen) => onNavigate?.(screen)}
        />
      )}
    </div>
  );
}

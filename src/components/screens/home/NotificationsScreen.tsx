import { Bell, Users, Calendar, Trophy, AlertTriangle, Vote } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';

interface NotificationsScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string, data?: any) => void;
}

export function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  const notifications = [
    {
      id: 1,
      type: 'team-delete-vote',
      title: 'Votación para eliminar equipo',
      message: 'El capitán quiere eliminar "Los Tigres FC". Tu voto es necesario.',
      time: 'Hace 5 min',
      read: false,
      icon: Vote,
      actionRequired: true,
      teamId: 1
    },
    {
      id: 2,
      type: 'team-delete-initiated',
      title: 'Proceso de eliminación iniciado',
      message: 'Has iniciado la votación para eliminar "Los Tigres FC". Notificando a miembros...',
      time: 'Hace 10 min',
      read: false,
      icon: AlertTriangle
    },
    {
      id: 3,
      type: 'match',
      title: 'Nuevo partido disponible',
      message: 'Fútbol en Cancha Los Pinos - 19:00',
      time: 'Hace 30 min',
      read: false,
      icon: Calendar
    },
    {
      id: 4,
      type: 'team',
      title: 'Invitación a equipo',
      message: 'Los Águilas FC te invitó a unirte',
      time: 'Hace 1 hora',
      read: false,
      icon: Users
    },
    {
      id: 5,
      type: 'team-delete-reminder',
      title: 'Recordatorio de votación',
      message: 'Quedan 24 horas para votar sobre "Los Tigres FC"',
      time: 'Hace 2 horas',
      read: true,
      icon: Vote
    },
    {
      id: 6,
      type: 'reminder',
      title: 'Recordatorio de partido',
      message: 'Tu partido es en 2 horas',
      time: 'Hace 3 horas',
      read: true,
      icon: Bell
    },
    {
      id: 7,
      type: 'tournament',
      title: 'Nuevo torneo disponible',
      message: 'Copa de Fútbol Santiago - Inscripciones abiertas',
      time: 'Ayer',
      read: true,
      icon: Trophy
    },
    {
      id: 8,
      type: 'team-delete-result',
      title: 'Equipo eliminado',
      message: '"Los Leones FC" ha sido eliminado por votación mayoritaria',
      time: 'Hace 2 días',
      read: true,
      icon: AlertTriangle
    }
  ];

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-blue-100 text-blue-700';
      case 'team': return 'bg-green-100 text-green-700';
      case 'tournament': return 'bg-purple-100 text-purple-700';
      case 'team-delete-vote': return 'bg-red-100 text-red-700';
      case 'team-delete-initiated': return 'bg-orange-100 text-orange-700';
      case 'team-delete-reminder': return 'bg-yellow-100 text-yellow-700';
      case 'team-delete-result': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNotificationBadgeText = (type: string) => {
    switch (type) {
      case 'match': return 'Partido';
      case 'team': return 'Equipo';
      case 'tournament': return 'Torneo';
      case 'team-delete-vote': return 'Votación';
      case 'team-delete-initiated': return 'Eliminación';
      case 'team-delete-reminder': return 'Recordatorio';
      case 'team-delete-result': return 'Resultado';
      default: return 'General';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.type === 'team-delete-vote' && notification.actionRequired && onNavigate) {
      // Navigate to voting screen with team data
      onNavigate('delete-team', {
        id: notification.teamId,
        name: 'Los Tigres FC',
        captain: { id: 1, name: 'Juan Pérez' },
        members: [
          { id: 1, name: 'Juan Pérez', role: 'captain' },
          { id: 2, name: 'Carlos Rodríguez', role: 'member' },
          { id: 3, name: 'Miguel Silva', role: 'member' },
          { id: 4, name: 'Luis Torres', role: 'member' },
          { id: 5, name: 'Diego Morales', role: 'member' },
          { id: 6, name: 'Pedro Herrera', role: 'member' }
        ]
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      <AppHeader 
        title="Notificaciones" 
        showLogo={true}
        showBackButton={true}
        onBack={onBack}
        rightContent={
          <button className="text-[#00a884] text-sm">
            Marcar todas como leídas
          </button>
        }
      />

      <div className="p-4 space-y-3">
        {notifications.map((notification) => {
          const IconComponent = notification.icon;
          
          return (
            <Card 
              key={notification.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-l-[#f4b400] bg-yellow-50' : ''
              } ${
                notification.actionRequired ? 'bg-red-50 border-l-red-500' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    <IconComponent size={16} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`${!notification.read ? 'text-[#172c44] font-medium' : 'text-[#172c44]'}`}>
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#f4b400] rounded-full flex-shrink-0 mt-2"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">{notification.time}</span>
                      <div className="flex items-center space-x-2">
                        {notification.actionRequired && (
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            ¡Acción requerida!
                          </Badge>
                        )}
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${getNotificationColor(notification.type)}`}
                        >
                          {getNotificationBadgeText(notification.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

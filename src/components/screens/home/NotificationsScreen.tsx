import { Bell, Users, Calendar, Trophy, AlertTriangle, Vote, MapPin } from 'lucide-react';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';
import { useEffect, useState } from 'react';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';

interface NotificationsScreenProps {
  onBack?: () => void;
  onNavigate?: (screen: string, data?: any) => void;
}

export function NotificationsScreen({ onBack, onNavigate }: NotificationsScreenProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setItems(rows);
    });
    return () => unsub();
  }, []);

  const markRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match': return 'bg-blue-100 text-blue-700';
      case 'team': return 'bg-green-100 text-green-700';
      case 'tournament': return 'bg-purple-100 text-purple-700';
      case 'team-delete-vote': return 'bg-red-100 text-red-700';
      case 'team-delete-initiated': return 'bg-orange-100 text-orange-700';
      case 'team-delete-reminder': return 'bg-yellow-100 text-yellow-700';
      case 'team-delete-result': return 'bg-red-100 text-red-700';
      case 'proximity': return 'bg-indigo-100 text-indigo-700';
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
      case 'proximity': return 'Cerca de ti';
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
        {items.map((notification) => {
          const IconComponent = notification.icon;
          
          return (
            <Card 
              key={notification.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${
                !notification.read ? 'border-l-4 border-l-[#f4b400] bg-yellow-50' : ''
              } ${
                notification.actionRequired ? 'bg-red-50 border-l-red-500' : ''
              }`}
              onClick={() => {
                markRead(String(notification.id));
                const actions = notification.actions || [];
                if (Array.isArray(actions)) {
                  const a = actions[0]?.key;
                  if (a === 'join' && onNavigate && notification.data?.matchId) {
                    onNavigate('match-detail', { id: notification.data.matchId });
                  }
                  if (a === 'confirm-booking' && onNavigate) {
                    onNavigate('my-bookings');
                  }
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    {notification.type === 'proximity' ? <MapPin size={16} /> : <Bell size={16} />}
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
                      <span className="text-xs text-gray-500">{notification.time || ''}</span>
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
import { useState } from 'react';
import { ArrowLeft, Send, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';

interface ChatScreenProps {
  onBack: () => void;
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const chats = [
    {
      id: '1',
      type: 'match',
      name: 'Partido Fútbol - Los Pinos',
      lastMessage: 'Juan: ¿Confirmamos para las 7?',
      time: '10:30',
      unread: 2,
      participants: 8,
      avatar: '⚽'
    },
    {
      id: '2',
      type: 'team',
      name: 'Los Tigres FC',
      lastMessage: 'María: Entrenamiento cancelado',
      time: 'Ayer',
      unread: 0,
      participants: 15,
      avatar: '🐅'
    },
    {
      id: '3',
      type: 'direct',
      name: 'Carlos Silva',
      lastMessage: '¿Jugamos tenis mañana?',
      time: 'Ayer',
      unread: 1,
      participants: 2,
      avatar: 'CS'
    }
  ];

  const messages = [
    {
      id: 1,
      sender: 'Juan Pérez',
      message: '¡Hola equipo! ¿Listos para el partido de hoy?',
      time: '09:30',
      isMe: false,
      avatar: 'JP'
    },
    {
      id: 2,
      sender: 'María González',
      message: '¡Claro! Ya tengo todo listo',
      time: '09:32',
      isMe: false,
      avatar: 'MG'
    },
    {
      id: 3,
      sender: 'Yo',
      message: 'Perfecto, nos vemos a las 7 en la cancha',
      time: '09:35',
      isMe: true,
      avatar: 'YO'
    },
    {
      id: 4,
      sender: 'Carlos Silva',
      message: '¿Alguien puede traer una pelota extra?',
      time: '10:15',
      isMe: false,
      avatar: 'CS'
    },
    {
      id: 5,
      sender: 'Yo',
      message: 'Yo puedo traer una',
      time: '10:16',
      isMe: true,
      avatar: 'YO'
    },
    {
      id: 6,
      sender: 'Juan Pérez',
      message: '¿Confirmamos para las 7? Ya pagué el arriendo de la cancha',
      time: '10:30',
      isMe: false,
      avatar: 'JP'
    }
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Aquí se enviaría el mensaje
      setNewMessage('');
    }
  };

  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)}>
                <ArrowLeft className="text-[#172c44]" size={24} />
              </button>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                  ⚽
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-[#172c44]">Partido Fútbol - Los Pinos</h1>
                <p className="text-sm text-gray-600">8 participantes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Phone size={20} className="text-[#172c44]" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video size={20} className="text-[#172c44]" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreVertical size={20} className="text-[#172c44]" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 pb-36">
          {messages.map((message) => (
            <div 
              key={message.id}
              className={`flex gap-3 ${message.isMe ? 'flex-row-reverse' : ''}`}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-200 text-[#172c44] text-xs">
                  {message.avatar}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 max-w-xs ${message.isMe ? 'items-end' : ''}`}>
                <div className={`p-3 rounded-lg ${
                  message.isMe 
                    ? 'bg-[#f4b400] text-[#172c44] ml-auto' 
                    : 'bg-white text-[#172c44] shadow-sm'
                }`}>
                  {!message.isMe && (
                    <p className="text-xs text-gray-600 mb-1">{message.sender}</p>
                  )}
                  <p className="text-sm">{message.message}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-1">{message.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="fixed bottom-16 left-0 right-0 max-w-sm mx-auto bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              className="bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
            >
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header */}
      <AppHeader 
        title="Mensajes" 
        showLogo={true}
        showBackButton={true}
        onBack={onBack}
      />
      
      <div className="p-4">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="matches">Partidos</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-4 pb-4">
        <Tabs defaultValue="all">
          <TabsContent value="all" className="space-y-3">
            {chats.map((chat) => (
              <Card 
                key={chat.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedChat(chat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                          {chat.avatar}
                        </AvatarFallback>
                      </Avatar>
                      {chat.type === 'team' && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#00a884] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">T</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[#172c44] truncate">{chat.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{chat.time}</span>
                          {chat.unread > 0 && (
                            <Badge className="bg-[#f4b400] text-[#172c44] text-xs px-2 py-1">
                              {chat.unread}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {chat.participants} participantes
                        </span>
                        <Badge 
                          variant="secondary"
                          className={`text-xs ${
                            chat.type === 'match' ? 'bg-blue-100 text-blue-700' :
                            chat.type === 'team' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {chat.type === 'match' ? 'Partido' :
                           chat.type === 'team' ? 'Equipo' : 'Directo'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="matches" className="space-y-3">
            {chats.filter(chat => chat.type === 'match').map((chat) => (
              <Card 
                key={chat.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedChat(chat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                        {chat.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[#172c44]">{chat.name}</h3>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{chat.lastMessage}</p>
                    </div>
                    {chat.unread > 0 && (
                      <Badge className="bg-[#f4b400] text-[#172c44]">
                        {chat.unread}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="teams" className="space-y-3">
            {chats.filter(chat => chat.type === 'team').map((chat) => (
              <Card 
                key={chat.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedChat(chat.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-[#00a884] text-white">
                        {chat.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-[#172c44]">{chat.name}</h3>
                        <span className="text-xs text-gray-500">{chat.time}</span>
                      </div>
                      <p className="text-sm text-gray-600">{chat.lastMessage}</p>
                    </div>
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

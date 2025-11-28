import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Loader2, MessageCircle, User, Calendar } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  DocumentData,
  addDoc,
  serverTimestamp,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
// --- FIN: Importaciones de Firebase ---

interface ChatScreenOwnerProps {
  onBack: () => void;
}

export function ChatScreenOwner({ onBack }: ChatScreenOwnerProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [chats, setChats] = useState<DocumentData[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);

  const [selectedChat, setSelectedChat] = useState<DocumentData | null>(null);
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // --- 1. Cargar Nombre del Dueño ---
  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        // Prioridad: Buscar en la colección 'dueno'
        try {
          const ownerDocRef = doc(db, 'dueno', currentUser.uid);
          const ownerDocSnap = await getDoc(ownerDocRef);
          
          if (ownerDocSnap.exists()) {
            // Usamos el nombre del dueño o el nombre del negocio
            setUserDisplayName(ownerDocSnap.data().ownerName || ownerDocSnap.data().businessName || 'Dueño');
          } else {
            setUserDisplayName(currentUser.displayName || currentUser.email || 'Dueño');
          }
        } catch (error) {
          console.error("Error al obtener nombre del dueño", error);
        }
      }
    };
    fetchUserName();
  }, [currentUser]);

  // --- 2. Cargar Chats (Donde el dueño es participante) ---
  useEffect(() => {
    if (!currentUser) {
      setLoadingChats(false);
      return;
    }

    setLoadingChats(true);
    // Esta consulta trae todos los chats (partidos) donde el ID del dueño está en la lista
    const q = query(
      collection(db, "chats"), 
      where("participantsUids", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatsData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        chatsData.push({ id: doc.id, ...doc.data() });
      });
      // Ordenar chats por el mensaje más reciente localmente si es necesario
      chatsData.sort((a, b) => (b.lastMessageTimestamp?.toMillis() || 0) - (a.lastMessageTimestamp?.toMillis() || 0));
      
      setChats(chatsData);
      setLoadingChats(false);
    }, (err) => {
      console.error("Error cargando chats:", err);
      setErrorChats("Error al cargar tus conversaciones.");
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- 3. Cargar Mensajes del Chat Seleccionado ---
  useEffect(() => {
    if (!selectedChat) return;

    setLoadingMessages(true);
    setMessages([]); 

    const messagesRef = collection(db, "chats", selectedChat.id, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messagesData);
      setLoadingMessages(false);
    }, (err) => {
      console.error("Error cargando mensajes:", err);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 4. Enviar Mensaje (Como Dueño) ---
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser || !selectedChat) return;

    try {
      const messagesRef = collection(db, "chats", selectedChat.id, "messages");
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: userDisplayName, // Nombre del dueño
        role: 'owner', // Marca el mensaje como del dueño (útil para estilos futuros)
        timestamp: serverTimestamp(),
      });

      const chatRef = doc(db, "chats", selectedChat.id);
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        lastMessageTimestamp: serverTimestamp(),
      });
      
      setNewMessage('');
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
    }
  };

  const getInitials = (name: string = '') => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '..';
  };

  // --------------------------------------------------------------------------
  // VISTA DE UN CHAT SELECCIONADO (Estilo Dueño)
  // --------------------------------------------------------------------------
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-['Outfit']">
        {/* Header del Chat */}
        <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="text-[#172c44]" size={24} />
              </button>
              <Avatar className="w-10 h-10 border-2 border-[#f4b400]">
                <AvatarFallback className="bg-[#f4b400] text-[#172c44] font-bold">
                  {selectedChat.type === 'match' ? '⚽' : '🏆'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-[#172c44] font-bold text-lg leading-tight">{selectedChat.name}</h1>
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <User size={12} />
                  <span>{selectedChat.participantsUids?.length || 0} participantes</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreVertical size={20} className="text-gray-500" />
            </Button>
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-[#f0f2f5]">
          {loadingMessages && (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#f4b400]" /></div>
          )}
          
          {!loadingMessages && messages.map((message) => {
            const isMe = message.senderId === currentUser?.uid;
            return (
              <div key={message.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                {/* Avatar del remitente */}
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className={`text-xs font-bold ${isMe ? 'bg-[#172c44] text-white' : 'bg-white text-[#172c44] border border-gray-200'}`}>
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {/* Nombre del remitente (solo si no soy yo) */}
                  {!isMe && (
                    <span className="text-[10px] text-gray-500 ml-1 mb-0.5 font-semibold">
                      {message.senderName}
                    </span>
                  )}
                  
                  {/* Burbuja del Mensaje */}
                  <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                    isMe 
                      ? 'bg-[#f4b400] text-[#172c44] rounded-tr-sm' // Color Dueño: Amarillo
                      : 'bg-white text-gray-800 rounded-tl-sm' // Color Otros: Blanco
                  }`}>
                    <p>{message.text}</p>
                  </div>
                  
                  {/* Hora */}
                  <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {message.timestamp ? message.timestamp.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Enviando...'}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input de Mensaje */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-6 md:pb-4">
          <div className="max-w-4xl mx-auto flex gap-2 items-center">
            <Input
              placeholder="Escribe un mensaje a los jugadores..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-gray-50 border-gray-200 focus:ring-[#f4b400] focus:border-[#f4b400]"
            />
            <Button 
              onClick={handleSendMessage} 
              className="bg-[#172c44] hover:bg-[#2a3e5a] text-white rounded-full w-10 h-10 p-0 flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              <Send size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VISTA DE LA LISTA DE CHATS (Estilo Dashboard Dueño)
  // --------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b] pb-20 font-['Outfit']">
      <AppHeader 
        title="💬 Chats de Cancha" 
        showLogo={true} 
        showBackButton={true} 
        onBack={onBack} 
        titleClassName="text-[#172c44] font-black text-2xl"
      />
      
      <div className="p-4">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-white/40 backdrop-blur-md p-1 rounded-xl">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-[#172c44] data-[state=active]:text-white text-[#172c44] font-semibold rounded-lg transition-all"
            >
              Todos
            </TabsTrigger>
            <TabsTrigger 
              value="matches" 
              className="data-[state=active]:bg-[#172c44] data-[state=active]:text-white text-[#172c44] font-semibold rounded-lg transition-all"
            >
              Partidos
            </TabsTrigger>
          </TabsList>

          <div className="space-y-3">
            {loadingChats ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-[#172c44] mb-2" size={32} />
                <p className="text-[#172c44] font-medium">Cargando conversaciones...</p>
              </div>
            ) : errorChats ? (
              <Card className="bg-red-50 border-red-200 p-4">
                <p className="text-red-700 text-center font-medium">{errorChats}</p>
              </Card>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <MessageCircle size={32} className="text-[#172c44]" />
                </div>
                <h3 className="text-[#172c44] font-bold text-lg">Sin conversaciones activas</h3>
                <p className="text-[#172c44]/80 mt-1 max-w-xs text-sm">
                  Los chats se crearán automáticamente cuando los jugadores reserven o se unan a partidos en tus canchas.
                </p>
              </div>
            ) : (
              <TabsContent value="all" className="mt-0 space-y-3">
                {chats.map((chat) => (
                  <Card 
                    key={chat.id} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 bg-white/90 backdrop-blur-sm active:scale-[0.99]"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-2 border-white shadow-sm">
                            <AvatarFallback className="bg-gradient-to-br from-[#172c44] to-[#2a3e5a] text-white font-bold text-lg">
                              {chat.type === 'match' ? '⚽' : '🏆'}
                            </AvatarFallback>
                          </Avatar>
                          {chat.type === 'match' && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#f4b400] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                              <Calendar size={12} className="text-[#172c44]" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-[#172c44] font-bold text-base truncate pr-2">{chat.name}</h3>
                            <span className="text-[10px] font-semibold text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full">
                              {chat.lastMessageTimestamp ? chat.lastMessageTimestamp.toDate().toLocaleDateString('es-ES', {day: '2-digit', month: 'short'}) : ''}
                            </span>
                          </div>
                          
                          <p className={`text-sm truncate ${chat.lastMessage ? 'text-gray-600' : 'text-gray-400 italic'}`}>
                            {chat.lastMessage || 'Aún no hay mensajes...'}
                          </p>

                          <div className="flex items-center gap-1 mt-2">
                            <User size={12} className="text-[#f4b400]" />
                            <span className="text-xs font-medium text-gray-500">
                              {chat.participantsUids?.length || 0} Participantes
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            )}
            
            {/* Contenido duplicado para la pestaña 'matches' por simplicidad, se puede filtrar si es necesario */}
            <TabsContent value="matches" className="mt-0 space-y-3">
               {chats.filter(c => c.type === 'match').map(chat => (
                  <Card key={chat.id} className="cursor-pointer border-0 bg-white/90" onClick={() => setSelectedChat(chat)}>
                    <CardContent className="p-4">
                       <div className="flex items-center gap-3">
                         <Avatar><AvatarFallback className="bg-[#172c44] text-white">⚽</AvatarFallback></Avatar>
                         <div className="flex-1"><h3 className="font-bold text-[#172c44]">{chat.name}</h3><p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p></div>
                       </div>
                    </CardContent>
                  </Card>
               ))}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
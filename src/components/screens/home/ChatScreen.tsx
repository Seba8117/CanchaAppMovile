import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, MoreVertical, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';

// --- INICIO: Importaciones de Firebase (ACTUALIZADAS) ---
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


interface ChatScreenProps {
  onBack: () => void;
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [userDisplayName, setUserDisplayName] = useState<string>(''); // Para guardar el nombre del usuario
  const [chats, setChats] = useState<DocumentData[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('all');
  const [selectedChat, setSelectedChat] = useState<DocumentData | null>(null);
  const [messages, setMessages] = useState<DocumentData[]>([]); // Estado para los mensajes reales
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // Ref para auto-scroll

  // --- Cargar Nombre del Usuario Actual ---
  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        // Buscar en 'jugador'
        let userDocRef = doc(db, 'jugador', currentUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserDisplayName(userDocSnap.data().name);
          return;
        }
        
        // Si no, buscar en 'dueno'
        userDocRef = doc(db, 'dueno', currentUser.uid);
        userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserDisplayName(userDocSnap.data().ownerName);
          return;
        }
        
        // Fallback al email
        setUserDisplayName(currentUser.email || 'Usuario');
      }
    };
    fetchUserName();
  }, [currentUser]);

  // --- Cargar Lista de Chats del Usuario ---
  useEffect(() => {
    if (!currentUser) {
      setLoadingChats(false);
      setErrorChats("No estás autenticado.");
      return;
    }

    setLoadingChats(true);
    const q = query(
      collection(db, "chats"), 
      where("participantsUids", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatsData: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        chatsData.push({ id: doc.id, ...doc.data() });
      });
      setChats(chatsData);
      setLoadingChats(false);
    }, (err) => {
      console.error(err);
      setErrorChats("Error al cargar tus chats.");
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- Cargar Mensajes del Chat Seleccionado ---
  useEffect(() => {
    if (!selectedChat) return;

    setLoadingMessages(true);
    setMessages([]); // Limpiar mensajes anteriores

    // Crear la referencia a la subcolección 'messages'
    const messagesRef = collection(db, "chats", selectedChat.id, "messages");
    // Crear la consulta ordenada por 'timestamp'
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

  // --- Auto-scroll al final de los mensajes ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Enviar Mensaje ---
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser || !selectedChat) {
      return;
    }

    try {
      // 1. Añadir el nuevo mensaje a la subcolección 'messages'
      const messagesRef = collection(db, "chats", selectedChat.id, "messages");
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: userDisplayName, // Usamos el nombre cargado
        timestamp: serverTimestamp(),
      });

      // 2. Actualizar el 'lastMessage' del documento principal del chat
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
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';
  };

  // Filtrar chats según la pestaña activa
  const filteredChats = chats.filter(chat => {
    if (activeTab === 'all') return true;
    if (activeTab === 'matches') return chat.type === 'match';
    if (activeTab === 'teams') return chat.type === 'team';
    return true;
  });


  // --- VISTA DE UN CHAT SELECCIONADO ---
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col">
        {/* Chat Header (Dinámico) */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)}>
                <ArrowLeft className="text-[#172c44]" size={24} />
              </button>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                  {selectedChat.type === 'match' ? '⚽' : '🏆'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-[#172c44] font-semibold">{selectedChat.name}</h1>
                <p className="text-sm text-gray-600">{selectedChat.participantsUids?.length || 0} participantes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon"><MoreVertical size={20} className="text-[#172c44]" /></Button>
            </div>
          </div>
        </div>

        {/* Messages (Dinámico) */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-36">
          {loadingMessages && (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>
          )}
          {!loadingMessages && messages.map((message) => {
            const isMe = message.senderId === currentUser?.uid;
            return (
              <div key={message.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gray-200 text-[#172c44] text-xs">
                    {getInitials(message.senderName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-lg max-w-xs ${isMe ? 'bg-[#f4b400] text-[#172c44]' : 'bg-white text-[#172c44] shadow-sm'}`}>
                    {!isMe && (<p className="text-xs text-blue-600 mb-1 font-semibold">{message.senderName}</p>)}
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-1">
                    {message.timestamp ? message.timestamp.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '...'}
                  </p>
                </div>
              </div>
            );
          })}
          {/* div vacío para el auto-scroll */}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input (Fijo abajo) */}
        <div className="fixed bottom-16 left-0 right-0 max-w-sm mx-auto bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} className="bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]">
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE LA LISTA DE CHATS (DINÁMICA) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      <AppHeader title="Mensajes" showLogo={true} showBackButton={true} onBack={onBack} />
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="matches">Partidos</TabsTrigger>
            <TabsTrigger value="teams">Equipos</TabsTrigger>
          </TabsList>

          {loadingChats && (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" /></div>
          )}
          {errorChats && (
            <Card className="bg-red-100 p-4"><p className="text-red-700">{errorChats}</p></Card>
          )}
          {!loadingChats && !errorChats && (
              <div className="space-y-3">
                {filteredChats.length === 0 && (
                  <div className="text-center p-8 text-white/70">
                    <MessageCircle size={48} className="mx-auto mb-4" />
                    <p className="font-semibold">No estás en ningún chat todavía</p>
                    <p className="text-sm">¡Únete a un partido o a un equipo para comenzar a chatear!</p>
                  </div>
                )}
                {filteredChats.map((chat) => (
                  <Card key={chat.id} className="cursor-pointer hover:shadow-md" onClick={() => setSelectedChat(chat)}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-[#f4b400] text-[#172c44] font-bold">
                            {chat.type === 'match' ? '⚽' : (chat.type === 'team' ? '🏆' : '👤')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-[#172c44] font-semibold truncate">{chat.name}</h3>
                            {/* <span className="text-xs text-gray-500">{chat.lastMessageTimestamp?.toDate().toLocaleTimeString() || ''}</span> */}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
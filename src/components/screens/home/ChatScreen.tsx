import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, MessageCircle, Calendar, Clock, Users, Info, X } from 'lucide-react'; 
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AppHeader } from '../../common/AppHeader';

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

// --- MODAL DE PARTICIPANTES ---
interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantIds: string[];
  matchOwnerId?: string; // ID del líder (Dueño o Capitán)
  chatType?: string;     // 'match' o 'team' para decidir la etiqueta
}

function ParticipantsModal({ isOpen, onClose, participantIds, matchOwnerId, chatType }: ParticipantsModalProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const fetchParticipants = async () => {
        try {
          // 1. Usamos un SET para unificar IDs y evitar duplicados
          const allParticipantIds = new Set(participantIds || []);
          
          // Importante: Aseguramos que el dueño/capitán esté en la lista de búsqueda
          if (matchOwnerId) {
            allParticipantIds.add(matchOwnerId);
          }

          const idsToFetch = Array.from(allParticipantIds);

          if (idsToFetch.length === 0) {
            setParticipants([]);
            setLoading(false);
            return;
          }

          const promises = idsToFetch.map(async (uid) => {
            let name = 'Usuario';
            let role = 'Jugador'; // Rol por defecto
            let found = false;

            // --- A. Intentar buscar nombre en 'dueno' ---
            try {
                const snapDueno = await getDoc(doc(db, 'dueno', uid));
                if (snapDueno.exists()) {
                    const data = snapDueno.data();
                    name = data.ownerName || data.name || 'Dueño';
                    found = true;
                }
            } catch (e) {
                console.log("Error leyendo dueno", e);
            }

            // --- B. Si no, buscar en 'jugador' ---
            if (!found) {
                const snapJugador = await getDoc(doc(db, 'jugador', uid));
                if (snapJugador.exists()) {
                    const data = snapJugador.data();
                    name = data.name || data.fullname || 'Jugador';
                    found = true;
                }
            }

            // --- C. Fallback en 'users' ---
            if (!found) {
                const snapUser = await getDoc(doc(db, 'users', uid));
                if (snapUser.exists()) {
                    const data = snapUser.data();
                    name = data.name || data.displayName || 'Usuario';
                }
            }

            // --- D. LÓGICA DE ROLES ---
            // Si el ID actual coincide con el ID que pasamos como "Líder"
            if (matchOwnerId && uid === matchOwnerId) {
                if (chatType === 'match') {
                    role = 'Dueño de Cancha';
                } else if (chatType === 'team') {
                    role = 'Capitán';
                } else {
                    role = 'Admin';
                }
            } else {
                role = 'Jugador'; 
            }

            return { id: uid, name, role };
          });

          const results = await Promise.all(promises);
          
          // Ordenar: El líder (Dueño o Capitán) aparece primero
          results.sort((a, b) => {
             const isLeaderA = a.role === 'Dueño de Cancha' || a.role === 'Capitán';
             const isLeaderB = b.role === 'Dueño de Cancha' || b.role === 'Capitán';
             if (isLeaderA && !isLeaderB) return -1;
             if (!isLeaderA && isLeaderB) return 1;
             return 0;
          });
          
          setParticipants(results);
        } catch (error) {
          console.error("Error cargando participantes:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchParticipants();
    } else {
        setParticipants([]);
    }
  }, [isOpen, participantIds, matchOwnerId, chatType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#172c44] p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users size={20} /> Participantes ({participants.length})
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#172c44]" /></div>
          ) : (
            <div className="space-y-3">
              {participants.map((p) => {
                const isLeader = p.role === 'Dueño de Cancha' || p.role === 'Capitán';
                return (
                  <div key={p.id} className="flex items-center gap-3 border-b border-gray-100 pb-2 last:border-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className={`${isLeader ? 'bg-orange-500 text-white' : 'bg-gray-200 text-[#172c44]'} font-medium`}>
                        {String(p.name || 'U').substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-[#172c44]">{p.name}</p>
                      <p className={`text-xs ${isLeader ? 'text-orange-600 font-bold' : 'text-gray-500'}`}>
                          {p.role}
                      </p>
                    </div>
                  </div>
                );
              })}
              {participants.length === 0 && <p className="text-center text-gray-500 text-sm">No se encontraron participantes.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- PANTALLA PRINCIPAL ---
interface ChatScreenProps {
  onBack: () => void;
}

export function ChatScreen({ onBack }: ChatScreenProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [userDisplayName, setUserDisplayName] = useState<string>(''); 
  const [chats, setChats] = useState<DocumentData[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [errorChats, setErrorChats] = useState<string | null>(null);

  const [selectedChat, setSelectedChat] = useState<DocumentData | null>(null);
  
  // Guardamos info extra del partido si aplica
  const [matchInfo, setMatchInfo] = useState<{date: string, time: string, ownerId?: string} | null>(null);

  const [messages, setMessages] = useState<DocumentData[]>([]); 
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // --- Cargar Nombre del Usuario ---
  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        let userDocRef = doc(db, 'jugador', currentUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          setUserDisplayName(userDocSnap.data().name);
          return;
        }
        
        userDocRef = doc(db, 'dueno', currentUser.uid);
        userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserDisplayName(userDocSnap.data().ownerName);
          return;
        }
        
        setUserDisplayName(currentUser.email || 'Usuario');
      }
    };
    fetchUserName();
  }, [currentUser]);

  // --- Cargar Lista de Chats ---
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

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const rawChats: DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        rawChats.push({ id: doc.id, ...doc.data() });
      });

      // Ordenar por último mensaje
      rawChats.sort((a, b) => {
        const timeA = a.lastMessageTimestamp?.toMillis() || 0;
        const timeB = b.lastMessageTimestamp?.toMillis() || 0;
        return timeB - timeA;
      });

      setChats(rawChats);
      setLoadingChats(false);
    }, (err) => {
      console.error(err);
      setErrorChats("Error al cargar tus chats.");
      setLoadingChats(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // --- Cargar detalles adicionales (Solo para Partidos) ---
  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (selectedChat && selectedChat.type === 'match') {
        try {
          const matchRef = doc(db, 'matches', selectedChat.id);
          const matchSnap = await getDoc(matchRef);
          
          if (matchSnap.exists()) {
            const data = matchSnap.data();
            const dateObj = data.date?.toDate ? data.date.toDate() : null;
            
            setMatchInfo({
              date: dateObj ? dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' }) : 'Fecha no disponible',
              time: data.time || 'Hora no disponible',
              ownerId: data.ownerId // Dueño de la cancha (desde colección matches)
            });
          }
        } catch (error) {
          console.error("Error buscando detalles del partido:", error);
        }
      } else {
        setMatchInfo(null);
      }
    };

    fetchMatchDetails();
  }, [selectedChat]);

  // --- Cargar Mensajes ---
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

  // --- Auto-scroll ---
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Enviar Mensaje ---
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser || !selectedChat) return;

    try {
      const messagesRef = collection(db, "chats", selectedChat.id, "messages");
      
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: userDisplayName,
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

  const getInitials = (name: string = '') => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';

  const ChatCard = ({ chat }: { chat: DocumentData }) => (
    <Card className="cursor-pointer hover:shadow-md transition-all border-none" onClick={() => setSelectedChat(chat)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-[#f4b400] text-[#172c44] font-bold text-lg">
              {chat.type === 'match' ? '⚽' : (chat.type === 'team' ? '🏆' : '👤')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-[#172c44] font-semibold truncate text-base">{chat.name}</h3>
              <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                {chat.lastMessageTimestamp?.toDate ? chat.lastMessageTimestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // --- VISTA DETALLE DEL CHAT ---
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col relative">
        {/* HEADER DEL CHAT */}
        <div className="bg-white border-b border-gray-200 p-3 sticky top-0 z-10 shadow-sm">
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
                <h1 className="text-[#172c44] font-bold text-sm sm:text-base leading-tight w-40 truncate">
                    {selectedChat.name}
                </h1>
                
                {matchInfo && selectedChat.type === 'match' && (
                    <div className="flex items-center gap-2 text-xs text-[#00a884] font-medium mt-0.5">
                        <div className="flex items-center gap-1"><Calendar size={12} /><span>{matchInfo.date}</span></div>
                        <div className="flex items-center gap-1"><Clock size={12} /><span>{matchInfo.time}</span></div>
                    </div>
                )}
                {/* Si es Team, mostramos 'Equipo' o nada */}
                {selectedChat.type === 'team' && (
                     <p className="text-xs text-gray-500">Equipo</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsParticipantsModalOpen(true)}
                className="text-[#172c44] hover:bg-gray-100 rounded-full"
              >
                <Info size={24} />
              </Button>
            </div>
          </div>
        </div>

        {/* MENSAJES */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-24 bg-[#e5ddd5]">
          {loadingMessages && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>}
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
                  <div className={`p-2 px-3 rounded-lg max-w-xs shadow-sm ${isMe ? 'bg-[#dcf8c6] text-gray-800' : 'bg-white text-gray-800'}`}>
                    {!isMe && (<p className="text-xs text-[#00a884] mb-1 font-bold">{message.senderName}</p>)}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-end mt-1 gap-1">
                        <span className="text-[10px] text-gray-500 min-w-fit">
                        {message.timestamp ? message.timestamp.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '...'}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT MENSAJE */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-6 md:pb-3 z-[100]">
          <div className="flex gap-3 max-w-4xl mx-auto">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 rounded-full border-gray-300 focus:border-[#00a884]"
            />
            <Button onClick={handleSendMessage} className="bg-[#00a884] hover:bg-[#00a884]/90 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center">
              <Send size={20} className="ml-0.5" />
            </Button>
          </div>
        </div>

        {/* --- LÓGICA CLAVE DE INYECCIÓN DE DUEÑO/CAPITÁN --- */}
        <ParticipantsModal 
            isOpen={isParticipantsModalOpen} 
            onClose={() => setIsParticipantsModalOpen(false)} 
            participantIds={selectedChat.participantsUids || []}
            
            // AQUÍ ESTÁ EL TRUCO: 
            // 1. Si es 'match', usamos matchInfo.ownerId (lo sacamos de la colección matches).
            // 2. Si es 'team' (tu foto), el ownerId viene directamente en selectedChat.
            matchOwnerId={selectedChat.type === 'match' ? matchInfo?.ownerId : selectedChat.ownerId}
            
            chatType={selectedChat.type} 
        />
      </div>
    );
  }

  // --- VISTA LISTA DE CHATS ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      <AppHeader title="Mensajes" showLogo={true} showBackButton={true} onBack={onBack} />
      
      <div className="p-4">
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-white/10 text-white">
            <TabsTrigger value="all" className="data-[state=active]:bg-white data-[state=active]:text-[#172c44]">Todos</TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-white data-[state=active]:text-[#172c44]">Partidos</TabsTrigger>
            <TabsTrigger value="teams" className="data-[state=active]:bg-white data-[state=active]:text-[#172c44]">Equipos</TabsTrigger>
          </TabsList>

          <div className="px-1 pb-4">
            {loadingChats && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" /></div>}
            {errorChats && <Card className="bg-red-100 p-4"><p className="text-red-700">{errorChats}</p></Card>}

            {!loadingChats && !errorChats && (
              <>
                <TabsContent value="all" className="space-y-3 mt-0">
                  {chats.length === 0 && (
                    <div className="text-center p-8 text-white/70">
                      <MessageCircle size={48} className="mx-auto mb-4" />
                      <p className="font-semibold">No tienes mensajes</p>
                    </div>
                  )}
                  {chats.map((chat) => <ChatCard key={chat.id} chat={chat} />)}
                </TabsContent>

                <TabsContent value="matches" className="space-y-3 mt-0">
                    {chats.filter(c => c.type === 'match').map(c => <ChatCard key={c.id} chat={c} />)}
                </TabsContent>

                <TabsContent value="teams" className="space-y-3 mt-0">
                    {chats.filter(c => c.type === 'team').map(c => <ChatCard key={c.id} chat={c} />)}
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
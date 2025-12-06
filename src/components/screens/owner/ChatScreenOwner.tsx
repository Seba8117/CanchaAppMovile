import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Loader2, MessageCircle, Calendar, Clock, Users, Info, X } from 'lucide-react';
import { Button } from '../../ui/button'; 
import { Input } from '../../ui/input';
import { Card, CardContent } from '../../ui/card';
import { Avatar, AvatarFallback } from '../../ui/avatar';
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
  updateDoc,
  setDoc,
  getDocs
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

// --- MODAL DE PARTICIPANTES ---
interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantIds: string[];
}

function ParticipantsModal({ isOpen, onClose, participantIds }: ParticipantsModalProps) {
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && participantIds.length > 0) {
      setLoading(true);
      const fetchParticipants = async () => {
        try {
          const promises = participantIds.map(async (uid) => {
            let snap = await getDoc(doc(db, 'jugador', uid));
            if (snap.exists()) return { id: uid, ...snap.data(), role: 'Jugador' };
            
            snap = await getDoc(doc(db, 'dueno', uid));
            if (snap.exists()) return { id: uid, name: snap.data()?.ownerName, role: 'Dueño' };

            snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) return { id: uid, ...snap.data(), role: 'Usuario' };

            return { id: uid, name: 'Usuario Desconocido', role: '?' };
          });

          const results = await Promise.all(promises);
          setParticipants(results);
        } catch (error) {
          console.error("Error cargando participantes:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchParticipants();
    }
  }, [isOpen, participantIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#172c44] p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Users size={20} /> Participantes ({participantIds.length})
          </h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <div className="p-4 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#172c44]" /></div>
          ) : (
            <div className="space-y-3">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-3 border-b border-gray-100 pb-2 last:border-0">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gray-200 text-[#172c44] font-medium">
                      {String(p.name || 'U').substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-[#172c44]">{p.name || 'Sin nombre'}</p>
                    <p className="text-xs text-gray-500">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- PANTALLA PRINCIPAL ---
interface ChatScreenOwnerProps {
  onBack: () => void;
}

export function ChatScreenOwner({ onBack }: ChatScreenOwnerProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [userDisplayName, setUserDisplayName] = useState<string>(''); 
  
  const [itemsMap, setItemsMap] = useState<Record<string, DocumentData>>({});
  const [loadingChats, setLoadingChats] = useState(true);
  
  const [selectedChat, setSelectedChat] = useState<DocumentData | null>(null);
  const [matchInfo, setMatchInfo] = useState<{date: string, time: string} | null>(null);

  const [messages, setMessages] = useState<DocumentData[]>([]); 
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // --- Filtros y Orden ---
  const chats = Object.values(itemsMap)
    .filter(chat => {
        const participants = chat.participantsUids || [];
        if (chat.isVirtual && participants.length > 0) return true;
        const hasOtherPeople = participants.some((uid: string) => uid !== currentUser?.uid);
        return hasOtherPeople;
    })
    .sort((a, b) => {
        const timeA = a.lastMessageTimestamp?.toMillis ? a.lastMessageTimestamp.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = b.lastMessageTimestamp?.toMillis ? b.lastMessageTimestamp.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA;
    });

  // --- Cargar Usuario ---
  useEffect(() => {
    const fetchUserName = async () => {
      if (currentUser) {
        let userDocRef = doc(db, 'dueno', currentUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserDisplayName(userDocSnap.data().ownerName);
          return;
        }
        setUserDisplayName('Dueño');
      }
    };
    fetchUserName();
  }, [currentUser]);

  // --- Cargar Chats ---
  useEffect(() => {
    if (!currentUser) {
      setLoadingChats(false);
      return;
    }
    setLoadingChats(true);

    const loadData = async () => {
      try {
        const qCancha = query(collection(db, "cancha"), where("ownerId", "==", currentUser.uid));
        const qCanchas = query(collection(db, "canchas"), where("ownerId", "==", currentUser.uid));
        const qCourts = query(collection(db, "courts"), where("ownerId", "==", currentUser.uid));
        
        const [snapCancha, snapCanchas, snapCourts] = await Promise.all([getDocs(qCancha), getDocs(qCanchas), getDocs(qCourts)]);
        const myCourtIds = [...snapCancha.docs.map(d => d.id), ...snapCanchas.docs.map(d => d.id), ...snapCourts.docs.map(d => d.id)];

        const unsubscribes: (() => void)[] = [];
        const updateMap = (items: any[]) => {
            setItemsMap(prev => {
                const next = { ...prev };
                items.forEach(item => {
                    if (next[item.id]?.lastMessage && !item.lastMessage) return;
                    next[item.id] = { ...next[item.id], ...item };
                });
                return next;
            });
        };

        if (myCourtIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < myCourtIds.length; i += 10) chunks.push(myCourtIds.slice(i, i + 10));

            chunks.forEach(chunkIds => {
                const qMatches = query(collection(db, "matches"), where("courtId", "in", chunkIds));
                const unsub = onSnapshot(qMatches, (snap) => {
                    const matchesFound = snap.docs.map(d => {
                        const m = d.data();
                        return {
                            id: d.id,
                            name: m.courtName || 'Partido en mi cancha',
                            type: 'match',
                            lastMessage: 'Toca para ver el chat',
                            lastMessageTimestamp: m.createdAt || serverTimestamp(),
                            participantsUids: m.players || [],
                            ownerId: m.ownerId, 
                            date: m.date,
                            time: m.time,
                            isVirtual: true 
                        };
                    });
                    updateMap(matchesFound);
                });
                unsubscribes.push(unsub);
            });
        }

        const qDirect = query(collection(db, "chats"), where("participantsUids", "array-contains", currentUser.uid));
        const unsubDirect = onSnapshot(qDirect, (snap) => {
            const chatsFound = snap.docs.map(d => ({ id: d.id, ...d.data(), isVirtual: false }));
            updateMap(chatsFound);
        });
        unsubscribes.push(unsubDirect);

        return () => unsubscribes.forEach(u => u());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChats(false);
      }
    };
    loadData();
    return () => {}; 
  }, [currentUser]);

  // --- Cargar Detalles Partido ---
  useEffect(() => {
    if (selectedChat && selectedChat.type === 'match') {
        const dateObj = toDate(selectedChat.date);
        if (dateObj) {
             setMatchInfo({
               date: dateObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' }),
               time: selectedChat.time || 'Hora N/A'
             });
        } else {
            getDoc(doc(db, 'matches', selectedChat.id)).then(snap => {
                if(snap.exists()) {
                    const d = snap.data();
                    const dObj = toDate(d.date);
                    setMatchInfo({
                        date: dObj ? dObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' }) : 'Fecha N/A',
                        time: d.time || 'Hora N/A'
                    });
                }
            });
        }
    } else {
        setMatchInfo(null);
    }
  }, [selectedChat]);

  const toDate = (d: any) => {
      if (!d) return null;
      if (typeof d?.toDate === 'function') return d.toDate();
      if (typeof d?.toMillis === 'function') return new Date(d.toMillis());
      return new Date(d);
  };

  // --- Cargar Mensajes ---
  useEffect(() => {
    if (!selectedChat) return;
    setLoadingMessages(true);
    const q = query(collection(db, "chats", selectedChat.id, "messages"), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs: DocumentData[] = [];
      snap.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoadingMessages(false);
    });
    return () => unsubscribe();
  }, [selectedChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- Enviar Mensaje ---
  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !currentUser || !selectedChat) return;
    try {
      const chatId = selectedChat.id;
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      
      if (!chatSnap.exists()) {
          await setDoc(chatRef, {
              id: chatId,
              name: selectedChat.name || 'Chat de Partido',
              type: 'match',
              participantsUids: [...(selectedChat.participantsUids || []), currentUser.uid],
              ownerId: selectedChat.ownerId || currentUser.uid, 
              lastMessage: newMessage,
              lastMessageTimestamp: serverTimestamp(),
              createdAt: serverTimestamp()
          });
      } else {
          await updateDoc(chatRef, {
              lastMessage: newMessage,
              lastMessageTimestamp: serverTimestamp(),
          });
      }
      await addDoc(collection(db, "chats", chatId, "messages"), {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: userDisplayName,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) { console.error(err); }
  };

  const getInitials = (name: string = '') => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';

  // --- Card de Chat ---
  const ChatCard = ({ chat }: { chat: DocumentData }) => (
    <Card className="cursor-pointer hover:shadow-lg transition-all border-none bg-white/90 backdrop-blur-sm mb-3" onClick={() => setSelectedChat(chat)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-[#EAB308] text-white font-bold text-lg">
              {chat.type === 'match' ? '⚽' : '🏆'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <h3 className="text-[#172c44] font-bold truncate text-base">{chat.name}</h3>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                {toDate(chat.lastMessageTimestamp)?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || ''}
              </span>
            </div>
            <p className={`text-sm truncate ${chat.isVirtual ? 'text-gray-400 italic' : 'text-gray-600'}`}>
                {chat.lastMessage}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // --- VISTA DETALLE DEL CHAT ---
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col relative">
        {/* HEADER */}
        <div className="bg-white border-b border-gray-200 p-3 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedChat(null)}>
                <ArrowLeft className="text-[#172c44]" size={24} />
              </button>
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-[#EAB308] text-white">
                  {selectedChat.type === 'match' ? '⚽' : '🏆'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-[#172c44] font-bold text-sm sm:text-base leading-tight w-48 truncate">
                    {selectedChat.name}
                </h1>
                {matchInfo && (
                    <div className="flex items-center gap-2 text-xs text-orange-600 font-medium mt-0.5">
                        <div className="flex items-center gap-1"><Calendar size={12} /><span>{matchInfo.date}</span></div>
                        <div className="flex items-center gap-1"><Clock size={12} /><span>{matchInfo.time}</span></div>
                    </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setIsParticipantsModalOpen(true)} className="text-[#172c44] hover:bg-gray-100 rounded-full">
                    <Info size={24} />
                </Button>
            </div>
          </div>
        </div>

        {/* MENSAJES */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto pb-32 bg-[#e5ddd5]">
          {loadingMessages && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-gray-500" /></div>}
          
          {!loadingMessages && messages.length === 0 && (
              <div className="text-center text-gray-400 text-sm mt-10">
                  <p>Chat del partido.</p>
                  <p>Aún no hay mensajes aquí.</p>
              </div>
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
                  <div className={`p-2 px-3 rounded-lg max-w-xs shadow-sm ${isMe ? 'bg-[#FEF08A] text-gray-900' : 'bg-white text-gray-900'}`}>
                    {!isMe && (<p className="text-xs text-orange-600 mb-1 font-bold">{message.senderName}</p>)}
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <div className="flex items-center justify-end mt-1 gap-1">
                        <span className="text-[10px] text-gray-500 min-w-fit">
                        {toDate(message.timestamp)?.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) || '...'}
                        </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DE MENSAJE */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 pb-6 md:pb-4 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <div className="flex gap-3 max-w-4xl mx-auto items-center">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 rounded-full border-gray-300 focus:border-[#EAB308] bg-white text-black"
            />
            <button 
                onClick={handleSendMessage} 
                style={{
                    backgroundColor: '#EAB308',
                    color: 'white',
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                }}
                className="hover:brightness-90 transition-all shrink-0 shadow-md"
            >
              <Send size={20} className="ml-0.5" />
            </button>
          </div>
        </div>

        <ParticipantsModal 
            isOpen={isParticipantsModalOpen} 
            onClose={() => setIsParticipantsModalOpen(false)} 
            participantIds={selectedChat.participantsUids || []}
        />
      </div>
    );
  }

  // --- VISTA LISTA (SIN PESTAÑAS) ---
  return (
    <div 
      className="min-h-screen pb-20"
      style={{ background: 'linear-gradient(180deg, #FDE047 0%, #FACC15 40%, #EAB308 100%)' }}
    >
      <AppHeader title="Mensajes de Canchas" showLogo={true} showBackButton={true} onBack={onBack} />
      
      <div className="p-4">
        {loadingChats && <div className="flex justify-center p-8"><Loader2 className="animate-spin text-white" /></div>}
        
        {!loadingChats && (
          <div className="space-y-3">
            {chats.length === 0 && (
              <div className="text-center p-8 text-[#172c44] drop-shadow-sm">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-70" />
                <p className="font-bold text-lg">Sin mensajes activos</p>
                <p className="text-sm opacity-80">Aquí aparecerán los partidos con jugadores en tus canchas.</p>
              </div>
            )}
            
            {chats.map(chat => <ChatCard key={chat.id} chat={chat} />)}
          </div>
        )}
      </div>
    </div>
  );
}
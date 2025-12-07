import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, Star, Share2, Heart, Eye, Loader2, AlertCircle, Shield, User, ChevronRight, X, MessageCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../ui/alert-dialog';

import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';

// Servicios
import { getMatchById, deleteMatch } from '../../../services/matchService';
import { getUserLocationCached, haversineKm, mapsUrlFor } from '../../../services/locationService';
import { startMatchCheckout, checkPaymentStatus, startOwnerMpConnect } from '../../../services/paymentService';

// Firebase
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp, arrayUnion, increment, query, where, getDocs } from 'firebase/firestore';

// --- COMPONENTE MODAL DE SELECCIÓN DE EQUIPO ---
interface TeamSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    myTeams: any[];
    onSelectTeam: (team: any) => void;
    onJoinAsPlayer: () => void;
    isProcessing: boolean;
}

function TeamSelectorModal({ isOpen, onClose, myTeams, onSelectTeam, onJoinAsPlayer, isProcessing }: TeamSelectorModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="bg-[#172c44] p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg">¿Cómo quieres unirte?</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
                <div className="p-4 space-y-4">
                    <p className="text-gray-600 text-sm">Selecciona si deseas unirte solo tú o inscribir a todo tu equipo.</p>
                    
                    {/* Unirse Solo */}
                    <Button variant="outline" className="w-full justify-between h-auto py-3 border-2 hover:border-[#00a884] hover:text-[#00a884]" onClick={onJoinAsPlayer} disabled={isProcessing}>
                        <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-full"><User size={20} className="text-gray-600"/></div>
                            <div className="text-left"><div className="font-semibold text-gray-800">Unirme solo yo</div><div className="text-xs text-gray-500">Inscripción individual</div></div>
                        </div>
                        <ChevronRight size={18} className="text-gray-400" />
                    </Button>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">O con tu equipo</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Lista de Equipos */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {myTeams.map((team) => (
                            <Button key={team.id} variant="outline" className="w-full justify-between h-auto py-3 border hover:border-[#f4b400] hover:bg-[#fffdf0]" onClick={() => onSelectTeam(team)} disabled={isProcessing}>
                                <div className="flex items-center gap-3">
                                    <div className="bg-[#f4b400]/20 p-2 rounded-full"><Shield size={20} className="text-[#f4b400]"/></div>
                                    <div className="text-left">
                                        <div className="font-semibold text-[#172c44]">{team.name}</div>
                                        <div className="text-xs text-gray-500">{team.members?.length || 0} miembros • {team.sport}</div>
                                    </div>
                                </div>
                                <ChevronRight size={18} className="text-gray-400" />
                            </Button>
                        ))}
                        {myTeams.length === 0 && (
                            <div className="text-center py-4 text-gray-400 text-sm italic">No eres capitán de ningún equipo.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- UTILIDADES ---
const formatDate = (d: any) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'Fecha no definida';
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface MatchDetailScreenProps {
    match: any;
    onBack: () => void;
    onNavigate?: (screen: string, data?: any) => void;
    userType?: 'player' | 'owner';
}

export function MatchDetailScreen({ match, onBack, onNavigate, userType }: MatchDetailScreenProps) {
    const [currentMatch, setCurrentMatch] = useState(match);
    const [playerDetails, setPlayerDetails] = useState<any[]>([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    
    // Estados principales
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(match || null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [lastClickTs, setLastClickTs] = useState<number>(0);
    const [joining, setJoining] = useState<boolean>(false);
    const [captainDisplayName, setCaptainDisplayName] = useState<string | null>(null);
    const [starting, setStarting] = useState<boolean>(false);
    const [paymentStatusLocal, setPaymentStatusLocal] = useState<string | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // --- NUEVOS ESTADOS PARA UNIRSE EN EQUIPO ---
    const [captainTeams, setCaptainTeams] = useState<any[]>([]);
    const [isTeamSelectorOpen, setIsTeamSelectorOpen] = useState(false);

    // --- EFFECT: Cargar imagen de la cancha si falta ---
    const [courtImageToDisplay, setCourtImageToDisplay] = useState<string | null>(null);

    useEffect(() => {
        if (data?.courtImage) {
            setCourtImageToDisplay(data.courtImage);
        } else if (data?.courtId) {
            // Fetch court image
            const fetchCourtImage = async () => {
                try {
                    const courtDoc = await getDoc(doc(db, 'cancha', data.courtId));
                    if (courtDoc.exists()) {
                        const cData = courtDoc.data();
                        const img = cData.imageUrl || (cData.images && cData.images[0]);
                        if (img) setCourtImageToDisplay(img);
                    }
                } catch (e) {
                    console.error("Error fetching court image", e);
                }
            };
            fetchCourtImage();
        }
    }, [data]);

    // --- EFFECT: Cargar datos del partido y jugadores ---
    useEffect(() => {
        const fetchData = async () => {
            setLoadingPlayers(true);
            setLoading(true);
            setError(null);
            
            const matchData = data || match;
            const mustFetchPlayers = !!matchData?.players;

            try {
                if (mustFetchPlayers && matchData.players.length > 0) {
                    const playerPromises = matchData.players.map(async (playerId: string) => {
                        const playerDocRef = doc(db, 'jugador', playerId);
                        const playerDocSnap = await getDoc(playerDocRef);
                        return playerDocSnap.exists() 
                            ? { id: playerId, ...playerDocSnap.data() } 
                            : { id: playerId, name: 'Jugador Desconocido', rating: 0 };
                    });
                    const players = await Promise.all(playerPromises);
                    setPlayerDetails(players);
                } else {
                    setPlayerDetails([]);
                }

                if (match?.id && (!matchData?.courtName || !matchData?.players)) {
                    const fresh = await getMatchById(match.id);
                    setCurrentMatch(fresh || match);
                    setData(fresh || match);
                } else {
                    setCurrentMatch(matchData);
                    setData(matchData);
                }

            } catch (error: any) {
                console.error("Error fetching match or player details:", error);
                setError(error.message || 'No se pudo cargar el partido o los jugadores.');
            } finally {
                setLoadingPlayers(false);
                setLoading(false);
            }
        };
        fetchData();
    }, [match?.id]);

    // --- EFFECT: Cargar equipos del capitán (usuario actual) ---
    useEffect(() => {
        const loadCaptainTeams = async (uid: string) => {
            try {
                const q = query(collection(db, "teams"), where("captainId", "==", uid));
                const querySnapshot = await getDocs(q);
                const myTeamsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCaptainTeams(myTeamsData);
            } catch (error) {
                console.error("Error cargando equipos del capitán:", error);
            }
        };

        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) loadCaptainTeams(user.uid);
        });
        return () => unsubscribe();
    }, []);

    // --- Helpers de datos ---
    useEffect(() => {
        const getLoc = async () => {
            const loc = await getUserLocationCached();
            setUserLocation(loc);
        };
        getLoc();
    }, []);

    useEffect(() => {
        const loadCaptain = async () => {
            try {
                const capId = data?.captainId || data?.ownerId;
                if (!capId) return;
                const ref = doc(db, 'users', capId);
                const snap = await getDoc(ref);
                const name = snap.exists() ? (snap.data() as any)?.displayName : null;
                setCaptainDisplayName(name || data?.captainName || null);
            } catch {}
        };
        loadCaptain();
    }, [data?.captainId, data?.ownerId, data?.captainName]);

    const handleViewAllClick = () => {
        const now = Date.now();
        if (now - lastClickTs < 600) return;
        setLastClickTs(now);
        if (onNavigate) onNavigate('match-players', data);
    };

    const toDate = (d: any) => {
        try {
            if (!d) return null;
            if (typeof d?.toDate === 'function') return d.toDate();
            if (typeof d?.toMillis === 'function') return new Date(d.toMillis());
            if (typeof d === 'string') return new Date(d);
            if (d instanceof Date) return d;
            return null;
        } catch { return null; }
    };
    const formatCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n || 0);
    const locationText = (loc: any) => {
        if (!loc) return 'Ubicación no especificada';
        if (typeof loc === 'string') return loc;
        if (typeof loc?.address === 'string') return loc.address;
        return 'Ubicación no especificada';
    };
    
    const playersArray: string[] = Array.isArray(data?.players) ? data.players : [];
    const currentPlayers = Number(data?.currentPlayers || playersArray.length || 0);
    const maxPlayers = Number(data?.maxPlayers || 0);
    const matchDate = toDate(data?.date);
    const pricePerPlayer = Number(data?.pricePerPlayer || data?.price || 0);
    const matchId = String(data?.id || match?.id || '');
    const ownerId = String(data?.ownerId || data?.captainId || '');
    const isJoined = !!playersArray.find((uid) => uid === auth?.currentUser?.uid);
    const isOwner = (auth?.currentUser?.uid && ownerId) ? auth.currentUser.uid === ownerId : false;
    const totalCost = Number((data?.totalCost as any) || pricePerPlayer * (maxPlayers || 0) || 0);

    // --- FUNCIÓN HELPER: Actualizar Chat y Notificar ---
    const updateChatAndNotify = async (mId: string, mData: any, newParticipantIds: string[], nameOrUser: string, type: 'individual' | 'team') => {
        const ownId = mData.ownerId || mData.captainId;
        const currPlayers = mData.players || [];
        const cOwnerId = mData.courtOwnerId;

        const allParticipants = [ownId, cOwnerId, ...currPlayers, ...newParticipantIds];
        const uniqueParticipants = Array.from(new Set(allParticipants.filter(Boolean)));

        const chatRef = doc(db, "chats", mId);
        const chatSnap = await getDoc(chatRef);

        const messageText = type === 'team' 
            ? `El equipo ${nameOrUser} se ha unido al partido.`
            : `${nameOrUser} se ha unido al partido.`;

        if (chatSnap.exists()) {
            await updateDoc(chatRef, { 
                participantsUids: uniqueParticipants,
                lastMessage: messageText,
                lastMessageTimestamp: new Date()
            });
        } else {
            await setDoc(chatRef, {
                id: mId, 
                name: `Partido - ${mData.courtName || 'Chat de Partido'}`, 
                type: 'match',
                participantsUids: uniqueParticipants, 
                ownerId: ownId,
                lastMessage: messageText,
                lastMessageTimestamp: new Date(),
            });
        }

        // Notificaciones
        const notifyIds = [ownId, cOwnerId].filter(Boolean).filter(id => id !== auth.currentUser?.uid);
        const uniqueNotifyIds = Array.from(new Set(notifyIds));

        uniqueNotifyIds.forEach(async (targetId) => {
            try {
                await addDoc(collection(db, 'notifications'), {
                    userId: targetId,
                    type: 'match-join',
                    title: type === 'team' ? 'Equipo unido' : 'Nuevo jugador',
                    message: `${nameOrUser} se unió al partido en ${mData.courtName || 'la cancha'}.`,
                    data: { matchId: mId },
                    createdAt: serverTimestamp(),
                    read: false,
                });
            } catch (e) { console.log("Error creando notificación", e); }
        });
    };

    // --- MANEJADORES DE UNIÓN ---

    const handleGoToChat = () => {
        if (onNavigate) onNavigate('chat');
    };

    const handleInitiateJoin = () => {
        const uid = auth?.currentUser?.uid;
        if (!uid) { setError('Debes iniciar sesión para unirte.'); return; }
        
        // Si ya está unido, ir al chat
        if (isJoined) {
            handleGoToChat();
            return;
        }

        // Si es capitán de equipos, mostrar modal
        if (captainTeams.length > 0) {
            setIsTeamSelectorOpen(true);
        } else {
            handleJoinMatch(); // Unirse solo
        }
    };

    const handleJoinMatch = async () => {
        setIsTeamSelectorOpen(false);
        const uid = auth?.currentUser?.uid;
        if (!uid) return;
        if (!matchId) { setError('No se encontró el ID del partido.'); return; }
        
        setJoining(true);
        setError(null);

        try {
            const matchRef = doc(db, 'matches', matchId);
            const snap = await getDoc(matchRef);
            if (!snap.exists()) throw new Error('Este partido ya no existe.');
            const m = snap.data() as any;
            
            const playersList: string[] = m.players || [];
            if ((playersList.length || 0) >= (m.maxPlayers || maxPlayers)) throw new Error('¡Lo sentimos! El partido ya está lleno.');
            if (playersList.includes(uid)) { handleGoToChat(); setJoining(false); return; }

            await updateDoc(matchRef, { 
                players: arrayUnion(uid), 
                currentPlayers: increment(1) 
            });
            
            await updateChatAndNotify(matchId, m, [uid], auth.currentUser?.displayName || 'Jugador', 'individual');
            
            setJoining(false);
            onNavigate && onNavigate('chat');
        } catch (err: any) {
            setJoining(false);
            setError(err?.message || 'No se pudo unir al partido.');
        }
    };

    const handleJoinMatchAsTeam = async (team: any) => {
        setIsTeamSelectorOpen(false);
        const uid = auth?.currentUser?.uid;
        if (!uid || !matchId) return;

        setJoining(true);
        setError(null);

        try {
            const matchRef = doc(db, "matches", matchId);
            
            // 1. Obtener datos frescos del equipo
            const teamRef = doc(db, "teams", team.id);
            const teamSnap = await getDoc(teamRef);
            if (!teamSnap.exists()) throw new Error("El equipo no existe.");
            const teamData = teamSnap.data();

            // 2. Obtener datos frescos del partido
            const matchSnap = await getDoc(matchRef);
            if (!matchSnap.exists()) throw new Error("El partido ya no existe.");
            const matchData = matchSnap.data();

            const currentPlayersCount = matchData.currentPlayers || 0;
            const maxPlayersMatch = matchData.maxPlayers || 0;
            
            // 3. Preparar miembros
            const dbMembers = teamData.members || [];
            const teamMembers = [...dbMembers];
            if (!teamMembers.includes(uid)) { teamMembers.push(uid); } // Asegurar capitán
            
            const uniqueMembers = Array.from(new Set(teamMembers)) as string[];
            const neededSlots = uniqueMembers.length;
            const availableSlots = maxPlayersMatch - currentPlayersCount;

            if (neededSlots > availableSlots) {
                throw new Error(`No hay espacio suficiente. Tu equipo son ${neededSlots} jugadores y solo quedan ${availableSlots} cupos.`);
            }

            // 4. Unir
            await updateDoc(matchRef, {
                players: arrayUnion(...uniqueMembers),
                currentPlayers: increment(neededSlots)
            });

            await updateChatAndNotify(matchId, matchData, uniqueMembers, team.name, 'team');
            
            setJoining(false);
            onNavigate && onNavigate('chat');

        } catch (err: any) {
            console.error("Error uniendo equipo:", err);
            setJoining(false);
            setError(err.message || "Error al unir el equipo.");
        }
    };

    // --- ACCIONES OWNER ---
    const handleStartMatch = async () => {
        try {
            const uid = auth?.currentUser?.uid;
            if (!uid || !isOwner) { setError('Solo el organizador puede iniciar el partido.'); return; }
            setStarting(true);
            
            // Simulación de lógica de pago/inicio simplificada
            await updateDoc(doc(db, 'matches', matchId), { status: 'active', paymentStatus: 'approved' });
            
            // Notificación al dueño
            try {
                await addDoc(collection(db, 'notifications'), {
                    userId: ownerId,
                    type: 'system',
                    title: 'Partido Iniciado',
                    message: 'Has iniciado el partido exitosamente.',
                    data: { matchId },
                    read: false,
                    createdAt: serverTimestamp(),
                });
            } catch {}

            setStarting(false);
            onNavigate && onNavigate('match-players', data);
        } catch (e: any) {
            setStarting(false);
            setError(e?.message || 'No se pudo iniciar el partido.');
        }
    };

    const handleDeleteMatch = () => { setShowDeleteDialog(true); };

    const confirmDeleteMatch = async () => {
        try {
            await deleteMatch(matchId); 
            // Aquí idealmente usas un toast, si no, rediriges
            onBack();
        } catch (error: any) {
            setError(error.message || "No se pudo eliminar el partido.");
        } finally {
            setShowDeleteDialog(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 text-center shadow">
                        <Loader2 className="h-8 w-8 animate-spin text-[#172c44] mx-auto mb-2" />
                        <p className="text-[#172c44] font-semibold">Cargando...</p>
                    </div>
                </div>
            )}
            {error && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/20">
                    <div className="bg-red-50 rounded-xl p-6 text-center border border-red-200 m-4 shadow-xl">
                        <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <p className="text-red-700 font-semibold mb-3">{error}</p>
                        <Button variant="outline" onClick={() => setError(null)}>Cerrar</Button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between p-4">
                    <button onClick={onBack} className="p-2"><ArrowLeft className="text-[#172c44]" size={24} /></button>
                    <h1 className="text-[#172c44] font-semibold text-lg">Detalle del Partido</h1>
                    <div className="flex gap-2">
                        <button className="p-2"><Heart className="text-gray-400" size={20} /></button>
                        <button className="p-2"><Share2 className="text-gray-400" size={20} /></button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 pb-24">
                {/* Match Info Card */}
                <Card>
                    <div className="h-40 w-full relative">
                       {/* Intentamos mostrar imagen de la cancha si existe en los datos del partido, 
                           sino mostramos un placeholder bonito */}
                       <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center overflow-hidden rounded-t-xl">
                            {courtImageToDisplay ? (
                                <img 
                                    src={courtImageToDisplay} 
                                    alt="Cancha" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img 
                                    src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?q=80&w=2070&auto=format&fit=crop" 
                                    alt="Cancha por defecto" 
                                    className="w-full h-full object-cover opacity-60"
                                />
                            )}
                            <div className="absolute inset-0 bg-black/30"></div>
                       </div>
                    </div>
                    <CardContent className="p-6 pt-4 -mt-4 relative bg-white rounded-xl z-10 mx-2 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <Badge className="bg-[#f4b400] text-[#172c44] mb-2 font-bold">{String(data?.sport || 'Deporte').toUpperCase()}</Badge>
                                <h2 className="text-[#172c44] font-bold text-xl mb-1 leading-tight">{String(data?.courtName || 'Cancha')}</h2>
                                <div className="flex items-center gap-1">
                                    <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                                    <span className="text-sm text-gray-600 font-medium">{String(data?.rating || 'N/A')} • Cancha verificada</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-[#00a884] mb-0">{formatCLP(pricePerPlayer)}</p>
                                <p className="text-xs text-gray-500 font-medium">por jugador</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6 text-sm text-gray-700">
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-100 p-2 rounded-lg"><Calendar className="text-[#172c44]" size={18} /></div>
                                <span className="font-medium">{matchDate ? formatDate(matchDate) : 'Fecha N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-100 p-2 rounded-lg"><Clock className="text-[#172c44]" size={18} /></div>
                                <span className="font-medium">{String(data?.time || 'Hora N/A')}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-gray-100 p-2 rounded-lg"><Users className="text-[#172c44]" size={18} /></div>
                                <span className="font-medium">{currentPlayers}/{maxPlayers || 'N/A'} Jugadores</span>
                            </div>
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-gray-100 p-2 rounded-lg"><MapPin className="text-[#172c44] flex-shrink-0" size={18} /></div>
                                <span className="truncate font-medium">{locationText(data?.location)}</span>
                            </div>
                        </div>

                        {/* Owner Actions */}
                        {isOwner && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <Button className="w-full bg-[#00a884] hover:bg-[#008f73] text-white font-bold h-11" onClick={handleStartMatch} disabled={starting}>
                                    {starting ? 'Verificando pago…' : (String(data?.paymentStatus || paymentStatusLocal) === 'approved' ? 'Iniciar Partido' : 'Pagar e Iniciar')}
                                </Button>
                                <Button variant="outline" className="w-full mt-2 text-xs font-medium h-9" onClick={async () => { const u = auth.currentUser; if (!u) return; await startOwnerMpConnect(u.uid); }}>
                                    Conectar Mercado Pago
                                </Button>
                            </div>
                        )}
                        
                        <div className="p-4 bg-gray-50 rounded-xl mt-4 text-sm text-gray-600 leading-relaxed border border-gray-100"> 
                            {data?.description || 'Partido recreativo. Cancha sintética profesional con iluminación LED y vestuarios disponibles.'}
                        </div>
                    </CardContent>
                </Card>

                {/* Captain Info - SIN TEXTO DE FALLBACK NI ESTRELLAS */}
                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-[#f4b400] text-[#172c44]">
                                {String(captainDisplayName || data?.captainName || '').substring(0,2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <p className="text-[#172c44] font-medium">{captainDisplayName || data?.captainName || ''}</p>
                        </div>
                        <Button variant="outline" size="sm" className="text-[#00a884] border-[#00a884]" onClick={handleGoToChat}>
                            Chat
                        </Button>
                    </CardContent>
                </Card>

                {/* Players List */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-[#172c44] font-medium">Jugadores Confirmados</h3>
                            <Badge variant="secondary" className="bg-[#00a884] text-white">
                                {currentPlayers}/{maxPlayers || 'N/A'}
                            </Badge>
                        </div>
                        <div className="space-y-3">
                            {loadingPlayers ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin text-gray-400" /></div>
                            ) : playerDetails.length > 0 ? (
                                playerDetails.slice(0, 5).map((player) => (
                                    <div key={player.id} className="flex items-center gap-3">
                                        <Avatar className="w-9 h-9">
                                            <AvatarFallback className="bg-gray-100 text-[#172c44] text-xs">
                                                {String(player.name || 'JU').substring(0,2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm text-[#172c44] font-medium">{player.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase">{player.id === (data?.captainId || data?.ownerId) ? 'Capitán' : 'Jugador'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">No hay jugadores confirmados aún.</div>
                            )}
                            {playerDetails.length > 5 && (
                                <Button variant="ghost" size="sm" className="w-full text-[#00a884]" onClick={handleViewAllClick}>
                                    Ver todos ({playerDetails.length})
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Mapa */}
                <Card>
                    <CardContent className="p-4">
                        <h3 className="text-[#172c44] font-medium mb-3">Ubicación</h3>
                        <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center border border-gray-200">
                            <MapPin className="text-gray-400" size={32} />
                        </div>
                        <p className="text-sm text-gray-700 mb-2 truncate">{locationText(data?.location)}</p>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => window.open(mapsUrlFor(data), '_blank')}>
                            Abrir en Google Maps
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {isOwner ? (
                    <div className="flex gap-3">
                        <Button variant="destructive" className="flex-1 h-12 font-medium" onClick={handleDeleteMatch}>
                            Cancelar
                        </Button>
                        <Button className="flex-1 bg-[#00a884] hover:bg-[#008f73] text-white h-12 font-medium" onClick={handleStartMatch} disabled={starting}>
                            {starting ? 'Iniciando...' : 'Iniciar'}
                        </Button>
                    </div>
                ) : (
                    <Button 
                        className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44] h-12 font-bold text-lg shadow-md" 
                        onClick={handleInitiateJoin}
                        disabled={joining}
                    >
                        {joining ? (
                            <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> Procesando...</div>
                        ) : isJoined ? (
                            <div className="flex items-center gap-2"><MessageCircle size={20}/> Ir al Chat</div>
                        ) : (
                            'Unirse al Partido'
                        )}
                    </Button>
                )}
            </div>

            {/* Modals */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cancelar partido?</AlertDialogTitle>
                        <AlertDialogDescription>Se notificará a los jugadores y se eliminará el evento.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteMatch} className="bg-red-600 hover:bg-red-700">Sí, cancelar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <TeamSelectorModal 
                isOpen={isTeamSelectorOpen}
                onClose={() => { setIsTeamSelectorOpen(false); }}
                myTeams={captainTeams}
                onSelectTeam={handleJoinMatchAsTeam}
                onJoinAsPlayer={handleJoinMatch}
                isProcessing={joining}
            />
        </div>
    );
}
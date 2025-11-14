import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Users, Trophy, AlertCircle } from 'lucide-react';
import { AppHeader } from '../../common/AppHeader';
import { getMatchesForPlayer, leaveMatch } from '../../../services/matchService';

import { toast } from 'sonner';
import { auth } from '../../../Firebase/firebaseConfig';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
interface Match {
  id: string;
  sport: string;
  courtId: string;
  courtName: string;
  date: any; // Firestore Timestamp
  time: string;
  duration: number;
  maxPlayers: number;
  currentPlayers: number;
  pricePerPlayer: number;
  captainId: string;
  captainName: string;
  description: string;
  location: {
    address: string;
  };
  status: string;
  players: string[];
}

interface JoinedMatchesScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function JoinedMatchesScreen({ onBack, onNavigate }: JoinedMatchesScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leavingMatchId, setLeavingMatchId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [matchToLeave, setMatchToLeave] = useState<{ id: string; name: string } | null>(null);

  // Cargar partidos del usuario
  useEffect(() => {
    const loadUserMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const user = auth.currentUser;
        if (!user) {
          setError("Debes iniciar sesión para ver tus partidos.");
          setIsLoading(false);
          return;
        }
        const userId = user.uid;
        const userMatches = await getMatchesForPlayer(userId);
        setMatches(userMatches as Match[]);
      } catch (err) {
        console.error('Error al cargar partidos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar tus partidos');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserMatches();
  }, [auth.currentUser]);

  const handleLeaveClick = (matchId: string, matchName: string) => {
    setMatchToLeave({ id: matchId, name: matchName });
    setShowConfirmDialog(true);
  };

  const handleConfirmLeave = async () => {
    if (!matchToLeave) return;

    const { id: matchId, name: matchName } = matchToLeave;

    try {
      setLeavingMatchId(matchId);
      setShowConfirmDialog(false);
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No se pudo verificar tu identidad. Por favor, inicia sesión de nuevo.");
      }
      const userId = user.uid;

      await leaveMatch(matchId, userId);

      // Actualizar la lista de partidos
      const updatedMatches = await getMatchesForPlayer(userId);
      setMatches(updatedMatches as Match[]);

      toast.success('Has salido del partido exitosamente.');
      
    } catch (error) {
      console.error('Error al salir del partido:', error);
      toast.error('Error al salir del partido', { description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.' });
    } finally {
      setLeavingMatchId(null);
      setMatchToLeave(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'fútbol':
        return '⚽';
      case 'básquet':
        return '🏀';
      case 'tenis':
        return '🎾';
      case 'vóley':
        return '🏐';
      case 'pádel':
        return '🎾';
      default:
        return '🏃';
    }
  };

  const getMatchStatus = (match: Match) => {
    const now = new Date();
    const matchDate = match.date.toDate ? match.date.toDate() : new Date(match.date);
    
    if (matchDate < now) {
      return { text: 'Finalizado', color: 'text-[#666666]', bg: 'bg-[#f0f0f0]' };
    } else if (match.status === 'full') {
      return { text: 'Completo', color: 'text-[#00a884]', bg: 'bg-[#e8f5e8]' };
    } else if (match.status === 'open') {
      return { text: 'Abierto', color: 'text-[#ff9500]', bg: 'bg-[#fff3e0]' };
    } else {
      return { text: 'Cancelado', color: 'text-red-500', bg: 'bg-red-50' };
    }
  };

  const isUserCaptain = (match: Match) => {
    const user = auth.currentUser;
    if (!user) {
      return false;
    }
    const userId = user.uid;
    return match.captainId === userId;
  };

  const canLeaveMatch = (match: Match) => {
    const now = new Date();
    const matchDate = match.date.toDate ? match.date.toDate() : new Date(match.date);
    
    // No puede salir si es el capitán o si el partido ya pasó
    return !isUserCaptain(match) && matchDate > now;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <AppHeader 
          title="Mis Partidos" 
          onBack={onBack}
          showBackButton={true}
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-[#666666]">Cargando tus partidos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <AppHeader 
          title="Mis Partidos" 
          onBack={onBack}
          showBackButton={true}
        />
        <div className="flex flex-col justify-center items-center h-64 px-4">
          <div className="text-red-500 text-center mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#00a884] text-white px-4 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <AppHeader 
        title="Mis Partidos" 
        onBack={onBack}
        showBackButton={true}
      />

      <div className="p-4">
        {matches.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-[#cccccc] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#333333] mb-2">
              No tienes partidos
            </h3>
            <p className="text-[#666666] mb-4">
              Únete a partidos disponibles para empezar a jugar
            </p>
            <button
              onClick={() => onNavigate('available-matches')}
              className="bg-[#00a884] text-white px-6 py-2 rounded-lg font-medium"
            >
              Buscar Partidos
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const status = getMatchStatus(match);
              const isCaptain = isUserCaptain(match);
              const canLeave = canLeaveMatch(match);

              return (
                <div key={match.id} className="bg-white rounded-lg shadow-sm p-4">
                  {/* Header del partido */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{getSportIcon(match.sport)}</div>
                      <div>
                        <h3 className="font-semibold text-[#333333]">{match.courtName}</h3>
                        <p className="text-sm text-[#666666]">{match.sport}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        {status.text}
                      </div>
                      {isCaptain && (
                        <div className="flex items-center space-x-1 text-xs text-[#00a884]">
                          <Trophy className="w-3 h-3" />
                          <span>Capitán</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Información del partido */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-[#666666]">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(match.date)}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-[#666666]">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(match.time)} ({match.duration}h)</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-[#666666]">
                      <MapPin className="w-4 h-4" />
                      <span>{match.location.address}</span>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-[#666666]">
                      <Users className="w-4 h-4" />
                      <span>{match.currentPlayers}/{match.maxPlayers} jugadores</span>
                    </div>

                    {match.description && (
                      <p className="text-sm text-[#666666] mt-2">{match.description}</p>
                    )}
                  </div>

                  {/* Precio */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-bold text-[#00a884]">
                      ${match.pricePerPlayer} por persona
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onNavigate('match-detail', match)}
                      className="flex-1 bg-[#f0f0f0] text-[#333333] py-2 px-4 rounded-lg font-medium"
                    >
                      Ver Detalles
                    </button>
                    
                    {canLeave && (
                      <button
                        onClick={() => handleLeaveClick(match.id, match.courtName)}
                        disabled={leavingMatchId === match.id}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          leavingMatchId === match.id
                            ? 'bg-[#cccccc] text-[#666666] cursor-not-allowed'
                            : 'bg-red-500 text-white'
                        }`}
                      >
                        {leavingMatchId === match.id ? 'Saliendo...' : 'Salir'}
                      </button>
                    )}
                    
                    {isCaptain && (
                      <button
                        onClick={() => onNavigate('match-players', match)}
                        className="bg-[#00a884] text-white py-2 px-4 rounded-lg font-medium"
                      >
                        Gestionar
                      </button>
                    )}
                  </div>

                  {/* Advertencia para capitanes */}
                  {isCaptain && (
                    <div className="mt-3 p-3 bg-[#fff3e0] rounded-lg flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-[#ff9500] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#ff9500]">
                        Como capitán, no puedes salir del partido. Puedes cancelarlo desde la gestión del partido.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Diálogo de Confirmación */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a salir del partido "{matchToLeave?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLeave}
              className="bg-red-600 hover:bg-red-700"
            >
              Sí, salir del partido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
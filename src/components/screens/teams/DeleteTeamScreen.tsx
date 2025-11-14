import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertTriangle, Users, Check, X, Clock, Mail, Bell } from 'lucide-react';
import { notificationService } from '../../common/NotificationHelper';
import { deleteTeam } from '../../../services/teamService';
import { toast } from 'sonner';

interface TeamMember {
  id: string; // Cambiado de number a string para compatibilidad con Firebase
  name: string;
  image?: string;
  role: 'captain' | 'member';
  hasVoted?: boolean;
  vote?: 'approve' | 'reject';
}

interface DeleteTeamScreenProps {
  teamData: {
    id: string; // Cambiado de number a string para compatibilidad con Firebase
    name: string;
    members: TeamMember[];
    captain: TeamMember;
  };
  onBack: () => void;
  onTeamDeleted: () => void;
  currentUserId: string; // Cambiado de number a string para compatibilidad
}

export function DeleteTeamScreen({ teamData, onBack, onTeamDeleted, currentUserId }: DeleteTeamScreenProps) {
  const [votingPhase, setVotingPhase] = useState<'confirm' | 'voting' | 'results'>('confirm');
  const [members, setMembers] = useState<TeamMember[]>(teamData.members);
  const [timeRemaining, setTimeRemaining] = useState(72); // 72 hours for voting
  
  const isCaptain = currentUserId === teamData.captain.id;
  const totalMembers = members.length;
  const requiredVotes = Math.floor(totalMembers / 2) + 1;
  
  const votesCount = {
    approve: members.filter(m => m.vote === 'approve').length,
    reject: members.filter(m => m.vote === 'reject').length,
    pending: members.filter(m => !m.hasVoted).length
  };

  const hasUserVoted = members.find(m => m.id === currentUserId)?.hasVoted || false;
  const userVote = members.find(m => m.id === currentUserId)?.vote;

  // Simulate timer countdown
  useEffect(() => {
    if (votingPhase === 'voting' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setVotingPhase('results');
            return 0;
          }
          return prev - 1;
        });
      }, 3600000); // Update every hour (simulated as 1 second for demo)
      
      return () => clearInterval(timer);
    }
  }, [votingPhase, timeRemaining]);

  // Check if voting should end
  useEffect(() => {
    if (votingPhase === 'voting') {
      if (votesCount.approve >= requiredVotes) {
        setVotingPhase('results');
        // Auto-delete team after showing results
        setTimeout(() => {
          onTeamDeleted();
        }, 3000);
      } else if (votesCount.reject >= requiredVotes) {
        setVotingPhase('results');
      }
    }
  }, [votesCount, requiredVotes, votingPhase, onTeamDeleted]);

  const handleInitiateVoting = () => {
    // Initialize voting for all members except captain (who automatically approves)
    const updatedMembers = members.map(member => 
      member.id === teamData.captain.id 
        ? { ...member, hasVoted: true, vote: 'approve' as const }
        : { ...member, hasVoted: false, vote: undefined }
    );
    setMembers(updatedMembers);
    setVotingPhase('voting');
    
    // Show notifications
    notificationService.showTeamDeletionInitiated(teamData.name);
    notificationService.showEmailSent(teamData.name, totalMembers - 1); // Exclude captain
  };

  const handleImmediateDelete = async () => {
    try {
      // Captain can delete immediately without voting
      notificationService.showTeamDeletionInitiated(teamData.name);
      
      // Call Firebase service to delete the team
      await deleteTeam(teamData.id);
      
      setTimeout(() => {
        onTeamDeleted();
      }, 1000);
    } catch (error) {
      console.error('Error al eliminar el equipo:', error);
      // You could show an error notification here
      alert('Error al eliminar el equipo. Inténtalo de nuevo.');
    }
  };

  const handleVote = (vote: 'approve' | 'reject') => {
    const updatedMembers = members.map(member =>
      member.id === currentUserId
        ? { ...member, hasVoted: true, vote }
        : member
    );
    setMembers(updatedMembers);
  };

  const getVoteIcon = (member: TeamMember) => {
    if (!member.hasVoted) return <Clock className="h-4 w-4 text-[#666666]" />;
    if (member.vote === 'approve') return <Check className="h-4 w-4 text-[#00a884]" />;
    if (member.vote === 'reject') return <X className="h-4 w-4 text-[#dc2626]" />;
    return null;
  };

  const getVoteText = (member: TeamMember) => {
    if (!member.hasVoted) return 'Pendiente';
    if (member.vote === 'approve') return 'A favor';
    if (member.vote === 'reject') return 'En contra';
    return '';
  };

  const getVoteColor = (member: TeamMember) => {
    if (!member.hasVoted) return 'text-[#666666]';
    if (member.vote === 'approve') return 'text-[#00a884]';
    if (member.vote === 'reject') return 'text-[#dc2626]';
    return 'text-[#666666]';
  };

  const renderConfirmPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-[#172c44] mb-2">Eliminar Equipo</h2>
        <p className="text-[#666666]">
          Estás a punto de iniciar el proceso de eliminación del equipo "{teamData.name}"
        </p>
      </div>

      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <h3 className="text-red-800 mb-2">⚠️ Advertencia</h3>
        <ul className="text-red-700 space-y-1">
          <li>• Esta acción no se puede deshacer</li>
          <li>• Se perderán todos los datos del equipo</li>
          <li>• Se cancelarán partidos y torneos pendientes</li>
          {isCaptain ? (
            <li>• Como capitán, puedes eliminar el equipo inmediatamente o iniciar votación</li>
          ) : (
            <li>• Se requiere aprobación de la mayoría del equipo</li>
          )}
        </ul>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-blue-800 mb-2">Proceso de Votación</h3>
        <p className="text-blue-700 mb-2">
          Se enviará una notificación a todos los miembros del equipo para votar.
        </p>
        <ul className="text-blue-700 space-y-1">
          <li>• <strong>Miembros totales:</strong> {totalMembers}</li>
          <li>• <strong>Votos requeridos:</strong> {requiredVotes} (mayoría)</li>
          <li>• <strong>Tiempo límite:</strong> 72 horas</li>
        </ul>
      </div>

      <div className="space-y-3">
        {isCaptain ? (
          <>
            <button
              onClick={handleImmediateDelete}
              className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Eliminar Equipo Inmediatamente (Capitán)
            </button>
            <button
              onClick={handleInitiateVoting}
              className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Iniciar Votación de Eliminación
            </button>
          </>
        ) : (
          <button
            onClick={handleInitiateVoting}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Iniciar Votación de Eliminación
          </button>
        )}
        <button
          onClick={onBack}
          className="w-full py-3 bg-[#e5e5e5] text-[#172c44] rounded-lg hover:bg-[#d0d0d0] transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  const renderVotingPhase = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[#172c44] mb-2">Votación en Curso</h2>
        <p className="text-[#666666]">
          Los miembros están votando sobre la eliminación del equipo
        </p>
      </div>

      {/* Progress */}
      <div className="bg-white p-4 rounded-lg border border-[rgba(23,44,68,0.1)]">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[#172c44]">Progreso de Votación</h3>
          <span className="text-[#666666]">{timeRemaining}h restantes</span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl text-[#00a884] mb-1">{votesCount.approve}</div>
            <div className="text-sm text-[#666666]">A favor</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#dc2626] mb-1">{votesCount.reject}</div>
            <div className="text-sm text-[#666666]">En contra</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#666666] mb-1">{votesCount.pending}</div>
            <div className="text-sm text-[#666666]">Pendientes</div>
          </div>
        </div>

        <div className="mb-2">
          <div className="flex justify-between text-sm text-[#666666] mb-1">
            <span>Votos necesarios: {requiredVotes}</span>
            <span>{votesCount.approve}/{requiredVotes}</span>
          </div>
          <div className="w-full bg-[#e5e5e5] rounded-full h-2">
            <div 
              className="bg-[#00a884] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(votesCount.approve / requiredVotes) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Notifications sent info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="text-blue-800 mb-3">📧 Notificaciones Enviadas</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-700">
            <Mail className="h-4 w-4" />
            <span className="text-sm">Email enviado a {totalMembers - 1} miembros</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-700">
            <Bell className="h-4 w-4" />
            <span className="text-sm">Notificación push enviada a todos los miembros</span>
          </div>
          <div className="flex items-center space-x-2 text-blue-700">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Recordatorio automático en 48 horas</span>
          </div>
        </div>
      </div>

      {/* User's voting section */}
      {!isCaptain && !hasUserVoted && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="text-[#172c44] mb-3">Tu Voto</h3>
          <p className="text-[#666666] mb-4">
            Como miembro del equipo, tu voto es importante para esta decisión.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => handleVote('approve')}
              className="flex-1 py-3 bg-[#00a884] text-white rounded-lg hover:bg-[#008f73] transition-colors flex items-center justify-center gap-2"
            >
              <Check className="h-4 w-4" />
              Aprobar Eliminación
            </button>
            <button
              onClick={() => handleVote('reject')}
              className="flex-1 py-3 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-colors flex items-center justify-center gap-2"
            >
              <X className="h-4 w-4" />
              Rechazar
            </button>
          </div>
        </div>
      )}

      {hasUserVoted && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-green-800 mb-2">✓ Ya has votado</h3>
          <p className="text-green-700">
            Tu voto: <strong>{userVote === 'approve' ? 'A favor' : 'En contra'}</strong> de la eliminación
          </p>
        </div>
      )}

      {/* Members list */}
      <div className="bg-white rounded-lg border border-[rgba(23,44,68,0.1)]">
        <div className="p-4 border-b border-[rgba(23,44,68,0.1)]">
          <h3 className="text-[#172c44]">Estado de Votación</h3>
        </div>
        <div className="p-4 space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#e5e5e5] rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#666666]" />
                </div>
                <div>
                  <p className="text-[#172c44]">
                    {member.name} {member.role === 'captain' && '(Capitán)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getVoteIcon(member)}
                <span className={`text-sm ${getVoteColor(member)}`}>
                  {getVoteText(member)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResultsPhase = () => {
    const approved = votesCount.approve >= requiredVotes;
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            approved ? 'bg-red-100' : 'bg-green-100'
          }`}>
            {approved ? (
              <AlertTriangle className="h-8 w-8 text-red-600" />
            ) : (
              <Check className="h-8 w-8 text-green-600" />
            )}
          </div>
          <h2 className="text-[#172c44] mb-2">
            {approved ? 'Equipo Eliminado' : 'Eliminación Rechazada'}
          </h2>
          <p className="text-[#666666]">
            {approved 
              ? 'La mayoría del equipo aprobó la eliminación'
              : 'No se alcanzó la mayoría necesaria para eliminar el equipo'
            }
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-[rgba(23,44,68,0.1)]">
          <h3 className="text-[#172c44] mb-3">Resultados Finales</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl text-[#00a884] mb-1">{votesCount.approve}</div>
              <div className="text-sm text-[#666666]">A favor</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-[#dc2626] mb-1">{votesCount.reject}</div>
              <div className="text-sm text-[#666666]">En contra</div>
            </div>
            <div className="text-center">
              <div className="text-2xl text-[#666666] mb-1">{votesCount.pending}</div>
              <div className="text-sm text-[#666666]">No votaron</div>
            </div>
          </div>
        </div>

        {approved ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-800">
              El equipo "{teamData.name}" ha sido eliminado permanentemente. 
              Todos los datos asociados se han perdido.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-green-800">
              El equipo "{teamData.name}" se mantiene activo. 
              Puedes continuar participando normalmente.
            </p>
          </div>
        )}

        <button
          onClick={approved ? onTeamDeleted : onBack}
          className="w-full py-3 bg-[#f4b400] text-[#172c44] rounded-lg hover:bg-[#e6a200] transition-colors"
        >
          {approved ? 'Continuar' : 'Volver al Equipo'}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4 border-b border-[rgba(23,44,68,0.1)]">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="h-6 w-6 text-[#172c44]" />
          </button>
          <h1 className="text-[#172c44]">
            {votingPhase === 'confirm' && 'Eliminar Equipo'}
            {votingPhase === 'voting' && 'Votación'}
            {votingPhase === 'results' && 'Resultados'}
          </h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {votingPhase === 'confirm' && renderConfirmPhase()}
        {votingPhase === 'voting' && renderVotingPhase()}
        {votingPhase === 'results' && renderResultsPhase()}
      </div>
    </div>
  );
}

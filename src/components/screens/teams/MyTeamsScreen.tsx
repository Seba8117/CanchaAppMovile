import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Users, Crown, Settings, Search, Filter, Trash2, MoreVertical, Loader2, AlertTriangle } from 'lucide-react';
import { AppHeader } from '../../common/AppHeader';
import { TeamData } from '../../../services/teamService'; // Mantenemos tu tipo de datos
import { auth, db } from '../../../Firebase/firebaseConfig';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';

interface Team {
  id: string;
  name: string;
  sport: string;
  type: 'official' | 'temporary';
  currentPlayers: number;
  maxPlayers: number;
  role: 'captain' | 'member';
  image?: string;
  status: 'active' | 'inactive';
  lastActivity: string;
}

interface MyTeamsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function MyTeamsScreen({ onBack, onNavigate }: MyTeamsScreenProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [activeTab, setActiveTab] = useState<'official' | 'temporary'>('official');
  const [searchQuery, setSearchQuery] = useState('');
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escuchar cambios de autenticación
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Cargar equipos del usuario en tiempo real usando onSnapshot
  useEffect(() => {
    if (!currentUser) {
      setTeams([]);
      setIsLoading(false);
      setError("No hay usuario autenticado.");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    let captainTeams: TeamData[] = [];
    let memberTeams: TeamData[] = [];

    // Función para combinar y actualizar el estado
    const combineAndSetTeams = () => {
      const allTeamsMap = new Map<string, TeamData>();
      // Añadir equipos donde soy miembro
      memberTeams.forEach(team => {
        if (team && team.id) allTeamsMap.set(team.id, team);
      });
      // Añadir/Sobrescribir equipos donde soy capitán (para asegurar el rol correcto)
      captainTeams.forEach(team => {
        if (team && team.id) allTeamsMap.set(team.id, team);
      });
      
      setTeams(Array.from(allTeamsMap.values()));
      setIsLoading(false);
    };

    // Consulta 1: Equipos donde soy capitán
    const qCaptain = query(
      collection(db, "teams"),
      where("captainId", "==", currentUser.uid)
    );
    
    // Consulta 2: Equipos donde estoy en la lista de miembros
    const qMember = query(
      collection(db, "teams"),
      where("members", "array-contains", currentUser.uid)
    );

    const unsubCaptain = onSnapshot(qCaptain, (snapshot) => {
      captainTeams = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as TeamData[];
      combineAndSetTeams(); // Combinar resultados
    }, (err) => {
      console.error('Error (captain teams):', err);
      setError('Error al cargar equipos');
      setIsLoading(false);
    });

    const unsubMember = onSnapshot(qMember, (snapshot) => {
      memberTeams = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as TeamData[];
      combineAndSetTeams(); // Combinar resultados
    }, (err) => {
      console.error('Error (member teams):', err);
      setError('Error al cargar equipos');
      setIsLoading(false);
    });

    // Devolver la función de limpieza para ambos listeners
    return () => {
      unsubCaptain();
      unsubMember();
    };
  }, [currentUser]); // Se re-ejecuta si el usuario cambia

  // Convertir equipos de Firebase al formato de la interfaz Team
  const displayTeams = teams.map(team => ({
    id: team.id || '',
    name: team.name,
    sport: team.sport,
    type: team.status === 'active' ? 'official' : 'temporary' as 'official' | 'temporary',
    // CORRECCIÓN: Priorizamos team.members.length. Si members existe, usamos su largo. Si no, usamos currentPlayers o 0.
    currentPlayers: team.members ? team.members.length : (team.currentPlayers || 0),
    maxPlayers: team.maxPlayers || 10,
    role: team.captainId === auth.currentUser?.uid ? 'captain' : 'member' as 'captain' | 'member',
    image: team.teamImage,
    status: team.status as 'active' | 'inactive',
    lastActivity: 'Reciente' // Puedes actualizar esto con team.lastMessageTimestamp si lo tienes
  }));

  const filteredTeams = displayTeams
    .filter(team => activeTab === 'official' ? team.status === 'active' : team.status === 'inactive')
    .filter(team =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.sport.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getTeamStatusColor = (status: string) => {
    return status === 'active' ? 'text-[#00a884]' : 'text-[#666666]';
  };

  const getTeamStatusText = (status: string) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
  };

  const handleDeleteTeam = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation(); // Prevenir clic en la tarjeta
    
    // Navegar directamente a la pantalla de confirmación de eliminación
    onNavigate('delete-team', team);
  };
  
  // --- RENDERIZADO ---

  const renderTeamCard = (team: Team) => (
    <div
      key={team.id}
      className="bg-white p-4 rounded-lg border border-[rgba(23,44,68,0.1)] mb-3 relative"
    >
      <div
        onClick={() => onNavigate('team-details', team)}
        className="flex items-center space-x-3 cursor-pointer active:bg-[#f8f9fa] transition-colors rounded-lg p-2 -m-2"
      >
        <div className="relative">
          {team.image ? (
            <img src={team.image} alt={team.name} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 bg-[#e5e5e5] rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-[#666666]" />
            </div>
          )}
          {team.role === 'captain' && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#f4b400] rounded-full flex items-center justify-center">
              <Crown className="h-3 w-3 text-[#172c44]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[#172c44] font-semibold truncate">{team.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm font-medium ${getTeamStatusColor(team.status)}`}>
                {getTeamStatusText(team.status)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[#666666]">
              <span className="text-sm">{team.sport}</span>
              <span className="text-sm">
                {team.currentPlayers}/{team.maxPlayers} jugadores
              </span>
            </div>
          </div>
          
          <p className="text-sm text-[#999999] mt-1">{team.lastActivity}</p>
        </div>
      </div>

      {/* Delete button for captains of official teams */}
      {team.role === 'captain' && team.type === 'official' && (
        <button
          onClick={(e) => handleDeleteTeam(e, team)}
          className="absolute top-3 right-3 p-2 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar equipo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12 bg-white/80 rounded-lg backdrop-blur-sm">
      <Users className="h-16 w-16 text-[#e5e5e5] mx-auto mb-4" />
      <h3 className="text-[#172c44] font-bold mb-2">
        {activeTab === 'official' ? 'No tienes equipos oficiales' : 'No tienes equipos temporales'}
      </h3>
      <p className="text-[#666666] mb-6 px-4">
        {activeTab === 'official'
          ? 'Crea tu primer equipo oficial o únete a uno existente.'
          : 'Los equipos temporales se crean al unirte a partidos.'
        }
      </p>
      {activeTab === 'official' && (
        <button
          onClick={() => onNavigate('create-team')}
          className="bg-[#f4b400] text-[#172c44] px-6 py-3 rounded-lg hover:bg-[#e6a200] transition-colors font-semibold"
        >
          Crear Equipo
        </button>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-white animate-spin mx-auto" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-12 bg-white/80 rounded-lg backdrop-blur-sm p-4">
           <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
           <h3 className="text-red-700 font-semibold">Error al cargar equipos</h3>
           <p className="text-red-600 text-sm">{error}</p>
        </div>
      );
    }
    return filteredTeams.length > 0 ? (
      <div>{filteredTeams.map(renderTeamCard)}</div>
    ) : (
      renderEmptyState()
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#172c44] to-[#00a884] min-h-screen pb-24">
      {/* Header */}
      <AppHeader
        title="Mis Equipos"
        showLogo={true}
        showBackButton={false}
        rightContent={
          <button
            onClick={() => onNavigate('create-team')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Crear equipo"
          >
            <Plus className="h-6 w-6 text-[#172c44]" />
          </button>
        }
      />

      {/* Search bar */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666]" />
          <input
            type="text"
            placeholder="Buscar en mis equipos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400] shadow-sm text-gray-900"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 mb-4 shadow-sm">
          <button
            onClick={() => setActiveTab('official')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors font-semibold ${
              activeTab === 'official'
                ? 'bg-[#f4b400] text-[#172c44] shadow-sm'
                : 'text-[#666666] hover:bg-white/50'
            }`}
          >
            Oficiales
          </button>
          <button
            onClick={() => setActiveTab('temporary')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors font-semibold ${
              activeTab === 'temporary'
                ? 'bg-[#f4b400] text-[#172c44] shadow-sm'
                : 'text-[#666666] hover:bg-white/50'
            }`}
          >
            Temporales
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {renderContent()}
      </div>

      {/* Fixed create button for official teams */}
      {activeTab === 'official' && !isLoading && !error && (
        <button
          onClick={() => onNavigate('create-team')}
          className="fixed bottom-32 right-6 bg-[#f4b400] text-[#172c44] p-4 rounded-full shadow-lg hover:bg-[#e6a200] transition-colors z-40"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
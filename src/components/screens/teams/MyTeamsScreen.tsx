import React, { useState } from 'react';
import { ArrowLeft, Plus, Users, Crown, Settings, Search, Filter, Trash2, MoreVertical } from 'lucide-react';
import { notificationService } from '../../common/NotificationHelper';
import { AppHeader } from '../../common/AppHeader';

interface Team {
  id: number;
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
  const [activeTab, setActiveTab] = useState<'official' | 'temporary'>('official');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for user's teams
  const [teams] = useState<Team[]>([
    {
      id: 1,
      name: 'Los Tigres FC',
      sport: 'Fútbol',
      type: 'official',
      currentPlayers: 8,
      maxPlayers: 11,
      role: 'captain',
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop',
      status: 'active',
      lastActivity: 'Hace 2 días'
    },
    {
      id: 2,
      name: 'Baloncesto Elite',
      sport: 'Básquet',
      type: 'official',
      currentPlayers: 5,
      maxPlayers: 7,
      role: 'member',
      status: 'active',
      lastActivity: 'Hace 1 semana'
    },
    {
      id: 3,
      name: 'Equipo Cancha Norte',
      sport: 'Fútbol',
      type: 'temporary',
      currentPlayers: 6,
      maxPlayers: 10,
      role: 'member',
      status: 'active',
      lastActivity: 'Hace 3 horas'
    },
    {
      id: 4,
      name: 'Partido del Viernes',
      sport: 'Fútbol',
      type: 'temporary',
      currentPlayers: 4,
      maxPlayers: 8,
      role: 'captain',
      status: 'inactive',
      lastActivity: 'Hace 1 mes'
    }
  ]);

  const filteredTeams = teams
    .filter(team => team.type === activeTab)
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
    e.stopPropagation(); // Prevent card click
    
    // Show confirmation first
    if (confirm(`¿Estás seguro de que quieres iniciar el proceso de eliminación del equipo "${team.name}"? Esto notificará a todos los miembros para que voten.`)) {
      onNavigate('delete-team', {
        ...team,
        captain: { id: 1, name: 'Juan Pérez' }, // Mock captain data
        members: Array.from({ length: team.currentPlayers }, (_, i) => ({
          id: i + 1,
          name: i === 0 ? 'Juan Pérez' : `Jugador ${i + 1}`,
          role: i === 0 ? 'captain' : 'member',
          image: undefined
        }))
      });
    }
  };

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
            <img
              src={team.image}
              alt={team.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
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
            <h3 className="text-[#172c44] truncate">{team.name}</h3>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${getTeamStatusColor(team.status)}`}>
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
    <div className="text-center py-12">
      <Users className="h-16 w-16 text-[#e5e5e5] mx-auto mb-4" />
      <h3 className="text-[#172c44] mb-2">
        {activeTab === 'official' ? 'No tienes equipos oficiales' : 'No tienes equipos temporales'}
      </h3>
      <p className="text-[#666666] mb-6">
        {activeTab === 'official' 
          ? 'Crea tu primer equipo oficial para participar en torneos'
          : 'Los equipos temporales se crean automáticamente al unirse a partidos'
        }
      </p>
      {activeTab === 'official' && (
        <button
          onClick={() => onNavigate('create-team')}
          className="bg-[#f4b400] text-[#172c44] px-6 py-3 rounded-lg hover:bg-[#e6a200] transition-colors"
        >
          Crear Equipo
        </button>
      )}
    </div>
  );

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

      {/* Search bar over gradient background */}
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#666666]" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/90 backdrop-blur-sm border border-white/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400] shadow-sm"
          />
        </div>
      </div>

      {/* Tabs over gradient background */}
      <div className="px-4 pt-4">
        <div className="flex bg-white/90 backdrop-blur-sm rounded-lg p-1 mb-4 shadow-sm">
          <button
            onClick={() => setActiveTab('official')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
              activeTab === 'official'
                ? 'bg-[#f4b400] text-[#172c44] shadow-sm'
                : 'text-[#666666] hover:bg-white/50'
            }`}
          >
            Oficiales
          </button>
          <button
            onClick={() => setActiveTab('temporary')}
            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${
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
        {activeTab === 'official' && (
          <div className="bg-[#e8f5e8] p-4 rounded-lg mb-4 border-l-4 border-[#00a884]">
            <h3 className="text-[#172c44] mb-1">Equipos Oficiales</h3>
            <p className="text-[#666666] mb-2">
              Estos equipos son permanentes y pueden participar en torneos y partidos casuales. 
              Como capitán puedes gestionar miembros y configuración.
            </p>
            <div className="flex items-center space-x-2 text-[#666666]">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="text-sm">Solo los capitanes pueden eliminar equipos (requiere votación)</span>
            </div>
          </div>
        )}

        {activeTab === 'temporary' && (
          <div className="bg-[#fff4e6] p-4 rounded-lg mb-4 border-l-4 border-[#f4b400]">
            <h3 className="text-[#172c44] mb-1">Equipos Temporales</h3>
            <p className="text-[#666666]">
              Se crean automáticamente cuando te unes a partidos. Son específicos para cada match 
              y se disuelven al finalizar.
            </p>
          </div>
        )}

        {filteredTeams.length > 0 ? (
          <div>
            {filteredTeams.map(renderTeamCard)}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>

      {/* Fixed create button for official teams */}
      {activeTab === 'official' && filteredTeams.length > 0 && (
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

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Filter, MapPin, Clock, Users, Calendar, Trophy } from 'lucide-react';
import { AppHeader } from '../../common/AppHeader';
import { getAvailableMatches, joinMatch, searchMatches } from '../../../services/matchService';

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

interface AvailableMatchesScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function AvailableMatchesScreen({ onBack, onNavigate }: AvailableMatchesScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [joiningMatchId, setJoiningMatchId] = useState<string | null>(null);

  const sports = ['all', 'Fútbol', 'Básquet', 'Tenis', 'Vóley', 'Pádel'];

  // Cargar partidos disponibles
  useEffect(() => {
    const loadAvailableMatches = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const availableMatches = await getAvailableMatches();
        setMatches(availableMatches as Match[]);
        setFilteredMatches(availableMatches as Match[]);
      } catch (err) {
        console.error('Error al cargar partidos:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar los partidos');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableMatches();
  }, []);

  // Filtrar partidos por búsqueda y deporte
  useEffect(() => {
    let filtered = matches;

    // Filtrar por deporte
    if (selectedSport !== 'all') {
      filtered = filtered.filter(match => match.sport === selectedSport);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(match =>
        match.courtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.location.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.captainName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMatches(filtered);
  }, [matches, searchQuery, selectedSport]);

  const handleJoinMatch = async (matchId: string) => {
    try {
      setJoiningMatchId(matchId);
      
      // TODO: Obtener el ID y nombre del usuario actual del contexto de autenticación
      const userId = 'current-user-id';
      const userName = 'Usuario Actual';
      
      await joinMatch(matchId, userId, userName);
      
      // Actualizar la lista de partidos
      const updatedMatches = await getAvailableMatches();
      setMatches(updatedMatches as Match[]);
      
      // Mostrar mensaje de éxito
      alert('¡Te has unido al partido exitosamente!');
      
    } catch (error) {
      console.error('Error al unirse al partido:', error);
      alert(error instanceof Error ? error.message : 'Error al unirse al partido');
    } finally {
      setJoiningMatchId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
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

  const getAvailableSpots = (match: Match) => {
    return match.maxPlayers - match.currentPlayers;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <AppHeader 
          title="Partidos Disponibles" 
          onBack={onBack}
          showBackButton={true}
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-[#666666]">Cargando partidos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <AppHeader 
          title="Partidos Disponibles" 
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
        title="Partidos Disponibles" 
        onBack={onBack}
        showBackButton={true}
      />

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white p-4 shadow-sm">
        <div className="flex space-x-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#666666] w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por cancha, ubicación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#e5e5e5] rounded-lg focus:outline-none focus:border-[#00a884]"
            />
          </div>
        </div>

        {/* Filtro por deporte */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {sports.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium ${
                selectedSport === sport
                  ? 'bg-[#00a884] text-white'
                  : 'bg-[#f0f0f0] text-[#666666]'
              }`}
            >
              {sport === 'all' ? 'Todos' : sport}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de partidos */}
      <div className="p-4 space-y-4">
        {filteredMatches.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-16 h-16 text-[#cccccc] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[#333333] mb-2">
              No hay partidos disponibles
            </h3>
            <p className="text-[#666666]">
              {searchQuery || selectedSport !== 'all' 
                ? 'Intenta cambiar los filtros de búsqueda'
                : 'Sé el primero en crear un partido'
              }
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => (
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
                <div className="text-right">
                  <div className="text-lg font-bold text-[#00a884]">
                    ${match.pricePerPlayer}
                  </div>
                  <div className="text-xs text-[#666666]">por persona</div>
                </div>
              </div>

              {/* Información del partido */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-[#666666]">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(match.date)}</span>
                  <Clock className="w-4 h-4 ml-2" />
                  <span>{formatTime(match.time)} ({match.duration}h)</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-[#666666]">
                  <MapPin className="w-4 h-4" />
                  <span>{match.location.address}</span>
                </div>

                <div className="flex items-center space-x-2 text-sm text-[#666666]">
                  <Users className="w-4 h-4" />
                  <span>
                    {match.currentPlayers}/{match.maxPlayers} jugadores
                    {getAvailableSpots(match) > 0 && (
                      <span className="text-[#00a884] ml-1">
                        ({getAvailableSpots(match)} disponibles)
                      </span>
                    )}
                  </span>
                </div>

                {match.description && (
                  <p className="text-sm text-[#666666] mt-2">{match.description}</p>
                )}
              </div>

              {/* Capitán */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#00a884] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {match.captainName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333333]">{match.captainName}</p>
                    <p className="text-xs text-[#666666]">Capitán</p>
                  </div>
                </div>
              </div>

              {/* Botón de unirse */}
              <div className="flex space-x-3">
                <button
                  onClick={() => onNavigate('match-detail', match)}
                  className="flex-1 bg-[#f0f0f0] text-[#333333] py-2 px-4 rounded-lg font-medium"
                >
                  Ver Detalles
                </button>
                <button
                  onClick={() => handleJoinMatch(match.id)}
                  disabled={getAvailableSpots(match) === 0 || joiningMatchId === match.id}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    getAvailableSpots(match) === 0
                      ? 'bg-[#cccccc] text-[#666666] cursor-not-allowed'
                      : joiningMatchId === match.id
                      ? 'bg-[#cccccc] text-[#666666] cursor-not-allowed'
                      : 'bg-[#00a884] text-white'
                  }`}
                >
                  {joiningMatchId === match.id 
                    ? 'Uniéndose...' 
                    : getAvailableSpots(match) === 0 
                    ? 'Partido Lleno' 
                    : 'Unirse'
                  }
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
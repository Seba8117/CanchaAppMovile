import { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Crown, Shield } from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { AppHeader } from '../../common/AppHeader';

interface CreateMatchScreenProps {
  onBack: () => void;
}

export function CreateMatchScreen({ onBack }: CreateMatchScreenProps) {
  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedCourt, setSelectedCourt] = useState('');
  const [includeMyTeam, setIncludeMyTeam] = useState(false);

  // Mock user's teams where they are captain
  const myTeamsAsCaptain = [
    {
      id: 1,
      name: 'Los Tigres FC',
      sport: 'football',
      members: 8,
      maxMembers: 11,
      image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop'
    },
    {
      id: 2,
      name: 'Águilas Basket',
      sport: 'basketball',
      members: 5,
      maxMembers: 7,
      image: undefined
    }
  ];

  // Get teams that match the selected sport
  const compatibleTeams = myTeamsAsCaptain.filter(team => team.sport === selectedSport);
  const selectedTeam = compatibleTeams.length > 0 ? compatibleTeams[0] : null;

  const sports = [
    { id: 'football', name: 'Fútbol', icon: '⚽' },
    { id: 'basketball', name: 'Básquetball', icon: '🏀' },
    { id: 'tennis', name: 'Tenis', icon: '🎾' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
    { id: 'padel', name: 'Pádel', icon: '🏓' },
    { id: 'futsal', name: 'Futsal', icon: '⚽' },
  ];

  const courts = [
    {
      id: 1,
      name: 'Cancha Los Pinos',
      location: 'Providencia',
      price: 25000,
      rating: 4.8,
      distance: '1.2 km'
    },
    {
      id: 2,
      name: 'Polideportivo Central',
      location: 'Santiago Centro',
      price: 18000,
      rating: 4.5,
      distance: '2.1 km'
    },
    {
      id: 3,
      name: 'Club Deportivo Norte',
      location: 'Las Condes',
      price: 35000,
      rating: 4.9,
      distance: '3.5 km'
    }
  ];

  const timeSlots = [
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">¿Qué deporte quieres jugar?</h2>
      <div className="grid grid-cols-2 gap-3">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`p-4 rounded-lg border-2 transition-colors ${
              selectedSport === sport.id
                ? 'border-[#f4b400] bg-[#f4b400]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-2xl mb-2">{sport.icon}</div>
            <p className="text-sm text-[#172c44]">{sport.name}</p>
          </button>
        ))}
      </div>
      <Button 
        onClick={() => setStep(2)}
        disabled={!selectedSport}
        className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
      >
        Continuar
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">Selecciona una cancha</h2>
      <div className="space-y-3">
        {courts.map((court) => (
          <Card 
            key={court.id}
            className={`cursor-pointer transition-colors ${
              selectedCourt === court.id.toString()
                ? 'border-[#f4b400] bg-[#f4b400]'
                : 'border-gray-200'
            }`}
            onClick={() => setSelectedCourt(court.id.toString())}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[#172c44] mb-1">{court.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      <span>{court.location} • {court.distance}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>⭐ {court.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#00a884]">${court.price.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">por hora</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(1)}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button 
          onClick={() => setStep(3)}
          disabled={!selectedCourt}
          className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
        >
          Continuar
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">Configura tu partido</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white mb-2">
            Fecha del partido
          </label>
          <Input type="date" className="w-full" />
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Hora de inicio
          </label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una hora" />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Duración (horas)
          </label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Duración" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora</SelectItem>
              <SelectItem value="1.5">1.5 horas</SelectItem>
              <SelectItem value="2">2 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Número de jugadores
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[6, 8, 10, 12, 14, 16].map((num) => (
              <Button
                key={num}
                variant="outline"
                className="aspect-square"
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-white mb-2">
            Costo por jugador
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              type="number" 
              placeholder="5000"
              className="pl-10"
            />
          </div>
        </div>

        {/* Team inclusion option */}
        {selectedTeam && (
          <div className="border border-[rgba(23,44,68,0.1)] rounded-lg p-4 bg-[#f8f9fa]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-[#f4b400]" />
                <label className="text-[#172c44] cursor-pointer">
                  Incluir mi equipo oficial
                </label>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMyTeam}
                  onChange={(e) => setIncludeMyTeam(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#f4b400]/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f4b400]"></div>
              </label>
            </div>
            
            {includeMyTeam && selectedTeam && (
              <div className="bg-white p-3 rounded-lg border border-[rgba(23,44,68,0.1)]">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {selectedTeam.image ? (
                      <img
                        src={selectedTeam.image}
                        alt={selectedTeam.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-[#e5e5e5] rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#666666]" />
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#f4b400] rounded-full flex items-center justify-center">
                      <Crown className="h-2.5 w-2.5 text-[#172c44]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#172c44] text-sm">{selectedTeam.name}</h4>
                    <p className="text-[#666666] text-xs">
                      {selectedTeam.members}/{selectedTeam.maxMembers} miembros • Equipo oficial
                    </p>
                  </div>
                </div>
                <div className="mt-2 p-2 bg-[#e8f5e8] rounded border-l-2 border-[#00a884]">
                  <p className="text-xs text-[#00a884]">
                    <Shield className="h-3 w-3 inline mr-1" />
                    Tu equipo participará como una unidad. Los miembros del equipo tendrán prioridad para unirse al partido.
                  </p>
                </div>
              </div>
            )}
            
            {!includeMyTeam && (
              <p className="text-sm text-[#666666]">
                Los jugadores se organizarán en equipos temporales automáticamente cuando se unan al partido.
              </p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm text-white mb-2">
            Descripción (opcional)
          </label>
          <Textarea 
            placeholder="Describe tu partido, nivel de juego, reglas especiales..."
            className="resize-none"
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(2)}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button 
          onClick={() => setStep(4)}
          className="flex-1 bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
        >
          Continuar
        </Button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-white mb-4">Confirma y publica</h2>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Deporte:</span>
            <span className="text-[#172c44]">Fútbol</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cancha:</span>
            <span className="text-[#172c44]">Cancha Los Pinos</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fecha:</span>
            <span className="text-[#172c44]">Mañana, 19:00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Jugadores:</span>
            <span className="text-[#172c44]">10 personas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Costo por persona:</span>
            <span className="text-[#00a884]">$5.000</span>
          </div>
          {includeMyTeam && selectedTeam && (
            <div className="flex justify-between">
              <span className="text-gray-600">Equipo incluido:</span>
              <div className="flex items-center space-x-1">
                <Crown className="h-3 w-3 text-[#f4b400]" />
                <span className="text-[#172c44]">{selectedTeam.name}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between border-t pt-2">
            <span className="text-[#172c44]">Total arriendo cancha:</span>
            <span className="text-[#172c44]">$50.000</span>
          </div>
        </CardContent>
      </Card>

      {/* Team information based on inclusion */}
      {includeMyTeam && selectedTeam ? (
        <div className="space-y-3">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-4 w-4 text-[#00a884]" />
              <p className="text-sm text-green-800">
                <strong>Equipo oficial incluido:</strong> {selectedTeam.name}
              </p>
            </div>
            <p className="text-xs text-green-700">
              Los {selectedTeam.members} miembros de tu equipo tendrán prioridad para unirse. 
              Si hay espacios adicionales, otros jugadores podrán formar un equipo temporal.
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Responsabilidad de capitán:</strong> Coordinarás el pago de la cancha y la participación de tu equipo.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Importante:</strong> Como organizador, serás responsable de coordinar el pago de la cancha. 
              Los jugadores pagarán su parte al unirse al partido.
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Equipos temporales:</strong> Al crear este partido, se formarán automáticamente 1 o 2 equipos temporales 
              cuando los jugadores se unan. Estos equipos son específicos para este partido.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep(3)}
          className="flex-1"
        >
          Atrás
        </Button>
        <Button 
          onClick={onBack}
          className="flex-1 bg-[#00a884] hover:bg-[#008f73] text-white"
        >
          Publicar Partido
        </Button>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] pb-20">
      {/* Header */}
      <AppHeader 
        title="Crear Partido" 
        showLogo={true}
        showBackButton={false}
      />
      
      {/* Progress bar */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step >= stepNum
                    ? 'bg-[#f4b400] text-[#172c44]'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {stepNum}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#f4b400] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 pb-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
}

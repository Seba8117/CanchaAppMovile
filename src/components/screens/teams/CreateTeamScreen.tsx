import React, { useState } from 'react';
import { ArrowLeft, Upload, Users, Shield } from 'lucide-react';
import { createTeam, getTeamById } from '../../../services/teamService';
import { auth } from '../../../Firebase/firebaseConfig';

interface CreateTeamScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function CreateTeamScreen({ onBack, onNavigate }: CreateTeamScreenProps) {
  const [teamData, setTeamData] = useState({
    name: '',
    description: '',
    sport: 'Fútbol',
    maxPlayers: '11',
    isPrivate: false,
    requiresApproval: true,
    teamImage: null as File | null
  });

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sports = ['Fútbol', 'Básquet', 'Tenis', 'Vóley', 'Pádel'];

  const handleInputChange = (field: string, value: any) => {
    setTeamData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTeamData(prev => ({ ...prev, teamImage: file }));
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleCreateTeam = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Verificar que el usuario esté autenticado
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Debes estar autenticado para crear un equipo');
      }
      
      // Datos del equipo para Firebase
      const teamDataForFirebase = {
        name: teamData.name,
        description: teamData.description,
        sport: teamData.sport,
        maxPlayers: parseInt(teamData.maxPlayers),
        isPrivate: teamData.isPrivate,
        requiresApproval: teamData.requiresApproval,
        captainId: currentUser.uid, // Usar el UID del usuario autenticado
        captainName: currentUser.email || 'Usuario', // Usar el email como nombre temporal
        status: 'active' as const,
      };

      // Crear el equipo en Firebase
      const teamId = await createTeam(teamDataForFirebase);
      
      console.log('Equipo creado exitosamente con ID:', teamId);
      
      // Navegar directamente a "Mis Equipos" para ver el equipo en la lista
      onNavigate('my-teams');
      
    } catch (error) {
      console.error('Error al crear el equipo:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al crear el equipo');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center items-center space-x-2 mb-6">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step >= stepNumber 
              ? 'bg-[#00a884] text-white' 
              : 'bg-[#e5e5e5] text-[#666666]'
          }`}>
            {stepNumber}
          </div>
          {stepNumber < 3 && (
            <div className={`w-8 h-0.5 mx-2 ${
              step > stepNumber ? 'bg-[#00a884]' : 'bg-[#e5e5e5]'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[#172c44] mb-2">Información básica</h2>
        <p className="text-[#666666]">Configura los datos principales de tu equipo</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[#172c44] mb-2">Nombre del equipo *</label>
          <input
            type="text"
            value={teamData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Ej: Los Tigres FC"
            className="w-full px-4 py-3 bg-[#f8f9fa] border border-[rgba(23,44,68,0.1)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400]"
          />
        </div>

        <div>
          <label className="block text-[#172c44] mb-2">Descripción</label>
          <textarea
            value={teamData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe tu equipo, nivel de juego, objetivos..."
            rows={4}
            className="w-full px-4 py-3 bg-[#f8f9fa] border border-[rgba(23,44,68,0.1)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400] resize-none"
          />
        </div>

        <div>
          <label className="block text-[#172c44] mb-2">Deporte *</label>
          <select
            value={teamData.sport}
            onChange={(e) => handleInputChange('sport', e.target.value)}
            className="w-full px-4 py-3 bg-[#f8f9fa] border border-[rgba(23,44,68,0.1)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400]"
          >
            {sports.map(sport => (
              <option key={sport} value={sport}>{sport}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[#172c44] mb-2">Máximo de jugadores *</label>
          <select
            value={teamData.maxPlayers}
            onChange={(e) => handleInputChange('maxPlayers', e.target.value)}
            className="w-full px-4 py-3 bg-[#f8f9fa] border border-[rgba(23,44,68,0.1)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f4b400]"
          >
            <option value="5">5 jugadores</option>
            <option value="7">7 jugadores</option>
            <option value="11">11 jugadores</option>
            <option value="15">15 jugadores</option>
            <option value="20">20 jugadores</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[#172c44] mb-2">Configuración del equipo</h2>
        <p className="text-[#666666]">Define cómo funcionará tu equipo</p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#f8f9fa] p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-[#00a884] mt-0.5" />
            <div className="flex-1">
              <h3 className="text-[#172c44] mb-1">Equipo Oficial</h3>
              <p className="text-[#666666] mb-3">Los equipos oficiales son permanentes y pueden participar en torneos y partidos casuales.</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white border border-[rgba(23,44,68,0.1)] rounded-lg">
            <div>
              <h4 className="text-[#172c44]">Equipo privado</h4>
              <p className="text-[#666666]">Solo visible por invitación</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={teamData.isPrivate}
                onChange={(e) => handleInputChange('isPrivate', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e5e5e5] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#f4b400] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white border border-[rgba(23,44,68,0.1)] rounded-lg">
            <div>
              <h4 className="text-[#172c44]">Requiere aprobación</h4>
              <p className="text-[#666666]">Las solicitudes deben ser aprobadas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={teamData.requiresApproval}
                onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#e5e5e5] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#f4b400] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00a884]"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-[#172c44] mb-2">Imagen del equipo</h2>
        <p className="text-[#666666]">Añade una imagen representativa (opcional)</p>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-[rgba(23,44,68,0.2)] rounded-lg p-8 text-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="team-image-upload"
          />
          <label
            htmlFor="team-image-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Upload className="h-8 w-8 text-[#666666]" />
            <p className="text-[#666666]">Toca para subir una imagen</p>
            <p className="text-[#999999]">PNG, JPG hasta 5MB</p>
          </label>
          {teamData.teamImage && (
            <p className="text-[#00a884] mt-2">✓ Imagen seleccionada</p>
          )}
        </div>

        <div className="bg-[#f8f9fa] p-4 rounded-lg">
          <h3 className="text-[#172c44] mb-2">Resumen del equipo</h3>
          <div className="space-y-2 text-[#666666]">
            <p><span className="text-[#172c44]">Nombre:</span> {teamData.name || 'Sin nombre'}</p>
            <p><span className="text-[#172c44]">Deporte:</span> {teamData.sport}</p>
            <p><span className="text-[#172c44]">Máx. jugadores:</span> {teamData.maxPlayers}</p>
            <p><span className="text-[#172c44]">Tipo:</span> Equipo oficial</p>
            <p><span className="text-[#172c44]">Privacidad:</span> {teamData.isPrivate ? 'Privado' : 'Público'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const canProceed = () => {
    switch (step) {
      case 1:
        return teamData.name.trim() !== '' && teamData.sport !== '';
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#172c44] to-[#00a884] min-h-screen">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={handleBack} className="p-2">
            <ArrowLeft className="h-6 w-6 text-[#172c44]" />
          </button>
          <h1 className="text-[#172c44]">Crear Equipo</h1>
          <div className="w-10"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {renderStepIndicator()}
        
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgba(23,44,68,0.1)] p-4">
        <div className="max-w-sm mx-auto">
          {step === 3 ? (
            <button
              onClick={handleCreateTeam}
              disabled={!canProceed()}
              className={`w-full py-3 rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-[#f4b400] text-[#172c44] hover:bg-[#e6a200]'
                  : 'bg-[#e5e5e5] text-[#999999] cursor-not-allowed'
              }`}
            >
              Crear Equipo
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full py-3 rounded-lg transition-colors ${
                canProceed()
                  ? 'bg-[#f4b400] text-[#172c44] hover:bg-[#e6a200]'
                  : 'bg-[#e5e5e5] text-[#999999] cursor-not-allowed'
              }`}
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

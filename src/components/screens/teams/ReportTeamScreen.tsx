import { ArrowLeft, AlertTriangle, Check, Users, Shield } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

interface ReportTeamScreenProps {
  teamData?: any;
  onBack: () => void;
}

export function ReportTeamScreen({ teamData, onBack }: ReportTeamScreenProps) {
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Mock teams data - in real app this would come from API
  const teams = [
    {
      id: 'team1',
      name: 'Los Tigres FC',
      captain: 'Juan Pérez',
      members: 12,
      avatar: 'LT',
      lastMatch: 'Hace 2 días'
    },
    {
      id: 'team2',
      name: 'Águilas Doradas',
      captain: 'María González',
      members: 15,
      avatar: 'AD',
      lastMatch: 'Hace 1 semana'
    },
    {
      id: 'team3',
      name: 'Rayos United',
      captain: 'Carlos Silva',
      members: 18,
      avatar: 'RU',
      lastMatch: 'Hace 3 días'
    },
    {
      id: 'team4',
      name: 'Halcones FC',
      captain: 'Ana Torres',
      members: 10,
      avatar: 'HF',
      lastMatch: 'Ayer'
    }
  ];

  const reportReasons = [
    {
      id: 'multiple-violations',
      label: 'Múltiples violaciones de jugadores',
      description: 'Varios miembros del equipo con comportamientos inapropiados'
    },
    {
      id: 'unsportsmanlike-team',
      label: 'Comportamiento antideportivo grupal',
      description: 'Conducta coordinada inapropiada del equipo'
    },
    {
      id: 'cheating-organized',
      label: 'Trampa organizada',
      description: 'Estrategias desleales coordinadas por el equipo'
    },
    {
      id: 'harassment-systematic',
      label: 'Acoso sistemático',
      description: 'Patrones de acoso o discriminación por parte del equipo'
    },
    {
      id: 'no-show-pattern',
      label: 'Patrón de ausencias',
      description: 'Faltas recurrentes sin avisar previamente'
    },
    {
      id: 'fake-team',
      label: 'Equipo fraudulento',
      description: 'Información falsa o perfiles fake en el equipo'
    },
    {
      id: 'other',
      label: 'Otro motivo',
      description: 'Especifica en la descripción'
    }
  ];

  const selectedTeamData = teams.find(team => team.id === selectedTeam);

  const handleSubmit = () => {
    if (selectedTeam && selectedReason && description.trim()) {
      setIsSubmitted(true);
      
      setTimeout(() => {
        onBack();
      }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#f4b400] to-[#e6a200] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={32} />
            </div>
            <h2 className="text-[#172c44] text-xl mb-2">Reporte Enviado</h2>
            <p className="text-gray-600 text-sm mb-4">
              Tu reporte del equipo ha sido enviado exitosamente. Nuestro equipo de moderación lo revisará.
            </p>
            <p className="text-xs text-gray-500">
              Regresando automáticamente...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#f4b400] to-[#e6a200]">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44]">Reportar Equipo</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Owner Badge */}
        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Como dueño de cancha, puedes reportar equipos que afecten la calidad del servicio 
            y la experiencia de otros usuarios.
          </AlertDescription>
        </Alert>

        {/* Warning Alert */}
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Los reportes falsos pueden resultar en la suspensión de tu cuenta. 
            Usa esta función responsablemente.
          </AlertDescription>
        </Alert>

        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] text-lg">Seleccionar Equipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el equipo a reportar" />
              </SelectTrigger>
              <SelectContent>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-3 py-1">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-[#172c44] text-white text-xs">
                          {team.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-sm text-gray-500">
                          Cap: {team.captain} • {team.members} miembros
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Selected Team Info */}
        {selectedTeamData && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#172c44] text-lg">Equipo a Reportar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-[#172c44] text-white">
                    {selectedTeamData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-[#172c44] text-lg">{selectedTeamData.name}</h3>
                  <p className="text-sm text-gray-600">
                    Capitán: {selectedTeamData.captain}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="text-gray-500" />
                      <span className="text-sm text-gray-600">{selectedTeamData.members} miembros</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Último partido: {selectedTeamData.lastMatch}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Report Reason */}
        {selectedTeam && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#172c44] text-lg">Motivo del Reporte</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
                {reportReasons.map((reason) => (
                  <div key={reason.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={reason.id} className="text-[#172c44] cursor-pointer">
                        {reason.label}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">{reason.description}</p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {selectedReason && (
          <Card>
            <CardHeader>
              <CardTitle className="text-[#172c44] text-lg">Descripción Detallada</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe detalladamente los incidentes. Incluye fechas, partidos específicos y evidencias si las tienes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-2 text-right">
                {description.length}/1000 caracteres
              </p>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        {selectedTeam && selectedReason && (
          <Button
            onClick={handleSubmit}
            disabled={!description.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
          >
            Enviar Reporte del Equipo
          </Button>
        )}

        {/* Process Information */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="text-blue-800 mb-2">Proceso de Revisión para Equipos</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los reportes de equipos tienen prioridad alta</li>
              <li>• Se revisará el historial completo del equipo</li>
              <li>• Puede resultar en suspensión temporal o permanente</li>
              <li>• Se notificará al capitán del equipo sobre el reporte</li>
              <li>• Recibirás actualizaciones sobre las acciones tomadas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

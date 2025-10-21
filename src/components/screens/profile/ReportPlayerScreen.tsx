import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';

interface ReportPlayerScreenProps {
  playerData: {
    player: any;
    match: any;
  };
  onBack: () => void;
}

export function ReportPlayerScreen({ playerData, onBack }: ReportPlayerScreenProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { player, match } = playerData;

  const reportReasons = [
    {
      id: 'unsportsmanlike',
      label: 'Comportamiento antideportivo',
      description: 'Faltas, agresiones verbales o físicas'
    },
    {
      id: 'cheating',
      label: 'Trampa o juego desleal',
      description: 'Simulaciones, manos, etc.'
    },
    {
      id: 'harassment',
      label: 'Acoso o discriminación',
      description: 'Comentarios ofensivos o discriminatorios'
    },
    {
      id: 'no-show',
      label: 'No se presentó al partido',
      description: 'Faltó sin avisar previamente'
    },
    {
      id: 'other',
      label: 'Otro motivo',
      description: 'Especifica en la descripción'
    }
  ];

  const handleSubmit = () => {
    if (selectedReason && description.trim()) {
      // Simulate report submission
      setIsSubmitted(true);
      
      // Auto-return after 3 seconds
      setTimeout(() => {
        onBack();
      }, 3000);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-600" size={32} />
            </div>
            <h2 className="text-[#172c44] text-xl mb-2">Reporte Enviado</h2>
            <p className="text-gray-600 text-sm mb-4">
              Tu reporte ha sido enviado exitosamente. Nuestro equipo revisará el caso.
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
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      {/* Header */}
      <div className="bg-white">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2">
            <ArrowLeft className="text-[#172c44]" size={24} />
          </button>
          <h1 className="text-[#172c44]">Reportar Jugador</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 space-y-6 pb-6">
        {/* Warning Alert */}
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Los reportes falsos pueden resultar en la suspensión de tu cuenta. 
            Usa esta función responsablemente.
          </AlertDescription>
        </Alert>

        {/* Player Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] text-lg">Jugador a Reportar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-[#172c44] text-white">
                  {player.avatar}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[#172c44]">{player.name}</p>
                <p className="text-sm text-gray-600">{player.position}</p>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-1">
                <strong>Partido:</strong> {match.location}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Fecha:</strong> {match.date} • {match.time}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Report Reason */}
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

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] text-lg">Descripción Detallada</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe detalladamente lo ocurrido. Incluye el momento del partido y las circunstancias..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-32 resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-2 text-right">
              {description.length}/500 caracteres
            </p>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!selectedReason || !description.trim()}
          className="w-full bg-red-600 hover:bg-red-700 text-white h-12"
        >
          Enviar Reporte
        </Button>

        {/* Code of Conduct */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="text-blue-800 mb-2">Proceso de Revisión</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Nuestro equipo revisará tu reporte en 24-48 horas</li>
              <li>• Se contactará a ambas partes si es necesario</li>
              <li>• Las sanciones pueden incluir advertencias o suspensiones</li>
              <li>• Recibirás una notificación con el resultado</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

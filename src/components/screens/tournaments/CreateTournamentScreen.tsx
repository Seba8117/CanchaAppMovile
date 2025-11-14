import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Calendar, Users, MapPin, DollarSign, Clock, Info, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs, DocumentData } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

interface Court extends DocumentData {
  id: string;
  name: string;
}

interface CreateTournamentScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
}

export function CreateTournamentScreen({ onBack, onNavigate }: CreateTournamentScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    format: '',
    maxTeams: '',
    entryFee: '',
    prizePools: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    description: '',
    rules: '',
    courts: [] as string[], // Guardaremos los IDs de las canchas
    requirements: [] as string[]
  });

  const [availableCourts, setAvailableCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwnerCourts = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Debes iniciar sesión para ver tus canchas.");
        return;
      }
      try {
        const q = query(collection(db, "cancha"), where("ownerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        const courtsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          ...doc.data()
        })) as Court[];
        setAvailableCourts(courtsData);
      } catch (err) {
        console.error("Error fetching courts:", err);
        setError("No se pudieron cargar tus canchas.");
      }
    };
    fetchOwnerCourts();
  }, []);

  const sportOptions = [
    { value: 'futbol', label: 'Fútbol ⚽' },
    { value: 'basquet', label: 'Básquetball 🏀' },
    { value: 'tenis', label: 'Tenis 🎾' },
    { value: 'padel', label: 'Pádel 🏓' },
    { value: 'volley', label: 'Vóleibol 🏐' },
    { value: 'futsal', label: 'Futsal ⚽' }
  ];

  const formatOptions = [
    { value: 'eliminacion-simple', label: 'Eliminación Simple' },
    { value: 'eliminacion-doble', label: 'Eliminación Doble' },
    { value: 'round-robin', label: 'Todos contra Todos' },
    { value: 'grupos-eliminacion', label: 'Grupos + Eliminación' },
    { value: 'suizo', label: 'Sistema Suizo' }
  ];
  
  const availableRequirements = [
    'Jugadores federados', 'Seguro deportivo', 'Certificado médico', 
    'Mínimo de edad 18 años', 'Máximo de edad 35 años', 'Experiencia previa'
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: 'courts' | 'requirements', item: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...prev[field], item]
        : prev[field].filter(i => i !== item)
    }));
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    if (!formData.name || !formData.sport || !formData.format || !formData.maxTeams || !formData.startDate) {
      setError('Por favor completa los campos obligatorios (*)');
      setLoading(false);
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Debes iniciar sesión para crear un torneo.');
      setLoading(false);
      return;
    }
    
    try {
      const tournamentData = {
        ...formData,
        maxTeams: Number(formData.maxTeams),
        entryFee: Number(formData.entryFee) || 0,
        ownerId: currentUser.uid,
        status: 'registration',
        registeredTeams: 0,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'torneo'), tournamentData);
      console.log('Torneo creado con ID: ', docRef.id);
      
      alert('¡Torneo creado exitosamente!');
      onNavigate('tournament-management', { id: docRef.id, ...tournamentData });

    } catch (err) {
      console.error("Error al crear el torneo: ", err);
      setError("No se pudo crear el torneo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#f4b400] to-[#e6a200]">
      <AppHeader 
        title="Crear Torneo" 
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack} disabled={loading}>
            <ArrowLeft size={20} />
          </Button>
        }
      />

      <div className="p-4 pb-20 space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <Trophy size={20} />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="tournament-name" className="text-[#172c44]">Nombre del Torneo *</Label>
              <Input
                id="tournament-name"
                placeholder="Ej: Copa Primavera 2024, Torneo Relámpago..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#172c44]">Deporte *</Label>
                <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona deporte" /></SelectTrigger>
                  <SelectContent>{sportOptions.map((sport) => (<SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#172c44]">Formato *</Label>
                <Select value={formData.format} onValueChange={(value) => handleInputChange('format', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecciona formato" /></SelectTrigger>
                  <SelectContent>{formatOptions.map((format) => (<SelectItem key={format.value} value={format.value}>{format.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-teams" className="text-[#172c44]">Máximo de Equipos *</Label>
                <Input id="max-teams" type="number" placeholder="16" value={formData.maxTeams} onChange={(e) => handleInputChange('maxTeams', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="entry-fee" className="text-[#172c44]">Cuota de Inscripción</Label>
                <Input id="entry-fee" type="number" placeholder="50000" value={formData.entryFee} onChange={(e) => handleInputChange('entryFee', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="prize-pools" className="text-[#172c44]">Premios</Label>
              <Input id="prize-pools" placeholder="1° $500.000, 2° $300.000, 3° $150.000" value={formData.prizePools} onChange={(e) => handleInputChange('prizePools', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="description" className="text-[#172c44]">Descripción</Label>
              <Textarea id="description" placeholder="Describe el torneo, objetivos, nivel requerido..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3}/>
            </div>
          </CardContent>
        </Card>

        {/* Fechas y Horarios */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <Calendar size={20} />
              Fechas y Horarios
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="start-date" className="text-[#172c44]">Fecha de Inicio *</Label>
              <Input id="start-date" type="datetime-local" value={formData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-[#172c44]">Fecha de Fin</Label>
              <Input id="end-date" type="datetime-local" value={formData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} />
            </div>
            <div>
              <Label htmlFor="registration-deadline" className="text-[#172c44]">Fecha Límite de Inscripción</Label>
              <Input id="registration-deadline" type="datetime-local" value={formData.registrationDeadline} onChange={(e) => handleInputChange('registrationDeadline', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Canchas Disponibles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <MapPin size={20} />
              Canchas a Utilizar
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableCourts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {availableCourts.map((court) => (
                  <div key={court.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={court.id}
                      checked={formData.courts.includes(court.id)}
                      onCheckedChange={(checked) => handleArrayChange('courts', court.id, checked as boolean)}
                    />
                    <Label htmlFor={court.id} className="text-sm text-[#172c44]">{court.name}</Label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No tienes canchas registradas. <a onClick={() => onNavigate('add-court')} className="text-blue-600 underline cursor-pointer">Agrega una cancha</a> primero.</p>
            )}
            {formData.courts.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Canchas seleccionadas:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.courts.map((courtId) => {
                    const courtName = availableCourts.find(c => c.id === courtId)?.name || courtId;
                    return <Badge key={courtId} className="bg-[#f4b400] text-[#172c44]">{courtName}</Badge>
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requisitos y Reglas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <Info size={20} />
              Requisitos y Reglas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-[#172c44] mb-3 block">Requisitos para Participar</Label>
              <div className="grid grid-cols-1 gap-3">
                {availableRequirements.map((requirement) => (
                  <div key={requirement} className="flex items-center space-x-2">
                    <Checkbox id={requirement} checked={formData.requirements.includes(requirement)} onCheckedChange={(checked) => handleArrayChange('requirements', requirement, checked as boolean)} />
                    <Label htmlFor={requirement} className="text-sm text-[#172c44]">{requirement}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="rules" className="text-[#172c44]">Reglas Específicas</Label>
              <Textarea id="rules" placeholder="Especifica reglas particulares del torneo..." value={formData.rules} onChange={(e) => handleInputChange('rules', e.target.value)} rows={4} />
            </div>
          </CardContent>
        </Card>

        {error && (<p className="text-center text-red-800 font-semibold bg-red-100 p-3 rounded-md">{error}</p>)}

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack} disabled={loading}>Cancelar</Button>
          <Button className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white" onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 size={16} className="mr-2 animate-spin"/> Creando...</> : <><Trophy size={16} className="mr-2" />Crear Torneo</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
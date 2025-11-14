import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Zap, Save, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';
import { toast } from 'sonner';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, updateDoc, serverTimestamp, DocumentData, deleteDoc } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

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

// Recibimos 'court' con los datos de la cancha seleccionada
interface EditCourtScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
  courtData: DocumentData; 
}

export function EditCourtScreen({ onBack, onNavigate, courtData }: EditCourtScreenProps) {
  
  // Inicializamos el formulario con los datos de courtData
  const [formData, setFormData] = useState({
    name: '',
    sport: '',
    surface: '',
    capacity: '',
    pricePerHour: '',
    description: '',
    amenities: [] as string[],
    isActive: true,
    availability: {
      monday: { start: '08:00', end: '22:00', enabled: true },
      tuesday: { start: '08:00', end: '22:00', enabled: true },
      wednesday: { start: '08:00', end: '22:00', enabled: true },
      thursday: { start: '08:00', end: '22:00', enabled: true },
      friday: { start: '08:00', end: '22:00', enabled: true },
      saturday: { start: '08:00', end: '22:00', enabled: true },
      sunday: { start: '08:00', end: '22:00', enabled: true },
    }
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false); // Para el diálogo de borrado

  // Rellenar el formulario cuando el componente carga
  useEffect(() => {
    if (courtData) {
      setFormData({
        name: courtData.name || '',
        sport: courtData.sport || '',
        surface: courtData.surface || '',
        capacity: courtData.capacity || '',
        pricePerHour: courtData.pricePerHour || '',
        description: courtData.description || '',
        amenities: courtData.amenities || [],
        isActive: courtData.isActive !== undefined ? !!courtData.isActive : true,
        availability: courtData.availability || formData.availability // Usa el default si no existe
      });
    }
  }, [courtData]);

  const availableAmenities = [
    'Vestuarios', 'Duchas', 'Estacionamiento', 'Iluminación LED', 
    'Marcador Electrónico', 'Sonido', 'Aire Acondicionado', 'Cafetería',
    'WiFi', 'Cámaras de Seguridad', 'Primeros Auxilios'
  ];

  const sportOptions = [
    { value: 'futbol', label: 'Fútbol ⚽' },
    { value: 'basquet', label: 'Básquetball 🏀' },
    { value: 'tenis', label: 'Tenis 🎾' },
    { value: 'padel', label: 'Pádel 🏓' },
    { value: 'volley', label: 'Vóleibol 🏐' },
    { value: 'futsal', label: 'Futsal ⚽' }
  ];

  const surfaceOptions = [
    { value: 'cesped-natural', label: 'Césped Natural' },
    { value: 'cesped-sintetico', label: 'Césped Sintético' },
    { value: 'concreto', label: 'Concreto' },
    { value: 'madera', label: 'Madera' },
    { value: 'arcilla', label: 'Arcilla' },
    { value: 'asfalto', label: 'Asfalto' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      amenities: checked 
        ? [...prev.amenities, amenity]
        : prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleAvailabilityChange = (day: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: {
          ...prev.availability[day as keyof typeof prev.availability],
          [field]: value
        }
      }
    }));
  };

  // --- LÓGICA DE GUARDAR (ACTUALIZAR) ---
  const handleSave = async () => {
    setError(null);
    setSaving(true);

    if (!formData.name || !formData.sport || !formData.pricePerHour) {
      setError('Por favor completa los campos obligatorios (*)');
      setSaving(false);
      return;
    }

    const currentUser = auth.currentUser;
    // Verificación de seguridad: ¿Es este usuario el dueño de esta cancha?
    if (!currentUser || currentUser.uid !== courtData.ownerId) {
      setError('No tienes permiso para editar esta cancha.');
      setSaving(false);
      return;
    }

    try {
      // 1. Referencia al documento existente usando el ID de courtData
      const courtRef = doc(db, 'courts', courtData.id);

      // 2. Preparar los datos actualizados
      const dataToUpdate = {
        ...formData,
        pricePerHour: Number(formData.pricePerHour),
        capacity: Number(formData.capacity) || 0, // Asegurarse de que la capacidad sea un número
        updatedAt: serverTimestamp() // Añadir fecha de actualización
      };

      // 3. Usar updateDoc para actualizar el documento
      await updateDoc(courtRef, dataToUpdate);
      
      toast.success('¡Cancha actualizada exitosamente!');
      onBack(); // Regresar a la lista de canchas

    } catch (err) {
      console.error("Error al actualizar la cancha: ", err);
      toast.error('Error al guardar', { description: 'No se pudieron guardar los cambios.' });
      setError("No se pudo guardar la cancha. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  // --- LÓGICA DE ELIMINAR (BONUS) ---
  const handleConfirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "courts", courtData.id)); 
      toast.success('Cancha eliminada', {
        description: `La cancha "${formData.name}" ha sido eliminada permanentemente.`,
      });
      onBack(); // Regresar (la pantalla anterior se actualizará sola)
    } catch (err) {
      console.error("Error al eliminar la cancha: ", err);
      setError("No se pudo eliminar la cancha.");
    } finally {
      setIsAlertOpen(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#f4b400] to-[#e6a200]">
      <AppHeader 
        title="Editar Cancha" // Título cambiado
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack} disabled={saving}>
            <ArrowLeft size={20} />
          </Button>
        }
        rightContent={
           <Button 
            size="sm" 
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => setIsAlertOpen(true)}
            disabled={saving}
          >
            <Trash2 size={16} />
          </Button>
        }
      />

      <div className="p-4 pb-20 space-y-6">
        {/* --- FORMULARIO (IDÉNTICO A AGREGAR CANCHA) --- */}
        {/* Los campos se rellenarán automáticamente por el estado 'formData' */}

        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <MapPin size={20} />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox id="isActive" checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))} />
              <Label htmlFor="isActive" className="text-[#172c44]">Cancha activa</Label>
            </div>
            <div>
              <Label htmlFor="name" className="text-[#172c44]">Nombre de la Cancha *</Label>
              <Input
                id="name"
                placeholder="Ej: Cancha Principal, Cancha Norte..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div>
              <Label className="text-[#172c44]">Deporte *</Label>
              <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona el deporte" /></SelectTrigger>
                <SelectContent>{sportOptions.map((sport) => (<SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#172c44]">Superficie</Label>
              <Select value={formData.surface} onValueChange={(value) => handleInputChange('surface', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona la superficie" /></SelectTrigger>
                <SelectContent>{surfaceOptions.map((surface) => (<SelectItem key={surface.value} value={surface.value}>{surface.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity" className="text-[#172c44]">Capacidad</Label>
                <Input id="capacity" type="number" placeholder="Ej: 22" value={formData.capacity} onChange={(e) => handleInputChange('capacity', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="price" className="text-[#172c44]">Precio por Hora *</Label>
                <Input id="price" type="number" placeholder="25000" value={formData.pricePerHour} onChange={(e) => handleInputChange('pricePerHour', e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-[#172c44]">Descripción</Label>
              <Textarea id="description" placeholder="Describe tu cancha..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3}/>
            </div>
          </CardContent>
        </Card>

        {/* Servicios y Amenidades */}
        <Card>
          <CardHeader><CardTitle className="text-[#172c44] flex items-center gap-2"><Zap size={20} />Servicios y Amenidades</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {availableAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                  />
                  <Label htmlFor={amenity} className="text-sm text-[#172c44]">{amenity}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Horarios de Disponibilidad */}
        <Card>
          <CardHeader><CardTitle className="text-[#172c44] flex items-center gap-2"><Clock size={20} />Horarios de Disponibilidad</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {daysOfWeek.map((day) => (
              <div key={day.key} className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <Checkbox
                    id={day.key}
                    checked={formData.availability[day.key as keyof typeof formData.availability].enabled}
                    onCheckedChange={(checked) => handleAvailabilityChange(day.key, 'enabled', checked as boolean)}
                  />
                  <Label htmlFor={day.key} className="text-sm text-[#172c44] min-w-0 flex-1">{day.label}</Label>
                </div>
                {formData.availability[day.key as keyof typeof formData.availability].enabled && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={formData.availability[day.key as keyof typeof formData.availability].start}
                      onChange={(e) => handleAvailabilityChange(day.key, 'start', e.target.value)}
                      className="w-20 text-xs"
                    />
                    <span className="text-gray-500">-</span>
                    <Input
                      type="time"
                      value={formData.availability[day.key as keyof typeof formData.availability].end}
                      onChange={(e) => handleAvailabilityChange(day.key, 'end', e.target.value)}
                      className="w-20 text-xs"
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mensaje de Error */}
        {error && (
            <p className="text-center text-red-800 font-semibold bg-red-100 p-3 rounded-md">{error}</p>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onBack} disabled={saving}>
            Cancelar
          </Button>
          <Button className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Diálogo de Confirmación para Eliminar */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta cancha?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la cancha "<span className="font-bold">{formData.name}</span>". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
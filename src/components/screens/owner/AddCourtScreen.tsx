import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, Clock, Zap, Camera, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';

import { compressImage } from '../../../utils/imageUtils';
// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig'; // Asegúrate de que esta ruta sea correcta
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // DESHABILITADO POR PROBLEMAS DE CUENTA
// --- FIN: Importaciones de Firebase ---

interface AddCourtScreenProps {
  onBack: () => void;
  onNavigate: (screen: string) => void;
}

export function AddCourtScreen({ onBack, onNavigate }: AddCourtScreenProps) {
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerLocation, setOwnerLocation] = useState<any>(null);
  const [ownerAddress, setOwnerAddress] = useState('');
  
  // Estados para la imagen
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    const fetchOwner = async () => {
      if (!auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, 'dueno', auth.currentUser.uid));
        if (snap.exists()) {
          const d = snap.data();
          if (d.location) setOwnerLocation(d.location);
          if (d.address) setOwnerAddress(d.address);
        }
      } catch {}
    };
    fetchOwner();
  }, []);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    // 1. Validación de campos obligatorios
    if (!formData.name || !formData.sport || !formData.pricePerHour) {
      setError('Por favor completa los campos obligatorios (*)');
      setLoading(false);
      return;
    }

    // 2. Obtener el usuario actual (el dueño de la cancha)
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Debes iniciar sesión como dueño para agregar una cancha.');
      setLoading(false);
      return;
    }

    try {
      let imageUrl = '';

      // Subir imagen si existe (USANDO BASE64 COMO FALLBACK)
      if (imageFile) {
        // Opción A: Intentar Storage normal (comentado por error de cuota)
        /*
        const fileExtension = imageFile.name.split('.').pop();
        const fileName = `courts/${currentUser.uid}/${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
        */

        // Opción B: Base64 en Firestore (Solución Temporal)
        try {
          // Comprimimos drásticamente para no exceder 1MB de documento
          imageUrl = await compressImage(imageFile, 600, 0.5); 
        } catch (e) {
          console.error("Error comprimiendo imagen", e);
          // Si falla, seguimos sin imagen
        }
      }

      // 3. Preparar el objeto de datos que se guardará en Firebase
      const orderedAvailability = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].reduce((acc: any, key) => {
        const v = (formData.availability as any)[key] || { enabled: false };
        acc[key] = v;
        return acc;
      }, {} as any);
      
      const courtData = {
        ...formData,
        availability: orderedAvailability,
        pricePerHour: Number(formData.pricePerHour), // Convertir a tipo número
        capacity: Number(formData.capacity) || 0, // Convertir a número o establecer 0 si está vacío
        ownerId: currentUser.uid, // ¡Asocia la cancha al dueño!
        location: ownerLocation ? { ...ownerLocation, address: ownerAddress } : { address: ownerAddress },
        imageUrl: imageUrl, // Guardar URL de la imagen principal
        images: imageUrl ? [imageUrl] : [], // Guardar también en array para compatibilidad con galería
        createdAt: serverTimestamp() // Agrega una marca de tiempo de cuándo fue creada
      };

      // 4. Guardar el nuevo documento en la colección 'cancha'
      const docRef = await addDoc(collection(db, 'cancha'), courtData);
      console.log('Cancha creada con ID: ', docRef.id);
      
      toast.success('¡Cancha creada exitosamente!', {
        description: `La cancha "${formData.name}" ya está disponible para ser reservada.`,
      });

      // alert('¡Cancha creada exitosamente!'); // Eliminado para usar toast

      onBack(); // Regresar a la pantalla anterior después de crear

    } catch (err) {
      console.error("Error al crear la cancha: ", err);
      setError("No se pudo crear la cancha. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#f4b400] to-[#e6a200]">
      <AppHeader 
        title="Agregar Cancha" 
        leftContent={
          <Button variant="ghost" size="icon" onClick={onBack} disabled={loading}>
            <ArrowLeft size={20} />
          </Button>
        }
      />

      <div className="p-4 pb-20 space-y-6">
        
        {/* Foto de la Cancha */}
        <Card>
            <CardHeader>
                <CardTitle className="text-[#172c44] flex items-center gap-2">
                    <Camera size={20} />
                    Foto de la Cancha
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {imagePreview ? (
                        <>
                            <img src={imagePreview} alt="Vista previa" className="w-full h-full object-cover" />
                            <button 
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </>
                    ) : (
                        <label className="cursor-pointer flex flex-col items-center gap-2 w-full h-full justify-center hover:bg-gray-50 transition-colors">
                            <ImageIcon size={48} className="text-gray-400" />
                            <span className="text-gray-500 font-medium">Toca para subir una foto</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                        </label>
                    )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                    Sube una foto clara de tu cancha para atraer más jugadores. Formatos: JPG, PNG.
                </p>
            </CardContent>
        </Card>

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
              <div className="flex items-center gap-2">
                {/* Icono dinámico del deporte seleccionado */}
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/60">
                  {(function(){
                    const s = (formData.sport || '').toLowerCase();
                    if (s.includes('fut')) return (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="#FFF" stroke="#172c44" strokeWidth="1.5" />
                        <path d="M12 2l3 4-3 3-3-3 3-4z" fill="#172c44" />
                        <path d="M5 14l3-2 2 3-3 2-2-3z" fill="#172c44" />
                        <path d="M16 12l3 2-2 3-3-2 2-3z" fill="#172c44" />
                      </svg>
                    );
                    if (s.includes('bás') || s.includes('basq')) return (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="#ff8f00" stroke="#6d4c41" strokeWidth="1.5" />
                        <path d="M4 12h16M12 4v16M6 6l12 12M6 18L18 6" stroke="#6d4c41" strokeWidth="1.2" fill="none" />
                      </svg>
                    );
                    if (s.includes('ten')) return (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="#8bc34a" stroke="#33691e" strokeWidth="1.5" />
                        <path d="M6 8c2.5 2 6.5 2 9 0M6 16c2.5-2 6.5-2 9 0" stroke="#33691e" strokeWidth="1.2" fill="none" />
                      </svg>
                    );
                    if (s.includes('pádel') || s.includes('padel') || s.includes('pade')) return (
                      <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                        <circle cx="9" cy="10" r="6" fill="#cddc39" stroke="#827717" strokeWidth="1.5" />
                        <rect x="14" y="12" width="6" height="2" rx="1" fill="#827717" />
                      </svg>
                    );
                    if (s.includes('vól') || s.includes('vole') || s.includes('vol')) return (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="#eceff1" stroke="#37474f" strokeWidth="1.5" />
                        <path d="M4 12c6-5 10-5 16 0M6 6c4 4 8 4 12 0M6 18c4-4 8-4 12 0" stroke="#37474f" strokeWidth="1.2" fill="none" />
                      </svg>
                    );
                    return (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
                        <circle cx="12" cy="12" r="10" fill="#e0e0e0" stroke="#616161" strokeWidth="1.5" />
                      </svg>
                    );
                  })()}
                </span>
                <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)} className="flex-1">
                  <SelectTrigger><SelectValue placeholder="Selecciona el deporte" /></SelectTrigger>
                  <SelectContent>
                    {sportOptions.map((sport) => (
                      <SelectItem key={sport.value} value={sport.value}>
                        <span className="inline-flex items-center gap-2">
                          {(function(){
                            const s = sport.value.toLowerCase();
                            if (s.includes('fut')) return (
                              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                                <circle cx="12" cy="12" r="10" fill="#FFF" stroke="#172c44" strokeWidth="1.5" />
                                <path d="M12 2l3 4-3 3-3-3 3-4z" fill="#172c44" />
                              </svg>
                            );
                            if (s.includes('bás') || s.includes('basq')) return (
                              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                                <circle cx="12" cy="12" r="10" fill="#ff8f00" stroke="#6d4c41" strokeWidth="1.5" />
                              </svg>
                            );
                            if (s.includes('ten')) return (
                              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                                <circle cx="12" cy="12" r="10" fill="#8bc34a" stroke="#33691e" strokeWidth="1.5" />
                              </svg>
                            );
                            if (s.includes('pádel') || s.includes('padel') || s.includes('pade')) return (
                              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                                <circle cx="9" cy="10" r="6" fill="#cddc39" stroke="#827717" strokeWidth="1.5" />
                              </svg>
                            );
                            if (s.includes('vól') || s.includes('vole') || s.includes('vol')) return (
                              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                                <circle cx="12" cy="12" r="10" fill="#eceff1" stroke="#37474f" strokeWidth="1.5" />
                              </svg>
                            );
                            return (
                              <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden>
                                <circle cx="12" cy="12" r="10" fill="#e0e0e0" stroke="#616161" strokeWidth="1.5" />
                              </svg>
                            );
                          })()}
                          {sport.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-[#172c44]">Superficie</Label>
              <Select value={formData.surface} onValueChange={(value) => handleInputChange('surface', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona la superficie" /></SelectTrigger>
                <SelectContent>
                  {surfaceOptions.map((surface) => (
                    <SelectItem key={surface.value} value={surface.value}>{surface.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity" className="text-[#172c44]">Capacidad (jugadores)</Label>
                <Input
                  id="capacity"
                  type="number"
                  placeholder="Ej: 22"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="price" className="text-[#172c44]">Precio por Hora *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="25000"
                  value={formData.pricePerHour}
                  onChange={(e) => handleInputChange('pricePerHour', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-[#172c44]">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe las características especiales de tu cancha..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Servicios y Amenidades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <Zap size={20} />
              Servicios y Amenidades
            </CardTitle>
          </CardHeader>
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
            {formData.amenities.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Servicios seleccionados:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities.map((amenity) => (
                    <Badge key={amenity} className="bg-[#00a884] text-white">{amenity}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Horarios de Disponibilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[#172c44] flex items-center gap-2">
              <Clock size={20} />
              Horarios de Disponibilidad
            </CardTitle>
          </CardHeader>
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
        
        {error && (
            <p className="text-center text-red-800 font-semibold bg-red-100 p-3 rounded-md">{error}</p>
        )}

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onBack}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Crear Cancha'}
          </Button>
        </div>
      </div>
    </div>
  );
}
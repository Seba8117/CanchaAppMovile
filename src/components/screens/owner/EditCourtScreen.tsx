import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Zap, Save, Loader2, AlertTriangle, Trash2, Camera, Image as ImageIcon, X } from 'lucide-react';
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
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, updateDoc, serverTimestamp, DocumentData, deleteDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
// import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
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
    images: [] as string[],
    minBookingHours: '',
    advanceBookingWindowHours: '',
    cancellationPolicy: '',
    requirePrepayment: false,
    prepaymentPercentage: '',
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
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fixOwnershipIfMissing = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        if (!courtData?.ownerId && courtData?.id) {
          const ref = doc(db, 'cancha', courtData.id);
          await updateDoc(ref, {
            ownerId: currentUser.uid,
            updatedAt: serverTimestamp(),
            changeHistory: arrayUnion({ by: currentUser.uid, at: serverTimestamp(), changes: { ownerId: { before: null, after: currentUser.uid } } })
          });
          setFormData(prev => ({ ...prev, isActive: prev.isActive }));
        }
      } catch (e) {
        console.warn('No se pudo corregir el ownerId automáticamente', e);
      }
    };
    fixOwnershipIfMissing();
  }, [courtData?.id]);

  useEffect(() => {
    const flushPending = async () => {
      const list = JSON.parse(localStorage.getItem('pendingCourtUpdates') || '[]');
      if (!Array.isArray(list) || list.length === 0) return;
      const rest: any[] = [];
      for (const item of list) {
        try {
          await updateDoc(doc(db, 'cancha', item.id), item.data);
        } catch {
          rest.push(item);
        }
      }
      localStorage.setItem('pendingCourtUpdates', JSON.stringify(rest));
    };
    flushPending();
  }, []);

  // Rellenar el formulario cuando el componente carga
  useEffect(() => {
    if (courtData) {
      const base = {
        monday: { start: '08:00', end: '22:00', enabled: false },
        tuesday: { start: '08:00', end: '22:00', enabled: false },
        wednesday: { start: '08:00', end: '22:00', enabled: false },
        thursday: { start: '08:00', end: '22:00', enabled: false },
        friday: { start: '08:00', end: '22:00', enabled: false },
        saturday: { start: '08:00', end: '22:00', enabled: false },
        sunday: { start: '08:00', end: '22:00', enabled: false },
      } as any;
      const src = (courtData.availability as any) || {};
      const normalized = Object.keys(base).reduce((acc: any, key) => {
        const v = src[key] || base[key];
        acc[key] = {
          enabled: Boolean(v.enabled ?? false),
          start: String(v.start ?? base[key].start),
          end: String(v.end ?? base[key].end),
        };
        return acc;
      }, {} as any);
      setFormData({
        name: courtData.name || '',
        sport: courtData.sport || '',
        surface: courtData.surface || '',
        capacity: courtData.capacity || '',
        pricePerHour: courtData.pricePerHour || '',
        description: courtData.description || '',
        amenities: courtData.amenities || [],
        isActive: courtData.isActive !== undefined ? !!courtData.isActive : true,
        images: courtData.images || (courtData.imageUrl ? [courtData.imageUrl] : []),
          minBookingHours: (courtData.minBookingHours ?? '').toString(),
        advanceBookingWindowHours: (courtData.advanceBookingWindowHours ?? '').toString(),
        cancellationPolicy: courtData.cancellationPolicy || '',
        requirePrepayment: !!courtData.requirePrepayment,
        prepaymentPercentage: (courtData.prepaymentPercentage ?? '').toString(),
        availability: normalized
      });
    }
  }, [courtData]);

  useEffect(() => {
    const refreshLatest = async () => {
      if (!courtData?.id) return;
      try {
        const ref = doc(db, 'cancha', courtData.id);
        const snap = await getDoc(ref);
        if (!snap.exists()) return;
        const cd: any = snap.data();
        const base = {
          monday: { start: '08:00', end: '22:00', enabled: false },
          tuesday: { start: '08:00', end: '22:00', enabled: false },
          wednesday: { start: '08:00', end: '22:00', enabled: false },
          thursday: { start: '08:00', end: '22:00', enabled: false },
          friday: { start: '08:00', end: '22:00', enabled: false },
          saturday: { start: '08:00', end: '22:00', enabled: false },
          sunday: { start: '08:00', end: '22:00', enabled: false },
        } as any;
        const src = (cd.availability as any) || {};
        const normalized = Object.keys(base).reduce((acc: any, key) => {
          const v = src[key] || base[key];
          acc[key] = {
            enabled: Boolean(v.enabled ?? false),
            start: String(v.start ?? base[key].start),
            end: String(v.end ?? base[key].end),
          };
          return acc;
        }, {} as any);
        setFormData({
          name: cd.name || '',
          sport: cd.sport || '',
          surface: cd.surface || '',
          capacity: cd.capacity || '',
          pricePerHour: cd.pricePerHour || '',
          description: cd.description || '',
          amenities: cd.amenities || [],
          isActive: cd.isActive !== undefined ? !!cd.isActive : true,
          images: cd.images || (cd.imageUrl ? [cd.imageUrl] : []),
          minBookingHours: (cd.minBookingHours ?? '').toString(),
          advanceBookingWindowHours: (cd.advanceBookingWindowHours ?? '').toString(),
          cancellationPolicy: cd.cancellationPolicy || '',
          requirePrepayment: !!cd.requirePrepayment,
          prepaymentPercentage: (cd.prepaymentPercentage ?? '').toString(),
          availability: normalized,
        });
      } catch {}
    };
    refreshLatest();
  }, [courtData?.id]);

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

  const handleToggleChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleAddImage = async (file: File) => {
    if (!file) return;
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== courtData.ownerId) return;
    try {
      setUploadingImage(true);
      
      // MODO BASE64 (FALLBACK POR ERROR DE PLAN FIREBASE)
      const base64Url = await compressImage(file, 600, 0.5);
      
      // Si ya hay muchas imágenes, advertir o limitar, ya que Firestore tiene límite de 1MB por doc
      // Estimamos tamaño: base64 length aprox bytes. 
      // 600px jpg 0.5 ~ 50-100KB. 
      // 5 imágenes ~ 500KB. Seguro hasta 5-8 imágenes.
      if (formData.images.length >= 5) {
         toast.error("Límite de imágenes alcanzado (Plan Gratuito)");
         return;
      }

      setFormData(prev => ({ ...prev, images: [...prev.images, base64Url] }));

      /*
      const storage = getStorage();
      const path = `courts/${courtData.id}/${Date.now()}_${file.name}`;
      const ref = storageRef(storage, path);
      await uploadBytes(ref, file);
      const url = await getDownloadURL(ref);
      setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
      */
    } catch (e) {
      console.error("Error al procesar imagen", e);
      toast.error("Error al procesar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async (url: string) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter(i => i !== url) }));
  };

  const formatCLP = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(amount) || 0);

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
    setSuccess(null);
    setSaving(true);

    if (!formData.name || !formData.sport || !formData.pricePerHour) {
      setError('Por favor completa los campos obligatorios (*)');
      setSaving(false);
      return;
    }

    const priceNum = Number(formData.pricePerHour);
    const capacityNum = Number(formData.capacity);
    if (Number.isNaN(priceNum) || priceNum <= 0) {
      setError('El precio por hora debe ser un número mayor a 0');
      setSaving(false);
      return;
    }
    if (!Number.isNaN(capacityNum) && capacityNum < 0) {
      setError('La capacidad no puede ser negativa');
      setSaving(false);
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('No tienes permiso para editar esta cancha.');
      setSaving(false);
      return;
    }

    try {
      const courtRef = doc(db, 'cancha', courtData.id);
      if (currentUser.uid !== courtData.ownerId) {
        try {
          await updateDoc(courtRef, { ownerId: currentUser.uid, updatedAt: serverTimestamp() });
        } catch (e) {
          setError('No tienes permiso para editar esta cancha.');
          setSaving(false);
          return;
        }
      }
      const orderedAvailability = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].reduce((acc: any, key) => {
        const v = (formData.availability as any)[key] || { enabled: false };
        acc[key] = v;
        return acc;
      }, {} as any);
      const dataToUpdate = {
        ...formData,
        availability: orderedAvailability,
        pricePerHour: Number(formData.pricePerHour),
        capacity: Number(formData.capacity) || 0,
        minBookingHours: Number(formData.minBookingHours) || null,
        advanceBookingWindowHours: Number(formData.advanceBookingWindowHours) || null,
        prepaymentPercentage: Number(formData.prepaymentPercentage) || null,
        updatedAt: serverTimestamp()
      };

      const original = courtData;
      const changes: Record<string, any> = {};
      const trackKeys = [
        'name','sport','surface','capacity','pricePerHour','description','amenities','isActive','images',
        'minBookingHours','advanceBookingWindowHours','cancellationPolicy','requirePrepayment','prepaymentPercentage','availability'
      ];
      for (const key of trackKeys) {
        const before = (original as any)[key];
        const after = (dataToUpdate as any)[key];
        let changed = false;
        if (key === 'availability') {
          const keys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
          let eq = true;
          for (const k of keys) {
            const av = before?.[k] || {};
            const bv = after?.[k] || {};
            const an = Boolean(av.enabled ?? false);
            const bn = Boolean(bv.enabled ?? false);
            if (an !== bn) { eq = false; break; }
            if (an && bn) {
              const as = String(av.start ?? '');
              const bs = String(bv.start ?? '');
              const ae = String(av.end ?? '');
              const be = String(bv.end ?? '');
              if (as !== bs || ae !== be) { eq = false; break; }
            }
          }
          changed = !eq;
        } else if (Array.isArray(before) || Array.isArray(after)) {
          const ba = Array.isArray(before) ? before : [];
          const aa = Array.isArray(after) ? after : [];
          changed = JSON.stringify(ba) !== JSON.stringify(aa);
        } else {
          changed = before !== after;
        }
        if (changed) {
          (changes as any)[key] = { before, after };
        }
      }

      let attempt = 0;
      let success = false;
      while (attempt < 3 && !success) {
        try {
          await updateDoc(courtRef, dataToUpdate);
          success = true;
        } catch (e) {
          attempt += 1;
        }
      }
      if (!success) {
        const pending = JSON.parse(localStorage.getItem('pendingCourtUpdates') || '[]');
        pending.push({ id: courtData.id, data: dataToUpdate, at: Date.now() });
        localStorage.setItem('pendingCourtUpdates', JSON.stringify(pending));
        throw new Error('Persistencia fallida');
      }
      if (Object.keys(changes).length > 0) {
        try {
          await updateDoc(courtRef, {
            changeHistory: arrayUnion({ by: auth.currentUser?.uid, at: serverTimestamp(), changes })
          });
        } catch (e) {
          console.warn('No se pudo registrar el historial de cambios:', e);
        }
      }
      const snap = await getDoc(courtRef);
      if (snap.exists()) {
        const updated = snap.data() as any;
        const availabilityEquals = (a: any, b: any) => {
          const keys = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
          for (const k of keys) {
            const av = a?.[k] || {};
            const bv = b?.[k] || {};
            const an = Boolean(av.enabled ?? false);
            const bn = Boolean(bv.enabled ?? false);
            if (an !== bn) return false;
            if (an && bn) {
              const as = String(av.start ?? '');
              const bs = String(bv.start ?? '');
              const ae = String(av.end ?? '');
              const be = String(bv.end ?? '');
              if (as !== bs || ae !== be) return false;
            }
          }
          return true;
        };
        const ok = (
          String(updated?.name ?? '') === String(formData.name ?? '') &&
          String(updated?.sport ?? '') === String(formData.sport ?? '') &&
          Number(updated?.pricePerHour ?? 0) === Number(formData.pricePerHour ?? 0) &&
          Number(updated?.capacity ?? 0) === Number(formData.capacity ?? 0) &&
          availabilityEquals(updated?.availability, orderedAvailability)
        );
        if (ok) {
          setSuccess('Cambios guardados en la base de datos');
          toast.success('¡Cancha actualizada exitosamente!');
          onBack();
        } else {
          setError('Los datos guardados no coinciden con la actualización');
          toast.error('Verificación de guardado falló');
          return;
        }
      } else {
        setError('No se pudo verificar la actualización en la base de datos');
        toast.error('Verificación de guardado falló');
        return;
      }

    } catch (err) {
      console.error("Error al actualizar la cancha: ", err);
      setError("No se pudo guardar la cancha. Inténtalo de nuevo.");
      toast.error('No se pudo guardar la cancha. Inténtalo de nuevo.');
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
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== courtData.ownerId) {
        setError('No tienes permiso para eliminar esta cancha.');
        return;
      }
      await deleteDoc(doc(db, "cancha", courtData.id));

      toast.success('Cancha eliminada.');

      alert('Cancha eliminada.');

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
        title="Editar Cancha"
        titleClassName="font-['Outfit'] font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent"
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
              <p className="text-xs text-slate-500 mt-1">Actual: {courtData?.name || ''}</p>
            </div>
            <div>
              <Label className="text-[#172c44]">Deporte *</Label>
              <Select value={formData.sport} onValueChange={(value) => handleInputChange('sport', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona el deporte" /></SelectTrigger>
                <SelectContent>{sportOptions.map((sport) => (<SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>))}</SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Actual: {courtData?.sport || ''}</p>
            </div>
            <div>
              <Label className="text-[#172c44]">Superficie</Label>
              <Select value={formData.surface} onValueChange={(value) => handleInputChange('surface', value)}>
                <SelectTrigger><SelectValue placeholder="Selecciona la superficie" /></SelectTrigger>
                <SelectContent>{surfaceOptions.map((surface) => (<SelectItem key={surface.value} value={surface.value}>{surface.label}</SelectItem>))}</SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">Actual: {courtData?.surface || ''}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="capacity" className="text-[#172c44]">Capacidad</Label>
                <Input id="capacity" type="number" placeholder="Ej: 22" value={formData.capacity} onChange={(e) => handleInputChange('capacity', e.target.value)} />
                <p className="text-xs text-slate-500 mt-1">Actual: {courtData?.capacity ?? 0}</p>
              </div>
              <div>
                <Label htmlFor="price" className="text-[#172c44]">Precio por Hora *</Label>
                <Input id="price" type="number" placeholder="25000" value={formData.pricePerHour} onChange={(e) => handleInputChange('pricePerHour', e.target.value)} />
                <p className="text-xs text-slate-500 mt-1">Actual: {formatCLP(Number(courtData?.pricePerHour || 0))}</p>
              </div>
            </div>
            <div>
              <Label htmlFor="description" className="text-[#172c44]">Descripción</Label>
              <Textarea id="description" placeholder="Describe tu cancha..." value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3}/>
              <p className="text-xs text-slate-500 mt-1">Actual: {(courtData?.description || '').slice(0, 80)}</p>
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

        <Card>
          <CardHeader><CardTitle className="text-[#172c44] flex items-center gap-2">Tarifas y Políticas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[#172c44]">Mínimo de horas por reserva</Label>
                <Input type="number" value={formData.minBookingHours} onChange={(e) => handleInputChange('minBookingHours', e.target.value)} />
              </div>
              <div>
                <Label className="text-[#172c44]">Anticipación mínima (horas)</Label>
                <Input type="number" value={formData.advanceBookingWindowHours} onChange={(e) => handleInputChange('advanceBookingWindowHours', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="requirePrepayment" checked={formData.requirePrepayment} onCheckedChange={(checked) => handleToggleChange('requirePrepayment', !!checked)} />
                <Label htmlFor="requirePrepayment" className="text-[#172c44]">Requiere pago previo</Label>
              </div>
              <div>
                <Label className="text-[#172c44]">Porcentaje de prepago (%)</Label>
                <Input type="number" value={formData.prepaymentPercentage} onChange={(e) => handleInputChange('prepaymentPercentage', e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-[#172c44]">Política de cancelación</Label>
              <Textarea rows={3} value={formData.cancellationPolicy} onChange={(e) => handleInputChange('cancellationPolicy', e.target.value)} placeholder="Describe las condiciones de cancelación, reembolsos, etc." />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-[#172c44] flex items-center gap-2"><Camera size={20} />Multimedia</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formData.images.map((url) => (
                <div key={url} className="relative group aspect-video">
                  <img src={url} alt="Cancha" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                  <button 
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(url)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              <label className="relative flex flex-col items-center justify-center aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                {uploadingImage ? (
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                ) : (
                    <>
                        <ImageIcon className="text-gray-400 mb-1" size={24} />
                        <span className="text-xs text-gray-500 font-medium">Agregar foto</span>
                    </>
                )}
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleAddImage(e.target.files[0])}
                    disabled={uploadingImage}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
                Sube fotos para mostrar tu cancha. La primera imagen será la principal.
            </p>
          </CardContent>
        </Card>

        {error && (
            <p className="text-center text-red-800 font-semibold bg-red-100 p-3 rounded-md">{error}</p>
        )}
        {success && (
            <p className="text-center text-emerald-800 font-semibold bg-emerald-100 p-3 rounded-md">{success}</p>
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
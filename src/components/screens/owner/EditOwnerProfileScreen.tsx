import { useState, useEffect } from 'react';
import { Camera, Moon, Sun, Save, User, MapPin, Phone, Mail, Building2, Hash, Clock, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
// Select no se usa en este formulario, pero lo dejo por si acaso
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { AppHeader } from '../../common/AppHeader';
import { toast } from 'sonner'; // Asegúrate de importar sonner

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig'; // Ajusta la ruta si es necesario
import { doc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

interface EditOwnerProfileScreenProps {
  onBack: () => void;
}

export function EditOwnerProfileScreen({ onBack }: EditOwnerProfileScreenProps) {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [profileImage, setProfileImage] = useState<string | null>(null); // Visual por ahora
  const [formData, setFormData] = useState<DocumentData>({
    // Estado inicial vacío, se llenará desde Firebase
    ownerName: '',
    email: '', // Email generalmente no editable
    phone: '', // Teléfono personal del dueño
    businessName: '',
    rut: '', // Campo en Firestore es 'rut'
    address: '', // Campo en Firestore es 'address'
    businessPhone: '', // Teléfono del negocio (puede ser diferente al personal)
    description: '', // Campo en Firestore es 'description'
    website: '',
    foundedYear: '',
    numberOfCourts: '', // Este dato podría calcularse o guardarse, por ahora editable
    openTime: '08:00',
    closeTime: '23:00',
    // Arrays como operatingDays, mainSports, amenities, paymentMethods no están implementados para guardar aún
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FUNCIÓN getInitials ---
  const getInitials = (name: string = '') => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';
  };
  // --- FIN FUNCIÓN ---

  useEffect(() => {
    const fetchOwnerData = async () => {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Usuario no autenticado.");
        setLoading(false);
        return;
      }

      try {
        const ownerDocRef = doc(db, 'dueno', currentUser.uid);
        const ownerDocSnap = await getDoc(ownerDocRef);

        if (ownerDocSnap.exists()) {
          const data = ownerDocSnap.data();
          // Llenamos el formulario con los datos de Firestore, usando '' como fallback
          setFormData({
            ownerName: data.ownerName || '',
            email: data.email || '',
            phone: data.phone || '', // Asumiendo que 'phone' es el personal en 'dueno'
            businessName: data.businessName || '',
            rut: data.rut || '', // Usamos 'rut' del Firestore
            address: data.address || '', // Usamos 'address' del Firestore
            businessPhone: data.businessPhone || data.phone || '', // Intentar businessPhone, si no, usar phone
            description: data.description || '', // Usamos 'description' del Firestore
            website: data.website || '',
            foundedYear: data.foundedYear || '',
            numberOfCourts: data.numberOfCourts || '',
            openTime: data.openTime || '08:00',
            closeTime: data.closeTime || '23:00',
            // Cargar arrays si existen en Firestore (ej: data.amenities || [])
          });
          // Cargar imagen si existe la URL en Firestore
          // setProfileImage(data.logoUrl || null);
        } else {
          throw new Error("No se encontraron los datos del perfil del dueño.");
        }
      } catch (err: any) {
        console.error("Error al cargar datos del dueño:", err);
        setError("No se pudo cargar la información del perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchOwnerData();
  }, []); // Se ejecuta solo una vez

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // const handleArrayChange = ... (necesitarías inputs para manejar arrays)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Lógica de previsualización. Subida real iría en handleSave.
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { setProfileImage(e.target?.result as string); };
      reader.readAsDataURL(file);
      // Guardar 'file' en estado para subirlo después
    }
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Usuario no autenticado.");
      setSaving(false);
      return;
    }

    try {
      const ownerDocRef = doc(db, 'dueno', currentUser.uid);

      // Prepara los datos a actualizar (ajusta según los campos de tu colección 'dueno')
      const dataToUpdate: DocumentData = {
        ownerName: formData.ownerName,
        phone: formData.phone, // Teléfono personal
        businessName: formData.businessName,
        rut: formData.rut,
        address: formData.address,
        businessPhone: formData.businessPhone, // Teléfono del negocio
        description: formData.description,
        website: formData.website,
        foundedYear: formData.foundedYear,
        numberOfCourts: formData.numberOfCourts,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        // Aquí iría la lógica para guardar arrays si los implementas
        // Si subiste una imagen, aquí pondrías la URL de Firebase Storage
        // logoUrl: imageUrl
      };

      await updateDoc(ownerDocRef, dataToUpdate);

      toast.success("Perfil empresarial actualizado", {
        description: "La información de tu negocio ha sido guardada.",
      });
      onBack();

    } catch (err: any) {
      console.error("Error al guardar perfil del dueño:", err);
      setError("No se pudieron guardar los cambios.");
      toast.error("Error al guardar", { description: "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  // --- RENDERIZADO ---

  // **VERIFICACIÓN DE CARGA**
  if (loading) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b] p-4 text-[#172c44]">
         <Loader2 className="animate-spin h-12 w-12 mb-4 text-[#00a884]" />
         <p className="font-semibold text-lg">Cargando perfil...</p>
       </div>
     );
  }

  // **VERIFICACIÓN DE ERROR**
  if (error) {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b] p-4 text-center">
         <AlertTriangle className="h-12 w-12 mb-4 text-red-700" />
         <p className="font-bold text-lg text-red-800">Ocurrió un error</p>
         <p className="text-red-700">{error}</p>
         <Button onClick={onBack} className="mt-4 bg-white/80 text-[#172c44] hover:bg-white">Volver</Button>
       </div>
     );
  }

  // **RENDERIZADO PRINCIPAL (SI NO HAY CARGA NI ERROR)**
  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b]`}>
       <AppHeader
         title="Editar Perfil Empresarial"
         leftContent={
           <Button variant="ghost" size="icon" onClick={onBack} disabled={saving} className="text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700">
             <ArrowLeft size={20} />
           </Button>
         }
         rightContent={
           <Button size="sm" className="bg-[#00a884] hover:bg-[#00a884]/90 text-white" onClick={handleSave} disabled={saving}>
             {saving ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
             {saving ? 'Guardando...' : 'Guardar'}
           </Button>
         }
         className="bg-white dark:bg-gray-800 border-b dark:border-gray-700"
       />

      <div className="p-4 space-y-6 pb-20">
        {/* Logo del Negocio */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
            <CardHeader><CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2"><Camera size={20} />Logo del Negocio</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {profileImage ? (<AvatarImage src={profileImage} alt="Business Logo" />) : (
                    <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-2xl font-bold">
                       {formData.businessName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '...'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute -bottom-2 -right-2 bg-[#00a884] rounded-full p-2 cursor-pointer hover:bg-[#00a884]/90">
                  <Camera size={16} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Sube el logo de tu complejo</p>
            </CardContent>
        </Card>

        {/* Información Personal */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <CardHeader><CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2"><User size={20} />Información Personal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ownerName" className="dark:text-gray-200">Nombre del Propietario</Label>
              <Input id="ownerName" value={formData.ownerName} onChange={(e) => handleInputChange('ownerName', e.target.value)} className="dark:bg-gray-700 dark:text-white"/>
            </div>
            <div>
              <Label htmlFor="email" className="dark:text-gray-200">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input id="email" type="email" value={formData.email} className="pl-10 dark:bg-gray-700 dark:text-white" disabled readOnly />
              </div>
            </div>
            <div>
              <Label htmlFor="phone" className="dark:text-gray-200">Teléfono Personal</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white"/>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Negocio */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <CardHeader><CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2"><Building2 size={20} />Información del Negocio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName" className="dark:text-gray-200">Nombre del Complejo</Label>
              <Input id="businessName" value={formData.businessName} onChange={(e) => handleInputChange('businessName', e.target.value)} className="dark:bg-gray-700 dark:text-white"/>
            </div>
            <div>
              <Label htmlFor="businessRut" className="dark:text-gray-200">RUT de la Empresa</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input id="businessRut" value={formData.rut} onChange={(e) => handleInputChange('rut', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white" placeholder="12.345.678-9"/>
              </div>
            </div>
            <div>
              <Label htmlFor="businessAddress" className="dark:text-gray-200">Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                <Textarea id="businessAddress" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white" rows={2}/>
              </div>
            </div>
            <div>
              <Label htmlFor="businessPhone" className="dark:text-gray-200">Teléfono del Negocio</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input id="businessPhone" value={formData.businessPhone} onChange={(e) => handleInputChange('businessPhone', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white"/>
              </div>
            </div>
            <div>
              <Label htmlFor="website" className="dark:text-gray-200">Sitio Web (opcional)</Label>
              <Input id="website" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} className="dark:bg-gray-700 dark:text-white" placeholder="www.micancha.cl"/>
            </div>
            <div>
              <Label htmlFor="businessDescription" className="dark:text-gray-200">Descripción del Negocio</Label>
              <Textarea id="businessDescription" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="dark:bg-gray-700 dark:text-white" rows={3} placeholder="Describe tu complejo..."/>
            </div>
          </CardContent>
        </Card>

        {/* Detalles del Negocio */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
          <CardHeader><CardTitle className="text-[#172c44] dark:text-white">Detalles del Negocio</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foundedYear" className="dark:text-gray-200">Año Fundación</Label>
                <Input id="foundedYear" type="number" value={formData.foundedYear} onChange={(e) => handleInputChange('foundedYear', e.target.value)} className="dark:bg-gray-700 dark:text-white" min="1900" max={new Date().getFullYear()}/>
              </div>
              <div>
                <Label htmlFor="numberOfCourts" className="dark:text-gray-200">N° de Canchas</Label>
                <Input id="numberOfCourts" type="number" value={formData.numberOfCourts} onChange={(e) => handleInputChange('numberOfCourts', e.target.value)} className="dark:bg-gray-700 dark:text-white" min="1"/>
              </div>
            </div>
            <div>
              <Label className="dark:text-gray-200">Horario Atención</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="openTime" className="text-sm dark:text-gray-300">Apertura</Label>
                  <div className="relative"><Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} /><Input id="openTime" type="time" value={formData.openTime} onChange={(e) => handleInputChange('openTime', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white"/></div>
                </div>
                <div>
                  <Label htmlFor="closeTime" className="text-sm dark:text-gray-300">Cierre</Label>
                  <div className="relative"><Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} /><Input id="closeTime" type="time" value={formData.closeTime} onChange={(e) => handleInputChange('closeTime', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white"/></div>
                </div>
              </div>
            </div>
            {/* Aquí podrías añadir inputs para editar arrays como 'amenities', 'paymentMethods', etc. */}
          </CardContent>
        </Card>

        {/* Configuración de la App */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
           <CardHeader><CardTitle className="text-[#172c44] dark:text-white">Configuración</CardTitle></CardHeader>
           <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 {darkMode ? <Moon size={20} className="dark:text-white" /> : <Sun className="text-[#f4b400]" size={20} />}
                 <div>
                   <Label className="dark:text-gray-200">Modo Oscuro</Label>
                   <p className="text-sm text-gray-600 dark:text-gray-400">Cambia la apariencia</p>
                 </div>
               </div>
               <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} className="data-[state=checked]:bg-[#00a884]"/>
             </div>
           </CardContent>
         </Card>

        {/* Mensaje de error */}
        {error && (<p className="text-center text-red-700 font-semibold">{error}</p>)}

        {/* Botones de Acción */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 bg-white/80 text-[#172c44] hover:bg-white" onClick={onBack} disabled={saving}>Cancelar</Button>
          <Button className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </div>
    </div>
  );
}

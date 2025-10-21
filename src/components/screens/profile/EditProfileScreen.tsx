import { useState, useEffect } from 'react';
import { Camera, Moon, Sun, Save, User, MapPin, Phone, Mail, Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { AppHeader } from '../../common/AppHeader';
import { toast } from 'sonner'; // Asegúrate de importar 'sonner' correctamente

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig'; // Ajusta la ruta si es necesario
import { doc, getDoc, updateDoc, DocumentData } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

interface EditProfileScreenProps {
  onBack: () => void;
}

export function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [profileImage, setProfileImage] = useState<string | null>(null); // Manejo de imagen es visual por ahora
  const [formData, setFormData] = useState<DocumentData>({
    name: '',
    email: '', // El email generalmente no se edita aquí, pero lo cargamos
    phone: '',
    location: '',
    bio: '',
    favoritePosition: '',
    level: '',
    favoriteSport: ''
    // Agrega aquí los campos específicos del dueño si es necesario distinguirlos
  });
  const [userType, setUserType] = useState<'player' | 'owner' | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FUNCIÓN getInitials AÑADIDA AQUÍ ---
  const getInitials = (name: string = '') => {
    // Si 'name' existe, divide por espacios, toma la primera letra de cada parte, une y pone en mayúsculas.
    // Si 'name' no existe o está vacío, devuelve '...'
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '...';
  };
  // --- FIN DE LA FUNCIÓN AÑADIDA ---

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Usuario no autenticado.");
        setLoading(false);
        return;
      }

      try {
        // Intentamos buscar primero en 'jugador'
        let userDocRef = doc(db, 'jugador', currentUser.uid);
        let userDocSnap = await getDoc(userDocRef);
        let type: 'player' | 'owner' = 'player';

        if (!userDocSnap.exists()) {
          // Si no está en 'jugador', buscamos en 'dueno'
          userDocRef = doc(db, 'dueno', currentUser.uid);
          userDocSnap = await getDoc(userDocRef);
          type = 'owner';
        }

        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setFormData({ // Mapeamos los datos de Firestore al estado del formulario
            name: data.name || data.ownerName || '', // Usamos 'name' para jugador, 'ownerName' para dueño
            email: data.email || '',
            phone: data.phone || '',
            location: data.location || data.address || '', // Usamos 'location' para jugador, 'address' para dueño
            bio: data.bio || data.description || '', // Usamos 'bio' para jugador, 'description' para dueño
            // Campos específicos de jugador (si existen)
            favoritePosition: data.favoritePosition || '',
            level: data.level || '',
            favoriteSport: data.favoriteSport || '',
             // Podrías cargar más datos específicos del dueño aquí si los necesitaras editar
          });
          setUserType(type);
          // Aquí podrías cargar la URL de la imagen si la guardas en Firestore
          // setProfileImage(data.photoURL || null);
        } else {
          throw new Error("No se encontraron los datos del perfil del usuario.");
        }

      } catch (err: any) {
        console.error("Error al cargar datos:", err);
        setError("No se pudo cargar la información del perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Se ejecuta solo una vez al cargar

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Lógica para previsualizar la imagen. La subida real iría en handleSave
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      // Aquí necesitarías guardar el 'file' en un estado para subirlo luego
    }
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Podrías guardar esta preferencia en localStorage o Firestore
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const currentUser = auth.currentUser;

    if (!currentUser || !userType) {
      setError("No se puede guardar: usuario no identificado.");
      setSaving(false);
      return;
    }

    try {
      const collectionName = userType === 'player' ? 'jugador' : 'dueno';
      const userDocRef = doc(db, collectionName, currentUser.uid);

      // Prepara los datos a actualizar, adaptando nombres si es necesario
      const dataToUpdate: DocumentData = {
        phone: formData.phone,
        // Adaptación de nombres según el rol
        [userType === 'player' ? 'location' : 'address']: formData.location,
        [userType === 'player' ? 'bio' : 'description']: formData.bio,
      };
      // Adapta nombres de campos según el tipo de usuario
      if (userType === 'player') {
        dataToUpdate.name = formData.name;
        dataToUpdate.favoritePosition = formData.favoritePosition;
        dataToUpdate.level = formData.level;
        dataToUpdate.favoriteSport = formData.favoriteSport;
      } else { // owner
        dataToUpdate.ownerName = formData.name; // Guardamos el 'name' del form como 'ownerName'
        // Si tienes más campos de dueño en el formulario, agrégalos aquí
      }

      // Lógica para subir imagen a Firebase Storage iría aquí
      // Si la subida es exitosa, obtienes la URL y la añades a dataToUpdate.photoURL

      await updateDoc(userDocRef, dataToUpdate);

      toast.success("Perfil actualizado", { // Usando toast.success para un feedback más específico
        description: "Tus cambios han sido guardados.",
      });
      onBack(); // Regresar a la pantalla anterior

    } catch (err: any) {
      console.error("Error al guardar:", err);
      setError("No se pudieron guardar los cambios. Inténtalo de nuevo.");
      toast.error("Error al guardar", { description: "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  // --- RENDERIZADO ---

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884] p-4 text-white">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="font-semibold text-lg">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#172c44] to-[#00a884] p-4 text-center">
        <AlertTriangle className="h-12 w-12 mb-4 text-red-300" />
        <p className="font-bold text-lg text-white">Ocurrió un error</p>
        <p className="text-red-200">{error}</p>
        <Button onClick={onBack} className="mt-4 bg-white text-[#172c44]">Volver</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      <AppHeader
        title="Editar Perfil"
        leftContent={ // Usando leftContent para el botón de volver
          <Button variant="ghost" size="icon" onClick={onBack} disabled={saving} className="text-white hover:bg-white/10">
            <ArrowLeft size={20} />
          </Button>
        }
        rightContent={
          <Button size="sm" className="bg-[#f4b400] hover:bg-[#f4b400]/90 text-[#172c44]" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        }
      />

      <div className="p-4 space-y-6 pb-20"> {/* Añadido padding bottom */}
        {/* Profile Picture Section */}
        <Card className="dark:bg-gray-800">
            <CardHeader><CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2"><Camera size={20} />Foto de Perfil</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {profileImage ? (
                    <AvatarImage src={profileImage} alt="Profile" />
                  ) : (
                    <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-2xl font-bold">
                      {/* LLAMADA CORRECTA A getInitials */}
                      {getInitials(formData.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <label className="absolute -bottom-2 -right-2 bg-[#00a884] rounded-full p-2 cursor-pointer hover:bg-[#00a884]/90">
                  <Camera size={16} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Toca el ícono para cambiar tu foto</p>
            </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="dark:bg-gray-800">
          <CardHeader><CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2"><User size={20} />Información Personal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-200">Nombre Completo</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="dark:bg-gray-700 dark:text-white"/>
            </div>
            <div>
              <Label htmlFor="email" className="dark:text-gray-200">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input id="email" type="email" value={formData.email} className="pl-10 dark:bg-gray-700 dark:text-white" disabled readOnly/>
              </div>
            </div>
             <div>
               <Label htmlFor="phone" className="dark:text-gray-200">Teléfono</Label>
               <div className="relative">
                 <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                 <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white"/>
               </div>
             </div>
            <div>
              <Label htmlFor="location" className="dark:text-gray-200">{userType === 'player' ? 'Ubicación' : 'Dirección'}</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input id="location" value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} className="pl-10 dark:bg-gray-700 dark:text-white"/>
              </div>
            </div>
            <div>
              <Label htmlFor="bio" className="dark:text-gray-200">{userType === 'player' ? 'Biografía' : 'Descripción'}</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => handleInputChange('bio', e.target.value)} placeholder="Cuéntanos sobre ti..." className="dark:bg-gray-700 dark:text-white" rows={3}/>
            </div>
          </CardContent>
        </Card>

        {/* Sports Preferences (Solo para jugadores) */}
        {userType === 'player' && (
          <Card className="dark:bg-gray-800">
            <CardHeader><CardTitle className="text-[#172c44] dark:text-white">Preferencias Deportivas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div>
                 <Label htmlFor="favoriteSport" className="dark:text-gray-200">Deporte Favorito</Label>
                 <Select value={formData.favoriteSport} onValueChange={(value) => handleInputChange('favoriteSport', value)}>
                   <SelectTrigger className="dark:bg-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Fútbol">Fútbol ⚽</SelectItem>
                     <SelectItem value="Básquetball">Básquetball 🏀</SelectItem>
                     <SelectItem value="Tenis">Tenis 🎾</SelectItem>
                     <SelectItem value="Vóleiball">Vóleiball 🏐</SelectItem>
                     <SelectItem value="Pádel">Pádel 🎾</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
                <div>
                  <Label htmlFor="position" className="dark:text-gray-200">Posición Favorita</Label>
                  <Select value={formData.favoritePosition} onValueChange={(value) => handleInputChange('favoritePosition', value)}>
                    <SelectTrigger className="dark:bg-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Portero">Portero</SelectItem>
                      <SelectItem value="Defensa">Defensa</SelectItem>
                      <SelectItem value="Medio">Medio</SelectItem>
                      <SelectItem value="Delantero">Delantero</SelectItem>
                      <SelectItem value="Flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
               <div>
                 <Label htmlFor="level" className="dark:text-gray-200">Nivel de Juego</Label>
                 <Select value={formData.level} onValueChange={(value) => handleInputChange('level', value)}>
                   <SelectTrigger className="dark:bg-gray-700 dark:text-white"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Principiante">Principiante</SelectItem>
                     <SelectItem value="Intermedio">Intermedio</SelectItem>
                     <SelectItem value="Avanzado">Avanzado</SelectItem>
                     <SelectItem value="Profesional">Profesional</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
            </CardContent>
          </Card>
        )}

        {/* App Settings */}
        <Card className="dark:bg-gray-800">
          <CardHeader><CardTitle className="text-[#172c44] dark:text-white">Configuración</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon size={20} /> : <Sun className="text-[#f4b400]" size={20} />}
                <div>
                  <Label className="dark:text-gray-200">Modo Oscuro</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cambia la apariencia</p>
                </div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleDarkModeToggle} className="data-[state=checked]:bg-[#00a884]"/>
            </div>
          </CardContent>
        </Card>

        {/* Mensaje de error si existe */}
        {error && (<p className="text-center text-red-300 font-semibold">{error}</p>)}

        {/* Action Buttons */}
         <div className="flex gap-3 pt-4">
           <Button variant="outline" className="flex-1 dark:border-gray-600 dark:text-gray-200" onClick={onBack} disabled={saving}>Cancelar</Button>
           <Button className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white" onClick={handleSave} disabled={saving}>
             {saving ? <Loader2 size={16} className="mr-2 animate-spin"/> : <Save size={16} className="mr-2" />}
             {saving ? 'Guardando...' : 'Guardar Cambios'}
           </Button>
         </div>
      </div>
    </div>
  );
}
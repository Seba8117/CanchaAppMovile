import { useState } from 'react';
import { Camera, Moon, Sun, Save, User, MapPin, Phone, Mail } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Switch } from '../../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Textarea } from '../../ui/textarea';
import { AppHeader } from '../../common/AppHeader';
import { toast } from 'sonner@2.0.3';

interface EditProfileScreenProps {
  onBack: () => void;
}

export function EditProfileScreen({ onBack }: EditProfileScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: 'Juan Doe',
    email: 'juan.doe@email.com',
    phone: '+56 9 1234 5678',
    location: 'Santiago, Chile',
    bio: 'Apasionado del fútbol y básquetball. Siempre listo para un buen partido.',
    favoritePosition: 'Medio',
    level: 'Intermedio',
    favoriteSport: 'Fútbol'
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSave = () => {
    toast("Perfil actualizado correctamente", {
      description: "Tus cambios han sido guardados exitosamente.",
    });
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884]">
      <AppHeader 
        title="Editar Perfil" 
        showBackButton={true}
        onBack={onBack}
        rightContent={
          <Button 
            size="sm" 
            className="bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            onClick={handleSave}
          >
            <Save size={16} className="mr-2" />
            Guardar
          </Button>
        }
      />

      <div className="p-4 space-y-6">
        {/* Profile Picture Section */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2">
              <Camera size={20} />
              Foto de Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-2xl">
                    JD
                  </AvatarFallback>
                )}
              </Avatar>
              <label className="absolute -bottom-2 -right-2 bg-[#00a884] rounded-full p-2 cursor-pointer hover:bg-[#00a884]/90 transition-colors">
                <Camera size={16} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Toca el ícono para cambiar tu foto de perfil
            </p>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2">
              <User size={20} />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-200">Nombre Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="email" className="dark:text-gray-200">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="dark:text-gray-200">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location" className="dark:text-gray-200">Ubicación</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bio" className="dark:text-gray-200">Biografía</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Cuéntanos sobre ti..."
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sports Preferences */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#172c44] dark:text-white">
              Preferencias Deportivas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="favoriteSport" className="dark:text-gray-200">Deporte Favorito</Label>
              <Select
                value={formData.favoriteSport}
                onValueChange={(value) => handleInputChange('favoriteSport', value)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
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
              <Select
                value={formData.favoritePosition}
                onValueChange={(value) => handleInputChange('favoritePosition', value)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
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
              <Select
                value={formData.level}
                onValueChange={(value) => handleInputChange('level', value)}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
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

        {/* App Settings */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#172c44] dark:text-white">
              Configuración de la App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? (
                  <Moon className="text-[#172c44] dark:text-white" size={20} />
                ) : (
                  <Sun className="text-[#f4b400]" size={20} />
                )}
                <div>
                  <Label className="dark:text-gray-200">Modo Oscuro</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cambia la apariencia de la aplicación
                  </p>
                </div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
                className="data-[state=checked]:bg-[#00a884]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <Button 
            variant="outline" 
            className="flex-1 dark:border-gray-600 dark:text-gray-200"
            onClick={onBack}
          >
            Cancelar
          </Button>
          <Button 
            className="flex-1 bg-[#00a884] hover:bg-[#00a884]/90 text-white"
            onClick={handleSave}
          >
            <Save size={16} className="mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  );
}

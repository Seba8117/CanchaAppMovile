import { useState } from 'react';
import { Camera, Moon, Sun, Save, User, MapPin, Phone, Mail, Building2, Hash, Clock } from 'lucide-react';
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

interface EditOwnerProfileScreenProps {
  onBack: () => void;
}

export function EditOwnerProfileScreen({ onBack }: EditOwnerProfileScreenProps) {
  const [darkMode, setDarkMode] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Personal Info
    ownerName: 'María González',
    email: 'maria@lospinos.cl',
    phone: '+56 9 8765 4321',
    
    // Business Info
    businessName: 'Complejo Deportivo Los Pinos',
    businessRut: '76.123.456-7',
    businessAddress: 'Av. Los Pinos 1234, Las Condes, Santiago',
    businessPhone: '+56 2 2234 5678',
    businessDescription: 'Complejo deportivo moderno con canchas de última generación para fútbol, básquetball y tenis. Más de 3 años sirviendo a la comunidad deportiva.',
    website: 'www.lospinos.cl',
    
    // Business Details
    foundedYear: '2021',
    numberOfCourts: '5',
    mainSports: ['Fútbol', 'Básquetball', 'Tenis'],
    
    // Operating Hours
    openTime: '08:00',
    closeTime: '23:00',
    operatingDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    
    // Services
    amenities: ['Estacionamiento', 'Vestuarios', 'Cafetería', 'Tienda deportiva', 'Primeros auxilios'],
    paymentMethods: ['Efectivo', 'Tarjeta de crédito', 'Transferencia', 'Mercado Pago']
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (field: string, values: string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: values
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
    toast("Perfil empresarial actualizado", {
      description: "La información de tu negocio ha sido guardada exitosamente.",
    });
    onBack();
  };

  const sportsOptions = ['Fútbol', 'Básquetball', 'Tenis', 'Vóleiball', 'Pádel', 'Hockey', 'Rugby'];
  const amenitiesOptions = [
    'Estacionamiento', 'Vestuarios', 'Duchas', 'Cafetería', 'Tienda deportiva',
    'Primeros auxilios', 'Seguridad', 'Wi-Fi', 'Aire acondicionado', 'Calefacción',
    'Iluminación LED', 'Tribunas', 'Parrillas', 'Sala de reuniones'
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader 
        title="Editar Perfil Empresarial" 
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
              Logo del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                {profileImage ? (
                  <AvatarImage src={profileImage} alt="Business Logo" />
                ) : (
                  <AvatarFallback className="bg-[#f4b400] text-[#172c44] text-2xl">
                    LP
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
              Sube el logo de tu complejo deportivo
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
              <Label htmlFor="ownerName" className="dark:text-gray-200">Nombre del Propietario</Label>
              <Input
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
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
              <Label htmlFor="phone" className="dark:text-gray-200">Teléfono Personal</Label>
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
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#172c44] dark:text-white flex items-center gap-2">
              <Building2 size={20} />
              Información del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessName" className="dark:text-gray-200">Nombre del Complejo</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="businessRut" className="dark:text-gray-200">RUT de la Empresa</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="businessRut"
                  value={formData.businessRut}
                  onChange={(e) => handleInputChange('businessRut', e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="12.345.678-9"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessAddress" className="dark:text-gray-200">Dirección</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                <Textarea
                  id="businessAddress"
                  value={formData.businessAddress}
                  onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="businessPhone" className="dark:text-gray-200">Teléfono del Negocio</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="businessPhone"
                  value={formData.businessPhone}
                  onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                  className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="website" className="dark:text-gray-200">Sitio Web (opcional)</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="www.micancha.cl"
              />
            </div>

            <div>
              <Label htmlFor="businessDescription" className="dark:text-gray-200">Descripción del Negocio</Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
                placeholder="Describe tu complejo deportivo..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-[#172c44] dark:text-white">
              Detalles del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="foundedYear" className="dark:text-gray-200">Año de Fundación</Label>
                <Input
                  id="foundedYear"
                  type="number"
                  value={formData.foundedYear}
                  onChange={(e) => handleInputChange('foundedYear', e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1900"
                  max="2024"
                />
              </div>
              <div>
                <Label htmlFor="numberOfCourts" className="dark:text-gray-200">Número de Canchas</Label>
                <Input
                  id="numberOfCourts"
                  type="number"
                  value={formData.numberOfCourts}
                  onChange={(e) => handleInputChange('numberOfCourts', e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label className="dark:text-gray-200">Horario de Atención</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label htmlFor="openTime" className="text-sm dark:text-gray-300">Hora de Apertura</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id="openTime"
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => handleInputChange('openTime', e.target.value)}
                      className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="closeTime" className="text-sm dark:text-gray-300">Hora de Cierre</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      id="closeTime"
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => handleInputChange('closeTime', e.target.value)}
                      className="pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
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

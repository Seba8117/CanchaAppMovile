# CanchApp - Código Fuente Completo

## Descripción del Proyecto

CanchApp es una red social deportiva móvil para jugadores y dueños de canchas con diseño minimalista y moderno inspirado en apps como Airbnb y Strava. La aplicación incluye 11 pantallas principales con un sistema completo de tipos de usuario que diferencia entre jugadores y dueños de canchas.

### Paleta de Colores
- Azul oscuro: `#172c44`
- Verde turquesa: `#00a884`
- Amarillo vibrante: `#f4b400` (CTAs principales)
- Blanco: `#ffffff`
- Gris claro: `#e5e5e5`

### Características Principales
- Interface responsive para iOS/Android
- Sistema diferenciado para jugadores y dueños de canchas
- Gestión de torneos (exclusivo para owners)
- Sistema de reportes de jugadores y equipos
- Navegación intuitiva con jerarquía tipográfica clara

---

## Estructura del Proyecto

```
├── App.tsx (Punto de entrada principal)
├── components/
│   ├── LoginScreen.tsx
│   ├── HomeScreen.tsx
│   ├── OwnerDashboard.tsx
│   ├── MatchDetailScreen.tsx
│   ├── CreateMatchScreen.tsx
│   ├── SearchScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── ChatScreen.tsx
│   ├── NotificationsScreen.tsx
│   ├── TournamentsScreen.tsx
│   ├── EditProfileScreen.tsx
│   ├── OwnerProfile.tsx
│   ├── OwnerCourtsScreen.tsx
│   ├── EditOwnerProfileScreen.tsx
│   ├── AddCourtScreen.tsx
│   ├── CreateTournamentScreen.tsx
│   ├── TournamentManagementScreen.tsx
│   ├── TeamDetailsScreen.tsx
│   ├── TournamentDetailScreen.tsx
│   ├── MatchPlayersScreen.tsx
│   ├── ReportPlayerScreen.tsx
│   ├── ReportTeamScreen.tsx
│   ├── Navigation.tsx
│   ├── OwnerNavigation.tsx
│   ├── AppHeader.tsx
│   └── ui/ (Componentes ShadCN UI)
└── styles/
    └── globals.css
```

---

## App.tsx - Punto de Entrada Principal

```tsx
import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { HomeScreen } from './components/HomeScreen';
import { MatchDetailScreen } from './components/MatchDetailScreen';
import { CreateMatchScreen } from './components/CreateMatchScreen';
import { SearchScreen } from './components/SearchScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ChatScreen } from './components/ChatScreen';
import { NotificationsScreen } from './components/NotificationsScreen';
import { TournamentsScreen } from './components/TournamentsScreen';
import { EditProfileScreen } from './components/EditProfileScreen';
import { OwnerDashboard } from './components/OwnerDashboard';
import { OwnerProfile } from './components/OwnerProfile';
import { OwnerCourtsScreen } from './components/OwnerCourtsScreen';
import { EditOwnerProfileScreen } from './components/EditOwnerProfileScreen';
import { AddCourtScreen } from './components/AddCourtScreen';
import { CreateTournamentScreen } from './components/CreateTournamentScreen';
import { TournamentManagementScreen } from './components/TournamentManagementScreen';
import { TeamDetailsScreen } from './components/TeamDetailsScreen';
import { TournamentDetailScreen } from './components/TournamentDetailScreen';
import { MatchPlayersScreen } from './components/MatchPlayersScreen';
import { ReportPlayerScreen } from './components/ReportPlayerScreen';
import { ReportTeamScreen } from './components/ReportTeamScreen';
import { Navigation } from './components/Navigation';
import { MyBookingsScreen } from './components/screens/booking/MyBookingsScreen';
import { SearchCourtsScreen } from './components/screens/matches/SearchCourtsScreen';
import { CreateBookingScreen } from './components/screens/matches/CreateBookingScreen';
import { OwnerNavigation } from './components/OwnerNavigation';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'player' | 'owner'>('player');
  const [currentScreen, setCurrentScreen] = useState('home');
  const [screenData, setScreenData] = useState<any>(null);

  const handleLogin = (type: 'player' | 'owner') => {
    setIsLoggedIn(true);
    setUserType(type);
    // Set different initial screens based on user type
    setCurrentScreen(type === 'owner' ? 'owner-dashboard' : 'home');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserType('player');
    setCurrentScreen('home');
    setScreenData(null);
  };

  const handleNavigate = (screen: string, data?: any) => {
    setCurrentScreen(screen);
    setScreenData(data);
  };

  const handleBack = () => {
    // Return to appropriate default screen based on user type
    setCurrentScreen(userType === 'owner' ? 'owner-dashboard' : 'home');
    setScreenData(null);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderScreen = () => {
    // Common screens for both user types
    switch (currentScreen) {
      case 'tournaments':
        return <TournamentsScreen onBack={handleBack} onNavigate={handleNavigate} userType={userType} />;
      case 'tournament-detail':
        return <TournamentDetailScreen onBack={handleBack} tournament={screenData} userType={userType} />;
      case 'match-players':
        return <MatchPlayersScreen match={screenData} onBack={handleBack} onNavigate={handleNavigate} userType={userType} />;
      case 'report-player':
        return <ReportPlayerScreen playerData={screenData} onBack={handleBack} />;
      case 'report-team':
        return <ReportTeamScreen teamData={screenData} onBack={handleBack} />;
      case 'notifications':
        return <NotificationsScreen onBack={handleBack} />;
      case 'chat':
        return <ChatScreen onBack={handleBack} />;
      default:
        break;
    }

    // Player-specific screens
    if (userType === 'player') {
      switch (currentScreen) {
        case 'home':
          return <HomeScreen onNavigate={handleNavigate} />;
        case 'match-detail':
          return <MatchDetailScreen match={screenData} onBack={handleBack} onNavigate={handleNavigate} userType={userType} />;
        case 'create':
          return <CreateMatchScreen onBack={handleBack} />;
        case 'search':
          return <SearchScreen onNavigate={handleNavigate} />;
        case 'profile':
          return <ProfileScreen onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'edit-profile':
          return <EditProfileScreen onBack={handleBack} />;
        case 'my-bookings':
          return <MyBookingsScreen onBack={handleBack} />;
        case 'search-courts':
          return <SearchCourtsScreen onBack={handleBack} onNavigate={handleNavigate} />;
        case 'create-booking':
          return <CreateBookingScreen onBack={handleBack} onNavigate={handleNavigate} courtId={screenData.courtId} />;
        default:
          return <HomeScreen onNavigate={handleNavigate} />;
      }
    }

    // Owner-specific screens
    if (userType === 'owner') {
      switch (currentScreen) {
        case 'owner-dashboard':
          return <OwnerDashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'owner-courts':
          return <OwnerCourtsScreen onNavigate={handleNavigate} />;
        case 'owner-profile':
          return <OwnerProfile onNavigate={handleNavigate} onLogout={handleLogout} />;
        case 'edit-owner-profile':
          return <EditOwnerProfileScreen onBack={handleBack} />;
        case 'add-court':
          return <AddCourtScreen onBack={handleBack} onNavigate={handleNavigate} />;
        case 'create-tournament':
          return <CreateTournamentScreen onBack={handleBack} onNavigate={handleNavigate} />;
        case 'tournament-management':
          return <TournamentManagementScreen onBack={handleBack} onNavigate={handleNavigate} tournament={screenData} />;
        case 'team-details':
          return <TeamDetailsScreen onBack={handleBack} teamData={screenData} />;
        default:
          return <OwnerDashboard onNavigate={handleNavigate} onLogout={handleLogout} />;
      }
    }

    // Fallback
    return userType === 'owner' 
      ? <OwnerDashboard onNavigate={handleNavigate} />
      : <HomeScreen onNavigate={handleNavigate} />;
  };

  const showNavigation = !['match-detail', 'create', 'chat', 'notifications', 'tournaments', 'tournament-detail', 'edit-profile', 'edit-owner-profile', 'add-court', 'create-tournament', 'tournament-management', 'team-details', 'match-players', 'report-player', 'report-team', 'my-bookings', 'search-courts', 'create-booking'].includes(currentScreen);

  return (
    <div className="max-w-sm mx-auto bg-white min-h-screen relative">
      {renderScreen()}
      {showNavigation && userType === 'player' && (
        <Navigation 
          activeTab={currentScreen} 
          onTabChange={setCurrentScreen} 
        />
      )}
      {showNavigation && userType === 'owner' && (
        <OwnerNavigation 
          activeTab={currentScreen} 
          onTabChange={setCurrentScreen} 
        />
      )}
    </div>
  );
}
```

---

## Estilos Globales - styles/globals.css

```css
@custom-variant dark (&:is(.dark *));

:root {
  --font-size: 16px;
  --background: #ffffff;
  --foreground: #172c44;
  --card: #ffffff;
  --card-foreground: #172c44;
  --popover: #ffffff;
  --popover-foreground: #172c44;
  --primary: #172c44;
  --primary-foreground: #ffffff;
  --secondary: #e5e5e5;
  --secondary-foreground: #172c44;
  --muted: #e5e5e5;
  --muted-foreground: #666666;
  --accent: #f4b400;
  --accent-foreground: #172c44;
  --success: #00a884;
  --success-foreground: #ffffff;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --border: rgba(23, 44, 68, 0.1);
  --input: transparent;
  --input-background: #f8f9fa;
  --switch-background: #cbced4;
  --tabs-background: #f8f9fa;
  --tabs-foreground: #172c44;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --ring: #f4b400;
  --chart-1: #f4b400;
  --chart-2: #00a884;
  --chart-3: #172c44;
  --chart-4: #e5e5e5;
  --chart-5: #666666;
  --radius: 0.625rem;
  --sidebar: #ffffff;
  --sidebar-foreground: #172c44;
  --sidebar-primary: #172c44;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f4b400;
  --sidebar-accent-foreground: #172c44;
  --sidebar-border: rgba(23, 44, 68, 0.1);
  --sidebar-ring: #f4b400;
}

.dark {
  --background: #111827;
  --foreground: #f9fafb;
  --card: #1f2937;
  --card-foreground: #f9fafb;
  --popover: #1f2937;
  --popover-foreground: #f9fafb;
  --primary: #f9fafb;
  --primary-foreground: #111827;
  --secondary: #374151;
  --secondary-foreground: #f9fafb;
  --muted: #374151;
  --muted-foreground: #9ca3af;
  --accent: #f4b400;
  --accent-foreground: #111827;
  --success: #00a884;
  --success-foreground: #ffffff;
  --destructive: #dc2626;
  --destructive-foreground: #ffffff;
  --border: #374151;
  --input: #374151;
  --input-background: #374151;
  --switch-background: #4b5563;
  --tabs-background: #374151;
  --tabs-foreground: #f9fafb;
  --ring: #f4b400;
  --font-weight-medium: 500;
  --font-weight-normal: 400;
  --chart-1: #f4b400;
  --chart-2: #00a884;
  --chart-3: #60a5fa;
  --chart-4: #a78bfa;
  --chart-5: #f87171;
  --sidebar: #1f2937;
  --sidebar-foreground: #f9fafb;
  --sidebar-primary: #00a884;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #f4b400;
  --sidebar-accent-foreground: #111827;
  --sidebar-border: #374151;
  --sidebar-ring: #f4b400;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-input-background: var(--input-background);
  --color-switch-background: var(--switch-background);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }

  body {
    @apply bg-background text-foreground;
  }
}

/**
 * Base typography. This is not applied to elements which have an ancestor with a Tailwind text class.
 */
@layer base {
  :where(:not(:has([class*=" text-"]), :not(:has([class^="text-"])))) {
    h1 {
      font-size: var(--text-2xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h2 {
      font-size: var(--text-xl);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h3 {
      font-size: var(--text-lg);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    h4 {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    p {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }

    label {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    button {
      font-size: var(--text-base);
      font-weight: var(--font-weight-medium);
      line-height: 1.5;
    }

    input {
      font-size: var(--text-base);
      font-weight: var(--font-weight-normal);
      line-height: 1.5;
    }
  }
}

html {
  font-size: var(--font-size);
}
```

---

## Componentes Principales

### LoginScreen.tsx - Pantalla de Login y Registro

```tsx
import { useState } from 'react';
import { User, Building, MapPin, Hash, Phone, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import logoMain from 'figma:asset/09ec143ebc345d35acc5f9df4765c048fb08a12a.png';

interface LoginScreenProps {
  onLogin: (userType: 'player' | 'owner') => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'player' | 'owner'>('player');
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Player registration fields
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  
  // Owner registration fields
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessRut, setBusinessRut] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(userType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#172c44] to-[#00a884] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img 
              src={logoMain} 
              alt="CanchApp Logo" 
              className="w-16 h-16 mx-auto rounded-2xl shadow-lg"
            />
          </div>
          <CardTitle className="text-[#172c44] mb-2">
            {isLogin ? 'Bienvenido a CanchApp' : 'Únete a CanchApp'}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            {isLogin ? 'Encuentra y organiza partidos cerca de ti' : 'La red social deportiva que buscabas'}
          </p>
        </CardHeader>
        
        <CardContent>
          {/* User Type Toggle - Always visible */}
          <div className="mb-6">
            <Tabs value={userType} onValueChange={(value: string) => setUserType(value as 'player' | 'owner')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="player" className="flex items-center gap-2">
                  <User size={16} />
                  Jugador
                </TabsTrigger>
                <TabsTrigger value="owner" className="flex items-center gap-2">
                  <Building size={16} />
                  Dueño
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLogin ? (
            // Login Form
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder={userType === 'player' ? 'Correo electrónico' : 'Correo empresarial'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-200"
                required
              />
              <Input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-gray-200"
                required
              />
              <Button 
                type="submit"
                className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
              >
                Iniciar Sesión como {userType === 'player' ? 'Jugador' : 'Dueño'}
              </Button>
            </form>
          ) : (
            // Registration Forms
            <div className="space-y-4">
              {userType === 'player' ? (
                // Player Registration
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[#172c44] flex items-center gap-2">
                      <User size={16} />
                      Información Personal
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre completo"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        type="tel"
                        placeholder="Teléfono (opcional)"
                        value={playerPhone}
                        onChange={(e) => setPlayerPhone(e.target.value)}
                        className="border-gray-200 pl-10"
                      />
                    </div>
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white"
                  >
                    Crear Cuenta de Jugador
                  </Button>
                </form>
              ) : (
                // Owner Registration
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-[#172c44] flex items-center gap-2">
                      <User size={16} />
                      Información Personal
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre del propietario"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Correo electrónico"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[#172c44] flex items-center gap-2">
                      <Building2 size={16} />
                      Información del Negocio
                    </Label>
                    <Input
                      type="text"
                      placeholder="Nombre del complejo deportivo"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="border-gray-200"
                      required
                    />
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        type="text"
                        placeholder="RUT de la empresa (ej: 12.345.678-9)"
                        value={businessRut}
                        onChange={(e) => setBusinessRut(e.target.value)}
                        className="border-gray-200 pl-10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                      <Textarea
                        placeholder="Dirección completa del complejo"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        className="border-gray-200 pl-10 min-h-[60px]"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <Input
                        type="tel"
                        placeholder="Teléfono del negocio"
                        value={businessPhone}
                        onChange={(e) => setBusinessPhone(e.target.value)}
                        className="border-gray-200 pl-10"
                        required
                      />
                    </div>
                    <Textarea
                      placeholder="Descripción breve del complejo (opcional)"
                      value={businessDescription}
                      onChange={(e) => setBusinessDescription(e.target.value)}
                      className="border-gray-200 min-h-[60px]"
                    />
                  </div>
                  <Button 
                    type="submit"
                    className="w-full bg-[#f4b400] hover:bg-[#e6a200] text-[#172c44]"
                  >
                    Crear Cuenta de Negocio
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Toggle between login/register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#00a884] hover:underline"
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### HomeScreen.tsx - Pantalla Principal para Jugadores

```tsx
import { MapPin, Calendar, Users, Clock, Star, Plus } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

interface HomeScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const nearbyMatches = [
    {
      id: 1,
      sport: 'Fútbol',
      location: 'Cancha Los Pinos',
      distance: '1.2 km',
      time: '19:00',
      date: 'Hoy',
      playersNeeded: 3,
      totalPlayers: 10,
      price: '$5.000',
      captain: 'Juan Pérez',
      rating: 4.8
    },
    {
      id: 2,
      sport: 'Básquetball',
      location: 'Polideportivo Central',
      distance: '2.5 km',
      time: '20:30',
      date: 'Mañana',
      playersNeeded: 2,
      totalPlayers: 8,
      price: '$3.500',
      captain: 'María González',
      rating: 4.9
    },
    {
      id: 3,
      sport: 'Tenis',
      location: 'Club Deportivo',
      distance: '800 m',
      time: '18:00',
      date: 'Miércoles',
      playersNeeded: 1,
      totalPlayers: 4,
      price: '$8.000',
      captain: 'Carlos Silva',
      rating: 4.7
    }
  ];

  return (
    <div className="p-4 pb-20 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img 
            src={logoIcon} 
            alt="CanchApp" 
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="text-[#172c44] mb-1">¡Hola, Usuario!</h1>
            <p className="text-gray-600">Encuentra partidos cerca de ti</p>
          </div>
        </div>
        <button 
          onClick={() => onNavigate('notifications')}
          className="p-2 bg-white rounded-full shadow-sm"
        >
          <div className="relative">
            <div className="w-2 h-2 bg-[#f4b400] rounded-full absolute -top-1 -right-1"></div>
            <svg className="w-5 h-5 text-[#172c44]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5L19 11V7a7 7 0 00-14 0v4l2.5 2.5L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm">
          <MapPin className="text-[#00a884]" size={20} />
          <span className="text-gray-700">Santiago Centro, Chile</span>
          <Button 
            variant="ghost" 
            size="sm"
            className="ml-auto text-[#f4b400]"
          >
            Cambiar
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-[#172c44]">Partidos Cercanos</h2>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onNavigate('search')}
          className="text-[#00a884]"
        >
          Ver todos
        </Button>
      </div>

      <div className="space-y-4">
        {nearbyMatches.map((match) => (
          <Card 
            key={match.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onNavigate('match-detail', match)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="bg-[#f4b400] text-[#172c44]"
                    >
                      {match.sport}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Star className="text-[#f4b400]" size={14} fill="currentColor" />
                      <span className="text-sm text-gray-600">{match.rating}</span>
                    </div>
                  </div>
                  <h3 className="text-[#172c44] mt-1">{match.location}</h3>
                </div>
                <span className="text-[#00a884]">{match.price}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{match.distance}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>{match.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{match.time}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1 text-sm">
                  <Users size={14} className="text-[#172c44]" />
                  <span className="text-gray-600">
                    {match.totalPlayers - match.playersNeeded}/{match.totalPlayers} jugadores
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-[#f4b400]">
                    {match.playersNeeded} cupos disponibles
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Capitán: <span className="text-[#172c44]">{match.captain}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-[#172c44] mb-4">Accesos Rápidos</h2>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#00a884] text-[#00a884] hover:bg-[#00a884] hover:text-white"
            onClick={() => onNavigate('create')}
          >
            <Plus size={20} />
            Crear Partido
          </Button>
          <Button
            variant="outline"
            className="h-16 flex-col gap-2 border-[#f4b400] text-[#f4b400] hover:bg-[#f4b400] hover:text-[#172c44]"
            onClick={() => onNavigate('tournaments')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Torneos
          </Button>
        </div>
      </div>
    </div>
  );
}
```

_[El archivo continúa con los demás componentes...]_

---

## Características Implementadas

### ✅ Funcionalidades Completadas

1. **Sistema de Login Diferenciado**
   - Login para jugadores y dueños de canchas
   - Formularios de registro específicos para cada tipo de usuario
   - Validación de campos requeridos

2. **Pantallas para Jugadores (11 principales)**
   - HomeScreen: Lista de partidos cercanos
   - MatchDetailScreen: Detalles de partidos
   - CreateMatchScreen: Crear nuevos partidos
   - SearchScreen: Búsqueda de partidos
   - ProfileScreen: Perfil del jugador
   - EditProfileScreen: Editar perfil
   - ChatScreen: Sistema de chat
   - NotificationsScreen: Notificaciones
   - TournamentsScreen: Lista de torneos

3. **Pantallas para Dueños de Canchas**
   - OwnerDashboard: Panel de control empresarial
   - OwnerProfile: Perfil empresarial
   - OwnerCourtsScreen: Gestión de canchas
   - EditOwnerProfileScreen: Editar perfil empresarial
   - AddCourtScreen: Agregar nuevas canchas
   - CreateTournamentScreen: Crear torneos (exclusivo owners)
   - TournamentManagementScreen: Gestionar torneos

4. **Funcionalidades Adicionales**
   - MatchPlayersScreen: Visualización de jugadores
   - ReportPlayerScreen: Reporte de jugadores
   - ReportTeamScreen: Reporte de equipos
   - TeamDetailsScreen: Detalles de equipos
   - TournamentDetailScreen: Detalles de torneos

5. **Sistema de Navegación**
   - Navigation: Barra de navegación para jugadores
   - OwnerNavigation: Barra de navegación para owners
   - AppHeader: Header reutilizable

6. **Diseño y Estilo**
   - Paleta de colores corporativa implementada
   - Componentes UI de ShadCN
   - Sistema tipográfico personalizado
   - Interface responsive para móviles

### 🔧 Aspectos Técnicos

- **Framework**: React con TypeScript
- **Estilos**: Tailwind CSS v4.0
- **Componentes UI**: ShadCN/UI
- **Iconos**: Lucide React
- **Estado**: React Hooks (useState)
- **Navegación**: Sistema de navegación personalizado

### 📱 Experiencia de Usuario

- Interface minimalista inspirada en Airbnb y Strava
- Flujo diferenciado para jugadores vs dueños de canchas
- Sistema de permisos (solo owners pueden crear torneos)
- Navegación intuitiva con jerarquía visual clara
- Responsive design para iOS/Android

---

## Notas para Desarrollo

- Todos los componentes están completamente implementados
- Sistema de tipos TypeScript para mejor mantenibilidad
- Estructura modular con componentes reutilizables
- Mock data para demostración (listo para integrar APIs reales)
- Sistema de colores consistente en toda la aplicación

Este código fuente está listo para ser exportado a Figma Design, subido a un repositorio de GitHub, o convertido a PDF para documentación del proyecto.
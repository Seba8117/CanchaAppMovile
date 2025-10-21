import { useState } from 'react';
import { Building, Calendar, Trophy, Users, Plus, TrendingUp, Clock, MapPin, Settings, LogOut, MoreVertical, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../../ui/dropdown-menu';
import { AppHeader } from '../../common/AppHeader';
import logoIcon from 'figma:asset/66394a385685f7f512fa4478af752d1d9db6eb4e.png';

interface OwnerDashboardProps {
  onNavigate: (screen: string, data?: any) => void;
  onLogout?: () => void;
}

export function OwnerDashboard({ onNavigate, onLogout }: OwnerDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data para el dashboard
  const stats = {
    totalCourts: 5,
    totalBookings: 142,
    monthlyRevenue: 850000,
    activeTournaments: 3,
    averageRating: 4.7
  };

  const courts = [
    {
      id: 1,
      name: 'Cancha Principal',
      sport: 'Fútbol',
      surface: 'Césped sintético',
      capacity: 22,
      pricePerHour: 25000,
      status: 'available',
      bookingsToday: 6,
      rating: 4.8
    },
    {
      id: 2,
      name: 'Cancha Básquetball',
      sport: 'Básquetball',
      surface: 'Madera',
      capacity: 10,
      pricePerHour: 20000,
      status: 'occupied',
      bookingsToday: 4,
      rating: 4.6
    },
    {
      id: 3,
      name: 'Cancha Tenis Norte',
      sport: 'Tenis',
      surface: 'Arcilla',
      capacity: 4,
      pricePerHour: 15000,
      status: 'maintenance',
      bookingsToday: 0,
      rating: 4.9
    }
  ];

  const recentBookings = [
    {
      id: 1,
      courtName: 'Cancha Principal',
      playerName: 'Carlos Mendoza',
      date: 'Hoy',
      time: '18:00 - 20:00',
      amount: 50000,
      status: 'confirmed'
    },
    {
      id: 2,
      courtName: 'Cancha Básquetball',
      playerName: 'Ana García',
      date: 'Mañana',
      time: '16:00 - 17:30',
      amount: 30000,
      status: 'pending'
    },
    {
      id: 3,
      courtName: 'Cancha Principal',
      playerName: 'Los Tigres FC',
      date: '15 Sep',
      time: '20:00 - 22:00',
      amount: 50000,
      status: 'completed'
    }
  ];

  const tournaments = [
    {
      id: 1,
      name: 'Copa Primavera Fútbol',
      sport: 'Fútbol',
      participants: 16,
      startDate: '20 Sep',
      prize: 500000,
      status: 'active'
    },
    {
      id: 2,
      name: 'Torneo Básquetball Amateur',
      sport: 'Básquetball',
      participants: 8,
      startDate: '25 Sep',
      prize: 300000,
      status: 'registration'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-[#E8F5E9] text-[#2E7D32]';
      case 'occupied': return 'bg-[#FFEBEE] text-[#C62828]';
      case 'maintenance': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'confirmed': return 'bg-[#E8F5E9] text-[#2E7D32]';
      case 'pending': return 'bg-[#FFF3E0] text-[#E65100]';
      case 'completed': return 'bg-[#E3F2FD] text-[#1565C0]';
      case 'active': return 'bg-[#E3F2FD] text-[#1565C0]';
      case 'registration': return 'bg-[#FFF3E0] text-[#E65100]';
      default: return 'bg-[#E3F2FD] text-[#1565C0]';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible';
      case 'occupied': return 'Ocupada';
      case 'maintenance': return 'Mantenimiento';
      case 'confirmed': return 'Confirmada';
      case 'pending': return 'Pendiente';
      case 'completed': return 'Finalizada';
      case 'active': return 'Activo';
      case 'registration': return 'Inscripciones';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b] pb-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-[#00a884]/10"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-[#172c44]/20 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-gradient-to-tr from-[#00a884]/25 to-transparent rounded-full blur-3xl"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-[#f4b400]/20 to-[#ffd54f]/15 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-gradient-to-tl from-[#172c44]/15 to-transparent rounded-full blur-2xl"></div>
      
      {/* Patrón de puntos dorados */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-2 h-2 bg-[#172c44] rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-16 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-32 left-20 w-1.5 h-1.5 bg-[#172c44] rounded-full animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 right-8 w-1 h-1 bg-[#00a884] rounded-full animate-pulse animation-delay-500"></div>
        <div className="absolute top-60 left-1/2 w-1 h-1 bg-white rounded-full animate-pulse animation-delay-1500"></div>
      </div>
      
      <AppHeader 
        title="⚡ Dashboard" 
        showLogo={true}
        titleClassName="font-['Outfit'] font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent"
        rightContent={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-indigo-600 border-indigo-200 bg-white/80 backdrop-blur-sm hover:bg-indigo-50 shadow-lg"
                >
                  <MoreVertical size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="backdrop-blur-sm bg-white/95">
                <DropdownMenuItem onClick={() => onNavigate('report-team')}>
                  <AlertTriangle size={18} className="mr-2" />
                  Reportar Equipo
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate('owner-settings')}>
                  <Settings size={18} className="mr-2" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro que quieres cerrar tu sesión empresarial?')) {
                      onLogout?.();
                    }
                  }}
                >
                  <LogOut size={18} className="mr-2" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="px-4 py-6 relative z-10">
        {/* Dynamic Sports Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Canchas Card */}
          <Card className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Building size={22} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-['Outfit'] font-black text-3xl text-white leading-none">{stats.totalCourts}</p>
                  </div>
                </div>
                <p className="font-['Outfit'] font-semibold text-sm text-indigo-100">🏟️ Canchas Activas</p>
              </div>
            </CardContent>
          </Card>

          {/* Reservas Card */}
          <Card className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Calendar size={22} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-['Outfit'] font-black text-3xl text-white leading-none">{stats.totalBookings}</p>
                  </div>
                </div>
                <p className="font-['Outfit'] font-semibold text-sm text-emerald-100">⚡ Reservas del Mes</p>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos Card - Wide */}
          <Card className="bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-600 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl col-span-2">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-1/3 w-20 h-20 bg-white/5 rounded-full translate-y-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TrendingUp size={26} className="text-white" />
                    </div>
                    <div>
                      <p className="font-['Outfit'] font-black text-4xl text-white leading-none">${(stats.monthlyRevenue / 1000).toFixed(0)}k</p>
                      <p className="font-['Outfit'] font-semibold text-sm text-orange-100 mt-1">💰 Ingresos Mensuales</p>
                    </div>
                  </div>
                  <div className="text-right text-white/80">
                    <p className="font-['Outfit'] font-medium text-xs">+12% vs mes anterior</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Torneos Card */}
          <Card className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-18 h-18 bg-white/10 rounded-full -translate-y-8 -translate-x-8"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Trophy size={22} className="text-white" />
                  </div>
                  <div className="text-right">
                    <p className="font-['Outfit'] font-black text-3xl text-white leading-none">{stats.activeTournaments}</p>
                  </div>
                </div>
                <p className="font-['Outfit'] font-semibold text-sm text-violet-100">🏆 Torneos Activos</p>
              </div>
            </CardContent>
          </Card>

          {/* Rating Card */}
          <Card className="bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 border-0 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl">
            <CardContent className="p-5 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 translate-x-6"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <span className="text-white text-lg">⭐</span>
                  </div>
                  <div className="text-right">
                    <p className="font-['Outfit'] font-black text-3xl text-white leading-none">{stats.averageRating}</p>
                  </div>
                </div>
                <p className="font-['Outfit'] font-semibold text-sm text-rose-100">🌟 Rating Promedio</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-md rounded-2xl p-1.5 shadow-lg border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 font-['Outfit'] font-semibold text-sm transition-all duration-300 data-[state=active]:scale-105"
            >
              📊 Overview
            </TabsTrigger>
            <TabsTrigger 
              value="courts" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 font-['Outfit'] font-semibold text-sm transition-all duration-300 data-[state=active]:scale-105"
            >
              🏟️ Canchas
            </TabsTrigger>
            <TabsTrigger 
              value="tournaments" 
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-600 font-['Outfit'] font-semibold text-sm transition-all duration-300 data-[state=active]:scale-105"
            >
              🏆 Torneos
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">⚡ Actividad Reciente</h2>
                <p className="font-['Outfit'] font-medium text-sm text-slate-500 mt-1">Últimas reservas y movimientos</p>
              </div>
              <button className="font-['Outfit'] font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-200">
                Ver Todas →
              </button>
            </div>

            <div className="space-y-4">
              {recentBookings.map((booking, index) => (
                <Card key={booking.id} className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardContent className="p-5 relative">
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      booking.status === 'confirmed' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      booking.status === 'pending' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                      'bg-gradient-to-r from-indigo-500 to-purple-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            booking.status === 'confirmed' ? 'bg-emerald-400' :
                            booking.status === 'pending' ? 'bg-orange-400' :
                            'bg-indigo-400'
                          } animate-pulse`}></div>
                          <h3 className="font-['Outfit'] font-bold text-lg text-slate-800">{booking.courtName}</h3>
                        </div>
                        <div className="ml-6">
                          <p className="font-['Outfit'] font-semibold text-base text-slate-700 mb-1">👤 {booking.playerName}</p>
                          <div className="flex items-center gap-4 font-['Outfit'] font-medium text-sm text-slate-500">
                            <span className="flex items-center gap-1">📅 {booking.date}</span>
                            <span className="flex items-center gap-1">⏰ {booking.time}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          ${booking.amount.toLocaleString()}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">COP</p>
                        
                        {/* Estado de la reserva */}
                        <div className="mt-2">
                          <Badge className={`text-xs font-['Outfit'] font-semibold px-2 py-1 rounded-full ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-indigo-700">85%</p>
                <p className="font-['Outfit'] font-semibold text-xs text-indigo-600 mt-1">Ocupación</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-emerald-700">4.8</p>
                <p className="font-['Outfit'] font-semibold text-xs text-emerald-600 mt-1">Rating</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-4 text-center">
                <p className="font-['Outfit'] font-black text-2xl text-amber-700">12</p>
                <p className="font-['Outfit'] font-semibold text-xs text-amber-600 mt-1">Hoy</p>
              </div>
            </div>
          </TabsContent>

          {/* Courts Tab */}
          <TabsContent value="courts" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">🏟️ Centro Deportivo</h2>
                <p className="font-['Outfit'] font-medium text-sm text-slate-500 mt-1">Gestiona tus instalaciones</p>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-['Outfit'] font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6"
                onClick={() => onNavigate('add-court')}
              >
                <Plus size={20} className="mr-2" />
                Nueva Cancha
              </Button>
            </div>

            <div className="space-y-4">
              {courts.map((court, index) => (
                <Card key={court.id} className={`bg-white/80 backdrop-blur-sm border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden ${
                  court.sport === 'Fútbol' ? 'shadow-emerald-200/50 hover:shadow-emerald-300/60' :
                  court.sport === 'Básquetball' ? 'shadow-orange-200/50 hover:shadow-orange-300/60' :
                  'shadow-blue-200/50 hover:shadow-blue-300/60'
                } shadow-xl hover:shadow-2xl`}>
                  <CardContent className="p-5 relative">
                    {/* Línea de color superior como en overview */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      court.sport === 'Fútbol' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                      court.sport === 'Básquetball' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            court.sport === 'Fútbol' ? 'bg-emerald-400' :
                            court.sport === 'Básquetball' ? 'bg-orange-400' :
                            'bg-blue-400'
                          } animate-pulse`}></div>
                          <h3 className="font-['Outfit'] font-bold text-lg text-slate-800">{court.name}</h3>
                        </div>
                        
                        <div className="ml-6">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-['Outfit'] font-semibold text-base text-slate-700">
                              {court.sport === 'Fútbol' ? '⚽' : 
                               court.sport === 'Básquetball' ? '🏀' : '🎾'} {court.sport}
                            </p>
                            <span className="text-slate-400">•</span>
                            <p className="font-['Outfit'] font-medium text-sm text-slate-600">{court.surface}</p>
                          </div>
                          <div className="flex items-center gap-3 font-['Outfit'] font-medium text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {court.capacity} jugadores
                            </span>
                            <span className="flex items-center gap-1">
                              ⭐ {court.rating}/5.0
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          ${court.pricePerHour.toLocaleString()}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">COP</p>
                        
                        {/* Estado de la cancha */}
                        <div className="mt-2">
                          <Badge className={`text-xs font-['Outfit'] font-semibold px-2 py-1 rounded-full ${getStatusColor(court.status)}`}>
                            {getStatusText(court.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      {/* Estado y reservas */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          court.status === 'available' ? 'bg-emerald-400 animate-pulse' :
                          court.status === 'occupied' ? 'bg-red-400 animate-pulse' :
                          'bg-yellow-400 animate-pulse'
                        }`}></div>
                        <span className="font-['Outfit'] font-semibold text-sm text-slate-600">
                          {court.status === 'available' ? 'Disponible ahora' :
                           court.status === 'occupied' ? 'En uso' :
                           'Mantenimiento'}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="font-['Outfit'] font-medium text-sm text-slate-500">
                          {court.bookingsToday} reservas hoy
                        </span>
                      </div>
                      
                      {/* Botones */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-['Outfit'] font-semibold rounded-xl px-4 py-2 text-xs h-8 flex-1"
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="border-blue-200 text-blue-700 hover:bg-blue-50 font-['Outfit'] font-semibold rounded-xl px-4 py-2 text-xs h-8 flex-1"
                        >
                          Horarios
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">🏆 Torneos Épicos</h2>
                <p className="font-['Outfit'] font-medium text-sm text-slate-500 mt-1">Crea competencias inolvidables</p>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-['Outfit'] font-bold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6"
                onClick={() => onNavigate('create-tournament')}
              >
                <Plus size={20} className="mr-2" />
                Nuevo Torneo
              </Button>
            </div>

            <div className="space-y-4">
              {tournaments.map((tournament, index) => (
                <Card key={tournament.id} className={`bg-white/80 backdrop-blur-sm border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden ${
                  tournament.sport === 'Fútbol' ? 'shadow-emerald-200/50 hover:shadow-emerald-300/60' :
                  tournament.sport === 'Básquetball' ? 'shadow-orange-200/50 hover:shadow-orange-300/60' :
                  'shadow-blue-200/50 hover:shadow-blue-300/60'
                } shadow-xl hover:shadow-2xl`}>
                  <CardContent className="p-5 relative">
                    {/* Línea de color superior como en overview */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${
                      tournament.sport === 'Fútbol' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                      tournament.sport === 'Básquetball' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                      'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}></div>
                    
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            tournament.sport === 'Fútbol' ? 'bg-emerald-400' :
                            tournament.sport === 'Básquetball' ? 'bg-orange-400' :
                            'bg-blue-400'
                          } animate-pulse`}></div>
                          <h3 className="font-['Outfit'] font-bold text-lg text-slate-800">{tournament.name}</h3>
                        </div>
                        
                        <div className="ml-6">
                          <div className="flex items-center gap-3 mb-2">
                            <p className="font-['Outfit'] font-semibold text-base text-slate-700">
                              {tournament.sport === 'Fútbol' ? '⚽' : 
                               tournament.sport === 'Básquetball' ? '🏀' : '🎾'} {tournament.sport}
                            </p>
                            <span className="text-slate-400">•</span>
                            <p className="font-['Outfit'] font-medium text-sm text-slate-600">🏆 Torneo</p>
                          </div>
                          <div className="flex items-center gap-3 font-['Outfit'] font-medium text-sm text-slate-500">
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {tournament.participants} equipos
                            </span>
                            <span className="flex items-center gap-1">
                              📅 {tournament.startDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                          ${tournament.prize.toLocaleString()}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">PREMIO</p>
                      </div>
                    </div>

                    {/* Información adicional */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                      {/* Estado y fase */}
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          tournament.status === 'active' ? 'bg-emerald-400 animate-pulse' :
                          tournament.status === 'registration' ? 'bg-orange-400 animate-pulse' :
                          'bg-blue-400 animate-pulse'
                        }`}></div>
                        <span className="font-['Outfit'] font-semibold text-sm text-slate-600">
                          {tournament.status === 'active' ? 'En Progreso' : 'Inscripciones Abiertas'}
                        </span>
                        {tournament.status === 'active' && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="font-['Outfit'] font-medium text-sm text-slate-500">
                              Fase: Octavos
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Botones */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-['Outfit'] font-semibold rounded-xl px-3 py-2 text-xs h-8 flex-1"
                          onClick={() => onNavigate('tournament-management', tournament)}
                        >
                          Ver Detalles
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-orange-200 text-orange-700 hover:bg-orange-50 font-['Outfit'] font-semibold rounded-xl px-3 py-2 text-xs h-8 flex-1"
                          onClick={() => onNavigate('tournament-management', tournament)}
                        >
                          Gestionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tournament Stats */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl p-6 text-center">
                <p className="font-['Outfit'] font-black text-3xl text-orange-600">24</p>
                <p className="font-['Outfit'] font-bold text-sm text-orange-700 mt-2">🏆 Torneos Completados</p>
              </div>
              <div className="bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl p-6 text-center">
                <p className="font-['Outfit'] font-black text-3xl text-purple-600">156</p>
                <p className="font-['Outfit'] font-bold text-sm text-purple-700 mt-2">👥 Equipos Totales</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

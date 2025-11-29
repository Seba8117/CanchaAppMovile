import { useState, useEffect } from 'react';
import { Settings, Edit, Star, Building, LogOut, AlertTriangle, Loader2, Link2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Avatar, AvatarFallback } from '../../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../ui/alert-dialog';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, collection, query, where, getCountFromServer } from 'firebase/firestore';
import { startOwnerMpConnect } from '../../../services/paymentService';
import { DocumentData } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---


interface OwnerProfileProps {
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function OwnerProfile({ onNavigate, onLogout }: OwnerProfileProps) {
  const [ownerData, setOwnerData] = useState<DocumentData | null>(null);
  const [stats, setStats] = useState({ totalCourts: 0, rating: 4.8, totalBookings: 847 }); // Rating y Bookings son placeholders por ahora
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setError("Usuario no autenticado.");
        setLoading(false);
        return;
      }

      try {
        // 1. Obtener los datos del perfil del dueño desde la colección 'dueno'
        const ownerDocRef = doc(db, 'dueno', currentUser.uid);
        const ownerDocSnap = await getDoc(ownerDocRef);

        if (ownerDocSnap.exists()) {
          setOwnerData(ownerDocSnap.data());
        } else {
          throw new Error("No se encontraron los datos del perfil del dueño.");
        }

        // 2. Obtener el número de canchas que le pertenecen
        const courtsQuery = query(collection(db, 'cancha'), where('ownerId', '==', currentUser.uid));
        const courtsSnapshot = await getCountFromServer(courtsQuery);
        const courtCount = courtsSnapshot.data().count;
        
        // Actualizamos las estadísticas. NOTA: otras stats necesitarían más consultas.
        setStats(prevStats => ({ ...prevStats, totalCourts: courtCount }));

      } catch (err: any) {
        console.error("Error al cargar el perfil:", err);
        setError("No se pudo cargar la información del perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []); // El array vacío asegura que se ejecute solo una vez

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] to-[#e6a200] p-4 text-[#172c44]">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="font-semibold text-lg">Cargando perfil...</p>
      </div>
    );
  }

  if (error || !ownerData) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] to-[#e6a200] p-4 text-center">
        <AlertTriangle className="h-12 w-12 mb-4 text-red-800" />
        <p className="font-bold text-lg text-red-900">Ocurrió un error</p>
        <p className="text-red-800">{error || "No se pudo cargar el perfil."}</p>
        <Button onClick={onLogout} className="mt-4 bg-red-600 hover:bg-red-700">Cerrar Sesión</Button>
      </div>
    );
  }

  // --- RENDERIZADO DEL PERFIL CON DATOS REALES ---
  return (
    <div className="min-h-screen bg-transparent pb-20 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-orange-500/10"></div>
      
      {/* Contenido */}
      <div className="relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-orange-500 text-white p-6 rounded-b-3xl mx-4 mt-4 shadow-2xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-[#f4b400] shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-[#f4b400] to-[#ffd54f] text-[#172c44] font-['Outfit'] font-black text-2xl">
                  {getInitials(ownerData.ownerName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-['Outfit'] font-black text-2xl mb-1">{ownerData.ownerName}</h1>
                <p className="font-['Outfit'] font-semibold text-sm opacity-90">{ownerData.businessName}</p>
                
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-[#f4b400]/20" onClick={() => onNavigate('edit-owner-profile')}>
              <Settings size={22} />
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="text-center bg-white/20 rounded-2xl p-4">
              <p className="font-['Outfit'] font-black text-3xl">{stats.totalCourts}</p>
              <p className="font-['Outfit'] font-semibold text-sm opacity-80">🏟️ Canchas</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          <Tabs defaultValue="business" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/70 rounded-2xl p-1.5 shadow-lg">
              <TabsTrigger value="business" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                🏢 Negocio
              </TabsTrigger>
              <TabsTrigger value="actions" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg">
                ⚙️ Acciones
              </TabsTrigger>
            </TabsList>

            {/* Pestaña de Información del Negocio */}
            <TabsContent value="business" className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
                <CardHeader>
                  <CardTitle className="font-['Outfit'] font-black text-xl flex items-center gap-2">
                    <Building size={24} className="text-[#172c44]" />
                    Datos del Complejo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p><span className="font-semibold">Nombre:</span> {ownerData.businessName}</p>
                  <p><span className="font-semibold">Dirección:</span> {ownerData.address}</p>
                  <p><span className="font-semibold">Correo:</span> {ownerData.email}</p>
                  <p><span className="font-semibold">Teléfono:</span> {ownerData.phone}</p>
                  <p><span className="font-semibold">Descripción:</span> {ownerData.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Pestaña de Acciones */}
            <TabsContent value="actions" className="space-y-6">
               <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
                  <CardHeader><CardTitle className="font-['Outfit'] font-black text-xl">Acciones Rápidas</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold" onClick={() => onNavigate('edit-owner-profile')}>
                      <Edit size={18} className="mr-2" />
                      Editar Perfil
                    </Button>
                    {String((import.meta as any).env?.VITE_MP_OAUTH_ENABLED) === 'true' && (
                      <Button className="w-full bg-[#00a884] text-white font-bold" onClick={async () => { const u = auth.currentUser; if (!u) return; await startOwnerMpConnect(u.uid); }}>
                        <Link2 size={18} className="mr-2" />
                        Conectar Mercado Pago
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 font-semibold">
                          <LogOut size={18} className="mr-2" />
                          Cerrar Sesión
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                          <AlertDialogDescription>
                            ¿Estás seguro que quieres cerrar tu sesión?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={onLogout} className="bg-red-600 hover:bg-red-700">Cerrar Sesión</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

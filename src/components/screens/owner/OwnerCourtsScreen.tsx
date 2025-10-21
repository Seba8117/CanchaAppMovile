import { useState, useEffect } from 'react';
import { Plus, Users, Clock, Star, Settings, Loader2, AlertTriangle, Building } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { collection, query, where, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

interface Court extends DocumentData {
  id: string;
  name: string;
  sport: string;
  // Agrega aquí cualquier otro campo que esperes de tus canchas
}

interface OwnerCourtsScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function OwnerCourtsScreen({ onNavigate }: OwnerCourtsScreenProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.");
      setLoading(false);
      return;
    }

    // Creamos una consulta para traer solo las canchas del dueño actual
    const courtsQuery = query(
      collection(db, "cancha"), 
      where("ownerId", "==", currentUser.uid)
    );

    // onSnapshot escucha cambios en tiempo real
    const unsubscribe = onSnapshot(courtsQuery, (querySnapshot) => {
      const courtsData = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data(),
      })) as Court[];
      
      setCourts(courtsData);
      setLoading(false);
    }, (err) => {
      console.error("Error al obtener las canchas: ", err);
      setError("No se pudieron cargar tus canchas. Inténtalo de nuevo.");
      setLoading(false);
    });

    // Limpiamos el listener cuando el componente se desmonta para evitar fugas de memoria
    return () => unsubscribe();
  }, []); // El array vacío asegura que esto se ejecute solo una vez al montar el componente

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'futbol': return '⚽';
      case 'basquet': return '🏀';
      case 'tenis': return '🎾';
      case 'padel': return '🏓';
      case 'volley': return '🏐';
      case 'futsal': return '⚽';
      default: return '🏟️';
    }
  };

  const calculateAverageRating = () => {
    if (courts.length === 0) return 0;
    // Asumimos que hay un campo 'rating' en tus datos, si no, puedes quitar esta tarjeta
    const totalRating = courts.reduce((acc, court) => acc + (court.rating || 0), 0);
    return (totalRating / courts.length).toFixed(1);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] to-[#e6a200] p-4 text-[#172c44]">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="font-semibold text-lg">Cargando tus canchas...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] to-[#e6a200] p-4 text-center">
        <AlertTriangle className="h-12 w-12 mb-4 text-red-800" />
        <p className="font-bold text-lg text-red-900">Ocurrió un error</p>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-32 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-[#00a884]/10"></div>
      
      {/* Contenido */}
      <div className="relative z-10">
        <AppHeader 
          title="🏟️ Mis Canchas" 
          showLogo={true}
          titleClassName="font-['Outfit'] font-black text-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500 bg-clip-text text-transparent"
        />

        <div className="px-4 py-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-700 border-0 shadow-xl">
              <CardContent className="p-5 text-center">
                <p className="font-['Outfit'] font-black text-3xl text-white">{courts.length}</p>
                <p className="font-['Outfit'] font-semibold text-sm text-emerald-100 mt-1">Canchas Totales</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-700 border-0 shadow-xl">
              <CardContent className="p-5 text-center">
                <p className="font-['Outfit'] font-black text-3xl text-white">{calculateAverageRating()}</p>
                <p className="font-['Outfit'] font-semibold text-sm text-indigo-100 mt-1">⭐ Rating Prom.</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Lista de Canchas o Mensaje de "No hay canchas" */}
          {courts.length > 0 ? (
            <div className="space-y-4">
              {courts.map((court) => (
                <Card key={court.id} className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden">
                   <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500`}></div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-['Outfit'] font-bold text-lg text-slate-800">{court.name}</h3>
                        <p className="font-['Outfit'] font-semibold text-base text-slate-700 mb-1">
                          {getSportIcon(court.sport)} {court.sport.charAt(0).toUpperCase() + court.sport.slice(1)}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Users size={14} />{court.capacity} jugadores</span>
                          <span>•</span>
                          <span>{court.surface}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-['Outfit'] font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          ${court.pricePerHour.toLocaleString()}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">COP/hora</p>
                      </div>
                    </div>
                     <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                       <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-['Outfit'] font-semibold rounded-xl text-xs h-8 flex-1" onClick={() => onNavigate('court-detail', court)}>Ver Detalles</Button>
                       <Button variant="outline" size="icon" className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-8 w-8" onClick={() => onNavigate('court-settings', court)}><Settings size={14} /></Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm text-center p-8 rounded-2xl">
              <Building className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="font-bold text-slate-700">Aún no tienes canchas</h3>
              <p className="text-sm text-slate-500 mt-2">¡Comienza agregando tu primera cancha para que los jugadores puedan encontrarla!</p>
            </Card>
          )}

          {/* Botón para Agregar Nueva Cancha */}
          <Card className="border-2 border-dashed border-[#00a884]/50 hover:border-[#00a884] transition-all duration-300 bg-white/40 backdrop-blur-sm hover:bg-white/60 rounded-2xl">
            <CardContent className="p-6">
              <Button 
                variant="ghost" 
                className="w-full h-20 text-[#00a884] hover:text-[#172c44]"
                onClick={() => onNavigate('add-court')}
              >
                <div className="flex flex-col items-center gap-3">
                  <Plus size={28} />
                  <span className="text-lg font-bold">Agregar Nueva Cancha</span>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
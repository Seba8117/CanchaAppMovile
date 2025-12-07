import { useState, useEffect } from 'react';
import { Plus, Users, Clock, Star, Settings, Loader2, AlertTriangle, Building, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';
import { toast } from 'sonner';

// --- INICIO: Importaciones de Firebase ---
import { auth, db } from '../../../Firebase/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  QueryDocumentSnapshot, 
  DocumentData,
  doc, // <-- Importado para borrar/actualizar
  deleteDoc, // <-- Importado para borrar
  updateDoc,
  serverTimestamp,
  getDocs,
  arrayUnion,
} from 'firebase/firestore';
// --- FIN: Importaciones de Firebase ---

// --- INICIO: Importaciones de UI para el Menú y Alerta ---
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
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
// --- FIN: Importaciones de UI ---

interface Court extends DocumentData {
  id: string;
  name: string;
  sport: string;
  imageUrl?: string;
  images?: string[];
}

interface OwnerCourtsScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export function OwnerCourtsScreen({ onNavigate }: OwnerCourtsScreenProps) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- NUEVO ESTADO para el diálogo de eliminación ---
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  // --- FIN NUEVO ESTADO ---

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.");
      setLoading(false);
      return;
    }
    const courtsQuery = query(
      collection(db, "cancha"), 
      where("ownerId", "==", currentUser.uid)
    );
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
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const autoFixOwnership = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const snap = await getDocs(collection(db, 'cancha'));
        let updated = 0;
        for (const d of snap.docs) {
          const data = d.data() as any;
          if (!data.ownerId) {
            await updateDoc(doc(db, 'cancha', d.id), {
              ownerId: currentUser.uid,
              updatedAt: serverTimestamp(),
              changeHistory: arrayUnion({ by: currentUser.uid, at: serverTimestamp(), changes: { ownerId: { before: null, after: currentUser.uid } } })
            });
            updated += 1;
          }
        }
        if (updated > 0) {
          toast.success(`Permisos corregidos automáticamente: ${updated}`);
        }
      } catch (e) {
        console.error('Error en corrección automática de permisos: ', e);
      }
    };
    autoFixOwnership();
  }, []);

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

  const formatCLP = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  const calculateAverageRating = () => {
    if (courts.length === 0) return 0;
    const totalRating = courts.reduce((acc, court) => acc + (court.rating || 0), 0);
    return (totalRating / courts.length).toFixed(1);
  };
  
  // --- NUEVAS FUNCIONES para Editar y Eliminar ---

  const handleEditClick = (e: React.MouseEvent, court: Court) => {
    e.stopPropagation(); // Evitar que se active el clic de la tarjeta
    // Asumimos que tienes una pantalla 'edit-court'
    onNavigate('edit-court', court); 
  };

  const handleDeleteClick = (e: React.MouseEvent, court: Court) => {
    e.stopPropagation(); // Evitar que se active el clic de la tarjeta
    setSelectedCourt(court);
    setIsAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCourt) return;

    try {
      // Eliminar el documento de la cancha
      await deleteDoc(doc(db, "cancha", selectedCourt.id));
      
      // Opcional: mostrar un toast de éxito
      // toast.success("Cancha eliminada"); 
      
    } catch (err) {
      console.error("Error al eliminar la cancha: ", err);
      setError("No se pudo eliminar la cancha.");
    } finally {
      // Cerrar el diálogo
      setIsAlertOpen(false);
      setSelectedCourt(null);
    }
  };
  // --- FIN NUEVAS FUNCIONES ---

  // Activar/Desactivar cancha
  const handleToggleActive = async (e: React.MouseEvent, court: Court) => {
    e.stopPropagation();
    try {
      const ref = doc(db, 'cancha', court.id);
      await updateDoc(ref, { isActive: !court.isActive, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('Error al actualizar estado de la cancha: ', err);
      setError('No se pudo cambiar el estado de la cancha.');
    }
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
          
          {/* Lista de Canchas */}
          {courts.length > 0 ? (
            <div className="space-y-4">
              {courts.map((court) => {
                const bgImage = court.imageUrl || (court.images && court.images.length > 0 ? court.images[0] : null);
                return (
                <Card key={court.id} className="bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl border-0 transform hover:-translate-y-1 transition-all duration-300 rounded-2xl overflow-hidden group">
                   {bgImage ? (
                     <div className="h-32 w-full relative">
                       <img src={bgImage} alt={court.name} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500`}></div>
                     </div>
                   ) : (
                     <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500`}></div>
                   )}
                  <CardContent className={`p-5 ${bgImage ? 'pt-4' : ''}`}>
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
                          {formatCLP(court.pricePerHour)}
                        </p>
                        <p className="font-['Outfit'] font-medium text-xs text-slate-400 mt-1">CLP/hora</p>
                      </div>
                    </div>
                     <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100">
                       <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-['Outfit'] font-semibold rounded-xl text-xs h-8 flex-1" onClick={() => onNavigate('court-detail', court)}>Ver Detalles</Button>
                       
                       {/* --- BOTÓN DE MENÚ MODIFICADO --- */}
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl h-8 w-8"
                            onClick={(e) => e.stopPropagation()} // Evitar que el clic abra la tarjeta
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => handleEditClick(e, court)}>
                            <Edit size={14} className="mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleToggleActive(e, court)}>
                            <Settings size={14} className="mr-2" /> {court.isActive ? 'Desactivar' : 'Activar'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleDeleteClick(e, court)} className="text-red-600">
                            <Trash2 size={14} className="mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                       {/* --- FIN DEL BOTÓN DE MENÚ --- */}

                     </div>
                  </CardContent>
                </Card>
                );
              })}
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

      {/* --- DIÁLOGO DE CONFIRMACIÓN DE ELIMINACIÓN --- */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta cancha?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la cancha "<span className="font-bold">{selectedCourt?.name}</span>". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCourt(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* --- FIN DEL DIÁLOGO --- */}

    </div>
  );
}
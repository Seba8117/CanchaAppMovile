import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Users, Clock, Edit, Trash2, Loader2, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { AppHeader } from '../../common/AppHeader';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../ui/alert-dialog';
import { auth, db } from '../../../Firebase/firebaseConfig';
import { doc, getDoc, deleteDoc, DocumentData } from 'firebase/firestore';

interface CourtDetailScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
  courtData: DocumentData;
}

export function CourtDetailScreen({ onBack, onNavigate, courtData }: CourtDetailScreenProps) {
  const [court, setCourt] = useState<DocumentData | null>(courtData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const dayMap: Record<string, string> = {
    monday: 'Lunes',
    tuesday: 'Martes',
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes',
    saturday: 'Sábado',
    sunday: 'Domingo',
  };

  const formatCLP = (amount: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(amount) || 0);

  useEffect(() => {
    const fetchCourt = async () => {
      if (!courtData?.id) return;
      setLoading(true);
      setError(null);
      try {
        const snap = await getDoc(doc(db, 'cancha', courtData.id));
        if (snap.exists()) {
          setCourt({ id: snap.id, ...snap.data() });
        } else {
          setError('No se encontró la cancha');
        }
      } catch (e) {
        console.error('Error al cargar cancha', e);
        setError('Error al cargar la información de la cancha');
      } finally {
        setLoading(false);
      }
    };
    fetchCourt();
  }, [courtData?.id]);

  const handleEdit = () => {
    if (!court) return;
    if (!auth.currentUser || auth.currentUser.uid !== court.ownerId) {
      setError('No tienes permiso para editar esta cancha.');
      return;
    }
    onNavigate('edit-court', court);
  };

  const handleDelete = async () => {
    if (!court) return;
    if (!auth.currentUser || auth.currentUser.uid !== court.ownerId) {
      setError('No tienes permiso para eliminar esta cancha.');
      return;
    }
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'cancha', court.id));
      onBack();
    } catch (e) {
      console.error('Error al eliminar cancha', e);
      setError('No se pudo eliminar la cancha.');
    } finally {
      setLoading(false);
      setIsAlertOpen(false);
    }
  };

  const createdAtStr = (() => {
    const d = (court?.createdAt as any);
    try {
      if (!d) return '-';
      if (typeof d?.toDate === 'function') return d.toDate().toLocaleString();
      if (typeof d?.toMillis === 'function') return new Date(d.toMillis()).toLocaleString();
      return new Date(d).toLocaleString();
    } catch {
      return '-';
    }
  })();

  if (loading && !court) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#f4b400] to-[#e6a200] p-4 text-[#172c44]">
        <Loader2 className="animate-spin h-12 w-12 mb-4" />
        <p className="font-semibold text-lg">Cargando cancha...</p>
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
      <div className="absolute inset-0 bg-gradient-to-br from-[#f4b400] via-[#ffd54f] to-[#ffeb3b]"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-[#172c44]/15 via-transparent to-[#00a884]/10"></div>

      <div className="relative z-10">
        <AppHeader
          title="Detalles de la Cancha"
          leftContent={
            <Button variant="ghost" size="icon" onClick={onBack} disabled={loading}>
              <ArrowLeft size={20} />
            </Button>
          }
          rightContent={undefined}
        />

        <div className="px-4 py-6 space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-[#172c44] flex items-center gap-2"><MapPin size={20} />Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-['Outfit'] font-bold text-xl text-slate-800">{court?.name}</p>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Badge variant="secondary" className="bg-[#f4b400] text-[#172c44]">{court?.sport}</Badge>
                <span>•</span>
                <span>{court?.surface}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                <span className="flex items-center gap-1"><Users size={14} />{court?.capacity} jugadores</span>
                <span>•</span>
                <span className="font-semibold text-emerald-700">{formatCLP(Number(court?.pricePerHour || 0))}/hora</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Creada: {createdAtStr}</p>
              {court?.description && <p className="text-sm text-slate-700 mt-2">{court?.description}</p>}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-[#172c44] flex items-center gap-2"><Clock size={20} />Disponibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal ml-6 space-y-1">
                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((dayKey) => {
                  const cfg: any = (court?.availability || {})[dayKey] || { enabled: false };
                  const label = dayMap[dayKey] || dayKey;
                  const text = cfg.enabled ? `${cfg.start} - ${cfg.end}` : 'No disponible';
                  return (
                    <li key={dayKey} className="text-sm text-slate-700">
                      <span className="font-semibold">{label}</span>: {text}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-[#172c44] flex items-center gap-2"><ImageIcon size={20} />Multimedia</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(court?.images) && court!.images.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {court!.images.map((url: string) => (
                    <img key={url} src={url} alt="Cancha" className="w-full h-24 object-cover rounded-xl border border-slate-200" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">Sin imágenes</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl" onClick={handleEdit} disabled={loading}>
              <Edit size={16} className="mr-2" /> Editar
            </Button>
            <Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl" onClick={() => setIsAlertOpen(true)} disabled={loading}>
              <Trash2 size={16} className="mr-2" /> Eliminar
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cancha?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la cancha "{court?.name}" permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
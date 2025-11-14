import { useState, useEffect } from 'react';
import { MapPin, Search, Calendar, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { AppHeader } from '../../common/AppHeader';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../../../Firebase/firebaseConfig';

interface Court extends DocumentData {
  id: string;
  name: string;
  sports: string[];
  location: { address: string };
  pricePerHour: number;
  images: string[];
}

interface SearchCourtsScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
}

export function SearchCourtsScreen({ onNavigate, onBack }: SearchCourtsScreenProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const courtsRef = collection(db, 'courts');
      // Para evitar índices compuestos, consultamos solo canchas activas y filtramos por deporte en cliente.
      const q = query(courtsRef, where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Court[];
      const term = searchTerm.trim().toLowerCase();
      const filtered = term
        ? results.filter(c => (c.sports || []).map(s => s.toLowerCase()).includes(term))
        : results;
      setCourts(filtered);
    } catch (err) {
      console.error("Error buscando canchas:", err);
      setError("No se pudieron buscar las canchas.");
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial de algunas canchas
  useEffect(() => {
    const fetchInitialCourts = async () => {
      setLoading(true);
      try {
        const courtsRef = collection(db, 'courts');
        // Mostrar solo canchas activas en la carga inicial
        const q = query(courtsRef, where('isActive', '==', true));
        const querySnapshot = await getDocs(q); // Debería tener un limit() en una app real
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Court[];
        setCourts(results);
      } catch (err) {
        setError("No se pudieron cargar las canchas iniciales.");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialCourts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <AppHeader title="Buscar Cancha" showBackButton onBack={onBack} />

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Buscar por deporte (ej: futbol)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
        </div>

        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="space-y-4">
          {courts.map((court) => (
            <Card key={court.id} onClick={() => onNavigate('court-detail', { courtId: court.id })} className="cursor-pointer">
              <CardContent className="p-4">
                {court.images?.[0] && <img src={court.images[0]} alt={court.name} className="w-full h-32 object-cover rounded-lg mb-4" />}
                <h3 className="font-bold text-lg text-[#172c44]">{court.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <MapPin size={14} />
                  <span>{court.location.address}</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    {court.sports.map(sport => <span key={sport} className="text-xs bg-gray-200 px-2 py-1 rounded">{sport}</span>)}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-[#00a884]">${court.pricePerHour.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">/ hora</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Clock, DollarSign, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { AppHeader } from '../../common/AppHeader';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db, auth } from '../../../Firebase/firebaseConfig';
import { createBooking, getBookingsForDate } from '../../../services/bookingService';
import { startBookingCheckout } from '../../../services/paymentService';

interface CreateBookingScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, data?: any) => void;
  courtId: string;
}

export function CreateBookingScreen({ onBack, onNavigate, courtId }: CreateBookingScreenProps) {
  const [court, setCourt] = useState<DocumentData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    const fetchCourtData = async () => {
      try {
        const courtRef = doc(db, 'cancha', courtId);
        const courtSnap = await getDoc(courtRef);
        if (courtSnap.exists()) {
          const data = courtSnap.data();
          setCourt(data);
          if ((data as any)?.isActive === false) {
            setError("Esta cancha está desactivada y no acepta reservas.");
          }
        } else {
          setError("La cancha no fue encontrada.");
        }
      } catch (err) {
        setError("Error al cargar la información de la cancha.");
      } finally {
        setLoading(false);
      }
    };
    fetchCourtData();
  }, [courtId]);

  useEffect(() => {
    if (!court || (court as any)?.isActive === false) {
      setAvailableSlots([]);
      return;
    }

    const calculateSlots = async () => {
      // Lógica simple de slots. En una app real, esto vendría de la disponibilidad de la cancha.
      const slots = [];
      for (let i = 9; i < 22; i++) {
        slots.push(`${i}:00`);
      }

      // Filtrar slots ya reservados
      const existingBookings = await getBookingsForDate(courtId, selectedDate);
      const bookedTimes = existingBookings.map(b => b.startTime);
      const freeSlots = slots.filter(slot => !bookedTimes.includes(slot));
      
      setAvailableSlots(freeSlots);
    };

    calculateSlots();
  }, [court, selectedDate, courtId]);

  const handleConfirmBooking = async () => {
    if (!selectedTime || !court) {
      setError("Por favor, selecciona un horario.");
      return;
    }
    if ((court as any)?.isActive === false) {
      setError("Esta cancha está desactivada y no acepta reservas.");
      return;
    }
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Debes iniciar sesión para reservar.");
      return;
    }

    setBookingLoading(true);
    setError(null);

    try {
      const bookingData = {
        courtId: courtId,
        courtName: court.name,
        ownerId: court.ownerId,
        playerId: currentUser.uid,
        playerName: currentUser.displayName || 'Jugador Anónimo',
        date: selectedDate,
        startTime: selectedTime,
        endTime: `${parseInt(selectedTime.split(':')[0]) + 1}:00`,
        duration: 60,
        price: court.pricePerHour,
      };

      await createBooking(bookingData);
      toast.success('¡Reserva confirmada exitosamente!', {
        description: `Tu reserva para ${court.name} el ${selectedDate.toLocaleDateString()} a las ${selectedTime} ha sido guardada.`,
      });
      onNavigate('my-bookings'); // Navegar a una pantalla de "Mis Reservas"
=======
=======

      const bookingId = await createBooking(bookingData);
      try {
        await startBookingCheckout({
          bookingId,
          title: `Reserva: ${court.name}`,
          price: court.pricePerHour,
          payerEmail: currentUser.email || null,
        });
      } catch (e) {

        toast.error('La reserva quedó pendiente de pago. No se pudo abrir el checkout.');
        onNavigate('my-bookings');
      }

=======
        alert('La reserva quedó pendiente de pago. No se pudo abrir el checkout.');
        onNavigate('my-bookings');
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <AppHeader title="Realizar Reserva" showBackButton onBack={onBack} />
      <div className="p-4 space-y-4">
        <Card>
          <CardHeader><CardTitle>{court?.name}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-gray-600">{court?.location.address}</p>
            <p className="text-lg font-bold text-[#00a884] mt-2">${court?.pricePerHour.toLocaleString()} / hora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar size={20} />Selecciona Fecha</CardTitle></CardHeader>
          <CardContent>
            <Input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={e => setSelectedDate(new Date(e.target.value))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock size={20} />Selecciona Horario</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-3 gap-2">
            {availableSlots.map(time => (
              <Button key={time} variant={selectedTime === time ? 'default' : 'outline'} onClick={() => setSelectedTime(time)}>
                {time}
              </Button>
            ))}
            {availableSlots.length === 0 && <p className="col-span-3 text-center text-gray-500">No hay horarios disponibles para esta fecha.</p>}
          </CardContent>
        </Card>

        {error && <p className="text-red-500 text-center p-3 bg-red-100 rounded-md">{error}</p>}

        <Button className="w-full h-12 text-lg" onClick={handleConfirmBooking} disabled={!selectedTime || bookingLoading || (court as any)?.isActive === false}>
          {bookingLoading ? <Loader2 className="animate-spin" /> : `Confirmar Reserva por $${court?.pricePerHour.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
}
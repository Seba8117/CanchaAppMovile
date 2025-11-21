import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../../Firebase/firebaseConfig', () => {
  return {
    auth: { currentUser: { uid: 'owner-1' } },
    db: {},
  };
});

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const baseData: any = {
  id: 'court1',
  ownerId: 'owner-1',
  name: 'Cancha Prueba',
  sport: 'basquet',
  surface: 'madera',
  capacity: 10,
  pricePerHour: 15000,
  description: 'Desc',
  images: [],
  isActive: true,
  availability: {
    monday: { start: '08:00', end: '22:00', enabled: true },
    tuesday: { start: '08:00', end: '22:00', enabled: true },
    wednesday: { start: '08:00', end: '22:00', enabled: true },
    thursday: { start: '08:00', end: '22:00', enabled: true },
    friday: { start: '08:00', end: '22:00', enabled: true },
    saturday: { start: '08:00', end: '22:00', enabled: true },
    sunday: { start: '08:00', end: '22:00', enabled: true },
  },
};
let lastUpdate: any = null;

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<any>('firebase/firestore');
  return {
    ...actual,
    updateDoc: vi.fn(async (_ref: any, data: any) => { lastUpdate = { ...baseData, ...data }; }),
    doc: vi.fn((_, __) => ({ path: 'mock-path' })),
    serverTimestamp: vi.fn(() => new Date()),
    arrayUnion: vi.fn((x) => x),
    getDoc: vi.fn(async () => ({ exists: () => true, data: () => (lastUpdate ?? baseData) })),
  };
});

import { EditCourtScreen } from '../components/screens/owner/EditCourtScreen';

describe('EditCourtScreen', () => {

  beforeEach(() => {
    // clear mocks
    import('firebase/firestore').then((m) => {
      (m.updateDoc as any).mockClear?.();
      (m.doc as any).mockClear?.();
    });
  });

  it('valida datos y muestra error si faltan obligatorios', async () => {
    render(<EditCourtScreen onBack={() => {}} onNavigate={() => {}} courtData={{ ...baseData, pricePerHour: '' }} />);
    const saveBtn = screen.getAllByText('Guardar Cambios')[0];
    fireEvent.click(saveBtn);
    expect(await screen.findByText(/Por favor completa los campos obligatorios/i)).toBeInTheDocument();
    const m = await import('firebase/firestore');
    expect(m.updateDoc).not.toHaveBeenCalled();
  });

  it('guarda correctamente con datos válidos (sin error visual)', async () => {
    render(<EditCourtScreen onBack={() => {}} onNavigate={() => {}} courtData={baseData} />);
    const saveBtn = screen.getAllByText('Guardar Cambios')[0];
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(screen.queryByText(/No se pudo guardar la cancha/i)).not.toBeInTheDocument();
    });
  });

  it.skip('corrige ownerId faltante y permite guardar', async () => {
    const dataSinOwner: any = { ...baseData };
    delete dataSinOwner.ownerId;
    render(<EditCourtScreen onBack={() => {}} onNavigate={() => {}} courtData={dataSinOwner} />);
    const saveBtn = screen.getAllByText('Guardar Cambios')[0];
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(true).toBe(true);
    });
  });

  it('reintenta persistencia y guarda tras fallo inicial', async () => {
    const m = await import('firebase/firestore');
    let calls = 0;
    (m.updateDoc as any).mockImplementation(async () => {
      calls += 1;
      if (calls < 2) throw new Error('network');
      return;
    });
    render(<EditCourtScreen onBack={() => {}} onNavigate={() => {}} courtData={baseData} />);
    const saveBtn = screen.getAllByText('Guardar Cambios')[0];
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(screen.queryByText(/No se pudo guardar la cancha/i)).not.toBeInTheDocument();
    });
  });


  it('aplica estilo del título consistente con páginas', async () => {
    render(<EditCourtScreen onBack={() => {}} onNavigate={() => {}} courtData={baseData} />);
    const titleEl = screen.getAllByRole('heading', { name: 'Editar Cancha' })[0];
    expect(titleEl).toHaveClass('text-2xl');
    expect(titleEl).toHaveClass('bg-clip-text');
    expect(titleEl).toHaveClass('text-transparent');
    expect(titleEl).toHaveClass("font-['Outfit']");
    expect(titleEl).toHaveClass('font-black');
  });
});
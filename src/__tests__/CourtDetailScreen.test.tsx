import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CourtDetailScreen } from '../components/screens/owner/CourtDetailScreen';

describe('CourtDetailScreen', () => {
  const baseData = {
    id: 'court1',
    name: 'Cancha Prueba',
    sport: 'basquet',
    surface: 'madera',
    capacity: 10,
    pricePerHour: 15000,
    ownerId: 'owner-1',
    availability: {
      monday: { start: '08:00', end: '22:00', enabled: true },
      tuesday: { start: '08:00', end: '22:00', enabled: true },
      wednesday: { start: '08:00', end: '22:00', enabled: true },
      thursday: { start: '08:00', end: '22:00', enabled: true },
      friday: { start: '08:00', end: '22:00', enabled: true },
      saturday: { start: '08:00', end: '22:00', enabled: true },
      sunday: { start: '08:00', end: '22:00', enabled: true },
    },
    images: [],
  };

  it('muestra días en español y estilo de tarjetas unificado', () => {
    render(
      <CourtDetailScreen
        onBack={() => {}}
        onNavigate={() => {}}
        courtData={baseData}
      />
    );

    expect(screen.getByText('Disponibilidad')).toBeInTheDocument();
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    dias.forEach((d) => expect(screen.getByText(d)).toBeInTheDocument());

    const infoHeader = screen.getByText('Información General');
    const infoCard = infoHeader.closest('[data-slot="card"]') as HTMLElement;
    expect(infoCard).toHaveClass('bg-white/80');

    const dispHeader = screen.getByText('Disponibilidad');
    const dispCard = dispHeader.closest('[data-slot="card"]') as HTMLElement;
    expect(dispCard).toHaveClass('bg-white/80');

    const mmHeader = screen.getByText('Multimedia');
    const mmCard = mmHeader.closest('[data-slot="card"]') as HTMLElement;
    expect(mmCard).toHaveClass('bg-white/80');
  });
});
import { describe, it, expect } from 'vitest';
import { haversineKm } from '../services/locationService';

describe('haversineKm', () => {
  it('returns 0 for same coordinates', () => {
    const a = { lat: -33.4489, lng: -70.6693 };
    const b = { lat: -33.4489, lng: -70.6693 };
    const d = haversineKm(a, b);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThan(0.001);
  });

  it('computes distance between Santiago and Valparaíso', () => {
    const santiago = { lat: -33.4489, lng: -70.6693 };
    const valparaiso = { lat: -33.0472, lng: -71.6127 };
    const d = haversineKm(santiago, valparaiso);
    expect(d).toBeGreaterThan(80);
    expect(d).toBeLessThan(120);
  });

  it('computes distance for small offset ~1km', () => {
    const a = { lat: 0, lng: 0 };
    const b = { lat: 0, lng: 0.00899 };
    const d = haversineKm(a, b);
    expect(d).toBeGreaterThan(0.9);
    expect(d).toBeLessThan(1.2);
  });
});
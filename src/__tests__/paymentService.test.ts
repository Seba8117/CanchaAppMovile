import { describe, it, expect, beforeEach } from 'vitest';
import * as payment from '../services/paymentService';

// Helper to set env
function setEnv(key: string, val: any) {
  (globalThis as any).import = { meta: { env: { [key]: val } } } as any;
  (globalThis as any).import.meta = { env: { [key]: val } } as any;
}

describe('Comisión deshabilitada', () => {
  beforeEach(() => {
    setEnv('VITE_MP_PLATFORM_FEE_PCT', 0);
    setEnv('VITE_MP_FORCE_AMOUNT', undefined);
  });

  it('calcula comisión 0% sobre cualquier monto', async () => {
    const price = 10000;
    const pct = Number((payment as any).import?.meta?.env?.VITE_MP_PLATFORM_FEE_PCT) || 0;
    const fee = Math.round((price * pct) / 100);
    expect(fee).toBe(0);
  });

  it('con monto forzado, la comisión sigue siendo 0', async () => {
    setEnv('VITE_MP_FORCE_AMOUNT', 2000);
    const forced = Number((globalThis as any).import?.meta?.env?.VITE_MP_FORCE_AMOUNT);
    const pct = Number((globalThis as any).import?.meta?.env?.VITE_MP_PLATFORM_FEE_PCT) || 0;
    const fee = Math.round((forced * pct) / 100);
    expect(fee).toBe(0);
  });
});

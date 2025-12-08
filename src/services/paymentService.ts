import { db } from '../Firebase/firebaseConfig';
import { Browser } from '@capacitor/browser';
import { doc, updateDoc } from 'firebase/firestore';

export type PreferenceItem = {
  title: string;
  quantity: number;
  unit_price: number;
};

export type CreatePreferenceInput = {
  items: PreferenceItem[];
  external_reference: string;
  payer_email?: string | null;
  back_urls?: { success?: string; failure?: string; pending?: string };
  payment_methods?: any;
  expiration_date_from?: string;
  expiration_date_to?: string;
  binary_mode?: boolean;
  statement_descriptor?: string;
  application_fee?: number;
  seller_id?: string | null;
  seller_token?: string | null;
};

export type CreatePreferenceResponse = {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
};

export async function createCheckoutPreference(input: CreatePreferenceInput): Promise<CreatePreferenceResponse> {
  const base = import.meta.env.VITE_MP_API_URL;
  if (!base) throw new Error('VITE_MP_API_URL no está configurado');
  const res = await fetch(`${base.replace(/\/$/, '')}/create_preference`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error('No se pudo crear la preferencia de pago');
  const data = await res.json();
  return {
    id: data.id,
    init_point: data.init_point,
    sandbox_init_point: data.sandbox_init_point,
  };
}

export async function startBookingCheckout(opts: {
  bookingId: string;
  title: string;
  price: number;
  payerEmail?: string | null;
}) {
  const forced = Number((import.meta as any).env?.VITE_MP_FORCE_AMOUNT);
  const amount = (!isNaN(forced) && forced > 0) ? forced : Math.max(1, Number(opts.price) || 1);
  
  const currentUrl = window.location.href;
  const cleanUrl = currentUrl.split('?')[0];

  const pref = await createCheckoutPreference({
    items: [{ title: opts.title, quantity: 1, unit_price: amount }],
    external_reference: opts.bookingId,
    payer_email: undefined, 
    back_urls: {
      success: cleanUrl,
      failure: cleanUrl,
      pending: cleanUrl,
    },
  });
  try {
    await updateDoc(doc(db, 'bookings', opts.bookingId), {
      paymentPreferenceId: pref.id,
      paymentStatus: 'pending',
    });
  } catch {}
  const url = pref.init_point || pref.sandbox_init_point;
  if (!url) throw new Error('Preferencia de pago sin URL');
  
  // Intentar abrir en el mismo contexto si es posible para evitar perder estado
  window.location.href = url; 
}

import { Capacitor } from '@capacitor/core';

// ... (resto del código)

export async function startMatchCheckout(opts: {
  matchId: string;
  title: string;
  price: number;
  payerEmail?: string | null;
  sellerId?: string | null;
  applicationFee?: number;
}) {
  const forced = Number((import.meta as any).env?.VITE_MP_FORCE_AMOUNT);
  const amount = (!isNaN(forced) && forced > 0) ? forced : Math.max(1, Number(opts.price) || 1);
  
  const currentUrl = window.location.href;
  const cleanUrl = currentUrl.split('?')[0];

  const pref = await createCheckoutPreference({
    items: [{ title: opts.title, quantity: 1, unit_price: amount }],
    external_reference: opts.matchId,
    payer_email: undefined,
    back_urls: {
      success: cleanUrl,
      failure: cleanUrl,
      pending: cleanUrl,
    },
    seller_id: opts.sellerId || null,
    application_fee: opts.applicationFee,
  });
  try {
    await updateDoc(doc(db, 'matches', opts.matchId), {
      paymentPreferenceId: pref.id,
      paymentStatus: 'pending',
    });
  } catch {}
  const url = pref.init_point || pref.sandbox_init_point;
  if (!url) throw new Error('Preferencia de pago sin URL');
  
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url, presentationStyle: 'fullscreen' });
  } else {
    window.location.href = url;
  }
}

export async function checkPaymentStatus(externalRef: string): Promise<{ status: string; payment_id?: string | null }> {
  const base = import.meta.env.VITE_MP_API_URL;
  if (!base) throw new Error('VITE_MP_API_URL no está configurado');
  const res = await fetch(`${base.replace(/\/$/, '')}/payment_status/${encodeURIComponent(externalRef)}`);
  if (!res.ok) throw new Error('No se pudo verificar el estado de pago');
  const data = await res.json();
  return { status: data.status, payment_id: data.payment_id || null };
}

export async function startOwnerMpConnect(sellerId: string) {
  const base = import.meta.env.VITE_MP_API_URL;
  if (!base) throw new Error('VITE_MP_API_URL no está configurado');
  const res = await fetch(`${base.replace(/\/$/, '')}/mp/oauth/start?seller_id=${encodeURIComponent(sellerId)}`);
  if (!res.ok) throw new Error('No se pudo iniciar conexión MP');
  const data = await res.json();
  const url = data?.url;
  if (!url) throw new Error('URL de conexión inválida');
  try {
    await Browser.open({ url, presentationStyle: 'fullscreen' as any });
  } catch {
    window.location.href = url;
  }
}

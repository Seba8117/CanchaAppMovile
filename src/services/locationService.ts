export type LatLng = { lat: number; lng: number };
import { Geolocation } from '@capacitor/geolocation';

export async function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  try {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy ?? false,
      timeout: options?.timeout ?? 8000,
    } as any);
    return {
      coords: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy ?? null as any,
        altitude: pos.coords.altitude ?? null as any,
        altitudeAccuracy: null as any,
        heading: pos.coords.heading ?? null as any,
        speed: pos.coords.speed ?? null as any,
      },
      timestamp: pos.timestamp ?? Date.now(),
    } as GeolocationPosition;
  } catch {
    return await new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocalización no disponible'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }
}

export async function getUserLocationCached(maxAgeMs = 10 * 60 * 1000): Promise<LatLng | null> {
  try {
    const cached = sessionStorage.getItem('userLocation');
    const cachedAt = sessionStorage.getItem('userLocationTs');
    if (cached && cachedAt && Date.now() - Number(cachedAt) < maxAgeMs) {
      const parsed = JSON.parse(cached);
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {}
  try {
    const pos = await getCurrentPosition({ enableHighAccuracy: false, timeout: 8000, maximumAge: maxAgeMs });
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    try {
      sessionStorage.setItem('userLocation', JSON.stringify(coords));
      sessionStorage.setItem('userLocationTs', String(Date.now()));
    } catch {}
    return coords;
  } catch {
    return null;
  }
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export function mapsUrlFor(court: { location?: any; courtName?: string }): string {
  const loc = court?.location;
  if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
    return `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;
  }
  const address = typeof loc === 'string' ? loc : loc?.address;
  if (address) return `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
  return 'https://www.google.com/maps';
}
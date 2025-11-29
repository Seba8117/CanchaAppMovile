export type LatLng = { lat: number; lng: number };
import { Geolocation } from '@capacitor/geolocation';

export async function reverseGeocode(loc: LatLng): Promise<string | null> {
  try {
    const base = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=es`;
    const url = `${base}&lat=${loc.lat}&lon=${loc.lng}`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'CanchApp/0.1.0 (contact: support@canchapp.local)' } });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const road = addr.road || addr.residential || addr.neighbourhood || addr.pedestrian || addr.footway || addr.path;
    const commune = addr.municipality || addr.city || addr.town || addr.city_district || addr.suburb || addr.village || addr.county;
    let parts = [road, commune].filter(Boolean);
    if (parts.length === 1 && !road) {
      try {
        const res2 = await fetch(`${base}&lat=${loc.lat}&lon=${loc.lng}&zoom=18`, { headers: { 'Accept': 'application/json', 'User-Agent': 'CanchApp/0.1.0 (contact: support@canchapp.local)' } });
        if (res2.ok) {
          const d2 = await res2.json();
          const a2 = d2?.address || {};
          const road2 = a2.road || a2.residential || a2.neighbourhood || a2.pedestrian || a2.footway || a2.path;
          parts = [road2, commune].filter(Boolean);
        }
      } catch {}
    }
    const formatted = parts.join(', ');
    return formatted || null;
  } catch {
    return null;
  }
}

export async function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  try {
    try { await (Geolocation as any).requestPermissions?.(); } catch {}
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 12000,
      maximumAge: (options as any)?.maximumAge ?? 0,
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
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 12000,
        maximumAge: (options as any)?.maximumAge ?? 0,
      } as any);
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
    const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 12000, maximumAge: maxAgeMs });
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

export function watchUserLocation(callback: (coords: LatLng) => void): () => void {
  let cleared = false;
  let id: any = null;
  try {
    id = (Geolocation as any).watchPosition({ enableHighAccuracy: true }, (pos: any) => {
      if (cleared || !pos) return;
      const c = { lat: pos?.coords?.latitude, lng: pos?.coords?.longitude };
      if (typeof c.lat === 'number' && typeof c.lng === 'number') {
        try {
          sessionStorage.setItem('userLocation', JSON.stringify(c));
          sessionStorage.setItem('userLocationTs', String(Date.now()));
        } catch {}
        callback(c);
      }
    });
    return () => {
      cleared = true;
      try { (Geolocation as any).clearWatch({ id }); } catch {}
    };
  } catch {
    if (!('geolocation' in navigator)) return () => { cleared = true; };
    id = navigator.geolocation.watchPosition(
      (pos) => {
        if (cleared || !pos) return;
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          sessionStorage.setItem('userLocation', JSON.stringify(c));
          sessionStorage.setItem('userLocationTs', String(Date.now()));
        } catch {}
        callback(c);
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => { cleared = true; try { navigator.geolocation.clearWatch(id); } catch {} };
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

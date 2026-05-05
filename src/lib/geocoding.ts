export interface GeocodeResult {
  displayName: string;
  lat: number;
  lon: number;
}

interface NominatimRow {
  display_name: string;
  lat: string;
  lon: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function searchPlaces(
  query: string,
  options?: { signal?: AbortSignal; limit?: number },
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('limit', String(options?.limit ?? 5));
  url.searchParams.set('addressdetails', '0');

  const response = await fetch(url.toString(), {
    method: 'GET',
    signal: options?.signal,
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed: HTTP ${response.status}`);
  }

  const rows = (await response.json()) as NominatimRow[];
  return rows.map((row) => ({
    displayName: row.display_name,
    lat: Number.parseFloat(row.lat),
    lon: Number.parseFloat(row.lon),
  }));
}

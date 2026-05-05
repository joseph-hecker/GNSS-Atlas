export type Datum = 'WGS-84';

export interface Location {
  lat: number;
  lon: number;
  datum: Datum;
}

export interface LocationState {
  location: Location;
  selectedTimeUtc: Date;
}

export const DEFAULT_LOCATION: Location = {
  lat: 51.4769,
  lon: -0.0005,
  datum: 'WGS-84',
};

export function isValidLat(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isValidLon(lon: number): boolean {
  return Number.isFinite(lon) && lon >= -180 && lon <= 180;
}

export function clampToTimeBounds(
  candidate: Date,
  bounds: { min: Date; max: Date },
): Date {
  const t = candidate.getTime();
  if (t < bounds.min.getTime()) return new Date(bounds.min);
  if (t > bounds.max.getTime()) return new Date(bounds.max);
  return candidate;
}

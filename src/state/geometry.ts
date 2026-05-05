export type LatLon = [number, number];

export interface PointGeometry {
  id: string;
  kind: 'point';
  coord: LatLon;
}

export interface LineGeometry {
  id: string;
  kind: 'line';
  vertices: LatLon[];
}

export interface PolygonGeometry {
  id: string;
  kind: 'polygon';
  vertices: LatLon[];
}

export interface CircleGeometry {
  id: string;
  kind: 'circle';
  center: LatLon;
  radiusKm: number;
}

export type GeoGeometry =
  | PointGeometry
  | LineGeometry
  | PolygonGeometry
  | CircleGeometry;

export const EARTH_RADIUS_KM = 6371.0088;

export function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

/** Spherical great-circle distance between two lat/lon points (km). */
export function greatCircleDistanceKm(a: LatLon, b: LatLon): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const dPhi = toRad(lat2 - lat1);
  const dLambda = toRad(lon2 - lon1);
  const sinDPhi = Math.sin(dPhi / 2);
  const sinDLambda = Math.sin(dLambda / 2);
  const aa =
    sinDPhi * sinDPhi +
    Math.cos(phi1) * Math.cos(phi2) * sinDLambda * sinDLambda;
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return EARTH_RADIUS_KM * c;
}

/** Convert a great-circle radius in km to angular radius in degrees. */
export function kmToAngularDegrees(km: number): number {
  return (km / EARTH_RADIUS_KM) * (180 / Math.PI);
}

/** Convert an angular radius in degrees to km. */
export function angularDegreesToKm(deg: number): number {
  return (deg * Math.PI) / 180 * EARTH_RADIUS_KM;
}

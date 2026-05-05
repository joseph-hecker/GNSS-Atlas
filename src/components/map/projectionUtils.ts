import { geoCircle, type GeoProjection } from 'd3-geo';
import type { LatLon } from '@/state/geometry';
import { kmToAngularDegrees } from '@/state/geometry';

export interface InvertedPoint {
  lat: number;
  lon: number;
}

/** Convert client (page) coordinates to SVG-local pixel coordinates. */
export function clientToSvg(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): [number, number] {
  const rect = svg.getBoundingClientRect();
  return [clientX - rect.left, clientY - rect.top];
}

/**
 * Invert a pixel coordinate to lat/lon. Returns null if the projection
 * cannot invert this point or it falls outside the visible globe.
 */
export function safeInvert(
  projection: GeoProjection,
  point: [number, number],
): InvertedPoint | null {
  const invert = projection.invert;
  if (!invert) return null;
  const result = invert.call(projection, point);
  if (!result) return null;
  const [lon, lat] = result;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export function project(
  projection: GeoProjection,
  coord: LatLon,
): [number, number] | null {
  const [lat, lon] = coord;
  const result = projection([lon, lat]);
  if (!result) return null;
  if (!Number.isFinite(result[0]) || !Number.isFinite(result[1])) return null;
  return result as [number, number];
}

/** Build a GeoJSON polygon approximating a spherical small-circle. */
export function buildCircleFeature(
  center: LatLon,
  radiusKm: number,
  precision = 64,
) {
  const [lat, lon] = center;
  return geoCircle()
    .center([lon, lat])
    .radius(kmToAngularDegrees(radiusKm))
    .precision(360 / precision)();
}

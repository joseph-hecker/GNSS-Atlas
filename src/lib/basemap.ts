import { feature } from 'topojson-client';
import landData from 'world-atlas/land-110m.json';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

let cached: FeatureCollection<Geometry> | null = null;

export function getLandFeatures(): FeatureCollection<Geometry> {
  if (cached) return cached;
  const topology = landData;
  const land = feature(topology, topology.objects.land) as
    | Feature<Geometry>
    | FeatureCollection<Geometry>;
  if ('features' in land) {
    cached = land;
  } else {
    cached = {
      type: 'FeatureCollection',
      features: [land],
    };
  }
  return cached;
}

export function getSphereFeature(): { type: 'Sphere' } {
  return { type: 'Sphere' };
}

export function getGraticule(step = 30): { type: 'MultiLineString'; coordinates: number[][][] } {
  const lines: number[][][] = [];
  for (let lon = -180; lon <= 180; lon += step) {
    const meridian: number[][] = [];
    for (let lat = -80; lat <= 80; lat += 5) meridian.push([lon, lat]);
    lines.push(meridian);
  }
  for (let lat = -60; lat <= 60; lat += step) {
    const parallel: number[][] = [];
    for (let lon = -180; lon <= 180; lon += 5) parallel.push([lon, lat]);
    lines.push(parallel);
  }
  return { type: 'MultiLineString', coordinates: lines };
}

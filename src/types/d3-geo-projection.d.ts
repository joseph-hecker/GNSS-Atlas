declare module 'd3-geo-projection' {
  import type { GeoProjection } from 'd3-geo';

  export function geoBonne(): GeoProjection & {
    parallel(): number;
    parallel(angle: number): GeoProjection & { parallel: () => number };
  };
  export function geoPolyhedralWaterman(): GeoProjection & {
    parents?: () => number[][];
  };
  export function geoInterruptedHomolosine(): GeoProjection;
  export function geoStereographic(): GeoProjection;

  export function geoProject<T>(object: T, projection: GeoProjection): T;
}

import {
  degreesLat,
  degreesLong,
  ecfToLookAngles,
  eciToEcf,
  eciToGeodetic,
  gstime,
  propagate,
  twoline2satrec,
  type EciVec3,
  type Kilometer,
  type KilometerPerSecond,
  type SatRec,
} from 'satellite.js';
import type { TleRecord } from './tle';
import type { Location } from '@/state/location';

export interface SatelliteRuntime {
  norad: number;
  name: string;
  prn: string | null;
  satrec: SatRec;
}

export interface SatelliteState {
  runtime: SatelliteRuntime;
  /** Sub-satellite latitude (degrees) */
  subLat: number;
  /** Sub-satellite longitude (degrees) */
  subLon: number;
  /** Altitude above WGS-84 ellipsoid (km) */
  altitudeKm: number;
  /** Speed magnitude (km/s) */
  speedKmS: number;
  /** Azimuth from observer (degrees, 0 = north, increasing clockwise) */
  azimuth: number;
  /** Elevation from observer (degrees; negative = below horizon) */
  elevation: number;
  /** Slant range from observer (km) */
  rangeKm: number;
  /** True iff elevation >= 0 */
  visible: boolean;
}

const PRN_REGEX = /\(PRN\s*(\d+)\)/i;

const RAD2DEG = 180 / Math.PI;
const DEG2RAD = Math.PI / 180;

export function buildRuntimes(records: TleRecord[]): SatelliteRuntime[] {
  const runtimes: SatelliteRuntime[] = [];
  for (const rec of records) {
    try {
      const satrec = twoline2satrec(rec.line1, rec.line2);
      const norad = Number.parseInt(satrec.satnum, 10);
      const match = PRN_REGEX.exec(rec.name);
      runtimes.push({
        norad,
        name: rec.name.trim(),
        prn: match ? match[1] : null,
        satrec,
      });
    } catch {
      // skip records satellite.js refuses
    }
  }
  return runtimes;
}

function isVec(
  v: EciVec3<Kilometer> | EciVec3<KilometerPerSecond> | boolean,
): v is EciVec3<number> {
  return typeof v === 'object' && v !== null && 'x' in v;
}

export function propagateAll(
  runtimes: SatelliteRuntime[],
  when: Date,
  observer: Location,
): SatelliteState[] {
  const gmst = gstime(when);
  const observerGeodetic = {
    longitude: observer.lon * DEG2RAD,
    latitude: observer.lat * DEG2RAD,
    height: 0,
  };

  const out: SatelliteState[] = [];
  for (const runtime of runtimes) {
    try {
      const result = propagate(runtime.satrec, when);
      if (!result || !isVec(result.position) || !isVec(result.velocity)) {
        continue;
      }
      const pos = result.position;
      const vel = result.velocity;
      const geodetic = eciToGeodetic(pos, gmst);
      const ecf = eciToEcf(pos, gmst);
      const look = ecfToLookAngles(observerGeodetic, ecf);
      const subLat = degreesLat(geodetic.latitude);
      const subLon = ((degreesLong(geodetic.longitude) + 540) % 360) - 180;
      const altitudeKm = geodetic.height;
      const speedKmS = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
      const elevation = look.elevation * RAD2DEG;
      const azimuth = ((look.azimuth * RAD2DEG) + 360) % 360;
      out.push({
        runtime,
        subLat,
        subLon,
        altitudeKm,
        speedKmS,
        azimuth,
        elevation,
        rangeKm: look.rangeSat,
        visible: elevation >= 0,
      });
    } catch {
      // skip propagation errors
    }
  }
  return out;
}

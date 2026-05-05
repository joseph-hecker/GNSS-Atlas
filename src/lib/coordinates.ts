import proj4 from 'proj4';
import { forward as mgrsForward } from 'mgrs';

export interface UtmCoord {
  zone: number;
  hemisphere: 'N' | 'S';
  easting: number;
  northing: number;
}

export interface DmsParts {
  degrees: number;
  minutes: number;
  seconds: number;
  hemisphere: 'N' | 'S' | 'E' | 'W';
}

const WGS84 = '+proj=longlat +datum=WGS84 +no_defs';

/** Standard 6-degree UTM zone for a given longitude. */
export function utmZoneFor(lon: number): number {
  return Math.floor((lon + 180) / 6) + 1;
}

/** Central meridian of a UTM zone (degrees). */
export function utmCentralMeridian(zone: number): number {
  return (zone - 1) * 6 - 180 + 3;
}

export function isUtmDefined(lat: number): boolean {
  return lat >= -80 && lat <= 84;
}

export function toUtm(lat: number, lon: number): UtmCoord | null {
  if (!isUtmDefined(lat)) return null;
  const zone = utmZoneFor(lon);
  const south = lat < 0;
  const utmProj = `+proj=utm +zone=${zone} ${south ? '+south ' : ''}+ellps=WGS84 +datum=WGS84 +units=m +no_defs`;
  try {
    const [easting, northing] = proj4(WGS84, utmProj, [lon, lat]);
    return {
      zone,
      hemisphere: south ? 'S' : 'N',
      easting,
      northing,
    };
  } catch {
    return null;
  }
}

export function toMgrs(lat: number, lon: number, precision = 5): string | null {
  if (!isUtmDefined(lat)) return null;
  try {
    return mgrsForward([lon, lat], precision);
  } catch {
    return null;
  }
}

export function decimalToDms(value: number, axis: 'lat' | 'lon'): DmsParts {
  const positive = value >= 0;
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minFloat = (abs - degrees) * 60;
  const minutes = Math.floor(minFloat);
  const seconds = (minFloat - minutes) * 60;
  const hemisphere: DmsParts['hemisphere'] =
    axis === 'lat' ? (positive ? 'N' : 'S') : positive ? 'E' : 'W';
  return { degrees, minutes, seconds, hemisphere };
}

export function formatDms(parts: DmsParts): string {
  const sec = parts.seconds.toFixed(2);
  return `${parts.degrees}°${String(parts.minutes).padStart(2, '0')}'${sec.padStart(5, '0')}"${parts.hemisphere}`;
}

export function formatLatLonDms(lat: number, lon: number): string {
  return `${formatDms(decimalToDms(lat, 'lat'))} ${formatDms(decimalToDms(lon, 'lon'))}`;
}

export function formatDecimal(lat: number, lon: number, fractionDigits = 5): string {
  return `${lat.toFixed(fractionDigits)}, ${lon.toFixed(fractionDigits)}`;
}

export function formatUtm(utm: UtmCoord): string {
  const e = utm.easting.toFixed(0).padStart(6, '0');
  const n = utm.northing.toFixed(0).padStart(7, '0');
  return `${utm.zone}${utm.hemisphere} ${e}E ${n}N`;
}

const DMS_PATTERN =
  /^\s*(-?\d+(?:\.\d+)?)(?:\s*°|\s*deg|\s+)\s*(?:(\d+(?:\.\d+)?)(?:\s*['′m]|\s+)\s*)?(?:(\d+(?:\.\d+)?)(?:\s*["″s])?\s*)?([NSEWnsew])?\s*$/;

interface ParsedAxis {
  decimal: number;
  hemisphere: 'N' | 'S' | 'E' | 'W' | null;
}

function parseDmsAxis(input: string): ParsedAxis | null {
  const match = DMS_PATTERN.exec(input);
  if (!match) return null;
  const degrees = parseFloat(match[1]);
  const minutes = match[2] ? parseFloat(match[2]) : 0;
  const seconds = match[3] ? parseFloat(match[3]) : 0;
  const hemisphereRaw = match[4]?.toUpperCase() as ParsedAxis['hemisphere'];

  if (
    !Number.isFinite(degrees) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds)
  ) {
    return null;
  }
  if (minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60) {
    return null;
  }

  const sign = degrees < 0 ? -1 : 1;
  let value = Math.abs(degrees) + minutes / 60 + seconds / 3600;
  value *= sign;

  if (hemisphereRaw === 'S' || hemisphereRaw === 'W') {
    value = -Math.abs(value);
  } else if (hemisphereRaw === 'N' || hemisphereRaw === 'E') {
    value = Math.abs(value);
  }

  return { decimal: value, hemisphere: hemisphereRaw ?? null };
}

/**
 * Parse a free-form lat/lon DMS string. Accepts patterns like:
 *   51°28'40"N 0°00'05"W
 *   51 28 40 N, 0 0 5 W
 *   -33.8568, 151.2153   (also accepts decimals)
 *   33d51m24sS 151d12m55sE
 */
export function parseDmsLatLon(
  input: string,
): { lat: number; lon: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const splitters = [',', ';', '/', /\s+(?=-?\d)/];
  let parts: string[] | null = null;
  for (const splitter of splitters) {
    const candidate =
      typeof splitter === 'string'
        ? trimmed.split(splitter).map((p) => p.trim()).filter(Boolean)
        : trimmed.split(splitter).map((p) => p.trim()).filter(Boolean);
    if (candidate.length === 2) {
      parts = candidate;
      break;
    }
  }
  if (!parts) {
    const tokens = trimmed.split(/\s+/);
    if (tokens.length >= 2) {
      parts = [tokens.slice(0, Math.ceil(tokens.length / 2)).join(' '), tokens.slice(Math.ceil(tokens.length / 2)).join(' ')];
    }
  }
  if (!parts || parts.length !== 2) return null;

  const a = parseDmsAxis(parts[0]);
  const b = parseDmsAxis(parts[1]);
  if (!a || !b) return null;

  let lat: number | null = null;
  let lon: number | null = null;

  if (a.hemisphere === 'N' || a.hemisphere === 'S') {
    lat = a.decimal;
  } else if (a.hemisphere === 'E' || a.hemisphere === 'W') {
    lon = a.decimal;
  }
  if (b.hemisphere === 'N' || b.hemisphere === 'S') {
    lat = b.decimal;
  } else if (b.hemisphere === 'E' || b.hemisphere === 'W') {
    lon = b.decimal;
  }

  if (lat === null && lon === null) {
    lat = a.decimal;
    lon = b.decimal;
  } else if (lat === null) {
    lat = a.hemisphere ? b.decimal : a.decimal;
  } else if (lon === null) {
    lon = a.hemisphere ? b.decimal : a.decimal;
  }

  if (lat === null || lon === null) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { lat, lon };
}

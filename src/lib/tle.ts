export interface TleRecord {
  name: string;
  line1: string;
  line2: string;
}

export interface TleSet {
  records: TleRecord[];
  fetchedAt: number;
  source: 'celestrak' | 'fallback' | 'cache';
  /** Most recent TLE epoch, parsed from line1 (year + day-of-year) */
  epoch: Date;
}

const CELESTRAK_URL =
  'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle';
const FALLBACK_URL = '/tles/gps-ops.fallback.tle';
const CACHE_KEY = 'gnss-atlas:tle:gps-ops:v2';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachePayload {
  records: TleRecord[];
  fetchedAt: number;
  source: 'celestrak' | 'fallback';
}

function readCache(): CachePayload | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachePayload;
    if (!Array.isArray(parsed.records) || !parsed.records.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(payload: CachePayload): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / privacy-mode failures
  }
}

export function parseTleText(text: string): TleRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const records: TleRecord[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('1 ') && i > 0 && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (next.startsWith('2 ')) {
        records.push({
          name: lines[i - 1],
          line1: line,
          line2: next,
        });
        i += 1;
      }
    }
  }
  return records;
}

/** Decode the YYDDD.fffffff epoch in TLE line1 columns 19-32 to a Date. */
function tleEpochToDate(line1: string): Date | null {
  const epochStr = line1.substring(18, 32).trim();
  const yy = Number.parseInt(epochStr.substring(0, 2), 10);
  const dayOfYear = Number.parseFloat(epochStr.substring(2));
  if (!Number.isFinite(yy) || !Number.isFinite(dayOfYear)) return null;
  const year = yy < 57 ? 2000 + yy : 1900 + yy;
  const dayMs = (dayOfYear - 1) * 86_400_000;
  const yearStart = Date.UTC(year, 0, 1);
  return new Date(yearStart + dayMs);
}

function mostRecentEpoch(records: TleRecord[]): Date {
  let max = 0;
  for (const rec of records) {
    const d = tleEpochToDate(rec.line1);
    if (d && d.getTime() > max) max = d.getTime();
  }
  return new Date(max || Date.now());
}

async function fetchFromCelestrak(): Promise<TleRecord[]> {
  const response = await fetch(CELESTRAK_URL, {
    method: 'GET',
    headers: { Accept: 'text/plain' },
  });
  if (!response.ok) {
    throw new Error(`CelesTrak HTTP ${response.status}`);
  }
  const text = await response.text();
  const records = parseTleText(text);
  if (records.length === 0) {
    throw new Error('CelesTrak returned no parsable TLE records');
  }
  return records;
}

async function fetchFallback(): Promise<TleRecord[]> {
  const response = await fetch(FALLBACK_URL, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`Fallback HTTP ${response.status}`);
  }
  return parseTleText(await response.text());
}

export async function loadGpsTles(): Promise<TleSet> {
  const cached = readCache();
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return {
      records: cached.records,
      fetchedAt: cached.fetchedAt,
      source: 'cache',
      epoch: mostRecentEpoch(cached.records),
    };
  }

  try {
    const records = await fetchFromCelestrak();
    const fetchedAt = Date.now();
    writeCache({ records, fetchedAt, source: 'celestrak' });
    return {
      records,
      fetchedAt,
      source: 'celestrak',
      epoch: mostRecentEpoch(records),
    };
  } catch {
    if (cached) {
      return {
        records: cached.records,
        fetchedAt: cached.fetchedAt,
        source: 'cache',
        epoch: mostRecentEpoch(cached.records),
      };
    }
    const records = await fetchFallback();
    return {
      records,
      fetchedAt: Date.now(),
      source: 'fallback',
      epoch: mostRecentEpoch(records),
    };
  }
}

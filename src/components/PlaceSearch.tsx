import { useEffect, useRef, useState } from 'react';
import { useLocation } from '@/state/LocationContext';
import { searchPlaces, type GeocodeResult } from '@/lib/geocoding';

export default function PlaceSearch() {
  const { setLocation } = useLocation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    const handle = window.setTimeout(async () => {
      setBusy(true);
      setError(null);
      try {
        const matches = await searchPlaces(query, {
          signal: controller.signal,
          limit: 6,
        });
        if (!controller.signal.aborted) {
          setResults(matches);
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(
            e instanceof Error
              ? `Search failed: ${e.message}`
              : 'Search failed.',
          );
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setBusy(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(handle);
      controller.abort();
    };
  }, [query]);

  function pick(result: GeocodeResult) {
    setLocation(result.lat, result.lon);
    setQuery('');
    setResults([]);
  }

  return (
    <div className="space-y-2">
      <label className="label" htmlFor="place-search">
        Search a place
      </label>
      <input
        id="place-search"
        className="input"
        placeholder="Mt Everest, Tokyo, ..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      {busy && (
        <div className="text-xs text-slate-500">Searching…</div>
      )}
      {error && (
        <div className="text-xs text-rose-400 leading-snug">{error}</div>
      )}
      {results.length > 0 && (
        <ul className="rounded-md border border-slate-800 divide-y divide-slate-800 max-h-48 overflow-y-auto">
          {results.map((r) => (
            <li key={`${r.lat},${r.lon},${r.displayName}`}>
              <button
                type="button"
                onClick={() => pick(r)}
                className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-800"
              >
                <div className="text-slate-200 line-clamp-2">{r.displayName}</div>
                <div className="text-slate-500 font-mono mt-0.5">
                  {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="text-[10px] text-slate-600">
        Powered by OpenStreetMap Nominatim. Be kind.
      </div>
    </div>
  );
}

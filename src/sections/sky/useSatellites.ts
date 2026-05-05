import { useEffect, useMemo, useState } from 'react';
import { loadGpsTles, type TleSet } from '@/lib/tle';
import {
  buildRuntimes,
  propagateAll,
  type SatelliteRuntime,
  type SatelliteState,
} from '@/lib/satellites';
import { useLocation } from '@/state/LocationContext';

interface TleResult {
  set: TleSet | null;
  loading: boolean;
  error: string | null;
}

export function useTleSet(): TleResult {
  const [state, setState] = useState<TleResult>({
    set: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ set: null, loading: true, error: null });
    loadGpsTles()
      .then((set) => {
        if (!cancelled) setState({ set, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            set: null,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

export function useRuntimes(set: TleSet | null): SatelliteRuntime[] {
  return useMemo(() => (set ? buildRuntimes(set.records) : []), [set]);
}

export function useSatelliteStates(
  runtimes: SatelliteRuntime[],
): SatelliteState[] {
  const { location, selectedTimeUtc } = useLocation();
  return useMemo(
    () => propagateAll(runtimes, selectedTimeUtc, location),
    [runtimes, selectedTimeUtc, location],
  );
}

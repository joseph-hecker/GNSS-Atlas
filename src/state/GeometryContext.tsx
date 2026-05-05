import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import type { GeoGeometry } from './geometry';

type Action =
  | { type: 'ADD'; payload: GeoGeometry }
  | { type: 'UPDATE'; payload: GeoGeometry }
  | { type: 'DELETE'; payload: { id: string } }
  | { type: 'REPLACE_ALL'; payload: GeoGeometry[] };

function reducer(state: GeoGeometry[], action: Action): GeoGeometry[] {
  switch (action.type) {
    case 'ADD':
      return [...state, action.payload];
    case 'UPDATE':
      return state.map((g) => (g.id === action.payload.id ? action.payload : g));
    case 'DELETE':
      return state.filter((g) => g.id !== action.payload.id);
    case 'REPLACE_ALL':
      return action.payload;
    default:
      return state;
  }
}

interface GeometryContextValue {
  geometries: GeoGeometry[];
  add: (g: GeoGeometry) => void;
  update: (g: GeoGeometry) => void;
  remove: (id: string) => void;
  replaceAll: (gs: GeoGeometry[]) => void;
}

const GeometryContext = createContext<GeometryContextValue | undefined>(
  undefined,
);

export function GeometryProvider({ children }: { children: ReactNode }) {
  const [geometries, dispatch] = useReducer(reducer, []);

  const add = useCallback((g: GeoGeometry) => dispatch({ type: 'ADD', payload: g }), []);
  const update = useCallback(
    (g: GeoGeometry) => dispatch({ type: 'UPDATE', payload: g }),
    [],
  );
  const remove = useCallback(
    (id: string) => dispatch({ type: 'DELETE', payload: { id } }),
    [],
  );
  const replaceAll = useCallback(
    (gs: GeoGeometry[]) => dispatch({ type: 'REPLACE_ALL', payload: gs }),
    [],
  );

  const value = useMemo(
    () => ({ geometries, add, update, remove, replaceAll }),
    [geometries, add, update, remove, replaceAll],
  );

  return (
    <GeometryContext.Provider value={value}>
      {children}
    </GeometryContext.Provider>
  );
}

export function useGeometries(): GeometryContextValue {
  const ctx = useContext(GeometryContext);
  if (!ctx) {
    throw new Error('useGeometries() must be used inside <GeometryProvider>');
  }
  return ctx;
}

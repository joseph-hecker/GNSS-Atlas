import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCATION,
  isValidLat,
  isValidLon,
  type Location,
  type LocationState,
} from './location';

type Action =
  | { type: 'SET_LOCATION'; payload: { lat: number; lon: number } }
  | { type: 'SET_TIME'; payload: Date };

function reducer(state: LocationState, action: Action): LocationState {
  switch (action.type) {
    case 'SET_LOCATION': {
      const { lat, lon } = action.payload;
      if (!isValidLat(lat) || !isValidLon(lon)) {
        return state;
      }
      return {
        ...state,
        location: { ...state.location, lat, lon },
      };
    }
    case 'SET_TIME': {
      return { ...state, selectedTimeUtc: action.payload };
    }
    default:
      return state;
  }
}

interface LocationContextValue extends LocationState {
  setLocation: (lat: number, lon: number) => void;
  setTime: (when: Date) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(
  undefined,
);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    location: { ...DEFAULT_LOCATION },
    selectedTimeUtc: new Date(),
  }));

  const setLocation = useCallback((lat: number, lon: number) => {
    dispatch({ type: 'SET_LOCATION', payload: { lat, lon } });
  }, []);

  const setTime = useCallback((when: Date) => {
    dispatch({ type: 'SET_TIME', payload: when });
  }, []);

  const value = useMemo(
    () => ({ ...state, setLocation, setTime }),
    [state, setLocation, setTime],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextValue {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useLocation() must be used inside <LocationProvider>');
  }
  return ctx;
}

export type { Location };

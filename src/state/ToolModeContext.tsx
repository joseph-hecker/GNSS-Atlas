import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ToolMode =
  | 'select'
  | 'draw-point'
  | 'draw-line'
  | 'draw-polygon'
  | 'draw-circle'
  | 'delete';

interface ToolModeContextValue {
  mode: ToolMode;
  setMode: (mode: ToolMode) => void;
}

const ToolModeContext = createContext<ToolModeContextValue | undefined>(
  undefined,
);

export function ToolModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeRaw] = useState<ToolMode>('select');
  const setMode = useCallback((m: ToolMode) => setModeRaw(m), []);
  const value = useMemo(() => ({ mode, setMode }), [mode, setMode]);
  return (
    <ToolModeContext.Provider value={value}>
      {children}
    </ToolModeContext.Provider>
  );
}

export function useToolMode(): ToolModeContextValue {
  const ctx = useContext(ToolModeContext);
  if (!ctx) {
    throw new Error('useToolMode() must be used inside <ToolModeProvider>');
  }
  return ctx;
}

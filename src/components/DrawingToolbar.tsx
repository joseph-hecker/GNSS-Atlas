import { useToolMode, type ToolMode } from '@/state/ToolModeContext';
import { useGeometries } from '@/state/GeometryContext';

interface ToolDef {
  id: ToolMode;
  label: string;
  hint: string;
}

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', hint: 'Drag a shape or vertex to move it.' },
  {
    id: 'draw-point',
    label: 'Point',
    hint: 'Click anywhere to drop a point.',
  },
  {
    id: 'draw-line',
    label: 'Line',
    hint: 'Click to add vertices. Enter or double-click to finish.',
  },
  {
    id: 'draw-polygon',
    label: 'Polygon',
    hint: 'Click to add vertices. Enter or double-click to close.',
  },
  {
    id: 'draw-circle',
    label: 'Circle',
    hint: 'Click and drag from the center outward.',
  },
  {
    id: 'delete',
    label: 'Delete',
    hint: 'Click any shape to remove it.',
  },
];

export default function DrawingToolbar() {
  const { mode, setMode } = useToolMode();
  const { geometries, replaceAll } = useGeometries();
  const active = TOOLS.find((t) => t.id === mode) ?? TOOLS[0];

  return (
    <div className="panel">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" className="flex flex-wrap gap-1">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setMode(tool.id)}
              className={`btn ${mode === tool.id ? 'btn-active' : ''}`}
              aria-pressed={mode === tool.id}
            >
              {tool.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          <span>{geometries.length} shape{geometries.length === 1 ? '' : 's'}</span>
          <button
            type="button"
            className="btn"
            disabled={geometries.length === 0}
            onClick={() => replaceAll([])}
          >
            Clear all
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-2 leading-snug">
        {active.hint}
      </p>
    </div>
  );
}

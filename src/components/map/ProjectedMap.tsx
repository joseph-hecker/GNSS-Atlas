import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { geoPath, type GeoProjection } from 'd3-geo';
import {
  getLandFeatures,
  getGraticule,
  getSphereFeature,
} from '@/lib/basemap';
import { useLocation } from '@/state/LocationContext';
import { useGeometries } from '@/state/GeometryContext';
import { useToolMode, type ToolMode } from '@/state/ToolModeContext';
import { getProjectionMeta } from '@/projections/catalog';
import type { ProjectionId } from '@/projections/types';
import {
  greatCircleDistanceKm,
  makeId,
  type GeoGeometry,
  type LatLon,
} from '@/state/geometry';
import {
  buildCircleFeature,
  clientToSvg,
  project,
  safeInvert,
} from './projectionUtils';
import MapGeometries from './MapGeometries';

interface Props {
  projectionId: ProjectionId;
  showGraticule?: boolean;
  showLocationPin?: boolean;
  geometriesEnabled?: boolean;
  overlay?: ReactNode | ((projection: GeoProjection) => ReactNode);
  onMapClick?: (latLon: { lat: number; lon: number }) => void;
  className?: string;
}

type DrawState =
  | { kind: 'idle' }
  | { kind: 'line'; vertices: LatLon[] }
  | { kind: 'polygon'; vertices: LatLon[] }
  | {
      kind: 'circle';
      center: LatLon;
      currentRadiusKm: number;
      pointerId: number;
    };

type EditState =
  | { kind: 'idle' }
  | {
      kind: 'translate';
      geometry: GeoGeometry;
      lastLatLon: LatLon;
      pointerId: number;
    }
  | {
      kind: 'vertex';
      geometry: Extract<GeoGeometry, { kind: 'line' | 'polygon' }>;
      vertexIndex: number;
      pointerId: number;
    }
  | {
      kind: 'circle-edge';
      geometry: Extract<GeoGeometry, { kind: 'circle' }>;
      pointerId: number;
    };

export default function ProjectedMap({
  projectionId,
  showGraticule = true,
  showLocationPin = true,
  geometriesEnabled = false,
  overlay,
  onMapClick,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const { location } = useLocation();
  const { geometries, add, update, remove } = useGeometries();
  const { mode } = useToolMode();
  const meta = useMemo(() => getProjectionMeta(projectionId), [projectionId]);

  const editable = meta.supportsInvert;
  const activeMode: ToolMode | 'none' = geometriesEnabled ? mode : 'none';

  // Track container size
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    const rect = el.getBoundingClientRect();
    setSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
    return () => ro.disconnect();
  }, []);

  const projection = useMemo(() => {
    const proj = meta.build({ location });
    if (size.w > 4 && size.h > 4) {
      try {
        proj.fitExtent(
          [
            [8, 8],
            [size.w - 8, size.h - 8],
          ],
          getSphereFeature(),
        );
      } catch {
        // Some exotic projections (e.g., Waterman) can throw on fitExtent
        // for the full sphere. Fall back to fitSize.
        try {
          proj.fitSize([size.w, size.h], getSphereFeature());
        } catch {
          // give up — projection will use its default scale
        }
      }
    }
    return proj;
  }, [meta, location, size.w, size.h]);

  const pathGen = useMemo(() => geoPath(projection), [projection]);

  const land = useMemo(() => getLandFeatures(), []);
  const graticule = useMemo(() => getGraticule(15), []);
  const sphereD = useMemo(() => pathGen(getSphereFeature()) ?? undefined, [pathGen]);
  const graticuleD = useMemo(() => pathGen(graticule) ?? undefined, [pathGen, graticule]);
  const landPaths = useMemo(
    () =>
      land.features
        .map((f) => pathGen(f) ?? undefined)
        .filter(Boolean) as string[],
    [land, pathGen],
  );

  // ─────────── Drawing state ───────────
  const [drawState, setDrawState] = useState<DrawState>({ kind: 'idle' });
  const [editState, setEditState] = useState<EditState>({ kind: 'idle' });

  // Reset drawing state when mode changes
  useEffect(() => {
    setDrawState({ kind: 'idle' });
    setEditState({ kind: 'idle' });
  }, [activeMode]);

  // ─────────── Helpers ───────────

  const invertEvent = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const point = clientToSvg(svg, e.clientX, e.clientY);
      return safeInvert(projection, point);
    },
    [projection],
  );

  const handleBackgroundClick = useCallback(
    (e: ReactPointerEvent<SVGRectElement>) => {
      // Only treat as a click on pointer-up at the same position; we use
      // explicit click events on the overlay below.
      if (e.button !== 0) return;
    },
    [],
  );

  const onSvgClick = useCallback(
    (clientX: number, clientY: number) => {
      const inverted = invertEvent({ clientX, clientY });

      if (!editable) return; // view-only; ignore

      if (activeMode === 'none' || activeMode === 'select') {
        if (inverted) onMapClick?.(inverted);
        return;
      }

      if (!inverted) return;
      const ll: LatLon = [inverted.lat, inverted.lon];

      switch (activeMode) {
        case 'draw-point':
          add({ id: makeId('pt'), kind: 'point', coord: ll });
          break;
        case 'draw-line':
          if (drawState.kind === 'line') {
            setDrawState({ kind: 'line', vertices: [...drawState.vertices, ll] });
          } else {
            setDrawState({ kind: 'line', vertices: [ll] });
          }
          break;
        case 'draw-polygon':
          if (drawState.kind === 'polygon') {
            setDrawState({
              kind: 'polygon',
              vertices: [...drawState.vertices, ll],
            });
          } else {
            setDrawState({ kind: 'polygon', vertices: [ll] });
          }
          break;
        case 'delete':
          // Background clicks in delete mode do nothing.
          break;
        default:
          break;
      }
    },
    [activeMode, add, drawState, editable, invertEvent, onMapClick],
  );

  const finalizeDrawing = useCallback(() => {
    if (drawState.kind === 'line' && drawState.vertices.length >= 2) {
      add({ id: makeId('ln'), kind: 'line', vertices: drawState.vertices });
    } else if (drawState.kind === 'polygon' && drawState.vertices.length >= 3) {
      add({
        id: makeId('pg'),
        kind: 'polygon',
        vertices: drawState.vertices,
      });
    }
    setDrawState({ kind: 'idle' });
  }, [drawState, add]);

  // Keyboard: Enter finalizes line/polygon, Escape cancels
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        finalizeDrawing();
      } else if (e.key === 'Escape') {
        setDrawState({ kind: 'idle' });
      }
    }
    if (drawState.kind === 'line' || drawState.kind === 'polygon') {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [drawState, finalizeDrawing]);

  // Circle drawing pointer interactions
  const onSvgPointerDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!editable) return;
      if (activeMode !== 'draw-circle') return;
      // Only start a circle if click target was background (handled by onPointerDown
      // bubble + checking we aren't grabbing a handle; we'll guard via stopPropagation
      // on geometry handles).
      const inverted = invertEvent(e);
      if (!inverted) return;
      const center: LatLon = [inverted.lat, inverted.lon];
      e.currentTarget.setPointerCapture(e.pointerId);
      setDrawState({
        kind: 'circle',
        center,
        currentRadiusKm: 0,
        pointerId: e.pointerId,
      });
    },
    [activeMode, editable, invertEvent],
  );

  const onSvgPointerMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (drawState.kind === 'circle' && drawState.pointerId === e.pointerId) {
        const inverted = invertEvent(e);
        if (!inverted) return;
        const here: LatLon = [inverted.lat, inverted.lon];
        const radius = greatCircleDistanceKm(drawState.center, here);
        setDrawState({ ...drawState, currentRadiusKm: radius });
        return;
      }
      if (editState.kind !== 'idle' && editState.pointerId === e.pointerId) {
        handleEditMove(e);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState, editState, invertEvent],
  );

  const onSvgPointerUp = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (drawState.kind === 'circle' && drawState.pointerId === e.pointerId) {
        if (drawState.currentRadiusKm > 1) {
          add({
            id: makeId('ci'),
            kind: 'circle',
            center: drawState.center,
            radiusKm: drawState.currentRadiusKm,
          });
        }
        e.currentTarget.releasePointerCapture(e.pointerId);
        setDrawState({ kind: 'idle' });
        return;
      }
      if (editState.kind !== 'idle' && editState.pointerId === e.pointerId) {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setEditState({ kind: 'idle' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [drawState, editState, add],
  );

  // Track if the pointerdown started on a geometry so we can suppress click on background
  const downStartedOnGeometry = useRef(false);

  const onSvgPointerDownCapture = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      const target = e.target as Element | null;
      downStartedOnGeometry.current = !!target?.closest('.geometries');
    },
    [],
  );

  // Handle "click" — fire only if this wasn't a drag and didn't start on a geometry
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const onSvgPointerDownTrack = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      downAt.current = { x: e.clientX, y: e.clientY };
    },
    [],
  );
  const onSvgClickHandler = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (downStartedOnGeometry.current) return;
      const start = downAt.current;
      if (start) {
        const dx = Math.abs(e.clientX - start.x);
        const dy = Math.abs(e.clientY - start.y);
        if (dx + dy > 4) return; // treat as drag, not click
      }
      onSvgClick(e.clientX, e.clientY);
    },
    [onSvgClick],
  );

  // ─────────── Edit-mode interactions ───────────

  function handleEditMove(e: ReactPointerEvent<SVGSVGElement>) {
    const inverted = invertEvent(e);
    if (!inverted) return;
    const here: LatLon = [inverted.lat, inverted.lon];
    if (editState.kind === 'translate') {
      const [dLat, dLon] = [
        here[0] - editState.lastLatLon[0],
        here[1] - editState.lastLatLon[1],
      ];
      const moved = translateGeometry(editState.geometry, dLat, dLon);
      update(moved);
      setEditState({ ...editState, lastLatLon: here, geometry: moved });
    } else if (editState.kind === 'vertex') {
      const newVertices = [...editState.geometry.vertices];
      newVertices[editState.vertexIndex] = here;
      const updated = { ...editState.geometry, vertices: newVertices };
      update(updated);
      setEditState({ ...editState, geometry: updated });
    } else if (editState.kind === 'circle-edge') {
      const radius = greatCircleDistanceKm(editState.geometry.center, here);
      const updated = { ...editState.geometry, radiusKm: radius };
      update(updated);
      setEditState({ ...editState, geometry: updated });
    }
  }

  const onPointerDownGeometry = useCallback(
    (
      geometry: GeoGeometry,
      target:
        | 'body'
        | { kind: 'vertex'; index: number }
        | { kind: 'circle-edge' },
      e: ReactPointerEvent<SVGElement>,
    ) => {
      if (!editable) return;
      if (activeMode === 'delete') {
        e.stopPropagation();
        remove(geometry.id);
        return;
      }
      if (activeMode !== 'select') return;
      const inverted = invertEvent(e);
      if (!inverted) return;
      const here: LatLon = [inverted.lat, inverted.lon];
      svgRef.current?.setPointerCapture(e.pointerId);
      e.stopPropagation();
      if (target === 'body') {
        setEditState({
          kind: 'translate',
          geometry,
          lastLatLon: here,
          pointerId: e.pointerId,
        });
      } else if (target.kind === 'vertex' && (geometry.kind === 'line' || geometry.kind === 'polygon')) {
        setEditState({
          kind: 'vertex',
          geometry,
          vertexIndex: target.index,
          pointerId: e.pointerId,
        });
      } else if (target.kind === 'circle-edge' && geometry.kind === 'circle') {
        setEditState({
          kind: 'circle-edge',
          geometry,
          pointerId: e.pointerId,
        });
      }
    },
    [activeMode, editable, invertEvent, remove],
  );

  // Location pin
  const pin = useMemo(() => {
    if (!showLocationPin) return null;
    const p = project(projection, [location.lat, location.lon]);
    if (!p) return null;
    return p;
  }, [projection, location, showLocationPin]);

  // ─────────── Drawing previews ───────────

  const drawingPreview = useMemo(() => {
    switch (drawState.kind) {
      case 'line': {
        const ls = {
          type: 'LineString' as const,
          coordinates: drawState.vertices.map(([lat, lon]) => [lon, lat]),
        };
        return drawState.vertices.length >= 2 ? pathGen(ls) ?? undefined : undefined;
      }
      case 'polygon': {
        if (drawState.vertices.length < 2) return undefined;
        const ls = {
          type: 'LineString' as const,
          coordinates: drawState.vertices.map(([lat, lon]) => [lon, lat]),
        };
        return pathGen(ls) ?? undefined;
      }
      case 'circle': {
        if (drawState.currentRadiusKm <= 0) return undefined;
        return (
          pathGen(buildCircleFeature(drawState.center, drawState.currentRadiusKm)) ??
          undefined
        );
      }
      default:
        return undefined;
    }
  }, [drawState, pathGen]);

  const drawingVertices = useMemo(() => {
    if (drawState.kind !== 'line' && drawState.kind !== 'polygon') return [];
    return drawState.vertices
      .map((v) => project(projection, v))
      .filter((p): p is [number, number] => !!p);
  }, [drawState, projection]);

  const cursor = useMemo(() => {
    if (!editable) return 'not-allowed';
    if (activeMode.startsWith('draw-')) return 'crosshair';
    if (activeMode === 'delete') return 'pointer';
    return 'crosshair';
  }, [activeMode, editable]);

  return (
    <div ref={containerRef} className={`relative bg-slate-900 ${className ?? ''}`}>
      {!editable && (
        <div className="absolute top-2 left-2 z-10 text-[10px] uppercase tracking-wide bg-slate-800/90 border border-slate-700 text-amber-300 rounded px-2 py-0.5">
          view-only on this projection
        </div>
      )}

      <svg
        ref={svgRef}
        width={size.w}
        height={size.h}
        className="block"
        style={{ cursor, touchAction: 'none' }}
        onPointerDown={(e) => {
          onSvgPointerDownTrack(e);
          onSvgPointerDownCapture(e);
          onSvgPointerDown(e);
        }}
        onPointerMove={onSvgPointerMove}
        onPointerUp={(e) => {
          onSvgPointerUp(e);
          onSvgClickHandler(e);
        }}
        onDoubleClick={() => {
          if (drawState.kind === 'line' || drawState.kind === 'polygon') {
            finalizeDrawing();
          }
        }}
      >
        {/* Background — also catches clicks for handleBackgroundClick */}
        <rect
          x={0}
          y={0}
          width={size.w}
          height={size.h}
          className="fill-slate-900"
          onPointerDown={handleBackgroundClick}
        />
        {sphereD && (
          <path
            d={sphereD}
            className="fill-slate-800/60 stroke-slate-700"
            strokeWidth={1}
          />
        )}
        {showGraticule && graticuleD && (
          <path
            d={graticuleD}
            className="fill-none stroke-slate-700/60"
            strokeWidth={0.5}
          />
        )}
        {landPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            className="fill-slate-700 stroke-slate-600"
            strokeWidth={0.5}
          />
        ))}

        <MapGeometries
          geometries={geometries}
          projection={projection}
          pathGen={pathGen}
          interactive={
            editable && (activeMode === 'select' || activeMode === 'delete')
          }
          showHandles={editable && activeMode === 'select'}
          onPointerDownGeometry={onPointerDownGeometry}
        />

        {/* Drawing preview */}
        {drawingPreview && (
          <path
            d={drawingPreview}
            className={
              drawState.kind === 'circle'
                ? 'fill-fuchsia-400/10 stroke-fuchsia-300'
                : 'fill-none stroke-cyan-300'
            }
            strokeWidth={1.5}
            strokeDasharray="4,3"
            pointerEvents="none"
          />
        )}
        {drawingVertices.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={3}
            className="fill-cyan-200 stroke-cyan-700"
            strokeWidth={1}
            pointerEvents="none"
          />
        ))}

        {/* Overlay (e.g., satellites) */}
        {typeof overlay === 'function' ? overlay(projection) : overlay}

        {/* Location pin */}
        {pin && (
          <g pointerEvents="none">
            <circle cx={pin[0]} cy={pin[1]} r={5} className="fill-rose-500" />
            <circle
              cx={pin[0]}
              cy={pin[1]}
              r={9}
              className="fill-none stroke-rose-400"
              strokeWidth={1.5}
              opacity={0.7}
            />
          </g>
        )}
      </svg>
    </div>
  );
}

function translateGeometry(
  g: GeoGeometry,
  dLat: number,
  dLon: number,
): GeoGeometry {
  switch (g.kind) {
    case 'point':
      return { ...g, coord: [g.coord[0] + dLat, g.coord[1] + dLon] };
    case 'line':
      return {
        ...g,
        vertices: g.vertices.map(([lat, lon]) => [lat + dLat, lon + dLon] as LatLon),
      };
    case 'polygon':
      return {
        ...g,
        vertices: g.vertices.map(([lat, lon]) => [lat + dLat, lon + dLon] as LatLon),
      };
    case 'circle':
      return {
        ...g,
        center: [g.center[0] + dLat, g.center[1] + dLon],
      };
  }
}

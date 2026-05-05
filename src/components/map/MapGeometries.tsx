import { useMemo } from 'react';
import type { GeoPath, GeoProjection } from 'd3-geo';
import type { GeoGeometry, LatLon } from '@/state/geometry';
import { buildCircleFeature, project } from './projectionUtils';

interface Props {
  geometries: GeoGeometry[];
  projection: GeoProjection;
  pathGen: GeoPath;
  /** Geometry bodies respond to pointer events (select OR delete modes). */
  interactive: boolean;
  /** Vertex / edge handles are shown for direct manipulation (select mode only). */
  showHandles: boolean;
  onPointerDownGeometry?: (
    geo: GeoGeometry,
    target: 'body' | { kind: 'vertex'; index: number } | { kind: 'circle-edge' },
    event: React.PointerEvent<SVGElement>,
  ) => void;
}

const VERTEX_HANDLE_R = 4.5;
const POINT_R = 5;

export default function MapGeometries({
  geometries,
  projection,
  pathGen,
  interactive,
  showHandles,
  onPointerDownGeometry,
}: Props) {
  return (
    <g className="geometries">
      {geometries.map((g) => (
        <GeometryItem
          key={g.id}
          geometry={g}
          projection={projection}
          pathGen={pathGen}
          interactive={interactive}
          showHandles={showHandles}
          onPointerDownGeometry={onPointerDownGeometry}
        />
      ))}
    </g>
  );
}

function GeometryItem({
  geometry,
  projection,
  pathGen,
  interactive,
  showHandles,
  onPointerDownGeometry,
}: {
  geometry: GeoGeometry;
  projection: GeoProjection;
  pathGen: GeoPath;
  interactive: boolean;
  showHandles: boolean;
  onPointerDownGeometry?: Props['onPointerDownGeometry'];
}) {
  switch (geometry.kind) {
    case 'point':
      return (
        <PointItem
          coord={geometry.coord}
          projection={projection}
          interactive={interactive}
          onPointerDown={(e) => onPointerDownGeometry?.(geometry, 'body', e)}
        />
      );
    case 'line':
      return (
        <LineItem
          vertices={geometry.vertices}
          projection={projection}
          pathGen={pathGen}
          interactive={interactive}
          showHandles={showHandles}
          onBodyPointerDown={(e) => onPointerDownGeometry?.(geometry, 'body', e)}
          onVertexPointerDown={(i, e) =>
            onPointerDownGeometry?.(geometry, { kind: 'vertex', index: i }, e)
          }
        />
      );
    case 'polygon':
      return (
        <PolygonItem
          vertices={geometry.vertices}
          projection={projection}
          pathGen={pathGen}
          interactive={interactive}
          showHandles={showHandles}
          onBodyPointerDown={(e) => onPointerDownGeometry?.(geometry, 'body', e)}
          onVertexPointerDown={(i, e) =>
            onPointerDownGeometry?.(geometry, { kind: 'vertex', index: i }, e)
          }
        />
      );
    case 'circle':
      return (
        <CircleItem
          center={geometry.center}
          radiusKm={geometry.radiusKm}
          projection={projection}
          pathGen={pathGen}
          interactive={interactive}
          showHandles={showHandles}
          onBodyPointerDown={(e) => onPointerDownGeometry?.(geometry, 'body', e)}
          onEdgePointerDown={(e) =>
            onPointerDownGeometry?.(geometry, { kind: 'circle-edge' }, e)
          }
        />
      );
  }
}

function PointItem({
  coord,
  projection,
  interactive,
  onPointerDown,
}: {
  coord: LatLon;
  projection: GeoProjection;
  interactive: boolean;
  onPointerDown: (e: React.PointerEvent<SVGElement>) => void;
}) {
  const projected = project(projection, coord);
  if (!projected) return null;
  return (
    <g>
      <circle
        cx={projected[0]}
        cy={projected[1]}
        r={POINT_R}
        className="fill-amber-400 stroke-amber-100"
        strokeWidth={1.5}
        style={{ cursor: interactive ? 'grab' : undefined }}
        onPointerDown={interactive ? onPointerDown : undefined}
      />
    </g>
  );
}

function LineItem({
  vertices,
  projection,
  pathGen,
  interactive,
  showHandles,
  onBodyPointerDown,
  onVertexPointerDown,
}: {
  vertices: LatLon[];
  projection: GeoProjection;
  pathGen: GeoPath;
  interactive: boolean;
  showHandles: boolean;
  onBodyPointerDown: (e: React.PointerEvent<SVGElement>) => void;
  onVertexPointerDown: (i: number, e: React.PointerEvent<SVGElement>) => void;
}) {
  const d = useMemo(() => {
    const ls = {
      type: 'LineString' as const,
      coordinates: vertices.map(([lat, lon]) => [lon, lat]),
    };
    return pathGen(ls) ?? undefined;
  }, [vertices, pathGen]);
  if (!d) return null;
  return (
    <g>
      <path
        d={d}
        className="fill-none stroke-cyan-300"
        strokeWidth={4}
        strokeOpacity={0}
        style={{ cursor: interactive ? 'pointer' : undefined }}
        onPointerDown={interactive ? onBodyPointerDown : undefined}
      />
      <path
        d={d}
        className="fill-none stroke-cyan-300"
        strokeWidth={1.75}
        strokeLinejoin="round"
        strokeLinecap="round"
        pointerEvents="none"
      />
      {showHandles &&
        vertices.map((v, i) => (
          <VertexHandle
            key={i}
            coord={v}
            projection={projection}
            onPointerDown={(e) => onVertexPointerDown(i, e)}
          />
        ))}
    </g>
  );
}

function PolygonItem({
  vertices,
  projection,
  pathGen,
  interactive,
  showHandles,
  onBodyPointerDown,
  onVertexPointerDown,
}: {
  vertices: LatLon[];
  projection: GeoProjection;
  pathGen: GeoPath;
  interactive: boolean;
  showHandles: boolean;
  onBodyPointerDown: (e: React.PointerEvent<SVGElement>) => void;
  onVertexPointerDown: (i: number, e: React.PointerEvent<SVGElement>) => void;
}) {
  const d = useMemo(() => {
    if (vertices.length < 3) return undefined;
    const ring = vertices.map(([lat, lon]) => [lon, lat]);
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) ring.push([...first]);
    const poly = {
      type: 'Polygon' as const,
      coordinates: [ring],
    };
    return pathGen(poly) ?? undefined;
  }, [vertices, pathGen]);
  if (!d) return null;
  return (
    <g>
      <path
        d={d}
        className="fill-emerald-400/15 stroke-emerald-300"
        strokeWidth={1.75}
        strokeLinejoin="round"
        style={{ cursor: interactive ? 'pointer' : undefined }}
        onPointerDown={interactive ? onBodyPointerDown : undefined}
      />
      {showHandles &&
        vertices.map((v, i) => (
          <VertexHandle
            key={i}
            coord={v}
            projection={projection}
            onPointerDown={(e) => onVertexPointerDown(i, e)}
          />
        ))}
    </g>
  );
}

function CircleItem({
  center,
  radiusKm,
  projection,
  pathGen,
  interactive,
  showHandles,
  onBodyPointerDown,
  onEdgePointerDown,
}: {
  center: LatLon;
  radiusKm: number;
  projection: GeoProjection;
  pathGen: GeoPath;
  interactive: boolean;
  showHandles: boolean;
  onBodyPointerDown: (e: React.PointerEvent<SVGElement>) => void;
  onEdgePointerDown: (e: React.PointerEvent<SVGElement>) => void;
}) {
  const d = useMemo(() => {
    const feature = buildCircleFeature(center, radiusKm);
    return pathGen(feature) ?? undefined;
  }, [center, radiusKm, pathGen]);

  const projectedCenter = project(projection, center);

  if (!d) return null;
  return (
    <g>
      <path
        d={d}
        className="fill-fuchsia-400/15 stroke-fuchsia-300"
        strokeWidth={1.75}
        style={{ cursor: interactive ? 'pointer' : undefined }}
        onPointerDown={interactive ? onBodyPointerDown : undefined}
      />
      {showHandles && (
        <path
          d={d}
          className="fill-none stroke-fuchsia-200"
          strokeWidth={6}
          strokeOpacity={0}
          style={{ cursor: 'ew-resize' }}
          onPointerDown={onEdgePointerDown}
        />
      )}
      {showHandles && projectedCenter && (
        <circle
          cx={projectedCenter[0]}
          cy={projectedCenter[1]}
          r={3}
          className="fill-fuchsia-200"
          pointerEvents="none"
        />
      )}
    </g>
  );
}

function VertexHandle({
  coord,
  projection,
  onPointerDown,
}: {
  coord: LatLon;
  projection: GeoProjection;
  onPointerDown: (e: React.PointerEvent<SVGElement>) => void;
}) {
  const p = project(projection, coord);
  if (!p) return null;
  return (
    <circle
      cx={p[0]}
      cy={p[1]}
      r={VERTEX_HANDLE_R}
      className="fill-slate-100 stroke-slate-900"
      strokeWidth={1.5}
      style={{ cursor: 'grab' }}
      onPointerDown={onPointerDown}
    />
  );
}

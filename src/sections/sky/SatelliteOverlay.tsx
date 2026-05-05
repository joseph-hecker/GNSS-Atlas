import { useMemo } from 'react';
import type { GeoProjection } from 'd3-geo';
import type { SatelliteState } from '@/lib/satellites';
import { project } from '@/components/map/projectionUtils';

interface Props {
  satellites: SatelliteState[];
  projection: GeoProjection;
  selectedNorad: number | null;
  onSelect: (norad: number) => void;
}

export default function SatelliteOverlay({
  satellites,
  projection,
  selectedNorad,
  onSelect,
}: Props) {
  const projected = useMemo(
    () =>
      satellites
        .map((s) => {
          const p = project(projection, [s.subLat, s.subLon]);
          return p ? { sat: s, x: p[0], y: p[1] } : null;
        })
        .filter((r): r is { sat: SatelliteState; x: number; y: number } => !!r),
    [satellites, projection],
  );

  return (
    <g className="satellites">
      {projected.map(({ sat, x, y }) => {
        const isSelected = sat.runtime.norad === selectedNorad;
        const visible = sat.visible;
        const fill = visible ? '#fbbf24' : '#475569';
        const stroke = isSelected ? '#f0fdf4' : visible ? '#fef3c7' : '#94a3b8';
        return (
          <g
            key={sat.runtime.norad}
            transform={`translate(${x},${y})`}
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onSelect(sat.runtime.norad);
            }}
          >
            <circle
              r={isSelected ? 9 : 6}
              fill={fill}
              stroke={stroke}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            {sat.runtime.prn && (
              <text
                x={9}
                y={-9}
                fontSize={9}
                className="font-mono fill-amber-100 select-none"
                pointerEvents="none"
              >
                {sat.runtime.prn}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

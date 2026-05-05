import { useState } from 'react';
import ProjectedMap from '@/components/map/ProjectedMap';
import DrawingToolbar from '@/components/DrawingToolbar';
import ProjectionExplanation from '@/components/ProjectionExplanation';
import { useLocation } from '@/state/LocationContext';
import { useGeometries } from '@/state/GeometryContext';
import { getProjectionMeta } from '@/projections/catalog';
import type { ProjectionId } from '@/projections/types';
import ProjectionPicker from './ProjectionPicker';

export default function CompareSection() {
  const { setLocation } = useLocation();
  const { geometries } = useGeometries();
  const [leftId, setLeftId] = useState<ProjectionId>('web-mercator');
  const [rightId, setRightId] = useState<ProjectionId>('equal-earth');
  const leftMeta = getProjectionMeta(leftId);
  const rightMeta = getProjectionMeta(rightId);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-4 pt-4">
        <DrawingToolbar />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
        <Panel
          projectionId={leftId}
          onPickProjection={setLeftId}
          onMapClick={setLocation}
          label="Left"
        />
        <Panel
          projectionId={rightId}
          onPickProjection={setRightId}
          onMapClick={setLocation}
          label="Right"
        />
      </div>
      <div className="grid grid-cols-2 gap-4 px-4 pb-4">
        <ProjectionExplanation meta={leftMeta} />
        <ProjectionExplanation meta={rightMeta} />
      </div>
      {geometries.length === 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 panel text-xs text-slate-300 pointer-events-none">
          Pick a tool above and draw a shape on either side. It&apos;ll appear in both projections.
        </div>
      )}
    </div>
  );
}

function Panel({
  projectionId,
  onPickProjection,
  onMapClick,
  label,
}: {
  projectionId: ProjectionId;
  onPickProjection: (id: ProjectionId) => void;
  onMapClick: (lat: number, lon: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-col min-h-0 rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between">
        <ProjectionPicker
          value={projectionId}
          onChange={onPickProjection}
          label={label}
        />
      </div>
      <div className="flex-1 min-h-0">
        <ProjectedMap
          projectionId={projectionId}
          showGraticule
          geometriesEnabled
          onMapClick={({ lat, lon }) => onMapClick(lat, lon)}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import ProjectedMap from '@/components/map/ProjectedMap';
import TimePicker from '@/components/TimePicker';
import { useLocation } from '@/state/LocationContext';
import {
  useRuntimes,
  useSatelliteStates,
  useTleSet,
} from './useSatellites';
import SatelliteOverlay from './SatelliteOverlay';
import SatelliteInfoPanel from './SatelliteInfoPanel';
import TleEpochBadge from './TleEpochBadge';

export default function SkySection() {
  const { setLocation } = useLocation();
  const tle = useTleSet();
  const runtimes = useRuntimes(tle.set);
  const satellites = useSatelliteStates(runtimes);

  const [selectedNorad, setSelectedNorad] = useState<number | null>(null);
  const selectedSat = useMemo(
    () => satellites.find((s) => s.runtime.norad === selectedNorad) ?? null,
    [satellites, selectedNorad],
  );

  return (
    <div className="h-full flex">
      <div className="flex-1 min-w-0 min-h-0 relative">
        <ProjectedMap
          projectionId="web-mercator"
          showGraticule
          onMapClick={({ lat, lon }) => setLocation(lat, lon)}
          overlay={(projection) => (
            <SatelliteOverlay
              satellites={satellites}
              projection={projection}
              selectedNorad={selectedNorad}
              onSelect={(n) =>
                setSelectedNorad((cur) => (cur === n ? null : n))
              }
            />
          )}
          className="h-full w-full"
        />
        <SatelliteInfoPanel
          state={selectedSat}
          onClose={() => setSelectedNorad(null)}
        />
        <TleEpochBadge set={tle.set} />
        {tle.loading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 panel z-10 text-xs text-slate-300">
            Loading GPS satellites…
          </div>
        )}
        {tle.error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 panel z-10 text-xs text-rose-300">
            Couldn&apos;t load TLEs: {tle.error}
          </div>
        )}
        {!tle.loading && satellites.length === 0 && tle.set && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="panel text-xs text-slate-300 pointer-events-auto">
              No satellites computed at this time. Try moving the time slider.
            </div>
          </div>
        )}
      </div>
      <div className="w-72 shrink-0 border-l border-slate-800 bg-slate-900/40 p-4 space-y-4 overflow-y-auto">
        <TimePicker />
        <SatelliteCounts
          total={satellites.length}
          visible={satellites.filter((s) => s.visible).length}
        />
      </div>
    </div>
  );
}

function SatelliteCounts({
  total,
  visible,
}: {
  total: number;
  visible: number;
}) {
  return (
    <section className="panel">
      <h3 className="text-sm font-semibold tracking-tight">Constellation</h3>
      <div className="mt-2 text-xs text-slate-300 font-mono space-y-1">
        <div>
          <span className="text-slate-500">total: </span>
          {total}
        </div>
        <div>
          <span className="text-slate-500">visible from here: </span>
          <span className="text-amber-300">{visible}</span>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 leading-snug">
        Yellow dots are GPS satellites currently above your horizon. Grey dots
        are below it (on the other side of Earth from your location).
      </p>
    </section>
  );
}

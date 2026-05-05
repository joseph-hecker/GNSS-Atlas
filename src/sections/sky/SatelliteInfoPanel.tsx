import type { SatelliteState } from '@/lib/satellites';

interface Props {
  state: SatelliteState | null;
  onClose: () => void;
}

export default function SatelliteInfoPanel({ state, onClose }: Props) {
  if (!state) return null;
  const sat = state.runtime;
  return (
    <aside className="absolute top-3 right-3 w-[260px] panel space-y-3 z-20">
      <header className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-slate-500">
            Satellite
          </div>
          <h3 className="text-sm font-semibold tracking-tight">{sat.name}</h3>
          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
            {sat.prn ? `PRN ${sat.prn} · ` : ''}NORAD {sat.norad}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200"
          aria-label="Close satellite info"
        >
          ✕
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs font-mono">
        <Row label="Sub-lat">{state.subLat.toFixed(3)}°</Row>
        <Row label="Sub-lon">{state.subLon.toFixed(3)}°</Row>
        <Row label="Altitude">{state.altitudeKm.toFixed(0)} km</Row>
        <Row label="Speed">{state.speedKmS.toFixed(2)} km/s</Row>
        <Row label="Azimuth">{state.azimuth.toFixed(1)}°</Row>
        <Row label="Elevation">{state.elevation.toFixed(1)}°</Row>
        <Row label="Range">{state.rangeKm.toFixed(0)} km</Row>
        <Row label="Visible">
          <span className={state.visible ? 'text-emerald-300' : 'text-slate-400'}>
            {state.visible ? 'yes' : 'below horizon'}
          </span>
        </Row>
      </dl>
    </aside>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="contents">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">{children}</dd>
    </div>
  );
}

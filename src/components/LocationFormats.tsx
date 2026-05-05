import { useMemo } from 'react';
import { useLocation } from '@/state/LocationContext';
import {
  formatDecimal,
  formatLatLonDms,
  formatUtm,
  toMgrs,
  toUtm,
} from '@/lib/coordinates';

export default function LocationFormats() {
  const { location } = useLocation();

  const decimal = formatDecimal(location.lat, location.lon);
  const dms = formatLatLonDms(location.lat, location.lon);

  const utm = useMemo(() => toUtm(location.lat, location.lon), [location]);
  const mgrs = useMemo(() => toMgrs(location.lat, location.lon), [location]);

  return (
    <div className="space-y-2 text-xs font-mono">
      <Row label="Decimal" value={decimal} />
      <Row label="DMS" value={dms} />
      <Row
        label="UTM"
        value={utm ? formatUtm(utm) : 'N/A at this latitude'}
      />
      <Row label="MGRS" value={mgrs ?? 'N/A at this latitude'} />
      <Row label="Datum" value={location.datum} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[10px] uppercase tracking-wide text-slate-500 w-12 shrink-0">
        {label}
      </span>
      <span className="text-slate-200 break-all">{value}</span>
    </div>
  );
}

import { useState, type FormEvent } from 'react';
import { useLocation } from '@/state/LocationContext';
import { isValidLat, isValidLon } from '@/state/location';
import { parseDmsLatLon } from '@/lib/coordinates';

type Mode = 'decimal' | 'dms';

export default function LocationEntry() {
  const { setLocation } = useLocation();
  const [mode, setMode] = useState<Mode>('decimal');
  const [latInput, setLatInput] = useState('');
  const [lonInput, setLonInput] = useState('');
  const [dmsInput, setDmsInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === 'decimal') {
      const lat = Number.parseFloat(latInput);
      const lon = Number.parseFloat(lonInput);
      if (!isValidLat(lat) || !isValidLon(lon)) {
        setError('Latitude must be in [-90, 90], longitude in [-180, 180].');
        return;
      }
      setLocation(lat, lon);
      setLatInput('');
      setLonInput('');
    } else {
      const parsed = parseDmsLatLon(dmsInput);
      if (!parsed) {
        setError(
          "Couldn't parse that. Try e.g. 51°28'40\"N 0°00'05\"W or 51 28 40 N, 0 0 5 W.",
        );
        return;
      }
      setLocation(parsed.lat, parsed.lon);
      setDmsInput('');
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-1 text-xs">
        <ModeButton active={mode === 'decimal'} onClick={() => setMode('decimal')}>
          Decimal
        </ModeButton>
        <ModeButton active={mode === 'dms'} onClick={() => setMode('dms')}>
          DMS
        </ModeButton>
      </div>

      {mode === 'decimal' ? (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label" htmlFor="lat-input">
              Latitude
            </label>
            <input
              id="lat-input"
              className="input"
              inputMode="decimal"
              placeholder="51.4769"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="lon-input">
              Longitude
            </label>
            <input
              id="lon-input"
              className="input"
              inputMode="decimal"
              placeholder="-0.0005"
              value={lonInput}
              onChange={(e) => setLonInput(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="label" htmlFor="dms-input">
            DMS string
          </label>
          <input
            id="dms-input"
            className="input"
            placeholder={"51°28'40\"N 0°00'05\"W"}
            value={dmsInput}
            onChange={(e) => setDmsInput(e.target.value)}
          />
        </div>
      )}

      {error && (
        <div className="text-xs text-rose-400 leading-snug">{error}</div>
      )}

      <button type="submit" className="btn btn-primary w-full">
        Set location
      </button>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn flex-1 ${active ? 'btn-active' : ''}`}
    >
      {children}
    </button>
  );
}

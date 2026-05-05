import { useEffect, useMemo, useState } from 'react';
import { useLocation } from '@/state/LocationContext';
import { clampToTimeBounds } from '@/state/location';
import {
  fromDatetimeLocalString,
  timeBoundsAround,
  toDatetimeLocalString,
} from '@/lib/time';

export default function TimePicker() {
  const { selectedTimeUtc, setTime } = useLocation();
  const [bounds, setBounds] = useState(() => timeBoundsAround());

  useEffect(() => {
    const refresh = () => setBounds(timeBoundsAround());
    const handle = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(handle);
  }, []);

  const minutesOffset = useMemo(() => {
    return Math.round(
      (selectedTimeUtc.getTime() - bounds.now.getTime()) / 60_000,
    );
  }, [selectedTimeUtc, bounds.now]);

  const minOffset = -7 * 24 * 60;
  const maxOffset = 7 * 24 * 60;

  function handleSlider(rawMinutes: number) {
    const minutes = Math.max(minOffset, Math.min(maxOffset, rawMinutes));
    const next = new Date(bounds.now.getTime() + minutes * 60_000);
    setTime(clampToTimeBounds(next, bounds));
  }

  function handleDatetime(value: string) {
    const parsed = fromDatetimeLocalString(value);
    if (!parsed) return;
    setTime(clampToTimeBounds(parsed, bounds));
  }

  function reset() {
    const fresh = timeBoundsAround();
    setBounds(fresh);
    setTime(fresh.now);
  }

  const offsetLabel = formatOffsetLabel(minutesOffset);

  return (
    <section className="panel space-y-3">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Time</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            ±7 days from now (TLE accuracy bound)
          </p>
        </div>
        <button type="button" onClick={reset} className="btn">
          Now
        </button>
      </header>

      <div className="space-y-2">
        <input
          type="range"
          min={minOffset}
          max={maxOffset}
          step={1}
          value={minutesOffset}
          onChange={(e) => handleSlider(Number.parseInt(e.target.value, 10))}
          className="w-full accent-sky-500"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>−7d</span>
          <span>now</span>
          <span>+7d</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="label" htmlFor="time-input">
          Selected time (local)
        </label>
        <input
          id="time-input"
          type="datetime-local"
          className="input"
          value={toDatetimeLocalString(selectedTimeUtc)}
          onChange={(e) => handleDatetime(e.target.value)}
          min={toDatetimeLocalString(bounds.min)}
          max={toDatetimeLocalString(bounds.max)}
        />
        <div className="text-[11px] text-slate-400 font-mono">
          UTC: {selectedTimeUtc.toISOString().slice(0, 16).replace('T', ' ')}
        </div>
        <div className="text-[11px] text-slate-500">{offsetLabel}</div>
      </div>
    </section>
  );
}

function formatOffsetLabel(minutes: number): string {
  if (minutes === 0) return 'right now';
  const future = minutes > 0;
  const abs = Math.abs(minutes);
  const days = Math.floor(abs / (24 * 60));
  const hours = Math.floor((abs - days * 24 * 60) / 60);
  const mins = abs - days * 24 * 60 - hours * 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins) parts.push(`${mins}m`);
  return `${future ? 'in' : ''} ${parts.join(' ')}${future ? '' : ' ago'}`.trim();
}

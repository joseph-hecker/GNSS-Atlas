import type { TleSet } from '@/lib/tle';

export default function TleEpochBadge({ set }: { set: TleSet | null }) {
  if (!set) return null;
  const epoch = set.epoch.toISOString().slice(0, 16).replace('T', ' ');
  const isFallback = set.source === 'fallback';
  return (
    <div
      className={`absolute bottom-3 left-3 z-10 text-[11px] font-mono px-2 py-1 rounded border ${
        isFallback
          ? 'bg-amber-900/60 border-amber-700 text-amber-200'
          : 'bg-slate-900/80 border-slate-700 text-slate-300'
      }`}
    >
      TLE epoch: {epoch} UTC
      {isFallback && (
        <span className="ml-1 italic">(fallback data — offline?)</span>
      )}
    </div>
  );
}

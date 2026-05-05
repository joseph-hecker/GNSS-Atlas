import type {
  GeometricProperty,
  ProjectionMetadata,
} from '@/projections/types';

interface Props {
  meta: ProjectionMetadata;
  compact?: boolean;
}

export default function ProjectionExplanation({ meta, compact }: Props) {
  return (
    <section className="panel">
      <header className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">
          {meta.displayName}
        </h3>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">
          {meta.family}
        </span>
      </header>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {meta.preserves.map((p) => (
          <PropertyChip key={`pres-${p}`} property={p} kind="preserves" />
        ))}
        {meta.distorts.map((p) => (
          <PropertyChip key={`dist-${p}`} property={p} kind="distorts" />
        ))}
      </div>
      <p className="text-xs text-slate-300 mt-3 leading-relaxed">
        {compact ? meta.shortExplanation : meta.longExplanation}
      </p>
      {!meta.supportsInvert && (
        <p className="text-[11px] text-amber-300/80 mt-2 leading-snug">
          This projection is view-only — clicks can&apos;t reliably be
          translated back to coordinates.
        </p>
      )}
    </section>
  );
}

function PropertyChip({
  property,
  kind,
}: {
  property: GeometricProperty;
  kind: 'preserves' | 'distorts';
}) {
  const symbol = kind === 'preserves' ? '✓' : '✕';
  const cls =
    kind === 'preserves'
      ? 'border-emerald-700 text-emerald-300 bg-emerald-900/30'
      : 'border-rose-700 text-rose-300 bg-rose-900/30';
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide rounded px-1.5 py-0.5 border ${cls}`}
      title={`${kind} ${property}`}
    >
      <span aria-hidden>{symbol}</span>
      {property}
    </span>
  );
}

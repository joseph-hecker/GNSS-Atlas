import { useMemo } from 'react';
import { PROJECTIONS } from '@/projections/catalog';
import type { ProjectionId } from '@/projections/types';

interface Props {
  value: ProjectionId;
  onChange: (id: ProjectionId) => void;
  label?: string;
}

export default function ProjectionPicker({ value, onChange, label }: Props) {
  const sorted = useMemo(
    () =>
      [...PROJECTIONS].sort((a, b) =>
        a.displayName.localeCompare(b.displayName),
      ),
    [],
  );

  return (
    <label className="flex items-center gap-2 text-xs">
      {label && (
        <span className="text-slate-400 uppercase tracking-wide text-[10px]">
          {label}
        </span>
      )}
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectionId)}
      >
        {sorted.map((p) => (
          <option key={p.id} value={p.id}>
            {p.displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

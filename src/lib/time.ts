export const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export interface TimeBounds {
  min: Date;
  max: Date;
  now: Date;
}

export function timeBoundsAround(now: Date = new Date()): TimeBounds {
  return {
    now,
    min: new Date(now.getTime() - SEVEN_DAYS_MS),
    max: new Date(now.getTime() + SEVEN_DAYS_MS),
  };
}

/** Convert a Date to a value usable by an `<input type="datetime-local">`. */
export function toDatetimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** Parse a `datetime-local` value (browser local TZ) back into a UTC Date. */
export function fromDatetimeLocalString(value: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

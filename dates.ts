export const RANCH_TIMEZONE = "America/Vancouver";
export function ranchDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RANCH_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function offsetDate(date: string, days: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
export function dateLabel(
  date: string,
  options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
) {
  return new Date(date + "T12:00:00").toLocaleDateString("en-CA", options);
}
export function age(birthDate: string, today: string) {
  const b = new Date(birthDate);
  const t = new Date(today);
  return (
    t.getUTCFullYear() -
    b.getUTCFullYear() -
    (today.slice(5) < birthDate.slice(5) ? 1 : 0)
  );
}
export function instructionState(
  item: { effectiveStart: string; effectiveEnd?: string },
  date: string,
) {
  return item.effectiveStart > date
    ? "Scheduled"
    : item.effectiveEnd && item.effectiveEnd < date
      ? "Ended"
      : "Current";
}

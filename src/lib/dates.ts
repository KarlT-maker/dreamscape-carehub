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
export function weekStart(date: string) {
  return offsetDate(date, -((new Date(date + "T12:00:00Z").getUTCDay() + 6) % 7));
}
// ISO weeks run Monday-Sunday; the week containing January 4 is week 1.
export function isoWeek(date: string) {
  const start = weekStart(date);
  const year = Number(offsetDate(start, 3).slice(0, 4));
  const first = weekStart(`${year}-01-04`);
  const week = 1 + Math.round((Date.parse(start) - Date.parse(first)) / 604800000);
  return {year, week, start, end: offsetDate(start, 6)};
}
export function isoWeekStart(year: number, week: number) {
  return offsetDate(weekStart(`${year}-01-04`), (week - 1) * 7);
}
export function isoWeeksInYear(year: number) { return isoWeek(`${year}-12-28`).week; }
// Match the paper sheet: group by the Monday's month, with the new year's
// first ISO week under January even when its Monday is in December.
export function billingWeekMonth(date: string) {
  const week=isoWeek(date);
  return Number(week.start.slice(0,4))<week.year?1:Number(week.start.slice(5,7));
}
export function billingMonthWeeks(year:number,month:number) {
  return Array.from({length:isoWeeksInYear(year)},(_,i)=>isoWeek(isoWeekStart(year,i+1))).filter(w=>billingWeekMonth(w.start)===month);
}
export function billingWeekRange(date:string) {
  const week=isoWeek(date);
  const options:Intl.DateTimeFormatOptions={month:"short",day:"numeric",...(week.start.slice(0,4)!==week.end.slice(0,4)?{year:"numeric" as const}:{})};
  return `${dateLabel(week.start,options)}–${dateLabel(week.end,options)}`;
}
export function offsetMonth(date: string, months: number) {
  const d = new Date(date.slice(0, 7) + "-01T12:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
export function calendarMonthDates(date: string) {
  const start = weekStart(date.slice(0, 7) + "-01");
  const end = offsetDate(weekStart(offsetDate(offsetMonth(date, 1), -1)), 6);
  const days: string[] = [];
  for (let day = start; day <= end; day = offsetDate(day, 1)) days.push(day);
  return days;
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
  if (item.effectiveEnd && item.effectiveEnd < item.effectiveStart) return "Ended";
  return item.effectiveStart > date
    ? "Scheduled"
    : item.effectiveEnd && item.effectiveEnd < date
      ? "Ended"
      : "Current";
}
export function farrierDateLabel(entry: {date:string;farrierWeekOnly?:boolean}) {
  const week=isoWeek(entry.date);
  return entry.farrierWeekOnly?`Week ${week.week} · ${week.year} (day not noted)`:dateLabel(entry.date);
}

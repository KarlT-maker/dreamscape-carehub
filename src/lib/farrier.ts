import type { CalendarEvent, HistoryEntry } from "../types/index";

export const FARRIER_WORK = ["Trim", "Shoeing", "Shoe removal", "Other"] as const;
export const FARRIER_FEET = ["All four", "Front feet", "Hind feet", "See notes"] as const;
export function farrierWeekRecords(history: HistoryEntry[], start: string, end: string, provider = "") {
  return history.filter(h => h.type === "Farrier" && h.date >= start && h.date <= end && (!provider || h.provider?.trim().toLocaleLowerCase() === provider.trim().toLocaleLowerCase()))
    .sort((a,b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}
export function farrierTotals(records: HistoryEntry[]) {
  const active = records.filter(r => !r.voided);
  return {
    horses: new Set(active.map(r => r.horseId)).size,
    records: active.length,
    work: [...FARRIER_WORK, "Reset / refit", "Not categorised"].map(label => ({label, count: active.filter(r => (r.farrierWork ?? "Not categorised") === label).length})),
  };
}
export type FarrierDayRow = {plan?: CalendarEvent; record?: HistoryEntry};
export function farrierWeekRows(events: CalendarEvent[], history: HistoryEntry[], start: string, end: string, provider = ""): FarrierDayRow[] {
  const matches=(name?:string)=>!provider||name?.trim().toLocaleLowerCase()===provider.trim().toLocaleLowerCase();
  const plans=events.filter(e=>e.type==="Farrier"&&!e.cancelled&&e.date>=start&&e.date<=end&&matches(e.provider));
  const completed=history.filter(h=>h.type==="Farrier"&&!h.voided);
  const rows:FarrierDayRow[]=plans.map(plan=>({plan,record:completed.find(h=>h.sourceEventId===plan.id)}));
  for(const record of completed.filter(h=>h.date>=start&&h.date<=end&&matches(h.provider))) {
    if(!rows.some(r=>r.record?.id===record.id))rows.push({record});
  }
  return rows;
}
export function farrierDayRows(events: CalendarEvent[], history: HistoryEntry[], date: string, provider = ""): FarrierDayRow[] {
  const matches = (name?: string) => !provider || name?.trim().toLocaleLowerCase() === provider.trim().toLocaleLowerCase();
  const plans = events.filter(e=>e.type==="Farrier"&&!e.cancelled&&e.date===date&&matches(e.provider));
  const completed = history.filter(h=>h.type==="Farrier"&&!h.voided);
  const rows: FarrierDayRow[] = plans.map(plan=>({plan,record:completed.find(h=>h.sourceEventId===plan.id)}));
  for(const record of completed.filter(h=>h.date===date&&matches(h.provider))) {
    if(!rows.some(r=>r.record?.id===record.id)) rows.push({record});
  }
  return rows;
}

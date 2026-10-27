import type { HistoryEntry } from "../types/index";

export const FARRIER_WORK = ["Trim", "Shoeing", "Reset / refit", "Shoe removal", "Other"] as const;
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
    work: [...FARRIER_WORK, "Not categorised"].map(label => ({label, count: active.filter(r => (r.farrierWork ?? "Not categorised") === label).length})),
  };
}

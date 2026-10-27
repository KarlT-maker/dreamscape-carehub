import type { WorkspaceData } from "./workspace";
import type { CalendarEvent, HistoryEntry } from "../../types/index";
export type PlanningSection = "events" | "history" | "helpers" | "shifts" | "daysOff";
export type PlanningRecord<K extends PlanningSection> = WorkspaceData[K][number];

// Compare the opened record, not the entire workspace: unrelated fresh edits survive.
export function savePlanningRecord<K extends PlanningSection>(data: WorkspaceData, section: K, record: PlanningRecord<K>, before?: PlanningRecord<K>): WorkspaceData {
  const rows = data[section] as PlanningRecord<K>[];
  const current = rows.find(row => row.id === record.id);
  if (before && JSON.stringify(before) !== JSON.stringify(current)) throw new Error("This record changed while the form was open. Close and reopen it to review the latest version. Your entered text is still here.");
  if (!before && current) {
    if (JSON.stringify(record) === JSON.stringify(current)) return data;
    throw new Error("This record already exists. Reopen it before changing it.");
  }
  const next = current ? {...current, ...record} : record;
  const result = {...data, [section]: current ? rows.map(row => row.id === next.id ? next : row) : [...rows, next]};
  const slots = new Set<string>();
  for (const shift of result.shifts.filter(s => !s.cancelled)) {
    const key = JSON.stringify([shift.date, shift.paddock, shift.period, shift.helperId]);
    if (slots.has(key)) throw new Error("That helper is already assigned to this paddock and round. Reopen the schedule to see it.");
    slots.add(key);
  }
  const off = new Set<string>();
  for (const day of result.daysOff.filter(d => !d.cancelled)) {
    const key = JSON.stringify([day.date, day.helperId]);
    if (off.has(key)) throw new Error("That helper already has a day off recorded for this date.");
    off.add(key);
  }
  return result;
}

export function recordFarrierVisit(data: WorkspaceData, record: HistoryEntry, plan: CalendarEvent): WorkspaceData {
  const current = data.events.find(e=>e.id===plan.id);
  if(JSON.stringify(current)!==JSON.stringify(plan)) throw new Error("This visit plan changed while the form was open. Close and reopen it to review the latest plan.");
  if(plan.cancelled || plan.type!=="Farrier" || record.type!=="Farrier" || record.horseId!==plan.horseId || record.sourceEventId!==plan.id) throw new Error("This record does not match an active farrier visit.");
  if(data.history.some(h=>h.id!==record.id&&h.sourceEventId===plan.id&&!h.voided)) throw new Error("Work for this horse's visit has already been recorded. Open the saved record to make a correction.");
  return savePlanningRecord(data,"history",record);
}

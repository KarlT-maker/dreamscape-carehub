import type { Horse, CareInstruction, CareTask, CalendarEvent, HistoryEntry, Helper, ShiftAssignment, DayOff, TaskCompletion } from "@/types";

export const STORAGE_KEY = "barncarehub-workspace-v1";
export const UNDO_KEY = "barncarehub-before-reset-v1";
export interface WorkspaceData {
  horses: Horse[]; care: CareInstruction[]; tasks: CareTask[]; events: CalendarEvent[];
  history: HistoryEntry[]; helpers: Helper[]; shifts: ShiftAssignment[]; daysOff: DayOff[];
}
export interface Snapshot {
  schema: 1; revision: number; savedAt: string; mode: "blank" | "roster" | "examples";
  data: WorkspaceData; completions: Record<string, TaskCompletion>;
}
export const emptyData = (): WorkspaceData => ({ horses: [], care: [], tasks: [], events: [], history: [], helpers: [], shifts: [], daysOff: [] });
export const emptySnapshot = (): Snapshot => ({ schema: 1, revision: 0, savedAt: "", mode: "blank", data: emptyData(), completions: {} });
const isText = (v: unknown): v is string => typeof v === "string";
const isDate = (v: unknown): v is string => isText(v) && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + "T12:00:00Z")) && new Date(v + "T12:00:00Z").toISOString().slice(0, 10) === v;

export function validateSnapshot(value: unknown): Snapshot {
  const s = value as Snapshot;
  if (!s || s.schema !== 1 || !Number.isInteger(s.revision) || s.revision < 0 || !isText(s.savedAt) || !["blank", "roster", "examples"].includes(s.mode) || !s.data) throw new Error("Choose a BarnCareHub backup made by this version.");
  const d = s.data;
  const lists = [d.horses, d.care, d.tasks, d.events, d.history, d.helpers, d.shifts, d.daysOff];
  if (!lists.every(Array.isArray) || !lists.every(rows => rows.every(r => r && isText(r.id) && r.id.length > 0) && new Set(rows.map(r => r.id)).size === rows.length)) throw new Error("The backup contains missing or duplicate records.");
  const horses = new Set(d.horses.map(h => h.id));
  const helpers = new Set(d.helpers.map(h => h.id));
  for (const h of d.horses) if (![h.name, h.breed, h.colour, h.location, h.specialInstructions, h.owner?.id, h.owner?.name].every(isText) || !h.name.trim() || !h.location.trim() || (h.birthDate !== "" && !isDate(h.birthDate)) || (h.arrivalDate !== "" && !isDate(h.arrivalDate)) || !["", "Mare", "Gelding", "Stallion"].includes(h.sex) || !["Active", "Away", "Archived"].includes(h.status) || (h.registeredName !== undefined && !isText(h.registeredName))) throw new Error("A horse profile in the backup is incomplete.");
  for (const c of d.care) if (!horses.has(c.horseId) || !["feed", "medication", "supplement"].includes(c.kind) || !["AM", "Lunch", "PM", "AM & PM", "AM & Lunch", "Lunch & PM", "AM & Lunch & PM"].includes(c.schedule) || ![c.name, c.instructions, "dose" in c ? c.dose : c.quantity].every(isText) || !isDate(c.effectiveStart) || (c.effectiveEnd !== undefined && !isDate(c.effectiveEnd))) throw new Error("A care instruction in the backup is invalid.");
  for (const e of d.events) if (!horses.has(e.horseId) || !isDate(e.date) || ![e.type, e.time, e.provider, e.reason, e.notes].every(isText)) throw new Error("An appointment in the backup is invalid.");
  for (const h of d.history) if (!horses.has(h.horseId) || !isDate(h.date) || ![h.title, h.detail, h.author, h.type].every(isText) || (h.provider !== undefined && !isText(h.provider))) throw new Error("A history entry in the backup is invalid.");
  for (const t of d.tasks) if (!horses.has(t.horseId) || !isDate(t.date) || ![t.category, t.period, t.title, t.detail].every(isText)) throw new Error("A task in the backup is invalid.");
  for (const h of d.helpers) if (![h.name, h.initials].every(isText)) throw new Error("A helper in the backup is invalid.");
  for (const shift of d.shifts) if (!helpers.has(shift.helperId) || !isDate(shift.date) || !isText(shift.paddock) || !["AM", "Lunch", "PM"].includes(shift.period)) throw new Error("A shift in the backup is invalid.");
  for (const off of d.daysOff) if (!helpers.has(off.helperId) || !isDate(off.date) || (off.note !== undefined && !isText(off.note))) throw new Error("A day off in the backup is invalid.");
  for (const row of [...d.events, ...d.shifts, ...d.daysOff]) if (row.cancelled !== undefined && typeof row.cancelled !== "boolean") throw new Error("A cancelled record in the backup is invalid.");
  for (const event of d.events) if (!["Vet", "Farrier", "Dentist", "Medication change", "Feed change", "Vaccination", "Deworming", "Weight check", "Other"].includes(event.type) || (event.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(event.time))) throw new Error("An appointment type or time is invalid.");
  for (const helper of d.helpers) if (!helper.name.trim()) throw new Error("Enter the helper's name.");
  for (const entry of d.history) if (!["Vet", "Farrier", "Medication", "Feed", "Weight", "Notes", "Photo"].includes(entry.type)) throw new Error("A history record type is invalid.");
  for (const entry of d.history) {
    if ((entry.farrierWork !== undefined && (entry.type !== "Farrier" || !["Trim", "Shoeing", "Reset / refit", "Shoe removal", "Other"].includes(entry.farrierWork))) || (entry.farrierFeet !== undefined && !isText(entry.farrierFeet)) || (entry.voided !== undefined && typeof entry.voided !== "boolean")) throw new Error("A farrier record is invalid.");
  }
  for (const event of d.events) {
    if((event.farrierWork!==undefined&&(event.type!=="Farrier"||!["Trim","Shoeing","Shoe removal","Other"].includes(event.farrierWork)))||(event.farrierFeet!==undefined&&!isText(event.farrierFeet))) throw new Error("A planned farrier visit is invalid.");
  }
  const recordedVisits=new Set<string>();
  for(const row of [...d.events,...d.history]) if(row.farrierWeekOnly!==undefined) {
    if(row.type!=="Farrier"||typeof row.farrierWeekOnly!=="boolean"||(row.farrierWeekOnly&&new Date(row.date+"T12:00:00Z").getUTCDay()!==1))throw new Error("A farrier week must start on Monday.");
  }
  for(const record of d.history) if(record.sourceEventId!==undefined) {
    const event=d.events.find(e=>e.id===record.sourceEventId);
    if(!isText(record.sourceEventId)||record.type!=="Farrier"||!event||event.type!=="Farrier"||event.horseId!==record.horseId) throw new Error("A farrier record must match its planned horse visit.");
    if(!record.voided){if(recordedVisits.has(record.sourceEventId))throw new Error("This farrier visit already has a completed work record.");recordedVisits.add(record.sourceEventId);}
  }
  if (!s.completions || typeof s.completions !== "object" || Array.isArray(s.completions) || !Object.values(s.completions).every(c => c && isText(c.completedAt) && isText(c.completedBy))) throw new Error("Saved task checkmarks are invalid.");
  return s;
}

type Store = Pick<Storage, "getItem" | "setItem">;
export function readWorkspace(storage: Store): Snapshot {
  const raw = storage.getItem(STORAGE_KEY);
  return raw ? validateSnapshot(JSON.parse(raw)) : emptySnapshot();
}
export function saveWorkspace(storage: Store, current: Snapshot, next: Snapshot, replace = false): Snapshot {
  const raw = storage.getItem(STORAGE_KEY);
  if (!replace && raw && validateSnapshot(JSON.parse(raw)).revision !== current.revision) throw new Error("Another tab changed these records. Refresh this page and try again.");
  if (!replace && !raw && current.revision > 0) throw new Error("Saved records were cleared in another tab. Refresh this page before editing.");
  const saved = validateSnapshot({ ...next, revision: current.revision + 1, savedAt: new Date().toISOString() });
  if (replace) storage.setItem(UNDO_KEY, raw || JSON.stringify(current));
  storage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return saved;
}

export function dailyTasks(data: WorkspaceData, today: string): CareTask[] {
  return data.horses.filter(h => h.status === "Active").flatMap(h => {
    const tasks: CareTask[] = [];
    for (const period of ["AM", "Lunch", "PM"] as const) {
      const feed = data.care.filter(c => c.horseId === h.id && c.kind !== "medication" && c.effectiveStart <= today && (!c.effectiveEnd || c.effectiveEnd >= today) && c.schedule.split(" & ").includes(period));
      if (feed.length) tasks.push({ id: `${today}-${h.id}-feed-${period}-${JSON.stringify(feed.map(c => [c.id, c.name, "quantity" in c ? c.quantity : "", c.schedule, c.instructions]).sort())}`, horseId: h.id, date: today, category: "Feed", period, title: feed.map(c => c.name).join(" + "), detail: feed.map(c => `${"quantity" in c ? c.quantity : ""} · ${c.instructions}`).join("; ") });
    }
    if (h.specialInstructions) tasks.push({ id: `${today}-${h.id}-special-${h.specialInstructions}`, horseId: h.id, date: today, category: "Special care", period: "AM", title: "Special instruction", detail: h.specialInstructions });
    return tasks;
  });
}

export function paddockNames(horses: Horse[], preferred: readonly string[]): string[] {
  return [...new Set([...preferred, ...horses.filter(h => h.status === "Active").map(h => h.location)])];
}

import type { WorkspaceData } from "./workspace";
import type { CalendarEvent, DayOff, HistoryEntry, Round, ShiftAssignment } from "../../types/index";
export type PlanningSection = "events" | "history" | "helpers" | "shifts" | "daysOff";
export type PlanningRecord<K extends PlanningSection> = WorkspaceData[K][number];

export type CrewAssignmentChange = {
  dates: string[];
  paddock: string;
  helperIds: string[];
  action: "assign" | "remove";
  beforeShifts: ShiftAssignment[];
  beforeDaysOff: DayOff[];
};

// One shared save for the whole day/week. Only the selected helpers' slots are
// compared, so unrelated fresh edits and other teammates are preserved.
export function changeCrewAssignments(data:WorkspaceData, change:CrewAssignmentChange):WorkspaceData {
  const dates=new Set(change.dates),helpers=new Set(change.helperIds);
  if(!dates.size||dates.size>7||!helpers.size||!change.paddock.trim()||![...helpers].every(id=>data.helpers.some(h=>h.id===id)))throw new Error("Choose a paddock and at least one helper.");
  const inScope=(row:ShiftAssignment)=>dates.has(row.date)&&helpers.has(row.helperId)&&row.paddock===change.paddock;
  const same=(a:{id:string}[],b:{id:string}[])=>JSON.stringify([...a].sort((x,y)=>x.id.localeCompare(y.id)))===JSON.stringify([...b].sort((x,y)=>x.id.localeCompare(y.id)));
  if(!same(data.shifts.filter(inScope),change.beforeShifts.filter(inScope)))throw new Error("These assignments changed while you were editing. Close and reopen the form to review the latest team.");
  const offScope=(row:DayOff)=>dates.has(row.date)&&helpers.has(row.helperId);
  if(change.action==="assign"&&!same(data.daysOff.filter(offScope),change.beforeDaysOff.filter(offScope)))throw new Error("A helper's days off changed. Close and reopen the form before assigning the week.");
  let shifts=data.shifts;
  if(change.action==="remove"){
    if(!shifts.some(s=>inScope(s)&&!s.cancelled))return data;
    return {...data,shifts:shifts.map(s=>inScope(s)&&!s.cancelled?{...s,cancelled:true}:s)};
  }
  const rounds:Round[]=["AM","Lunch","PM"];
  for(const date of dates)for(const helperId of helpers){
    if(data.daysOff.some(d=>!d.cancelled&&d.date===date&&d.helperId===helperId))continue;
    for(const period of rounds){
      const matches=(s:ShiftAssignment)=>s.date===date&&s.helperId===helperId&&s.paddock===change.paddock&&s.period===period;
      if(shifts.some(s=>matches(s)&&!s.cancelled))continue;
      const previous=shifts.find(matches);
      const next:ShiftAssignment={...previous,id:previous?.id??crypto.randomUUID(),date,helperId,paddock:change.paddock,period,cancelled:false};
      shifts=previous?shifts.map(s=>s.id===previous.id?next:s):[...shifts,next];
    }
  }
  return shifts===data.shifts?data:{...data,shifts};
}

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

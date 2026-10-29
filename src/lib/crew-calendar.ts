import type { Helper, Round, ShiftAssignment } from "@/types";
export type CrewGroup = { paddock: string; period: Round; people: {id: string; name: string}[] };
export function crewForDay(shifts:ShiftAssignment[],helpers:Helper[],date:string) {
  const groups=new Map<string,{paddock:string;people:{id:string;name:string;archived:boolean}[]}>();
  for(const shift of shifts){
    if(shift.cancelled||shift.date!==date)continue;
    const group=groups.get(shift.paddock)??{paddock:shift.paddock,people:[]};
    const helper=helpers.find(h=>h.id===shift.helperId);
    if(!group.people.some(p=>p.id===shift.helperId))group.people.push({id:shift.helperId,name:helper?.name??"Unknown helper",archived:!!helper?.archived});
    groups.set(shift.paddock,group);
  }
  return [...groups.values()].sort((a,b)=>a.paddock.localeCompare(b.paddock));
}
export function crewForDate(shifts: ShiftAssignment[], helpers: Helper[], date: string): CrewGroup[] {
  const groups = new Map<string, CrewGroup>();
  for (const shift of shifts) {
    if (shift.cancelled || shift.date !== date) continue;
    const key = JSON.stringify([shift.paddock, shift.period]);
    const group = groups.get(key) ?? {paddock: shift.paddock, period: shift.period, people: []};
    if (!group.people.some(p => p.id === shift.helperId)) group.people.push({id: shift.helperId, name: helpers.find(h => h.id === shift.helperId)?.name ?? "Unknown helper"});
    groups.set(key, group);
  }
  const rounds = ["AM", "Lunch", "PM"];
  return [...groups.values()].sort((a,b) => a.paddock.localeCompare(b.paddock) || rounds.indexOf(a.period) - rounds.indexOf(b.period));
}

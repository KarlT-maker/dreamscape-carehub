import type { CareInstruction, Horse } from "../types/index";
import { instructionState } from "./dates.ts";

export function specialCareState(horse:Horse,date:string) {
  return instructionState({effectiveStart:horse.specialCareStart||"0001-01-01",effectiveEnd:horse.specialCareEnd},date);
}
export function currentSpecialCare(horse:Horse,date:string) {
  return specialCareState(horse,date)==="Current"?horse.specialInstructions:"";
}
// The mash amount stays first, regardless of when an instruction was edited.
export function sortSummaryCare(items:CareInstruction[]) {
  const rank=(c:CareInstruction)=>c.kind==="feed"?(/mash/i.test(c.name)?0:1):c.kind==="supplement"?2:3;
  return [...items].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function endingCareToday(horses:Horse[],care:CareInstruction[],date:string) {
  return horses.filter(h=>h.status==="Active").flatMap(h=>[
    ...care.filter(c=>c.horseId===h.id&&c.kind==="medication"&&c.effectiveEnd===date&&instructionState(c,date)==="Current").map(c=>({id:c.id,horseId:h.id,horseName:h.name,title:c.name,kind:"Medication"})),
    ...(h.specialInstructions&&h.specialCareEnd===date&&specialCareState(h,date)==="Current"?[{id:`special-${h.id}`,horseId:h.id,horseName:h.name,title:h.specialInstructions,kind:"Special care"}]:[]),
  ]);
}

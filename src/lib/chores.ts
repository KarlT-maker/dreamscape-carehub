import type { CalendarEvent } from "../types/index";
import { dateLabel, isoWeek, offsetDate } from "./dates.ts";
export const WEEKDAYS=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
export function weekdayNumber(date:string) { return (new Date(date+"T12:00:00Z").getUTCDay()+6)%7+1; }
export function nextEventDate(event:CalendarEvent,from:string):string|null {
  if(!event.repeat)return (event.farrierWeekOnly?isoWeek(event.date).end:event.date)>=from?event.date:null;
  let day=from>event.date?from:event.date;
  if(event.repeat==="weekly"){
    const days=event.repeatDays??[weekdayNumber(event.date)];
    let found=false;
    for(let i=0;i<7;i++){if(days.includes(weekdayNumber(day))){found=true;break;}day=offsetDate(day,1);}
    if(!found)return null;
  }
  return event.repeatUntil&&day>event.repeatUntil?null:day;
}
export function eventOccursOn(event:CalendarEvent,date:string) {
  return !event.cancelled&&!event.farrierWeekOnly&&nextEventDate(event,date)===date;
}
export function repeatLabel(event:CalendarEvent) {
  if(!event.repeat)return "One time";
  const rule=event.repeat==="daily"?"Every day":`Every ${(event.repeatDays??[weekdayNumber(event.date)]).map(d=>WEEKDAYS[d-1]).join(", ")}`;
  return rule+(event.repeatUntil?` · through ${dateLabel(event.repeatUntil)}`:"");
}

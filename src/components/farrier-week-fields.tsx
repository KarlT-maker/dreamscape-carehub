"use client";
import { dateLabel, isoWeek, isoWeekStart, isoWeeksInYear, ranchDate } from "@/lib/dates";

export function FarrierWeekFields({date,onChange,showRange=true}:{date:string;onChange:(date:string)=>void;showRange?:boolean}) {
  const week=isoWeek(date);
  const first=Math.min(2000,week.year);
  const last=Math.max(week.year,Number(ranchDate().slice(0,4))+10);
  return <>
    <label>Year<select value={week.year} onChange={e=>{const year=Number(e.target.value);onChange(isoWeekStart(year,Math.min(week.week,isoWeeksInYear(year))));}}>{Array.from({length:last-first+1},(_,i)=><option key={first+i}>{first+i}</option>)}</select></label>
    <label>Week<select value={week.week} onChange={e=>onChange(isoWeekStart(week.year,Number(e.target.value)))}>{Array.from({length:isoWeeksInYear(week.year)},(_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}</select></label>
    {showRange&&<p className="record-wide muted">Week {week.week} · {dateLabel(week.start)} – {dateLabel(week.end)}</p>}
  </>;
}

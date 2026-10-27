"use client";
import type { ReactNode } from "react";
import { billingMonthWeeks, billingWeekMonth, billingWeekRange, dateLabel, isoWeek, isoWeekStart, ranchDate } from "@/lib/dates";

const months=Array.from({length:12},(_,i)=>({number:i+1,name:dateLabel(`2026-${String(i+1).padStart(2,"0")}-15`,{month:"long"})}));
function yearOptions(year:number) {
  const first=Math.min(2024,year),last=Math.max(year,Number(ranchDate().slice(0,4))+10);
  return Array.from({length:last-first+1},(_,i)=>first+i);
}
function sameMonthWeek(date:string,year:number) {
  const month=billingWeekMonth(date),old=billingMonthWeeks(isoWeek(date).year,month),next=billingMonthWeeks(year,month);
  const index=old.findIndex(w=>w.start===isoWeek(date).start);
  return next[Math.min(Math.max(index,0),next.length-1)].start;
}

export function FarrierWeekFields({date,onChange,showRange=true}:{date:string;onChange:(date:string)=>void;showRange?:boolean}) {
  const week=isoWeek(date),month=billingWeekMonth(date),weeks=billingMonthWeeks(week.year,month);
  return <>
    <label>Year<select value={week.year} onChange={e=>onChange(sameMonthWeek(date,Number(e.target.value)))}>{yearOptions(week.year).map(year=><option key={year}>{year}</option>)}</select></label>
    <label>Month<select value={month} onChange={e=>onChange(billingMonthWeeks(week.year,Number(e.target.value))[0].start)}>{months.map(m=><option key={m.number} value={m.number}>{m.name}</option>)}</select></label>
    <label className="record-wide">Week<select value={week.week} onChange={e=>onChange(isoWeekStart(week.year,Number(e.target.value)))}>{weeks.map(w=><option key={w.week} value={w.week}>Week {w.week} · {billingWeekRange(w.start)}</option>)}</select></label>
    {showRange&&<p className="record-wide muted">Week {week.week} · {dateLabel(week.start)} – {dateLabel(week.end)}</p>}
  </>;
}

export function FarrierMonthNavigator({date,onChange,disabled=false,children}:{date:string;onChange:(date:string)=>void;disabled?:boolean;children?:ReactNode}) {
  const week=isoWeek(date),month=billingWeekMonth(date),today=ranchDate(),current=isoWeek(today);
  const weeks=billingMonthWeeks(week.year,month);
  return <fieldset disabled={disabled} className="farrier-month-picker">
    <div className="farrier-controls"><label>Year<select value={week.year} onChange={e=>onChange(sameMonthWeek(date,Number(e.target.value)))}>{yearOptions(week.year).map(year=><option key={year}>{year}</option>)}</select></label>{children}<button type="button" className="button secondary" onClick={()=>onChange(today)}>This week</button><p className="muted">Today: {dateLabel(today,{month:"long",day:"numeric"})} · Week {current.week}</p></div>
    <div className="farrier-month-tabs" role="group" aria-label="Choose month">{months.map(m=><button type="button" key={m.number} aria-pressed={month===m.number} onClick={()=>onChange(billingMonthWeeks(week.year,m.number)[0].start)}>{m.name}</button>)}</div>
    <h2>{months[month-1].name} {week.year}</h2>
    <div className="farrier-week-tabs" role="group" aria-label="Choose week in month">{weeks.map(w=><button type="button" key={w.week} aria-pressed={w.start===week.start} onClick={()=>onChange(w.start)}><strong>Week {w.week}</strong><span>{billingWeekRange(w.start)}</span>{w.start===current.start&&<small>This week</small>}</button>)}</div>
    <p className="muted farrier-month-hint">Choose a month, then a week. Dates show the full Monday–Sunday week, including days in the next month.</p>
  </fieldset>;
}

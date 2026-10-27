"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays, ClipboardEdit, Sun } from "lucide-react";
import { useBarn } from "./provider";
import { calendarMonthDates, dateLabel, offsetDate, offsetMonth, weekStart } from "@/lib/dates";
import { crewForDate } from "@/lib/crew-calendar";
import { paddockNames } from "@/lib/data/workspace";
import { PADDOCKS } from "@/lib/data/roster";
import { ROUNDS } from "@/lib/schedules";
import { CrewEditor } from "./crew-editor";
import { Empty, PageHeader } from "./ui";

type View = "today" | "calendar" | "edit";
function DayAssignments({date,showEmpty=false}:{date:string;showEmpty?:boolean}) {
  const {shifts,helpers,horses,daysOff}=useBarn();
  const groups=crewForDate(shifts,helpers,date);
  const off=daysOff.filter(d=>!d.cancelled&&d.date===date);
  const paddocks=showEmpty ? [...new Set([...paddockNames(horses,PADDOCKS),...groups.map(g=>g.paddock)])] : [...new Set(groups.map(g=>g.paddock))];
  return <>
    {!groups.length&&<Empty>No assignments entered for this day yet. Use Edit schedule to add the team.</Empty>}
    <div className="crew-today-grid">{paddocks.map(paddock=><section className="panel crew-paddock" key={paddock}>
      <div className="panel-heading"><h3>{paddock}</h3></div>
      <dl>{ROUNDS.map(round=>{
        const people=groups.find(g=>g.paddock===paddock&&g.period===round)?.people??[];
        return <div key={round}><dt>{round}</dt><dd>{people.length ? people.map(person=><span className="crew-name" key={person.id}>{person.name}{off.some(d=>d.helperId===person.id)&&<small className="schedule-warning">Day off — review cover</small>}</span>):<span className="muted">Unassigned</span>}</dd></div>;
      })}</dl>
    </section>)}</div>
    <section className="panel crew-days-off"><div className="panel-heading"><h3>Days off</h3></div>
      <div className="padded">{off.length?off.map(day=><p key={day.id}><strong>{helpers.find(h=>h.id===day.helperId)?.name??"Unknown helper"}</strong>{day.note&&" · "+day.note}</p>):<p className="muted">No days off recorded.</p>}</div>
    </section>
  </>;
}

function CrewCalendar({date,onDateChange,onEdit,onToday}:{date:string;onDateChange:(date:string)=>void;onEdit:(date:string)=>void;onToday:()=>void}) {
  const {today,shifts,helpers,daysOff}=useBarn();
  const [mode,setMode]=useState<"month"|"week">("month");
  const [selected,setSelected]=useState<string|null>(null);
  const detail=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(selected)detail.current?.scrollIntoView({behavior:"smooth",block:"start"});},[selected]);
  const dates=mode==="month"?calendarMonthDates(date):Array.from({length:7},(_,i)=>offsetDate(weekStart(date),i));
  const title=mode==="month"?dateLabel(date,{month:"long",year:"numeric"}):"Week of "+dateLabel(weekStart(date));
  function move(amount:number) {setSelected(null);onDateChange(mode==="month"?offsetMonth(date,amount):offsetDate(date,amount*7));}
  function selectDay(day:string) {setSelected(day);if(day===selected)detail.current?.scrollIntoView({behavior:"smooth",block:"start"});}
  return <>
    <section className="panel crew-calendar">
      <div className="crew-calendar-toolbar">
        <div className="filter-row" aria-label="Calendar view"><button aria-pressed={mode==="month"} className={mode==="month"?"active":""} onClick={()=>{setMode("month");setSelected(null);}}>Month</button><button aria-pressed={mode==="week"} className={mode==="week"?"active":""} onClick={()=>{setMode("week");setSelected(null);}}>Week</button></div>
        <button className="button secondary" onClick={onToday}>Go to today</button>
        <label>{mode==="month"?"Choose month":"Choose week"}<input type={mode==="month"?"month":"date"} value={mode==="month"?date.slice(0,7):weekStart(date)} onInput={e=>{if(e.currentTarget.value){setSelected(null);onDateChange(mode==="month"?e.currentTarget.value+"-01":e.currentTarget.value);}}}/></label>
      </div>
      <div className="crew-calendar-heading"><button className="button secondary" aria-label={mode==="month"?"Previous month":"Previous week"} onClick={()=>move(-1)}>← Previous</button><h2 aria-live="polite">{title}</h2><button className="button secondary" aria-label={mode==="month"?"Next month":"Next week"} onClick={()=>move(1)}>Next →</button></div>
      <p className="padded muted">Choose a day to see the full team and days off. Assignments are shown for AM, Lunch and PM.</p>
      {mode==="month"&&<div className="crew-weekday-head" aria-hidden="true">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d}>{d}</span>)}</div>}
      <div className={mode==="month"?"crew-month-grid":"crew-week-grid"}>{dates.map(day=>{
        const groups=crewForDate(shifts,helpers,day);
        const off=daysOff.filter(d=>!d.cancelled&&d.date===day);
        const shown=mode==="month"?groups.slice(0,3):groups;
        const outside=day.slice(0,7)!==date.slice(0,7);
        return <button type="button" key={day} className={"crew-calendar-day"+(outside&&mode==="month"?" outside-month":"")+(day===today?" is-today":"")+(day===selected?" selected-day":"")} aria-label={"View assignments for "+dateLabel(day,{weekday:"long",month:"long",day:"numeric",year:"numeric"})} aria-pressed={day===selected} onClick={()=>selectDay(day)}>
          <span className="crew-day-number"><span className="crew-short-date">{Number(day.slice(-2))}</span><span className="crew-long-date">{dateLabel(day,{weekday:"short",month:"short",day:"numeric"})}</span>{day===today&&<small>Today</small>}</span>
          {!groups.length&&<span className="muted crew-no-assignment">No assignments</span>}
          {shown.map(group=><span className="crew-calendar-assignment" key={group.paddock+"-"+group.period}><strong>{group.paddock} <em>{group.period}</em></strong><span>{group.people.map(p=>p.name).join(", ")}</span></span>)}
          {groups.length>shown.length&&<span className="crew-more">+{groups.length-shown.length} more · View day</span>}
          {!!off.length&&<span className="crew-calendar-off">Off: {off.map(d=>helpers.find(h=>h.id===d.helperId)?.name??"Unknown helper").join(", ")}</span>}
        </button>;
      })}</div>
    </section>
    {selected&&<div ref={detail} className="crew-day-detail" tabIndex={-1}>
      <div className="crew-editor-heading"><div><p className="eyebrow">DAY DETAILS</p><h2>{dateLabel(selected,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h2></div><button className="button" onClick={()=>onEdit(selected)}>Edit this week</button><button className="button secondary" onClick={()=>setSelected(null)}>Close day details</button></div>
      <DayAssignments date={selected}/>
    </div>}
  </>;
}

export function CrewBoard() {
  const {today,saving,uncertain}=useBarn();
  const [view,setView]=useState<View>("today");
  const [date,setDate]=useState(today);
  function edit(day:string) {setDate(day);setView("edit");}
  return <>
    <PageHeader eyebrow="BARN TEAM" title="Who's on what" description="See today's team, look ahead on the calendar, or edit the schedule."/>
    <nav className="crew-view-nav" aria-label="Team schedule views">
      <button className={view==="today"?"active":""} aria-current={view==="today"?"page":undefined} disabled={saving||uncertain} onClick={()=>setView("today")}><Sun size={19}/>Today</button>
      <button className={view==="calendar"?"active":""} aria-current={view==="calendar"?"page":undefined} disabled={saving||uncertain} onClick={()=>{if(view==="today")setDate(today);setView("calendar");}}><CalendarDays size={19}/>Calendar</button>
      <button className={view==="edit"?"active":""} aria-current={view==="edit"?"page":undefined} disabled={saving||uncertain} onClick={()=>edit(view==="today"?today:date)}><ClipboardEdit size={19}/>Edit schedule</button>
    </nav>
    {view==="today"&&<section aria-label="Today's assignments"><div className="crew-editor-heading"><h2>{dateLabel(today,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h2><span className="badge">Today’s assignments</span></div><DayAssignments date={today} showEmpty/></section>}
    {view==="calendar"&&<CrewCalendar date={date} onDateChange={setDate} onEdit={edit} onToday={()=>{setDate(today);setView("today");}}/>}
    {view==="edit"&&<CrewEditor initialDate={date} onWeekChange={setDate}/>}
  </>;
}

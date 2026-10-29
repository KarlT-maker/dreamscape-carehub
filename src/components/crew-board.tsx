"use client";
import { useState } from "react";
import { ClipboardEdit, Sun } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel } from "@/lib/dates";
import { crewForDay } from "@/lib/crew-calendar";
import { paddockNames } from "@/lib/data/workspace";
import { PADDOCKS } from "@/lib/data/roster";
import { CrewEditor } from "./crew-editor";
import { Empty, PageHeader } from "./ui";
export function CrewBoard() {
  const {today,shifts,helpers,horses,daysOff,saving,uncertain}=useBarn();
  const [view,setView]=useState<"today"|"edit">("today");
  const [date,setDate]=useState(today);
  const groups=crewForDay(shifts,helpers,today);
  const paddocks=[...new Set([...paddockNames(horses,PADDOCKS),...groups.map(g=>g.paddock)])];
  const off=daysOff.filter(d=>!d.cancelled&&d.date===today);
  return <>
    <PageHeader eyebrow="BARN TEAM" title="Helpers’ work schedule" description="Full-day teams for each paddock. Use Edit schedule to plan a week or adjust individual days."/>
    <nav className="crew-view-nav" aria-label="Team schedule views">
      <button className={view==="today"?"active":""} aria-current={view==="today"?"page":undefined} disabled={saving||uncertain} onClick={()=>setView("today")}><Sun size={19}/>Today</button>
      <button className={view==="edit"?"active":""} aria-current={view==="edit"?"page":undefined} disabled={saving||uncertain} onClick={()=>{if(view==="today")setDate(today);setView("edit");}}><ClipboardEdit size={19}/>Edit schedule</button>
    </nav>
    {view==="edit"?<CrewEditor initialDate={date} onWeekChange={setDate}/>:<section aria-label="Today's assignments">
      <div className="crew-editor-heading"><h2>{dateLabel(today,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h2><span className="badge">Full day</span></div>
      {!groups.length&&<Empty>No assignments entered for today yet. Use Edit schedule to add the team.</Empty>}
      <div className="crew-today-grid">{paddocks.map(paddock=><section className="panel crew-paddock" key={paddock}><div className="panel-heading"><h3>{paddock}</h3></div><div className="padded crew-full-day">{groups.find(g=>g.paddock===paddock)?.people.map(person=><span className="crew-name" key={person.id}>{person.name}{person.archived&&<small className="muted">Archived helper · assignment kept</small>}{off.some(d=>d.helperId===person.id)&&<small className="schedule-warning">Day off — review cover</small>}</span>)??<span className="muted">Unassigned</span>}</div></section>)}</div>
      <section className="panel crew-days-off"><div className="panel-heading"><h3>Days off</h3></div><div className="padded">{off.length?off.map(day=><p key={day.id}><strong>{helpers.find(h=>h.id===day.helperId)?.name??"Unknown helper"}</strong>{day.note&&" · "+day.note}</p>):<p className="muted">No days off recorded.</p>}</div></section>
    </section>}
  </>;
}

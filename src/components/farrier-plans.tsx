"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Printer } from "lucide-react";
import { useBarn } from "./provider";
import { calendarMonthDates, dateLabel, isoWeek, offsetMonth } from "@/lib/dates";
import { farrierDayRows } from "@/lib/farrier";
import { Empty, PageHeader } from "./ui";
import { FarrierPlanForm } from "./farrier-plan-form";
import { FarrierForm } from "./farrier-form";
import type { CalendarEvent, HistoryEntry } from "@/types";

export function FarrierPlans() {
  const {today,horses,events,history,saving,uncertain}=useBarn();
  const [date,setDate]=useState(today);
  const [provider,setProvider]=useState("");
  const [editing,setEditing]=useState<CalendarEvent|"new"|null>(null);
  const [recording,setRecording]=useState<{plan?:CalendarEvent;record?:HistoryEntry}|null>(null);
  const [message,setMessage]=useState("");
  const [formKey,setFormKey]=useState(0);
  const daySheet=useRef<HTMLElement>(null);
  const formArea=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(editing||recording)formArea.current?.scrollIntoView({behavior:"smooth",block:"start"});},[editing,recording]);
  const busy=saving||uncertain||!!editing||!!recording;
  const providers=[...new Set(["Shelly",...events.filter(e=>e.type==="Farrier").map(e=>e.provider),...history.filter(h=>h.type==="Farrier").map(h=>h.provider??"")].filter(Boolean))].sort();
  const horse=(id:string)=>horses.find(h=>h.id===id);
  const rows=farrierDayRows(events,history,date,provider).sort((a,b)=>(horse((a.plan??a.record)!.horseId)?.name??"").localeCompare(horse((b.plan??b.record)!.horseId)?.name??""));
  const cancelled=events.filter(e=>e.type==="Farrier"&&e.cancelled&&e.date===date&&(!provider||e.provider===provider));
  const week=isoWeek(date);
  const dates=calendarMonthDates(date);
  return <>
    <PageHeader eyebrow="PLAN THE VISIT · RECORD THE WORK" title="Farrier calendar" description="Choose a date to see every horse, the proposed work and what was actually done." action={<div className="workspace-actions no-print"><button className="button" disabled={busy} onClick={()=>{setEditing("new");setFormKey(k=>k+1);setMessage("");}}><Plus size={18}/>Plan a horse</button><button className="button secondary" disabled={busy} onClick={()=>window.print()}><Printer size={18}/>Print this day</button></div>}/>
    <section className="panel crew-calendar no-print" aria-label="Farrier appointment calendar">
      <div className="crew-calendar-toolbar">
        <label>Visit date<input type="date" value={date} onInput={e=>{if(e.currentTarget.value)setDate(e.currentTarget.value);}} disabled={busy}/></label>
        <label>Farrier<select value={provider} onChange={e=>setProvider(e.target.value)} disabled={busy}><option value="">All farriers</option>{providers.map(p=><option key={p}>{p}</option>)}</select></label>
        <button className="button secondary" disabled={busy} onClick={()=>setDate(today)}>Today</button>
      </div>
      <div className="crew-calendar-heading"><button className="button secondary" disabled={busy} aria-label="Previous month" onClick={()=>setDate(offsetMonth(date,-1))}>← Previous</button><h2>{dateLabel(date,{month:"long",year:"numeric"})}</h2><button className="button secondary" disabled={busy} aria-label="Next month" onClick={()=>setDate(offsetMonth(date,1))}>Next →</button></div>
      <p className="padded muted">Select a day below. Planned work is kept separate from completed work and does not count towards the bill until recorded.</p>
      <div className="crew-weekday-head farrier-weekdays" aria-hidden="true">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=><span key={d}>{d}</span>)}</div>
      <div className="crew-month-grid farrier-month-grid">{dates.map(day=>{
        const entries=farrierDayRows(events,history,day,provider);
        const pending=entries.filter(r=>r.plan&&!r.record).length;
        const done=entries.filter(r=>r.record&&r.record.date===day).length;
        return <button className={"crew-calendar-day"+(day.slice(0,7)!==date.slice(0,7)?" outside-month":"")+(day===today?" is-today":"")+(day===date?" selected-day":"")} disabled={busy} key={day} aria-label={"Farrier visits for "+dateLabel(day,{weekday:"long",month:"long",day:"numeric",year:"numeric"})} aria-pressed={day===date} onClick={()=>{setDate(day);setMessage("");daySheet.current?.scrollIntoView({behavior:"smooth",block:"start"});}}>
          <span className="crew-day-number"><span className="crew-short-date">{Number(day.slice(-2))}</span><span className="crew-long-date">{dateLabel(day,{weekday:"short",month:"short",day:"numeric"})}</span>{day===today&&<small>Today</small>}</span>
          {!!pending&&<span className="farrier-planned-count">{pending} planned</span>}{!!done&&<span className="farrier-completed-count">{done} recorded</span>}
          {entries.slice(0,3).map((r,i)=><span key={i} className="crew-no-assignment farrier-calendar-horse">{horse((r.plan??r.record)!.horseId)?.name??"Unknown horse"}</span>)}{entries.length>3&&<span className="crew-more farrier-calendar-horse">+{entries.length-3} more</span>}
        </button>;
      })}</div>
    </section>
    {message&&<p className="workspace-notice no-print" role="status">{message}</p>}
    <div ref={formArea} className="farrier-day-sheet">
    {editing&&<FarrierPlanForm key={formKey} existing={editing==="new"?undefined:editing} date={date} provider={provider||"Shelly"} onClose={()=>setEditing(null)} onSaved={plan=>{setDate(plan.date);setProvider("");setMessage(`${horse(plan.horseId)?.name??"Horse"} — planned work saved for ${dateLabel(plan.date)}. Choose Plan a horse to add the next horse.`);}}/>}
    {recording&&<FarrierForm key={recording.record?.id??recording.plan?.id??"direct"} existing={recording.record} plan={recording.plan} initialDate={date} initialProvider={provider||"Shelly"} onClose={()=>setRecording(null)} onSaved={record=>{setRecording(null);setDate(record.date);setMessage("Actual work saved. It is now included in Work records for checking the weekly bill.");}}/>}
    </div>
    <section ref={daySheet} className="panel farrier-report farrier-day-sheet" aria-label="Farrier work for selected day">
      <div className="panel-heading"><div><p className="eyebrow">DREAMSCAPE RANCH · FARRIER VISIT SHEET</p><h2>{dateLabel(date,{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</h2><p>Week {week.week} · {week.year} · {provider||"All farriers"}</p></div><button className="button secondary no-print" disabled={busy||date>today} onClick={()=>setRecording({})}>Record unplanned work</button></div>
      <p className="padded muted">Proposed work is what the team thinks is needed. Record Shelly’s actual work after the visit; it may be different.</p>
      {!rows.length?<Empty>No horses listed for this date. Choose Plan a horse to prepare Shelly’s visit sheet.</Empty>:<div className="farrier-table-wrap"><table className="farrier-table farrier-visit-table"><thead><tr><th>Horse / paddock</th><th>Proposed work</th><th>Notes for Shelly</th><th>Actual work / notes</th><th className="no-print">Actions</th></tr></thead><tbody>{rows.map(({plan,record})=>{
        const h=horse((plan??record)!.horseId);
        return <tr key={plan?.id??record!.id}><td data-label="Horse / paddock"><strong>{h?.name??"Unknown horse"}</strong><small>{h?.location}</small><small>{plan?.provider??record?.provider}{plan?.time?" · "+plan.time+" PT":""}</small></td>
          <td data-label="Proposed work">{plan?<><strong>{plan.farrierWork??plan.reason}</strong>{plan.farrierFeet&&<small>{plan.farrierFeet}</small>}</>:"No plan recorded"}</td>
          <td data-label="Notes for Shelly" className="farrier-notes">{plan?.notes||"—"}</td>
          <td data-label="Actual work / notes" className="farrier-notes farrier-write-space">{record?<><strong>{record.farrierWork??record.title}</strong>{record.farrierFeet&&<small>{record.farrierFeet}</small>}{record.detail&&<p>{record.detail}</p>}<small>{dateLabel(record.date)} · {record.author}</small></>:<span className="no-print muted">Not recorded yet</span>}</td>
          <td className="no-print"><div className="farrier-row-actions">{record?<button className="text-button" disabled={busy} onClick={()=>setRecording({record})}>Edit actual work</button>:<><button className="button secondary" disabled={busy||date>today} onClick={()=>setRecording({plan})}>Record actual work</button><button className="text-button" disabled={busy} onClick={()=>{setEditing(plan!);setFormKey(k=>k+1);}}>Edit plan</button></>}</div></td>
        </tr>;
      })}</tbody></table></div>}
    </section>
    {!!cancelled.length&&<section className="panel padded no-print"><h3>Cancelled plans for this day</h3>{cancelled.map(plan=><p key={plan.id}>{horse(plan.horseId)?.name} · {plan.reason} <button className="text-button" disabled={busy} onClick={()=>{setEditing(plan);setFormKey(k=>k+1);}}>Edit cancelled plan</button></p>)}</section>}
  </>;
}

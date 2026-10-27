"use client";
import { useEffect, useRef, useState } from "react";
import { Plus, Printer } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, farrierDateLabel, isoWeek, offsetDate } from "@/lib/dates";
import { farrierWeekRows } from "@/lib/farrier";
import { Empty, PageHeader } from "./ui";
import { FarrierPlanForm } from "./farrier-plan-form";
import { FarrierForm } from "./farrier-form";
import { FarrierWeekFields } from "./farrier-week-fields";
import type { CalendarEvent, HistoryEntry } from "@/types";

export function FarrierPlans() {
  const {today,horses,events,history,saving,uncertain}=useBarn();
  const [date,setDate]=useState(today);
  const [provider,setProvider]=useState("");
  const [editing,setEditing]=useState<CalendarEvent|"new"|null>(null);
  const [recording,setRecording]=useState<{plan?:CalendarEvent;record?:HistoryEntry}|null>(null);
  const [message,setMessage]=useState("");
  const [formKey,setFormKey]=useState(0);
  const formArea=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(editing||recording)formArea.current?.scrollIntoView({behavior:"smooth",block:"start"});},[editing,recording]);
  const busy=saving||uncertain||!!editing||!!recording;
  const week=isoWeek(date);
  const providers=[...new Set(["Shelly",...events.filter(e=>e.type==="Farrier").map(e=>e.provider),...history.filter(h=>h.type==="Farrier").map(h=>h.provider??"")].filter(Boolean))].sort();
  const horse=(id:string)=>horses.find(h=>h.id===id);
  const rows=farrierWeekRows(events,history,week.start,week.end,provider).sort((a,b)=>(horse((a.plan??a.record)!.horseId)?.name??"").localeCompare(horse((b.plan??b.record)!.horseId)?.name??""));
  const cancelled=events.filter(e=>e.type==="Farrier"&&e.cancelled&&e.date>=week.start&&e.date<=week.end&&(!provider||e.provider===provider));
  return <>
    <PageHeader eyebrow="FARRIER RECORDS" title="Weekly schedule" description="Plan the next trim or shoeing by week, just like the paper sheet. An exact day is optional." action={<div className="workspace-actions no-print"><button className="button" disabled={busy} onClick={()=>{setEditing("new");setFormKey(k=>k+1);setMessage("");}}><Plus size={18}/>Plan work</button><button className="button secondary" disabled={busy} onClick={()=>window.print()}><Printer size={18}/>Print week for Shelly</button></div>}/>
    <section className="panel padded no-print" aria-label="Choose planned week"><fieldset disabled={busy}><div className="farrier-controls"><FarrierWeekFields date={date} onChange={setDate} showRange={false}/><label>Farrier<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="">All farriers</option>{providers.map(p=><option key={p}>{p}</option>)}</select></label><button className="button secondary" aria-label="Previous planned week" onClick={()=>setDate(offsetDate(week.start,-7))}>← Previous week</button><button className="button secondary" onClick={()=>setDate(today)}>This week</button><button className="button secondary" aria-label="Next planned week" onClick={()=>setDate(offsetDate(week.start,7))}>Next week →</button></div><p className="muted">Week {week.week} · {dateLabel(week.start)} – {dateLabel(week.end)}</p></fieldset></section>
    {message&&<p className="workspace-notice no-print" role="status">{message}</p>}
    <div ref={formArea} className="farrier-day-sheet">
      {editing&&<FarrierPlanForm key={formKey} existing={editing==="new"?undefined:editing} date={date} provider={provider||"Shelly"} onClose={()=>setEditing(null)} onSaved={plan=>{setDate(plan.date);setProvider("");setMessage(`${horse(plan.horseId)?.name??"Horse"} — proposed work saved for week ${isoWeek(plan.date).week}. Choose Plan work to add the next horse.`);}}/>}
      {recording&&<FarrierForm key={recording.record?.id??recording.plan?.id??"direct"} existing={recording.record} plan={recording.plan} initialDate={date} initialProvider={provider||"Shelly"} onClose={()=>setRecording(null)} onSaved={record=>{setRecording(null);setDate(record.date);setMessage(record.voided?"Work record deleted. To restore it, open Record work → Deleted records.":"Actual work saved. It is now included in Record work for checking the weekly bill.");}}/>}
    </div>
    <section className="panel farrier-report farrier-day-sheet" aria-label="Farrier work for selected week">
      <div className="panel-heading"><div><p className="eyebrow">DREAMSCAPE RANCH · FARRIER WEEK SHEET</p><h2>Week {week.week} · {week.year}</h2><p>{dateLabel(week.start)} – {dateLabel(week.end)} · {provider||"All farriers"}</p></div></div>
      <p className="padded muted">A red Planned marker is a reminder of proposed work. Only recorded work is included in bill totals.</p>
      {!rows.length?<Empty>No horses listed for this week. Choose Plan work to prepare Shelly’s sheet.</Empty>:<div className="farrier-table-wrap"><table className="farrier-table farrier-visit-table"><thead><tr><th>Horse / paddock</th><th>Proposed work</th><th>Notes for Shelly</th><th>Work done / day / notes</th><th className="no-print">Actions</th></tr></thead><tbody>{rows.map(({plan,record})=>{
        const h=horse((plan??record)!.horseId);
        return <tr key={plan?.id??record!.id}><td data-label="Horse / paddock"><strong>{h?.name??"Unknown horse"}</strong><small>{h?.location}</small><small>{plan?.provider??record?.provider}</small></td>
          <td data-label="Proposed work">{plan?<><span className={record?"farrier-completed-count":"farrier-planned-count"}>{record?"Recorded":"● Planned"}</span><strong>{plan.farrierWork??plan.reason}</strong>{plan.farrierFeet&&<small>{plan.farrierFeet}</small>}{!plan.farrierWeekOnly&&<small>{dateLabel(plan.date)}{plan.time?" · "+plan.time+" PT":""}</small>}</>:"—"}</td>
          <td data-label="Notes for Shelly" className="farrier-notes">{plan?.notes||"—"}</td>
          <td data-label="Work done / day / notes" className="farrier-notes farrier-write-space">{record?<><strong>{record.farrierWork??record.title}</strong>{record.farrierFeet&&<small>{record.farrierFeet}</small>}{record.detail&&<p>{record.detail}</p>}<small>{farrierDateLabel(record)} · {record.author}</small></>:<span className="no-print muted">Not recorded yet</span>}</td>
          <td className="no-print"><div className="farrier-row-actions">{record?<button className="text-button" disabled={busy} onClick={()=>setRecording({record})}>Edit work record</button>:<><button className="button secondary" disabled={busy||week.start>today} onClick={()=>setRecording({plan})}>Record work</button><button className="text-button" disabled={busy} onClick={()=>{setEditing(plan!);setFormKey(k=>k+1);}}>Edit plan</button></>}</div></td>
        </tr>;
      })}</tbody></table></div>}
    </section>
    {!!cancelled.length&&<section className="panel padded no-print"><h3>Cancelled plans for this week</h3>{cancelled.map(plan=><p key={plan.id}>{horse(plan.horseId)?.name} · {plan.reason} <button className="text-button" disabled={busy} onClick={()=>{setEditing(plan);setFormKey(k=>k+1);}}>Edit cancelled plan</button></p>)}</section>}
  </>;
}

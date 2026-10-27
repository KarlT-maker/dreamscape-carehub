"use client";
import { useState } from "react";
import Link from "next/link";
import { Printer, Plus } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, isoWeek, isoWeekStart, isoWeeksInYear, offsetDate } from "@/lib/dates";
import { farrierTotals, farrierWeekRecords } from "@/lib/farrier";
import { horsePath } from "@/lib/horse-path";
import { Empty, PageHeader } from "./ui";
import { FarrierForm } from "./farrier-form";
import type { HistoryEntry } from "@/types";

export function FarrierLog() {
  const {today,history,horses,saving,uncertain}=useBarn();
  const [date,setDate]=useState(today);
  const [provider,setProvider]=useState("");
  const [editing,setEditing]=useState<HistoryEntry|"new"|null>(null);
  const [entryDate,setEntryDate]=useState(today);
  const [entryProvider,setEntryProvider]=useState("Shelly");
  const [formKey,setFormKey]=useState(0);
  const [message,setMessage]=useState("");
  const week=isoWeek(date);
  const records=farrierWeekRecords(history,week.start,week.end,provider);
  const totals=farrierTotals(records);
  const firstYear=Math.min(2000,week.year,...history.map(h=>Number(h.date.slice(0,4))));
  const lastYear=Math.max(Number(today.slice(0,4))+10,week.year);
  const providers=[...new Set(["Shelly",...history.filter(h=>h.type==="Farrier"&&h.provider?.trim()).map(h=>h.provider!.trim())])].sort((a,b)=>a.localeCompare(b));
  const horseName=(id:string)=>horses.find(h=>h.id===id)?.name??"Unknown horse";
  function add() {setEntryDate(today>=week.start&&today<=week.end?today:week.start>today?today:week.start);setEntryProvider(provider||"Shelly");setFormKey(k=>k+1);setEditing("new");setMessage("");}
  return <div className="farrier-page">
    <PageHeader eyebrow="BARN RECORDS" title="Farrier records" description="Record completed trims and shoeing, then check each week against the farrier’s bill." action={<div className="workspace-actions no-print"><button className="button" disabled={saving||uncertain||!!editing} onClick={add}><Plus size={18}/>Record work</button><button className="button secondary" disabled={!!editing} onClick={()=>window.print()}><Printer size={18}/>Print week</button></div>}/>
    <section className="panel farrier-week-picker no-print" aria-label="Choose billing week">
      <div className="farrier-controls">
        <button className="button secondary" disabled={!!editing} aria-label="Previous billing week" onClick={()=>setDate(offsetDate(week.start,-7))}>← Previous</button>
        <label>Year<select value={week.year} disabled={!!editing} onChange={e=>{const y=Number(e.target.value);setDate(isoWeekStart(y,Math.min(week.week,isoWeeksInYear(y))));}}>{Array.from({length:lastYear-firstYear+1},(_,i)=>firstYear+i).map(y=><option key={y}>{y}</option>)}</select></label>
        <label>Week<select value={week.week} disabled={!!editing} onChange={e=>setDate(isoWeekStart(week.year,Number(e.target.value)))}>{Array.from({length:isoWeeksInYear(week.year)},(_,i)=><option key={i+1} value={i+1}>Week {i+1}</option>)}</select></label>
        <button className="button secondary" disabled={!!editing} aria-label="Next billing week" onClick={()=>setDate(offsetDate(week.start,7))}>Next →</button>
        <button className="button secondary" disabled={!!editing} onClick={()=>setDate(today)}>This week</button>
        <label>Farrier<select value={provider} disabled={!!editing} onChange={e=>setProvider(e.target.value)}><option value="">All farriers</option>{providers.map(p=><option key={p}>{p}</option>)}</select></label>
      </div>
      <p className="muted">Monday–Sunday calendar weeks. Choose the year and week number shown on the bill.</p>
    </section>
    {message&&<p className="workspace-notice no-print" role="status">{message}</p>}
    {editing&&<FarrierForm key={formKey+":"+(editing==="new"?"new":editing.id)} existing={editing==="new"?undefined:editing} initialDate={entryDate} initialProvider={entryProvider} allowAnother onClose={()=>setEditing(null)} onSaved={(record,another)=>{setDate(record.date);setProvider("");setMessage(`${horseName(record.horseId)} — ${record.farrierWork} saved for week ${isoWeek(record.date).week}.`);if(another){setEntryDate(record.date);setEntryProvider(record.provider??"Shelly");setFormKey(k=>k+1);setEditing("new");}else setEditing(null);}}/>}
    <section className="panel farrier-report" aria-label="Weekly farrier records">
      <div className="panel-heading"><div><p className="eyebrow">DREAMSCAPE RANCH · FARRIER WORK</p><h2>Week {week.week} · {week.year}</h2><p>{dateLabel(week.start)} – {dateLabel(week.end)} · {provider||"All farriers"}</p></div></div>
      <div className="farrier-totals"><span><strong>{totals.horses}</strong> {totals.horses===1?"horse":"horses"}</span><span><strong>{totals.records}</strong> {totals.records===1?"work entry":"work entries"}</span>{totals.work.filter(w=>w.count>0).map(w=><span key={w.label}><strong>{w.count}</strong> {w.label}</span>)}</div>
      <p className="padded muted farrier-count-note">Counts are work entries per horse, not individual shoes. Entries marked “Entered in error” are excluded from totals.</p>
      {!records.length?<Empty>No farrier work recorded for this week{provider?" for "+provider:""}. Choose Record work to enter a completed visit, or look at another week.</Empty>:<div className="farrier-table-wrap"><table className="farrier-table"><thead><tr><th>Date</th><th>Horse</th><th>Work done</th><th>Farrier</th><th>Notes</th><th>Recorded / updated by</th><th className="no-print">Action</th></tr></thead><tbody>{records.map(record=><tr key={record.id} className={record.voided?"farrier-voided":undefined}>
        <td data-label="Date">{dateLabel(record.date,{month:"short",day:"numeric"})}</td>
        <td data-label="Horse"><Link href={horsePath(record.horseId,"History")}>{horseName(record.horseId)}</Link></td>
        <td data-label="Work done"><strong>{record.farrierWork??"Not categorised"}</strong>{record.farrierFeet&&<small>{record.farrierFeet}</small>}{!record.farrierWork&&<small>{record.title}</small>}{record.voided&&<small className="farrier-error-label">Entered in error</small>}</td>
        <td data-label="Farrier">{record.provider||"Not recorded"}</td>
        <td data-label="Notes" className="farrier-notes">{record.detail||"—"}</td>
        <td data-label="Recorded / updated by">{record.author}</td>
        <td className="no-print"><button className="text-button" disabled={saving||uncertain||!!editing} aria-label={"Edit farrier record for "+horseName(record.horseId)+" on "+record.date} onClick={()=>{setEditing(record);setFormKey(k=>k+1);setMessage("");}}>Edit</button></td>
      </tr>)}</tbody></table></div>}
    </section>
    <p className="muted no-print">These entries also appear in each horse’s care history. For a mistake, edit the record or mark it as entered in error so the original entry stays traceable.</p>
  </div>;
}

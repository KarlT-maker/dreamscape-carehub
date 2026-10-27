"use client";
import { useState } from "react";
import Link from "next/link";
import { Printer, Plus } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, farrierDateLabel, isoWeek } from "@/lib/dates";
import { farrierTotals, farrierWeekRecords } from "@/lib/farrier";
import { horsePath } from "@/lib/horse-path";
import { Empty, PageHeader } from "./ui";
import { FarrierForm } from "./farrier-form";
import { FarrierMonthNavigator } from "./farrier-week-fields";
import { FarrierPlans } from "./farrier-plans";
import { FarrierRecordActions } from "./farrier-record-actions";
import type { HistoryEntry } from "@/types";

export function FarrierLog() {
  const {saving,uncertain}=useBarn();
  const [view,setView]=useState<"calendar"|"records">("records");
  return <div className="farrier-page"><nav className="crew-view-nav no-print" aria-label="Farrier views"><button aria-current={view==="records"?"page":undefined} className={view==="records"?"active":""} disabled={saving||uncertain} onClick={()=>setView("records")}>Record work</button><button aria-current={view==="calendar"?"page":undefined} className={view==="calendar"?"active":""} disabled={saving||uncertain} onClick={()=>setView("calendar")}>Weekly schedule</button></nav>{view==="calendar"?<FarrierPlans/>:<FarrierRecords/>}</div>;
}

function FarrierRecords() {
  const {today,history,horses,saving,uncertain}=useBarn();
  const [date,setDate]=useState(today);
  const [provider,setProvider]=useState("");
  const [editing,setEditing]=useState<HistoryEntry|"new"|null>(null);
  const [entryDate,setEntryDate]=useState(today);
  const [entryProvider,setEntryProvider]=useState("Shelly");
  const [formKey,setFormKey]=useState(0);
  const [message,setMessage]=useState("");
  const week=isoWeek(date);
  const records=farrierWeekRecords(history,week.start,week.end,provider).filter(record=>!record.voided);
  const deleted=history.filter(record=>record.type==="Farrier"&&record.voided).sort((a,b)=>b.date.localeCompare(a.date));
  const totals=farrierTotals(records);
  const providers=[...new Set(["Shelly",...history.filter(h=>h.type==="Farrier"&&h.provider?.trim()).map(h=>h.provider!.trim())])].sort((a,b)=>a.localeCompare(b));
  const horseName=(id:string)=>horses.find(h=>h.id===id)?.name??"Unknown horse";
  function add() {setEntryDate(today>=week.start&&today<=week.end?today:week.start>today?today:week.start);setEntryProvider(provider||"Shelly");setFormKey(k=>k+1);setEditing("new");setMessage("");}
  return <div className="farrier-page">
    <PageHeader eyebrow="FARRIER RECORDS" title="Record work" description="Enter what Shelly did and review saved work by week. To propose work for a future visit, open Weekly schedule." action={<div className="workspace-actions no-print"><button className="button" disabled={saving||uncertain||!!editing} onClick={add}><Plus size={18}/>Add work record</button><button className="button secondary" disabled={!!editing} onClick={()=>window.print()}><Printer size={18}/>Print week</button></div>}/>
    <section className="panel farrier-week-picker no-print" aria-label="Choose billing week">
      <FarrierMonthNavigator date={date} onChange={setDate} disabled={!!editing}><label>Farrier<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="">All farriers</option>{providers.map(p=><option key={p}>{p}</option>)}</select></label></FarrierMonthNavigator>
    </section>
    {message&&<p className="workspace-notice no-print" role="status">{message}</p>}
    {editing&&<FarrierForm key={formKey+":"+(editing==="new"?"new":editing.id)} existing={editing==="new"?undefined:editing} initialDate={entryDate} initialProvider={entryProvider} allowAnother onClose={()=>setEditing(null)} onSaved={(record,another)=>{setDate(record.date);setProvider("");setMessage(record.voided?`${horseName(record.horseId)} — record deleted. You can restore it under Deleted records.`:`${horseName(record.horseId)} — ${record.farrierWork} saved for week ${isoWeek(record.date).week}.`);if(another){setEntryDate(record.date);setEntryProvider(record.provider??"Shelly");setFormKey(k=>k+1);setEditing("new");}else setEditing(null);}}/>}
    <section className="panel farrier-report" aria-label="Weekly farrier records">
      <div className="panel-heading"><div><p className="eyebrow">DREAMSCAPE RANCH · FARRIER WORK</p><h2>Week {week.week} · {week.year}</h2><p>{dateLabel(week.start)} – {dateLabel(week.end)} · {provider||"All farriers"}</p></div></div>
      <div className="farrier-totals"><span><strong>{totals.horses}</strong> {totals.horses===1?"horse":"horses"}</span><span><strong>{totals.records}</strong> {totals.records===1?"work entry":"work entries"}</span>{totals.work.filter(w=>w.count>0).map(w=><span key={w.label}><strong>{w.count}</strong> {w.label}</span>)}</div>
      <p className="padded muted farrier-count-note">Counts are work entries per horse, not individual shoes. Deleted records are excluded from this list and its totals.</p>
      {!records.length?<Empty>No farrier work recorded for this week{provider?" for "+provider:""}. Choose Add work record to enter a completed visit, or look at another week.</Empty>:<div className="farrier-table-wrap"><table className="farrier-table"><thead><tr><th>Day (optional)</th><th>Horse</th><th>Work done</th><th>Farrier</th><th>Notes</th><th>Recorded / updated by</th><th className="no-print">Action</th></tr></thead><tbody>{records.map(record=><tr key={record.id}>
        <td data-label="Date">{record.farrierWeekOnly?"Day not noted":dateLabel(record.date,{month:"short",day:"numeric"})}</td>
        <td data-label="Horse"><Link href={horsePath(record.horseId,"History")}>{horseName(record.horseId)}</Link></td>
        <td data-label="Work done"><strong>{record.farrierWork??"Not categorised"}</strong>{record.farrierFeet&&<small>{record.farrierFeet}</small>}{!record.farrierWork&&<small>{record.title}</small>}</td>
        <td data-label="Farrier">{record.provider||"Not recorded"}</td>
        <td data-label="Notes" className="farrier-notes">{record.detail||"—"}</td>
        <td data-label="Recorded / updated by">{record.author}</td>
        <td className="no-print"><button className="text-button" disabled={saving||uncertain||!!editing} aria-label={"Edit farrier record for "+horseName(record.horseId)+" for "+farrierDateLabel(record)} onClick={()=>{setEditing(record);setFormKey(k=>k+1);setMessage("");}}>Edit</button>{!editing&&<FarrierRecordActions record={record} onChanged={()=>setMessage(`${horseName(record.horseId)} — record deleted. You can restore it under Deleted records.`)}/>}</td>
      </tr>)}</tbody></table></div>}
    </section>
    <details className="panel padded no-print farrier-deleted"><summary>Deleted records ({deleted.length})</summary><p className="muted">Deleted farrier records from all weeks. Restore an entry to put it back into the work lists and bill totals.</p>{deleted.length?deleted.map(record=><div className="day-off-row" key={record.id}><div><strong>{horseName(record.horseId)}</strong> · {farrierDateLabel(record)} · {record.farrierWork??record.title}<small className="muted">{record.provider}</small></div><FarrierRecordActions record={record} onChanged={()=>setMessage(`${horseName(record.horseId)} — record restored.`)}/></div>):<p>No deleted records.</p>}</details>
    <p className="muted no-print">These entries also appear in each horse’s care history. Use Edit to correct a record or Delete record to remove it.</p>
  </div>;
}

"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { FarrierWeekFields } from "./farrier-week-fields";
import { FARRIER_FEET, FARRIER_WORK } from "@/lib/farrier";
import { isoWeek } from "@/lib/dates";
import type { CalendarEvent } from "@/types";

export function FarrierPlanForm({existing:initial,date,provider="Shelly",onSaved,onClose}:{existing?:CalendarEvent;date:string;provider?:string;onSaved:(plan:CalendarEvent)=>void;onClose:()=>void}) {
  const {horses,savePlanning,saving,uncertain}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id??crypto.randomUUID());
  const [weekDate,setWeekDate]=useState(existing?.date??date);
  const [day,setDay]=useState(existing&&!existing.farrierWeekOnly?existing.date:"");
  const [error,setError]=useState("");
  const [extra,setExtra]=useState(false);
  const week=isoWeek(weekDate);
  return <section className="panel add-form record-form" aria-label="Plan farrier work"><div className="panel-heading"><h2>{existing?"Edit proposed work":"Plan next trim or shoeing"}</h2></div>
    <p className="muted">Choose a week and horse. This marks proposed work for Shelly; it does not count as work done.</p>
    <form onSubmit={async e=>{
      e.preventDefault();setError("");
      const f=Object.fromEntries([...new FormData(e.currentTarget)].map(([k,v])=>[k,String(v).trim()]));
      if((f.work==="Other"||f.feet==="See notes")&&!f.notes){setExtra(true);setError("Add a note explaining the proposed work.");return;}
      if(day&&(day<week.start||day>week.end)){setExtra(true);setError("Choose a day within the selected week, or leave it blank.");return;}
      const plan:CalendarEvent={...existing,id,horseId:f.horseId,date:day||week.start,farrierWeekOnly:!day,time:f.time,type:"Farrier",provider:f.provider||provider,reason:f.work+(f.feet?" · "+f.feet:""),notes:f.notes,farrierWork:f.work as CalendarEvent["farrierWork"],farrierFeet:f.feet,cancelled:f.status==="cancelled"};
      if(await savePlanning("events",plan,existing)){onSaved(plan);onClose();}else setError("Not saved yet. Your entries are still here. Check the message above.");
    }}><fieldset disabled={saving||uncertain}><div className="form-grid">
      <FarrierWeekFields date={weekDate} onChange={value=>{setWeekDate(value);setDay("");}}/>
      <label>Horse<select name="horseId" required defaultValue={existing?.horseId??""}><option value="">Choose horse</option>{[...horses].sort((a,b)=>a.name.localeCompare(b.name)).map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
      <label>Next work proposed<select name="work" defaultValue={existing?.farrierWork??"Trim"}>{FARRIER_WORK.map(w=><option key={w} value={w}>{w==="Trim"?"Next trim":w==="Shoeing"?"Next shoeing":w}</option>)}</select></label>
      {existing&&<label>Visit status<select name="status" defaultValue={existing.cancelled?"cancelled":"scheduled"}><option value="scheduled">Planned</option><option value="cancelled">Cancelled</option></select></label>}
    </div><details className="record-extra" open={extra} onToggle={e=>setExtra(e.currentTarget.open)}><summary>Extra details (optional)</summary><div className="form-grid">
      <label>Planned day (optional)<input type="date" value={day} min={week.start} max={week.end} onInput={e=>setDay(e.currentTarget.value)}/></label>
      <label>Farrier<input name="provider" defaultValue={existing?.provider??provider} maxLength={200}/></label>
      <label>Feet to work on<select name="feet" defaultValue={existing?.farrierFeet??""}><option value="">Not specified</option>{FARRIER_FEET.map(f=><option key={f}>{f}</option>)}</select></label>
      <label>Time (Pacific, optional)<input name="time" type="time" defaultValue={existing?.time}/></label>
      <label className="record-wide">Notes for Shelly<textarea name="notes" rows={2} maxLength={3000} defaultValue={existing?.farrierWork?existing.notes:[existing?.reason,existing?.notes].filter(Boolean).join(" · ")}/></label>
    </div></details><div className="workspace-actions"><button className="button" type="submit">{saving?"Saving…":"Save proposed work"}</button><button className="button secondary" type="button" onClick={onClose}>Cancel</button></div></fieldset>{error&&<p className="workspace-error" role="alert">{error}</p>}</form>
  </section>;
}

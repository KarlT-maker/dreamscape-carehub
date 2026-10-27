"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, isoWeek } from "@/lib/dates";
import { FARRIER_FEET, FARRIER_WORK } from "@/lib/farrier";
import type { HistoryEntry } from "@/types";

export function FarrierForm({existing:initial,horseId:fixedHorse,initialDate,initialProvider="Shelly",allowAnother=false,onSaved,onClose}:{existing?:HistoryEntry;horseId?:string;initialDate?:string;initialProvider?:string;allowAnother?:boolean;onSaved:(record:HistoryEntry,another:boolean)=>void;onClose:()=>void}) {
  const {horses,history,today,userName,savePlanning,saving,uncertain}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id??crypto.randomUUID());
  const [date,setDate]=useState(existing?.date??initialDate??today);
  const [horseId,setHorseId]=useState(existing?.horseId??fixedHorse??"");
  const [work,setWork]=useState(existing?.farrierWork??"");
  const [feet,setFeet]=useState(existing?.farrierFeet??"");
  const [voided,setVoided]=useState(existing?.voided??false);
  const [error,setError]=useState("");
  const week=date?isoWeek(date):null;
  const duplicate=history.some(h=>h.id!==id&&h.type==="Farrier"&&!h.voided&&h.horseId===horseId&&h.date===date);
  return <section className="panel add-form record-form farrier-form" aria-label={existing?"Edit farrier record":"Record farrier work"}>
    <div className="panel-heading"><h2>{existing?"Edit farrier record":"Record farrier work"}</h2><button type="button" className="icon-button" aria-label="Close form" disabled={saving||uncertain} onClick={onClose}><X/></button></div>
    <form onSubmit={async e=>{
      e.preventDefault();setError("");
      const another=(e.nativeEvent as SubmitEvent).submitter?.getAttribute("value")==="another";
      const fields=new FormData(e.currentTarget);
      const visitDate=String(fields.get("date")??"");
      const provider=String(fields.get("provider")??"").trim();
      const detail=String(fields.get("detail")??"").trim();
      if(!visitDate||visitDate>today||!horseId||!work||!provider){setError("Choose a horse, work done, farrier and a date on or before today.");return;}
      if((work==="Other"||feet==="See notes"||voided)&&!detail){setError("Add notes explaining the work or why this record was entered in error.");return;}
      const record:HistoryEntry={...existing,id,horseId,date:visitDate,type:"Farrier",provider,farrierWork:work as HistoryEntry["farrierWork"],farrierFeet:feet,voided,title:work+(feet?" · "+feet:""),detail,author:userName};
      try {if(await savePlanning("history",record,existing))onSaved(record,another);else setError("Not saved yet. Your entries are still here. Check the message above before trying again.");}
      catch(err){setError(err instanceof Error?err.message:"This record could not be saved.");}
    }}><fieldset disabled={saving||uncertain}>
      <div className="form-grid">
        <label>Visit date<input name="date" type="date" required max={today} value={date} onInput={e=>setDate(e.currentTarget.value)}/></label>
        <label>Farrier<input name="provider" required maxLength={200} defaultValue={existing?.provider??initialProvider}/></label>
        <label>Horse<select required value={horseId} disabled={!!fixedHorse} onChange={e=>setHorseId(e.target.value)}><option value="">Choose horse</option>{[...horses].sort((a,b)=>a.name.localeCompare(b.name)).map(h=><option key={h.id} value={h.id}>{h.name}{h.status==="Archived"?" (archived)":""}</option>)}</select></label>
        <label>Work done<select required value={work} onChange={e=>setWork(e.target.value as typeof work)}><option value="">Choose work</option>{FARRIER_WORK.map(w=><option key={w}>{w}</option>)}</select></label>
        <label>Feet worked on<select value={feet} onChange={e=>setFeet(e.target.value)}><option value="">Not specified</option>{FARRIER_FEET.map(f=><option key={f}>{f}</option>)}</select></label>
        {existing&&<label>Record status<select value={voided?"voided":"active"} onChange={e=>setVoided(e.target.value==="voided")}><option value="active">Include in weekly record</option><option value="voided">Entered in error — exclude from totals</option></select></label>}
        <label className="record-wide">Notes / extra work<textarea name="detail" rows={3} maxLength={3000} defaultValue={existing?.detail} placeholder="For example: front shoes, hind feet trimmed; pad fitted."/></label>
      </div>
      {week&&<p className="farrier-form-week">Week {week.week} · {week.year} · {dateLabel(week.start)} – {dateLabel(week.end)}</p>}
      {duplicate&&<p className="workspace-notice">This horse already has farrier work recorded for this date. Check the existing entry before adding another.</p>}
      {voided&&<p className="workspace-notice">This entry will stay in the history, marked as entered in error, and will be excluded from weekly totals.</p>}
      <div className="workspace-actions"><button type="submit" className="button" value="save">{saving?"Saving…":"Save record"}</button>{allowAnother&&!existing&&<button type="submit" className="button secondary" value="another">Save &amp; add next horse</button>}<button type="button" className="button secondary" onClick={onClose}>Cancel</button></div>
    </fieldset>{error&&<p role="alert" className="workspace-error">{error}</p>}</form>
  </section>;
}

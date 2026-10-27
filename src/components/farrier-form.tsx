"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, isoWeek } from "@/lib/dates";
import { FARRIER_FEET, FARRIER_WORK } from "@/lib/farrier";
import type { CalendarEvent, HistoryEntry } from "@/types";
import { FarrierRecordActions } from "./farrier-record-actions";
import { FarrierWeekFields } from "./farrier-week-fields";

export function FarrierForm({existing:initial,plan:initialPlan,horseId:fixedHorse,initialDate,initialProvider="Shelly",allowAnother=false,onSaved,onClose}:{existing?:HistoryEntry;plan?:CalendarEvent;horseId?:string;initialDate?:string;initialProvider?:string;allowAnother?:boolean;onSaved:(record:HistoryEntry,another:boolean)=>void;onClose:()=>void}) {
  const {horses,history,today,userName,savePlanning,completeFarrierVisit,saving,uncertain}=useBarn();
  const [existing]=useState(initial);
  const [plan]=useState(initialPlan);
  const [id]=useState(()=>existing?.id??crypto.randomUUID());
  const [date,setDate]=useState(existing?.date??plan?.date??initialDate??today);
  const [day,setDay]=useState(existing&&!existing.farrierWeekOnly?existing.date:"");
  const [horseId,setHorseId]=useState(existing?.horseId??plan?.horseId??fixedHorse??"");
  const [work,setWork]=useState(existing?.farrierWork==="Reset / refit"?"Other":existing?.farrierWork??plan?.farrierWork??"Trim");
  const [feet,setFeet]=useState(existing?.farrierFeet??plan?.farrierFeet??"");
  const voided=existing?.voided??false;
  const [error,setError]=useState("");
  const week=isoWeek(date);
  const duplicate=history.some(h=>h.id!==id&&h.type==="Farrier"&&!h.voided&&h.horseId===horseId&&h.date>=week.start&&h.date<=week.end);
  return <section className="panel add-form record-form farrier-form" aria-label={existing?"Edit farrier record":"Record farrier work"}>
    <div className="panel-heading"><h2>{existing?"Edit farrier record":"Record farrier work"}</h2><button type="button" className="icon-button" aria-label="Close form" disabled={saving||uncertain} onClick={onClose}><X/></button></div>
    <form onSubmit={async e=>{
      e.preventDefault();setError("");
      const another=(e.nativeEvent as SubmitEvent).submitter?.getAttribute("value")==="another";
      const fields=new FormData(e.currentTarget);
      const visitDate=day||week.start;
      const provider=String(fields.get("provider")??"").trim();
      const detail=String(fields.get("detail")??"").trim();
      if(visitDate>today||!horseId||!work||!provider){setError("Choose a horse, work done, farrier and a week that has already started.");return;}
      if(day&&(day<week.start||day>week.end)){setError("Choose an actual day within the selected week, or leave it blank.");return;}
      if((work==="Other"||feet==="See notes")&&!detail){setError("Add notes explaining the work.");return;}
      const record:HistoryEntry={...existing,id,horseId,date:visitDate,farrierWeekOnly:!day,type:"Farrier",provider,farrierWork:work as HistoryEntry["farrierWork"],farrierFeet:feet,voided,title:work+(feet?" · "+feet:""),detail,author:userName,...(plan?{sourceEventId:plan.id}:{})};
      try {if(await (plan?completeFarrierVisit(record,plan):savePlanning("history",record,existing)))onSaved(record,another);else setError("Not saved yet. Your entries are still here. Check the message above before trying again.");}
      catch(err){setError(err instanceof Error?err.message:"This record could not be saved.");}
    }}><fieldset disabled={saving||uncertain}>
      <div className="form-grid">
        <FarrierWeekFields date={date} onChange={value=>{setDate(value);setDay("");}}/>
        <label>Actual day (optional)<input name="date" type="date" min={week.start} max={week.end<today?week.end:today} value={day} onInput={e=>setDay(e.currentTarget.value)}/></label>
        <label>Farrier<input name="provider" required maxLength={200} defaultValue={existing?.provider??plan?.provider??initialProvider}/></label>
        <label>Horse<select required value={horseId} disabled={!!fixedHorse||!!plan||!!existing?.sourceEventId} onChange={e=>setHorseId(e.target.value)}><option value="">Choose horse</option>{[...horses].sort((a,b)=>a.name.localeCompare(b.name)).map(h=><option key={h.id} value={h.id}>{h.name}{h.status==="Archived"?" (archived)":""}</option>)}</select></label>
        <label>Work done<select required value={work} onChange={e=>setWork(e.target.value as typeof work)}>{FARRIER_WORK.map(w=><option key={w}>{w}</option>)}</select></label>
        <label>Feet worked on<select value={feet} onChange={e=>setFeet(e.target.value)}><option value="">Not specified</option>{FARRIER_FEET.map(f=><option key={f}>{f}</option>)}</select></label>
        <label className="record-wide">Notes / extra work<textarea name="detail" rows={3} maxLength={3000} defaultValue={existing?.farrierWork==="Reset / refit"?existing.title+". "+existing.detail:existing?.detail} placeholder="For example: front shoes, hind feet trimmed; pad fitted."/></label>
      </div>
      {week&&<p className="farrier-form-week">Week {week.week} · {week.year} · {dateLabel(week.start)} – {dateLabel(week.end)}</p>}
      {plan&&<p className="workspace-notice">Planned: {plan.reason}{plan.notes?" · "+plan.notes:""}. Confirm what Shelly actually did before saving. The original plan will stay on the calendar.</p>}
      {duplicate&&<p className="workspace-notice">This horse already has farrier work recorded for this week. Check the existing entry before adding another.</p>}
      {voided&&<p className="workspace-notice">This record is deleted and excluded from work lists and bill totals. Use Restore record to bring it back.</p>}
      <div className="workspace-actions"><button type="submit" className="button" value="save">{saving?"Saving…":"Save record"}</button>{allowAnother&&!existing&&<button type="submit" className="button secondary" value="another">Save &amp; add next horse</button>}<button type="button" className="button secondary" onClick={onClose}>Cancel</button></div>
    </fieldset>{error&&<p role="alert" className="workspace-error">{error}</p>}</form>
    {existing&&<FarrierRecordActions record={existing} onChanged={record=>onSaved(record,false)}/>}
  </section>;
}

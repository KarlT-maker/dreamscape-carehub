"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { WEEKDAYS, weekdayNumber } from "@/lib/chores";
import type { CalendarEvent } from "@/types";

export function ChoreForm({existing:initial,horseId,onClose}:{existing?:CalendarEvent;horseId?:string;onClose:()=>void}) {
  const {today,horses,savePlanning,saving,uncertain}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>initial?.id??crypto.randomUUID());
  const [date,setDate]=useState(initial?.date??today);
  const [repeat,setRepeat]=useState<"none"|"daily"|"weekly">(initial?.repeat??"none");
  const [days,setDays]=useState(initial?.repeatDays??[weekdayNumber(initial?.date??today)]);
  const [until,setUntil]=useState(initial?.repeatUntil??"");
  const [error,setError]=useState("");
  return <section className="panel add-form record-form" aria-label={existing?"Edit chore":"Add chore"}>
    <div className="panel-heading"><h2>{existing?"Edit chore":"Add chore"}</h2><button type="button" className="button secondary small" disabled={saving||uncertain} onClick={onClose}>Close chore form</button></div>
    <form onSubmit={async e=>{
      e.preventDefault();setError("");
      if(repeat==="weekly"&&!days.length){setError("Choose at least one weekday.");return;}
      if(repeat!=="none"&&until&&until<date){setError("The repeat end date must be on or after the start date.");return;}
      const fields=new FormData(e.currentTarget),text=(name:string)=>String(fields.get(name)??"").trim();
      const next:CalendarEvent={...existing,id,type:"Chore",horseId:text("horseId"),date,time:text("time"),provider:"",reason:text("title"),notes:text("notes"),cancelled:text("status")==="cancelled",repeat:repeat==="none"?undefined:repeat,repeatDays:repeat==="weekly"?[...days].sort((a,b)=>a-b):undefined,repeatUntil:repeat!=="none"&&until?until:undefined};
      try{if(await savePlanning("events",next,existing))onClose();else setError("Not saved yet. Your entries are still here; check the message above.");}catch{setError("This chore could not be saved. Your entries are still here.");}
    }}>
      <fieldset disabled={saving||uncertain}>
        <div className="form-grid">
          <label className="record-wide">Chore<input name="title" required maxLength={1000} defaultValue={existing?.reason??""} placeholder="For example, check water troughs"/></label>
          <label>Horse<select name="horseId" defaultValue={existing?.horseId??horseId??""}><option value="">Whole barn / no specific horse</option>{horses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
          <label>{repeat==="none"?"Date":"Starts"}<input type="date" required value={date} onChange={e=>{setDate(e.target.value);if(repeat==="none"&&e.target.value)setDays([weekdayNumber(e.target.value)]);}}/></label>
          <label>Time (Pacific, optional)<input name="time" type="time" defaultValue={existing?.time??""}/></label>
          <label>Repeat<select value={repeat} onChange={e=>setRepeat(e.target.value as typeof repeat)}><option value="none">Does not repeat</option><option value="daily">Every day</option><option value="weekly">Every week</option></select></label>
          {repeat!=="none"&&<label>Repeat through (optional)<input type="date" value={until} min={date} onChange={e=>setUntil(e.target.value)}/><small>Leave blank to keep repeating.</small></label>}
          <label className="record-wide">Instructions / notes<textarea name="notes" rows={3} maxLength={3000} defaultValue={existing?.notes??""}/></label>
          {existing&&<label>Status<select name="status" defaultValue={existing.cancelled?"cancelled":"scheduled"}><option value="scheduled">Scheduled</option><option value="cancelled">Cancelled (keep record)</option></select></label>}
        </div>
        {repeat==="weekly"&&<div className="chore-weekdays"><p>Repeat on</p><div className="filter-row" aria-label="Repeat weekdays">{WEEKDAYS.map((name,i)=><button type="button" key={name} aria-pressed={days.includes(i+1)} className={days.includes(i+1)?"active":""} onClick={()=>setDays(current=>current.includes(i+1)?current.filter(d=>d!==i+1):[...current,i+1])}>{name}</button>)}</div></div>}
        <p className="muted">This chore appears on Today when it is due and remains in the Calendar.{existing?.repeat&&" Changes here apply to the whole repeating chore. Use Repeat through to stop future dates while keeping past occurrences."}</p>
        <div className="workspace-actions"><button className="button" type="submit">{saving?"Saving…":"Save chore"}</button><button className="button secondary" type="button" onClick={onClose}>Cancel</button></div>
      </fieldset>
      {error&&<p className="workspace-error" role="alert">{error}</p>}
    </form>
  </section>;
}

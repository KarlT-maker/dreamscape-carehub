"use client";
import { useEffect, useRef, useState } from "react";
import { paddockNames } from "@/lib/data/workspace";
import { useBarn } from "./provider";
import { dateLabel, offsetDate, weekStart } from "@/lib/dates";
import { PADDOCKS } from "@/lib/data/roster";
import { ROUNDS } from "@/lib/schedules";
import { Empty } from "./ui";
import { RecordForm } from "./record-form";
import type { Helper, DayOff } from "@/types";
function HelperForm({existing:initial,onClose}:{existing?:Helper;onClose:()=>void}) {
  const {savePlanning}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id ?? crypto.randomUUID());
  return <RecordForm title={existing?"Edit helper name":"Add helper to schedule"} onClose={onClose} saveLabel="Save helper" fields={[{name:"name",label:"Helper name",value:existing?.name,required:true}]} onSave={f=>savePlanning("helpers",{...existing,id,name:f.name,initials:f.name.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()},existing)}/>;
}
function DayOffForm({existing:initial,initialDate,onClose}:{existing?:DayOff;initialDate:string;onClose:()=>void}) {
  const {savePlanning,helpers,today}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id ?? crypto.randomUUID());
  return <RecordForm title={existing?"Edit day off":"Add day off"} saveLabel="Save day off" onClose={onClose} fields={[
    {name:"helperId",label:"Helper",value:existing?.helperId ?? "",required:true,options:[{value:"",label:"Choose a helper"},...helpers.map(h=>({value:h.id,label:h.name}))]},
    {name:"date",label:"Date",type:"date",value:existing?.date ?? initialDate ?? today,required:true},
    {name:"note",label:"Note (optional)",value:existing?.note},
    ...(existing?[{name:"status",label:"Status",value:existing.cancelled?"cancelled":"off",options:[{value:"off",label:"Day off"},{value:"cancelled",label:"Cancelled"}]}]:[]),
  ]} onSave={f=>savePlanning("daysOff",{...existing,id,helperId:f.helperId,date:f.date,note:f.note,cancelled:f.status==="cancelled"},existing)}/>;
}
function WholeWeekForm({week,paddocks,initialPaddock,onClose,onSaved}:{week:string;paddocks:string[];initialPaddock:string;onClose:()=>void;onSaved:(message:string)=>void}) {
  const {helpers,shifts,daysOff,saveCrewAssignments,saving,uncertain}=useBarn();
  const [before]=useState(()=>({shifts,daysOff}));
  const [paddock,setPaddock]=useState(initialPaddock);
  const [selected,setSelected]=useState<string[]>([]);
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();heading.current?.scrollIntoView({block:"nearest"});},[]);
  const dates=Array.from({length:7},(_,i)=>offsetDate(week,i));
  const offDates=(id:string)=>dates.filter(date=>before.daysOff.some(d=>!d.cancelled&&d.helperId===id&&d.date===date));
  const hasWorkingDay=selected.some(id=>offDates(id).length<7);
  return <form className="schedule-week-form" onSubmit={async e=>{
    e.preventDefault();
    if(!paddock||!selected.length||!hasWorkingDay)return;
    if(await saveCrewAssignments({dates,paddock,helperIds:selected,action:"assign",beforeShifts:before.shifts,beforeDaysOff:before.daysOff})){
      onSaved(`${selected.map(id=>helpers.find(h=>h.id===id)?.name).join(" and ")} assigned to ${paddock} for ${dateLabel(week)} – ${dateLabel(dates[6])}. Recorded days off were skipped. You can change individual days below.`);
    }
  }}>
    <div className="crew-editor-heading"><h3 ref={heading} tabIndex={-1}>Assign whole week</h3><button type="button" className="button secondary small" disabled={saving||uncertain} onClick={onClose}>Cancel</button></div>
    <p><strong>{dateLabel(week)} – {dateLabel(dates[6])}</strong> · Monday to Sunday · AM, Lunch and PM</p>
    <label className="schedule-week-paddock">Paddock<select value={paddock} required disabled={saving||uncertain} onChange={e=>setPaddock(e.target.value)}><option value="">Choose a paddock</option>{paddocks.map(p=><option key={p}>{p}</option>)}</select></label>
    <fieldset disabled={saving||uncertain} className="schedule-helper-picker"><legend>Choose one or more helpers</legend><div className="schedule-helper-options">{helpers.map(h=>{
      const off=offDates(h.id),chosen=selected.includes(h.id);
      return <button type="button" key={h.id} aria-pressed={chosen} className={`schedule-helper-option${chosen?" selected":""}`} onClick={()=>setSelected(ids=>chosen?ids.filter(id=>id!==h.id):[...ids,h.id])}><strong>{h.name}</strong><span>{chosen?"Selected":"Select helper"}</span><small>{off.length?`Day${off.length>1?"s":""} off: ${off.map(d=>dateLabel(d,{weekday:"short",month:"short",day:"numeric"})).join(", ")}`:"Available all week"}</small></button>;
    })}</div></fieldset>
    <p className="muted">Adds the selected helpers alongside anyone already assigned. Recorded days off are skipped. Existing assignments stay in place.</p>
    {selected.length>0&&!hasWorkingDay&&<p className="schedule-warning" role="status">The selected helpers have days off recorded for the entire week.</p>}
    <button className="button" disabled={saving||uncertain||!paddock||!selected.length||!hasWorkingDay}>{saving?"Saving…":"Save whole week"}</button>
  </form>;
}
export function CrewEditor({initialDate,onWeekChange}:{initialDate:string;onWeekChange:(date:string)=>void}) {
  const {today,helpers,shifts,daysOff,horses,saveCrewAssignments,saving,uncertain}=useBarn();
  const [week,setWeek]=useState(()=>weekStart(initialDate));
  function chooseWeek(date:string) { const next=weekStart(date); setWeek(next); onWeekChange(next); }
  const [search,setSearch]=useState("");
  const [editingHelper,setEditingHelper]=useState<Helper|"new"|null>(null);
  const [editingOff,setEditingOff]=useState<DayOff|"new"|null>(null);
  const [assigningWeek,setAssigningWeek]=useState<string|null>(null);
  const [message,setMessage]=useState("");
  const dates=Array.from({length:7},(_,i)=>offsetDate(week,i));
  const on=(date:string,paddock:string)=>shifts.filter(s=>!s.cancelled&&s.date===date&&s.paddock===paddock);
  const helperName=(id:string)=>helpers.find(h=>h.id===id)?.name??"Unknown helper";
  const isOff=(helperId:string,date:string)=>daysOff.some(d=>!d.cancelled&&d.helperId===helperId&&d.date===date);
  const paddocks=[...new Set([...paddockNames(horses,PADDOCKS),...shifts.filter(s=>!s.cancelled&&dates.includes(s.date)).map(s=>s.paddock)])];
  const visible=paddocks.filter(p=>!search.trim()||p.toLowerCase().includes(search.trim().toLowerCase())||dates.some(date=>on(date,p).some(s=>helperName(s.helperId).toLowerCase().includes(search.trim().toLowerCase()))));
  const weekOff=daysOff.filter(d=>!d.cancelled&&d.date>=week&&d.date<=dates[6]).sort((a,b)=>a.date.localeCompare(b.date));
  const locked=saving||uncertain||assigningWeek!==null;
  async function assign(date:string,paddock:string,helperId:string) {
    if (!helperId || isOff(helperId,date)) return;
    setMessage("");
    if(await saveCrewAssignments({dates:[date],paddock,helperIds:[helperId],action:"assign",beforeShifts:shifts,beforeDaysOff:daysOff})) setMessage(`${helperName(helperId)} assigned to ${paddock} for AM, Lunch and PM on ${dateLabel(date)}.`);
  }
  async function unassign(date:string,paddock:string,helperId:string) {
    setMessage("");
    if(await saveCrewAssignments({dates:[date],paddock,helperIds:[helperId],action:"remove",beforeShifts:shifts,beforeDaysOff:daysOff})) setMessage(`${helperName(helperId)} removed from ${paddock} on ${dateLabel(date)}. Other helpers and days stay assigned.`);
  }
  return <>
    <div className="crew-editor-heading"><h2>Edit schedule</h2><button className="button" disabled={locked} onClick={()=>setEditingHelper("new")}>Add helper</button></div>
    <p className="workspace-notice">Names here are for the rota. Adding a name does not create a login or send an email.</p>
    {editingHelper && <HelperForm key={editingHelper==="new"?"new":editingHelper.id} existing={editingHelper==="new"?undefined:editingHelper} onClose={()=>setEditingHelper(null)}/>}
    <div className="helper-chips">{helpers.map(h=><button className="button secondary small" disabled={locked} key={h.id} onClick={()=>setEditingHelper(h)}>Edit {h.name}</button>)}</div>
    <section className="panel">
      <div className="board-toolbar schedule-toolbar">
        <button className="button secondary" disabled={locked} onClick={()=>chooseWeek(offsetDate(week,-7))}>Previous week</button>
        <label>Week of<input type="date" required value={week} disabled={locked} onInput={e=>e.currentTarget.value&&chooseWeek(e.currentTarget.value)}/></label>
        <button className="button secondary" disabled={locked} onClick={()=>chooseWeek(offsetDate(week,7))}>Next week</button>
        <button className="button secondary" disabled={locked} onClick={()=>chooseWeek(today)}>This week</button>
        <label>Find paddock or helper<input value={search} onChange={e=>setSearch(e.target.value)}/></label>
        <button className="button" disabled={locked||!helpers.length} onClick={()=>{setMessage("");setAssigningWeek("");}}>Assign whole week</button>
      </div>
      {assigningWeek!==null&&<WholeWeekForm week={week} paddocks={paddocks} initialPaddock={assigningWeek} onClose={()=>setAssigningWeek(null)} onSaved={text=>{setAssigningWeek(null);setMessage(text);}}/>}
      <p className="padded muted">Assign a team for the whole week, then adjust individual days below. Each new assignment covers AM, Lunch and PM. Use × beside a name to remove that helper for that day. Changes save online.</p>
      {message&&<p className="padded schedule-saved" role="status">{message}</p>}
      {!helpers.length ? <Empty>Choose Add helper above to start the weekly schedule.</Empty> : <div className="schedule-scroll"><table className="schedule-table"><thead><tr><th scope="col">Paddock</th>{dates.map(date=><th scope="col" key={date}>{dateLabel(date,{weekday:"short",month:"short",day:"numeric"})}</th>)}</tr></thead><tbody>
        {visible.map(paddock=><tr key={paddock}><th scope="row">{paddock}<button type="button" className="text-button schedule-week-link" aria-label={`Assign whole week · ${paddock}`} disabled={locked} onClick={()=>{setMessage("");setAssigningWeek(paddock);}}>Assign whole week</button></th>{dates.map(date=>{
          const team=on(date,paddock);
          const teamIds=[...new Set(team.map(s=>s.helperId))];
          const available=helpers.filter(h=>!team.some(s=>s.helperId===h.id));
          return <td key={date} className={date===today?"schedule-today":undefined}>
            <div className="schedule-team">{teamIds.length ? teamIds.map(id=>{
              const rounds=ROUNDS.filter(r=>team.some(s=>s.helperId===id&&s.period===r));
              return <div className="schedule-person" key={id}>
                <span>{helperName(id)}{rounds.length<ROUNDS.length&&<><small className="schedule-partial">{rounds.join(" & ")} only</small><button type="button" className="text-button schedule-full-day" disabled={locked||isOff(id,date)} aria-label={`Make full day · ${helperName(id)} · ${paddock} · ${date}`} onClick={()=>void assign(date,paddock,id)}>Make full day</button></>}{isOff(id,date)&&<small className="schedule-warning">Day off — review cover</small>}</span>
                <button type="button" className="schedule-remove" disabled={locked} aria-label={`Remove ${helperName(id)} from ${paddock} · ${date}`} onClick={()=>void unassign(date,paddock,id)}>×</button>
              </div>;
            }):<span className="muted">Unassigned</span>}</div>
            <select aria-label={`Add helper · ${paddock} · ${date}`} value="" disabled={locked||!available.some(h=>!isOff(h.id,date))} onChange={e=>void assign(date,paddock,e.target.value)}>
              <option value="">Add helper…</option>{available.map(h=><option key={h.id} value={h.id} disabled={isOff(h.id,date)}>{h.name}{isOff(h.id,date)?" (day off)":""}</option>)}
            </select>
          </td>;
        })}</tr>)}
      </tbody></table></div>}
    </section>
    <section className="panel">
      <div className="panel-heading"><h2>Days off this week</h2><button className="button secondary" disabled={locked||!helpers.length} onClick={()=>setEditingOff("new")}>Add day off</button></div>
      {editingOff&&<DayOffForm key={editingOff==="new"?"new":editingOff.id} existing={editingOff==="new"?undefined:editingOff} initialDate={today>=week&&today<=dates[6]?today:week} onClose={()=>setEditingOff(null)}/>}
      {weekOff.length ? <div className="padded">{weekOff.map(off=><div className="day-off-row" key={off.id}><span><strong>{helperName(off.helperId)}</strong> · {dateLabel(off.date)}{off.note&&" · "+off.note}</span><button className="text-button" disabled={locked} onClick={()=>setEditingOff(off)}>Edit day off</button></div>)}</div>:<Empty>No days off recorded for this week.</Empty>}
    </section>
  </>;
}

"use client";
import { useState } from "react";
import { paddockNames } from "@/lib/data/workspace";
import { useBarn } from "./provider";
import { dateLabel, offsetDate } from "@/lib/dates";
import { PADDOCKS } from "@/lib/data/roster";
import { ROUNDS } from "@/lib/schedules";
import { Empty, PageHeader } from "./ui";
import { RecordForm } from "./record-form";
import type { Helper, DayOff, Round, ShiftAssignment } from "@/types";
function monday(date:string) { return offsetDate(date,-((new Date(date+"T12:00:00Z").getUTCDay()+6)%7)); }
function HelperForm({existing:initial,onClose}:{existing?:Helper;onClose:()=>void}) {
  const {savePlanning}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id ?? crypto.randomUUID());
  return <RecordForm title={existing?"Edit helper name":"Add helper to schedule"} onClose={onClose} saveLabel="Save helper" fields={[{name:"name",label:"Helper name",value:existing?.name,required:true}]} onSave={f=>savePlanning("helpers",{...existing,id,name:f.name,initials:f.name.split(/\s+/).slice(0,2).map(n=>n[0]).join("").toUpperCase()},existing)}/>;
}
function DayOffForm({existing:initial,onClose}:{existing?:DayOff;onClose:()=>void}) {
  const {savePlanning,helpers,today}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id ?? crypto.randomUUID());
  return <RecordForm title={existing?"Edit day off":"Add day off"} saveLabel="Save day off" onClose={onClose} fields={[
    {name:"helperId",label:"Helper",value:existing?.helperId ?? "",required:true,options:[{value:"",label:"Choose a helper"},...helpers.map(h=>({value:h.id,label:h.name}))]},
    {name:"date",label:"Date",type:"date",value:existing?.date ?? today,required:true},
    {name:"note",label:"Note (optional)",value:existing?.note},
    ...(existing?[{name:"status",label:"Status",value:existing.cancelled?"cancelled":"off",options:[{value:"off",label:"Day off"},{value:"cancelled",label:"Cancelled"}]}]:[]),
  ]} onSave={f=>savePlanning("daysOff",{...existing,id,helperId:f.helperId,date:f.date,note:f.note,cancelled:f.status==="cancelled"},existing)}/>;
}
export function CrewBoard() {
  const {today,helpers,shifts,daysOff,horses,savePlanning,saving,uncertain}=useBarn();
  const [week,setWeek]=useState(()=>monday(today));
  const [round,setRound]=useState<Round>("AM");
  const [search,setSearch]=useState("");
  const [editingHelper,setEditingHelper]=useState<Helper|"new"|null>(null);
  const [editingOff,setEditingOff]=useState<DayOff|"new"|null>(null);
  const [message,setMessage]=useState("");
  const dates=Array.from({length:7},(_,i)=>offsetDate(week,i));
  const on=(date:string,paddock:string)=>shifts.filter(s=>!s.cancelled&&s.date===date&&s.paddock===paddock&&s.period===round);
  const helperName=(id:string)=>helpers.find(h=>h.id===id)?.name??"Unknown helper";
  const isOff=(helperId:string,date:string)=>daysOff.some(d=>!d.cancelled&&d.helperId===helperId&&d.date===date);
  const visible=paddockNames(horses,PADDOCKS).filter(p=>!search.trim()||p.toLowerCase().includes(search.trim().toLowerCase())||dates.some(date=>on(date,p).some(s=>helperName(s.helperId).toLowerCase().includes(search.trim().toLowerCase()))));
  const weekOff=daysOff.filter(d=>!d.cancelled&&d.date>=week&&d.date<=dates[6]).sort((a,b)=>a.date.localeCompare(b.date));
  async function assign(date:string,paddock:string,helperId:string) {
    if (!helperId || on(date,paddock).some(s=>s.helperId===helperId)) return;
    const before=shifts.find(s=>s.date===date&&s.paddock===paddock&&s.period===round&&s.helperId===helperId);
    const next={...before,id:before?.id??crypto.randomUUID(),date,paddock,period:round,helperId,cancelled:false};
    setMessage("");
    if(await savePlanning("shifts",next,before)) setMessage("Assignment saved.");
  }
  async function unassign(shift:ShiftAssignment) {
    setMessage("");
    if(await savePlanning("shifts",{...shift,cancelled:true},shift)) setMessage("Helper removed from this round. Other helpers stay assigned.");
  }
  return <>
    <PageHeader eyebrow="BARN TEAM" title="Who's on what" description="Add helper names, then choose who covers each paddock during the week." action={<button className="button" onClick={()=>setEditingHelper("new")}>Add helper</button>}/>
    <p className="workspace-notice">Names here are for the rota. Adding a name does not create a login or send an email.</p>
    {editingHelper && <HelperForm key={editingHelper==="new"?"new":editingHelper.id} existing={editingHelper==="new"?undefined:editingHelper} onClose={()=>setEditingHelper(null)}/>}
    <div className="helper-chips">{helpers.map(h=><button className="button secondary small" key={h.id} onClick={()=>setEditingHelper(h)}>Edit {h.name}</button>)}</div>
    <section className="panel">
      <div className="board-toolbar schedule-toolbar">
        <button className="button secondary" onClick={()=>setWeek(offsetDate(week,-7))}>Previous week</button>
        <label>Week of<input type="date" required value={week} onChange={e=>e.target.value&&setWeek(monday(e.target.value))}/></label>
        <button className="button secondary" onClick={()=>setWeek(offsetDate(week,7))}>Next week</button>
        <button className="button secondary" onClick={()=>setWeek(monday(today))}>This week</button>
        <label>Round<select value={round} onChange={e=>setRound(e.target.value as Round)}>{ROUNDS.map(r=><option key={r}>{r}</option>)}</select></label>
        <label>Find paddock or helper<input value={search} onChange={e=>setSearch(e.target.value)}/></label>
      </div>
      <p className="padded muted">Choose Add helper in a cell to assign one or more people together. Use × beside a name to remove only that person. Each change saves online. Switch Round to plan AM, Lunch or PM.</p>
      {!helpers.length ? <Empty>Choose Add helper above to start the weekly schedule.</Empty> : <div className="schedule-scroll"><table className="schedule-table"><thead><tr><th scope="col">Paddock</th>{dates.map(date=><th scope="col" key={date}>{dateLabel(date,{weekday:"short",month:"short",day:"numeric"})}</th>)}</tr></thead><tbody>
        {visible.map(paddock=><tr key={paddock}><th scope="row">{paddock}</th>{dates.map(date=>{
          const team=on(date,paddock);
          const available=helpers.filter(h=>!team.some(s=>s.helperId===h.id));
          return <td key={date} className={date===today?"schedule-today":undefined}>
            <div className="schedule-team">{team.length ? team.map(shift=><div className="schedule-person" key={shift.id}>
              <span>{helperName(shift.helperId)}{isOff(shift.helperId,date)&&<small className="schedule-warning">Day off — review cover</small>}</span>
              <button type="button" className="schedule-remove" disabled={saving||uncertain} aria-label={`Remove ${helperName(shift.helperId)} from ${paddock} · ${date} · ${round}`} onClick={()=>void unassign(shift)}>×</button>
            </div>):<span className="muted">Unassigned</span>}</div>
            <select aria-label={`Add helper · ${paddock} · ${date} · ${round}`} value="" disabled={saving||uncertain||!available.some(h=>!isOff(h.id,date))} onChange={e=>void assign(date,paddock,e.target.value)}>
              <option value="">Add helper…</option>{available.map(h=><option key={h.id} value={h.id} disabled={isOff(h.id,date)}>{h.name}{isOff(h.id,date)?" (day off)":""}</option>)}
            </select>
          </td>;
        })}</tr>)}
      </tbody></table></div>}
      <p className="padded" role="status">{message}</p>
    </section>
    <section className="panel">
      <div className="panel-heading"><h2>Days off this week</h2><button className="button secondary" disabled={!helpers.length} onClick={()=>setEditingOff("new")}>Add day off</button></div>
      {editingOff&&<DayOffForm key={editingOff==="new"?"new":editingOff.id} existing={editingOff==="new"?undefined:editingOff} onClose={()=>setEditingOff(null)}/>}
      {weekOff.length ? <div className="padded">{weekOff.map(off=><div className="day-off-row" key={off.id}><span><strong>{helperName(off.helperId)}</strong> · {dateLabel(off.date)}{off.note&&" · "+off.note}</span><button className="text-button" onClick={()=>setEditingOff(off)}>Edit day off</button></div>)}</div>:<Empty>No days off recorded for this week.</Empty>}
    </section>
  </>;
}

"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { dateLabel } from "@/lib/dates";
import { Empty } from "./ui";
import { RecordForm } from "./record-form";
import type { HistoryEntry } from "@/types";
const TYPES: HistoryEntry["type"][] = ["Vet","Farrier","Medication","Feed","Weight","Notes","Photo"];
function HistoryForm({horseId,initialType,existing:initial,onClose}:{horseId:string;initialType:HistoryEntry["type"];existing?:HistoryEntry;onClose:()=>void}) {
  const {today,userName,savePlanning}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id ?? crypto.randomUUID());
  return <RecordForm title={existing ? "Edit care record" : "Add care record"} saveLabel="Save record" onClose={onClose} fields={[
    {name:"type",label:"Record type",value:existing?.type ?? initialType,options:TYPES.map(t=>({value:t,label:t}))},
    {name:"date",label:"Visit / record date",type:"date",max:today,value:existing?.date ?? today,required:true},
    {name:"provider",label:"Vet, farrier or other provider",value:existing?.provider},
    {name:"title",label:"Title / reason",value:existing?.title,required:true},
    {name:"detail",label:"What happened / notes",type:"textarea",wide:true,value:existing?.detail,required:true},
  ]} onSave={f=>savePlanning("history",{...existing,id,horseId,date:f.date,type:f.type as HistoryEntry["type"],provider:f.provider,title:f.title,detail:f.detail,author:userName},existing)}/>;
}
export function History({horseId,initialFilter="All"}:{horseId:string;initialFilter?:string}) {
  const {history}=useBarn();
  const [filter,setFilter]=useState(["All",...TYPES].includes(initialFilter)?initialFilter:"All");
  const [editing,setEditing]=useState<HistoryEntry|"new"|null>(null);
  const entries=history.filter(h=>h.horseId===horseId&&(filter==="All"||h.type===filter)).sort((a,b)=>b.date.localeCompare(a.date));
  return <section className="panel">
    <div className="panel-heading"><h2>Care history</h2><button className="button secondary" onClick={()=>setEditing("new")}>Add record</button></div>
    <p className="padded muted">Your team enters past visits and care records here. Vet and farrier records are not imported from another website. Use Calendar for upcoming appointments.</p>
    <div className="filter-row" aria-label="History filters">{["All",...TYPES].map(t=><button key={t} className={filter===t?"active":""} aria-pressed={filter===t} onClick={()=>setFilter(t)}>{t}</button>)}</div>
    {editing && <HistoryForm key={editing==="new"?"new":editing.id} horseId={horseId} initialType={filter==="All"?"Notes":filter as HistoryEntry["type"]} existing={editing==="new"?undefined:editing} onClose={()=>setEditing(null)}/>}
    <div className="timeline">{entries.map(h=><article key={h.id}><div className="timeline-marker"/><p className="eyebrow">{dateLabel(h.date)} · {h.type}</p><h3>{h.title}</h3>{h.provider && <p className="muted">{h.provider}</p>}<p>{h.detail}</p><small className="muted">Last recorded by {h.author}</small><div><button className="text-button" onClick={()=>setEditing(h)}>Edit record</button></div></article>)}
      {!entries.length && <Empty>No records for this filter. Choose Add record to enter one.</Empty>}
    </div>
  </section>;
}

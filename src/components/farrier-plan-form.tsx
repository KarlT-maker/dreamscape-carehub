"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { RecordForm } from "./record-form";
import { FARRIER_FEET, FARRIER_WORK } from "@/lib/farrier";
import type { CalendarEvent } from "@/types";

export function FarrierPlanForm({existing:initial,date,provider="Shelly",onSaved,onClose}:{existing?:CalendarEvent;date:string;provider?:string;onSaved:(plan:CalendarEvent)=>void;onClose:()=>void}) {
  const {horses,savePlanning}=useBarn();
  const [existing]=useState(initial);
  const [id]=useState(()=>existing?.id??crypto.randomUUID());
  return <RecordForm title={existing?"Edit planned farrier work":"Plan farrier work"} saveLabel="Save planned work" onClose={onClose} fields={[
    {name:"date",label:"Visit date",type:"date",value:existing?.date??date,required:true},
    {name:"provider",label:"Farrier",value:existing?.provider??provider,required:true},
    {name:"horseId",label:"Horse",value:existing?.horseId??"",required:true,options:[{value:"",label:"Choose horse"},...[...horses].sort((a,b)=>a.name.localeCompare(b.name)).map(h=>({value:h.id,label:h.name}))]},
    {name:"work",label:"Proposed work",value:existing?.farrierWork??"Trim",options:FARRIER_WORK.map(w=>({value:w,label:w}))},
    {name:"feet",label:"Feet to work on",value:existing?.farrierFeet??"",options:[{value:"",label:"Not specified"},...FARRIER_FEET.map(f=>({value:f,label:f}))]},
    {name:"time",label:"Time (Pacific, optional)",type:"time",value:existing?.time},
    {name:"notes",label:"Notes for Shelly",type:"textarea",wide:true,value:existing?.farrierWork?existing.notes:[existing?.reason,existing?.notes].filter(Boolean).join(" · ")},
    ...(existing?[{name:"status",label:"Visit status",value:existing.cancelled?"cancelled":"scheduled",options:[{value:"scheduled",label:"Planned"},{value:"cancelled",label:"Cancelled"}]}]:[]),
  ]} onSave={async f=>{
    if((f.work==="Other"||f.feet==="See notes")&&!f.notes)throw new Error("Add a note explaining the proposed work.");
    const plan:CalendarEvent={...existing,id,horseId:f.horseId,date:f.date,time:f.time,type:"Farrier",provider:f.provider,reason:f.work+(f.feet?" · "+f.feet:""),notes:f.notes,farrierWork:f.work as CalendarEvent["farrierWork"],farrierFeet:f.feet,cancelled:f.status==="cancelled"};
    const saved=await savePlanning("events",plan,existing);if(saved)onSaved(plan);return saved;
  }}/>;
}

"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { RecordForm } from "./record-form";
import type { CalendarEvent, EventType } from "@/types";
export const EVENT_TYPES: EventType[] = ["Vet", "Farrier", "Dentist", "Medication change", "Feed change", "Vaccination", "Deworming", "Weight check", "Other"];
export function EventForm({existing: initial, horseId, onClose}: {existing?: CalendarEvent; horseId?: string; onClose: () => void}) {
  const {horses, today, savePlanning} = useBarn();
  const [existing] = useState(initial);
  const [id] = useState(()=>existing?.id ?? crypto.randomUUID());
  return <RecordForm title={existing ? "Edit appointment" : "Add appointment"} onClose={onClose} saveLabel="Save appointment" fields={[
    {name:"horseId",label:"Horse",value:existing?.horseId ?? horseId ?? "",required:true,options:[{value:"",label:"Choose a horse"},...horses.map(h=>({value:h.id,label:h.name}))]},
    {name:"type",label:"Appointment type",value:existing?.type ?? "Vet",options:EVENT_TYPES.map(t=>({value:t,label:t}))},
    {name:"date",label:"Date",type:"date",value:existing?.date ?? today,required:true},
    {name:"time",label:"Time (Pacific, optional)",type:"time",value:existing?.time},
    {name:"provider",label:"Vet, farrier or other provider",value:existing?.provider},
    {name:"reason",label:"Reason / appointment title",value:existing?.reason,required:true},
    {name:"notes",label:"Notes",type:"textarea",wide:true,value:existing?.notes},
    ...(existing ? [{name:"status",label:"Status",value:existing.cancelled ? "cancelled" : "scheduled",options:[{value:"scheduled",label:"Scheduled"},{value:"cancelled",label:"Cancelled"}]}] : []),
  ]} onSave={f=>savePlanning("events",{...existing,id,horseId:f.horseId,type:f.type as EventType,date:f.date,time:f.time,provider:f.provider,reason:f.reason,notes:f.notes,cancelled:f.status === "cancelled"},existing)} />;
}

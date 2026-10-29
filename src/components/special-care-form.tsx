"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { RecordForm } from "./record-form";
import type { Horse } from "@/types";
export function SpecialCareForm({horse:initial,onClose}:{horse:Horse;onClose:()=>void}) {
  const [horse]=useState(initial);
  const {updateHorse}=useBarn();
  return <RecordForm title={`Special care · ${horse.name}`} saveLabel="Save special care" onClose={onClose} fields={[
    {name:"instructions",label:"Special care instructions",type:"textarea",wide:true,value:horse.specialInstructions},
    {name:"start",label:"Starts (optional)",type:"date",value:horse.specialCareStart},
    {name:"end",label:"Last day (optional)",type:"date",value:horse.specialCareEnd},
  ]} onSave={values=>{
    if(values.start&&values.end&&values.end<values.start)throw new Error("The last day must be on or after the start date.");
    return updateHorse({...horse,specialInstructions:values.instructions,specialCareStart:values.start,specialCareEnd:values.end},horse);
  }}/>;
}

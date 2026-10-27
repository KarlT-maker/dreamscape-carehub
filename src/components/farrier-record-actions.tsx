"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { farrierDateLabel } from "@/lib/dates";
import type { HistoryEntry } from "@/types";

export function FarrierRecordActions({record,onChanged}:{record:HistoryEntry;onChanged:(record:HistoryEntry)=>void}) {
  const {horses,saving,uncertain,savePlanning}=useBarn();
  const [confirming,setConfirming]=useState(false);
  const [error,setError]=useState("");
  const name=horses.find(h=>h.id===record.horseId)?.name??"this horse";
  async function change() {
    setError("");
    const next={...record,voided:!record.voided};
    if(await savePlanning("history",next,record)){setConfirming(false);onChanged(next);}
    else setError("This change was not saved. Check the message above; your last saved record is kept.");
  }
  return <div className="farrier-record-actions no-print">
    {record.voided?<button type="button" className="button secondary" disabled={saving||uncertain} onClick={()=>void change()}>Restore record</button>:<button type="button" className="text-button farrier-delete" disabled={saving||uncertain} onClick={()=>setConfirming(true)}>Delete record</button>}
    {confirming&&<div className="workspace-confirm" role="group" aria-label="Confirm record deletion"><p>Delete the {record.farrierWork??record.title} record for <strong>{name}</strong> for {farrierDateLabel(record)}?</p><p>It will be removed from the work lists and bill totals. You can restore it under Deleted records.{record.sourceEventId?" The original planned appointment will stay in the weekly schedule.":""}</p><div className="workspace-actions"><button type="button" className="button danger" disabled={saving||uncertain} onClick={()=>void change()}>Yes, delete record</button><button type="button" className="button secondary" disabled={saving||uncertain} onClick={()=>setConfirming(false)}>Keep record</button></div></div>}
    {error&&<p role="alert" className="workspace-error">{error}</p>}
  </div>;
}

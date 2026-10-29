"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { PageHeader } from "./ui";
import { EventList } from "./event-list";
import { EventForm, EVENT_TYPES } from "./event-form";
import type { CalendarEvent } from "@/types";
import { nextEventDate } from "@/lib/chores";
import { ChoreForm } from "./chore-form";
export function Calendar({horseId}: {horseId?: string}) {
  const {events,horses,today} = useBarn();
  const [type,setType] = useState("All");
  const [horse,setHorse] = useState(horseId ?? "All");
  const [from,setFrom] = useState(today);
  const [status,setStatus] = useState("Scheduled");
  const [editing,setEditing] = useState<CalendarEvent | "new" | "chore" | null>(null);
  const filtered = events.filter(e=>(type==="All"||e.type===type)&&(horse==="All"||e.horseId===horse)&&(!from||nextEventDate(e,from))&&(status==="All"||(status==="Cancelled" ? e.cancelled : !e.cancelled))).sort((a,b)=>((nextEventDate(a,from)??a.date)+a.time).localeCompare((nextEventDate(b,from)??b.date)+b.time));
  return <>
    <PageHeader eyebrow="PLANNING AHEAD" title={horseId ? "Horse calendar" : "Calendar"} description="Plan visits and chores. Repeating chores show their next date here and appear on Today when due." action={<div className="workspace-actions"><button className="button" onClick={()=>setEditing("chore")}>Add chore</button><button className="button secondary" onClick={()=>setEditing("new")}>Add appointment</button></div>} />
    {editing==="chore"?<ChoreForm horseId={horseId??(horse!=="All"?horse:undefined)} onClose={()=>setEditing(null)}/>:editing&&<EventForm key={editing==="new" ? "new" : editing.id} existing={editing==="new" ? undefined : editing} horseId={horseId ?? (horse!=="All" ? horse : undefined)} onClose={()=>setEditing(null)} />}
    <div className="calendar-filters">
      <label>Event type<select value={type} onChange={e=>setType(e.target.value)}>{["All","Chore",...EVENT_TYPES].map(t=><option key={t}>{t}</option>)}</select></label>
      {!horseId && <label>Horse<select value={horse} onChange={e=>setHorse(e.target.value)}><option>All</option>{horses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>}
      <label>From date<input type="date" value={from} onChange={e=>setFrom(e.target.value)} /></label>
      <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}><option>Scheduled</option><option>Cancelled</option><option>All</option></select></label>
      <button className="button secondary" onClick={()=>setFrom("")}>Include past dates</button>
      <span className="muted">{filtered.length} calendar items</span>
    </div>
    <section className="panel calendar-list"><EventList events={filtered} onEdit={setEditing} fromDate={from} /></section>
  </>;
}

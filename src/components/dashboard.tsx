"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LayoutGrid, CalendarDays, Users } from "lucide-react";
import { useBarn } from "./provider";
import { PageHeader, Empty } from "./ui";
import { EventList } from "./event-list";
import { ChoreForm } from "./chore-form";
import { dateLabel } from "@/lib/dates";
import { eventOccursOn } from "@/lib/chores";
import { endingCareToday } from "@/lib/care-summary";
import { horsePath } from "@/lib/horse-path";
import type { CalendarEvent } from "@/types";
export function Dashboard() {
  const {today,horses,care,events}=useBarn();
  const [editing,setEditing]=useState<CalendarEvent|"new"|null>(null);
  const activeHorses=horses.filter(h=>h.status==="Active");
  const due=events.filter(e=>eventOccursOn(e,today)).sort((a,b)=>a.time.localeCompare(b.time)||a.reason.localeCompare(b.reason));
  const chores=due.filter(e=>e.type==="Chore");
  const ending=endingCareToday(horses,care,today);
  const boards=[
    {href:"/boards/full",icon:LayoutGrid,title:"Dreamscape horse summary",line:"Mash, supplements, medication and special care"},
    {href:"/boards/crew",icon:Users,title:"Helpers’ work schedule",line:"Full-day paddock assignments"},
    {href:"/calendar",icon:CalendarDays,title:"Calendar",line:"Appointments and repeating chores"},
  ];
  return <>
    <PageHeader eyebrow={dateLabel(today,{weekday:"long",month:"long",day:"numeric",year:"numeric"})} title="Today at the ranch" description={activeHorses.length+" horses across "+new Set(activeHorses.map(h=>h.location)).size+" paddocks."} action={<button className="button" onClick={()=>setEditing("new")}>Add chore</button>}/>
    <section className="board-links" aria-label="Barn pages">{boards.map(({href,icon:Icon,title,line})=><Link className="board-link" key={href} href={href}><span className="board-link-icon"><Icon size={26}/></span><span className="board-link-text"><strong>{title}</strong><small>{line}</small></span><ArrowUpRight size={20} className="board-link-arrow"/></Link>)}</section>
    {editing&&<ChoreForm key={editing==="new"?"new":editing.id} existing={editing==="new"?undefined:editing} onClose={()=>setEditing(null)}/>}
    <div className="dashboard-columns">
      <section className="panel"><div className="panel-heading"><h2>Today’s chores</h2><span className="badge">{chores.length} due</span></div>
        {chores.length?<EventList events={chores} fromDate={today} onEdit={setEditing}/>:<Empty>No chores scheduled for today. Choose Add chore for a one-time task or a repeating chore.</Empty>}
      </section>
      <div className="right-column">
        <section className="panel care-ending"><div className="panel-heading"><h2>Last day today</h2></div>
          {ending.length?<div className="padded">{ending.map(item=><article key={item.id} className="ending-care-item"><span className="badge amber">{item.kind}</span><h3><Link href={horsePath(item.horseId,"Care")}>{item.horseName}</Link> · {item.title}</h3><p>Today is the last day entered. It will no longer show as current care tomorrow.</p><Link className="text-link" href={horsePath(item.horseId,"Care")}>Review care plan</Link></article>)}</div>:<Empty>No medication or special care is due to finish today.</Empty>}
        </section>
        <section className="panel"><div className="panel-heading"><h2>Visiting today</h2><Link href="/calendar" className="text-link">Calendar</Link></div><EventList events={due.filter(e=>e.type!=="Chore")} fromDate={today}/></section>
      </div>
    </div>
  </>;
}

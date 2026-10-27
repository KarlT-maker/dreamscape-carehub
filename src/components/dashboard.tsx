"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Wheat, Pill, Users } from "lucide-react";
import { useBarn } from "./provider";
import { PageHeader } from "./ui";
import { TaskList } from "./task-list";
import { EventList } from "./event-list";
import { dateLabel, instructionState } from "@/lib/dates";
import { ROUNDS } from "@/lib/schedules";
import type { Round } from "@/types";
export function Dashboard() {
  const { today, horses, care, tasks, events } = useBarn();
  const [round,setRound] = useState<Round>("AM");
  const current=care.filter(c=>instructionState(c,today)==="Current");
  const activeHorses=horses.filter(h=>h.status==="Active");
  const boards=[
    {href:"/boards/mash",icon:Wheat,title:"Mash & feed",line:current.filter(c=>c.kind!=="medication").length+" feed and supplement lines"},
    {href:"/boards/medication",icon:Pill,title:"Medications",line:current.filter(c=>c.kind==="medication").length+" medication instructions"},
    {href:"/boards/crew",icon:Users,title:"Who's on what",line:"View and edit the helper schedule"},
  ];
  return <>
    <PageHeader eyebrow={dateLabel(today,{weekday:"long",month:"long",day:"numeric",year:"numeric"})} title="Today at the ranch" description={activeHorses.length+" horses across "+new Set(activeHorses.map(h=>h.location)).size+" paddocks."} action={<Link className="button secondary" href="/horses">View horses <ArrowUpRight size={18}/></Link>} />
    <section className="board-links" aria-label="Feed room boards">{boards.map(({href,icon:Icon,title,line})=><Link className="board-link" key={href} href={href}><span className="board-link-icon"><Icon size={26}/></span><span className="board-link-text"><strong>{title}</strong><small>{line}</small></span><ArrowUpRight size={20} className="board-link-arrow"/></Link>)}</section>
    <div className="dashboard-columns">
      <section className="panel"><div className="panel-heading"><h2>Today’s feed and supplements</h2></div>
        <div className="filter-row" aria-label="Feeding round">{ROUNDS.map(period=><button key={period} className={round===period ? "active" : ""} aria-pressed={round===period} onClick={()=>setRound(period)}>{period==="AM" ? "Morning · AM" : period==="PM" ? "Evening · PM" : "Lunch"}</button>)}</div>
        <TaskList tasks={tasks.filter(t=>t.category==="Feed" && t.period===round)} />
      </section>
      <div className="right-column">
        <section className="panel special"><div className="panel-heading"><h2>Special care</h2></div><TaskList tasks={tasks.filter(t=>t.category==="Special care")}/></section>
        <section className="panel"><div className="panel-heading"><h2>Visiting today</h2><Link href="/calendar" className="text-link">Calendar</Link></div><EventList events={events.filter(e=>!e.cancelled && !e.farrierWeekOnly && e.date===today).sort((a,b)=>a.time.localeCompare(b.time))}/></section>
      </div>
    </div>
  </>;
}

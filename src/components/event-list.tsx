"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import type { CalendarEvent } from "@/types";
import { dateLabel, isoWeek } from "@/lib/dates";
import { Empty } from "./ui";
import { horsePath } from "@/lib/horse-path";
import { nextEventDate, repeatLabel } from "@/lib/chores";
export function EventList({ events, onEdit, fromDate }: { events: CalendarEvent[]; onEdit?: (event: CalendarEvent) => void; fromDate?:string }) {
  const { horses, history } = useBarn();
  return (
    <div className="event-list">
      {!events.length && <Empty>No calendar items for this selection.</Empty>}
      {events.map((event) => {const shownDate=fromDate?nextEventDate(event,fromDate)??event.date:event.date;return (
        <article key={event.id} className="event-card">
          <div className="event-date">
            <strong>{event.farrierWeekOnly?`W${isoWeek(event.date).week}`:dateLabel(shownDate, { day: "numeric" })}</strong>
            <span>{event.farrierWeekOnly?isoWeek(event.date).year:dateLabel(shownDate, { month: "short" })}</span>
          </div>
          <div>
            <div className="event-meta">
              <span className="badge">{event.type}</span>
              <span>{event.farrierWeekOnly?"Week planned · day not set":event.time ? `${event.time} PT` : "Time not set"}</span>
              {event.cancelled && <span className="badge amber">Cancelled</span>}
              {event.type==="Chore"&&<span className="badge">{repeatLabel(event)}</span>}
              {history.some(h=>h.sourceEventId===event.id&&!h.voided)&&<span className="badge">Work recorded</span>}
            </div>
            <h3>
              {event.horseId?<Link href={horsePath(event.horseId, "Calendar")}>
                {horses.find((h) => h.id === event.horseId)?.name}
              </Link>:"Whole barn"} · {event.reason}
            </h3>
            <p className="muted">{event.provider}</p>
            <p>{event.notes}</p>
            {event.type==="Farrier"&&<Link className="text-button" href="/farrier">Open farrier records</Link>}
            {event.repeat&&<p className="muted">Starts {dateLabel(event.date)}</p>}
            {onEdit && <button className="text-button" onClick={()=>onEdit(event)}>{event.type==="Chore"?"Edit chore":"Edit appointment"}</button>}
          </div>
        </article>
      );})}
    </div>
  );
}

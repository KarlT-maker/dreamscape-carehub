"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import type { CalendarEvent } from "@/types";
import { dateLabel, isoWeek } from "@/lib/dates";
import { Empty } from "./ui";
import { horsePath } from "@/lib/horse-path";
export function EventList({ events, onEdit }: { events: CalendarEvent[]; onEdit?: (event: CalendarEvent) => void }) {
  const { horses, history } = useBarn();
  return (
    <div className="event-list">
      {!events.length && <Empty>No appointments for this selection.</Empty>}
      {events.map((event) => (
        <article key={event.id} className="event-card">
          <div className="event-date">
            <strong>{event.farrierWeekOnly?`W${isoWeek(event.date).week}`:dateLabel(event.date, { day: "numeric" })}</strong>
            <span>{event.farrierWeekOnly?isoWeek(event.date).year:dateLabel(event.date, { month: "short" })}</span>
          </div>
          <div>
            <div className="event-meta">
              <span className="badge">{event.type}</span>
              <span>{event.farrierWeekOnly?"Week planned · day not set":event.time ? `${event.time} PT` : "Time not set"}</span>
              {event.cancelled && <span className="badge amber">Cancelled</span>}
              {history.some(h=>h.sourceEventId===event.id&&!h.voided)&&<span className="badge">Work recorded</span>}
            </div>
            <h3>
              <Link href={horsePath(event.horseId, "Calendar")}>
                {horses.find((h) => h.id === event.horseId)?.name}
              </Link>{" "}
              · {event.reason}
            </h3>
            <p className="muted">{event.provider}</p>
            <p>{event.notes}</p>
            {event.type==="Farrier"&&<Link className="text-button" href="/farrier">Open farrier records</Link>}
            {onEdit && <button className="text-button" onClick={()=>onEdit(event)}>Edit appointment</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

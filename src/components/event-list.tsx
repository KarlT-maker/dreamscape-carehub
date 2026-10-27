"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import type { CalendarEvent } from "@/types";
import { dateLabel } from "@/lib/dates";
import { Empty } from "./ui";
import { horsePath } from "@/lib/horse-path";
export function EventList({ events, onEdit }: { events: CalendarEvent[]; onEdit?: (event: CalendarEvent) => void }) {
  const { horses } = useBarn();
  return (
    <div className="event-list">
      {!events.length && <Empty>No appointments for this selection.</Empty>}
      {events.map((event) => (
        <article key={event.id} className="event-card">
          <div className="event-date">
            <strong>{dateLabel(event.date, { day: "numeric" })}</strong>
            <span>{dateLabel(event.date, { month: "short" })}</span>
          </div>
          <div>
            <div className="event-meta">
              <span className="badge">{event.type}</span>
              <span>{event.time ? `${event.time} PT` : "Time not set"}</span>
              {event.cancelled && <span className="badge amber">Cancelled</span>}
            </div>
            <h3>
              <Link href={horsePath(event.horseId, "Calendar")}>
                {horses.find((h) => h.id === event.horseId)?.name}
              </Link>{" "}
              · {event.reason}
            </h3>
            <p className="muted">{event.provider}</p>
            <p>{event.notes}</p>
            {onEdit && <button className="text-button" onClick={()=>onEdit(event)}>Edit appointment</button>}
          </div>
        </article>
      ))}
    </div>
  );
}

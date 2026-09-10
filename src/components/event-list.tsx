"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import type { CalendarEvent } from "@/types";
import { dateLabel } from "@/lib/dates";
import { Empty } from "./ui";
export function EventList({ events }: { events: CalendarEvent[] }) {
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
              <span>{event.time} PT</span>
            </div>
            <h3>
              <Link href={"/horses/" + event.horseId}>
                {horses.find((h) => h.id === event.horseId)?.name}
              </Link>{" "}
              · {event.reason}
            </h3>
            <p className="muted">{event.provider}</p>
            <p>{event.notes}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

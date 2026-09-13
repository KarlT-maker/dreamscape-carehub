"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { PageHeader } from "./ui";
import { EventList } from "./event-list";
export function Calendar() {
  const { events, horses, today } = useBarn();
  const [type, setType] = useState("All");
  const [horse, setHorse] = useState("All");
  const [from, setFrom] = useState(today);
  const filtered = events
    .filter(
      (e) =>
        (type === "All" || e.type === type) &&
        (horse === "All" || e.horseId === horse) &&
        (!from || e.date >= from),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  return (
    <>
      <PageHeader
        eyebrow="PLANNING AHEAD"
        title="Calendar"
        description="Appointments, routine care and scheduled changes."
      />
      <div className="calendar-filters">
        <label>
          Event type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {[
              "All",
              "Vet",
              "Farrier",
              "Dentist",
              "Medication change",
              "Feed change",
              "Vaccination",
              "Deworming",
              "Weight check",
              "Other",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          Horse
          <select value={horse} onChange={(e) => setHorse(e.target.value)}>
            <option>All</option>
            {horses.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          From date
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <span className="muted">{filtered.length} events</span>
      </div>
      <section className="panel calendar-list">
        <EventList events={filtered} />
      </section>
    </>
  );
}

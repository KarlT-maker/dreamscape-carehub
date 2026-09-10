"use client";
import { useState } from "react";
import { useBarn } from "./provider";
import { dateLabel } from "@/lib/dates";
import { Empty } from "./ui";
export function History({ horseId }: { horseId: string }) {
  const { history } = useBarn();
  const [filter, setFilter] = useState("All");
  const entries = history
    .filter(
      (h) => h.horseId === horseId && (filter === "All" || h.type === filter),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Care history</h2>
      </div>
      <div className="filter-row" aria-label="History filters">
        {["All", "Vet", "Farrier", "Medication", "Feed", "Weight", "Notes"].map(
          (f) => (
            <button
              className={filter === f ? "active" : ""}
              aria-pressed={filter === f}
              key={f}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ),
        )}
      </div>
      <div className="timeline">
        {entries.map((h) => (
          <article key={h.id}>
            <div className="timeline-marker" />
            <p className="eyebrow">
              {dateLabel(h.date)} · {h.type}
            </p>
            <h3>{h.title}</h3>
            <p>{h.detail}</p>
            <small className="muted">{h.author}</small>
          </article>
        ))}
        {!entries.length && <Empty>No history for this filter.</Empty>}
      </div>
    </section>
  );
}

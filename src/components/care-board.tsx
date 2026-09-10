"use client";
import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, instructionState } from "@/lib/dates";
import { Empty } from "./ui";

export function CareBoard() {
  const { horses, care, today } = useBarn();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("All");
  const visible = horses.filter(
    (h) =>
      h.status === "Active" &&
      [h.name, h.location].some((value) =>
        value.toLowerCase().includes(search.toLowerCase()),
      ),
  );
  const inRound = (schedule: string) =>
    period === "All" || schedule === period || schedule === "AM & PM";
  return (
    <section className="panel medication-board">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">BARN WHITEBOARD</p>
          <h2>Feed & care instructions</h2>
        </div>
        <span className="badge">
          {dateLabel(today, { month: "short", day: "numeric" })}
        </span>
      </div>
      <div className="board-toolbar">
        <label className="search">
          <Search size={20} />
          <input
            aria-label="Search care board"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a horse or paddock…"
          />
        </label>
        <label>
          Feed round
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="All">AM & PM</option>
            <option>AM</option>
            <option>PM</option>
          </select>
        </label>
        <span className="muted">{visible.length} sample horses</span>
      </div>
      {visible.map((horse) => {
        const items = care.filter((c) => c.horseId === horse.id);
        const current = items.filter(
          (c) =>
            instructionState(c, today) === "Current" && inRound(c.schedule),
        );
        const feed = current.filter(
          (c) => c.kind === "feed" || c.kind === "supplement",
        );
        const medications = current.filter((c) => c.kind === "medication");
        const scheduled = items.filter(
          (c) => instructionState(c, today) === "Scheduled",
        );
        return (
          <article className="care-board-row" key={horse.id}>
            <div>
              <Link className="medication-horse" href={"/horses/" + horse.id}>
                {horse.name}
              </Link>
              <p className="muted">{horse.location}</p>
              <Link className="text-link" href={"/horses/" + horse.id}>
                Open profile →
              </Link>
            </div>
            <div>
              <p className="eyebrow">FEED & MASH</p>
              {feed.length ? (
                feed.map((c) => (
                  <div className="board-instruction" key={c.id}>
                    <h3>
                      {c.name} · {"quantity" in c ? c.quantity : ""}
                    </h3>
                    <span className="badge">{c.schedule}</span>
                    <p>{c.instructions}</p>
                  </div>
                ))
              ) : (
                <p className="muted">
                  No feed instructions recorded
                  {period !== "All" ? " for " + period : ""}.
                </p>
              )}
            </div>
            <div>
              {medications.length > 0 && (
                <>
                  <p className="eyebrow">MEDICATION</p>
                  {medications.map((c) => (
                    <div className="board-instruction" key={c.id}>
                      <h3>
                        {c.name} · {"dose" in c ? c.dose : ""}
                      </h3>
                      <span className="badge">{c.schedule}</span>
                      <p>{c.instructions}</p>
                      <small className="muted">
                        Since {dateLabel(c.effectiveStart)}
                        {c.effectiveEnd
                          ? " · ends " + dateLabel(c.effectiveEnd)
                          : " · ongoing"}
                      </small>
                    </div>
                  ))}
                </>
              )}
              {horse.specialInstructions && (
                <div className="board-special">
                  <p className="eyebrow">SPECIAL INSTRUCTIONS</p>
                  <p>{horse.specialInstructions}</p>
                </div>
              )}
              {scheduled.map((c) => (
                <div className="board-upcoming" key={c.id}>
                  <strong>From {dateLabel(c.effectiveStart)}</strong> · {c.name}{" "}
                  · {"dose" in c ? c.dose : c.quantity} · {c.schedule}
                </div>
              ))}
              <Link
                className="text-link"
                href={"/horses/" + horse.id + "?tab=Care"}
              >
                Care plan & dated instructions →
              </Link>
            </div>
          </article>
        );
      })}
      {!visible.length && <Empty>No horses match this search.</Empty>}
    </section>
  );
}

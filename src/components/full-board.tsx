"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, instructionState, offsetDate } from "@/lib/dates";
import { horsePath } from "@/lib/horse-path";
import { PADDOCKS, PADDOCK_ALIASES } from "@/lib/data/roster";
import type { CareInstruction } from "@/types";

/**
 * The whole feed room on one screen, the way the physical whiteboards read:
 * every paddock, every horse, what goes in the bucket, what medication goes
 * with it, and who is doing the round. Small type on purpose — this is the
 * "everything at a glance" view; the separate boards are the big-print ones.
 */

// An instruction written on more than this many lines is a house rule, not a
// per-horse note, so it moves to the key at the bottom instead of repeating.
const STANDING_THRESHOLD = 3;

function useFullScreen() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("wall-mode", on);
    document.body.classList.toggle("full-board-mode", on);
    return () => {
      document.body.classList.remove("wall-mode");
      document.body.classList.remove("full-board-mode");
    };
  }, [on]);
  useEffect(() => {
    if (!on) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOn(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [on]);
  return [on, setOn] as const;
}

const when = (s: CareInstruction["schedule"]) =>
  s === "AM & PM" ? "AM·PM" : s;

export function FullBoard() {
  const { horses, care, today, helpers, shifts, daysOff } = useBarn();
  const [full, setFull] = useFullScreen();

  const current = care.filter((c) => instructionState(c, today) === "Current");

  // Work out which instructions are house rules.
  const counts = new Map<string, number>();
  for (const c of current)
    if (c.instructions) counts.set(c.instructions, (counts.get(c.instructions) ?? 0) + 1);
  const standing = [...counts.entries()]
    .filter(([, n]) => n > STANDING_THRESHOLD)
    .map(([text]) => text);
  const standingMark = (text: string) => {
    const i = standing.indexOf(text);
    return i === -1 ? null : String.fromCharCode(65 + i); // A, B, C…
  };

  const helperName = (id?: string) =>
    helpers.find((h) => h.id === id)?.name ?? "—";
  const onShift = (paddock: string, period: "AM" | "PM") =>
    helperName(
      shifts.find(
        (s) => s.date === today && s.paddock === paddock && s.period === period,
      )?.helperId,
    );

  const offToday = daysOff
    .filter((d) => d.date === today)
    .map((d) => helperName(d.helperId));

  const weekEnd = offsetDate(today, 7);
  const changes = care
    .filter((c) => c.kind === "medication")
    .flatMap((c) => {
      const out: { date: string; text: string; horseId: string }[] = [];
      if (c.effectiveStart > today && c.effectiveStart <= weekEnd)
        out.push({ date: c.effectiveStart, text: `starts ${c.name} ${"dose" in c ? c.dose : ""}`, horseId: c.horseId });
      if (c.effectiveEnd && c.effectiveEnd >= today && c.effectiveEnd <= weekEnd)
        out.push({ date: c.effectiveEnd, text: `last day of ${c.name}`, horseId: c.horseId });
      return out;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const horseName = (id: string) => horses.find((h) => h.id === id)?.name ?? id;
  const active = horses.filter((h) => h.status === "Active");
  const medCount = current.filter((c) => c.kind === "medication").length;

  return (
    <section className="fb">
      <header className="fb-top">
        <div className="fb-title">
          <h1>Feed room board</h1>
          <span className="fb-date">
            {dateLabel(today, { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
        <div className="fb-stat">
          <strong>{active.length}</strong> horses
        </div>
        <div className="fb-stat">
          <strong>{medCount}</strong> meds on
        </div>
        <div className="fb-info">
          <span className="fb-label">Off today</span>
          {offToday.length ? offToday.join(", ") : "Everyone in"}
        </div>
        <div className="fb-info fb-changes">
          <span className="fb-label">Med changes this week</span>
          {changes.length
            ? changes.map((ch, i) => (
                <span key={i} className="fb-change">
                  <b>{dateLabel(ch.date, { weekday: "short" })}</b>{" "}
                  {horseName(ch.horseId)} {ch.text}
                </span>
              ))
            : "None"}
        </div>
        <button
          className="button secondary fb-toggle"
          onClick={() => setFull(!full)}
          aria-pressed={full}
        >
          {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          {full ? "Exit full screen" : "Full screen"}
        </button>
      </header>

      <div className="fb-grid">
        {PADDOCKS.map((paddock) => {
          const inPaddock = active.filter((h) => h.location === paddock);
          if (!inPaddock.length) return null;
          return (
            <div className="fb-paddock" key={paddock}>
              <div className="fb-paddock-head">
                <h2>
                  {paddock}
                  {PADDOCK_ALIASES[paddock] && (
                    <small> ({PADDOCK_ALIASES[paddock]})</small>
                  )}
                </h2>
                <span className="fb-crew">
                  <b>AM</b> {onShift(paddock, "AM")} <b>PM</b>{" "}
                  {onShift(paddock, "PM")}
                </span>
              </div>
              <table className="fb-table">
                <tbody>
                  {inPaddock.map((horse) => {
                    const mine = current.filter((c) => c.horseId === horse.id);
                    const feed = mine.filter((c) => c.kind !== "medication");
                    const meds = mine.filter((c) => c.kind === "medication");
                    return (
                      <tr key={horse.id} className={meds.length ? "has-med" : undefined}>
                        <th scope="row">
                          <Link href={horsePath(horse.id, "Care")} title="Change feed or medication">
                            {horse.name}
                          </Link>
                        </th>
                        <td>
                          {feed.map((c) => {
                            const mark = standingMark(c.instructions);
                            return (
                              <div key={c.id} className={c.kind === "supplement" ? "fb-supp" : "fb-feed"}>
                                <span className="fb-qty">{"quantity" in c ? c.quantity : ""}</span>{" "}
                                {c.name} <span className="fb-when">{when(c.schedule)}</span>
                                {mark ? (
                                  <sup className="fb-mark">{mark}</sup>
                                ) : (
                                  c.instructions && <span className="fb-note"> — {c.instructions}</span>
                                )}
                              </div>
                            );
                          })}
                          {meds.map((c) => (
                            <div key={c.id} className="fb-med">
                              <span className="fb-rx">Rx</span>{" "}
                              <b>{c.name}</b> {"dose" in c ? c.dose : ""}{" "}
                              <span className="fb-when">{when(c.schedule)}</span>
                              {c.effectiveEnd && (
                                <span className="fb-until"> until {dateLabel(c.effectiveEnd, { month: "short", day: "numeric" })}</span>
                              )}
                              {c.instructions && <span className="fb-note"> — {c.instructions}</span>}
                            </div>
                          ))}
                          {horse.specialInstructions && (
                            <div className="fb-special">⚑ {horse.specialInstructions}</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {standing.length > 0 && (
        <footer className="fb-key">
          {standing.map((text, i) => (
            <span key={text}>
              <sup className="fb-mark">{String.fromCharCode(65 + i)}</sup> {text}
            </span>
          ))}
          <span className="fb-key-legend">
            <span className="fb-rx">Rx</span> medication · <span className="fb-supp-dot" /> supplement · ⚑ special note · click a name to change it
          </span>
        </footer>
      )}
      {full && <p className="wall-hint">Press Esc to leave full screen.</p>}
    </section>
  );
}

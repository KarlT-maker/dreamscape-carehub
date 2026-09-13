"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import { dateLabel, instructionState } from "@/lib/dates";
import { horsePath } from "@/lib/horse-path";
import { PADDOCKS } from "@/lib/data/roster";
import { BoardFrame, PaddockGroup, type BoardFilters } from "./board-frame";
import { Empty } from "./ui";

/**
 * Doses due today, and the changes coming. Only horses on medication appear —
 * a board of forty blank rows is a board nobody reads.
 */
export function MedBoard() {
  const { horses, care, today } = useBarn();

  const rows = horses
    .filter((h) => h.status === "Active")
    .map((horse) => {
      const mine = care.filter(
        (c) => c.horseId === horse.id && c.kind === "medication",
      );
      return {
        horse,
        current: mine.filter((c) => instructionState(c, today) === "Current"),
        scheduled: mine.filter((c) => instructionState(c, today) === "Scheduled"),
      };
    })
    .filter((r) => r.current.length || r.scheduled.length);

  const dosesToday = rows.reduce((n, r) => n + r.current.length, 0);

  return (
    <BoardFrame
      eyebrow="FEED ROOM"
      title="Medications"
      subtitle="Doses due today, and changes coming up."
      count={dosesToday}
      countLabel="doses due"
      searchPlaceholder="Find a horse or medication…"
    >
      {({ search, period }: BoardFilters) => {
        const term = search.trim().toLowerCase();
        const visible = rows
          .map((row) => ({
            ...row,
            current: row.current.filter(
              (c) =>
                period === "All" ||
                c.schedule === period ||
                c.schedule === "AM & PM",
            ),
          }))
          .filter((row) => row.current.length || row.scheduled.length)
          .filter(
            (row) =>
              !term ||
              row.horse.name.toLowerCase().includes(term) ||
              row.horse.location.toLowerCase().includes(term) ||
              row.current.some((c) => c.name.toLowerCase().includes(term)) ||
              row.scheduled.some((c) => c.name.toLowerCase().includes(term)),
          );

        if (!visible.length)
          return (
            <Empty>
              No horses are on medication for this selection.
            </Empty>
          );

        return PADDOCKS.map((paddock) => {
          const inPaddock = visible.filter((r) => r.horse.location === paddock);
          if (!inPaddock.length) return null;
          return (
            <PaddockGroup key={paddock} paddock={paddock}>
              <div className="board-table" role="table">
                {inPaddock.map(({ horse, current, scheduled }) => (
                  <div className="board-line" role="row" key={horse.id}>
                    <Link className="board-horse" href={horsePath(horse.id)}>
                      {horse.name}
                    </Link>
                    <div className="board-items">
                      {current.map((c) => (
                        <div className="board-item" key={c.id}>
                          <span className="board-what">{c.name}</span>
                          <span className="board-amount strong">
                            {"dose" in c ? c.dose : ""}
                          </span>
                          <span className="board-when">{c.schedule}</span>
                          <span className="board-note">
                            {c.instructions}
                            {c.effectiveEnd && (
                              <em className="board-until">
                                {" "}
                                Last day {dateLabel(c.effectiveEnd)}.
                              </em>
                            )}
                          </span>
                        </div>
                      ))}
                      {scheduled.map((c) => (
                        <div className="board-item upcoming" key={c.id}>
                          <span className="board-what">
                            {c.name}
                            <em className="board-tag amber">from {dateLabel(c.effectiveStart)}</em>
                          </span>
                          <span className="board-amount">
                            {"dose" in c ? c.dose : ""}
                          </span>
                          <span className="board-when">{c.schedule}</span>
                          <span className="board-note">{c.instructions}</span>
                        </div>
                      ))}
                    </div>
                    <Link
                      className="board-edit"
                      href={horsePath(horse.id, "Care")}
                    >
                      Change
                    </Link>
                  </div>
                ))}
              </div>
            </PaddockGroup>
          );
        });
      }}
    </BoardFrame>
  );
}

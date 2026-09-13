"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import { instructionState } from "@/lib/dates";
import { horsePath } from "@/lib/horse-path";
import { PADDOCKS } from "@/lib/data/roster";
import { BoardFrame, PaddockGroup, type BoardFilters } from "./board-frame";
import { Empty } from "./ui";

/**
 * What someone reads while they are making up buckets: every mash and feed due,
 * grouped by paddock so a full round can be carried out in one trip.
 */
export function FeedBoard() {
  const { horses, care, today } = useBarn();

  const rows = horses
    .filter((h) => h.status === "Active")
    .map((horse) => ({
      horse,
      items: care.filter(
        (c) =>
          c.horseId === horse.id &&
          (c.kind === "feed" || c.kind === "supplement") &&
          instructionState(c, today) === "Current",
      ),
    }))
    .filter((row) => row.items.length > 0);

  const total = rows.reduce((n, r) => n + r.items.length, 0);

  return (
    <BoardFrame
      eyebrow="FEED ROOM"
      title="Mash &amp; feed"
      subtitle="Everything to be made up today, by paddock."
      count={total}
      countLabel="feed lines"
      searchPlaceholder="Find a horse or paddock…"
    >
      {({ search, period }: BoardFilters) => {
        const term = search.trim().toLowerCase();
        const visible = rows
          .map((row) => ({
            ...row,
            items: row.items.filter(
              (c) =>
                period === "All" ||
                c.schedule === period ||
                c.schedule === "AM & PM",
            ),
          }))
          .filter((row) => row.items.length > 0)
          .filter(
            (row) =>
              !term ||
              row.horse.name.toLowerCase().includes(term) ||
              row.horse.location.toLowerCase().includes(term),
          );

        if (!visible.length)
          return <Empty>Nothing matches that search.</Empty>;

        return PADDOCKS.map((paddock) => {
          const inPaddock = visible.filter((r) => r.horse.location === paddock);
          if (!inPaddock.length) return null;
          return (
            <PaddockGroup key={paddock} paddock={paddock}>
              <div className="board-table" role="table">
                {inPaddock.map(({ horse, items }) => (
                  <div className="board-line" role="row" key={horse.id}>
                    <Link className="board-horse" href={horsePath(horse.id)}>
                      {horse.name}
                    </Link>
                    <div className="board-items">
                      {items.map((c) => (
                        <div className="board-item" key={c.id}>
                          <span className="board-what">
                            {c.name}
                            {c.kind === "supplement" && (
                              <em className="board-tag">supplement</em>
                            )}
                          </span>
                          <span className="board-amount">
                            {"quantity" in c ? c.quantity : ""}
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

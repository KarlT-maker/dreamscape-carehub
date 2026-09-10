"use client";
import { useBarn } from "./provider";
import { dateLabel, instructionState } from "@/lib/dates";
import { Empty } from "./ui";
export function CarePlan({ horseId }: { horseId: string }) {
  const { care, today, horses } = useBarn();
  return (
    <div className="care-sections">
      {(["medication", "feed", "supplement"] as const).map((kind) => (
        <section className="panel" key={kind}>
          <div className="panel-heading">
            <h2>
              {
                {
                  medication: "Medications",
                  feed: "Feed & mash",
                  supplement: "Supplements",
                }[kind]
              }
            </h2>
          </div>
          <div className="care-cards">
            {!care.some((c) => c.horseId === horseId && c.kind === kind) && (
              <Empty>No {kind} instructions recorded.</Empty>
            )}
            {care
              .filter((c) => c.horseId === horseId && c.kind === kind)
              .sort((a, b) => {
                const rank = { Current: 0, Scheduled: 1, Ended: 2 };
                return (
                  rank[instructionState(a, today)] -
                    rank[instructionState(b, today)] ||
                  b.effectiveStart.localeCompare(a.effectiveStart)
                );
              })
              .map((c) => {
                const state = instructionState(c, today);
                return (
                  <article
                    className={"instruction " + state.toLowerCase()}
                    key={c.id}
                  >
                    <div className="row-between">
                      <h3>{c.name}</h3>
                      <span
                        className={
                          "badge " + (state === "Scheduled" ? "amber" : "")
                        }
                      >
                        {state}
                      </span>
                    </div>
                    <p className="dose">
                      {"dose" in c ? c.dose : c.quantity}{" "}
                      <span>· {c.schedule}</span>
                    </p>
                    <p>{c.instructions}</p>
                    <div className="effective">
                      Effective {dateLabel(c.effectiveStart)}{" "}
                      {c.effectiveEnd
                        ? "– " + dateLabel(c.effectiveEnd)
                        : "onward"}
                    </div>
                  </article>
                );
              })}
          </div>
        </section>
      ))}
      <section className="panel">
        <div className="panel-heading">
          <h2>Special instructions</h2>
        </div>
        <p className="padded">
          {horses.find((h) => h.id === horseId)?.specialInstructions ||
            "No special instructions recorded."}
        </p>
      </section>
    </div>
  );
}

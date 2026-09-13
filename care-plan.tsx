"use client";
import { useState } from "react";
import { Plus, Pencil, CircleSlash } from "lucide-react";
import { useBarn } from "./provider";
import { dateLabel, instructionState, offsetDate } from "@/lib/dates";
import type { CareInstruction } from "@/types";
import { Empty } from "./ui";
import { CareForm } from "./care-form";

const SECTIONS = [
  { kind: "medication", title: "Medications", add: "Add a medication" },
  { kind: "feed", title: "Feed & mash", add: "Add a feed or mash" },
  { kind: "supplement", title: "Supplements", add: "Add a supplement" },
] as const;

type Editing =
  | { mode: "add"; kind: CareInstruction["kind"] }
  | { mode: "edit"; item: CareInstruction }
  | null;

export function CarePlan({ horseId }: { horseId: string }) {
  const { care, today, horses, stopCare } = useBarn();
  const [editing, setEditing] = useState<Editing>(null);
  const horse = horses.find((h) => h.id === horseId);
  const horseName = horse?.name ?? "this horse";

  return (
    <div className="care-sections">
      {SECTIONS.map(({ kind, title, add }) => {
        const items = care
          .filter((c) => c.horseId === horseId && c.kind === kind)
          .sort((a, b) => {
            const rank = { Current: 0, Scheduled: 1, Ended: 2 };
            return (
              rank[instructionState(a, today)] - rank[instructionState(b, today)] ||
              b.effectiveStart.localeCompare(a.effectiveStart)
            );
          });

        const addingHere = editing?.mode === "add" && editing.kind === kind;

        return (
          <section className="panel" key={kind}>
            <div className="panel-heading">
              <h2>{title}</h2>
              <button
                className="button secondary small"
                onClick={() =>
                  setEditing(addingHere ? null : { mode: "add", kind })
                }
              >
                <Plus size={17} />
                {add}
              </button>
            </div>

            {addingHere && (
              <CareForm
                horseId={horseId}
                horseName={horseName}
                kind={kind}
                onClose={() => setEditing(null)}
              />
            )}

            <div className="care-cards">
              {!items.length && !addingHere && (
                <Empty>No {kind} instructions recorded.</Empty>
              )}

              {items.map((c) => {
                const state = instructionState(c, today);
                const isEditing =
                  editing?.mode === "edit" && editing.item.id === c.id;

                if (isEditing)
                  return (
                    <CareForm
                      key={c.id}
                      horseId={horseId}
                      horseName={horseName}
                      kind={kind}
                      existing={c}
                      onClose={() => setEditing(null)}
                    />
                  );

                return (
                  <article className={"instruction " + state.toLowerCase()} key={c.id}>
                    <div className="row-between">
                      <h3>{c.name}</h3>
                      <span
                        className={"badge " + (state === "Scheduled" ? "amber" : "")}
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
                      {c.effectiveEnd ? "– " + dateLabel(c.effectiveEnd) : "onward"}
                    </div>
                    {state !== "Ended" && (
                      <div className="instruction-actions">
                        <button
                          className="text-button"
                          onClick={() => setEditing({ mode: "edit", item: c })}
                        >
                          <Pencil size={15} />
                          Change
                        </button>
                        <button
                          className="text-button danger"
                          onClick={() =>
                            stopCare(
                              c.id,
                              state === "Scheduled"
                                ? offsetDate(c.effectiveStart, -1)
                                : today,
                            )
                          }
                        >
                          <CircleSlash size={15} />
                          Stop{state === "Current" ? " after today" : ""}
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="panel">
        <div className="panel-heading">
          <h2>Special instructions</h2>
        </div>
        <p className="padded">
          {horse?.specialInstructions || "No special instructions recorded."}
        </p>
      </section>
    </div>
  );
}

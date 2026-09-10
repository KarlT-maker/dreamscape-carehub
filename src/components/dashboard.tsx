"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Sun, Moon, Wheat } from "lucide-react";
import { CareBoard } from "./care-board";
import { useBarn } from "./provider";
import { PageHeader } from "./ui";
import { TaskList } from "./task-list";
import { EventList } from "./event-list";
import { dateLabel } from "@/lib/dates";
const groups = [
  { name: "Morning feed", category: "Feed", period: "AM", icon: Wheat },
  { name: "Evening feed", category: "Feed", period: "PM", icon: Moon },
] as const;
export function Dashboard() {
  const { today, horses, tasks, completions, events } = useBarn();
  const [selected, setSelected] = useState(0);
  const [pending, setPending] = useState(false);
  const group = groups[selected];
  const groupTasks = tasks.filter(
    (t) => t.category === group.category && t.period === group.period,
  );
  const totalDone = tasks.filter((t) => completions[t.id]).length;
  return (
    <>
      <PageHeader
        eyebrow={dateLabel(today, {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
        title="Today at the ranch"
        description="Current care instructions and the changes ahead."
        action={
          <Link className="button secondary" href="/horses">
            View horses <ArrowUpRight size={18} />
          </Link>
        }
      />
      <section className="barn-summary">
        <div className="summary-icon">
          <Sun size={30} />
        </div>
        <div>
          <h2>The barn care board</h2>
          <p>Feed, mash, medication and individual care instructions</p>
        </div>
        <div className="horse-count">
          <strong>{horses.filter((h) => h.status === "Active").length}</strong>
          <span>sample horses</span>
        </div>
      </section>
      <CareBoard />
      <details className="optional-rounds">
        <summary>Optional feed & care checklists</summary>
        <div className="row-between feed-heading">
          <h2>Feed rounds</h2>
          <span className="muted">
            {totalDone} of {tasks.length} feed and special-care tasks complete
          </span>
        </div>
        <div className="progress-grid feed-progress">
          {groups.map((g, i) => {
            const list = tasks.filter(
              (t) => t.category === g.category && t.period === g.period,
            );
            const done = list.filter((t) => completions[t.id]).length;
            return (
              <button
                key={g.name}
                className={
                  "progress-card " + (selected === i ? "selected" : "")
                }
                onClick={() => setSelected(i)}
                aria-pressed={selected === i}
              >
                <g.icon size={22} />
                <span>{g.name}</span>
                <div>
                  <strong>
                    {done}
                    <small> / {list.length}</small>
                  </strong>
                  <span className="muted">
                    {list.length ? Math.round((done / list.length) * 100) : 100}
                    %
                  </span>
                </div>
                <progress
                  value={done}
                  max={list.length || 1}
                  aria-label={g.name}
                />
              </button>
            );
          })}
        </div>
        <div className="dashboard-columns">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {group.period === "AM" ? "MORNING ROUND" : "EVENING ROUND"}
                </p>
                <h2>{group.name}</h2>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={pending}
                  onChange={(e) => setPending(e.target.checked)}
                />
                Pending only
              </label>
            </div>
            <TaskList
              tasks={groupTasks.filter((t) => !pending || !completions[t.id])}
            />
            <div className="panel-note">
              Tap a check to record care. Tap again to undo.
            </div>
          </section>
          <div className="right-column">
            <section className="panel special">
              <div className="panel-heading">
                <h2>Special care</h2>
                <span className="badge amber">
                  {
                    tasks.filter(
                      (t) =>
                        t.category === "Special care" && !completions[t.id],
                    ).length
                  }{" "}
                  remaining
                </span>
              </div>
              <TaskList
                tasks={tasks.filter((t) => t.category === "Special care")}
              />
            </section>
            <section className="panel">
              <div className="panel-heading">
                <h2>Visiting today</h2>
                <Link href="/calendar" className="text-link">
                  Calendar
                </Link>
              </div>
              <EventList
                events={events.filter(
                  (e) =>
                    e.date === today &&
                    (e.type === "Vet" || e.type === "Farrier"),
                )}
              />
            </section>
          </div>
        </div>
      </details>
    </>
  );
}

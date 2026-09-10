"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { useBarn } from "./provider";
import type { CareTask } from "@/types";
import { Empty } from "./ui";
export function TaskList({ tasks }: { tasks: CareTask[] }) {
  const { horses, completions, toggleTask } = useBarn();
  return (
    <div className="task-list">
      {tasks.length === 0 && <Empty>No tasks for this selection.</Empty>}
      {tasks.map((task) => {
        const completion = completions[task.id];
        return (
          <div
            className={"task-row " + (completion ? "completed" : "")}
            key={task.id}
          >
            <button
              className="check-button"
              aria-label={
                (completion ? "Undo" : "Complete") +
                " " +
                task.title +
                " for " +
                horses.find((h) => h.id === task.horseId)?.name
              }
              aria-pressed={!!completion}
              onClick={() => toggleTask(task.id)}
            >
              {completion && <Check size={23} />}
            </button>
            <div className="task-content">
              <Link href={"/horses/" + task.horseId}>
                {horses.find((h) => h.id === task.horseId)?.name}
              </Link>
              <p>
                {task.title} <span className="muted">· {task.detail}</span>
              </p>
              {completion && (
                <small className="completion">
                  Completed by {completion.completedBy} ·{" "}
                  {new Date(completion.completedAt).toLocaleTimeString(
                    "en-CA",
                    {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "America/Vancouver",
                    },
                  )}
                </small>
              )}
            </div>
            <span className="period">{task.period}</span>
          </div>
        );
      })}
    </div>
  );
}

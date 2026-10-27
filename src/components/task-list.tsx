"use client";
import Link from "next/link";
import { horsePath } from "@/lib/horse-path";
import { useBarn } from "./provider";
import type { CareTask } from "@/types";
import { Empty } from "./ui";
// Read-only care summary. Existing saved checkmarks are preserved but not shown.
export function TaskList({ tasks }: { tasks: CareTask[] }) {
  const { horses } = useBarn();
  return <div className="task-list">
    {!tasks.length && <Empty>No care instructions for this selection.</Empty>}
    {tasks.map(task=><div className="task-row care-summary-row" key={task.id}>
      <div className="task-content"><Link href={horsePath(task.horseId,"Care")}>{horses.find(h=>h.id===task.horseId)?.name}</Link><p>{task.title} <span className="muted">· {task.detail}</span></p></div>
      <span className="period">{task.period}</span>
    </div>)}
  </div>;
}

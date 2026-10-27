import type { Round, Schedule } from "@/types";
export const ROUNDS: readonly Round[] = ["AM", "Lunch", "PM"];
export const SCHEDULES: readonly Schedule[] = ["AM", "Lunch", "PM", "AM & PM", "AM & Lunch", "Lunch & PM", "AM & Lunch & PM"];
export function includesRound(schedule: Schedule, round: Round | "All") {
  return round === "All" || schedule.split(" & ").includes(round);
}

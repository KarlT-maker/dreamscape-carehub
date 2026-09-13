import type {
  Horse,
  CareInstruction,
  CareTask,
  CalendarEvent,
  HistoryEntry,
  Helper,
  ShiftAssignment,
  DayOff,
} from "@/types";
import { offsetDate } from "@/lib/dates";
import { ROSTER, PADDOCKS, horseId } from "./roster";

export const mockHorses: Horse[] = ROSTER.map((entry, i) => ({
  id: horseId(entry.name),
  name: entry.name,
  birthDate: entry.born,
  sex: entry.sex,
  breed: entry.breed,
  colour: entry.colour,
  owner: { id: "o" + i, name: entry.owner },
  arrivalDate: entry.arrived,
  location: entry.paddock,
  status: "Active",
  specialInstructions: entry.special ?? "",
}));

// Sample barn crew. Names and the rota below are invented — replace them once
// the schedule whiteboard has been photographed.
export const mockHelpers: Helper[] = [
  { id: "h1", name: "Dana", initials: "D" },
  { id: "h2", name: "Marco", initials: "M" },
  { id: "h3", name: "Priya", initials: "P" },
  { id: "h4", name: "Wes", initials: "W" },
];

export function createMockData(today: string) {
  const care: CareInstruction[] = [];
  const tasks: CareTask[] = [];

  for (const entry of ROSTER) {
    const id = horseId(entry.name);

    entry.feed.forEach((f, i) => {
      const kind = f.kind ?? "feed";
      care.push({
        id: `${id}-${kind}-${i}`,
        horseId: id,
        kind,
        name: f.name,
        quantity: f.quantity,
        schedule: f.schedule,
        instructions: f.instructions,
        effectiveStart: offsetDate(today, -45),
      } as CareInstruction);
    });

    entry.meds?.forEach((m, i) => {
      care.push({
        id: `${id}-med-${i}`,
        horseId: id,
        kind: "medication",
        name: m.name,
        dose: m.dose,
        schedule: m.schedule,
        instructions: m.instructions,
        effectiveStart: offsetDate(today, m.startsIn ?? -20),
        ...(m.endsIn === undefined ? {} : { effectiveEnd: offsetDate(today, m.endsIn) }),
      } as CareInstruction);
    });

    // One feed task per round, described the way the bucket is actually made up.
    const headline = entry.feed.find((f) => (f.kind ?? "feed") === "feed");
    for (const period of ["AM", "PM"] as const) {
      if (headline && headline.schedule !== "AM & PM" && headline.schedule !== period) continue;
      tasks.push({
        id: `${id}-feed-${period}`,
        horseId: id,
        date: today,
        category: "Feed",
        period,
        title: headline?.name ?? "Feed",
        detail: headline ? `${headline.quantity} · ${headline.instructions}` : "",
      });
    }

    if (entry.special)
      tasks.push({
        id: `${id}-special`,
        horseId: id,
        date: today,
        category: "Special care",
        period: "AM",
        title: "Special instruction",
        detail: entry.special,
      });
  }

  // ── Rota ────────────────────────────────────────────────────────────────
  // Sample only: each helper covers a couple of paddocks, rotating by day so
  // the board visibly changes. The real pattern comes off the feed room board.
  const shifts: ShiftAssignment[] = [];
  const dayIndex = Number(today.slice(8, 10));
  for (let d = -1; d <= 6; d++) {
    const date = offsetDate(today, d);
    PADDOCKS.forEach((paddock, p) => {
      for (const period of ["AM", "PM"] as const) {
        const helper =
          mockHelpers[(p + dayIndex + d + (period === "PM" ? 1 : 0)) % mockHelpers.length];
        shifts.push({
          id: `${date}-${paddock}-${period}`,
          date,
          period,
          paddock,
          helperId: helper.id,
        });
      }
    });
  }

  const daysOff: DayOff[] = [
    { id: "off1", helperId: "h3", date: offsetDate(today, 1), note: "Booked" },
    { id: "off2", helperId: "h1", date: offsetDate(today, 3), note: "Booked" },
    { id: "off3", helperId: "h4", date: offsetDate(today, 4) },
    { id: "off4", helperId: "h2", date: offsetDate(today, 6), note: "Swap with Wes" },
  ];

  // ── Calendar ────────────────────────────────────────────────────────────
  const withMeds = ROSTER.filter((r) => r.meds?.length).map((r) => horseId(r.name));
  const events: CalendarEvent[] = [
    {
      id: "e1",
      horseId: "modern",
      date: today,
      time: "10:30",
      type: "Vet",
      provider: "Dr. Harper · Valley Equine (demo)",
      reason: "Mobility review",
      notes: "Discuss comfort on turns and review the current care plan.",
    },
    {
      id: "e2",
      horseId: "tango",
      date: today,
      time: "14:00",
      type: "Farrier",
      provider: "Sam Reid (demo)",
      reason: "Routine trim",
      notes: "Bring to the barn 15 minutes before the visit.",
    },
    ...(
      ["Dentist", "Vaccination", "Deworming", "Weight check", "Feed change", "Other"] as const
    ).map((type, i) => ({
      id: "e" + (i + 3),
      horseId: horseId(ROSTER[i * 6].name),
      date: offsetDate(today, i + 1),
      time: "09:00",
      type,
      provider: i === 0 ? "Valley Equine (demo)" : "Barn team (demo)",
      reason: type === "Other" ? "Owner visit" : type,
      notes: "Review the horse's current notes before the appointment.",
    })),
    {
      id: "e9",
      horseId: "surprise",
      date: offsetDate(today, 10),
      time: "07:00",
      type: "Medication change",
      provider: "Care plan (demo)",
      reason: "Prascend · scheduled dose change",
      notes: "1 tablet changes to 1½ tablets in the example plan.",
    },
    ...withMeds.slice(0, 3).map((id, i) => ({
      id: "em" + i,
      horseId: id,
      date: offsetDate(today, 5 + i * 2),
      time: "11:00",
      type: "Vet" as const,
      provider: "Valley Equine (demo)",
      reason: "Medication review",
      notes: "Confirm the current dose is still right.",
    })),
  ];

  // ── History ─────────────────────────────────────────────────────────────
  const history: HistoryEntry[] = mockHorses.flatMap((h, n) =>
    (["Notes", "Weight", "Farrier", "Feed"] as const).map((type, i) => ({
      id: h.id + "-history-" + i,
      horseId: h.id,
      date: offsetDate(today, -i * 7 - (n % 5) - 1),
      type,
      title: {
        Notes: "Comfortable and settled",
        Weight: "Weight check recorded",
        Farrier: "Routine trim completed",
        Feed: "Feed instructions reviewed",
      }[type],
      detail:
        type === "Weight"
          ? "Weight-tape estimate. Continue regular monitoring."
          : "Example care record. Appetite and general comfort recorded.",
      author: "Karl (demo)",
    })),
  );

  for (const item of care) {
    if (item.kind !== "medication" || item.effectiveStart > today) continue;
    history.push({
      id: item.id + "-started",
      horseId: item.horseId,
      date: item.effectiveStart,
      type: "Medication",
      title: `${item.name} · ${item.dose} · ${item.schedule}`,
      detail: "Instruction effective from this date. " + item.instructions,
      author: "Care plan (demo)",
    });
    if (item.effectiveEnd && item.effectiveEnd < today)
      history.push({
        id: item.id + "-ended",
        horseId: item.horseId,
        date: item.effectiveEnd,
        type: "Medication",
        title: `${item.name} · ${item.dose} instruction ended`,
        detail: "Last effective day of this instruction.",
        author: "Care plan (demo)",
      });
  }
  history.sort((a, b) => b.date.localeCompare(a.date));

  return {
    horses: mockHorses,
    care,
    tasks,
    events,
    history,
    helpers: mockHelpers,
    shifts,
    daysOff,
  };
}

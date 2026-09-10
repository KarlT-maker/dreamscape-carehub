import type {
  Horse,
  CareInstruction,
  CareTask,
  CalendarEvent,
  HistoryEntry,
} from "@/types";
import { offsetDate } from "@/lib/dates";
export const mockHorses: Horse[] = [
  {
    id: "molly",
    name: "Molly",
    registeredName: "Moonlight Serenade",
    birthDate: "1999-05-14",
    sex: "Mare",
    breed: "Quarter Horse",
    colour: "Bay",
    owner: { id: "o1", name: "Susan Mitchell" },
    arrivalDate: "2021-06-12",
    location: "Willow paddock",
    status: "Active",
    specialInstructions:
      "Quiet handling. Check that medication is fully eaten. Keep with Daisy.",
  },
  {
    id: "charlie",
    name: "Charlie",
    registeredName: "Charlie's Legacy",
    birthDate: "2002-03-08",
    sex: "Gelding",
    breed: "Thoroughbred",
    colour: "Chestnut",
    owner: { id: "o2", name: "David Chen" },
    arrivalDate: "2023-04-20",
    location: "Lower pasture",
    status: "Active",
    specialInstructions:
      "Watch comfort when turning. Record any change in mobility.",
  },
  {
    id: "buddy",
    name: "Buddy",
    birthDate: "1997-07-22",
    sex: "Gelding",
    breed: "Paint Horse",
    colour: "Tobiano",
    owner: { id: "o3", name: "Emily Parker" },
    arrivalDate: "2020-09-05",
    location: "Barn paddock",
    status: "Active",
    specialInstructions: "Feed separately. Allow extra time to finish mash.",
  },
  {
    id: "daisy",
    name: "Daisy",
    birthDate: "2001-04-17",
    sex: "Mare",
    breed: "Arabian",
    colour: "Grey",
    owner: { id: "o4", name: "Anne Wilson" },
    arrivalDate: "2022-05-10",
    location: "Willow paddock",
    status: "Active",
    specialInstructions: "Check fly mask fit each morning.",
  },
  {
    id: "jasper",
    name: "Jasper",
    birthDate: "2004-06-02",
    sex: "Gelding",
    breed: "Morgan",
    colour: "Black",
    owner: { id: "o5", name: "Robert Evans" },
    arrivalDate: "2024-08-16",
    location: "Upper pasture",
    status: "Active",
    specialInstructions: "Bring to barn before farrier appointment.",
  },
  {
    id: "rosie",
    name: "Rosie",
    registeredName: "Rosewood Gold",
    birthDate: "2000-02-11",
    sex: "Mare",
    breed: "Warmblood",
    colour: "Chestnut",
    owner: { id: "o6", name: "Laura Thompson" },
    arrivalDate: "2022-10-03",
    location: "Lower pasture",
    status: "Active",
    specialInstructions: "Monitor appetite and note leftover feed.",
  },
];
export function createMockData(today: string) {
  const care: CareInstruction[] = mockHorses.map((h) => ({
    id: h.id + "-feed",
    horseId: h.id,
    kind: "feed",
    name: h.id === "buddy" ? "Beet pulp + senior feed" : "Senior feed",
    quantity: h.id === "buddy" ? "0.5 kg beet pulp + 1 kg senior feed" : "1 kg",
    schedule: "AM & PM",
    instructions:
      "Soak fully according to feed label. Serve soft and check temperature.",
    effectiveStart: offsetDate(today, -30),
  }));
  care.push(
    {
      id: "molly-previous",
      horseId: "molly",
      kind: "medication",
      name: "Prascend",
      dose: "½ tablet",
      schedule: "AM",
      instructions:
        "Previous sample instruction, replaced by the next dated care plan.",
      effectiveStart: offsetDate(today, -40),
      effectiveEnd: offsetDate(today, -10),
    },
    {
      id: "molly-med",
      horseId: "molly",
      kind: "medication",
      name: "Prascend",
      dose: "1 tablet",
      schedule: "AM",
      instructions: "Give with morning feed. Confirm the full dose is eaten.",
      effectiveStart: offsetDate(today, -9),
      effectiveEnd: offsetDate(today, 9),
    },
    {
      id: "molly-future",
      horseId: "molly",
      kind: "medication",
      name: "Prascend",
      dose: "½ tablet",
      schedule: "AM",
      instructions:
        "Scheduled example change; confirm with the prescribing vet before real use.",
      effectiveStart: offsetDate(today, 10),
    },
    {
      id: "charlie-med",
      horseId: "charlie",
      kind: "medication",
      name: "Previcox",
      dose: "½ tablet",
      schedule: "AM",
      instructions:
        "Sample care instruction only. Give with feed as directed by the vet.",
      effectiveStart: offsetDate(today, -20),
    },
    {
      id: "rosie-med",
      horseId: "rosie",
      kind: "medication",
      name: "Prescribed eye ointment",
      dose: "As prescribed",
      schedule: "PM",
      instructions: "Follow the veterinarian's written instructions.",
      effectiveStart: offsetDate(today, -2),
      effectiveEnd: offsetDate(today, 5),
    },
    {
      id: "buddy-supp",
      horseId: "buddy",
      kind: "supplement",
      name: "Vitamin and mineral balancer",
      quantity: "30 g",
      schedule: "AM",
      instructions: "Mix thoroughly into soaked mash.",
      effectiveStart: offsetDate(today, -15),
    },
  );
  const tasks: CareTask[] = [];
  for (const h of mockHorses)
    for (const period of ["AM", "PM"] as const)
      tasks.push({
        id: h.id + "-feed-" + period,
        horseId: h.id,
        date: today,
        category: "Feed",
        period,
        title: h.id === "buddy" ? "Mash" : "Senior feed",
        detail:
          h.id === "buddy"
            ? "Beet pulp + senior feed · fully soaked"
            : "1 kg · soaked until soft",
      });
  tasks.push(
    {
      id: "buddy-check",
      horseId: "buddy",
      date: today,
      category: "Special care",
      period: "AM",
      title: "Check mash intake",
      detail: "Feed separately and record any leftovers",
    },
    {
      id: "daisy-mask",
      horseId: "daisy",
      date: today,
      category: "Special care",
      period: "AM",
      title: "Check fly mask",
      detail: "Check fit and skin around eyes",
    },
  );
  const events: CalendarEvent[] = [
    {
      id: "e1",
      horseId: "charlie",
      date: today,
      time: "10:30",
      type: "Vet",
      provider: "Dr. Harper · Valley Equine (demo)",
      reason: "Mobility review",
      notes: "Discuss comfort on turns and review the current care plan.",
    },
    {
      id: "e2",
      horseId: "jasper",
      date: today,
      time: "14:00",
      type: "Farrier",
      provider: "Sam Reid (demo)",
      reason: "Routine trim",
      notes: "Bring to the barn 15 minutes before the visit.",
    },
    ...(
      [
        "Dentist",
        "Vaccination",
        "Deworming",
        "Weight check",
        "Feed change",
        "Other",
      ] as const
    ).map((type, i) => ({
      id: "e" + (i + 3),
      horseId: mockHorses[i].id,
      date: offsetDate(today, i + 2),
      time: "09:00",
      type,
      provider: i === 0 ? "Valley Equine (demo)" : "Barn team (demo)",
      reason: type === "Other" ? "Owner visit" : type,
      notes: "Review the horse's current notes before the appointment.",
    })),
    {
      id: "e9",
      horseId: "molly",
      date: offsetDate(today, 10),
      time: "07:00",
      type: "Medication change",
      provider: "Care plan (demo)",
      reason: "Prascend · scheduled dose change",
      notes: "1 tablet changes to ½ tablet in the example plan.",
    },
  ];
  const history: HistoryEntry[] = mockHorses.flatMap((h) =>
    (["Notes", "Weight", "Farrier", "Feed", "Vet", "Photo"] as const).map(
      (type, i) => ({
        id: h.id + "-history-" + i,
        horseId: h.id,
        date: offsetDate(today, -i * 3 - 1),
        type,
        title: (
          {
            Notes: "Comfortable and settled",
            Weight: "Weight check · 480 kg",
            Farrier: "Routine trim completed",
            Feed: "Mash instructions reviewed",
            Medication: "Medication plan reviewed",
            Vet: "Routine senior wellness visit",
            Photo: "Arrival photo noted",
          } as const
        )[type],
        detail:
          type === "Photo"
            ? "Demo timeline entry; no image file is attached."
            : type === "Weight"
              ? "Weight-tape estimate. Continue regular monitoring."
              : "Example care record. Appetite and general comfort recorded; continue monitoring.",
        author: "Karl (demo)",
      }),
    ),
  );
  for (const item of care) {
    if (item.kind !== "medication" || item.effectiveStart > today) continue;
    history.push({
      id: item.id + "-started",
      horseId: item.horseId,
      date: item.effectiveStart,
      type: "Medication",
      title: item.name + " · " + item.dose + " · " + item.schedule,
      detail: "Instruction effective from this date. " + item.instructions,
      author: "Care plan (demo)",
    });
    if (item.effectiveEnd && item.effectiveEnd < today)
      history.push({
        id: item.id + "-ended",
        horseId: item.horseId,
        date: item.effectiveEnd,
        type: "Medication",
        title: item.name + " · " + item.dose + " instruction ended",
        detail:
          "Last effective day of this instruction. See the care plan for subsequent changes.",
        author: "Care plan (demo)",
      });
  }
  history.sort((a, b) => b.date.localeCompare(a.date));
  return { horses: mockHorses, care, tasks, events, history };
}

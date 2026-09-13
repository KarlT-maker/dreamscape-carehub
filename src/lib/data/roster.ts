// The Dreamscape Ranch herd, by paddock.
//
// Horse names and paddocks are real. Everything else on this page — ages,
// breeds, colours, owners, feed quantities, medications — is invented sample
// data so the boards have something to show. Replace it from the roster
// spreadsheet before anyone uses this to actually feed a horse.

export type RosterFeed = {
  name: string;
  quantity: string;
  schedule: "AM" | "PM" | "AM & PM";
  instructions: string;
  kind?: "feed" | "supplement";
};

export type RosterMed = {
  name: string;
  dose: string;
  schedule: "AM" | "PM" | "AM & PM";
  instructions: string;
  /** Days from today. Negative is the past. */
  startsIn?: number;
  endsIn?: number;
};

export type RosterEntry = {
  name: string;
  paddock: string;
  sex: "Mare" | "Gelding" | "Stallion";
  breed: string;
  colour: string;
  born: string;
  arrived: string;
  owner: string;
  special?: string;
  feed: RosterFeed[];
  meds?: RosterMed[];
};

export const PADDOCKS = [
  "Minis",
  "80s",
  "Ponies",
  "Paddock 4",
  "South Field 1",
  "South Field 2",
  "Center Field 1",
  "Show Girls",
  "OB's",
] as const;

/** Other names the barn uses for the same paddock. */
export const PADDOCK_ALIASES: Record<string, string> = {
  Minis: "old barn paddock",
  "80s": "paddock 7",
};

const SOAK = "Soak fully. Serve soft and check the temperature before feeding.";
const MASH = "Soak 20 minutes until there is no dry feed left. Serve warm, not hot.";

const mini = (): RosterFeed[] => [
  { name: "Mini pellet", quantity: "0.25 kg", schedule: "AM & PM", instructions: SOAK },
];
const pony = (): RosterFeed[] => [
  { name: "Pony cube", quantity: "0.5 kg", schedule: "AM & PM", instructions: SOAK },
];
const senior = (): RosterFeed[] => [
  { name: "Senior feed", quantity: "1 kg", schedule: "AM & PM", instructions: SOAK },
];
const mash = (q = "0.5 kg beet pulp + 1 kg senior feed"): RosterFeed[] => [
  { name: "Beet pulp mash", quantity: q, schedule: "AM & PM", instructions: MASH },
];

export const ROSTER: RosterEntry[] = [
  // ── Minis ──────────────────────────────────────────────────────────────
  { name: "Leroy", paddock: "Minis", sex: "Gelding", breed: "Miniature Horse", colour: "Bay", born: "2006-04-18", arrived: "2021-07-02", owner: "Susan M.", feed: mini() },
  { name: "Banaffee", paddock: "Minis", sex: "Mare", breed: "Miniature Horse", colour: "Palomino", born: "2009-08-03", arrived: "2021-07-02", owner: "Susan M.", feed: mini(), special: "Slow feeder net. Watch weight through spring grass." },
  { name: "Pi", paddock: "Minis", sex: "Gelding", breed: "Miniature Horse", colour: "Black", born: "2011-03-14", arrived: "2022-05-19", owner: "D. Chen", feed: mini() },
  { name: "Snap", paddock: "Minis", sex: "Gelding", breed: "Miniature Horse", colour: "Chestnut", born: "2008-11-27", arrived: "2022-05-19", owner: "D. Chen", feed: mini() },
  {
    name: "Archie", paddock: "Minis", sex: "Gelding", breed: "Miniature Horse", colour: "Grey", born: "2005-06-09", arrived: "2020-09-14", owner: "E. Parker",
    feed: [...mini(), { name: "Joint supplement", quantity: "15 g", schedule: "AM", instructions: "Mix into the morning feed.", kind: "supplement" }],
    special: "Bring in first — slow walker.",
  },

  // ── 80s ────────────────────────────────────────────────────────────────
  { name: "King", paddock: "80s", sex: "Gelding", breed: "Quarter Horse", colour: "Bay", born: "1998-05-21", arrived: "2021-04-11", owner: "A. Wilson", feed: senior(), special: "Feed away from the gate or he guards it." },
  {
    name: "Snickers", paddock: "80s", sex: "Gelding", breed: "Quarter Horse", colour: "Chestnut", born: "1999-09-02", arrived: "2021-04-11", owner: "A. Wilson",
    feed: mash(),
    meds: [{ name: "Prascend", dose: "1 tablet", schedule: "AM", instructions: "Give with the morning feed. Confirm the full dose is eaten.", startsIn: -60, endsIn: 8 }],
  },
  { name: "Devon", paddock: "80s", sex: "Gelding", breed: "Thoroughbred", colour: "Dark bay", born: "2001-02-17", arrived: "2023-03-28", owner: "R. Evans", feed: senior() },
  { name: "Jackson", paddock: "80s", sex: "Gelding", breed: "Appendix", colour: "Buckskin", born: "2000-07-30", arrived: "2022-08-05", owner: "L. Thompson", feed: senior() },
  {
    name: "Fortune", paddock: "80s", sex: "Gelding", breed: "Thoroughbred", colour: "Chestnut", born: "1997-04-05", arrived: "2020-06-17", owner: "M. Doyle",
    feed: mash("1 kg beet pulp + 1 kg senior feed"),
    special: "Very slow eater. Allow extra time and check for leftovers.",
  },
  { name: "Reilly", paddock: "80s", sex: "Gelding", breed: "Irish Sport Horse", colour: "Grey", born: "2002-10-12", arrived: "2023-09-01", owner: "M. Doyle", feed: senior() },
  {
    name: "Levi", paddock: "80s", sex: "Gelding", breed: "Quarter Horse", colour: "Sorrel", born: "2003-01-23", arrived: "2024-02-14", owner: "J. Nakamura",
    feed: senior(),
    meds: [{ name: "Previcox", dose: "½ tablet", schedule: "AM", instructions: "With feed, as directed by the vet.", startsIn: -25 }],
  },
  { name: "Tango", paddock: "80s", sex: "Gelding", breed: "Morgan", colour: "Black", born: "2004-08-08", arrived: "2024-02-14", owner: "J. Nakamura", feed: senior() },

  // ── Ponies ─────────────────────────────────────────────────────────────
  { name: "Firefly", paddock: "Ponies", sex: "Mare", breed: "Welsh Pony", colour: "Chestnut", born: "2007-05-30", arrived: "2021-10-08", owner: "K. Bell", feed: pony() },
  { name: "Ginger", paddock: "Ponies", sex: "Mare", breed: "Shetland", colour: "Chestnut", born: "2010-06-14", arrived: "2021-10-08", owner: "K. Bell", feed: pony(), special: "Muzzle on through the day in summer." },
  { name: "Peggy", paddock: "Ponies", sex: "Mare", breed: "Welsh Pony", colour: "Grey", born: "2006-09-19", arrived: "2022-06-23", owner: "S. Okafor", feed: pony() },
  {
    name: "Poppy", paddock: "Ponies", sex: "Mare", breed: "Shetland", colour: "Bay", born: "2012-04-02", arrived: "2022-06-23", owner: "S. Okafor",
    feed: [...pony(), { name: "Vitamin and mineral balancer", quantity: "30 g", schedule: "AM", instructions: "Mix thoroughly into the feed.", kind: "supplement" }],
  },

  // ── Paddock 4 ──────────────────────────────────────────────────────────
  { name: "Chego", paddock: "Paddock 4", sex: "Gelding", breed: "Quarter Horse", colour: "Dun", born: "2000-03-11", arrived: "2021-05-30", owner: "T. Alvarez", feed: senior() },
  {
    name: "Donkey Ote", paddock: "Paddock 4", sex: "Gelding", breed: "Donkey", colour: "Grey", born: "2005-12-01", arrived: "2021-05-30", owner: "Ranch",
    feed: [{ name: "Low-sugar chaff", quantity: "0.5 kg", schedule: "AM & PM", instructions: "Straw chaff only. No cereal feed." }],
    special: "Donkey — different feed to the horses. Check hooves weekly.",
  },

  // ── South Field 1 ──────────────────────────────────────────────────────
  { name: "Boston", paddock: "South Field 1", sex: "Gelding", breed: "Thoroughbred", colour: "Bay", born: "1999-06-25", arrived: "2020-11-19", owner: "P. Grant", feed: senior() },
  {
    name: "Modern", paddock: "South Field 1", sex: "Gelding", breed: "Warmblood", colour: "Dark bay", born: "2001-08-16", arrived: "2021-03-04", owner: "P. Grant",
    feed: mash(),
    meds: [{ name: "Equioxx", dose: "1 tablet", schedule: "AM", instructions: "With the morning mash. Note any change in movement.", startsIn: -14 }],
  },
  { name: "Chilli", paddock: "South Field 1", sex: "Mare", breed: "Quarter Horse", colour: "Sorrel", born: "2003-04-27", arrived: "2022-07-12", owner: "H. Mwangi", feed: senior() },
  { name: "Loredo", paddock: "South Field 1", sex: "Gelding", breed: "Paint Horse", colour: "Tobiano", born: "2002-05-06", arrived: "2022-07-12", owner: "H. Mwangi", feed: senior() },
  { name: "Archer", paddock: "South Field 1", sex: "Gelding", breed: "Thoroughbred", colour: "Chestnut", born: "2004-02-09", arrived: "2023-05-20", owner: "C. Petrov", feed: senior() },
  {
    name: "Cajun", paddock: "South Field 1", sex: "Gelding", breed: "Appaloosa", colour: "Leopard", born: "2000-10-31", arrived: "2021-09-08", owner: "C. Petrov",
    feed: mash(),
    special: "Feed separately — will push others off the bucket.",
  },
  { name: "Ingk", paddock: "South Field 1", sex: "Gelding", breed: "Quarter Horse", colour: "Black", born: "2005-07-18", arrived: "2023-11-02", owner: "N. Fraser", feed: senior() },
  {
    name: "Surprise", paddock: "South Field 1", sex: "Mare", breed: "Arabian", colour: "Grey", born: "1998-12-24", arrived: "2020-08-30", owner: "N. Fraser",
    feed: mash(),
    meds: [
      { name: "Prascend", dose: "1 tablet", schedule: "AM", instructions: "Give with the morning mash. Confirm it is fully eaten.", startsIn: -90, endsIn: 9 },
      { name: "Prascend", dose: "1½ tablets", schedule: "AM", instructions: "Dose increase — confirm with the vet before it starts.", startsIn: 10 },
    ],
    special: "Oldest on the ranch. Quiet handling.",
  },

  // ── South Field 2 ──────────────────────────────────────────────────────
  { name: "Miami", paddock: "South Field 2", sex: "Mare", breed: "Warmblood", colour: "Bay", born: "2002-03-19", arrived: "2022-04-15", owner: "G. Silva", feed: senior() },
  { name: "Arano", paddock: "South Field 2", sex: "Gelding", breed: "Andalusian", colour: "Grey", born: "2001-11-07", arrived: "2022-04-15", owner: "G. Silva", feed: senior() },
  {
    name: "Wicket", paddock: "South Field 2", sex: "Gelding", breed: "Quarter Horse", colour: "Bay roan", born: "2006-01-15", arrived: "2024-06-21", owner: "B. Osei",
    feed: senior(),
    meds: [{ name: "Prescribed eye ointment", dose: "As prescribed", schedule: "PM", instructions: "Follow the veterinarian's written instructions.", startsIn: -3, endsIn: 4 }],
  },
  { name: "Dyson", paddock: "South Field 2", sex: "Gelding", breed: "Thoroughbred", colour: "Chestnut", born: "2003-09-28", arrived: "2023-02-09", owner: "B. Osei", feed: senior() },
  { name: "Big Al", paddock: "South Field 2", sex: "Gelding", breed: "Percheron cross", colour: "Black", born: "2000-05-12", arrived: "2021-01-26", owner: "Ranch", feed: mash("1 kg beet pulp + 1.5 kg senior feed"), special: "Big feed. Check the bucket is finished before turnout." },

  // ── Center Field 1 ─────────────────────────────────────────────────────
  { name: "Josie", paddock: "Center Field 1", sex: "Mare", breed: "Quarter Horse", colour: "Palomino", born: "2004-06-03", arrived: "2023-07-14", owner: "F. Lindqvist", feed: senior() },
  {
    name: "Smarty", paddock: "Center Field 1", sex: "Gelding", breed: "Appendix", colour: "Chestnut", born: "2002-12-08", arrived: "2023-07-14", owner: "F. Lindqvist",
    feed: senior(),
    meds: [{ name: "Antibiotic course", dose: "2 scoops", schedule: "AM & PM", instructions: "Ten-day course. Finish it even if he seems well.", startsIn: -4, endsIn: 5 }],
  },

  // ── Show Girls ─────────────────────────────────────────────────────────
  { name: "Penelope", paddock: "Show Girls", sex: "Mare", breed: "Warmblood", colour: "Dark bay", born: "2005-04-22", arrived: "2024-04-03", owner: "V. Romano", feed: senior() },
  { name: "Belle", paddock: "Show Girls", sex: "Mare", breed: "Hanoverian", colour: "Bay", born: "2006-08-11", arrived: "2024-04-03", owner: "V. Romano", feed: senior() },
  {
    name: "Chocolate", paddock: "Show Girls", sex: "Mare", breed: "Morgan", colour: "Liver chestnut", born: "2007-02-26", arrived: "2024-09-17", owner: "I. Haddad",
    feed: [...senior(), { name: "Hoof supplement", quantity: "25 g", schedule: "AM", instructions: "Mix into the morning feed.", kind: "supplement" }],
  },
  { name: "Abi", paddock: "Show Girls", sex: "Mare", breed: "Quarter Horse", colour: "Bay", born: "2008-05-04", arrived: "2024-09-17", owner: "I. Haddad", feed: senior() },
  { name: "Lola", paddock: "Show Girls", sex: "Mare", breed: "Andalusian", colour: "Grey", born: "2009-10-20", arrived: "2025-03-11", owner: "V. Romano", feed: senior(), special: "Nervous at the gate. Approach from the front." },

  // ── OB's ───────────────────────────────────────────────────────────────
  {
    name: "Rayne", paddock: "OB's", sex: "Mare", breed: "Thoroughbred", colour: "Grey", born: "1999-03-07", arrived: "2020-10-22", owner: "W. Byrne",
    feed: mash(),
    special: "Keep with London — settles better in company.",
  },
  { name: "London", paddock: "OB's", sex: "Mare", breed: "Thoroughbred", colour: "Bay", born: "2000-01-19", arrived: "2020-10-22", owner: "W. Byrne", feed: senior(), special: "Keep with Rayne." },
  {
    name: "BiBi", paddock: "OB's", sex: "Mare", breed: "Arabian", colour: "Chestnut", born: "2003-06-30", arrived: "2022-12-05", owner: "O. Nakamura",
    feed: senior(),
    meds: [{ name: "Thyro-L", dose: "1 scoop", schedule: "AM", instructions: "Level scoop into the morning feed.", startsIn: -45 }],
  },
  { name: "Baby", paddock: "OB's", sex: "Mare", breed: "Quarter Horse", colour: "Buckskin", born: "2010-07-25", arrived: "2025-01-30", owner: "O. Nakamura", feed: senior() },
];

export function horseId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const HORSE_IDS = ROSTER.map((h) => horseId(h.name));

import { createMockData } from "./mock";
import { ROSTER, horseId } from "./roster";
import { emptySnapshot, type Snapshot } from "./workspace";
export function rosterSnapshot(): Snapshot {
  return { ...emptySnapshot(), mode: "roster", data: {
    ...emptySnapshot().data,
    horses: ROSTER.map(row => ({ id: horseId(row.name), name: row.name,
      location: row.paddock, status: "Active", sex: "", breed: "", colour: "",
      birthDate: "", arrivalDate: "", owner: { id: `owner-${horseId(row.name)}`, name: "" },
      specialInstructions: "" })),
  } };
}
// Replace this adapter with Supabase queries; presentation uses the same domain models.
export const careRepository = { load: (date: string) => createMockData(date) };

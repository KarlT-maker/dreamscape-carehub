import { createMockData } from "./mock";
// Replace this adapter with Supabase queries; presentation uses the same domain models.
export const careRepository = { load: (date: string) => createMockData(date) };

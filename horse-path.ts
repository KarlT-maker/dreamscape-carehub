import { HORSE_IDS } from "@/lib/data/roster";

// Every horse on the roster gets its own statically exported page. Horses added
// during a session have no page of their own, so they fall back to /horses/session
// with the id in a query parameter.
const exportedIds = new Set<string>(HORSE_IDS);

export function horsePath(id: string, tab?: string) {
  const known = exportedIds.has(id);
  const query = new URLSearchParams();
  if (!known) query.set("horseId", id);
  if (tab) query.set("tab", tab);
  return (
    "/horses/" +
    (known ? id : "session") +
    (query.size ? "?" + query.toString() : "")
  );
}

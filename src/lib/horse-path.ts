const sampleIds = new Set([
  "molly",
  "charlie",
  "buddy",
  "daisy",
  "jasper",
  "rosie",
]);
export function horsePath(id: string, tab?: string) {
  const query = new URLSearchParams();
  if (!sampleIds.has(id)) query.set("horseId", id);
  if (tab) query.set("tab", tab);
  return (
    "/horses/" +
    (sampleIds.has(id) ? id : "session") +
    (query.size ? "?" + query.toString() : "")
  );
}

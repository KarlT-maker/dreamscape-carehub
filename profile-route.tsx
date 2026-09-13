"use client";
import { useSearchParams } from "next/navigation";
import { HorseProfile } from "./horse-profile";
export function ProfileRoute({ id }: { id: string }) {
  const query = useSearchParams();
  const horseId = id === "session" ? (query.get("horseId") ?? "") : id;
  return (
    <HorseProfile
      key={horseId + query.toString()}
      id={horseId}
      initialTab={query.get("tab") ?? "Overview"}
      historyFilter={query.get("filter") ?? "All"}
    />
  );
}

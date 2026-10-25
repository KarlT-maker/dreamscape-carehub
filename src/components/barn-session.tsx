"use client";
import { useSyncExternalStore } from "react";
import { BarnProvider } from "./provider";
import { ranchDate } from "@/lib/dates";
import { SHARED_API } from "@/lib/shared";
import { SharedGate } from "./shared-gate";
const subscribe = () => () => {};
// Static hosting must seed demo dates when the user opens the app, not at build time.
export function BarnSession({ children }: { children: React.ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  if (!mounted)
    return (
      <div className="empty" role="status">
        Opening BarnCareHub…
      </div>
    );
  return SHARED_API ? <SharedGate today={ranchDate()}>{children}</SharedGate> : <BarnProvider today={ranchDate()}>{children}</BarnProvider>;
}

"use client";
import { createContext, useContext, useState } from "react";
import { careRepository } from "@/lib/data/repository";
import type { Horse, TaskCompletion } from "@/types";
type Data = ReturnType<typeof careRepository.load>;
type Context = Data & {
  today: string;
  completions: Record<string, TaskCompletion>;
  toggleTask: (id: string) => void;
  addHorse: (horse: Horse) => void;
};
const BarnContext = createContext<Context | null>(null);
export function BarnProvider({
  children,
  today,
}: {
  children: React.ReactNode;
  today: string;
}) {
  const [data, setData] = useState(() => careRepository.load(today));
  const [completions, setCompletions] = useState<
    Record<string, TaskCompletion>
  >({});
  function toggleTask(id: string) {
    setCompletions((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else
        next[id] = {
          completedBy: "Karl (demo)",
          completedAt: new Date().toISOString(),
        };
      return next;
    });
  }
  return (
    <BarnContext.Provider
      value={{
        ...data,
        today,
        completions,
        toggleTask,
        addHorse: (horse) =>
          setData((prev) => ({ ...prev, horses: [...prev.horses, horse] })),
      }}
    >
      {children}
    </BarnContext.Provider>
  );
}
export function useBarn() {
  const value = useContext(BarnContext);
  if (!value) throw new Error("BarnProvider is missing");
  return value;
}

"use client";
import { createContext, useContext, useState } from "react";
import { careRepository } from "@/lib/data/repository";
import { offsetDate } from "@/lib/dates";
import type { CareInstruction, Horse, TaskCompletion } from "@/types";

type Data = ReturnType<typeof careRepository.load>;

/** The fields a person actually fills in on the care form. */
export type CareDraft = {
  kind: CareInstruction["kind"];
  name: string;
  amount: string;
  schedule: CareInstruction["schedule"];
  instructions: string;
  effectiveStart: string;
};

type Context = Data & {
  today: string;
  completions: Record<string, TaskCompletion>;
  toggleTask: (id: string) => void;
  addHorse: (horse: Horse) => void;
  addCare: (horseId: string, draft: CareDraft) => void;
  reviseCare: (id: string, draft: CareDraft) => void;
  stopCare: (id: string, lastDay: string) => void;
};

const BarnContext = createContext<Context | null>(null);

function buildInstruction(
  horseId: string,
  draft: CareDraft,
  id: string,
): CareInstruction {
  const shared = {
    id,
    horseId,
    name: draft.name.trim(),
    schedule: draft.schedule,
    instructions: draft.instructions.trim(),
    effectiveStart: draft.effectiveStart,
  };
  return draft.kind === "medication"
    ? { ...shared, kind: "medication", dose: draft.amount.trim() }
    : { ...shared, kind: draft.kind, quantity: draft.amount.trim() };
}

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

  function addCare(horseId: string, draft: CareDraft) {
    setData((prev) => ({
      ...prev,
      care: [...prev.care, buildInstruction(horseId, draft, crypto.randomUUID())],
    }));
  }

  // A change never overwrites what was there. The old instruction is closed off
  // the day before the new one starts, so the care plan keeps an honest record
  // of what the horse was actually on, and when it changed.
  function reviseCare(id: string, draft: CareDraft) {
    setData((prev) => {
      const existing = prev.care.find((c) => c.id === id);
      if (!existing) return prev;

      // Editing an instruction that has not started yet is a correction, not a
      // change of plan — just replace it.
      if (existing.effectiveStart >= draft.effectiveStart)
        return {
          ...prev,
          care: prev.care.map((c) =>
            c.id === id ? buildInstruction(existing.horseId, draft, id) : c,
          ),
        };

      const lastDay = offsetDate(draft.effectiveStart, -1);
      return {
        ...prev,
        care: [
          ...prev.care.map((c) =>
            c.id === id ? ({ ...c, effectiveEnd: lastDay } as CareInstruction) : c,
          ),
          buildInstruction(existing.horseId, draft, crypto.randomUUID()),
        ],
      };
    });
  }

  function stopCare(id: string, lastDay: string) {
    setData((prev) => ({
      ...prev,
      care: prev.care.map((c) =>
        c.id === id ? ({ ...c, effectiveEnd: lastDay } as CareInstruction) : c,
      ),
    }));
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
        addCare,
        reviseCare,
        stopCare,
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

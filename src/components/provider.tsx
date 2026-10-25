"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { careRepository, rosterSnapshot } from "@/lib/data/repository";
import { offsetDate, ranchDate } from "@/lib/dates";
import { dailyTasks, emptyData, emptySnapshot, readWorkspace, saveWorkspace, validateSnapshot, STORAGE_KEY, UNDO_KEY, type Snapshot } from "@/lib/data/workspace";
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
  addHorse: (horse: Horse) => boolean;
  updateHorse: (horse: Horse) => boolean;
  addCare: (horseId: string, draft: CareDraft) => boolean;
  reviseCare: (id: string, draft: CareDraft) => boolean;
  stopCare: (id: string, lastDay: string) => void;
  mode: Snapshot["mode"];
  savedAt: string;
  storageError: string;
  canUndoReset: boolean;
  resetWorkspace: (mode: Snapshot["mode"]) => boolean;
  undoReset: () => boolean;
  exportBackup: () => string;
  restoreBackup: (text: string) => boolean;
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
  today: initialToday,
}: {
  children: React.ReactNode;
  today: string;
}) {
  const [today, setToday] = useState(initialToday);
  const [initial] = useState(() => {
    try { return { snapshot: localStorage.getItem(STORAGE_KEY) ? readWorkspace(localStorage) : rosterSnapshot(), error: "" }; }
    catch { return { snapshot: emptySnapshot(), error: "Saved records could not be opened. Your saved copy has not been changed. Open Administration to download it or restore a backup." }; }
  });
  const [snapshot, setSnapshot] = useState(initial.snapshot);
  const current = useRef(snapshot);
  const [storageError, setStorageError] = useState(initial.error);
  const [canUndoReset, setCanUndoReset] = useState(() => { try { return !!localStorage.getItem(UNDO_KEY); } catch { return false; } });
  const data = snapshot.data;
  const completions = snapshot.completions;

  useEffect(() => {
    const sync = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      try { const next = readWorkspace(localStorage); current.current = next; setSnapshot(next); setStorageError(""); setCanUndoReset(!!localStorage.getItem(UNDO_KEY)); }
      catch { setStorageError("Saved records changed in another tab and could not be read. Refresh or restore a backup before editing."); }
    };
    window.addEventListener("storage", sync);
    const timer = window.setInterval(() => setToday(ranchDate()), 30000);
    return () => { window.removeEventListener("storage", sync); window.clearInterval(timer); };
  }, []);

  function commit(next: Snapshot, replace = false) {
    if (storageError && !replace) return false;
    try {
      const saved = saveWorkspace(localStorage, current.current, next, replace);
      current.current = saved; setSnapshot(saved); setStorageError("");
      setCanUndoReset(!!localStorage.getItem(UNDO_KEY));
      return true;
    } catch (error) { setStorageError(error instanceof Error ? error.message : "This browser could not save your change. Your previous records are unchanged."); return false; }
  }
  const changeData = (change: (data: Data) => Data) => commit({ ...current.current, data: change(current.current.data) });

  function resetWorkspace(mode: Snapshot["mode"]) {
    const data = mode === "examples" ? careRepository.load(today) : emptyData();
    if (mode === "roster") data.horses = current.current.data.horses.map(h => ({ ...h, registeredName: "", sex: "", breed: "", colour: "", birthDate: "", arrivalDate: "", owner: { ...h.owner, name: "" }, specialInstructions: "" }));
    return commit({ ...emptySnapshot(), mode, data }, true);
  }
  function undoReset() {
    try { const raw = localStorage.getItem(UNDO_KEY); return raw ? commit(validateSnapshot(JSON.parse(raw)), true) : false; }
    catch { setStorageError("The previous workspace could not be restored. Its saved copy has been kept."); return false; }
  }

  function toggleTask(id: string) {
      const next = { ...current.current.completions };
      if (next[id]) delete next[id];
      else
        next[id] = {
          completedBy: "This device",
          completedAt: new Date().toISOString(),
        };
      commit({ ...current.current, completions: next });
  }

  function addCare(horseId: string, draft: CareDraft) {
    return changeData((prev) => ({
      ...prev,
      care: [...prev.care, buildInstruction(horseId, draft, crypto.randomUUID())],
    }));
  }

  // A change never overwrites what was there. The old instruction is closed off
  // the day before the new one starts, so the care plan keeps an honest record
  // of what the horse was actually on, and when it changed.
  function reviseCare(id: string, draft: CareDraft) {
    return changeData((prev) => {
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
    changeData((prev) => ({
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
        tasks: dailyTasks(data, today),
        today,
        completions,
        toggleTask,
        addHorse: (horse) =>
          changeData((prev) => ({ ...prev, horses: [...prev.horses, horse] })),
        updateHorse: (horse) => changeData((prev) => ({ ...prev, horses: prev.horses.map(h => h.id === horse.id ? horse : h) })),
        addCare,
        reviseCare,
        stopCare,
        mode: snapshot.mode,
        savedAt: snapshot.savedAt,
        storageError,
        canUndoReset,
        resetWorkspace,
        undoReset,
        exportBackup: () => localStorage.getItem(STORAGE_KEY) || JSON.stringify(current.current),
        restoreBackup: (text) => commit(validateSnapshot(JSON.parse(text)), true),
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

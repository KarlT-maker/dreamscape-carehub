"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { careRepository, rosterSnapshot } from "@/lib/data/repository";
import { offsetDate, ranchDate } from "@/lib/dates";
import { dailyTasks, emptyData, emptySnapshot, readWorkspace, saveWorkspace, validateSnapshot, STORAGE_KEY, UNDO_KEY, type Snapshot } from "@/lib/data/workspace";
import type { CalendarEvent, CareInstruction, HistoryEntry, Horse, TaskCompletion } from "@/types";
import { sharedRequest, SharedError, type SharedSession, type SharedWorkspace } from "@/lib/shared";
import { changeCrewAssignments, recordFarrierVisit, savePlanningRecord, type CrewAssignmentChange, type PlanningRecord, type PlanningSection } from "@/lib/data/planning";

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
  addHorse: (horse: Horse) => Promise<boolean>;
  updateHorse: (horse: Horse, before?: Horse) => Promise<boolean>;
  addCare: (horseId: string, draft: CareDraft, id?: string) => Promise<boolean>;
  reviseCare: (id: string, draft: CareDraft, before?: CareInstruction) => Promise<boolean>;
  stopCare: (id: string, lastDay: string) => void;
  mode: Snapshot["mode"];
  savedAt: string;
  storageError: string;
  canUndoReset: boolean;
  resetWorkspace: (mode: Snapshot["mode"]) => Promise<boolean>;
  undoReset: () => Promise<boolean>;
  exportBackup: () => string;
  restoreBackup: (text: string) => Promise<boolean>;
  shared: boolean;
  userName: string;
  isAdmin: boolean;
  canManageAccounts: boolean;
  saving: boolean;
  uncertain: boolean;
  retrySave: () => Promise<boolean>;
  logout: () => Promise<void>;
  savePlanning: <K extends PlanningSection>(section: K, record: PlanningRecord<K>, before?: PlanningRecord<K>) => Promise<boolean>;
  saveCrewAssignments: (change:CrewAssignmentChange) => Promise<boolean>;
  completeFarrierVisit: (record: HistoryEntry, plan: CalendarEvent) => Promise<boolean>;
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
  remote,
}: {
  children: React.ReactNode;
  today: string;
  remote?: { session: SharedSession; workspace: SharedWorkspace };
}) {
  const [today, setToday] = useState(initialToday);
  const [initial] = useState(() => {
    if (remote) return {snapshot: remote.workspace.snapshot, error: ""};
    try { return { snapshot: localStorage.getItem(STORAGE_KEY) ? readWorkspace(localStorage) : rosterSnapshot(), error: "" }; }
    catch { return { snapshot: emptySnapshot(), error: "Saved records could not be opened. Your saved copy has not been changed. Open Administration to download it or restore a backup." }; }
  });
  const [snapshot, setSnapshot] = useState(initial.snapshot);
  const current = useRef(snapshot);
  const [storageError, setStorageError] = useState(initial.error);
  const [canUndoReset, setCanUndoReset] = useState(() => { if (remote) return remote.workspace.canUndoReset; try { return !!localStorage.getItem(UNDO_KEY); } catch { return false; } });
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const busy = useRef(false);
  const pending = useRef<{action: string; body: {revision: number; requestId: string; snapshot: Snapshot}} | null>(null);
  const data = snapshot.data;
  const completions = snapshot.completions;

  useEffect(() => {
    const timer = window.setInterval(() => setToday(ranchDate()), 30000);
    if (remote) {
      let active = true;
      async function refresh() {
        if (busy.current || pending.current) return;
        try {
          const result: SharedWorkspace = await sharedRequest("workspace");
          if (!active || busy.current || pending.current) return;
          if (result.snapshot.revision >= current.current.revision) {
            current.current = result.snapshot; setSnapshot(result.snapshot); setCanUndoReset(result.canUndoReset);
          }
        } catch (error) {
          if (active && error instanceof SharedError && error.status === 401) { window.location.reload(); return; }
          if (active) setStorageError("The shared barn could not be refreshed. Check your connection before saving.");
        }
      }
      const poll = window.setInterval(refresh, 10000);
      const protectSave = (event: BeforeUnloadEvent) => { if (busy.current || pending.current) {event.preventDefault(); event.returnValue = "";} };
      window.addEventListener("focus", refresh);
      window.addEventListener("beforeunload", protectSave);
      return () => { active = false; window.clearInterval(timer); window.clearInterval(poll); window.removeEventListener("focus", refresh); window.removeEventListener("beforeunload", protectSave); };
    }
    const sync = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      try { const next = readWorkspace(localStorage); current.current = next; setSnapshot(next); setStorageError(""); setCanUndoReset(!!localStorage.getItem(UNDO_KEY)); }
      catch { setStorageError("Saved records changed in another tab and could not be read. Refresh or restore a backup before editing."); }
    };
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("storage", sync); window.clearInterval(timer); };
  }, [remote]);

  async function sendPending() {
    if (!remote || !pending.current || busy.current) return false;
    busy.current = true; setSaving(true);
    try {
      const request = pending.current;
      let result: SharedWorkspace;
      try { result = await sharedRequest(request.action, remote.session.nonce, request.body); }
      catch (error) { if (error instanceof SharedError) throw error; result = await sharedRequest(request.action, remote.session.nonce, request.body); }
      current.current = result.snapshot; setSnapshot(result.snapshot); setCanUndoReset(result.canUndoReset);
      pending.current = null; setUncertain(false); setStorageError(""); return true;
    } catch (error) {
      if (error instanceof SharedError) {
        if (error.workspace) { current.current = error.workspace.snapshot; setSnapshot(error.workspace.snapshot); setCanUndoReset(error.workspace.canUndoReset); }
        pending.current = null; setUncertain(false); setStorageError(error.message);
      } else { setUncertain(true); setStorageError("We could not confirm this save. Keep this page open and choose Check save when your connection returns. Your entered text is still here."); }
      return false;
    } finally { busy.current = false; setSaving(false); }
  }
  async function commit(next: Snapshot, replace = false, action = replace ? "replace" : "save") {
    if (remote) {
      if (busy.current || pending.current) { setStorageError("Finish checking the previous save before making another change."); return false; }
      pending.current = {action, body: {revision: current.current.revision, requestId: crypto.randomUUID(), snapshot: validateSnapshot(next)}};
      return sendPending();
    }
    if (storageError && !replace) return false;
    try {
      const saved = saveWorkspace(localStorage, current.current, next, replace);
      current.current = saved; setSnapshot(saved); setStorageError("");
      setCanUndoReset(!!localStorage.getItem(UNDO_KEY));
      return true;
    } catch (error) { setStorageError(error instanceof Error ? error.message : "This browser could not save your change. Your previous records are unchanged."); return false; }
  }
  const changeData = (change: (data: Data) => Data) => commit({ ...current.current, data: change(current.current.data) });
  async function savePlanning<K extends PlanningSection>(section: K, record: PlanningRecord<K>, before?: PlanningRecord<K>) {
    try { return await changeData(data => savePlanningRecord(data, section, record, before)); }
    catch (error) { setStorageError(error instanceof Error ? error.message : "This change could not be saved."); return false; }
  }
  async function saveCrewAssignments(change:CrewAssignmentChange) {
    try {
      const next=changeCrewAssignments(current.current.data,change);
      if(next===current.current.data)return true;
      return await commit({...current.current,data:next});
    }catch(error){setStorageError(error instanceof Error?error.message:"The assignments could not be saved.");return false;}
  }

  function resetWorkspace(mode: Snapshot["mode"]) {
    const data = mode === "examples" ? careRepository.load(today) : emptyData();
    if (mode === "roster") data.horses = current.current.data.horses.map(h => ({ ...h, registeredName: "", sex: "", breed: "", colour: "", birthDate: "", arrivalDate: "", owner: { ...h.owner, name: "" }, specialInstructions: "" }));
    return commit({ ...emptySnapshot(), mode, data }, true);
  }
  async function undoReset() {
    if (remote) return commit(current.current, true, "undo");
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

  function addCare(horseId: string, draft: CareDraft, id = crypto.randomUUID()) {
    if (current.current.data.care.some(c => c.id === id)) return Promise.resolve(true);
    return changeData((prev) => ({
      ...prev,
      care: [...prev.care, buildInstruction(horseId, draft, id)],
    }));
  }

  // A change never overwrites what was there. The old instruction is closed off
  // the day before the new one starts, so the care plan keeps an honest record
  // of what the horse was actually on, and when it changed.
  function stale(before: Horse | CareInstruction | undefined, now: Horse | CareInstruction | undefined) {
    if (before && JSON.stringify(before) !== JSON.stringify(now)) { setStorageError("This record changed while the form was open. Your text is still here. Close and reopen the form to review the latest version before editing."); return true; }
    return false;
  }
  function reviseCare(id: string, draft: CareDraft, before?: CareInstruction) {
    if (stale(before, current.current.data.care.find(c => c.id === id))) return Promise.resolve(false);
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
        savePlanning,
        saveCrewAssignments,
        completeFarrierVisit: async (record,plan) => {
          try {return await changeData(data=>recordFarrierVisit(data,record,plan));}
          catch(error){setStorageError(error instanceof Error?error.message:"The farrier work could not be saved.");return false;}
        },
        addHorse: (horse) => current.current.data.horses.some(h => h.id === horse.id) ? Promise.resolve(true) : changeData((prev) => ({ ...prev, horses: [...prev.horses, horse] })),
        updateHorse: (horse, before) => stale(before, current.current.data.horses.find(h => h.id === horse.id)) ? Promise.resolve(false) : changeData((prev) => ({ ...prev, horses: prev.horses.map(h => h.id === horse.id ? horse : h) })),
        addCare,
        reviseCare,
        stopCare,
        mode: snapshot.mode,
        savedAt: snapshot.savedAt,
        storageError,
        canUndoReset,
        resetWorkspace,
        undoReset,
        exportBackup: () => remote ? JSON.stringify(current.current) : localStorage.getItem(STORAGE_KEY) || JSON.stringify(current.current),
        restoreBackup: (text) => commit(validateSnapshot(JSON.parse(text)), true),
        shared: !!remote,
        userName: remote?.session.user?.name ?? "This device",
        isAdmin: remote ? !!remote.session.user?.admin : true,
        canManageAccounts: !!remote?.session.user?.canManageAccounts,
        saving, uncertain, retrySave: sendPending,
        logout: async () => { if (remote && !busy.current && !pending.current) { try { await sharedRequest("logout", remote.session.nonce, {}); window.location.reload(); } catch { setStorageError("Sign-out could not be confirmed. Check your connection and try again."); } } },
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

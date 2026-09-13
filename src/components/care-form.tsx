"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { dateLabel, offsetDate } from "@/lib/dates";
import type { CareInstruction } from "@/types";
import { useBarn, type CareDraft } from "./provider";

const KIND_LABEL = {
  medication: "medication",
  feed: "feed or mash",
  supplement: "supplement",
} as const;

const AMOUNT_LABEL = {
  medication: "Dose",
  feed: "How much",
  supplement: "How much",
} as const;

const AMOUNT_HINT = {
  medication: "1 tablet · ½ tablet · 1 scoop",
  feed: "1 kg · half a scoop · 2 flakes",
  supplement: "30 g · 1 scoop",
} as const;

export function CareForm({
  horseId,
  horseName,
  kind,
  existing,
  onClose,
}: {
  horseId: string;
  horseName: string;
  kind: CareInstruction["kind"];
  existing?: CareInstruction;
  onClose: () => void;
}) {
  const { today, addCare, reviseCare } = useBarn();
  const [draft, setDraft] = useState<CareDraft>({
    kind,
    name: existing?.name ?? "",
    amount: existing
      ? "dose" in existing
        ? existing.dose
        : existing.quantity
      : "",
    schedule: existing?.schedule ?? "AM & PM",
    instructions: existing?.instructions ?? "",
    effectiveStart: today,
  });

  const set = <K extends keyof CareDraft>(key: K, value: CareDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Changing something that is already running closes the old instruction the
  // day before the new one starts. Say so plainly, rather than letting someone
  // discover it afterwards.
  const replacing =
    existing && existing.effectiveStart < draft.effectiveStart
      ? offsetDate(draft.effectiveStart, -1)
      : null;

  const valid = draft.name.trim() && draft.amount.trim();

  return (
    <form
      className="panel care-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        if (existing) reviseCare(existing.id, draft);
        else addCare(horseId, draft);
        onClose();
      }}
    >
      <div className="panel-heading">
        <h3>
          {existing ? "Change" : "Add"} {KIND_LABEL[kind]} · {horseName}
        </h3>
        <button
          type="button"
          className="icon-button"
          aria-label="Close"
          onClick={onClose}
        >
          <X />
        </button>
      </div>

      <div className="care-form-grid">
        <label>
          What they get
          <input
            required
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder={
              kind === "medication" ? "Prascend" : "Senior feed"
            }
          />
        </label>

        <label>
          {AMOUNT_LABEL[kind]}
          <input
            required
            value={draft.amount}
            onChange={(e) => set("amount", e.target.value)}
            placeholder={AMOUNT_HINT[kind]}
          />
        </label>

        <label>
          When
          <select
            value={draft.schedule}
            onChange={(e) =>
              set("schedule", e.target.value as CareDraft["schedule"])
            }
          >
            <option>AM &amp; PM</option>
            <option>AM</option>
            <option>PM</option>
          </select>
        </label>

        <label>
          Starts
          <input
            type="date"
            value={draft.effectiveStart}
            min={today}
            onChange={(e) => set("effectiveStart", e.target.value || today)}
          />
        </label>

        <label className="care-form-wide">
          How it&rsquo;s given
          <textarea
            rows={2}
            value={draft.instructions}
            onChange={(e) => set("instructions", e.target.value)}
            placeholder={
              kind === "medication"
                ? "Give with the morning feed. Confirm it is fully eaten."
                : "Soak fully. Serve soft and check the temperature."
            }
          />
        </label>
      </div>

      <div className="care-form-quick">
        <span className="muted">Start</span>
        {[
          ["Today", today],
          ["Tomorrow", offsetDate(today, 1)],
          ["Next week", offsetDate(today, 7)],
        ].map(([label, value]) => (
          <button
            type="button"
            key={label}
            className={
              "chip " + (draft.effectiveStart === value ? "chip-on" : "")
            }
            onClick={() => set("effectiveStart", value)}
          >
            {label}
          </button>
        ))}
      </div>

      {replacing && (
        <p className="care-form-effect">
          The instruction running now will be recorded as ending{" "}
          <strong>{dateLabel(replacing)}</strong>, and this one takes over on{" "}
          <strong>{dateLabel(draft.effectiveStart)}</strong>. Nothing is deleted
          — the care plan keeps both.
        </p>
      )}

      <div className="care-form-actions">
        <button className="button" type="submit" disabled={!valid}>
          {existing ? "Save change" : "Add it"}
        </button>
        <button type="button" className="button secondary" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}

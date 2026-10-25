"use client";
import { X } from "lucide-react";
import { useBarn } from "./provider";
import { PADDOCKS } from "@/lib/data/roster";
import type { Horse } from "@/types";

export function HorseForm({ horse, onClose, onSaved }: { horse?: Horse; onClose: () => void; onSaved: (name: string) => void }) {
  const { today, addHorse, updateHorse, horses } = useBarn();
  const fields = [
    { key: "name", label: "Horse name", required: true, value: horse?.name },
    { key: "registeredName", label: "Registered name", value: horse?.registeredName },
    { key: "birthDate", label: "Date of birth", type: "date", value: horse?.birthDate },
    { key: "owner", label: "Owner", value: horse?.owner.name },
    { key: "breed", label: "Breed", value: horse?.breed },
    { key: "colour", label: "Colour", value: horse?.colour },
    { key: "location", label: "Paddock / location", required: true, value: horse?.location },
    { key: "arrivalDate", label: "Arrival date", type: "date", value: horse?.arrivalDate },
  ];
  return <section className="panel add-form" aria-labelledby="horse-form-title">
    <div className="panel-heading"><h2 id="horse-form-title">{horse ? `Edit ${horse.name}` : "Add a horse"}</h2>
      <button className="icon-button" aria-label="Close horse form" onClick={onClose}><X /></button></div>
    <form onSubmit={e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const text = (key: string) => String(f.get(key) ?? "").trim();
      if (!text("name") || !text("location")) return;
      const next: Horse = { id: horse?.id ?? crypto.randomUUID(), name: text("name"), registeredName: text("registeredName"),
        birthDate: text("birthDate"), sex: text("sex") as Horse["sex"], breed: text("breed"), colour: text("colour"),
        owner: { id: horse?.owner.id ?? crypto.randomUUID(), name: text("owner") }, arrivalDate: text("arrivalDate"),
        location: text("location"), status: horse?.status ?? "Active", specialInstructions: text("instructions") };
      if (horse ? updateHorse(next) : addHorse(next)) onSaved(next.name);
    }}>
      <p className="muted">Only the name and paddock are required. Leave anything you do not know blank.</p>
      <div className="form-grid">{fields.map(f => <label key={f.key}>{f.label}
        <input name={f.key} type={f.type ?? "text"} required={f.required} defaultValue={f.value ?? ""}
          max={f.type === "date" ? today : undefined} list={f.key === "location" ? "ranch-paddocks" : undefined} />
      </label>)}
      <datalist id="ranch-paddocks">{[...new Set([...PADDOCKS, ...horses.map(h => h.location)])].map(p => <option value={p} key={p} />)}</datalist>
      <label>Sex<select name="sex" defaultValue={horse?.sex ?? ""}><option value="">Not entered</option><option>Mare</option><option>Gelding</option><option>Stallion</option></select></label>
      <label>Special instructions<input name="instructions" defaultValue={horse?.specialInstructions ?? ""} /></label>
      </div>
      <button className="button" type="submit">{horse ? "Save profile" : "Add to herd"}</button>
      <p className="muted">Saved in this browser. Add feed and medications in the horse’s Care tab.</p>
    </form>
  </section>;
}

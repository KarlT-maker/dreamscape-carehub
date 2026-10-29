"use client";
import { X } from "lucide-react";
import { useBarn } from "./provider";
import { PADDOCKS } from "@/lib/data/roster";
import type { Horse } from "@/types";
import { useState } from "react";

export function HorseForm({ horse: initialHorse, onClose, onSaved }: { horse?: Horse; onClose: () => void; onSaved: (name: string) => void }) {
  const [horse] = useState(initialHorse);
  const [newId] = useState(() => crypto.randomUUID());
  const [ownerId] = useState(() => crypto.randomUUID());
  const { today, addHorse, updateHorse, horses, saving, uncertain, shared } = useBarn();
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
    <form onSubmit={async e => {
      e.preventDefault();
      const f = new FormData(e.currentTarget);
      const text = (key: string) => String(f.get(key) ?? "").trim();
      if (!text("name") || !text("location")) return;
      const next: Horse = { ...horse, id: horse?.id ?? newId, name: text("name"), registeredName: text("registeredName"),
        birthDate: text("birthDate"), sex: text("sex") as Horse["sex"], breed: text("breed"), colour: text("colour"),
        owner: { id: horse?.owner.id ?? ownerId, name: text("owner") }, arrivalDate: text("arrivalDate"),
        location: text("location"), status: horse?.status ?? "Active", specialInstructions: horse?.specialInstructions??"", specialCharacteristics:text("characteristics"),specialCareStart:horse?.specialCareStart??"",specialCareEnd:horse?.specialCareEnd??"" };
      if (await (horse ? updateHorse(next, horse) : addHorse(next))) onSaved(next.name);
    }}>
      <p className="muted">Only the name and paddock are required. Leave anything you do not know blank.</p>
      <div className="form-grid">{fields.map(f => <label key={f.key}>{f.label}
        <input name={f.key} type={f.type ?? "text"} required={f.required} defaultValue={f.value ?? ""}
          max={f.type === "date" ? today : undefined} list={f.key === "location" ? "ranch-paddocks" : undefined} />
      </label>)}
      <datalist id="ranch-paddocks">{[...new Set([...PADDOCKS, ...horses.map(h => h.location)])].map(p => <option value={p} key={p} />)}</datalist>
      <label>Sex<select name="sex" defaultValue={horse?.sex ?? ""}><option value="">Not entered</option><option>Mare</option><option>Gelding</option><option>Stallion</option></select></label>
      <label className="record-wide">Special characteristics<textarea name="characteristics" rows={3} maxLength={3000} defaultValue={horse?.specialCharacteristics??""} placeholder="Scars, identifying features or background notes"/></label>
      </div>
      <button className="button" type="submit" disabled={saving || uncertain}>{saving ? "Saving…" : horse ? "Save profile" : "Add to herd"}</button>
      <p className="muted">{shared ? "Saved online for the whole barn." : "Saved in this browser."} Edit medications, feed, supplements and special care in the horse’s Care tab.</p>
    </form>
  </section>;
}

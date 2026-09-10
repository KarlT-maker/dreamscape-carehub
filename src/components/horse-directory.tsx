"use client";
import { useState } from "react";
import Link from "next/link";
import { horsePath } from "@/lib/horse-path";
import { Plus, Search, X } from "lucide-react";
import { useBarn } from "./provider";
import { PageHeader, HorsePortrait, Empty } from "./ui";
import { age } from "@/lib/dates";
import type { Horse } from "@/types";
export function HorseDirectory() {
  const { horses, today, addHorse } = useBarn();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = horses.filter((h) =>
    [h.name, h.owner.name, h.location].some((v) =>
      v.toLowerCase().includes(query.toLowerCase()),
    ),
  );
  return (
    <>
      <PageHeader
        eyebrow="OUR HERD"
        title="Horses"
        description={
          horses.length + " horses, each with their own story and care."
        }
        action={
          <button className="button" onClick={() => setAdding(true)}>
            <Plus size={20} />
            Add horse
          </button>
        }
      />
      {adding && (
        <section className="panel add-form" aria-labelledby="add-title">
          <div className="panel-heading">
            <h2 id="add-title">Add a horse</h2>
            <button
              className="icon-button"
              aria-label="Close add horse"
              onClick={() => setAdding(false)}
            >
              <X />
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const name = String(f.get("name")).trim();
              if (!name) return;
              addHorse({
                id: crypto.randomUUID(),
                name,
                registeredName: String(f.get("registeredName")).trim(),
                birthDate: String(f.get("birthDate")),
                sex: f.get("sex") as Horse["sex"],
                breed: String(f.get("breed")).trim(),
                colour: String(f.get("colour")).trim(),
                owner: {
                  id: crypto.randomUUID(),
                  name: String(f.get("owner")).trim(),
                },
                arrivalDate: String(f.get("arrivalDate")),
                location: String(f.get("location")).trim(),
                status: "Active",
                specialInstructions: String(f.get("instructions")).trim(),
              });
              setAdding(false);
              setQuery("");
              setMessage(name + " added for this session.");
            }}
          >
            <div className="form-grid">
              {[
                { key: "name", label: "Horse name", required: true },
                { key: "registeredName", label: "Registered name" },
                {
                  key: "birthDate",
                  label: "Date of birth",
                  type: "date",
                  required: true,
                },
                { key: "owner", label: "Owner", required: true },
                { key: "breed", label: "Breed", required: true },
                { key: "colour", label: "Colour", required: true },
                {
                  key: "location",
                  label: "Paddock / location",
                  required: true,
                },
                {
                  key: "arrivalDate",
                  label: "Arrival date",
                  type: "date",
                  required: true,
                },
              ].map((f) => (
                <label key={f.key}>
                  {f.label}
                  <input
                    name={f.key}
                    type={f.type || "text"}
                    required={f.required}
                    max={f.type === "date" ? today : undefined}
                    defaultValue={f.key === "arrivalDate" ? today : undefined}
                  />
                </label>
              ))}
              <label>
                Sex
                <select name="sex">
                  <option>Mare</option>
                  <option>Gelding</option>
                  <option>Stallion</option>
                </select>
              </label>
              <label>
                Special instructions
                <input name="instructions" />
              </label>
            </div>
            <button className="button" type="submit">
              Add to herd
            </button>
            <p className="muted">
              Session only. No care tasks are created automatically.
            </p>
          </form>
        </section>
      )}
      <p role="status">{message}</p>
      <div className="directory-toolbar">
        <label className="search">
          <Search size={20} />
          <input
            aria-label="Search horses"
            placeholder="Search horses, owners or paddocks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <span className="muted">{filtered.length} horses</span>
      </div>
      <div className="horse-grid">
        {filtered.map((h) => (
          <Link className="horse-card" key={h.id} href={horsePath(h.id)}>
            <HorsePortrait name={h.name} />
            <div className="horse-card-body">
              <div className="row-between">
                <h2>{h.name}</h2>
                <span className="badge">{h.status}</span>
              </div>
              <p>
                {age(h.birthDate, today)} years · {h.sex} · {h.breed}
              </p>
              <dl>
                <div>
                  <dt>Owner</dt>
                  <dd>{h.owner.name}</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{h.location}</dd>
                </div>
              </dl>
            </div>
          </Link>
        ))}
      </div>
      {!filtered.length && <Empty>No horses match your search.</Empty>}
    </>
  );
}

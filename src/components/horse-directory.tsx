"use client";
import { useState } from "react";
import Link from "next/link";
import { horsePath } from "@/lib/horse-path";
import { Plus, Search } from "lucide-react";
import { useBarn } from "./provider";
import { PageHeader, HorsePortrait, Empty } from "./ui";
import { age } from "@/lib/dates";
import { HorseForm } from "./horse-form";
export function HorseDirectory() {
  const { horses, today, shared } = useBarn();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const filtered = horses.filter((h) =>
    [h.name, h.owner.name, h.location,h.specialCharacteristics??""].some((v) =>
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
      {adding && <HorseForm onClose={() => setAdding(false)} onSaved={name => { setAdding(false); setQuery(""); setMessage(name + (shared ? " added and saved online." : " added and saved on this device.")); }} />}
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
                {h.birthDate ? `${age(h.birthDate, today)} years` : "Age not entered"} · {h.sex || "Sex not entered"} · {h.breed || "Breed not entered"}
              </p>
              <dl>
                <div className="horse-characteristics"><dt>Special characteristics</dt><dd>{h.specialCharacteristics||"Not entered"}</dd></div>
                <div>
                  <dt>Owner</dt>
                  <dd>{h.owner.name || "Not entered"}</dd>
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
      {!filtered.length && <Empty>{horses.length ? "No horses match your search." : "No horses yet. Use Add horse to enter a name and paddock, then open its Care tab to add feed."}</Empty>}
    </>
  );
}

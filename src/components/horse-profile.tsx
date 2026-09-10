"use client";
import { useState } from "react";
import Link from "next/link";
import { useBarn } from "./provider";
import { HorsePortrait, Empty } from "./ui";
import { TaskList } from "./task-list";
import { EventList } from "./event-list";
import { CarePlan } from "./care-plan";
import { History } from "./history";
import { age, dateLabel, instructionState } from "@/lib/dates";
const tabs = ["Overview", "Care", "Calendar", "History", "Photos", "Documents"];
export function HorseProfile({ id }: { id: string }) {
  const { horses, today, tasks, events, care, history } = useBarn();
  const [tab, setTab] = useState("Overview");
  const horse = horses.find((h) => h.id === id);
  if (!horse)
    return (
      <Empty>
        Horse not found. <Link href="/horses">Return to horses</Link>
      </Empty>
    );
  const current = care.filter(
    (c) => c.horseId === id && instructionState(c, today) === "Current",
  );
  return (
    <>
      <Link href="/horses" className="back-link">
        ← All horses
      </Link>
      <section className="profile-header">
        <HorsePortrait name={horse.name} large />
        <div>
          <p className="eyebrow">HORSE PROFILE</p>
          <div className="row-between">
            <h1>{horse.name}</h1>
            <span className="badge">{horse.status}</span>
          </div>
          <p className="registered">
            {horse.registeredName || "Registered name not recorded"}
          </p>
          <p>
            {age(horse.birthDate, today)} years · {horse.sex} · {horse.breed} ·{" "}
            {horse.colour}
          </p>
          <dl className="profile-facts">
            <div>
              <dt>Owner</dt>
              <dd>{horse.owner.name}</dd>
            </div>
            <div>
              <dt>Paddock</dt>
              <dd>{horse.location}</dd>
            </div>
            <div>
              <dt>Born</dt>
              <dd>{dateLabel(horse.birthDate)}</dd>
            </div>
            <div>
              <dt>Arrived</dt>
              <dd>{dateLabel(horse.arrivalDate)}</dd>
            </div>
          </dl>
        </div>
      </section>
      <div className="tabs" role="tablist" aria-label="Horse profile sections">
        {tabs.map((t) => (
          <button
            key={t}
            id={"tab-" + t}
            role="tab"
            aria-selected={tab === t}
            aria-controls="profile-panel"
            tabIndex={tab === t ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                const next =
                  tabs[
                    (tabs.indexOf(t) +
                      (e.key === "ArrowRight" ? 1 : tabs.length - 1)) %
                      tabs.length
                  ];
                setTab(next);
                document.getElementById("tab-" + next)?.focus();
              }
            }}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div id="profile-panel" role="tabpanel" aria-labelledby={"tab-" + tab}>
        {tab === "Overview" && (
          <div className="profile-columns">
            <div>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Today’s care</h2>
                  <span className="badge">
                    {dateLabel(today, { month: "short", day: "numeric" })}
                  </span>
                </div>
                <TaskList tasks={tasks.filter((t) => t.horseId === id)} />
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Current care instructions</h2>
                  <button className="text-link" onClick={() => setTab("Care")}>
                    Full care plan
                  </button>
                </div>
                <div className="padded">
                  {current.map((c) => (
                    <div className="overview-instruction" key={c.id}>
                      <span className="eyebrow">{c.kind}</span>
                      <h3>
                        {c.name} · {"dose" in c ? c.dose : c.quantity}
                      </h3>
                      <p>
                        {c.schedule} · {c.instructions}
                      </p>
                    </div>
                  ))}
                  {!current.length && <Empty>No care plan recorded yet.</Empty>}
                  {care.some(
                    (c) =>
                      c.horseId === id &&
                      instructionState(c, today) === "Scheduled",
                  ) && (
                    <button
                      className="future-notice"
                      onClick={() => setTab("Care")}
                    >
                      Scheduled care change · review the upcoming instruction →
                    </button>
                  )}
                </div>
              </section>
            </div>
            <div>
              <section className="panel special">
                <div className="panel-heading">
                  <h2>Special instructions</h2>
                </div>
                <p className="padded">
                  {horse.specialInstructions || "None recorded."}
                </p>
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Upcoming appointments</h2>
                </div>
                <EventList
                  events={events
                    .filter((e) => e.horseId === id && e.date >= today)
                    .slice(0, 3)}
                />
              </section>
              <section className="panel">
                <div className="panel-heading">
                  <h2>Recent history</h2>
                  <button
                    className="text-link"
                    onClick={() => setTab("History")}
                  >
                    View all
                  </button>
                </div>
                <div className="padded">
                  {history
                    .filter((h) => h.horseId === id)
                    .slice(0, 2)
                    .map((h) => (
                      <div className="overview-instruction" key={h.id}>
                        <small className="muted">{dateLabel(h.date)}</small>
                        <h3>{h.title}</h3>
                        <p>{h.detail}</p>
                      </div>
                    ))}
                </div>
              </section>
            </div>
          </div>
        )}
        {tab === "Care" && <CarePlan horseId={id} />}
        {tab === "Calendar" && (
          <section className="panel">
            <EventList events={events.filter((e) => e.horseId === id)} />
          </section>
        )}
        {tab === "History" && <History horseId={id} />}
        {tab === "Photos" && (
          <Empty>
            No photos attached. Horse images can be added when file storage is
            connected.
          </Empty>
        )}
        {tab === "Documents" && (
          <Empty>
            No documents attached. Veterinary reports and care documents will
            appear here.
          </Empty>
        )}
      </div>
    </>
  );
}

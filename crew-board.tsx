"use client";
import { useBarn } from "./provider";
import { dateLabel, offsetDate } from "@/lib/dates";
import { PADDOCKS } from "@/lib/data/roster";
import { BoardFrame } from "./board-frame";

/**
 * Who is on which paddock. Laid out paddock-down rather than person-across,
 * because the question asked in the feed room is "who has Show Girls today",
 * not "what is Dana doing".
 *
 * The rota below is invented. Replace it once the schedule whiteboard has been
 * photographed — that board will also settle whether this should be the other
 * way round.
 */
export function CrewBoard() {
  const { today, helpers, shifts, daysOff, horses } = useBarn();
  const tomorrow = offsetDate(today, 1);

  const name = (id: string) => helpers.find((h) => h.id === id)?.name ?? "—";
  const on = (date: string, paddock: string, period: "AM" | "PM") =>
    shifts.find(
      (s) => s.date === date && s.paddock === paddock && s.period === period,
    );

  const offToday = daysOff.filter((d) => d.date === today);
  const offSoon = daysOff
    .filter((d) => d.date > today && d.date <= offsetDate(today, 7))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <BoardFrame
      eyebrow="FEED ROOM"
      title="Who's on what"
      subtitle="Paddock cover for today and tomorrow, and who is off this week."
      count={helpers.length}
      countLabel="on the crew"
      searchPlaceholder="Find a paddock or person…"
      showPeriod={false}
    >
      {({ search }) => {
        const term = search.trim().toLowerCase();
        const visible = PADDOCKS.filter((p) => {
          if (!term) return true;
          if (p.toLowerCase().includes(term)) return true;
          return (["AM", "PM"] as const).some((period) => {
            const s = on(today, p, period);
            return s && name(s.helperId).toLowerCase().includes(term);
          });
        });

        return (
          <>
            <div className="crew-table">
              <div className="crew-row crew-head">
                <span>Paddock</span>
                <span>Today AM</span>
                <span>Today PM</span>
                <span className="crew-tomorrow">Tomorrow AM</span>
                <span className="crew-tomorrow">Tomorrow PM</span>
                <span className="crew-horses">Horses</span>
              </div>
              {visible.map((paddock) => {
                const count = horses.filter(
                  (h) => h.location === paddock && h.status === "Active",
                ).length;
                return (
                  <div className="crew-row" key={paddock}>
                    <span className="crew-paddock">{paddock}</span>
                    <span className="crew-person">
                      {name(on(today, paddock, "AM")?.helperId ?? "")}
                    </span>
                    <span className="crew-person">
                      {name(on(today, paddock, "PM")?.helperId ?? "")}
                    </span>
                    <span className="crew-person crew-tomorrow">
                      {name(on(tomorrow, paddock, "AM")?.helperId ?? "")}
                    </span>
                    <span className="crew-person crew-tomorrow">
                      {name(on(tomorrow, paddock, "PM")?.helperId ?? "")}
                    </span>
                    <span className="crew-horses">{count}</span>
                  </div>
                );
              })}
            </div>

            <div className="crew-off">
              <div>
                <p className="eyebrow">OFF TODAY</p>
                {offToday.length ? (
                  <p className="crew-off-list">
                    {offToday.map((d) => name(d.helperId)).join(", ")}
                  </p>
                ) : (
                  <p className="crew-off-list muted">Everyone is in.</p>
                )}
              </div>
              <div>
                <p className="eyebrow">OFF THIS WEEK</p>
                {offSoon.length ? (
                  <ul className="crew-off-week">
                    {offSoon.map((d) => (
                      <li key={d.id}>
                        <strong>{dateLabel(d.date, { weekday: "long" })}</strong>{" "}
                        {name(d.helperId)}
                        {d.note && <em> · {d.note}</em>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="crew-off-list muted">Nobody booked off.</p>
                )}
              </div>
            </div>

            <p className="board-footnote">
              Sample rota. The real pattern comes off the schedule whiteboard.
            </p>
          </>
        );
      }}
    </BoardFrame>
  );
}

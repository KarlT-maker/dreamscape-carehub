"use client";
import { useEffect, useState } from "react";
import { Maximize2, Minimize2, Search } from "lucide-react";
import { dateLabel } from "@/lib/dates";
import { useBarn } from "./provider";

/**
 * Wall display mode. The feed room screen is read from across the room, so it
 * drops the navigation and the page chrome and sets everything much larger.
 * The class goes on <body> because the sidebar lives outside this component.
 */
function useWallMode() {
  const [wall, setWall] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("wall-mode", wall);
    return () => document.body.classList.remove("wall-mode");
  }, [wall]);
  useEffect(() => {
    if (!wall) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setWall(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [wall]);
  return [wall, setWall] as const;
}

export type BoardFilters = {
  search: string;
  period: "All" | "AM" | "PM";
};

export function BoardFrame({
  eyebrow,
  title,
  subtitle,
  count,
  countLabel,
  searchPlaceholder,
  showPeriod = true,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  count?: number;
  countLabel?: string;
  searchPlaceholder: string;
  showPeriod?: boolean;
  children: (filters: BoardFilters) => React.ReactNode;
}) {
  const { today } = useBarn();
  const [wall, setWall] = useWallMode();
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState<BoardFilters["period"]>("All");

  return (
    <section className="panel wall-board">
      <div className="panel-heading board-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="board-title">{title}</h1>
          {subtitle && !wall && <p className="muted">{subtitle}</p>}
        </div>
        <div className="board-heading-right">
          <span className="badge board-date">
            {dateLabel(today, { weekday: "long", month: "short", day: "numeric" })}
          </span>
          <button
            className="button secondary wall-toggle"
            onClick={() => setWall(!wall)}
            aria-pressed={wall}
          >
            {wall ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            {wall ? "Exit wall display" : "Wall display"}
          </button>
        </div>
      </div>

      <div className="board-toolbar">
        <label className="search">
          <Search size={20} />
          <input
            aria-label={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </label>
        {showPeriod && (
          <label>
            Round
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as BoardFilters["period"])}
            >
              <option value="All">AM &amp; PM</option>
              <option value="AM">AM only</option>
              <option value="PM">PM only</option>
            </select>
          </label>
        )}
        {count !== undefined && (
          <span className="muted board-count">
            {count} {countLabel}
          </span>
        )}
      </div>

      {children({ search, period })}

      {wall && (
        <p className="wall-hint">Press Esc to leave wall display.</p>
      )}
    </section>
  );
}

/** Groups rows under their paddock heading, in the order the paddocks are listed. */
export function PaddockGroup({
  paddock,
  children,
}: {
  paddock: string;
  children: React.ReactNode;
}) {
  return (
    <div className="paddock-group">
      <h2 className="paddock-heading">{paddock}</h2>
      {children}
    </div>
  );
}

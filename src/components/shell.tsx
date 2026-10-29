"use client";
import Link from "next/link";
import { useBarn } from "./provider";
import { usePathname } from "next/navigation";
import {
  Sun,
  Fence,
  CalendarDays,
  Settings,
  Sprout,
  Wheat,
  Pill,
  Users,
  LayoutGrid,
  LogOut,
  ClipboardList,
} from "lucide-react";
const boardLinks = [
  { href: "/boards/full", label: "Dreamscape horse summary", icon: LayoutGrid },
  { href: "/boards/mash", label: "Mash & feed", icon: Wheat },
  { href: "/boards/medication", label: "Daily regular medication", icon: Pill },
  { href: "/boards/crew", label: "Helpers’ work schedule", icon: Users },
];
const links = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/horses", label: "Horses", icon: Fence },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/farrier", label: "Farrier records", icon: ClipboardList },
  { href: "/administration", label: "Administration", icon: Settings },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { mode, storageError, shared, userName, isAdmin, saving, uncertain, retrySave, logout, savedAt } = useBarn();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Sprout size={32} />
          <span>
            Barn<strong>CareHub</strong>
          </span>
        </Link>
        <div className="sidebar-navigation">
          <div className="nav-label">FEED ROOM BOARDS</div>
          <nav aria-label="Feed room boards">
            {boardLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={path.startsWith(href) ? "page" : undefined}
              >
                <Icon size={21} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="nav-label">BARN MANAGEMENT</div>
          <nav aria-label="Primary">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={
                  (href === "/" ? path === "/" : path.startsWith(href))
                    ? "page"
                    : undefined
                }
              >
                <Icon size={21} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="sidebar-foot">
          <span className="avatar">{shared ? userName.slice(0,2).toUpperCase() : "BC"}</span>
          <div className="sidebar-user">
            <div className="sidebar-identity">{userName}<small>{shared ? (isAdmin ? "Barn administrator" : "Barn tester") : "Local practice workspace"}</small></div>
            {shared && <button className="sidebar-sign-out" disabled={saving || uncertain} onClick={() => void logout()}><LogOut size={16} aria-hidden="true" />Sign out</button>}
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            Dreamscape Ranch <span className="muted">/ Care & wellbeing</span>
          </span>
          <span className="badge" role="status">{saving ? "Saving…" : shared ? "Shared beta" : mode === "examples" ? "Example roster" : "Practice workspace"}</span>
        </header>
        <main id="main">{!shared && <p className="workspace-notice">For shared saving, open the <a href="https://dreamscaperanch.com/carehub/">ranch’s online beta</a>. Entries made here stay on this device. Download a backup in Administration before bringing existing records across.</p>}{storageError && <div className="workspace-error" role="alert">{storageError} {uncertain && <button className="button" disabled={saving} onClick={() => void retrySave()}>Check save</button>}</div>}{mode === "examples" && <p className="workspace-notice">Example data: care, profile and staff details are invented. <Link href="/administration">Clear examples or undo</Link></p>}{children}</main>
        <footer>
          {shared ? `Shared online${savedAt ? ` · Last saved ${new Date(savedAt).toLocaleTimeString()}` : ""} · Checks for updates every 10 seconds` : "Saved on this device · not shared with other devices"} · <Link href="/administration">Backups &amp; reset</Link> · Pacific time
        </footer>
      </div>
    </div>
  );
}

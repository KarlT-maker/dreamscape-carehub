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
} from "lucide-react";
const boardLinks = [
  { href: "/boards/full", label: "Full board", icon: LayoutGrid },
  { href: "/boards/mash", label: "Mash & feed", icon: Wheat },
  { href: "/boards/medication", label: "Medications", icon: Pill },
  { href: "/boards/crew", label: "Who's on what", icon: Users },
];
const links = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/horses", label: "Horses", icon: Fence },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/administration", label: "Administration", icon: Settings },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { mode, storageError } = useBarn();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Sprout size={32} />
          <span>
            Barn<strong>CareHub</strong>
          </span>
        </Link>
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
        <div className="sidebar-foot">
          <span className="avatar">KT</span>
          <div>
            Karl Thorson<small>Barn administrator · demo</small>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            Dreamscape Ranch <span className="muted">/ Care & wellbeing</span>
          </span>
          <span className="badge">{mode === "examples" ? "Example roster" : "Practice workspace"}</span>
        </header>
        <main id="main">{storageError && <p className="workspace-error" role="alert">{storageError} <Link href="/administration">Backups &amp; reset</Link></p>}{mode === "examples" && <p className="workspace-notice">Example data: care, profile and staff details are invented. <Link href="/administration">Clear examples or undo</Link></p>}{children}</main>
        <footer>
          Saved on this device · not shared with other devices · <Link href="/administration">Backups &amp; reset</Link> · Pacific time
        </footer>
      </div>
    </div>
  );
}

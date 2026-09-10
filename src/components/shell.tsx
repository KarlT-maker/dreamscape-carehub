"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Fence, CalendarDays, Settings, Sprout } from "lucide-react";
const links = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/horses", label: "Horses", icon: Fence },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/administration", label: "Administration", icon: Settings },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Sprout size={32} />
          <span>
            Dreamscape<strong>CareHub</strong>
          </span>
        </Link>
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
          <span className="badge">Prototype · sample data</span>
        </header>
        <main id="main">{children}</main>
        <footer>
          Demo workspace · changes last until this page is refreshed · ranch
          time: Pacific
        </footer>
      </div>
    </div>
  );
}

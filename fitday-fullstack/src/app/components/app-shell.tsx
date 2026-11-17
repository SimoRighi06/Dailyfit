"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, CircleUserRound, Shirt, Sparkles, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: CalendarDays },
  { href: "/avatar", label: "My avatar", icon: CircleUserRound },
];

export function AppShell({ children, title, eyebrow = "Il tuo spazio personale", action }: {
  children: ReactNode; title: string; eyebrow?: string; action?: ReactNode;
}) {
  const pathname = usePathname();
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-mark">f.</span><span>fitday</span></Link>
      <div className="nav-label">Workspace</div>
      <nav className="nav-list">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${pathname === href ? "active" : ""}`}><Icon size={17}/><span>{label}</span></Link>)}
      </nav>
      <div style={{ flex: 1 }}/>
      <div className="sidebar-bottom">YOUR WARDROBE, REIMAGINED.<br/>A little more style, every day.</div>
    </aside>
    <main className="main-area">
      <header className="topbar">
        <div><div className="eyebrow">{eyebrow}</div><h1 className="page-title">{title}</h1></div>
        <div className="top-actions">{action}<Link href="/login" className="avatar-dot" aria-label="Account">F</Link></div>
      </header>
      {children}
    </main>
    <nav className="mobile-nav">
      {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? "active" : ""}><Icon size={17}/>{label}</Link>)}
    </nav>
  </div>;
}

export function SectionHeader({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return <div className="card-head"><div><div className="card-title">{title}</div>{note && <div className="muted small" style={{ marginTop: 4 }}>{note}</div>}</div>{action}</div>;
}

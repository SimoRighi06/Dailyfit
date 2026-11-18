"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, LayoutGrid, Shirt, UserRound } from "lucide-react";
import { LanguageSwitcher, useI18n } from "@/lib/i18n";

const NAV = [
  { href: "/", label: "nav.today", icon: LayoutGrid },
  { href: "/wardrobe", label: "nav.wardrobe", icon: Shirt },
  { href: "/outfits", label: "nav.outfits", icon: CalendarDays },
  { href: "/avatar", label: "nav.avatar", icon: UserRound },
] as const;

const TICKER = ["FITDAY", "ticker.story", "ticker.ready", "ticker.party", "ticker.drop", "ticker.volt"] as const;

export function AppShell({ title, eyebrow, action, children }: {
  title: string; eyebrow?: string; action?: ReactNode; children: ReactNode;
}) {
  const pathname = usePathname();
  const { t: translate } = useI18n();
  const loop = [...TICKER, ...TICKER, ...TICKER, ...TICKER];

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FITDAY</Link>
        <nav className="nav">
          <span className="nav-title">{translate("nav.workspace")}</span>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined} className={`nav-link ${pathname === href ? "active" : ""}`}>
              <Icon size={15} /> {translate(label)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div>{translate("nav.tagline1")}</div>
          <div>{translate("nav.tagline2")}</div>
          <div className="foot-tag">{translate("nav.tagline3")}</div>
        </div>
      </aside>

      <div className="content">
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {loop.map((t, i) => (
              <span className="ticker-item" key={i}>{t === "FITDAY" ? t : translate(t)} <span className="ticker-star">★</span></span>
            ))}
          </div>
        </div>

        <main className="main">
          <header className="page-head">
            <div>
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              <h1 className="page-title">{title}</h1>
            </div>
            <div className="page-head-tools">
              {action}
              <LanguageSwitcher />
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

export function SectionHeader({ title, note, action }: { title: string; note?: string; action?: ReactNode }) {
  return (
    <div className="section-head">
      <div>
        <h3 className="section-title">{title}</h3>
        {note && <div className="section-note">{note}</div>}
      </div>
      {action}
    </div>
  );
}
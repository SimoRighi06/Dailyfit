"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, LayoutGrid, Shirt, UserRound, LogIn, LogOut } from "lucide-react";
import type { AuthChangeEvent, AuthError, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useI18n, LanguageSwitcher } from "@/lib/i18n";

const TICKER = ["FITDAY", "WEAR YOUR STORY", "STREET READY", "NO OUTFIT NO PARTY", "DROP YOUR LOOK", "STAY VOLT"];

export function AppShell({ title, eyebrow, action, children, variant = "default" }: {
  title: string; eyebrow?: string; action?: ReactNode; children: ReactNode; variant?: "default" | "home";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();

  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const loop = [...TICKER, ...TICKER, ...TICKER, ...TICKER];

  useEffect(() => {
    let alive = true;
    let supabase: SupabaseClient;
    try { supabase = createClient() as SupabaseClient; }
    catch (e) {
      console.error("💥 [shell] client supabase:", e);
      queueMicrotask(() => { if (alive) setAuthReady(true); });
      return () => { alive = false; };
    }
    void supabase.auth.getUser().then((res: { data: { user: User | null }; error: AuthError | null }) => {
      if (!alive) return;
      if (res.error) console.warn("⚠️ [shell] getUser:", res.error.message);
      setUser(res.data.user ?? null);
      setAuthReady(true);
      console.log("🔐 [shell] sessione:", res.data.user?.email ?? "nessuna");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      console.log("🔐 [shell] auth change:", event, session?.user?.email ?? "nessuna");
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  async function logout() {
    setBusy(true);
    try {
      const supabase = createClient() as SupabaseClient;
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log("🔐 [shell] logout ok");
      router.push("/login");
      router.refresh();
    } catch (e) { console.error("💥 [shell] logout:", e); }
    finally { setBusy(false); }
  }

  const displayName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split("@")[0] || "Utente";
  const initial = displayName.charAt(0).toUpperCase();

  const authButton = !authReady
    ? <span className="btn btn-quiet" style={{ opacity: .5 }}>…</span>
    : user
      ? <button className="btn btn-quiet" onClick={logout} disabled={busy}><LogOut size={13} /> {busy ? "…" : "ESCI"}</button>
      : <Link className="btn btn-primary" href="/login"><LogIn size={13} /> SIGN IN</Link>;

  const NAV = [
    { href: "/", label: t("nav.today"), icon: LayoutGrid },
    { href: "/wardrobe", label: t("nav.wardrobe"), icon: Shirt },
    { href: "/outfits", label: t("nav.outfits"), icon: CalendarDays },
    { href: "/avatar", label: t("nav.avatar"), icon: UserRound },
  ];

  return (
    <div className={`shell ${variant === "home" ? "shell-home" : ""}`}>
      <aside className="sidebar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FITDAY</Link>
        <nav className="nav">
          <span className="nav-title">{t("nav.workspace")}</span>
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-link ${pathname === href ? "active" : ""}`}>
              <Icon size={15} /> {label}
            </Link>
          ))}
        </nav>

        {user && (
          <div className="sidebar-auth">
            <div className="auth-user">
              <span className="auth-avatar">{initial}</span>
              <div className="auth-meta">
                <strong>{displayName}</strong>
                <span>{user.email}</span>
              </div>
            </div>
          </div>
        )}

        <div className="sidebar-foot">
          <div>{t("nav.tagline1")}</div>
          <div>{t("nav.tagline2")}</div>
          <div className="foot-tag">{t("nav.tagline3")}</div>
        </div>
      </aside>

      <div className="content">
        <div className="ticker" aria-hidden="true">
          <div className="ticker-track">
            {loop.map((t, i) => (
              <span className="ticker-item" key={i}>{t} <span className="ticker-star">★</span></span>
            ))}
          </div>
        </div>

        <main className={`main ${variant === "home" ? "main-home" : ""}`}>
          <header className={`page-head ${variant === "home" ? "page-head-home" : ""}`}>
           
            <div className="head-actions">
              <LanguageSwitcher />
              {action}
              {authButton}  
            </div>
             <div>
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              <h1 className="page-title">{title}</h1>
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
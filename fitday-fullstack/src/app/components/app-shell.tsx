"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CalendarDays, LayoutGrid, Shirt, UserRound, LogIn, LogOut } from "lucide-react";
/* import type { User } from "@supabase/supabase-js"; */
import type { AuthChangeEvent, AuthError, Session, SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "Today", icon: LayoutGrid },
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: CalendarDays },
  { href: "/avatar", label: "My avatar", icon: UserRound },
];

const TICKER = ["FITDAY", "WEAR YOUR STORY", "STREET READY", "NO OUTFIT NO PARTY", "DROP YOUR LOOK", "STAY VOLT"];

export function AppShell({ title, eyebrow, action, children }: {
  title: string; eyebrow?: string; action?: ReactNode; children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const loop = [...TICKER, ...TICKER, ...TICKER, ...TICKER];

    useEffect(() => {
    let supabase: SupabaseClient;
    try { supabase = createClient() as SupabaseClient; }
    catch (e) { console.error("💥 [shell] client supabase:", e); setAuthReady(true); return; }
    let alive = true;
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
      const { error } = await createClient().auth.signOut();
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
      ? <button className="btn btn-quiet" onClick={logout} disabled={busy}><LogOut size={13} /> {busy ? "ESCO…" : "ESCI"}</button>
      : <Link className="btn btn-primary" href="/login"><LogIn size={13} /> SIGN IN</Link>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/" className="brand"><span className="brand-mark">F</span> FITDAY</Link>
        <nav className="nav">
          <span className="nav-title">Workspace</span>
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
          <div>Your wardrobe,</div>
          <div>reimagined.</div>
          <div className="foot-tag">A little more style, every day.</div>
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

        <main className="main">
          <header className="page-head">
            <div>
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              <h1 className="page-title">{title}</h1>
            </div>
            <div className="head-actions">
              {action}
              {authButton}
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
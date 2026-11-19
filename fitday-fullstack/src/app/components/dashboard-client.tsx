"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Plus, RefreshCw, Sparkles, Shirt, WashingMachine, Footprints } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { useI18n } from "@/lib/i18n";
import { categoryInitials, colorHex, garmentImageUrl, safeJson } from "@/lib/garment-utils";
import type { Garment, Outfit } from "@/types/wardrobe";

function localDate() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function getGreetingKey(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

function SkeletonStat() {
  return (
    <div className="card stat-card" style={{ opacity: .5 }}>
      <div className="muted small">—</div>
      <div className="stat-num" style={{ background: "linear-gradient(90deg, var(--paper-2) 0%, var(--paper) 50%, var(--paper-2) 100%)", backgroundSize: "200% 100%", animation: "shimmer 1.4s infinite" }}>00</div>
      <div className="muted small">—</div>
    </div>
  );
}

export function DashboardClient() {
  const { t, language } = useI18n();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  // Saluto dinamico basato sull'ora
  const hour = new Date().getHours();
  const greetingKey = getGreetingKey(hour);
  const greeting = useMemo(() => {
    const greetings: Record<string, string> = {
      it: { morning: "Buongiorno", afternoon: "Buon pomeriggio", evening: "Buonasera", night: "Buonanotte" }[greetingKey] ?? "Buongiorno",
      en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" }[greetingKey] ?? "Good morning",
      de: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend", night: "Gute Nacht" }[greetingKey] ?? "Guten Morgen",
    };
    return greetings[language] ?? "Good morning";
  }, [greetingKey, language]);

  // Giorno della settimana tradotto
  const weekday = useMemo(() => {
    const locale = language === "it" ? "it-IT" : language === "de" ? "de-DE" : "en-GB";
    return new Date().toLocaleDateString(locale, { weekday: "long" });
  }, [language]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, oRes] = await Promise.all([
        fetch("/api/garments", { cache: "no-store" }),
        fetch(`/api/outfits/today?date=${localDate()}`, { cache: "no-store" }),
      ]);
      setSignedIn(gRes.status !== 401);
      const gp = await safeJson(gRes);
      const op = await safeJson(oRes);
      console.log("📥 [dashboard] garments:", gRes.status, gp?.garments?.length, "| outfit:", oRes.status, op?.outfit?.title ?? op?.error);
      if (gRes.ok) setGarments(gp?.garments ?? []);
      else if (gRes.status !== 503) setMessage(t("dashboard.loginMessage"));
      if (oRes.ok) setOutfit(op?.outfit ?? null);
      else if (oRes.status === 503) setMessage(t("dashboard.supabaseMessage"));
    } catch {
      setMessage(t("dashboard.backendError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  async function generate() {
    setGenerating(true);
    setMessage("");
    try {
      const res = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: localDate() }),
      });
      const payload = await safeJson(res);
      console.log("📥 [dashboard] generate →", res.status, payload?.outfit?.title ?? payload?.error);
      if (!res.ok) throw new Error(payload?.error ?? t("dashboard.generateError"));
      setOutfit(payload.outfit);
      if (payload.missing?.length) {
        const items = payload.missing.map((m: string) => t(`missing.${m}` as any) ?? m).join(", ");
        setMessage(t("dashboard.missing", { items }));
      } else {
        setMessage(t("dashboard.updated"));
      }
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : t("dashboard.unexpectedError"));
    } finally {
      setGenerating(false);
    }
  }

  const cleanCount = garments.filter((g) => g.laundry_status === "clean").length;
  const dirtyCount = garments.length - cleanCount;
  const items = outfit?.items ?? [];
  const top = items.find((g) => ["tshirt", "hoodie", "crewneck"].includes(g.category));
  const bottom = items.find((g) => ["jeans", "trousers"].includes(g.category));
  const shoes = items.find((g) => g.category === "shoes");

  return (
    <AppShell
      title={`${greeting}.`}
      eyebrow={`${weekday.charAt(0).toUpperCase() + weekday.slice(1)} · ${t("dashboard.eyebrow")}`}
      action={<Link className="btn btn-primary" href="/wardrobe"><Plus size={14} /> {t("dashboard.addGarment")}</Link>}
    >
      <div className="grid-main">
        <div className="stack">
          <section className="card hero-today">
            <div className="hero-copy">
              <span className="pill pill-green">
                <Sparkles size={11} style={{ marginRight: 5 }} /> {t("dashboard.lookToday")}
              </span>
              <h2>
                {t("dashboard.heroTitleFirst")}
                <br />
                {t("dashboard.heroTitleSecond")}
              </h2>
              <p>{outfit?.rationale ?? t("dashboard.description")}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 23 }}>
                <button className="btn btn-primary" onClick={generate} disabled={generating}>
                  {generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {generating ? t("dashboard.generating") : t("dashboard.generate")}
                </button>
                <Link className="btn" href="/outfits">
                  {t("dashboard.details")} <ArrowUpRight size={13} />
                </Link>
              </div>
              {message && <p className="small muted" style={{ marginTop: 13 }}>{message}</p>}
            </div>
            <div className="hero-stage">
              <AvatarViewer
                height={390}
                topColor={colorHex(top?.color_hex ?? top?.color)}
                bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)}
                shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)}
                topPhoto={garmentImageUrl(top)}
                bottomPhoto={garmentImageUrl(bottom)}
                shoePhoto={garmentImageUrl(shoes)}
              />
            </div>
          </section>

          <section className="stat-row">
            {loading ? (
              <>
                <SkeletonStat />
                <SkeletonStat />
                <SkeletonStat />
              </>
            ) : (
              <>
                <div className="card stat-card">
                  <div className="muted small">{t("dashboard.total")}</div>
                  <div className="stat-num">{garments.length.toString().padStart(2, "0")}</div>
                  <div className="muted small">{t("dashboard.inWardrobe")}</div>
                </div>
                <div className="card stat-card">
                  <div className="muted small">{t("dashboard.ready")}</div>
                  <div className="stat-num">{cleanCount.toString().padStart(2, "0")}</div>
                  <div className="muted small">{t("dashboard.clean")}</div>
                </div>
                <div className="card stat-card">
                  <div className="muted small">{t("dashboard.laundry")}</div>
                  <div className="stat-num">{dirtyCount.toString().padStart(2, "0")}</div>
                  <div className="muted small">{t("dashboard.unavailable")}</div>
                </div>
              </>
            )}
          </section>

          <section className="card card-pad">
            <SectionHeader
              title={t("dashboard.recent")}
              note={t("dashboard.recentNote")}
              action={<Link className="btn btn-quiet" href="/wardrobe">{t("dashboard.seeAll")} <ArrowUpRight size={13} /></Link>}
            />
            {loading ? (
              <div className="loading">{t("dashboard.loadingWardrobe")}</div>
            ) : garments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Shirt size={20} /></div>
                <div className="card-title">{t("dashboard.emptyTitle")}</div>
                <p className="small">{t("dashboard.emptyText")}</p>
                <Link className="btn btn-primary" href="/wardrobe" style={{ marginTop: 10 }}>
                  {t("dashboard.addFirst")}
                </Link>
              </div>
            ) : (
              <div className="garment-grid">
                {garments.slice(0, 3).map((g) => {
                  const url = garmentImageUrl(g);
                  return (
                    <Link className="garment-card clickable" key={g.id} href={`/wardrobe?g=${g.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="garment-art" style={{ background: `${colorHex(g.color_hex ?? g.color)}18` }}>
                        <span className="chip">{g.category}</span>
                        {url ? <img className="garment-photo" src={url} alt={g.name} loading="lazy" /> : <span className="garment-symbol">{categoryInitials(g.category)}</span>}
                      </div>
                      <div className="garment-info">
                        <div className="garment-name">{g.name}</div>
                        <div className="garment-meta">{g.brand || g.category} · {g.color}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <section className="card card-pad">
            <SectionHeader title={t("dashboard.routine")} note={t("dashboard.routineNote")} />
            <div className="outfit-list">
              <div className="outfit-item">
                <div className="outfit-swatch"><Sparkles size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="garment-name">{t("dashboard.freshLook")}</div>
                  <div className="garment-meta">{t("dashboard.fromClean")}</div>
                </div>
                <button aria-label="Generate outfit" className="btn btn-quiet" onClick={generate}>
                  <RefreshCw size={14} />
                </button>
              </div>
              <div className="outfit-item">
                <div className="outfit-swatch"><WashingMachine size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="garment-name">{t("dashboard.laundryCheck")}</div>
                  <div className="garment-meta">{t("dashboard.availability")}</div>
                </div>
                <Link className="btn btn-quiet" href="/wardrobe">
                  <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="outfit-item">
                <div className="outfit-swatch"><Footprints size={18} /></div>
                <div style={{ flex: 1 }}>
                  <div className="garment-name">{t("dashboard.completeWardrobe")}</div>
                  <div className="garment-meta">{t("dashboard.addMostWorn")}</div>
                </div>
                <Link className="btn btn-quiet" href="/wardrobe">
                  <Plus size={14} />
                </Link>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <SectionHeader title={t("dashboard.lab")} note={t("dashboard.labNote")} />
            <div className="notice">{t("dashboard.labDescription")}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 15, fontSize: 11 }}>
              <span className="muted">{t("dashboard.cleanAvailable")}</span>
              <strong>{cleanCount}</strong>
            </div>
            <div style={{ height: 8, background: "var(--paper-2)", border: "2px solid var(--ink)", marginTop: 8, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${garments.length ? (cleanCount / garments.length) * 100 : 0}%`, background: "var(--volt)" }} />
            </div>
          </section>

          {signedIn === false && (
            <section className="card card-pad">
              <div className="card-title">{t("dashboard.saveAcrossDevices")}</div>
              <p className="muted small" style={{ lineHeight: 1.7 }}>{t("dashboard.syncPrompt")}</p>
              <Link className="btn btn-primary" href="/login">
                {t("dashboard.signIn")} <ArrowUpRight size={13} />
              </Link>
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
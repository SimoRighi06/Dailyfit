"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, CalendarDays, Shirt, CheckCircle2, WashingMachine } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { categoryTranslationKey, fitTranslationKey, localizeApiMessage, localizeMissingItems, useI18n } from "@/lib/i18n";
import { categoryInitials, colorHex, garmentImageUrl, LAUNDRY_META, safeJson } from "@/lib/garment-utils";
import type { Garment, Outfit } from "@/types/wardrobe";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function OutfitsClient() {
  const { language, t } = useI18n();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/outfits/today?date=${today()}`, { cache: "no-store" });
      const payload = await safeJson(res);
      console.log("📥 [outfits] today →", res.status, payload?.outfit?.title ?? payload?.error);
      if (!res.ok) throw new Error(payload?.error ? localizeApiMessage(payload.error, t) : t("outfits.loadError"));
      setOutfit(payload?.outfit ?? null);
    } catch (e) { setMessage(e instanceof Error ? e.message : t("outfits.loadError")); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  async function generate() {
    setGenerating(true); setMessage("");
    try {
      const res = await fetch("/api/outfits/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today(), language }) });
      const payload = await safeJson(res);
      console.log("📥 [outfits] generate →", res.status, payload?.outfit?.title ?? payload?.error);
      if (!res.ok) throw new Error(payload?.error ? localizeApiMessage(payload.error, t) : t("outfits.generateError"));
      setOutfit(payload.outfit);
      setMessage(payload.missing?.length ? t("outfits.missing", { items: localizeMissingItems(payload.missing, t) }) : t("outfits.ready"));
    } catch (e) { setMessage(e instanceof Error ? e.message : t("outfits.generateError")); }
    finally { setGenerating(false); }
  }

  async function toggleLaundry(g: Garment) {
    const next = g.laundry_status === "clean" ? "dirty" : "clean";
    console.log("🧺 [outfits] toggle", g.id, "→", next);
    const res = await fetch(`/api/garments/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ laundry_status: next }) });
    const p = await safeJson(res);
    if (!res.ok || !p?.garment) { setMessage(p?.error ?? `Errore stato (${res.status})`); return; }
    setOutfit(prev => prev ? { ...prev, items: (prev.items ?? []).map(x => x.id === g.id ? p.garment : x) } : prev);
    setMessage(language === "it" ? `${g.name}: ${LAUNDRY_META[next as "clean" | "dirty"].it}` : `${g.name}: ${LAUNDRY_META[next as "clean" | "dirty"].en}`);
  }

  const items = (outfit?.items ?? []) as Garment[];
  const top = items.find(g => ["tshirt", "hoodie", "crewneck"].includes(g.category));
  const bottom = items.find(g => ["jeans", "trousers"].includes(g.category));
  const shoes = items.find(g => g.category === "shoes");
  const dateLocale = language === "it" ? "it-IT" : language === "de" ? "de-DE" : "en-GB";

  return (
    <AppShell title={t("outfits.title")} eyebrow={t("outfits.eyebrow")}
      action={<button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />} {generating ? t("outfits.generating") : t("outfits.generate")}</button>}>
      <div className="stack">
        <section className="card hero-today">
          <div className="hero-copy">
            <span className="pill pill-green"><CalendarDays size={11} style={{ marginRight: 5 }} /> {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</span>
            <h2>{t("outfits.todayFirst")}<br />{t("outfits.todaySecond")}</h2>
            <p>{language === "it" && outfit?.rationale ? outfit.rationale : t("outfits.description")}</p>
            <button className="btn btn-primary" style={{ marginTop: 17 }} onClick={generate} disabled={generating}>{generating ? t("outfits.generating") : t("outfits.regenerate")} <RefreshCw size={13} /></button>
            {message && <p className="small muted" style={{ marginTop: 12 }}>{message}</p>}
          </div>
          <div className="hero-stage">
            <AvatarViewer height={380}
              topColor={colorHex(top?.color_hex ?? top?.color)} bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)} shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)}
              topPhoto={garmentImageUrl(top)} bottomPhoto={garmentImageUrl(bottom)} shoePhoto={garmentImageUrl(shoes)} />
          </div>
        </section>
        <section className="card card-pad">
          <SectionHeader title={t("outfits.pieces")} note={t("outfits.piecesNote")} />
          {loading ? <div className="loading">{t("outfits.loading")}</div> : items.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><Shirt size={20} /></div><div className="card-title">{t("outfits.emptyTitle")}</div><p className="small">{t("outfits.emptyText")}</p><Link className="btn btn-primary" href="/wardrobe" style={{ marginTop: 12 }}>{t("outfits.openWardrobe")}</Link></div>
          ) : (
            <div className="outfit-list">
              {items.map(g => {
                const url = garmentImageUrl(g); const meta = LAUNDRY_META[g.laundry_status];
                return (
                  <div className="outfit-item" key={g.id}>
                    <div className="outfit-swatch" style={{ background: `${colorHex(g.color_hex ?? g.color)}22`, overflow: "hidden" }}>
                      {url ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>{categoryInitials(g.category)}</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="garment-name">{g.name}</div>
                      <div className="garment-meta">{g.brand || t(categoryTranslationKey(g.category))} · {g.color} · {t(fitTranslationKey(g.fit))}</div>
                    </div>
                    <button className={`btn ${g.laundry_status === "clean" ? "btn-primary" : ""}`} style={{ padding: "8px 12px", fontSize: 10 }} onClick={() => toggleLaundry(g)} title={language === "it" ? "Cambia stato lavanderia" : "Toggle laundry"}>
                      {g.laundry_status === "clean" ? <><CheckCircle2 size={12} /> {t("status.clean")}</> : <><WashingMachine size={12} /> {language === "it" ? meta.it : meta.en}</>}
                    </button>
                    <Link className="btn btn-quiet" style={{ padding: "8px 12px", fontSize: 10 }} href={`/wardrobe?g=${g.id}`}>{language === "it" ? "DETTAGLIO" : "DETAIL"}</Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, CalendarDays, Shirt } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { categoryTranslationKey, fitTranslationKey, localizeApiMessage, localizeMissingItems, useI18n } from "@/lib/i18n";
import type { Garment, Outfit } from "@/types/wardrobe";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
function colorHex(color?: string | null) {
  if (!color) return "#71806e";
  if (color.startsWith("#")) return color;
  const map: Record<string,string> = { black:"#282a29", white:"#eeeae1", grey:"#858984", gray:"#858984", navy:"#34465c", blue:"#587895", beige:"#c5b49a", brown:"#75533f", green:"#667b64" };
  return map[color.toLowerCase()] ?? "#71806e";
}

export function OutfitsClient() {
  const { language, t } = useI18n();
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`/api/outfits/today?date=${today()}`, { cache: "no-store" }); const payload = await res.json(); if (!res.ok) throw new Error(payload.error ? localizeApiMessage(payload.error, t) : t("outfits.loadError")); setOutfit(payload.outfit); }
    catch (e) { setMessage(e instanceof Error ? e.message : t("outfits.loadError")); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);
  async function generate() {
    setGenerating(true); setMessage("");
    try { const res = await fetch("/api/outfits/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today(), language }) }); const payload = await res.json(); if (!res.ok) throw new Error(payload.error ? localizeApiMessage(payload.error, t) : t("outfits.generateError")); setOutfit(payload.outfit); setMessage(payload.missing?.length ? t("outfits.missing", { items: localizeMissingItems(payload.missing, t) }) : t("outfits.ready")); }
    catch (e) { setMessage(e instanceof Error ? e.message : t("outfits.generateError")); }
    finally { setGenerating(false); }
  }
  const items = (outfit?.items ?? []) as Garment[];
  const top = items.find((g) => ["tshirt","hoodie","crewneck"].includes(g.category));
  const bottom = items.find((g) => ["jeans","trousers"].includes(g.category));
  const shoes = items.find((g) => g.category === "shoes");
  const icon: Record<string,string> = { tshirt:"👕", hoodie:"🧥", crewneck:"🧶", jeans:"👖", trousers:"👖", socks:"🧦", shoes:"👟", other:"✳️" };
  const dateLocale = language === "it" ? "it-IT" : language === "de" ? "de-DE" : "en-GB";
  return <AppShell title={t("outfits.title")} eyebrow={t("outfits.eyebrow")} action={<button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? <RefreshCw size={14}/> : <Sparkles size={14}/>} {generating ? t("outfits.generating") : t("outfits.generate")}</button>}>
    <div className="page-section">
      <section className="card" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(260px,.9fr)", background: "#f1f3ea" }}>
        <div className="card-pad" style={{ alignSelf: "center" }}><span className="pill pill-green"><CalendarDays size={11} style={{ marginRight: 5 }}/> {new Date().toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</span><h2 style={{ fontSize: 35, lineHeight: 1, letterSpacing: "-.06em", margin: "18px 0 10px" }}>{t("outfits.todayFirst")}<br/>{t("outfits.todaySecond")}</h2><p className="muted small" style={{ lineHeight: 1.7 }}>{language === "it" && outfit?.rationale ? outfit.rationale : t("outfits.description")}</p><button className="btn btn-primary" style={{ marginTop: 17 }} onClick={generate} disabled={generating}>{generating ? t("outfits.generating") : t("outfits.regenerate")} <RefreshCw size={13}/></button>{message && <p className="muted small" style={{ marginTop: 12 }}>{message}</p>}</div>
        <div style={{ minHeight: 340 }}><AvatarViewer topColor={colorHex(top?.color_hex ?? top?.color)} bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)} shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)} height={360}/></div>
      </section>
      <section className="card card-pad"><SectionHeader title={t("outfits.pieces")} note={t("outfits.piecesNote")}/>
        {loading ? <div className="loading">{t("outfits.loading")}</div> : items.length === 0 ? <div className="empty-state"><div className="empty-icon"><Shirt size={20}/></div><div className="card-title">{t("outfits.emptyTitle")}</div><p className="small">{t("outfits.emptyText")}</p><Link className="btn btn-primary" href="/wardrobe" style={{ marginTop: 12 }}>{t("outfits.openWardrobe")}</Link></div> : <div className="outfit-list">{items.map((g) => <div className="outfit-item" key={g.id}><div className="outfit-swatch" style={{ background: `${colorHex(g.color_hex ?? g.color)}22` }}>{icon[g.category] ?? "✳️"}</div><div style={{ flex: 1 }}><div className="garment-name">{g.name}</div><div className="garment-meta">{g.brand || t(categoryTranslationKey(g.category))} · {g.color} · {t(fitTranslationKey(g.fit))}</div></div><span className="pill pill-green">{t("status.clean")}</span></div>)}</div>}
      </section>
    </div>
  </AppShell>;
}

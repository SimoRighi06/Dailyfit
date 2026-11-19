"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, CalendarDays, Shirt, CheckCircle2, WashingMachine, Trash2, History, X } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { categoryTranslationKey, fitTranslationKey, localizeApiMessage, localizeMissingItems, useI18n } from "@/lib/i18n";
import { categoryInitials, colorHex, garmentImageUrl, LAUNDRY_META, safeJson } from "@/lib/garment-utils";
import type { Garment, Outfit } from "@/types/wardrobe";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function OutfitsClient() {
  const { language, t, setLanguage } = useI18n();
  const L = (it: string, en: string, de: string) => language === "it" ? it : language === "de" ? de : en;
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [hist, setHist] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [histLoading, setHistLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [selDate, setSelDate] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (msg: string, undo?: () => void) => { if (timer.current) clearTimeout(timer.current); setToast({ msg, undo }); timer.current = setTimeout(() => setToast(null), 6000); };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/outfits/today?date=${today()}`, { cache: "no-store" });
    const p = await safeJson(res);
    console.log("📥 [outfits] today →", res.status, p?.outfit?.title ?? p?.error);
    if (!res.ok) setMessage(p?.error ? localizeApiMessage(p.error, t) : t("outfits.loadError"));
    else setOutfit(p?.outfit ?? null);
    setLoading(false);
  }, [t]);

  const loadHist = useCallback(async () => {
    setHistLoading(true);
    const res = await fetch("/api/outfits", { cache: "no-store" });
    const p = await safeJson(res);
    console.log("📥 [outfits] storico →", res.status, p?.outfits?.length ?? p?.error);
    if (res.ok) setHist(p?.outfits ?? []);
    setHistLoading(false);
  }, []);

  useEffect(() => { void load(); void loadHist(); }, [load, loadHist]);

  async function generate() {
    setGenerating(true); setMessage("");
    const res = await fetch("/api/outfits/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today(), language }) });
    const p = await safeJson(res);
    console.log("📥 [outfits] generate →", res.status, p?.outfit?.title ?? p?.error);
    if (!res.ok) setMessage(p?.error ? localizeApiMessage(p.error, t) : t("outfits.generateError"));
    else { setOutfit(p.outfit); setMessage(p.missing?.length ? t("outfits.missing", { items: localizeMissingItems(p.missing, t) }) : t("outfits.ready")); void loadHist(); }
    setGenerating(false);
  }

  async function toggleLaundry(g: Garment) {
    const next = g.laundry_status === "clean" ? "dirty" : "clean";
    const res = await fetch(`/api/garments/${g.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ laundry_status: next }) });
    const p = await safeJson(res);
    if (!res.ok || !p?.garment) { setMessage(p?.error ?? `Errore stato (${res.status})`); return; }
    setOutfit(prev => prev ? { ...prev, items: (prev.items ?? []).map(x => x.id === g.id ? p.garment : x) } : prev);
    setHist(prev => prev.map(o => ({ ...o, items: (o.items ?? []).map(x => x.id === g.id ? p.garment : x) })));
    setMessage(`${g.name}: ${language === "it" ? LAUNDRY_META[next as "clean" | "dirty"].it : LAUNDRY_META[next as "clean" | "dirty"].en}`);
  }

  const byDate = useMemo(() => new Map(hist.map(o => [o.outfit_date, o])), [hist]);
  const selected = (selDate ? byDate.get(selDate) : null) ?? hist[0] ?? null;
  const now = new Date();
  const month = useMemo(() => {
    const y = now.getFullYear(), m = now.getMonth();
    const first = new Date(y, m, 1); const days = new Date(y, m + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells: (string | null)[] = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) cells.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    return cells;
  }, [now.getFullYear(), now.getMonth()]); // eslint-disable-line react-hooks/exhaustive-deps

  async function reuse(o: Outfit) {
    setBusy(true);
    const ids = (o.items ?? []).map(g => g.id);
    const res = await fetch("/api/outfits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today(), garment_ids: ids, title: o.title, rationale: o.rationale }) });
    const p = await safeJson(res);
    console.log("📥 [outfits] riuso →", res.status, p?.outfit?.title ?? p?.error);
    setBusy(false);
    if (!res.ok || !p?.outfit) { notify(p?.error ?? `Errore riuso (${res.status})`); return; }
    const dirty = (p.outfit.items ?? []).filter((g: Garment) => g.laundry_status !== "clean").length;
    setOutfit(p.outfit); setSelDate(today()); void loadHist();
    notify(dirty ? L(`LOOK RIUSATO · ${dirty} CAPI NON PRONTI`, `LOOK REUSED · ${dirty} PIECES NOT READY`, `LOOK ERNEUT · ${dirty} TEILE NICHT BEREIT`) : L("LOOK RIUSATO OGGI", "LOOK REUSED TODAY", "LOOK HEUTE ERNEUT"));
  }

  async function removeLook(o: Outfit) {
    setBusy(true);
    const res = await fetch(`/api/outfits/${o.id}`, { method: "DELETE" });
    const p = await safeJson(res);
    setBusy(false);
    if (!res.ok) { notify(p?.error ?? `Errore eliminazione (${res.status})`); return; }
    setHist(prev => prev.filter(x => x.id !== o.id));
    if (selDate === o.outfit_date) setSelDate(null);
    if (outfit?.id === o.id) setOutfit(null);
    const ids = (o.items ?? []).map(g => g.id);
    notify(L("LOOK ELIMINATO", "LOOK DELETED", "LOOK GELÖSCHT"), async () => {
      const r = await fetch("/api/outfits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: o.outfit_date, garment_ids: ids, title: o.title, rationale: o.rationale }) });
      const rp = await safeJson(r);
      if (r.ok && rp?.outfit) { void loadHist(); notify(L("LOOK RIPRISTINATO", "LOOK RESTORED", "LOOK WIEDERHERGESTELLT")); }
      else notify(rp?.error ?? "Errore ripristino");
    });
  }

  const items = (outfit?.items ?? []) as Garment[];
  const top = items.find(g => ["tshirt", "hoodie", "crewneck"].includes(g.category));
  const bottom = items.find(g => ["jeans", "trousers"].includes(g.category));
  const shoes = items.find(g => g.category === "shoes");
  const dateLocale = language === "it" ? "it-IT" : language === "de" ? "de-DE" : "en-GB";
  const fmt = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(dateLocale, { day: "2-digit", month: "short" }).toUpperCase();

  return (
    <AppShell title={t("outfits.title")} eyebrow={t("outfits.eyebrow")}
      action={<>
        <select className="input lang-select" value={language} onChange={e => setLanguage(e.target.value as typeof language)} aria-label="Language">
          <option value="it">IT · ITALIANO</option><option value="en">EN · ENGLISH</option><option value="de">DE · DEUTSCH</option>
        </select>
        <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />} {generating ? t("outfits.generating") : t("outfits.generate")}</button>
      </>}>
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
            <AvatarViewer height={380} topColor={colorHex(top?.color_hex ?? top?.color)} bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)} shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)} topPhoto={garmentImageUrl(top)} bottomPhoto={garmentImageUrl(bottom)} shoePhoto={garmentImageUrl(shoes)} />
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
                    <div style={{ flex: 1 }}><div className="garment-name">{g.name}</div><div className="garment-meta">{g.brand || t(categoryTranslationKey(g.category))} · {g.color} · {t(fitTranslationKey(g.fit))}</div></div>
                    <button className={`btn ${g.laundry_status === "clean" ? "btn-primary" : ""}`} style={{ padding: "8px 12px", fontSize: 10 }} onClick={() => toggleLaundry(g)}>
                      {g.laundry_status === "clean" ? <><CheckCircle2 size={12} /> {t("status.clean")}</> : <><WashingMachine size={12} /> {language === "it" ? meta.it : meta.en}</>}
                    </button>
                    <Link className="btn btn-quiet" style={{ padding: "8px 12px", fontSize: 10 }} href={`/wardrobe?g=${g.id}`}>{L("DETTAGLIO", "DETAIL", "DETAIL")}</Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <SectionHeader title={L("Diario dei look", "Look diary", "Look-Tagebuch")} note={L(`${hist.length} look salvati · clicca un giorno per rivederlo`, `${hist.length} saved looks · click a day to review`, `${hist.length} Looks · Tag anklicken zum Ansehen`)} />
          <div className="hist-grid">
            <div className="cal">
              <div className="cal-head">{[L("LUN", "MON", "MO"), L("MAR", "TUE", "DI"), L("MER", "WED", "MI"), L("GIO", "THU", "DO"), L("VEN", "FRI", "FR"), L("SAB", "SAT", "SA"), L("DOM", "SUN", "SO")].map(d => <span key={d}>{d}</span>)}</div>
              <div className="cal-grid">
                {month.map((d, i) => d === null ? <span key={`b${i}`} /> : (
                  <button key={d} disabled={!byDate.has(d)} onClick={() => setSelDate(d)}
                    className={`cal-day ${byDate.has(d) ? "has" : ""} ${selected?.outfit_date === d ? "sel" : ""} ${d === today() ? "today" : ""}`}>
                    {+d.slice(8)}
                  </button>
                ))}
              </div>
              <div className="cal-legend"><i className="dot volt" /> {L("look salvato", "saved look", "Look gespeichert")} <i className="dot ring" /> {L("oggi", "today", "heute")}</div>
            </div>
            <div className="hist-list">
              {histLoading ? <div className="loading">{L("Carico lo storico…", "Loading history…", "Lade Verlauf…")}</div> : hist.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><History size={20} /></div><div className="card-title">{L("Nessun look salvato", "No saved looks", "Keine Looks")}</div><p className="small">{L("Genera il primo look per iniziare il diario.", "Generate your first look to start the diary.", "Erstelle deinen ersten Look.")}</p></div>
              ) : hist.map(o => (
                <button key={o.id} className={`hist-card ${selected?.id === o.id ? "sel" : ""}`} onClick={() => setSelDate(o.outfit_date)}>
                  <span className="pill pill-green">{fmt(o.outfit_date)}</span>
                  <span className="hist-title">{o.title}</span>
                  <span className="hist-thumbs">
                    {(o.items ?? []).slice(0, 4).map(g => {
                      const u = garmentImageUrl(g);
                      return <i key={g.id} style={{ background: `${colorHex(g.color_hex ?? g.color)}33` }}>{u ? <img src={u} alt="" /> : categoryInitials(g.category)}</i>;
                    })}
                  </span>
                  <span className="garment-meta">{(o.items ?? []).length} {L("capi", "pieces", "Teile")}</span>
                </button>
              ))}
            </div>
          </div>

          {selected && (
            <div className="hist-detail">
              <div className="hist-detail-head">
                <div>
                  <div className="eyebrow">{new Date(selected.outfit_date + "T12:00:00").toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}</div>
                  <h3 className="section-title" style={{ fontSize: 26 }}>{selected.title}</h3>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn btn-primary" disabled={busy} onClick={() => reuse(selected)}><RefreshCw size={13} /> {L("RIUSA OGGI", "REUSE TODAY", "HEUTE TRAGEN")}</button>
                  <button className="btn btn-danger" disabled={busy} onClick={() => removeLook(selected)}><Trash2 size={13} /> {L("ELIMINA", "DELETE", "LÖSCHEN")}</button>
                </div>
              </div>
              {selected.rationale && <p className="small muted" style={{ marginTop: 8 }}>{selected.rationale}</p>}
              <div className="outfit-list" style={{ marginTop: 12 }}>
                {(selected.items ?? []).map(g => {
                  const u = garmentImageUrl(g);
                  return (
                    <div className="outfit-item" key={g.id}>
                      <div className="outfit-swatch" style={{ background: `${colorHex(g.color_hex ?? g.color)}22`, overflow: "hidden" }}>{u ? <img src={u} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>{categoryInitials(g.category)}</span>}</div>
                      <div style={{ flex: 1 }}><div className="garment-name">{g.name}</div><div className="garment-meta">{g.brand || g.category} · {g.color}</div></div>
                      <span className={`pill ${LAUNDRY_META[g.laundry_status].pill}`}>{language === "it" ? LAUNDRY_META[g.laundry_status].it : LAUNDRY_META[g.laundry_status].en}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {toast && (
        <div className="toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo && <button className="btn btn-primary" onClick={() => { const u = toast.undo; setToast(null); if (timer.current) clearTimeout(timer.current); u?.(); }}>UNDO</button>}
          <button className="toast-x" onClick={() => setToast(null)} aria-label="Chiudi"><X size={13} /></button>
        </div>
      )}
    </AppShell>
  );
}
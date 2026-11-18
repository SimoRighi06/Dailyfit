// src/app/wardrobe/page.tsx
"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Plus, Shirt } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { categoryTranslationKey, localizeApiMessage, statusTranslationKey, useI18n } from "@/lib/i18n";
import { GARMENT_CATEGORIES, type Garment, type GarmentCategory } from "@/types/wardrobe";

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("⚠️ Risposta NON-JSON dal server → status:", res.status, "| contenuto:", text.slice(0, 400));
    return null;
  }
}

export default function WardrobePage() {
  const { t } = useI18n();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState<GarmentCategory>("tshirt");
  const [color, setColor] = useState("");
  const [colorHex, setColorHex] = useState("#68766a");
  const [brand, setBrand] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/garments", { cache: "no-store" });
      const payload = await safeJson(res);
      console.log("📥 [wardrobe] GET risposta → status:", res.status, "| payload:", payload);

      if (res.ok && payload?.garments) {
        setGarments(payload.garments);
        setMessage("");
        setIsError(false);
      } else {
        setMessage(payload?.error ? localizeApiMessage(payload.error, t) : t("wardrobe.loadErrorStatus", { status: res.status }));
        setIsError(true);
      }
    } catch (e) {
      console.error("💥 [wardrobe] errore fetch GET:", e);
      setMessage(t("dashboard.backendError"));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAdding(true);
    setMessage("");
    setIsError(false);

    const body = { name, category, color, color_hex: colorHex, brand: brand || null };
    try {
      const res = await fetch("/api/garments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await safeJson(res);
      console.log("📥 [wardrobe] POST risposta → status:", res.status, "| payload:", payload);

      if (res.ok && payload?.garment) {
        setMessage(t("wardrobe.added"));
        setIsError(false);
        setName("");
        setColor("");
        setBrand("");
        await load();
      } else {
        const msg = payload?.error ? localizeApiMessage(payload.error, t) : t("wardrobe.unknownError", { status: res.status });
        setMessage(`❌ ${msg}`);
        setIsError(true);
      }
    } catch (e) {
      console.error("💥 [wardrobe] errore fetch POST:", e);
      setMessage(t("dashboard.backendError"));
      setIsError(true);
    } finally {
      setAdding(false);
    }
  }

  return (
    <AppShell title={t("wardrobe.title")} eyebrow={t("wardrobe.eyebrow")} action={null}>
      <div className="grid-main">
        <div className="stack">
          <section className="card card-pad">
            <SectionHeader title={t("wardrobe.addNew")} note={t("wardrobe.addNote")} />
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 13, marginTop: 14 }}>
              <div className="field">
                <label htmlFor="g-name">{t("wardrobe.garmentName")}</label>
                <input className="input" id="g-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("wardrobe.exampleTee")} required />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13 }}>
                <div className="field">
                  <label htmlFor="g-category">{t("wardrobe.category")}</label>
                  <select className="input" id="g-category" value={category} onChange={(e) => setCategory(e.target.value as GarmentCategory)}>
                    {GARMENT_CATEGORIES.map((c) => <option key={c} value={c}>{t(categoryTranslationKey(c))}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="g-brand">{t("wardrobe.brandOptional")}</label>
                  <input className="input" id="g-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder={t("wardrobe.brandExample")} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 13 }}>
                <div className="field">
                  <label htmlFor="g-color">{t("common.color")}</label>
                  <input className="input" id="g-color" value={color} onChange={(e) => setColor(e.target.value)} placeholder={t("wardrobe.colorExample")} required />
                </div>
                <div className="field">
                  <label htmlFor="g-hex">{t("wardrobe.colorHex")}</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} style={{ width: 42, height: 42, padding: 0, border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer" }} />
                    <input className="input" id="g-hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} />
                  </div>
                </div>
              </div>
              {message && <div className={`notice ${isError ? "error" : ""}`}>{message}</div>}
              <button className="btn btn-primary" type="submit" disabled={adding} style={{ justifySelf: "start" }}>
                {adding ? t("wardrobe.adding") : <><Plus size={15} /> {t("wardrobe.add")}</>}
              </button>
            </form>
          </section>

          <section className="card card-pad">
            <SectionHeader title={t("wardrobe.pieces")} note={t("wardrobe.count", { count: garments.length })} />
            {loading ? (
              <div className="loading">{t("dashboard.loadingWardrobe")}</div>
            ) : garments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Shirt size={22} /></div>
                <div className="card-title">{t("wardrobe.emptyTitle")}</div>
                <p className="small">{t("wardrobe.emptyText")}</p>
              </div>
            ) : (
              <div className="garment-grid">
                {garments.map((g) => (
                  <div className="garment-card" key={g.id}>
                    <div className="garment-art" style={{ background: `${g.color_hex ?? "#e5e7eb"}22` }}>
                      <span className="garment-symbol">
                        {g.category === "shoes" ? "👟" : g.category === "socks" ? "🧦" : ["jeans", "trousers"].includes(g.category) ? "👖" : "👕"}
                      </span>
                    </div>
                    <div className="garment-info">
                      <div className="garment-name">{g.name}</div>
                      <div className="garment-meta">{g.brand || t(categoryTranslationKey(g.category))} · {g.color}</div>
                      <div className="garment-meta" style={{ marginTop: 4 }}>
                        {t(statusTranslationKey(g.laundry_status))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
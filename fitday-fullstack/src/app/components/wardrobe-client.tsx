"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Search, Shirt, Trash2, Upload, X } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import { categoryTranslationKey, fitTranslationKey, localizeApiMessage, statusTranslationKey, useI18n } from "@/lib/i18n";
import type { Garment, GarmentCategory, LaundryStatus } from "@/types/wardrobe";

const categories: (GarmentCategory | "all")[] = [
  "all", "tshirt", "hoodie", "crewneck", "jeans", "trousers", "socks", "shoes", "other",
];
const statusClass: Record<LaundryStatus, string> = { clean: "pill-green", dirty: "pill-orange", washing: "pill-blue", drying: "" };
const categoryIcon: Record<string, string> = { tshirt: "👕", hoodie: "🧥", crewneck: "🧶", jeans: "👖", trousers: "👖", socks: "🧦", shoes: "👟", other: "✳️" };

export function WardrobeClient() {
  const { t } = useI18n();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [filter, setFilter] = useState<GarmentCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [signedOut, setSignedOut] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/garments", { cache: "no-store" });
      const payload = await response.json();
      if (response.status === 401) { setSignedOut(true); setGarments([]); return; }
      if (!response.ok) throw new Error(payload.error ? localizeApiMessage(payload.error, t) : t("wardrobe.loadError"));
      setSignedOut(false); setGarments(payload.garments ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : t("wardrobe.unexpectedError")); }
    finally { setLoading(false); }
  }, [t]);
  useEffect(() => { void load(); }, [load]);

  async function addGarment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    let imagePath: string | null = null;
    const file = form.get("image");
    try {
      if (file instanceof File && file.size > 0) {
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) throw new Error(t("wardrobe.signInPhoto"));
        if (!file.type.startsWith("image/")) throw new Error(t("wardrobe.imageOnly"));
        if (file.size > 10 * 1024 * 1024) throw new Error(t("wardrobe.imageSize"));
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        imagePath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("wardrobe").upload(imagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
      }
      const payload = {
        name: String(form.get("name") ?? ""), category: String(form.get("category")), brand: String(form.get("brand") ?? "").trim() || null,
        color: String(form.get("color") ?? ""), color_hex: String(form.get("color_hex") ?? "") || null,
        fit: String(form.get("fit")), laundry_status: String(form.get("laundry_status")), image_path: imagePath,
        notes: String(form.get("notes") ?? "").trim() || null,
      };
      const response = await fetch("/api/garments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ? localizeApiMessage(result.error, t) : t("wardrobe.saveError"));
      setShowForm(false); formElement.reset(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : t("wardrobe.unexpectedError")); }
    finally { setSaving(false); }
  }

  async function changeStatus(item: Garment, status: LaundryStatus) {
    setError("");
    const response = await fetch(`/api/garments/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ laundry_status: status }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error ? localizeApiMessage(payload.error, t) : t("wardrobe.updateError")); return; }
    setGarments((current) => current.map((g) => g.id === item.id ? payload.garment : g));
  }

  async function remove(item: Garment) {
    if (!window.confirm(t("wardrobe.confirmDelete", { name: item.name }))) return;
    const response = await fetch(`/api/garments/${item.id}`, { method: "DELETE" });
    if (!response.ok) { const payload = await response.json(); setError(payload.error ? localizeApiMessage(payload.error, t) : t("wardrobe.deleteError")); return; }
    setGarments((current) => current.filter((g) => g.id !== item.id));
  }

  const visible = garments.filter((g) => (filter === "all" || g.category === filter) && `${g.name} ${g.brand ?? ""} ${g.color}`.toLowerCase().includes(query.toLowerCase()));
  return <AppShell title={t("wardrobe.title")} eyebrow={t("wardrobe.eyebrow")} action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14}/> {t("wardrobe.add")}</button>}>
    <div className="page-section">
      {error && <div className="notice error">{error}</div>}
      {signedOut && <div className="card card-pad"><div className="card-title">{t("wardrobe.signInTitle")}</div><p className="muted small">{t("wardrobe.privateMessage")}</p><Link href="/login" className="btn btn-primary" style={{ marginTop: 12 }}>{t("login.signIn")}</Link></div>}
      <section className="stat-row">
        <div className="card stat-card"><div className="muted small">{t("wardrobe.allPieces")}</div><div className="stat-num">{garments.length}</div></div>
        <div className="card stat-card"><div className="muted small">{t("wardrobe.ready")}</div><div className="stat-num">{garments.filter((g) => g.laundry_status === "clean").length}</div></div>
        <div className="card stat-card"><div className="muted small">{t("wardrobe.laundry")}</div><div className="stat-num">{garments.filter((g) => g.laundry_status !== "clean").length}</div></div>
      </section>
      <section className="card card-pad">
        <SectionHeader title={t("wardrobe.pieces")} note={t("wardrobe.filterNote")} action={<div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 11, top: 11, color: "#9a9e94" }}/><input className="input" style={{ paddingLeft: 32, width: 180 }} placeholder={t("wardrobe.search")} value={query} onChange={(e) => setQuery(e.target.value)}/></div>}/>
        <div className="filter-row" style={{ marginBottom: 20 }}>{categories.map((item) => <button key={item} className={`filter-chip ${filter === item ? "active" : ""}`} onClick={() => setFilter(item)}>{t(categoryTranslationKey(item))}</button>)}</div>
        {loading ? <div className="loading">{t("wardrobe.loading")}</div> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon"><Shirt size={20}/></div><div className="card-title">{t("wardrobe.noResults")}</div><p className="small">{t("wardrobe.noResultsText")}</p><button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setShowForm(true)}><Plus size={13}/> {t("wardrobe.add")}</button></div> : <div className="garment-grid">{visible.map((g) => <article className="garment-card" key={g.id}>
          <div className="garment-art" style={{ background: `${g.color_hex ?? "#a8ad9f"}20` }}>
            {g.image_url ? <img src={g.image_url} alt={g.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <span className="garment-symbol">{categoryIcon[g.category] ?? "✳️"}</span>}
            <span className={`pill ${statusClass[g.laundry_status]}`} style={{ position: "absolute", left: 8, top: 8 }}>{t(statusTranslationKey(g.laundry_status))}</span>
            <button className="btn btn-quiet" style={{ position: "absolute", right: 7, top: 7, padding: 6 }} aria-label={t("wardrobe.delete")} onClick={() => remove(g)}><Trash2 size={12}/></button>
          </div>
          <div className="garment-info">
            <div className="garment-name">{g.name}</div>
            <div className="garment-meta">{g.brand || t(categoryTranslationKey(g.category))} · {g.color} · {t(fitTranslationKey(g.fit))}</div>
            <select className="select" style={{ marginTop: 10, padding: "7px 8px", fontSize: 10 }} value={g.laundry_status} onChange={(e) => void changeStatus(g, e.target.value as LaundryStatus)} aria-label={t("wardrobe.statusFor", { name: g.name })}>
              <option value="clean">{t("status.clean")}</option><option value="dirty">{t("status.dirty")}</option><option value="washing">{t("status.washing")}</option><option value="drying">{t("status.drying")}</option>
            </select>
          </div>
        </article>)}</div>}
      </section>
    </div>

    {showForm && <div role="dialog" aria-modal="true" aria-labelledby="add-garment-title" style={{ position: "fixed", inset: 0, background: "#20231f66", zIndex: 40, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="card card-pad" style={{ width: "min(100%, 560px)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 80px #16181028" }}>
        <div className="card-head"><div><div className="eyebrow">{t("wardrobe.entry")}</div><h2 id="add-garment-title" className="card-title" style={{ fontSize: 22, marginTop: 5 }}>{t("wardrobe.addNew")}</h2></div><button className="btn btn-quiet" aria-label={t("common.close")} onClick={() => setShowForm(false)}><X size={15}/></button></div>
        <form onSubmit={addGarment}>
          <div className="form-grid">
            <div className="field"><label htmlFor="name">{t("wardrobe.garmentName")}</label><input className="input" id="name" name="name" placeholder={t("wardrobe.exampleTee")} required maxLength={80}/></div>
            <div className="field"><label htmlFor="category">{t("wardrobe.category")} *</label><select className="select" name="category" id="category" required>{categories.filter((c) => c !== "all").map((c) => <option value={c} key={c}>{t(categoryTranslationKey(c))}</option>)}</select></div>
            <div className="field"><label htmlFor="brand">{t("common.brand")}</label><input className="input" name="brand" id="brand" placeholder={t("wardrobe.brandExample")} maxLength={80}/></div>
            <div className="field"><label htmlFor="color">{t("common.color")} *</label><input className="input" name="color" id="color" placeholder={t("wardrobe.colorExample")} required maxLength={40}/></div>
            <div className="field"><label htmlFor="color_hex">{t("wardrobe.colorSwatch")}</label><input className="input" type="color" name="color_hex" id="color_hex" defaultValue="#81877b" style={{ height: 39, padding: 4 }}/></div>
            <div className="field"><label htmlFor="fit">{t("common.fit")}</label><select className="select" name="fit" id="fit"><option value="unknown">{t("fit.unknown")}</option><option value="slim">{t("fit.slim")}</option><option value="regular">{t("fit.regular")}</option><option value="relaxed">{t("fit.relaxed")}</option><option value="oversized">{t("fit.oversized")}</option><option value="wide">{t("fit.wide")}</option></select></div>
            <div className="field"><label htmlFor="laundry_status">{t("common.availability")}</label><select className="select" name="laundry_status" id="laundry_status"><option value="clean">{t("status.clean")}</option><option value="dirty">{t("status.dirty")}</option><option value="washing">{t("status.washing")}</option><option value="drying">{t("status.drying")}</option></select></div>
            <div className="field"><label htmlFor="image">{t("common.photo")}</label><input className="input" type="file" accept="image/jpeg,image/png,image/webp,image/heic" name="image" id="image" style={{ padding: 8 }}/></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="notes">{t("common.notes")}</label><textarea className="textarea" name="notes" id="notes" rows={2} placeholder={t("wardrobe.materialHint")} maxLength={500}/></div>
          </div>
          <div className="form-actions"><button className="btn" type="button" onClick={() => setShowForm(false)}>{t("common.cancel")}</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? t("wardrobe.saving") : <><Upload size={13}/> {t("wardrobe.save")}</>}</button></div>
          <p className="muted small" style={{ marginTop: 10 }}>{t("wardrobe.photoPrivate")} {t("wardrobe.photoHint")}.</p>
        </form>
      </div>
    </div>}
  </AppShell>;
}

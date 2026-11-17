"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Plus, Search, Shirt, Trash2, Upload, X } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { createClient } from "@/lib/supabase/client";
import type { Garment, GarmentCategory, LaundryStatus } from "@/types/wardrobe";

const categories: { value: GarmentCategory | "all"; label: string }[] = [
  { value: "all", label: "All pieces" }, { value: "tshirt", label: "T-shirts" }, { value: "hoodie", label: "Hoodies" },
  { value: "crewneck", label: "Crewnecks" }, { value: "jeans", label: "Jeans" }, { value: "trousers", label: "Trousers" },
  { value: "socks", label: "Socks" }, { value: "shoes", label: "Shoes" }, { value: "other", label: "Other" },
];
const statusLabel: Record<LaundryStatus, string> = { clean: "Clean", dirty: "To wash", washing: "Washing", drying: "Drying" };
const statusClass: Record<LaundryStatus, string> = { clean: "pill-green", dirty: "pill-orange", washing: "pill-blue", drying: "" };
const categoryIcon: Record<string, string> = { tshirt: "👕", hoodie: "🧥", crewneck: "🧶", jeans: "👖", trousers: "👖", socks: "🧦", shoes: "👟", other: "✳️" };

export function WardrobeClient() {
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
      if (!response.ok) throw new Error(payload.error ?? "Unable to load wardrobe.");
      setSignedOut(false); setGarments(payload.garments ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : "Unexpected error."); }
    finally { setLoading(false); }
  }, []);
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
        if (!auth.user) throw new Error("Accedi prima di caricare una foto.");
        if (!file.type.startsWith("image/")) throw new Error("Seleziona un file immagine.");
        if (file.size > 10 * 1024 * 1024) throw new Error("L'immagine deve essere inferiore a 10 MB.");
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
      if (!response.ok) throw new Error(result.error ?? "Unable to save garment.");
      setShowForm(false); formElement.reset(); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Unexpected error."); }
    finally { setSaving(false); }
  }

  async function changeStatus(item: Garment, status: LaundryStatus) {
    setError("");
    const response = await fetch(`/api/garments/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ laundry_status: status }) });
    const payload = await response.json();
    if (!response.ok) { setError(payload.error ?? "Unable to update status."); return; }
    setGarments((current) => current.map((g) => g.id === item.id ? payload.garment : g));
  }

  async function remove(item: Garment) {
    if (!window.confirm(`Eliminare ${item.name}?`)) return;
    const response = await fetch(`/api/garments/${item.id}`, { method: "DELETE" });
    if (!response.ok) { const payload = await response.json(); setError(payload.error ?? "Unable to delete garment."); return; }
    setGarments((current) => current.filter((g) => g.id !== item.id));
  }

  const visible = garments.filter((g) => (filter === "all" || g.category === filter) && `${g.name} ${g.brand ?? ""} ${g.color}`.toLowerCase().includes(query.toLowerCase()));
  return <AppShell title="Your wardrobe" eyebrow="Every piece, in one place" action={<button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={14}/> Add garment</button>}>
    <div className="page-section">
      {error && <div className="notice error">{error}</div>}
      {signedOut && <div className="card card-pad"><div className="card-title">Sign in to open your wardrobe</div><p className="muted small">I tuoi capi vengono salvati in modo privato nel tuo account.</p><Link href="/login" className="btn btn-primary" style={{ marginTop: 12 }}>Sign in</Link></div>}
      <section className="stat-row">
        <div className="card stat-card"><div className="muted small">All pieces</div><div className="stat-num">{garments.length}</div></div>
        <div className="card stat-card"><div className="muted small">Ready to wear</div><div className="stat-num">{garments.filter((g) => g.laundry_status === "clean").length}</div></div>
        <div className="card stat-card"><div className="muted small">In laundry</div><div className="stat-num">{garments.filter((g) => g.laundry_status !== "clean").length}</div></div>
      </section>
      <section className="card card-pad">
        <SectionHeader title="Your pieces" note="Filter by category or search by name, brand and colour." action={<div style={{ position: "relative" }}><Search size={14} style={{ position: "absolute", left: 11, top: 11, color: "#9a9e94" }}/><input className="input" style={{ paddingLeft: 32, width: 180 }} placeholder="Search wardrobe" value={query} onChange={(e) => setQuery(e.target.value)}/></div>}/>
        <div className="filter-row" style={{ marginBottom: 20 }}>{categories.map((item) => <button key={item.value} className={`filter-chip ${filter === item.value ? "active" : ""}`} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div>
        {loading ? <div className="loading">Loading your pieces…</div> : visible.length === 0 ? <div className="empty-state"><div className="empty-icon"><Shirt size={20}/></div><div className="card-title">No pieces found</div><p className="small">Add a garment or change the filters.</p><button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => setShowForm(true)}><Plus size={13}/> Add garment</button></div> : <div className="garment-grid">{visible.map((g) => <article className="garment-card" key={g.id}>
          <div className="garment-art" style={{ background: `${g.color_hex ?? "#a8ad9f"}20` }}>
            {g.image_url ? <img src={g.image_url} alt={g.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}/> : <span className="garment-symbol">{categoryIcon[g.category] ?? "✳️"}</span>}
            <span className={`pill ${statusClass[g.laundry_status]}`} style={{ position: "absolute", left: 8, top: 8 }}>{statusLabel[g.laundry_status]}</span>
            <button className="btn btn-quiet" style={{ position: "absolute", right: 7, top: 7, padding: 6 }} aria-label="Delete garment" onClick={() => remove(g)}><Trash2 size={12}/></button>
          </div>
          <div className="garment-info">
            <div className="garment-name">{g.name}</div>
            <div className="garment-meta">{g.brand || g.category} · {g.color} · {g.fit}</div>
            <select className="select" style={{ marginTop: 10, padding: "7px 8px", fontSize: 10 }} value={g.laundry_status} onChange={(e) => void changeStatus(g, e.target.value as LaundryStatus)} aria-label={`Laundry status for ${g.name}`}>
              <option value="clean">Clean</option><option value="dirty">To wash</option><option value="washing">Washing</option><option value="drying">Drying</option>
            </select>
          </div>
        </article>)}</div>}
      </section>
    </div>

    {showForm && <div role="dialog" aria-modal="true" aria-labelledby="add-garment-title" style={{ position: "fixed", inset: 0, background: "#20231f66", zIndex: 40, display: "grid", placeItems: "center", padding: 16 }}>
      <div className="card card-pad" style={{ width: "min(100%, 560px)", maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 80px #16181028" }}>
        <div className="card-head"><div><div className="eyebrow">WARDROBE ENTRY</div><h2 id="add-garment-title" className="card-title" style={{ fontSize: 22, marginTop: 5 }}>Add a new piece</h2></div><button className="btn btn-quiet" aria-label="Close" onClick={() => setShowForm(false)}><X size={15}/></button></div>
        <form onSubmit={addGarment}>
          <div className="form-grid">
            <div className="field"><label htmlFor="name">Garment name *</label><input className="input" id="name" name="name" placeholder="e.g. Boxy cotton tee" required maxLength={80}/></div>
            <div className="field"><label htmlFor="category">Category *</label><select className="select" name="category" id="category" required>{categories.filter((c) => c.value !== "all").map((c) => <option value={c.value} key={c.value}>{c.label}</option>)}</select></div>
            <div className="field"><label htmlFor="brand">Brand</label><input className="input" name="brand" id="brand" placeholder="e.g. COS" maxLength={80}/></div>
            <div className="field"><label htmlFor="color">Colour *</label><input className="input" name="color" id="color" placeholder="e.g. Charcoal" required maxLength={40}/></div>
            <div className="field"><label htmlFor="color_hex">Colour swatch</label><input className="input" type="color" name="color_hex" id="color_hex" defaultValue="#81877b" style={{ height: 39, padding: 4 }}/></div>
            <div className="field"><label htmlFor="fit">Fit</label><select className="select" name="fit" id="fit"><option value="unknown">Not specified</option><option value="slim">Slim</option><option value="regular">Regular</option><option value="relaxed">Relaxed</option><option value="oversized">Oversized</option><option value="wide">Wide</option></select></div>
            <div className="field"><label htmlFor="laundry_status">Availability</label><select className="select" name="laundry_status" id="laundry_status"><option value="clean">Clean</option><option value="dirty">To wash</option><option value="washing">Washing</option><option value="drying">Drying</option></select></div>
            <div className="field"><label htmlFor="image">Photo</label><input className="input" type="file" accept="image/jpeg,image/png,image/webp,image/heic" name="image" id="image" style={{ padding: 8 }}/></div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label htmlFor="notes">Notes</label><textarea className="textarea" name="notes" id="notes" rows={2} placeholder="Material, season, care notes…" maxLength={500}/></div>
          </div>
          <div className="form-actions"><button className="btn" type="button" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={saving}>{saving ? "Saving…" : <><Upload size={13}/> Save garment</>}</button></div>
          <p className="muted small" style={{ marginTop: 10 }}>Photos are private and stored in your Supabase wardrobe bucket. Max 10 MB.</p>
        </form>
      </div>
    </div>}
  </AppShell>;
}

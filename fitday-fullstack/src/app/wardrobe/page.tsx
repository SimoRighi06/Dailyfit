"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Plus, Search, Shirt, ImagePlus, X, Bookmark, RotateCcw, Trash2, CheckCircle2, WashingMachine } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { GarmentDrawer } from "@/app/components/garment-drawer";
import { GARMENT_CATEGORIES, GARMENT_FITS, LAUNDRY_STATUSES, type Garment, type GarmentCategory, type GarmentFit, type LaundryStatus } from "@/types/wardrobe";
import { categoryInitials, colorHex, garmentImageUrl, LAUNDRY_META, safeJson } from "@/lib/garment-utils";

const VIEW_KEY = "fitday.wardrobe.view";
type Sort = "new" | "name" | "category";

export default function WardrobePage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(""); const [cat, setCat] = useState<"all" | GarmentCategory>("all");
  const [status, setStatus] = useState<"all" | LaundryStatus>("all"); const [sort, setSort] = useState<Sort>("new");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [adding, setAdding] = useState(false); const [formError, setFormError] = useState("");
  const [name, setName] = useState(""); const [fCat, setFCat] = useState<GarmentCategory>("tshirt");
  const [brand, setBrand] = useState(""); const [color, setColor] = useState(""); const [hex, setHex] = useState("#101010");
  const [fit, setFit] = useState<GarmentFit>("regular"); const [fStatus, setFStatus] = useState<LaundryStatus>("clean");
  const [photo, setPhoto] = useState<File | null>(null); const [photoPrev, setPhotoPrev] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const notify = useCallback((msg: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, undo });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);
  useEffect(() => () => { if (photoPrev?.startsWith("blob:")) URL.revokeObjectURL(photoPrev); }, [photoPrev]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/garments", { cache: "no-store" });
    const payload = await safeJson(res);
    console.log("📥 [wardrobe] GET →", res.status, payload?.garments?.length ?? payload?.error);
    if (res.ok && payload?.garments) setGarments(payload.garments);
    else notify(payload?.error ?? `Errore caricamento (${res.status})`);
    setLoading(false);
  }, [notify]);

  useEffect(() => {
    void load();
    try { const v = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "null"); if (v) { setQ(v.q ?? ""); setCat(v.cat ?? "all"); setStatus(v.status ?? "all"); setSort(v.sort ?? "new"); console.log("🔖 [wardrobe] vista salvata ripristinata"); } } catch {}
    const gid = new URLSearchParams(window.location.search).get("g");
    if (gid) setDrawerId(gid);
  }, [load]);

  const visible = useMemo(() => {
    let list = garments.filter(g =>
      (cat === "all" || g.category === cat) &&
      (status === "all" || g.laundry_status === status) &&
      (q.trim() === "" || `${g.name} ${g.brand ?? ""} ${g.color}`.toLowerCase().includes(q.trim().toLowerCase())));
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "category") list = [...list].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return list;
  }, [garments, q, cat, status, sort]);

  function saveView() { localStorage.setItem(VIEW_KEY, JSON.stringify({ q, cat, status, sort })); notify("VISTA SALVATA"); }
  function resetView() { setQ(""); setCat("all"); setStatus("all"); setSort("new"); localStorage.removeItem(VIEW_KEY); notify("VISTA RESETTATA"); }

  function pickPhoto(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setFormError("Il file deve essere un'immagine."); return; }
    if (f.size > 5 * 1024 * 1024) { setFormError("Foto troppo grande (max 5 MB)."); return; }
    setFormError(""); setPhoto(f); setPhotoPrev(URL.createObjectURL(f));
  }

  async function addGarment(e: FormEvent) {
    e.preventDefault(); setAdding(true); setFormError("");
    try {
      let res: Response;
      if (photo) {
        const fd = new FormData();
        fd.append("name", name); fd.append("category", fCat); fd.append("brand", brand); fd.append("color", color);
        fd.append("color_hex", hex); fd.append("fit", fit); fd.append("laundry_status", fStatus); fd.append("photo", photo);
        res = await fetch("/api/garments", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/garments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category: fCat, brand, color, color_hex: hex, fit, laundry_status: fStatus }) });
      }
      const payload = await safeJson(res);
      console.log("📥 [wardrobe] POST →", res.status, payload?.garment?.id ?? payload?.error);
      if (!res.ok || !payload?.garment) throw new Error(payload?.error ?? `Errore (${res.status})`);
      setGarments(prev => [payload.garment, ...prev]);
      setName(""); setBrand(""); setColor(""); setHex("#101010"); setPhoto(null); setPhotoPrev(null);
      notify("CAPO AGGIUNTO");
    } catch (err: any) { setFormError(err?.message ?? "Errore inatteso"); }
    finally { setAdding(false); }
  }

  const applySaved = (g: Garment) => setGarments(prev => prev.map(x => x.id === g.id ? g : x));

  async function patchStatus(ids: string[], s: LaundryStatus) {
    const before = garments;
    setGarments(prev => prev.map(g => ids.includes(g.id) ? { ...g, laundry_status: s } : g));
    const results = await Promise.allSettled(ids.map(async id => {
      const res = await fetch(`/api/garments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ laundry_status: s }) });
      const p = await safeJson(res);
      if (!res.ok || !p?.garment) throw new Error(p?.error ?? `${res.status}`);
      return p.garment as Garment;
    }));
    const ok = results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<Garment>).value);
    const failed = results.length - ok.length;
    setGarments(prev => prev.map(g => ok.find(o => o.id === g.id) ?? g));
    if (failed) { setGarments(before); notify(`ERRORE STATO SU ${failed} CAPI`); console.error("❌ [wardrobe] patchStatus falliti:", failed); }
    else notify(`${ids.length} CAPI → ${LAUNDRY_META[s].it}`);
    setSelected(new Set());
  }

  async function removeGarments(list: Garment[]) {
    const ids = list.map(g => g.id);
    setGarments(prev => prev.filter(g => !ids.includes(g.id)));
    setSelected(new Set()); setDrawerId(null);
    const undo = async () => {
      console.log("↩️ [wardrobe] undo restore:", ids);
      const results = await Promise.allSettled(list.map(async g => {
        const res = await fetch("/api/garments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: g.id, name: g.name, category: g.category, brand: g.brand ?? "", color: g.color, color_hex: g.color_hex ?? "", fit: g.fit, laundry_status: g.laundry_status, notes: g.notes ?? "", image_path: g.image_path ?? undefined }) });
        const p = await safeJson(res);
        if (!res.ok || !p?.garment) throw new Error(p?.error ?? `${res.status}`);
        return p.garment as Garment;
      }));
      const ok = results.filter(r => r.status === "fulfilled").map(r => (r as PromiseFulfilledResult<Garment>).value);
      setGarments(prev => [...ok, ...prev]);
      notify(ok.length === list.length ? "RIPRISTINATO" : `RIPRISTINATI ${ok.length}/${list.length}`);
    };
    const results = await Promise.allSettled(ids.map(id => fetch(`/api/garments/${id}`, { method: "DELETE" }).then(async r => { if (!r.ok) throw new Error((await safeJson(r))?.error ?? `${r.status}`); })));
    const failed = results.filter(r => r.status === "rejected").length;
    if (failed) { void load(); notify(`ERRORE ELIMINAZIONE SU ${failed} CAPI`); }
    else notify(list.length === 1 ? `ELIMINATO: ${list[0].name.toUpperCase()}` : `${list.length} CAPI ELIMINATI`, undo);
  }

  const drawerGarment = garments.find(g => g.id === drawerId) ?? null;
  const toggleSel = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <AppShell title="Il tuo guardaroba" eyebrow="Ogni capo, sotto controllo" action={null}>
      <div className="stack">
        <section className="card card-pad">
          <SectionHeader title="Aggiungi un capo" note="Con foto: l'avatar lo indossa davvero" />
          <form onSubmit={addGarment} className="add-grid">
            <label className={`dropzone ${dragOver ? "over" : ""} ${photoPrev ? "has" : ""}`}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); pickPhoto(e.dataTransfer.files?.[0] ?? null); }}>
              {photoPrev ? <img src={photoPrev} alt="Anteprima" /> : <><ImagePlus size={22} /><span>TRASCINA UNA FOTO<br />O CLICCA · MAX 5MB</span></>}
              <input type="file" accept="image/*" hidden onChange={e => pickPhoto(e.target.files?.[0] ?? null)} />
              {photoPrev && <button type="button" className="dz-remove" onClick={e => { e.preventDefault(); setPhoto(null); setPhotoPrev(null); }}><X size={12} /></button>}
            </label>
            <div className="add-fields">
              <div className="field"><label>NOME</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Es. Hoodie Heavyweight Black" required /></div>
              <div className="drawer-row">
                <div className="field"><label>CATEGORIA</label><select className="input" value={fCat} onChange={e => setFCat(e.target.value as GarmentCategory)}>{GARMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="field"><label>BRAND</label><input className="input" value={brand} onChange={e => setBrand(e.target.value)} placeholder="Es. Street Core" /></div>
              </div>
              <div className="drawer-row">
                <div className="field"><label>COLORE</label><input className="input" value={color} onChange={e => setColor(e.target.value)} placeholder="black, navy, volt…" required /></div>
                <div className="field"><label>HEX</label><div style={{ display: "flex", gap: 6 }}><input type="color" value={hex} onChange={e => setHex(e.target.value)} style={{ width: 42, height: 42, padding: 0 }} /><input className="input" value={hex} onChange={e => setHex(e.target.value)} /></div></div>
              </div>
              <div className="drawer-row">
                <div className="field"><label>FIT</label><select className="input" value={fit} onChange={e => setFit(e.target.value as GarmentFit)}>{GARMENT_FITS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
                <div className="field"><label>STATO</label><select className="input" value={fStatus} onChange={e => setFStatus(e.target.value as LaundryStatus)}>{LAUNDRY_STATUSES.map(s => <option key={s} value={s}>{LAUNDRY_META[s].it}</option>)}</select></div>
              </div>
              {formError && <div className="notice error">{formError}</div>}
              <button className="btn btn-primary" type="submit" disabled={adding} style={{ justifySelf: "start" }}>{adding ? "AGGIUNTA…" : <><Plus size={15} /> AGGIUNGI CAPO</>}</button>
            </div>
          </form>
        </section>

        <section className="card card-pad">
          <SectionHeader title="I tuoi capi" note={`${visible.length} di ${garments.length} · ${garments.filter(g => g.laundry_status === "clean").length} pronti`}
            action={<div style={{ display: "flex", gap: 6 }}><button className="btn btn-quiet" onClick={saveView} title="Salva filtri"><Bookmark size={13} /></button><button className="btn btn-quiet" onClick={resetView} title="Reset filtri"><RotateCcw size={13} /></button></div>} />
          <div className="toolbar">
            <div className="searchbox"><Search size={14} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca nome, brand, colore…" /></div>
            <select className="input tb-select" value={status} onChange={e => setStatus(e.target.value as any)}><option value="all">TUTTI GLI STATI</option>{LAUNDRY_STATUSES.map(s => <option key={s} value={s}>{LAUNDRY_META[s].it}</option>)}</select>
            <select className="input tb-select" value={sort} onChange={e => setSort(e.target.value as Sort)}><option value="new">PIÙ RECENTI</option><option value="name">NOME A–Z</option><option value="category">CATEGORIA</option></select>
          </div>
          <div className="cat-chips">
            <button className={`cat-chip ${cat === "all" ? "on" : ""}`} onClick={() => setCat("all")}>ALL</button>
            {GARMENT_CATEGORIES.map(c => <button key={c} className={`cat-chip ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
          </div>

          {selected.size > 0 && (
            <div className="bulkbar">
              <strong>{selected.size} SELEZIONATI</strong>
              <button className="btn btn-primary" onClick={() => patchStatus([...selected], "clean")}><CheckCircle2 size={13} /> PRONTI</button>
              <button className="btn" onClick={() => patchStatus([...selected], "dirty")}><WashingMachine size={13} /> DA LAVARE</button>
              <button className="btn btn-danger" onClick={() => removeGarments(garments.filter(g => selected.has(g.id)))}><Trash2 size={13} /> ELIMINA</button>
              <button className="btn btn-quiet" onClick={() => setSelected(new Set())}>ANNULLA</button>
            </div>
          )}

          {loading ? <div className="loading">Caricamento guardaroba…</div>
            : garments.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><Shirt size={22} /></div><div className="card-title">Guardaroba vuoto</div><p className="small">Aggiungi il primo capo con una foto.</p></div>
            ) : visible.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><Search size={20} /></div><div className="card-title">Nessun risultato</div><p className="small">Nessun capo corrisponde ai filtri.</p><button className="btn" style={{ marginTop: 10 }} onClick={resetView}>RESET FILTRI</button></div>
            ) : (
              <div className="garment-grid">
                {visible.map(g => {
                  const url = garmentImageUrl(g); const meta = LAUNDRY_META[g.laundry_status];
                  return (
                    <article key={g.id} className={`garment-card clickable ${selected.has(g.id) ? "sel" : ""}`} onClick={() => setDrawerId(g.id)}>
                      <div className="garment-art" style={{ background: `${colorHex(g.color_hex ?? g.color)}22` }}>
                        <span className="chip">{g.category}</span>
                        <input type="checkbox" className="card-check" checked={selected.has(g.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSel(g.id)} aria-label={`Seleziona ${g.name}`} />
                        {url ? <img className="garment-photo" src={url} alt={g.name} loading="lazy" /> : <span className="garment-symbol">{categoryInitials(g.category)}</span>}
                      </div>
                      <div className="garment-info">
                        <div className="garment-name">{g.name}</div>
                        <div className="garment-meta">{g.brand || g.category} · {g.color}</div>
                        <span className={`pill ${meta.pill} card-pill`}>{meta.it}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
        </section>
      </div>

      <GarmentDrawer garment={drawerGarment} onClose={() => setDrawerId(null)} onSaved={applySaved}
        onDeleted={g => removeGarments([g])} />

      {toast && (
        <div className="toast" role="status">
          <span>{toast.msg}</span>
          {toast.undo && <button className="btn btn-primary" onClick={() => { const u = toast.undo; setToast(null); if (toastTimer.current) clearTimeout(toastTimer.current); u?.(); }}>UNDO</button>}
          <button className="toast-x" onClick={() => setToast(null)} aria-label="Chiudi"><X size={13} /></button>
        </div>
      )}
    </AppShell>
  );
}
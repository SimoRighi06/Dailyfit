"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Pencil, Trash2, ImagePlus, Check } from "lucide-react";
import { GARMENT_CATEGORIES, GARMENT_FITS, LAUNDRY_STATUSES, type Garment, type GarmentCategory, type GarmentFit, type LaundryStatus } from "@/types/wardrobe";
import { categoryInitials, colorHex, garmentImageUrl, LAUNDRY_META, safeJson } from "@/lib/garment-utils";

export function GarmentDrawer({ garment, onClose, onSaved, onDeleted }: {
  garment: Garment | null;
  onClose: () => void;
  onSaved: (g: Garment) => void;
  onDeleted: (g: Garment) => void;
}) {
  const open = !!garment;
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(""); const [category, setCategory] = useState<GarmentCategory>("tshirt");
  const [brand, setBrand] = useState(""); const [color, setColor] = useState(""); const [hex, setHex] = useState("#101010");
  const [fit, setFit] = useState<GarmentFit>("regular"); const [notes, setNotes] = useState("");
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!garment) return;
    setEditing(false); setConfirmDel(false); setError(""); setNewPhoto(null); setRemovePhoto(false);
    setName(garment.name); setCategory(garment.category); setBrand(garment.brand ?? "");
    setColor(garment.color); setHex(garment.color_hex ?? colorHex(garment.color)); setFit(garment.fit); setNotes(garment.notes ?? "");
    setPreview(garmentImageUrl(garment));
    console.log("🗂️ [drawer] aperto:", garment.id, garment.name);
    closeRef.current?.focus();
  }, [garment?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);

  if (!garment) return null;

  function pickPhoto(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Il file deve essere un'immagine."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Foto troppo grande (max 5 MB)."); return; }
    setError(""); setRemovePhoto(false); setNewPhoto(f); setPreview(URL.createObjectURL(f));
  }

  async function setStatus(status: LaundryStatus) {
    if (!garment || busy) return;
    setBusy(true); setError("");
    console.log("🧺 [drawer] stato →", status, garment.id);
    const res = await fetch(`/api/garments/${garment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ laundry_status: status }) });
    const payload = await safeJson(res);
    setBusy(false);
    if (!res.ok || !payload?.garment) { setError(payload?.error ?? `Errore stato (${res.status})`); console.error("❌ [drawer] stato:", res.status, payload); return; }
    onSaved(payload.garment);
  }

  async function save(e: FormEvent) {
    e.preventDefault(); if (!garment) return;
    setBusy(true); setError("");
    try {
      let res: Response;
      if (newPhoto || removePhoto) {
        const fd = new FormData();
        fd.append("name", name); fd.append("category", category); fd.append("brand", brand);
        fd.append("color", color); fd.append("color_hex", hex); fd.append("fit", fit); fd.append("notes", notes);
        if (newPhoto) fd.append("photo", newPhoto);
        if (removePhoto) fd.append("remove_photo", "true");
        res = await fetch(`/api/garments/${garment.id}`, { method: "PATCH", body: fd });
      } else {
        res = await fetch(`/api/garments/${garment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, category, brand, color, color_hex: hex, fit, notes }) });
      }
      const payload = await safeJson(res);
      console.log("📥 [drawer] PATCH →", res.status, payload?.garment?.id ?? payload?.error);
      if (!res.ok || !payload?.garment) throw new Error(payload?.error ?? `Errore salvataggio (${res.status})`);
      onSaved(payload.garment); setEditing(false); setNewPhoto(null); setRemovePhoto(false); setPreview(garmentImageUrl(payload.garment));
    } catch (err: any) { setError(err?.message ?? "Errore inatteso"); console.error("💥 [drawer] save:", err); }
    finally { setBusy(false); }
  }

  async function del() {
    if (!garment) return;
    setBusy(true);
    const res = await fetch(`/api/garments/${garment.id}`, { method: "DELETE" });
    const payload = await safeJson(res);
    setBusy(false);
    if (!res.ok) { setError(payload?.error ?? `Errore eliminazione (${res.status})`); return; }
    console.log("🗑️ [drawer] eliminato:", garment.id);
    onDeleted(garment); onClose();
  }

  const photo = removePhoto ? null : preview;
  const meta = LAUNDRY_META[garment.laundry_status];

  return (
    <>
      <div className="drawer-scrim" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Dettaglio ${garment.name}`}>
        <header className="drawer-head">
          <span className="chip">{garment.category}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-quiet drawer-icon" onClick={() => { setEditing(v => !v); setConfirmDel(false); }} aria-label="Modifica"><Pencil size={14} /></button>
            <button ref={closeRef} className="btn btn-quiet drawer-icon" onClick={onClose} aria-label="Chiudi"><X size={14} /></button>
          </div>
        </header>

        <div className="drawer-photo" style={{ background: `${colorHex(garment.color_hex ?? garment.color)}22` }}>
          {photo ? <img src={photo} alt={garment.name} /> : <span className="drawer-initials">{categoryInitials(garment.category)}</span>}
          {editing && (
            <label className="drawer-photo-btn">
              <ImagePlus size={13} /> {photo ? "CAMBIA FOTO" : "AGGIUNGI FOTO"}
              <input type="file" accept="image/*" hidden onChange={e => pickPhoto(e.target.files?.[0] ?? null)} />
            </label>
          )}
          {editing && photo && <button className="drawer-photo-remove" onClick={() => { setRemovePhoto(true); setNewPhoto(null); setPreview(null); }}>RIMUOVI</button>}
        </div>

        {!editing ? (
          <div className="drawer-body">
            <h2 className="drawer-title">{garment.name}</h2>
            <span className={`pill ${meta.pill}`}>{meta.it}</span>
            <dl className="drawer-meta">
              <div><dt>BRAND</dt><dd>{garment.brand || "—"}</dd></div>
              <div><dt>COLORE</dt><dd><i className="swatch" style={{ background: colorHex(garment.color_hex ?? garment.color) }} />{garment.color}</dd></div>
              <div><dt>FIT</dt><dd>{garment.fit}</dd></div>
              <div><dt>AGGIUNTO</dt><dd>{new Date(garment.created_at).toLocaleDateString("it-IT")}</dd></div>
            </dl>
            {garment.notes && <p className="drawer-notes">{garment.notes}</p>}
            <div className="drawer-section-label">STATO LAVANDERIA</div>
            <div className="status-grid">
              {LAUNDRY_STATUSES.map(s => (
                <button key={s} disabled={busy} onClick={() => setStatus(s)}
                  className={`status-btn ${garment.laundry_status === s ? `on ${LAUNDRY_META[s].pill}` : ""}`}>
                  {garment.laundry_status === s && <Check size={11} />} {LAUNDRY_META[s].it}
                </button>
              ))}
            </div>
            {error && <div className="notice error">{error}</div>}
            <div className="drawer-actions">
              <button className="btn btn-primary" onClick={() => setEditing(true)}><Pencil size={13} /> MODIFICA</button>
              {!confirmDel
                ? <button className="btn btn-danger" onClick={() => setConfirmDel(true)}><Trash2 size={13} /> ELIMINA</button>
                : <button className="btn btn-danger confirm" disabled={busy} onClick={del}>CONFERMI? SÌ, ELIMINA</button>}
            </div>
          </div>
        ) : (
          <form className="drawer-body" onSubmit={save}>
            <div className="field"><label>NOME</label><input className="input" value={name} onChange={e => setName(e.target.value)} required /></div>
            <div className="drawer-row">
              <div className="field"><label>CATEGORIA</label><select className="input" value={category} onChange={e => setCategory(e.target.value as GarmentCategory)}>{GARMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className="field"><label>FIT</label><select className="input" value={fit} onChange={e => setFit(e.target.value as GarmentFit)}>{GARMENT_FITS.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            </div>
            <div className="field"><label>BRAND</label><input className="input" value={brand} onChange={e => setBrand(e.target.value)} /></div>
            <div className="drawer-row">
              <div className="field"><label>COLORE</label><input className="input" value={color} onChange={e => setColor(e.target.value)} required /></div>
              <div className="field"><label>HEX</label><div style={{ display: "flex", gap: 6 }}><input type="color" value={hex} onChange={e => setHex(e.target.value)} style={{ width: 42, height: 42, padding: 0 }} /><input className="input" value={hex} onChange={e => setHex(e.target.value)} /></div></div>
            </div>
            <div className="field"><label>NOTE</label><textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></div>
            {error && <div className="notice error">{error}</div>}
            <div className="drawer-actions">
              <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "SALVO…" : "SALVA MODIFICHE"}</button>
              <button className="btn" type="button" onClick={() => setEditing(false)}>ANNULLA</button>
            </div>
          </form>
        )}
      </aside>
    </>
  );
}
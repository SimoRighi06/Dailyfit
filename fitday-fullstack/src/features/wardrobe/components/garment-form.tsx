"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Plus, X } from "lucide-react";
import Image from "next/image";
import { GARMENT_CATEGORIES, GARMENT_FITS, LAUNDRY_STATUSES, type Garment, type GarmentCategory, type GarmentFit, type LaundryStatus } from "@/types/wardrobe";
import { LAUNDRY_META, safeJson } from "@/lib/garment-utils";

export function GarmentForm({ onCreated, onNotify }: {
  onCreated: (garment: Garment) => void;
  onNotify: (message: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GarmentCategory>("tshirt");
  const [brand, setBrand] = useState("");
  const [color, setColor] = useState("");
  const [hex, setHex] = useState("#101010");
  const [fit, setFit] = useState<GarmentFit>("regular");
  const [status, setStatus] = useState<LaundryStatus>("clean");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => () => {
    if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  function pickPhoto(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("Il file deve essere un'immagine.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFormError("Foto troppo grande (max 5 MB).");
      return;
    }
    setFormError("");
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function addGarment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdding(true);
    setFormError("");

    try {
      let response: Response;
      if (photo) {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("category", category);
        formData.append("brand", brand);
        formData.append("color", color);
        formData.append("color_hex", hex);
        formData.append("fit", fit);
        formData.append("laundry_status", status);
        formData.append("photo", photo);
        response = await fetch("/api/garments", { method: "POST", body: formData });
      } else {
        response = await fetch("/api/garments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            brand,
            color,
            color_hex: hex,
            fit,
            laundry_status: status,
          }),
        });
      }

      const payload = await safeJson(response);
      if (!response.ok || !payload?.garment) {
        throw new Error(payload?.error ?? `Errore (${response.status})`);
      }

      onCreated(payload.garment);
      setName("");
      setBrand("");
      setColor("");
      setHex("#101010");
      setPhoto(null);
      setPhotoPreview(null);
      onNotify("CAPO AGGIUNTO");
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setAdding(false);
    }
  }

  return (
    <section className="card card-pad">
      <div className="card-head">
        <div>
          <div className="eyebrow">IL TUO GUARDAROBA</div>
          <h2 className="card-title">Aggiungi un capo</h2>
          <p className="small">Con foto: l&apos;avatar lo indossa davvero</p>
        </div>
      </div>
      <form onSubmit={addGarment} className="add-grid">
        <label
          className={`dropzone ${dragOver ? "over" : ""} ${photoPreview ? "has" : ""}`}
          onDragOver={event => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={event => {
            event.preventDefault();
            setDragOver(false);
            pickPhoto(event.dataTransfer.files?.[0] ?? null);
          }}
        >
          {photoPreview
            ? <Image src={photoPreview} alt="Anteprima" width={400} height={400} unoptimized />
            : <><ImagePlus size={22} /><span>TRASCINA UNA FOTO<br />O CLICCA · MAX 5MB</span></>}
          <input type="file" accept="image/*" hidden onChange={event => pickPhoto(event.target.files?.[0] ?? null)} />
          {photoPreview && (
            <button
              type="button"
              className="dz-remove"
              onClick={event => {
                event.preventDefault();
                setPhoto(null);
                setPhotoPreview(null);
              }}
            >
              <X size={12} />
            </button>
          )}
        </label>

        <div className="add-fields">
          <div className="field">
            <label htmlFor="garment-name">NOME</label>
            <input id="garment-name" className="input" value={name} onChange={event => setName(event.target.value)} placeholder="Es. Hoodie Heavyweight Black" required />
          </div>
          <div className="drawer-row">
            <div className="field">
              <label htmlFor="garment-category">CATEGORIA</label>
              <select id="garment-category" className="input" value={category} onChange={event => setCategory(event.target.value as GarmentCategory)}>
                {GARMENT_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="garment-brand">BRAND</label>
              <input id="garment-brand" className="input" value={brand} onChange={event => setBrand(event.target.value)} placeholder="Es. Street Core" />
            </div>
          </div>
          <div className="drawer-row">
            <div className="field">
              <label htmlFor="garment-color">COLORE</label>
              <input id="garment-color" className="input" value={color} onChange={event => setColor(event.target.value)} placeholder="black, navy, volt…" required />
            </div>
            <div className="field">
              <label htmlFor="garment-hex">HEX</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input type="color" value={hex} onChange={event => setHex(event.target.value)} aria-label="Selettore colore" style={{ width: 42, height: 42, padding: 0 }} />
                <input id="garment-hex" className="input" value={hex} onChange={event => setHex(event.target.value)} />
              </div>
            </div>
          </div>
          <div className="drawer-row">
            <div className="field">
              <label htmlFor="garment-fit">FIT</label>
              <select id="garment-fit" className="input" value={fit} onChange={event => setFit(event.target.value as GarmentFit)}>
                {GARMENT_FITS.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="garment-status">STATO</label>
              <select id="garment-status" className="input" value={status} onChange={event => setStatus(event.target.value as LaundryStatus)}>
                {LAUNDRY_STATUSES.map(item => <option key={item} value={item}>{LAUNDRY_META[item].it}</option>)}
              </select>
            </div>
          </div>
          {formError && <div className="notice error" role="alert">{formError}</div>}
          <button className="btn btn-primary" type="submit" disabled={adding} style={{ justifySelf: "start" }}>
            {adding ? "AGGIUNTA…" : <><Plus size={15} /> AGGIUNGI CAPO</>}
          </button>
        </div>
      </form>
    </section>
  );
}

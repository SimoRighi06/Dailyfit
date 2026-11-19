"use client";

import { Bookmark, CheckCircle2, RotateCcw, Search, Shirt, Trash2, WashingMachine } from "lucide-react";
import Image from "next/image";
import { SectionHeader } from "@/app/components/app-shell";
import { GARMENT_CATEGORIES, LAUNDRY_STATUSES, type Garment, type GarmentCategory, type LaundryStatus } from "@/types/wardrobe";
import { categoryInitials, colorHex, garmentImageUrl, LAUNDRY_META } from "@/lib/garment-utils";

export type WardrobeSort = "new" | "name" | "category";

type Props = {
  garments: Garment[];
  visible: Garment[];
  loading: boolean;
  query: string;
  category: "all" | GarmentCategory;
  status: "all" | LaundryStatus;
  sort: WardrobeSort;
  selected: Set<string>;
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: "all" | GarmentCategory) => void;
  onStatusChange: (value: "all" | LaundryStatus) => void;
  onSortChange: (value: WardrobeSort) => void;
  onSaveView: () => void;
  onResetView: () => void;
  onToggleSelection: (id: string) => void;
  onClearSelection: () => void;
  onOpenGarment: (id: string) => void;
  onPatchStatus: (ids: string[], status: LaundryStatus) => void;
  onRemoveGarments: (garments: Garment[]) => void;
};

export function GarmentInventory({
  garments, visible, loading, query, category, status, sort, selected,
  onQueryChange, onCategoryChange, onStatusChange, onSortChange,
  onSaveView, onResetView, onToggleSelection, onClearSelection,
  onOpenGarment, onPatchStatus, onRemoveGarments,
}: Props) {
  return (
    <section className="card card-pad">
      <SectionHeader
        title="I tuoi capi"
        note={`${visible.length} di ${garments.length} · ${garments.filter(item => item.laundry_status === "clean").length} pronti`}
        action={
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-quiet" onClick={onSaveView} title="Salva filtri" aria-label="Salva filtri"><Bookmark size={13} /></button>
            <button className="btn btn-quiet" onClick={onResetView} title="Reset filtri" aria-label="Reset filtri"><RotateCcw size={13} /></button>
          </div>
        }
      />

      <div className="toolbar">
        <div className="searchbox">
          <Search size={14} />
          <input value={query} onChange={event => onQueryChange(event.target.value)} placeholder="Cerca nome, brand, colore…" aria-label="Cerca capi" />
        </div>
        <select className="input tb-select" value={status} onChange={event => onStatusChange(event.target.value as "all" | LaundryStatus)} aria-label="Filtra per stato">
          <option value="all">TUTTI GLI STATI</option>
          {LAUNDRY_STATUSES.map(item => <option key={item} value={item}>{LAUNDRY_META[item].it}</option>)}
        </select>
        <select className="input tb-select" value={sort} onChange={event => onSortChange(event.target.value as WardrobeSort)} aria-label="Ordina capi">
          <option value="new">PIÙ RECENTI</option>
          <option value="name">NOME A–Z</option>
          <option value="category">CATEGORIA</option>
        </select>
      </div>
      <div className="cat-chips">
        <button className={`cat-chip ${category === "all" ? "on" : ""}`} onClick={() => onCategoryChange("all")}>ALL</button>
        {GARMENT_CATEGORIES.map(item => (
          <button key={item} className={`cat-chip ${category === item ? "on" : ""}`} onClick={() => onCategoryChange(item)}>{item}</button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="bulkbar">
          <strong>{selected.size} SELEZIONATI</strong>
          <button className="btn btn-primary" onClick={() => onPatchStatus([...selected], "clean")}><CheckCircle2 size={13} /> PRONTI</button>
          <button className="btn" onClick={() => onPatchStatus([...selected], "dirty")}><WashingMachine size={13} /> DA LAVARE</button>
          <button className="btn btn-danger" onClick={() => onRemoveGarments(garments.filter(item => selected.has(item.id)))}><Trash2 size={13} /> ELIMINA</button>
          <button className="btn btn-quiet" onClick={onClearSelection}>ANNULLA</button>
        </div>
      )}

      {loading ? <div className="loading">Caricamento guardaroba…</div>
        : garments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Shirt size={22} /></div>
            <div className="card-title">Guardaroba vuoto</div>
            <p className="small">Aggiungi il primo capo con una foto.</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Search size={20} /></div>
            <div className="card-title">Nessun risultato</div>
            <p className="small">Nessun capo corrisponde ai filtri.</p>
            <button className="btn" style={{ marginTop: 10 }} onClick={onResetView}>RESET FILTRI</button>
          </div>
        ) : (
          <div className="garment-grid">
            {visible.map(item => {
              const imageUrl = garmentImageUrl(item);
              const meta = LAUNDRY_META[item.laundry_status];
              return (
                <article
                  key={item.id}
                  className={`garment-card clickable ${selected.has(item.id) ? "sel" : ""}`}
                  onClick={() => onOpenGarment(item.id)}
                >
                  <div className="garment-art" style={{ background: `${colorHex(item.color_hex ?? item.color)}22` }}>
                    <span className="chip">{item.category}</span>
                    <input
                      type="checkbox"
                      className="card-check"
                      checked={selected.has(item.id)}
                      onClick={event => event.stopPropagation()}
                      onChange={() => onToggleSelection(item.id)}
                      aria-label={`Seleziona ${item.name}`}
                    />
                    {imageUrl
                      ? <div style={{ position: "absolute", inset: 0 }}>
                          <Image
                            className="garment-photo"
                            src={imageUrl}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            unoptimized
                          />
                        </div>
                      : <span className="garment-symbol">{categoryInitials(item.category)}</span>}
                  </div>
                  <div className="garment-info">
                    <div className="garment-name">{item.name}</div>
                    <div className="garment-meta">{item.brand || item.category} · {item.color}</div>
                    <span className={`pill ${meta.pill} card-pill`}>{meta.it}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
    </section>
  );
}

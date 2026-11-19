"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { AppShell } from "@/app/components/app-shell";
import { GarmentDrawer } from "@/app/components/garment-drawer";
import { GarmentForm } from "@/features/wardrobe/components/garment-form";
import { GarmentInventory, type WardrobeSort } from "@/features/wardrobe/components/garment-inventory";
import { LAUNDRY_META, safeJson } from "@/lib/garment-utils";
import type { Garment, GarmentCategory, LaundryStatus } from "@/types/wardrobe";

const VIEW_KEY = "fitday.wardrobe.view";

export function WardrobePage() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | GarmentCategory>("all");
  const [status, setStatus] = useState<"all" | LaundryStatus>("all");
  const [sort, setSort] = useState<WardrobeSort>("new");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; undo?: () => void } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, undo });
    toastTimer.current = setTimeout(() => setToast(null), 6000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const load = useCallback(async (): Promise<Garment[]> => {
    const response = await fetch("/api/garments", { cache: "no-store" });
    const payload = await safeJson(response);
    if (!response.ok || !Array.isArray(payload?.garments)) {
      throw new Error(payload?.error ?? `Errore caricamento (${response.status})`);
    }
    return payload.garments as Garment[];
  }, []);

  useEffect(() => {
    let active = true;
    void load()
      .then(items => { if (active) setGarments(items); })
      .catch((error: unknown) => {
        if (active) notify(error instanceof Error ? error.message : "Errore caricamento guardaroba");
      })
      .finally(() => { if (active) setLoading(false); });
    try {
      const saved = JSON.parse(localStorage.getItem(VIEW_KEY) ?? "null");
      if (saved) {
        // Restore browser-only preferences after hydration to keep server and client markup consistent.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setQuery(saved.q ?? "");
        setCategory(saved.cat ?? "all");
        setStatus(saved.status ?? "all");
        setSort(saved.sort ?? "new");
      }
    } catch (error) {
      console.warn("Impossibile ripristinare i filtri del guardaroba.", error);
    }
    const garmentId = new URLSearchParams(window.location.search).get("g");
    if (garmentId) setDrawerId(garmentId);
    return () => { active = false; };
  }, [load, notify]);

  const visible = useMemo(() => {
    let items = garments.filter(garment =>
      (category === "all" || garment.category === category) &&
      (status === "all" || garment.laundry_status === status) &&
      (query.trim() === "" || `${garment.name} ${garment.brand ?? ""} ${garment.color}`.toLowerCase().includes(query.trim().toLowerCase())));
    if (sort === "name") items = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "category") items = [...items].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    return items;
  }, [garments, query, category, status, sort]);

  function saveView() {
    try {
      localStorage.setItem(VIEW_KEY, JSON.stringify({ q: query, cat: category, status, sort }));
      notify("VISTA SALVATA");
    } catch (error) {
      notify("Impossibile salvare la vista.");
      console.error("Errore salvataggio filtri guardaroba:", error);
    }
  }

  function resetView() {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setSort("new");
    try {
      localStorage.removeItem(VIEW_KEY);
      notify("VISTA RESETTATA");
    } catch (error) {
      notify("Filtri reimpostati, ma non è stato possibile aggiornare la memoria locale.");
      console.error("Errore rimozione filtri salvati:", error);
    }
  }

  const applySaved = (garment: Garment) => {
    setGarments(current => current.map(item => item.id === garment.id ? garment : item));
  };

  async function patchStatus(ids: string[], nextStatus: LaundryStatus) {
    const previousGarments = garments;
    setGarments(current => current.map(garment => ids.includes(garment.id) ? { ...garment, laundry_status: nextStatus } : garment));
    const results = await Promise.allSettled(ids.map(async id => {
      const response = await fetch(`/api/garments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laundry_status: nextStatus }),
      });
      const payload = await safeJson(response);
      if (!response.ok || !payload?.garment) throw new Error(payload?.error ?? `${response.status}`);
      return payload.garment as Garment;
    }));
    const updated = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
    const failed = results.length - updated.length;
    setGarments(current => current.map(garment => updated.find(item => item.id === garment.id) ?? garment));
    if (failed) {
      setGarments(previousGarments);
      notify(`ERRORE STATO SU ${failed} CAPI`);
      console.error("Aggiornamento stato fallito per alcuni capi.", results);
    } else {
      notify(`${ids.length} CAPI → ${LAUNDRY_META[nextStatus].it}`);
    }
    setSelected(new Set());
  }

  async function removeGarments(items: Garment[]) {
    const ids = items.map(item => item.id);
    setGarments(current => current.filter(garment => !ids.includes(garment.id)));
    setSelected(new Set());
    setDrawerId(null);

    const undo = async () => {
      const results = await Promise.allSettled(items.map(async garment => {
        const response = await fetch("/api/garments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: garment.id,
            name: garment.name,
            category: garment.category,
            brand: garment.brand ?? "",
            color: garment.color,
            color_hex: garment.color_hex ?? "",
            fit: garment.fit,
            laundry_status: garment.laundry_status,
            notes: garment.notes ?? "",
            image_path: garment.image_path ?? undefined,
          }),
        });
        const payload = await safeJson(response);
        if (!response.ok || !payload?.garment) throw new Error(payload?.error ?? `${response.status}`);
        return payload.garment as Garment;
      }));
      const restored = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
      setGarments(current => [...restored, ...current]);
      notify(restored.length === items.length ? "RIPRISTINATO" : `RIPRISTINATI ${restored.length}/${items.length}`);
      if (restored.length !== items.length) console.error("Ripristino fallito per alcuni capi.", results);
    };

    const results = await Promise.allSettled(ids.map(async id => {
      const response = await fetch(`/api/garments/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error((await safeJson(response))?.error ?? `${response.status}`);
    }));
    const failed = results.filter(result => result.status === "rejected").length;
    if (failed) {
      setLoading(true);
      try {
        setGarments(await load());
        notify(`ERRORE ELIMINAZIONE SU ${failed} CAPI`);
      } catch (error: unknown) {
        notify(error instanceof Error ? error.message : "Errore aggiornamento guardaroba");
        console.error("Impossibile ricaricare il guardaroba dopo un errore di eliminazione.", error);
      } finally {
        setLoading(false);
      }
      console.error("Eliminazione fallita per alcuni capi.", results);
    } else {
      notify(items.length === 1 ? `ELIMINATO: ${items[0].name.toUpperCase()}` : `${items.length} CAPI ELIMINATI`, undo);
    }
  }

  const drawerGarment = garments.find(garment => garment.id === drawerId) ?? null;
  const toggleSelection = (id: string) => setSelected(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  return (
    <AppShell title="Il tuo guardaroba" eyebrow="Ogni capo, sotto controllo" action={null}>
      <div className="stack">
        <GarmentForm
          onCreated={garment => setGarments(current => [garment, ...current])}
          onNotify={notify}
        />
        <GarmentInventory
          garments={garments}
          visible={visible}
          loading={loading}
          query={query}
          category={category}
          status={status}
          sort={sort}
          selected={selected}
          onQueryChange={setQuery}
          onCategoryChange={setCategory}
          onStatusChange={setStatus}
          onSortChange={setSort}
          onSaveView={saveView}
          onResetView={resetView}
          onToggleSelection={toggleSelection}
          onClearSelection={() => setSelected(new Set())}
          onOpenGarment={setDrawerId}
          onPatchStatus={patchStatus}
          onRemoveGarments={removeGarments}
        />
      </div>

      <GarmentDrawer
        garment={drawerGarment}
        onClose={() => setDrawerId(null)}
        onSaved={applySaved}
        onDeleted={garment => removeGarments([garment])}
      />

      {toast && (
        <div className="toast" role="status">
          <span>{toast.message}</span>
          {toast.undo && (
            <button
              className="btn btn-primary"
              onClick={() => {
                const undoAction = toast.undo;
                setToast(null);
                if (toastTimer.current) clearTimeout(toastTimer.current);
                void undoAction?.();
              }}
            >
              UNDO
            </button>
          )}
          <button className="toast-x" onClick={() => setToast(null)} aria-label="Chiudi"><X size={13} /></button>
        </div>
      )}
    </AppShell>
  );
}

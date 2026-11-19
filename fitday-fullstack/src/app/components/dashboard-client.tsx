"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, Plus, RefreshCw, Sparkles, Shirt, WashingMachine, Footprints } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { categoryInitials, colorHex, garmentImageUrl, safeJson } from "@/lib/garment-utils";
import type { Garment, Outfit } from "@/types/wardrobe";

function localDate() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; }

export function DashboardClient() {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, oRes] = await Promise.all([fetch("/api/garments", { cache: "no-store" }), fetch(`/api/outfits/today?date=${localDate()}`, { cache: "no-store" })]);
      setSignedIn(gRes.status !== 401);
      const gp = await safeJson(gRes); const op = await safeJson(oRes);
      console.log("📥 [dashboard] garments:", gRes.status, gp?.garments?.length, "| outfit:", oRes.status, op?.outfit?.title ?? op?.error);
      if (gRes.ok) setGarments(gp?.garments ?? []);
      if (oRes.ok) setOutfit(op?.outfit ?? null);
      else if (oRes.status !== 401) setMessage(op?.error ?? "Outfit non disponibile.");
    } catch { setMessage("Non riesco a raggiungere il backend."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function generate() {
    setGenerating(true); setMessage("");
    try {
      const res = await fetch("/api/outfits/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: localDate() }) });
      const payload = await safeJson(res);
      console.log("📥 [dashboard] generate →", res.status, payload?.outfit?.title ?? payload?.error);
      if (!res.ok) throw new Error(payload?.error ?? "Generazione non riuscita.");
      setOutfit(payload.outfit);
      setMessage(payload.missing?.length ? `Nel guardaroba mancano: ${payload.missing.join(", ")}.` : "Outfit aggiornato!");
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "Errore inatteso."); }
    finally { setGenerating(false); }
  }

  const cleanCount = garments.filter(g => g.laundry_status === "clean").length;
  const dirtyCount = garments.length - cleanCount;
  const items = outfit?.items ?? [];
  const top = items.find(g => ["tshirt", "hoodie", "crewneck"].includes(g.category));
  const bottom = items.find(g => ["jeans", "trousers"].includes(g.category));
  const shoes = items.find(g => g.category === "shoes");

  return (
    <AppShell title="Good morning, style starts here." eyebrow="Monday mood · Your personal wardrobe"
      action={<Link className="btn btn-primary" href="/wardrobe"><Plus size={14} /> Add item</Link>}>
      <div className="grid-main">
        <div className="stack">
          <section className="card hero-today">
            <div className="hero-copy">
              <span className="pill pill-green"><Sparkles size={11} style={{ marginRight: 5 }} /> TODAY'S LOOK</span>
              <h2>Get dressed.<br />Feel like you.</h2>
              <p>{outfit?.rationale ?? "Il tuo guardaroba, una nuova combinazione ogni giorno. FITDAY costruisce look usando soltanto i capi che hai davvero."}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 23 }}>
                <button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />} {generating ? "Creo il look…" : "Generate outfit"}</button>
                <Link className="btn" href="/outfits">View details <ArrowUpRight size={13} /></Link>
              </div>
              {message && <p className="small muted" style={{ marginTop: 13 }}>{message}</p>}
            </div>
            <div className="hero-stage">
              <AvatarViewer height={390}
                topColor={colorHex(top?.color_hex ?? top?.color)} bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)} shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)}
                topPhoto={garmentImageUrl(top)} bottomPhoto={garmentImageUrl(bottom)} shoePhoto={garmentImageUrl(shoes)} />
            </div>
          </section>
          <section className="stat-row">
            <div className="card stat-card"><div className="muted small">Total pieces</div><div className="stat-num">{loading ? "—" : garments.length.toString().padStart(2, "0")}</div><div className="muted small">In your wardrobe</div></div>
            <div className="card stat-card"><div className="muted small">Ready to wear</div><div className="stat-num">{loading ? "—" : cleanCount.toString().padStart(2, "0")}</div><div className="muted small">Clean pieces</div></div>
            <div className="card stat-card"><div className="muted small">In laundry</div><div className="stat-num">{loading ? "—" : dirtyCount.toString().padStart(2, "0")}</div><div className="muted small">Unavailable now</div></div>
          </section>
          <section className="card card-pad">
            <SectionHeader title="Recently added" note="A quick look at your latest pieces" action={<Link className="btn btn-quiet" href="/wardrobe">See all <ArrowUpRight size={13} /></Link>} />
            {loading ? <div className="loading">Loading wardrobe…</div> : garments.length === 0 ? (
              <div className="empty-state"><div className="empty-icon"><Shirt size={20} /></div><div className="card-title">Your wardrobe is waiting</div><p className="small">Add your first piece to start creating looks.</p><Link className="btn btn-primary" href="/wardrobe" style={{ marginTop: 10 }}>Add first item</Link></div>
            ) : (
              <div className="garment-grid">
                {garments.slice(0, 3).map(g => {
                  const url = garmentImageUrl(g);
                  return (
                    <Link className="garment-card clickable" key={g.id} href={`/wardrobe?g=${g.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                      <div className="garment-art" style={{ background: `${colorHex(g.color_hex ?? g.color)}18` }}>
                        <span className="chip">{g.category}</span>
                        {url ? <img className="garment-photo" src={url} alt={g.name} loading="lazy" /> : <span className="garment-symbol">{categoryInitials(g.category)}</span>}
                      </div>
                      <div className="garment-info"><div className="garment-name">{g.name}</div><div className="garment-meta">{g.brand || g.category} · {g.color}</div></div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="card card-pad">
            <SectionHeader title="Your daily rhythm" note="Small habits, better style" />
            <div className="outfit-list">
              <div className="outfit-item"><div className="outfit-swatch"><Sparkles size={18} /></div><div style={{ flex: 1 }}><div className="garment-name">Generate a fresh look</div><div className="garment-meta">One outfit, built from your clean pieces</div></div><button aria-label="Generate outfit" className="btn btn-quiet" onClick={generate}><RefreshCw size={14} /></button></div>
              <div className="outfit-item"><div className="outfit-swatch"><WashingMachine size={18} /></div><div style={{ flex: 1 }}><div className="garment-name">Laundry check</div><div className="garment-meta">Keep availability up to date</div></div><Link className="btn btn-quiet" href="/wardrobe"><ArrowUpRight size={14} /></Link></div>
              <div className="outfit-item"><div className="outfit-swatch"><Footprints size={18} /></div><div style={{ flex: 1 }}><div className="garment-name">Complete your wardrobe</div><div className="garment-meta">Add the pieces you wear most</div></div><Link className="btn btn-quiet" href="/wardrobe"><Plus size={14} /></Link></div>
            </div>
          </section>
          <section className="card card-pad">
            <SectionHeader title="FITDAY intelligence" note="What powers your recommendations" />
            <div className="notice">La prima versione usa un motore di regole trasparente. Il passaggio successivo aggiungerà preferenze personali, colori, meteo, occasioni e storico degli outfit tramite AI.</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 15, fontSize: 11 }}><span className="muted">Clean garments available</span><strong>{cleanCount}</strong></div>
            <div style={{ height: 8, background: "var(--paper-2)", border: "2px solid var(--ink)", marginTop: 8, overflow: "hidden" }}><div style={{ height: "100%", width: `${garments.length ? cleanCount / garments.length * 100 : 0}%`, background: "var(--volt)" }} /></div>
          </section>
          {signedIn === false && <section className="card card-pad"><div className="card-title">Save your wardrobe across devices</div><p className="muted small" style={{ lineHeight: 1.7 }}>Accedi per collegare il tuo guardaroba personale a Supabase.</p><Link className="btn btn-primary" href="/login">Sign in <ArrowUpRight size={13} /></Link></section>}
        </div>
      </div>
    </AppShell>
  );
}
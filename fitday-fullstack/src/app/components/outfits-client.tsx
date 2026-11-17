"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Sparkles, CalendarDays, Shirt } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import type { Garment, Outfit } from "@/types/wardrobe";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
function colorHex(color?: string | null) {
  if (!color) return "#71806e";
  if (color.startsWith("#")) return color;
  const map: Record<string,string> = { black:"#282a29", white:"#eeeae1", grey:"#858984", gray:"#858984", navy:"#34465c", blue:"#587895", beige:"#c5b49a", brown:"#75533f", green:"#667b64" };
  return map[color.toLowerCase()] ?? "#71806e";
}

export function OutfitsClient() {
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch(`/api/outfits/today?date=${today()}`, { cache: "no-store" }); const payload = await res.json(); if (!res.ok) throw new Error(payload.error); setOutfit(payload.outfit); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not load outfit."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function generate() {
    setGenerating(true); setMessage("");
    try { const res = await fetch("/api/outfits/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: today() }) }); const payload = await res.json(); if (!res.ok) throw new Error(payload.error); setOutfit(payload.outfit); setMessage(payload.missing?.length ? `Missing: ${payload.missing.join(", ")}` : "Today's outfit is ready."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Could not generate outfit."); }
    finally { setGenerating(false); }
  }
  const items = (outfit?.items ?? []) as Garment[];
  const top = items.find((g) => ["tshirt","hoodie","crewneck"].includes(g.category));
  const bottom = items.find((g) => ["jeans","trousers"].includes(g.category));
  const shoes = items.find((g) => g.category === "shoes");
  const icon: Record<string,string> = { tshirt:"👕", hoodie:"🧥", crewneck:"🧶", jeans:"👖", trousers:"👖", socks:"🧦", shoes:"👟", other:"✳️" };
  return <AppShell title="Outfit diary" eyebrow="Your looks, day by day" action={<button className="btn btn-primary" onClick={generate} disabled={generating}>{generating ? <RefreshCw size={14}/> : <Sparkles size={14}/>} Generate today</button>}>
    <div className="page-section">
      <section className="card" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(260px,.9fr)", background: "#f1f3ea" }}>
        <div className="card-pad" style={{ alignSelf: "center" }}><span className="pill pill-green"><CalendarDays size={11} style={{ marginRight: 5 }}/> {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</span><h2 style={{ fontSize: 35, lineHeight: 1, letterSpacing: "-.06em", margin: "18px 0 10px" }}>Today's<br/>combination.</h2><p className="muted small" style={{ lineHeight: 1.7 }}>{outfit?.rationale ?? "Generate an outfit from your pieces that are currently clean and available."}</p><button className="btn btn-primary" style={{ marginTop: 17 }} onClick={generate} disabled={generating}>{generating ? "Generating…" : "Regenerate outfit"} <RefreshCw size={13}/></button>{message && <p className="muted small" style={{ marginTop: 12 }}>{message}</p>}</div>
        <div style={{ minHeight: 340 }}><AvatarViewer topColor={colorHex(top?.color_hex ?? top?.color)} bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)} shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)} height={360}/></div>
      </section>
      <section className="card card-pad"><SectionHeader title="The pieces" note="Only clean garments are eligible for outfit generation."/>
        {loading ? <div className="loading">Loading outfit…</div> : items.length === 0 ? <div className="empty-state"><div className="empty-icon"><Shirt size={20}/></div><div className="card-title">No outfit yet</div><p className="small">Add a few clean garments, then let FITDAY create your first look.</p><Link className="btn btn-primary" href="/wardrobe" style={{ marginTop: 12 }}>Open wardrobe</Link></div> : <div className="outfit-list">{items.map((g) => <div className="outfit-item" key={g.id}><div className="outfit-swatch" style={{ background: `${colorHex(g.color_hex ?? g.color)}22` }}>{icon[g.category] ?? "✳️"}</div><div style={{ flex: 1 }}><div className="garment-name">{g.name}</div><div className="garment-meta">{g.brand || g.category} · {g.color} · {g.fit}</div></div><span className="pill pill-green">Clean</span></div>)}</div>}
      </section>
    </div>
  </AppShell>;
}

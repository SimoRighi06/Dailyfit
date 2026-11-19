"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { colorHex, garmentImageUrl, safeJson, categoryInitials } from "@/lib/garment-utils";
import type { Garment, Outfit } from "@/types/wardrobe";

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export default function AvatarPage() {
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/outfits/today?date=${today()}`, { cache: "no-store" });
    const p = await safeJson(res);
    console.log("📥 [avatar-page] today →", res.status, p?.outfit?.items?.length ?? p?.error);
    if (res.ok) setOutfit(p?.outfit ?? null);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const items = (outfit?.items ?? []) as Garment[];
  const top = items.find(g => ["tshirt", "hoodie", "crewneck"].includes(g.category));
  const bottom = items.find(g => ["jeans", "trousers"].includes(g.category));
  const shoes = items.find(g => g.category === "shoes");

  return (
    <AppShell title="My avatar" eyebrow="Il look di oggi, indossato davvero"
      action={<Link className="btn btn-primary" href="/outfits">VAI AI LOOK <ArrowUpRight size={13} /></Link>}>
      <div className="stack">
        <section className="card" style={{ boxShadow: "var(--shadow-lg)" }}>
          {loading ? <div className="loading" style={{ padding: 24 }}>Vesto l'avatar…</div> : (
            <AvatarViewer controls height={480}
              topColor={colorHex(top?.color_hex ?? top?.color)} bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)} shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)}
              topPhoto={garmentImageUrl(top)} bottomPhoto={garmentImageUrl(bottom)} shoePhoto={garmentImageUrl(shoes)} />
          )}
        </section>
        <section className="card card-pad">
          <SectionHeader title="Capi indossati" note="Le foto dei capi diventano texture 3D · senza foto usa il colore" />
          <div className="outfit-list">
            {[top, bottom, shoes].filter(Boolean).map(g => (
              <div className="outfit-item" key={g!.id}>
                <div className="outfit-swatch" style={{ background: `${colorHex(g!.color_hex ?? g!.color)}22` }}>
                  {garmentImageUrl(g) ? <img src={garmentImageUrl(g)!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontFamily: "var(--ff-display)", fontSize: 16 }}>{categoryInitials(g!.category)}</span>}
                </div>
                <div style={{ flex: 1 }}><div className="garment-name">{g!.name}</div><div className="garment-meta">{g!.brand || g!.category} · {g!.color} · {garmentImageUrl(g) ? "FOTO 3D ATTIVA" : "COLORE"}</div></div>
                <Link className="btn btn-quiet" href={`/wardrobe?g=${g!.id}`}>DETTAGLIO</Link>
              </div>
            ))}
            {items.length === 0 && !loading && <div className="empty-state"><div className="card-title">Nessun look oggi</div><p className="small">Genera un outfit per vestire l'avatar.</p><Link className="btn btn-primary" style={{ marginTop: 10 }} href="/outfits">GENERA LOOK</Link></div>}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
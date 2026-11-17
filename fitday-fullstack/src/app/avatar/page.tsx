"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, SectionHeader } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { Rotate3D, Sparkles } from "lucide-react";

const palettes = [
  { label: "Sage", top: "#71816d", bottom: "#42566a", shoe: "#f0eee4" },
  { label: "Monochrome", top: "#303331", bottom: "#3d403f", shoe: "#e8e7e1" },
  { label: "Warm earth", top: "#b77f59", bottom: "#76604d", shoe: "#e3d4bd" },
  { label: "Blue hour", top: "#526f8f", bottom: "#273d54", shoe: "#f0f0eb" },
];

export default function AvatarPage() {
  const [palette, setPalette] = useState(palettes[0]);
  const [saveMessage, setSaveMessage] = useState("Changes are previewed locally until you sign in.");

  useEffect(() => {
    let active = true;
    fetch("/api/avatar", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json();
      const saved = palettes.find((p) => p.label === payload.avatar?.config?.preferredPalette);
      if (active && saved) setPalette(saved);
      if (active && payload.avatar) setSaveMessage("Avatar preferences synced to your account.");
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function choosePalette(next: typeof palettes[number]) {
    setPalette(next);
    setSaveMessage("Saving preference…");
    try {
      const response = await fetch("/api/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: { bodyType: "standard", skinTone: "medium", hairStyle: "short", hairColor: "brown", preferredPalette: next.label } }),
      });
      setSaveMessage(response.ok ? "Preference saved to your profile." : response.status === 401 ? "Preview only — sign in to sync your avatar." : "Could not sync this preference yet.");
    } catch { setSaveMessage("Offline preview — preference not synced."); }
  }

  return <AppShell title="Your digital twin" eyebrow="Avatar studio">
    <div className="grid-main">
      <section className="card" style={{ background: "#f0f2e9" }}>
        <div style={{ padding: "22px 22px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span className="pill pill-green"><Sparkles size={11} style={{ marginRight: 5 }}/> 3D PREVIEW</span><span className="muted small"><Rotate3D size={13} style={{ verticalAlign: "middle", marginRight: 4 }}/>Drag to rotate</span></div>
        <AvatarViewer topColor={palette.top} bottomColor={palette.bottom} shoeColor={palette.shoe} height={530}/>
        <div style={{ padding: 18, textAlign: "center" }} className="muted small">Avatar 3D dimostrativo · il modello personale verrà configurato nel prossimo step</div>
      </section>
      <div className="stack">
        <section className="card card-pad"><SectionHeader title="Outfit preview" note="Try a colour direction"/>
          <div style={{ display: "grid", gap: 8 }}>{palettes.map((p) => <button key={p.label} className="outfit-item" style={{ background: palette.label === p.label ? "#f4f6ee" : "#fff", borderColor: palette.label === p.label ? "#c4d88b" : "var(--line)", textAlign: "left" }} onClick={() => void choosePalette(p)}><div style={{ display: "flex", gap: 4 }}><i style={{ width: 17, height: 30, borderRadius: 5, background: p.top }}/><i style={{ width: 17, height: 30, borderRadius: 5, background: p.bottom }}/><i style={{ width: 17, height: 30, borderRadius: 5, background: p.shoe }}/></div><strong style={{ flex: 1, fontSize: 12 }}>{p.label}</strong><span className="pill">{palette.label === p.label ? "Selected" : "Preview"}</span></button>)}</div>
        </section>
        <section className="card card-pad"><SectionHeader title="Your body profile" note="Personalisation options — next milestone"/>
          <div className="notice">{saveMessage}<br/>Per ottenere una vestibilità credibile, FITDAY dovrà usare un avatar riggato e configurabile. In questa build è presente un manichino 3D dimostrativo con rotazione e cambio colore dei capi.</div>
          <div style={{ display: "grid", gap: 9, marginTop: 15 }}><div className="outfit-item"><span className="muted small" style={{ flex: 1 }}>Avatar model</span><strong className="small">Demo mannequin</strong></div><div className="outfit-item"><span className="muted small" style={{ flex: 1 }}>3D asset</span><strong className="small">GLB / glTF planned</strong></div><div className="outfit-item"><span className="muted small" style={{ flex: 1 }}>Garment fitting</span><strong className="small">Phase 2</strong></div></div>
          <Link className="btn btn-primary" href="/wardrobe" style={{ width: "100%", marginTop: 14 }}>Open wardrobe</Link>
        </section>
      </div>
    </div>
  </AppShell>;
}

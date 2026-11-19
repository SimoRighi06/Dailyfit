import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GARMENT_BUCKET } from "@/lib/garment-utils";

function withUrl(supabase: any, g: any) {
  if (!g) return g;
  const base = g.image_path ? supabase.storage.from(GARMENT_BUCKET).getPublicUrl(g.image_path).data.publicUrl : null;
  return { ...g, image_url: base ? `${base}?v=${encodeURIComponent(g.updated_at ?? "")}` : null };
}
const mapOutfit = (supabase: any, o: any) => ({ ...o, items: (o.outfit_items ?? []).map((oi: any) => withUrl(supabase, oi.garments)).filter(Boolean) });

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    const { data, error } = await supabase.from("outfits")
      .select("*, outfit_items(garment_id, garments(*))")
      .eq("user_id", user.id).order("outfit_date", { ascending: false });
    if (error) { console.error("❌ [GET outfits]", error.message, error.code); return NextResponse.json({ error: error.message }, { status: 500 }); }
    console.log("✅ [GET outfits]", data?.length ?? 0, "look nello storico");
    return NextResponse.json({ outfits: (data ?? []).map((o: any) => mapOutfit(supabase, o)) });
  } catch (e: any) { console.error("💥 [GET outfits]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    const body = await request.json();
    const date = String(body.date ?? "").slice(0, 10);
    const ids: string[] = Array.isArray(body.garment_ids) ? body.garment_ids.map(String) : [];
    console.log("📥 [POST outfits] riuso/creazione →", date, ids.length, "capi");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || ids.length === 0) return NextResponse.json({ error: "Data o capi non validi." }, { status: 400 });

    const { data: garments, error: gErr } = await supabase.from("garments").select("*").eq("user_id", user.id).in("id", ids);
    if (gErr || !garments || garments.length !== ids.length) { console.error("❌ [POST outfits] capi:", gErr?.message); return NextResponse.json({ error: "Alcuni capi non esistono più nel guardaroba." }, { status: 400 }); }

    const title = String(body.title ?? "").trim() || garments.map(g => g.color).join(" + ");
    const rationale = String(body.rationale ?? "").trim() || `Look riproposto: ${garments.map(g => g.name).join(", ")}.`;
    const { data: outfit, error: oErr } = await supabase.from("outfits")
      .upsert({ user_id: user.id, outfit_date: date, title, rationale, occasion: body.occasion ?? "street", weather_summary: null }, { onConflict: "user_id,outfit_date" })
      .select().single();
    if (oErr || !outfit) { console.error("❌ [POST outfits] upsert:", oErr?.message); return NextResponse.json({ error: oErr?.message ?? "Errore outfit" }, { status: 500 }); }

    await supabase.from("outfit_items").delete().eq("outfit_id", outfit.id);
    const { error: iErr } = await supabase.from("outfit_items").insert(ids.map(id => ({ outfit_id: outfit.id, garment_id: id })));
    if (iErr) { console.error("❌ [POST outfits] items:", iErr.message); return NextResponse.json({ error: iErr.message }, { status: 500 }); }
    console.log("✅ [POST outfits] salvato:", outfit.id, date);
    return NextResponse.json({ outfit: { ...outfit, items: garments.map((g: any) => withUrl(supabase, g)) } });
  } catch (e: any) { console.error("💥 [POST outfits]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}
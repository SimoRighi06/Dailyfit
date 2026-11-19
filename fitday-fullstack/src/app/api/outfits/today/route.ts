import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

    console.log(`🔎 [GET /api/outfits/today] utente: ${user.id}, data: ${date}`);

    // Cerca un outfit esistente per oggi
    const { data: outfit, error: outfitError } = await supabase
      .from("outfits")
      .select("*, outfit_items(garment_id, garments(*))")
      .eq("user_id", user.id)
      .eq("outfit_date", date)
      .single();

    if (outfitError && outfitError.code !== "PGRST116") {
      console.error("❌ [GET /api/outfits/today] errore DB:", outfitError.message);
      return NextResponse.json({ error: outfitError.message }, { status: 500 });
    }

    if (outfit) {
      const items = outfit.outfit_items?.map((oi: any) => oi.garments).filter(Boolean) ?? [];
      console.log(`✅ [GET /api/outfits/today] trovato outfit: ${outfit.title}, ${items.length} capi`);
      return NextResponse.json({ outfit: { ...outfit, items } });
    }

    // Nessun outfit per oggi → genera uno al volo dai capi puliti
    const { data: cleanGarments, error: garmentsError } = await supabase
      .from("garments")
      .select("*")
      .eq("user_id", user.id)
      .eq("laundry_status", "clean");

    if (garmentsError) {
      console.error("❌ [GET /api/outfits/today] errore capi:", garmentsError.message);
      return NextResponse.json({ error: garmentsError.message }, { status: 500 });
    }

    const top = cleanGarments?.find((g) => ["tshirt", "hoodie", "crewneck"].includes(g.category));
    const bottom = cleanGarments?.find((g) => ["jeans", "trousers"].includes(g.category));
    const shoes = cleanGarments?.find((g) => g.category === "shoes");

    const generatedOutfit = {
      id: "temp-" + Date.now(),
      user_id: user.id,
      outfit_date: date,
      title: "Look del giorno",
      rationale: "Combinazione automatica dai tuoi capi puliti disponibili.",
      occasion: "everyday",
      weather_summary: null,
      created_at: new Date().toISOString(),
      items: [top, bottom, shoes].filter(Boolean),
    };

    console.log(`✅ [GET /api/outfits/today] generato al volo: ${generatedOutfit.items.length} capi`);
    return NextResponse.json({ outfit: generatedOutfit });
  } catch (e: any) {
    console.error("💥 [GET /api/outfits/today] errore fatale:", e?.message);
    return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 });
  }
}
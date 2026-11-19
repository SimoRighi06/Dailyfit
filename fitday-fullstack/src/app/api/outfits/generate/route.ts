import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const body = await request.json();
    const date = body.date ?? new Date().toISOString().split("T")[0];

    console.log(`🔎 [POST /api/outfits/generate] utente: ${user.id}, data: ${date}`);

    // Prendi tutti i capi puliti
    const { data: cleanGarments, error: garmentsError } = await supabase
      .from("garments")
      .select("*")
      .eq("user_id", user.id)
      .eq("laundry_status", "clean");

    if (garmentsError) {
      console.error("❌ [POST /api/outfits/generate] errore capi:", garmentsError.message);
      return NextResponse.json({ error: garmentsError.message }, { status: 500 });
    }

    if (!cleanGarments || cleanGarments.length === 0) {
      return NextResponse.json({ 
        error: "Nessun capo pulito disponibile. Lava qualcosa!", 
        missing: ["tutti i capi sono sporchi"] 
      }, { status: 400 });
    }

    // Seleziona casualmente un top, un bottom e scarpe
    const tops = cleanGarments.filter((g) => ["tshirt", "hoodie", "crewneck"].includes(g.category));
    const bottoms = cleanGarments.filter((g) => ["jeans", "trousers"].includes(g.category));
    const shoesList = cleanGarments.filter((g) => g.category === "shoes");

    const missing: string[] = [];
    if (tops.length === 0) missing.push("magliette/felpe");
    if (bottoms.length === 0) missing.push("pantaloni/jeans");
    if (shoesList.length === 0) missing.push("scarpe");

    const top = tops[Math.floor(Math.random() * tops.length)];
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    const shoes = shoesList[Math.floor(Math.random() * shoesList.length)];

    const selectedItems = [top, bottom, shoes].filter(Boolean);

    if (selectedItems.length < 3) {
      console.log(`⚠️ [POST /api/outfits/generate] mancano categorie: ${missing.join(", ")}`);
      return NextResponse.json({ 
        outfit: null, 
        missing,
        error: `Mancano: ${missing.join(", ")}. Aggiungi capi puliti di quelle categorie.`
      }, { status: 400 });
    }

    // Crea l'outfit nel database
    const title = `${top.color} + ${bottom.color}`;
    const rationale = `Look generato: ${top.name} con ${bottom.name} e ${shoes.name}.`;

    const { data: newOutfit, error: insertError } = await supabase
      .from("outfits")
      .insert({
        user_id: user.id,
        outfit_date: date,
        title,
        rationale,
        occasion: "street",
        weather_summary: null,
      })
      .select()
      .single();

    if (insertError) {
      // Se esiste già un outfit per oggi, aggiornalo invece di crearne uno nuovo
      if (insertError.code === "23505") {
        console.log(`🔄 [POST /api/outfits/generate] outfit già esistente per ${date}, aggiorno...`);
        
        const { data: existingOutfit } = await supabase
          .from("outfits")
          .select("id")
          .eq("user_id", user.id)
          .eq("outfit_date", date)
          .single();

        if (existingOutfit) {
          // Cancella i vecchi item
          await supabase.from("outfit_items").delete().eq("outfit_id", existingOutfit.id);

          // Aggiorna l'outfit
          const { data: updatedOutfit, error: updateError } = await supabase
            .from("outfits")
            .update({ title, rationale })
            .eq("id", existingOutfit.id)
            .select()
            .single();

          if (updateError) {
            console.error("❌ [POST /api/outfits/generate] errore update:", updateError.message);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
          }

          // Inserisci i nuovi item
          const itemRows = selectedItems.map((g) => ({ outfit_id: existingOutfit.id, garment_id: g!.id }));
          await supabase.from("outfit_items").insert(itemRows);

          console.log(`✅ [POST /api/outfits/generate] outfit aggiornato: ${title}`);
          return NextResponse.json({ 
            outfit: { ...updatedOutfit, items: selectedItems }, 
            missing: [] 
          });
        }
      }

      console.error("❌ [POST /api/outfits/generate] errore insert:", insertError.message);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Inserisci i collegamenti outfit ↔ capi
    const itemRows = selectedItems.map((g) => ({ outfit_id: newOutfit.id, garment_id: g!.id }));
    const { error: itemsError } = await supabase.from("outfit_items").insert(itemRows);

    if (itemsError) {
      console.error("❌ [POST /api/outfits/generate] errore outfit_items:", itemsError.message);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    console.log(`✅ [POST /api/outfits/generate] outfit creato: ${newOutfit.id}, ${selectedItems.length} capi`);
    return NextResponse.json({ 
      outfit: { ...newOutfit, items: selectedItems }, 
      missing: [] 
    });
  } catch (e: any) {
    console.error("💥 [POST /api/outfits/generate] errore fatale:", e?.message);
    return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 });
  }
}
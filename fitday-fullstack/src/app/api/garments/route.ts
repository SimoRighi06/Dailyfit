// src/app/api/garments/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("🔎 [GET /api/garments] utente:", user?.id ?? "NESSUNO", "| authError:", authError?.message ?? "nessuno");

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato. Fai il login." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("garments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [GET /api/garments] errore database:", error.message, "| codice:", error.code);
      return NextResponse.json({ error: `Database: ${error.message}` }, { status: 500 });
    }

    console.log("✅ [GET /api/garments] trovati", data?.length ?? 0, "capi");
    return NextResponse.json({ garments: data ?? [] });
  } catch (e) {
    console.error("💥 [GET /api/garments] errore fatale:", e);
    return NextResponse.json({ error: "Errore interno del server. Controlla il terminale." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("🔎 [POST /api/garments] utente:", user?.id ?? "NESSUNO", "| authError:", authError?.message ?? "nessuno");

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorizzato. Fai il login." }, { status: 401 });
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      console.error("❌ [POST /api/garments] il body della richiesta non è JSON valido");
      return NextResponse.json({ error: "Body della richiesta non valido." }, { status: 400 });
    }

    console.log("📦 [POST /api/garments] body ricevuto:", JSON.stringify(body));

    if (!body.name || !body.category || !body.color) {
      return NextResponse.json({ error: "Nome, categoria e colore sono obbligatori." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("garments")
      .insert({
        user_id: user.id,
        name: body.name,
        category: body.category,
        brand: body.brand ?? null,
        color: body.color,
        color_hex: body.color_hex ?? null,
        fit: body.fit ?? "regular",
        laundry_status: body.laundry_status ?? "clean",
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ [POST /api/garments] errore database:", error.message, "| codice:", error.code, "| dettagli:", error.details);
      return NextResponse.json({ error: `Database: ${error.message}` }, { status: 500 });
    }

    console.log("✅ [POST /api/garments] capo creato con id:", data.id);
    return NextResponse.json({ garment: data });
  } catch (e) {
    console.error("💥 [POST /api/garments] errore fatale:", e);
    return NextResponse.json({ error: "Errore interno del server. Controlla il terminale." }, { status: 500 });
  }
}
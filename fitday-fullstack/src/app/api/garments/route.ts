import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingSupabaseConfig, jsonError } from "@/lib/http";
import { createGarmentSchema } from "@/lib/validation/garment";

export const runtime = "nodejs";

async function getUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return data.claims.sub;
}

export async function GET() {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const userId = await getUser(supabase);
  if (!userId) return jsonError("Devi accedere per vedere il guardaroba.", 401);

  const { data, error } = await supabase
    .from("garments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, 500);
  const garments = await Promise.all((data ?? []).map(async (garment) => {
    if (!garment.image_path) return { ...garment, image_url: null };
    const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrl(garment.image_path, 60 * 30);
    return { ...garment, image_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json({ garments });
}

export async function POST(request: Request) {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const userId = await getUser(supabase);
  if (!userId) return jsonError("Devi accedere per aggiungere un capo.", 401);

  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("JSON non valido."); }
  const parsed = createGarmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Controlla i campi del capo.", details: parsed.error.flatten() }, { status: 422 });

  const { data, error } = await supabase
    .from("garments")
    .insert({ ...parsed.data, user_id: userId })
    .select("*")
    .single();

  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ garment: data }, { status: 201 });
}

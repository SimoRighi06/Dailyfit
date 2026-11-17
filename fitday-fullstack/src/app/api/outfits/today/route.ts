import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingSupabaseConfig, jsonError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return jsonError("Non autorizzato.", 401);

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const { data: outfit, error } = await supabase
    .from("outfits")
    .select("*")
    .eq("user_id", userId)
    .eq("outfit_date", date)
    .maybeSingle();
  if (error) return jsonError(error.message, 500);
  if (!outfit) return NextResponse.json({ outfit: null });

  const { data: links, error: linksError } = await supabase
    .from("outfit_items")
    .select("position, garments(*)")
    .eq("outfit_id", outfit.id)
    .order("position");
  if (linksError) return jsonError(linksError.message, 500);

  const items = await Promise.all((links ?? []).map(async (link) => {
    const garment = link.garments as unknown as Record<string, unknown>;
    const imagePath = garment.image_path as string | null;
    if (!imagePath) return garment;
    const { data: signed } = await supabase.storage.from("wardrobe").createSignedUrl(imagePath, 60 * 30);
    return { ...garment, image_url: signed?.signedUrl ?? null };
  }));

  return NextResponse.json({ outfit: { ...outfit, items } });
}

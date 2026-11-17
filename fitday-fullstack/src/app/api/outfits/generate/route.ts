import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildDailyOutfit } from "@/lib/outfit-engine";
import { generateAiOutfit } from "@/lib/ai-outfit";
import { isMissingSupabaseConfig, jsonError } from "@/lib/http";

export const runtime = "nodejs";
const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  occasion: z.string().trim().max(50).optional(),
});

export async function POST(request: Request) {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return jsonError("Accedi per generare il tuo outfit.", 401);

  let raw: unknown = {};
  try { raw = await request.json(); } catch { /* empty body is valid */ }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return jsonError("Richiesta non valida.", 422);
  const outfitDate = parsed.data.date ?? new Date().toISOString().slice(0, 10);

  const { data: garments, error: garmentsError } = await supabase
    .from("garments")
    .select("*")
    .eq("user_id", userId)
    .eq("laundry_status", "clean");
  if (garmentsError) return jsonError(garmentsError.message, 500);

  const aiResult = await generateAiOutfit(garments ?? [], parsed.data.occasion);
  const result = aiResult ?? buildDailyOutfit(garments ?? [], Number(outfitDate.replaceAll("-", "")));
  if (result.items.length === 0) {
    return NextResponse.json({ error: "Non hai ancora abbastanza capi puliti per creare un outfit.", missing: result.missing }, { status: 409 });
  }

  const { data: outfit, error: outfitError } = await supabase
    .from("outfits")
    .upsert({
      user_id: userId,
      outfit_date: outfitDate,
      title: result.title,
      rationale: result.rationale,
      occasion: parsed.data.occasion ?? null,
    }, { onConflict: "user_id,outfit_date" })
    .select("*")
    .single();
  if (outfitError) return jsonError(outfitError.message, 500);

  const { error: clearError } = await supabase.from("outfit_items").delete().eq("outfit_id", outfit.id);
  if (clearError) return jsonError(clearError.message, 500);
  const { error: itemsError } = await supabase.from("outfit_items").insert(
    result.items.map((garment, position) => ({ outfit_id: outfit.id, garment_id: garment.id, position })),
  );
  if (itemsError) return jsonError(itemsError.message, 500);

  return NextResponse.json({ outfit: { ...outfit, items: result.items }, missing: result.missing, source: aiResult ? "ai" : "rules" });
}

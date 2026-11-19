import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isMissingSupabaseConfig, jsonError } from "@/lib/http";

export const runtime = "nodejs";
const avatarSchema = z.object({
  model_path: z.string().max(500).nullable().optional(),
  config: z.object({
    bodyType: z.string().max(40).optional(),
    skinTone: z.string().max(40).optional(),
    hairStyle: z.string().max(40).optional(),
    hairColor: z.string().max(40).optional(),
    preferredPalette: z.string().max(40).optional(),
  }).passthrough().optional(),
});

export async function GET() {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return jsonError("Non autorizzato.", 401);
  const { data, error } = await supabase.from("avatar_profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) return jsonError(error.message, 500); 
  return NextResponse.json({ avatar: data });
}

export async function PATCH(request: Request) {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return jsonError("Non autorizzato.", 401);
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("JSON non valido."); }
  const parsed = avatarSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError("Configurazione avatar non valida.", 422);
  const { data, error } = await supabase.from("avatar_profiles")
    .upsert({ user_id: userId, ...parsed.data }, { onConflict: "user_id" })
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ avatar: data });
}

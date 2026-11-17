import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isMissingSupabaseConfig, jsonError } from "@/lib/http";
import { updateGarmentSchema } from "@/lib/validation/garment";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return jsonError("Non autorizzato.", 401);
  const { id } = await context.params;
  let body: unknown;
  try { body = await request.json(); } catch { return jsonError("JSON non valido."); }
  const parsed = updateGarmentSchema.safeParse(body);
  if (!parsed.success || Object.keys(parsed.data).length === 0) return jsonError("Dati del capo non validi.", 422);

  const { data, error } = await supabase
    .from("garments")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ garment: data });
}

export async function DELETE(_request: Request, context: Context) {
  if (isMissingSupabaseConfig()) return jsonError("Supabase non è configurato.", 503);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return jsonError("Non autorizzato.", 401);
  const { id } = await context.params;
  const { error } = await supabase.from("garments").delete().eq("id", id).eq("user_id", userId);
  if (error) return jsonError(error.message, 500);
  return new NextResponse(null, { status: 204 });
}

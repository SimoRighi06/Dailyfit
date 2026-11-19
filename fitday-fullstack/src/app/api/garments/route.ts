import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GARMENT_BUCKET } from "@/lib/garment-utils";
import { GARMENT_CATEGORIES, GARMENT_FITS, LAUNDRY_STATUSES } from "@/types/wardrobe";

const MAX_PHOTO = 5 * 1024 * 1024;
const clean = (v: unknown) => String(v ?? "").trim();

function withUrl(supabase: any, g: any) {
  if (!g) return g;
  const base = g.image_path ? supabase.storage.from(GARMENT_BUCKET).getPublicUrl(g.image_path).data.publicUrl : null;
  return { ...g, image_url: base ? `${base}?v=${encodeURIComponent(g.updated_at ?? "")}` : null };
}

async function readPayload(request: Request) {
  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const fd = await request.formData();
    const photo = fd.get("photo");
    const fields: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) if (k !== "photo") fields[k] = v;
    return { fields, photo: photo instanceof File && photo.size > 0 ? photo : null };
  }
  return { fields: (await request.json()) as Record<string, unknown>, photo: null };
}

function validate(fields: Record<string, unknown>, partial = false) {
  const out: Record<string, unknown> = {};
  const str = (k: string) => (fields[k] !== undefined ? clean(fields[k]) : undefined);
  if (!partial || fields.name !== undefined) { const v = str("name"); if (!v) return { error: "Il nome è obbligatorio." }; out.name = v; }
  if (!partial || fields.category !== undefined) { const v = str("category"); if (!GARMENT_CATEGORIES.includes(v as any)) return { error: `Categoria non valida: ${v}` }; out.category = v; }
  if (!partial || fields.color !== undefined) { const v = str("color"); if (!v) return { error: "Il colore è obbligatorio." }; out.color = v; }
  for (const k of ["brand", "color_hex", "notes"] as const) { const v = str(k); if (v !== undefined) out[k] = v === "" ? null : v; }
  if (fields.fit !== undefined) { const v = str("fit"); if (!GARMENT_FITS.includes(v as any)) return { error: `Fit non valido: ${v}` }; out.fit = v; }
  else if (!partial) out.fit = "regular";
  if (fields.laundry_status !== undefined) { const v = str("laundry_status"); if (!LAUNDRY_STATUSES.includes(v as any)) return { error: `Stato non valido: ${v}` }; out.laundry_status = v; }
  else if (!partial) out.laundry_status = "clean";
  return { data: out };
}

async function uploadPhoto(supabase: any, userId: string, photo: File) {
  if (photo.size > MAX_PHOTO) return { error: "Foto troppo grande (max 5 MB)." };
  if (!photo.type.startsWith("image/")) return { error: "Il file deve essere un'immagine." };
  const ext = (photo.name.split(".").pop() || photo.type.split("/")[1] || "jpg").toLowerCase().replace("jpeg", "jpg");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  console.log("📷 [garments] upload foto →", path, `${(photo.size / 1024).toFixed(0)}KB`);
  const { error } = await supabase.storage.from(GARMENT_BUCKET).upload(path, photo, { contentType: photo.type, upsert: false });
  if (error) { console.error("❌ [garments] upload storage:", error.message); return { error: `Upload foto: ${error.message}` }; }
  return { path };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato. Fai il login." }, { status: 401 });
    const { data, error } = await supabase.from("garments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { console.error("❌ [GET garments]", error.message, error.code); return NextResponse.json({ error: `Database: ${error.message}` }, { status: 500 }); }
    console.log("✅ [GET garments]", data?.length ?? 0, "capi");
    return NextResponse.json({ garments: (data ?? []).map((g: any) => withUrl(supabase, g)) });
  } catch (e: any) { console.error("💥 [GET garments]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato. Fai il login." }, { status: 401 });

    const { fields, photo } = await readPayload(request);
    console.log("📥 [POST garments] campi:", JSON.stringify(fields), "| foto:", photo?.name ?? "no");
    const v = validate(fields);
    if ("error" in v) return NextResponse.json({ error: v.error }, { status: 400 });

    const row: Record<string, unknown> = { ...v.data, user_id: user.id };
    if (typeof fields.id === "string" && /^[0-9a-f-]{36}$/i.test(fields.id)) row.id = fields.id; // restore (undo)
    if (typeof fields.image_path === "string" && fields.image_path.startsWith(`${user.id}/`)) row.image_path = fields.image_path;

    if (photo) {
      const up = await uploadPhoto(supabase, user.id, photo);
      if ("error" in up) return NextResponse.json({ error: up.error }, { status: 400 });
      row.image_path = up.path;
    }

    const { data, error } = await supabase.from("garments").upsert(row, { onConflict: "id" }).select().single();
    if (error) { console.error("❌ [POST garments] DB:", error.message, error.code); return NextResponse.json({ error: `Database: ${error.message}` }, { status: 500 }); }
    console.log("✅ [POST garments] creato:", data.id, data.name);
    return NextResponse.json({ garment: withUrl(supabase, data) });
  } catch (e: any) { console.error("💥 [POST garments]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}
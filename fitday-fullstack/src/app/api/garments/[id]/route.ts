import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GARMENT_BUCKET } from "@/lib/garment-utils";
import { GARMENT_CATEGORIES, GARMENT_FITS, LAUNDRY_STATUSES } from "@/types/wardrobe";

const clean = (v: unknown) => String(v ?? "").trim();
function withUrl(supabase: any, g: any) {
  if (!g) return g;
  const base = g.image_path ? supabase.storage.from(GARMENT_BUCKET).getPublicUrl(g.image_path).data.publicUrl : null;
  return { ...g, image_url: base ? `${base}?v=${encodeURIComponent(g.updated_at ?? "")}` : null };
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    const { data, error } = await supabase.from("garments").select("*").eq("id", id).eq("user_id", user.id).single();
    if (error || !data) return NextResponse.json({ error: "Capo non trovato" }, { status: 404 });
    return NextResponse.json({ garment: withUrl(supabase, data) });
  } catch (e: any) { console.error("💥 [GET garment:id]", e?.message); return NextResponse.json({ error: e?.message }, { status: 500 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

    const ct = request.headers.get("content-type") ?? "";
    let fields: Record<string, unknown>; let photo: File | null = null;
    if (ct.includes("multipart/form-data")) {
      const fd = await request.formData(); fields = {};
      for (const [k, v] of fd.entries()) if (k !== "photo") fields[k] = v;
      const p = fd.get("photo"); photo = p instanceof File && p.size > 0 ? p : null;
    } else fields = await request.json();

    console.log("📥 [PATCH garment]", id, JSON.stringify(fields), "| foto:", photo?.name ?? "no");
    const patch: Record<string, unknown> = {};
    for (const k of ["name", "brand", "color", "color_hex", "notes"] as const)
      if (fields[k] !== undefined) { const v = clean(fields[k]); patch[k] = k === "name" || k === "color" ? v : v === "" ? null : v; }
    if (patch.name === "" || patch.color === "") return NextResponse.json({ error: "Nome e colore non possono essere vuoti." }, { status: 400 });
    if (fields.category !== undefined) { const v = clean(fields.category); if (!GARMENT_CATEGORIES.includes(v as any)) return NextResponse.json({ error: "Categoria non valida" }, { status: 400 }); patch.category = v; }
    if (fields.fit !== undefined) { const v = clean(fields.fit); if (!GARMENT_FITS.includes(v as any)) return NextResponse.json({ error: "Fit non valido" }, { status: 400 }); patch.fit = v; }
    if (fields.laundry_status !== undefined) { const v = clean(fields.laundry_status); if (!LAUNDRY_STATUSES.includes(v as any)) return NextResponse.json({ error: "Stato non valido" }, { status: 400 }); patch.laundry_status = v; }

    if (photo) {
      if (photo.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Foto troppo grande (max 5 MB)" }, { status: 400 });
      if (!photo.type.startsWith("image/")) return NextResponse.json({ error: "Il file deve essere un'immagine" }, { status: 400 });
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase().replace("jpeg", "jpg");
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      console.log("📷 [PATCH garment] upload →", path);
      const { error: upErr } = await supabase.storage.from(GARMENT_BUCKET).upload(path, photo, { contentType: photo.type });
      if (upErr) { console.error("❌ [PATCH garment] storage:", upErr.message); return NextResponse.json({ error: `Upload: ${upErr.message}` }, { status: 500 }); }
      patch.image_path = path; // il file precedente resta in storage (supporta undo)
    }
    if (fields.remove_photo === true || fields.remove_photo === "true") patch.image_path = null;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });

    const { data, error } = await supabase.from("garments").update(patch).eq("id", id).eq("user_id", user.id).select().single();
    if (error || !data) { console.error("❌ [PATCH garment] DB:", error?.message, error?.code); return NextResponse.json({ error: error?.message ?? "Capo non trovato" }, { status: error ? 500 : 404 }); }
    console.log("✅ [PATCH garment] aggiornato:", id, Object.keys(patch).join(","));
    return NextResponse.json({ garment: withUrl(supabase, data) });
  } catch (e: any) { console.error("💥 [PATCH garment]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    const { error } = await supabase.from("garments").delete().eq("id", id).eq("user_id", user.id);
    if (error) { console.error("❌ [DELETE garment]", error.message); return NextResponse.json({ error: error.message }, { status: 500 }); }
    console.log("✅ [DELETE garment] eliminato:", id, "(foto conservata per undo)");
    return NextResponse.json({ ok: true, id });
  } catch (e: any) { console.error("💥 [DELETE garment]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}
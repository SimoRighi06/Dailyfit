import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    const { error } = await supabase.from("outfits").delete().eq("id", id).eq("user_id", user.id);
    if (error) { console.error("❌ [DELETE outfit]", error.message); return NextResponse.json({ error: error.message }, { status: 500 }); }
    console.log("✅ [DELETE outfit] eliminato:", id);
    return NextResponse.json({ ok: true, id });
  } catch (e: any) { console.error("💥 [DELETE outfit]", e?.message); return NextResponse.json({ error: e?.message ?? "Errore interno" }, { status: 500 }); }
}
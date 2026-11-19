import type { Garment, LaundryStatus } from "@/types/wardrobe";

export const GARMENT_BUCKET = "garments";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function garmentImageUrl(g?: Pick<Garment, "image_path" | "image_url" | "updated_at"> | null): string | null {
  if (!g) return null;
  if (g.image_url) return g.image_url;
  if (!g.image_path || !SUPABASE_URL) return null;
  const bust = g.updated_at ? `?v=${encodeURIComponent(g.updated_at)}` : "";
  return `${SUPABASE_URL}/storage/v1/object/public/${GARMENT_BUCKET}/${g.image_path}${bust}`;
}

export function colorHex(color?: string | null): string {
  if (!color) return "#8f8f8f";
  if (color.startsWith("#")) return color;
  const map: Record<string, string> = {
    black: "#101010", white: "#f4f4f2", grey: "#8a8a8a", gray: "#8a8a8a",
    navy: "#1e2a44", blue: "#4a6fa5", beige: "#c9b896", cream: "#e8e0cc",
    brown: "#6b4a33", green: "#4d5f4b", olive: "#55603f", volt: "#d8ff00",
    burgundy: "#5e2b3a", red: "#a33b34",
  };
  return map[color.toLowerCase()] ?? "#8f8f8f";
}

export function categoryInitials(cat: string): string {
  const map: Record<string, string> = { tshirt: "TS", hoodie: "HD", crewneck: "CR", jeans: "JN", trousers: "TR", socks: "SK", shoes: "SH", other: "OT" };
  return map[cat] ?? cat.slice(0, 2).toUpperCase();
}

export const LAUNDRY_META: Record<LaundryStatus, { it: string; en: string; pill: string }> = {
  clean:   { it: "PRONTO",        en: "READY",   pill: "pill-green" },
  dirty:   { it: "DA LAVARE",     en: "DIRTY",   pill: "pill-red" },
  washing: { it: "IN LAVATRICE",  en: "WASHING", pill: "pill-blue" },
  drying:  { it: "IN ASCIUGATURA",en: "DRYING",  pill: "pill-amber" },
};

export async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch { console.error("⚠️ Risposta non-JSON →", res.status, text.slice(0, 300)); return null; }
}
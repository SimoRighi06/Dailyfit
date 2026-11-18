import { generateText, Output } from "ai";
import { z } from "zod";
import type { Garment } from "@/types/wardrobe";

const aiOutfitSchema = z.object({
  title: z.string().min(2).max(80),
  selectedGarmentIds: z.array(z.string().uuid()).min(3).max(5),
  rationale: z.string().min(10).max(500),
});

/**
 * Optional AI ranking layer. The model can only choose IDs from clean garments
 * supplied by the server. We validate its choices again before persistence.
 * Returns null when AI is not configured or the result violates constraints.
 */
export async function generateAiOutfit(garments: Garment[], occasion?: string, language: "it" | "de" | "en" = "it") {
  if (!process.env.AI_GATEWAY_API_KEY || !process.env.AI_MODEL) return null;
  if (garments.length < 3) return null;

  try {
    const inventory = garments.map(({ id, name, category, brand, color, fit }) => ({
      id, name, category, brand, color, fit,
    }));
    const { output } = await generateText({
      model: process.env.AI_MODEL,
      output: Output.object({ schema: aiOutfitSchema }),
      prompt: [
        "You are FITDAY, a practical personal stylist.",
        "Build one wearable outfit using ONLY the supplied garments.",
        "All supplied garments are clean and currently available.",
        "Choose exactly one top (tshirt, hoodie, or crewneck), one bottom (jeans or trousers), one pair of shoes, and socks when available. You may omit socks only if none are supplied.",
        "Do not invent brands, colours, garments, IDs, weather, or context.",
        `Occasion: ${occasion || "everyday casual"}.`,
        `Return concise, useful styling reasoning in ${language === "it" ? "Italian" : language === "de" ? "German" : "English"}.`,
        `Inventory JSON: ${JSON.stringify(inventory)}`,
      ].join("\n"),
    });
    if (!output) return null;

    const allowed = new Map(garments.filter((g) => g.laundry_status === "clean").map((g) => [g.id, g]));
    const chosen = Array.from(new Set(output.selectedGarmentIds))
      .map((id) => allowed.get(id))
      .filter((item): item is Garment => Boolean(item));
    const hasTop = chosen.some((g) => ["tshirt", "hoodie", "crewneck"].includes(g.category));
    const hasBottom = chosen.some((g) => ["jeans", "trousers"].includes(g.category));
    const hasShoes = chosen.some((g) => g.category === "shoes");
    if (!hasTop || !hasBottom || !hasShoes || chosen.length < 3) return null;

    // Keep at most one item per outfit slot. This also guards against duplicated categories.
    const items = [
      chosen.find((g) => ["tshirt", "hoodie", "crewneck"].includes(g.category)),
      chosen.find((g) => ["jeans", "trousers"].includes(g.category)),
      chosen.find((g) => g.category === "socks"),
      chosen.find((g) => g.category === "shoes"),
    ].filter((item): item is Garment => Boolean(item));

    return { items, title: output.title, rationale: output.rationale, source: "ai" as const, missing: [] as string[] };
  } catch (error) {
    console.error("FITDAY AI outfit generation failed; using rules fallback.", error);
    return null;
  }
}

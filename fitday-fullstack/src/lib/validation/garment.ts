import { z } from "zod";
import { GARMENT_CATEGORIES, GARMENT_FITS, LAUNDRY_STATUSES } from "@/types/wardrobe";

export const createGarmentSchema = z.object({
  name: z.string().trim().min(1).max(80),
  category: z.enum(GARMENT_CATEGORIES),
  brand: z.string().trim().max(80).nullable().optional(),
  color: z.string().trim().min(1).max(40),
  color_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
  fit: z.enum(GARMENT_FITS).default("unknown"),
  laundry_status: z.enum(LAUNDRY_STATUSES).default("clean"),
  image_path: z.string().max(500).nullable().optional(),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const updateGarmentSchema = createGarmentSchema.partial();

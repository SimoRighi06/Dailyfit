export const GARMENT_CATEGORIES = [
  "tshirt",
  "hoodie",
  "crewneck",
  "jeans",
  "trousers",
  "socks",
  "shoes",
  "other",
] as const;

export const LAUNDRY_STATUSES = ["clean", "dirty", "washing", "drying"] as const;
export const GARMENT_FITS = ["slim", "regular", "relaxed", "oversized", "wide", "unknown"] as const;

export type GarmentCategory = (typeof GARMENT_CATEGORIES)[number];
export type LaundryStatus = (typeof LAUNDRY_STATUSES)[number];
export type GarmentFit = (typeof GARMENT_FITS)[number];

export type Garment = {
  id: string;
  user_id: string;
  name: string;
  category: GarmentCategory;
  brand: string | null;
  color: string;
  color_hex: string | null;
  fit: GarmentFit;
  laundry_status: LaundryStatus;
  image_path: string | null;
  image_url?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Outfit = {
  id: string;
  user_id: string;
  outfit_date: string;
  title: string;
  rationale: string | null;
  occasion: string | null;
  weather_summary: string | null;
  created_at: string;
  items?: Garment[];
};

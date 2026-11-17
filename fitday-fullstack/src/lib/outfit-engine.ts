import type { Garment } from "@/types/wardrobe";

function pick<T>(items: T[], seed: number): T | undefined {
  if (!items.length) return undefined;
  return items[Math.abs(seed) % items.length];
}

function scorePair(a: Garment, b: Garment) {
  const neutrals = ["black", "white", "grey", "gray", "navy", "beige", "cream", "denim", "blu"];
  const ca = a.color.toLowerCase();
  const cb = b.color.toLowerCase();
  if (ca === cb) return 3;
  if (neutrals.some((n) => ca.includes(n) || cb.includes(n))) return 2;
  return 0;
}

export function buildDailyOutfit(garments: Garment[], daySeed = new Date().getDate()) {
  const available = garments.filter((item) => item.laundry_status === "clean");
  const tops = available.filter((item) => ["tshirt", "hoodie", "crewneck"].includes(item.category));
  const bottoms = available.filter((item) => ["jeans", "trousers"].includes(item.category));
  const socks = available.filter((item) => item.category === "socks");
  const shoes = available.filter((item) => item.category === "shoes");

  const top = pick(tops, daySeed * 7 + available.length);
  const bottomCandidates = bottoms.slice().sort((a, b) => scorePair(top ?? a, b) - scorePair(top ?? b, a));
  const bottom = pick(bottomCandidates, daySeed * 11 + available.length);
  const sock = pick(socks, daySeed * 13 + available.length);
  const shoe = pick(shoes, daySeed * 17 + available.length);
  const items = [top, bottom, sock, shoe].filter((item): item is Garment => Boolean(item));

  const missing = [
    !top && "maglietta o felpa",
    !bottom && "pantaloni",
    !sock && "calzini",
    !shoe && "scarpe",
  ].filter(Boolean);

  return {
    items,
    missing: missing as string[],
    title: "Il tuo look di oggi",
    rationale: "Combinazione costruita usando soltanto i capi segnati come puliti. Il motore verrà arricchito con preferenze personali, meteo e storico degli outfit.",
  };
}

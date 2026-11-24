"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight, Plus, RefreshCw, Shirt, Sparkles } from "lucide-react";
import { AppShell } from "@/app/components/app-shell";
import { AvatarViewer } from "@/app/components/avatar-viewer";
import { localizeMissingItems, useI18n } from "@/lib/i18n";
import { categoryInitials, colorHex, garmentImageUrl, safeJson } from "@/lib/garment-utils";
import type { Garment, Outfit } from "@/types/wardrobe";

function localDate() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

function getGreetingKey(hour: number): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 22) return "evening";
  return "night";
}

export function DashboardClient() {
  const { t, language } = useI18n();
  const [garments, setGarments] = useState<Garment[]>([]);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  const hour = new Date().getHours();
  const greetingKey = getGreetingKey(hour);
  const greeting = useMemo(() => {
    const greetings: Record<string, Record<string, string>> = {
      it: { morning: "Buongiorno", afternoon: "Buon pomeriggio", evening: "Buonasera", night: "Buonanotte" },
      en: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" },
      de: { morning: "Guten Morgen", afternoon: "Guten Tag", evening: "Guten Abend", night: "Gute Nacht" },
    };
    return greetings[language]?.[greetingKey] ?? "Good morning";
  }, [greetingKey, language]);

  const weekday = useMemo(() => {
    const locale = language === "it" ? "it-IT" : language === "de" ? "de-DE" : "en-GB";
    return new Date().toLocaleDateString(locale, { weekday: "long" });
  }, [language]);

  const load = useCallback(async () => {
    try {
      const [garmentsResponse, outfitResponse] = await Promise.all([
        fetch("/api/garments", { cache: "no-store" }),
        fetch(`/api/outfits/today?date=${localDate()}`, { cache: "no-store" }),
      ]);
      const garmentsPayload = await safeJson(garmentsResponse);
      const outfitPayload = await safeJson(outfitResponse);
      console.log("📥 [dashboard] garments:", garmentsResponse.status, garmentsPayload?.garments?.length, "| outfit:", outfitResponse.status, outfitPayload?.outfit?.title ?? outfitPayload?.error);
      if (garmentsResponse.ok) setGarments(garmentsPayload?.garments ?? []);
      else if (garmentsResponse.status !== 503) setMessage(t("dashboard.loginMessage"));
      if (outfitResponse.ok) setOutfit(outfitPayload?.outfit ?? null);
      else if (outfitResponse.status === 503) setMessage(t("dashboard.supabaseMessage"));
    } catch {
      setMessage(t("dashboard.backendError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // The helper updates React state only after its network requests settle.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>("[data-scroll-reveal]");
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    sections.forEach((section) => {
      section.classList.add("scroll-reveal-ready");
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  async function generate() {
    setGenerating(true);
    setMessage("");
    try {
      const response = await fetch("/api/outfits/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: localDate() }),
      });
      const payload = await safeJson(response);
      console.log("📥 [dashboard] generate →", response.status, payload?.outfit?.title ?? payload?.error);
      if (!response.ok) throw new Error(payload?.error ?? t("dashboard.generateError"));
      setOutfit(payload.outfit);
      if (payload.missing?.length) {
        setMessage(t("dashboard.missing", { items: localizeMissingItems(payload.missing, t) }));
      } else {
        setMessage(t("dashboard.updated"));
      }
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("dashboard.unexpectedError"));
    } finally {
      setGenerating(false);
    }
  }

  const cleanCount = garments.filter((garment) => garment.laundry_status === "clean").length;
  const dirtyCount = garments.length - cleanCount;
  const items = outfit?.items ?? [];
  const top = items.find((garment) => ["tshirt", "hoodie", "crewneck"].includes(garment.category));
  const bottom = items.find((garment) => ["jeans", "trousers"].includes(garment.category));
  const shoes = items.find((garment) => garment.category === "shoes");

  return (
    <AppShell
      variant="home"
      title={`${greeting}.`}
      eyebrow={`${weekday.charAt(0).toUpperCase() + weekday.slice(1)} · ${t("dashboard.eyebrow")}`}
      action={<Link className="btn btn-primary" href="/wardrobe"><Plus size={14} /> {t("dashboard.addGarment")}</Link>}
    >
      <div className="dashboard-home">
        <section className="dashboard-hero" aria-labelledby="dashboard-hero-title">
          <div className="dashboard-hero-image" aria-hidden="true" />
          <div className="dashboard-hero-content">
            <span className="dashboard-overline"><Sparkles size={13} /> {t("dashboard.lookToday")}</span>
            <h2 id="dashboard-hero-title">
              {t("dashboard.heroTitleFirst")}
              <br />
              {t("dashboard.heroTitleSecond")}
            </h2>
            <p>{t("dashboard.description")}</p>
            <button className="btn btn-primary dashboard-hero-cta" onClick={generate} disabled={generating}>
              {generating ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {generating ? t("dashboard.generating") : t("dashboard.generate")}
            </button>
            {message && <p className="dashboard-message" role="status" aria-live="polite">{message}</p>}
          </div>
          <div className="dashboard-scroll-cue" aria-hidden="true">
            <ArrowDown size={16} />
          </div>
        </section>

        <section id="today" className="dashboard-section dashboard-today" data-scroll-reveal aria-labelledby="dashboard-today-title">
          <div className="dashboard-section-heading">
            <span className="dashboard-section-index">01 · {t("dashboard.lookToday")}</span>
            <h2 id="dashboard-today-title">{t("dashboard.lookToday")}</h2>
          </div>
          <div className="dashboard-today-grid">
            <div className="dashboard-avatar">
              <AvatarViewer
                height={390}
                topColor={colorHex(top?.color_hex ?? top?.color)}
                bottomColor={colorHex(bottom?.color_hex ?? bottom?.color)}
                shoeColor={colorHex(shoes?.color_hex ?? shoes?.color)}
                topPhoto={garmentImageUrl(top)}
                bottomPhoto={garmentImageUrl(bottom)}
                shoePhoto={garmentImageUrl(shoes)}
              />
            </div>
            <div className="dashboard-today-copy">
              <span className="dashboard-overline dashboard-overline-dark"><Sparkles size={13} /> {t("dashboard.lookToday")}</span>
              <h3>{outfit?.title ?? t("dashboard.heroTitleFirst")}</h3>
              <p>{outfit?.rationale ?? t("dashboard.description")}</p>
              {message && <p className="dashboard-inline-message" role="status">{message}</p>}
              <Link className="btn btn-primary" href="/outfits">
                {t("dashboard.details")} <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        <section className="dashboard-section dashboard-wardrobe" data-scroll-reveal aria-labelledby="dashboard-wardrobe-title">
          <div className="dashboard-section-heading dashboard-wardrobe-heading">
            <div>
              <span className="dashboard-section-index">02 · {t("nav.wardrobe")}</span>
              <h2 id="dashboard-wardrobe-title">{t("dashboard.recent")}</h2>
              <p>{t("dashboard.recentNote")}</p>
            </div>
            <div className="dashboard-count">{loading ? "—" : garments.length.toString().padStart(2, "0")}</div>
          </div>

          <div className="dashboard-stat-row">
            <div><span>{t("dashboard.inWardrobe")}</span><strong>{loading ? "—" : garments.length.toString().padStart(2, "0")}</strong></div>
            <div><span>{t("dashboard.clean")}</span><strong>{loading ? "—" : cleanCount.toString().padStart(2, "0")}</strong></div>
            <div><span>{t("dashboard.unavailable")}</span><strong>{loading ? "—" : dirtyCount.toString().padStart(2, "0")}</strong></div>
          </div>

          {loading ? (
            <div className="dashboard-empty">{t("dashboard.loadingWardrobe")}</div>
          ) : garments.length === 0 ? (
            <div className="dashboard-empty">
              <Shirt size={23} />
              <p>{t("dashboard.emptyText")}</p>
            </div>
          ) : (
            <div className="dashboard-garments">
              {garments.slice(0, 3).map((garment) => {
                const imageUrl = garmentImageUrl(garment);
                return (
                  <article className="dashboard-garment" key={garment.id}>
                    <div className="dashboard-garment-image" style={{ backgroundColor: `${colorHex(garment.color_hex ?? garment.color)}20` }}>
                      {imageUrl
                        ? <Image src={imageUrl} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" unoptimized />
                        : <span>{categoryInitials(garment.category)}</span>}
                    </div>
                    <div className="dashboard-garment-info">
                      <strong>{garment.name}</strong>
                      <span>{garment.brand || garment.category} · {garment.color}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <Link className="btn btn-primary dashboard-wardrobe-cta" href="/wardrobe">
            {t("dashboard.seeAll")} <ArrowUpRight size={14} />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

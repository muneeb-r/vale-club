import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";
import { Category } from "@/models/Category";

export const revalidate = 3600; // regenerate every hour

const BASE_URL = process.env.APP_URL || "https://vale.club";
const LOCALES = ["es", "en", "ca"] as const;

function localUrl(locale: (typeof LOCALES)[number], path: string): string {
  if (locale === "es") return `${BASE_URL}${path}`;
  return `${BASE_URL}/${locale}${path}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ── Static pages ──────────────────────────────────────────────────────────
  const staticPaths: { path: string; priority: number; freq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }[] = [
    { path: "",                   priority: 1.0, freq: "daily"   },
    { path: "/search",            priority: 0.9, freq: "daily"   },
    { path: "/sobre-nosotros",    priority: 0.5, freq: "monthly" },
    { path: "/privacidad",        priority: 0.3, freq: "yearly"  },
    { path: "/terminos",          priority: 0.3, freq: "yearly"  },
    { path: "/login",             priority: 0.4, freq: "monthly" },
    { path: "/register",          priority: 0.5, freq: "monthly" },
    { path: "/forgot-password",   priority: 0.3, freq: "yearly"  },
    { path: "/contacto",          priority: 0.5, freq: "monthly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap(({ path, priority, freq }) =>
    LOCALES.map((locale) => ({
      url: localUrl(locale, path),
      changeFrequency: freq,
      priority,
    }))
  );

  // ── Dynamic pages ─────────────────────────────────────────────────────────
  await connectDB();

  const [businesses, categories] = await Promise.all([
    Business.find({ status: "active" }).select("slug updatedAt plan").lean(),
    Category.find({ isActive: true }).select("slug").lean(),
  ]);

  const businessEntries: MetadataRoute.Sitemap = businesses.flatMap((b) =>
    LOCALES.map((locale) => ({
      url: localUrl(locale, `/empresa/${b.slug}`),
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      // Pro businesses get slightly higher priority
      priority: b.plan === "paid" ? 0.9 : 0.7,
    }))
  );

  const categoryEntries: MetadataRoute.Sitemap = categories.flatMap((c) =>
    LOCALES.map((locale) => ({
      url: localUrl(locale, `/search?category=${c.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  return [...staticEntries, ...businessEntries, ...categoryEntries];
}

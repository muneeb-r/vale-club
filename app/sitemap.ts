import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Business } from "@/models/Business";

export const revalidate = 3600; // regenerate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.APP_URL || "https://vale.club";
  const locales = ["es", "en"] as const;

  // Static pages — both locales
  const staticPaths = [
    "",                  // home
    "/search",
    "/sobre-nosotros",
    "/privacidad",
    "/terminos",
    "/login",
    "/register",
    "/forgot-password",
    "/contacto",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.flatMap((path) =>
    locales.map((locale) => ({
      url: locale === "es" ? `${baseUrl}${path}` : `${baseUrl}/en${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1.0 : 0.7,
    }))
  );

  // Business profile pages — active businesses only
  await connectDB();
  const businesses = await Business.find({ status: "active" })
    .select("slug updatedAt")
    .lean();

  const businessEntries: MetadataRoute.Sitemap = businesses.flatMap((b) =>
    locales.map((locale) => ({
      url:
        locale === "es"
          ? `${baseUrl}/empresa/${b.slug}`
          : `${baseUrl}/en/empresa/${b.slug}`,
      lastModified: b.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }))
  );

  return [...staticEntries, ...businessEntries];
}

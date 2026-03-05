import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || "https://vale.club";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/en/admin/",
          "/ca/admin/",
          "/dashboard/",
          "/en/dashboard/",
          "/ca/dashboard/",
          "/perfil/",
          "/en/perfil/",
          "/ca/perfil/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

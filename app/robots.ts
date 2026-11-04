import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.APP_URL || "https://network.rasena.web.id"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Halaman privat milik user.
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/users",
          "/portfolio",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
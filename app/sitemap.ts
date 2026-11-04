import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.APP_URL || "https://network.rasena.web.id"
).replace(/\/$/, "");

type Entry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

// Hanya halaman publik yang perlu diindeks. Login dan daftar sengaja tidak dimasukkan (noindex).
// Dashboard, Users, Portfolio, dan Profil adalah halaman privat, jadi tidak ikut.
const PAGES: Entry[] = [
  { path: "", priority: 1, changeFrequency: "monthly" },

  // Belajar
  { path: "/learning-path", priority: 0.8, changeFrequency: "monthly" },
  { path: "/roadmap", priority: 0.7, changeFrequency: "monthly" },

  // Praktik
  { path: "/latihan-konfigurasi", priority: 0.8, changeFrequency: "weekly" },
  { path: "/troubleshooting", priority: 0.7, changeFrequency: "monthly" },
  { path: "/noc-simulasi", priority: 0.7, changeFrequency: "monthly" },
  { path: "/quiz", priority: 0.6, changeFrequency: "monthly" },

  // Tools
  { path: "/commands", priority: 0.9, changeFrequency: "weekly" },
  { path: "/subnet-calculator", priority: 0.9, changeFrequency: "monthly" },
  { path: "/cheatsheet", priority: 0.8, changeFrequency: "monthly" },
  { path: "/config-generator", priority: 0.8, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.6, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
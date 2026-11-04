import { courses, type Level } from "@/lib/data";
import { pathModules, type PathVendor } from "@/lib/learning-path";
import { getChapters, type Chapter } from "@/lib/materials";

// Ubah ini kalau halaman Learning Path ada di rute lain.
export const MODULE_BASE = "/learning-path";

export type CatalogModule = {
  id: string;
  title: string;
  vendor: PathVendor;
  level: Level;
  lessons: number;
  minutes: number;
  description: string;
};

export const catalog: CatalogModule[] = [
  ...courses.map((c) => ({
    id: String(c.id),
    title: c.title,
    vendor: c.vendor,
    level: c.level,
    lessons: c.lessons,
    minutes: c.minutes,
    description: c.description,
  })),
  ...pathModules,
];

const byId = new Map(catalog.map((m) => [m.id, m]));

export function getModuleById(id: string) {
  return byId.get(id);
}

export function moduleHref(id: string) {
  return `${MODULE_BASE}/${id}`;
}

/** Alamat halaman belajar sebuah bab (nomor bab mulai dari 1). */
export function chapterHref(id: string, chapter: number) {
  return `${MODULE_BASE}/${id}/${chapter}`;
}

/** Judul semua bab sebuah modul, diambil dari materi (lib/materials). */
export function chapterTitles(mod: CatalogModule): string[] {
  return getChapters(mod).map((c) => c.title);
}

/** Isi satu bab (nomor mulai dari 1). */
export function chapterContent(mod: CatalogModule, chapter: number): Chapter | undefined {
  return getChapters(mod)[chapter - 1];
}

/** Jumlah bab yang sudah selesai dari persentase progres. */
export function chaptersDone(mod: CatalogModule, progress: number) {
  return Math.min(mod.lessons, Math.round((progress * mod.lessons) / 100));
}
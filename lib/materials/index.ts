import cs1 from "./cs-1";
import cs2 from "./cs-2";

import g1 from "./g-1";
import g2 from "./g-2";
import g3 from "./g-3"
import g4 from "./g-4"
import g5 from "./g-5"


import n2 from "./n-2";
import { buildFallback } from "./fallback";
import { withVideos } from "./videos";
import type { Chapter, ModuleInfo } from "./types";

export type { Block, Chapter, ModuleInfo } from "./types";

/**
 * Materi yang sudah ditulis lengkap, dikunci dengan id modul.
 * Untuk menambah materi: buat file baru di folder ini (lihat g-1.ts),
 * lalu daftarkan di sini. Jumlah bab harus sama dengan `lessons` modul.
 * Video pendukung per bab diatur terpisah di videos.ts.
 */
const written: Record<string, Chapter[]> = {
  "cs-1": cs1,
  "cs-2": cs2,

  "g-1": g1,
  "g-2": g2,
  "g-3": g3,
  "g-4": g4,
  "g-5": g5,


  "n-2": n2,
  
};

export function hasWrittenMaterial(mod: ModuleInfo) {
  const m = written[mod.id];
  return !!m && m.length === mod.lessons;
}

/** Bab-bab sebuah modul: materi tertulis kalau ada, kalau tidak kerangka belajar otomatis. */
export function getChapters(mod: ModuleInfo): Chapter[] {
  return hasWrittenMaterial(mod)
    ? written[mod.id].map(withVideos)
    : buildFallback(mod);
}
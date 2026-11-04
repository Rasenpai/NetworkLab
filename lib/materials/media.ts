import type { Block } from "./types";

type ImgBlock = Extract<Block, { t: "img" }>;
type VideoBlock = Extract<Block, { t: "video" }>;

/**
 * Gambar dari Wikimedia Commons, dipanggil lewat nama file.
 * Contoh: wikiImage("OSI Model v1.svg", "Tujuh lapisan model OSI", "Model OSI")
 *
 * - Nama file persis seperti di halaman https://commons.wikimedia.org/wiki/File:<nama>
 * - Kalau gambar tidak ada atau gagal dimuat, halaman menampilkan `fallback`
 *   (kalau diisi) atau kartu pengganti dengan link ke halaman sumber.
 */
export function wikiImage(
  file: string,
  alt: string,
  caption: string,
  fallback?: string,
): ImgBlock {
  const name = encodeURIComponent(file.replace(/ /g, "_"));
  return {
    t: "img",
    src: `https://en.wikipedia.org/wiki/Special:FilePath/${name}?width=900`,
    alt,
    caption,
    href: `https://en.wikipedia.org/wiki/File:${name}`,
    credit: "Wikimedia Commons",
    fallback,
  };
}

/**
 * Video YouTube yang di-embed.
 * ID adalah bagian setelah `v=` pada link, misalnya
 * https://www.youtube.com/watch?v=AYgXr1dynKU  ->  "AYgXr1dynKU"
 */
export function ytVideo(
  id: string,
  title: string,
  channel?: string,
  start?: number,
): VideoBlock {
  return { t: "video", id, title, channel, start };
}

/**
 * Kartu pencarian YouTube untuk topik yang belum punya video pilihan.
 * Ganti dengan `ytVideo(...)` setelah kamu memilih video yang cocok.
 */
export function ytSearch(query: string, title: string): VideoBlock {
  return { t: "video", title, query };
}
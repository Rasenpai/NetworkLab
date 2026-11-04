import type { Chapter, ModuleInfo } from "./types";

/** Pecah deskripsi modul menjadi daftar topik. Koma desimal seperti "2,4" tidak ikut terpecah. */
function topicsOf(description: string): string[] {
  return description
    .replace(/\.\s*$/, "")
    .split(/,\s+(?:dan\s+)?|\s+dan\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const NOT_WRITTEN =
  "Uraian detail bab ini belum ditulis. Gunakan poin di atas sebagai panduan belajar mandiri, lalu catat temuan dan pertanyaanmu.";

/**
 * Kerangka belajar untuk modul yang materi lengkapnya belum ditulis.
 * Isinya dibuat dari judul dan deskripsi modul, supaya tiap bab tetap punya arah belajar.
 */
export function buildFallback(mod: ModuleInfo): Chapter[] {
  const topics = topicsOf(mod.description);
  const list = topics.length ? topics : [mod.title];
  const chapters: Chapter[] = [];

  for (let i = 0; i < mod.lessons; i++) {
    const isFirst = i === 0;
    const isLast = i === mod.lessons - 1 && mod.lessons > 1;

    if (isFirst) {
      chapters.push({
        title: "Pengantar dan tujuan belajar",
        blocks: [
          {
            t: "p",
            x: `Modul "${mod.title}" membahas: ${mod.description}`,
          },
          { t: "h", x: "Topik yang akan dipelajari" },
          { t: "ul", items: list.map(cap) },
          {
            t: "tip",
            x: "Siapkan lab untuk berlatih (perangkat nyata, VM, atau simulator seperti EVE-NG dan GNS3) dan buku catatan untuk mencatat konfigurasi serta hasil percobaan.",
          },
          { t: "warn", x: NOT_WRITTEN },
          {
            t: "check",
            items: [
              "Saya tahu apa saja topik di modul ini.",
              "Saya sudah menyiapkan tempat latihan.",
            ],
          },
        ],
      });
      continue;
    }

    if (isLast) {
      chapters.push({
        title: "Rangkuman dan latihan",
        blocks: [
          {
            t: "p",
            x: `Saatnya merangkum modul "${mod.title}" dan menguji pemahamanmu lewat praktik.`,
          },
          { t: "h", x: "Rangkum tiap topik" },
          { t: "ul", items: list.map((t) => `${cap(t)}: tuliskan inti konsep dalam bahasamu sendiri.`) },
          { t: "h", x: "Latihan" },
          {
            t: "ol",
            items: [
              "Bangun satu skenario di lab yang memakai semua topik di atas.",
              "Dokumentasikan konfigurasi, perintah verifikasi, dan hasilnya.",
              "Sengaja buat satu kesalahan, lalu telusuri dan perbaiki.",
              "Jelaskan hasilnya kepada rekan atau tulis sebagai catatan portofolio.",
            ],
          },
          { t: "warn", x: NOT_WRITTEN },
          {
            t: "check",
            items: list.map((t) => `Saya bisa menjelaskan dan mempraktikkan: ${t}.`),
          },
        ],
      });
      continue;
    }

    const k = i - 1;
    const topic = list[k % list.length];
    const round = Math.floor(k / list.length);

    if (round === 0) {
      chapters.push({
        title: cap(topic),
        blocks: [
          { t: "p", x: `Bab ini membahas ${topic} sebagai bagian dari modul "${mod.title}".` },
          { t: "h", x: "Yang perlu kamu pahami" },
          {
            t: "ol",
            items: [
              `Fungsi ${topic} dan masalah yang diselesaikannya.`,
              "Istilah utama dan cara kerjanya secara garis besar.",
              "Kondisi normal dibandingkan gejala saat bermasalah.",
              "Perintah atau menu yang dipakai untuk memeriksa dan mengubahnya.",
            ],
          },
          {
            t: "tip",
            x: `Cari bagian tentang ${topic} di dokumentasi resmi vendor atau proyeknya, lalu bandingkan dengan yang kamu lihat di lab.`,
          },
          { t: "warn", x: NOT_WRITTEN },
          {
            t: "check",
            items: [`Saya bisa menjelaskan ${topic} dengan kata-kata sendiri.`],
          },
        ],
      });
    } else if (round === 1) {
      chapters.push({
        title: `Praktik: ${topic}`,
        blocks: [
          { t: "p", x: `Praktikkan ${topic} langsung di lab supaya konsepnya menempel.` },
          {
            t: "ol",
            items: [
              "Tuliskan tujuan praktik dan hasil yang kamu harapkan.",
              "Catat kondisi awal (konfigurasi atau output sebelum perubahan).",
              "Lakukan konfigurasi atau langkah utama secara bertahap.",
              "Verifikasi hasilnya dengan perintah pemeriksaan yang sesuai.",
              "Simpan konfigurasi akhir dan catatan hasilnya.",
            ],
          },
          { t: "warn", x: NOT_WRITTEN },
          { t: "check", items: [`Saya sudah mempraktikkan ${topic} dan mencatat hasilnya.`] },
        ],
      });
    } else {
      chapters.push({
        title: `Studi kasus: ${topic}`,
        blocks: [
          { t: "p", x: `Latih kemampuan troubleshooting pada ${topic} lewat skenario masalah.` },
          {
            t: "ol",
            items: [
              "Buat atau pilih satu skenario gangguan yang berkaitan dengan topik ini.",
              "Rumuskan dugaan penyebab dari lapisan paling bawah ke atas.",
              "Uji tiap dugaan dan catat hasilnya.",
              "Perbaiki, verifikasi, lalu tulis akar masalah dan cara mencegahnya.",
            ],
          },
          { t: "warn", x: NOT_WRITTEN },
          { t: "check", items: ["Saya bisa menelusuri masalah pada topik ini secara terstruktur."] },
        ],
      });
    }
  }

  return chapters;
}
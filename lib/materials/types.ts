export type Block =
  | { t: "p"; x: string }
  | { t: "h"; x: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "code"; lang?: string; x: string }
  | { t: "tip"; x: string }
  | { t: "warn"; x: string }
  | { t: "check"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][]; caption?: string }
  | {
      t: "img";
      src: string;
      alt: string;
      caption?: string;
      /** Halaman sumber gambar (untuk atribusi dan lisensi). */
      href?: string;
      credit?: string;
      /** Teks yang ditampilkan kalau gambar gagal dimuat (misalnya diagram ASCII). */
      fallback?: string;
    }
  | {
      t: "video";
      /** ID video YouTube (11 karakter). Kalau kosong, yang tampil adalah kartu pencarian. */
      id?: string;
      title: string;
      channel?: string;
      /** Kata kunci pencarian YouTube. Dipakai saat `id` kosong atau tidak valid. */
      query?: string;
      /** Mulai putar dari detik ke-n. */
      start?: number;
    };

export type Chapter = {
  title: string;
  blocks: Block[];
};

/** Info minimal sebuah modul yang dibutuhkan untuk menyusun bab. */
export type ModuleInfo = {
  id: string;
  title: string;
  description: string;
  lessons: number;
};
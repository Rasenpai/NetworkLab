# NetworkLab

Platform belajar jaringan komputer berbahasa Indonesia untuk MikroTik dan Cisco. Materi terstruktur, lab praktik di terminal virtual, quiz, troubleshooting challenge, dan portofolio hasil lab dalam satu tempat.

## Fitur

- **Materi terstruktur**: kurikulum MikroTik dalam file Markdown, progres per bab tersimpan per user.
- **Lab praktik**: terminal virtual RouterOS dengan daftar tugas yang diperiksa otomatis, progres tersimpan dan bisa dilanjutkan.
- **Canvas topologi Cisco**: editor topologi bergaya Packet Tracer, satu user bisa punya banyak canvas.
- **Quiz dan ujian**: timer, jawaban tersimpan tiap dipilih (aman saat refresh atau pindah perangkat), riwayat percobaan.
- **Troubleshooting Challenge**: skor, waktu, dan percobaan terbaik per tantangan.
- **Portofolio**: lab yang tuntas bisa disimpan sebagai project portofolio.
- **Dashboard**: streak belajar, grafik menit belajar mingguan, dan aktivitas terakhir.
- **Profil**: avatar, bio, skill, link sosial media, dan verifikasi email.
- **Subnet calculator**.

### Keamanan akun

- Password di-hash, sesi disimpan di database (cookie berisi token, database menyimpan SHA-256-nya).
- Captcha buatan sendiri di halaman login dan daftar. Stateless: jawaban ditandatangani HMAC di dalam token (berlaku 5 menit), tanpa storage tambahan.
- Verifikasi email wajib setelah daftar. Sebelum terverifikasi, user tidak mendapat sesi login dan hanya melihat tampilan "Cek email kamu".
- Token verifikasi sekali pakai, berlaku 24 jam, dengan cooldown kirim ulang 60 detik dan batas per jam.

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, `cacheComponents`) |
| UI | React 19, Tailwind CSS 4, lucide-react |
| Database | SQLite lewat `better-sqlite3` (mode WAL) |
| Email | Resend |
| Font | Inter dan Newsreader (`next/font/google`) |

## Struktur proyek

```text
app/
  (auth)/            login, register, verify-email
  (app)/             dashboard, profil, materi, lab, quiz, dan halaman lain setelah login
  actions/           server actions (auth, verifikasi email, profil, akun)
  api/captcha/       endpoint gambar captcha
  api/verify-email/  tujuan link verifikasi dari email
  icon.svg           favicon
  not-found.tsx      halaman 404
  robots.ts  sitemap.ts  opengraph-image.tsx
components/          komponen UI (AuthForm, Captcha, VerifyPending, dll.)
content/mikrotik/    materi: <course_id>/<lesson_slug>.md
lib/
  db.ts              koneksi SQLite, skema, dan migrasi ringan
  auth.ts            sesi dan hash password
  captcha.ts         pembuatan dan verifikasi captcha
  email-verification.ts  token verifikasi
  pending-verify.ts  cookie "menunggu verifikasi"
  verification-mail.ts   pembuatan token + pengiriman email
  mailer.ts          pengirim email (Resend)
data/                networklab.db (dibuat otomatis, jangan di-commit)
```

## Menjalankan secara lokal

Prasyarat: Node.js 20.9 atau lebih baru.

```bash
npm install
cp .env.example .env   # lalu isi nilainya (lihat bagian berikut)
npm run dev
```

Buka http://localhost:3000. Folder `data/` dan skema database dibuat otomatis saat pertama kali dijalankan.

## Environment variable

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `CAPTCHA_SECRET` | Ya | String acak panjang. Dipakai menandatangani captcha dan cookie `pending_verify`. |
| `APP_URL` | Produksi | URL publik, misalnya `https://namadomain.com`. Dipakai untuk link verifikasi, canonical, sitemap, dan gambar share. Default `http://localhost:3000`. |
| `RESEND_API_KEY` | Untuk email | API key Resend. Tanpa ini, email tidak terkirim dan user melihat pesan layanan belum dikonfigurasi. |
| `GOOGLE_SITE_VERIFICATION` | Opsional | Token verifikasi Google Search Console. |

Contoh membuat secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### Catatan Resend

Selama domain belum diverifikasi di resend.com/domains, Resend hanya mengizinkan kirim email ke alamat pemilik akun Resend. Untuk produksi:

1. Tambahkan dan verifikasi domain di Resend (record SPF dan DKIM).
2. Ubah alamat `from` di `lib/mailer.ts` ke alamat di domain tersebut.

## Menambah materi

Taruh file Markdown di `content/mikrotik/<course_id>/<lesson_slug>.md`. `course_id` mengacu ke katalog di `lib/data.ts`. Progres materi dihitung dari jumlah bab yang diselesaikan dibagi jumlah file `.md` di folder itu.

## Perintah

```bash
npm run dev     # server pengembangan
npm run build   # build produksi
npm run start   # jalankan hasil build
npm run lint    # lint
```

## Database

SQLite disimpan di `data/networklab.db`. Skema dibuat dan dimigrasi otomatis oleh `lib/db.ts` setiap modul dimuat. Semua tabel milik user terhubung ke `users` dengan `ON DELETE CASCADE`, jadi menghapus akun ikut menghapus sesi, progres, quiz, lab, dan portofolio.

Cadangkan file `networklab.db` (beserta `-wal` dan `-shm` bila ada) secara berkala di produksi.

Membebaskan akun lama dari kewajiban verifikasi email:

```sql
UPDATE users SET email_verified_at = <unix ms> WHERE email = 'user@email.com';
```

## Deploy

Karena memakai SQLite di file lokal, aplikasi butuh disk yang persisten (VPS atau container dengan volume). Platform serverless dengan filesystem sementara tidak cocok.

1. Isi semua environment variable di server, terutama `APP_URL` dan `CAPTCHA_SECRET`.
2. `npm run build` lalu `npm run start` (di belakang reverse proxy seperti Nginx atau Caddy dengan HTTPS).
3. Daftarkan `https://domainmu/sitemap.xml` di Google Search Console.

import type { Chapter } from "./types";

const chapters: Chapter[] = [
  {
    title: "Pengantar: Mengapa Tiket Penting",
    blocks: [
      {
        t: "p",
        x: "Di NOC, setiap gangguan, permintaan, atau perubahan dicatat sebagai tiket. Tiket adalah catatan resmi: siapa yang melapor, apa masalahnya, siapa yang menangani, apa yang sudah dicoba, dan kapan selesai. Tanpa tiket, pekerjaan sulit dilacak, dilimpahkan antar shift, atau dipertanggungjawabkan.",
      },
      {
        t: "ul",
        items: [
          "Menjamin tidak ada laporan yang terlewat.",
          "Menjadi bahan handover antar shift dan antar tier.",
          "Menjadi dasar perhitungan SLA dan laporan bulanan.",
          "Menjadi sumber data untuk menganalisis masalah berulang.",
        ],
      },
      {
        t: "tip",
        x: "Contoh aplikasi ticketing yang umum dipakai: osTicket, GLPI, Zammad, dan Jira Service Management. Konsepnya sama, jadi yang kamu pelajari di sini berlaku di semuanya.",
      },
      {
        t: "check",
        items: ["Saya bisa menjelaskan fungsi tiket bagi pelanggan dan bagi tim."],
      },
    ],
  },
  {
    title: "Anatomi Tiket yang Lengkap",
    blocks: [
      {
        t: "p",
        x: "Tiket yang baik bisa dipahami orang lain tanpa harus bertanya ulang. Berikut contoh isi minimal untuk laporan gangguan.",
      },
      {
        t: "code",
        lang: "text",
        x: `Judul      : Link Cabang Bekasi down sejak 09:12 WIB
Pelapor    : Andi (PT Maju Jaya), 0812-xxxx-xxxx
Layanan    : Dedicated Internet 50 Mbps, ID layanan DI-0231
Dampak     : Seluruh kantor (40 user) tidak bisa akses internet
Waktu      : Mulai 09:12, dilaporkan 09:20
Gejala     : Lampu LOS pada ONT merah, router tidak mendapat IP
Sudah dicek: Restart ONT oleh pelanggan, kabel power normal
Tindakan   : (diisi petugas) cek status OLT dan redaman port
Status     : Open, ditangani L1 (Rina)`,
      },
      {
        t: "ul",
        items: [
          "Judul: lokasi, gejala, dan waktu mulai dalam satu kalimat.",
          "Dampak: berapa user atau layanan yang terpengaruh.",
          "Bukti: screenshot, log, atau hasil ping dan traceroute.",
          "Setiap tindakan dicatat beserta jamnya.",
        ],
      },
      {
        t: "tip",
        x: "Hindari judul seperti Internet mati atau Tolong dicek. Judul yang jelas mempercepat triase dan pencarian tiket lama.",
      },
      {
        t: "check",
        items: ["Saya bisa menulis tiket yang berisi gejala, dampak, dan bukti."],
      },
    ],
  },
  {
    title: "Severity vs Prioritas",
    blocks: [
      {
        t: "p",
        x: "Dua istilah ini sering tertukar. Severity menggambarkan seberapa parah dampak teknis. Prioritas menentukan urutan penanganan dengan mempertimbangkan dampak dan urgensi (seberapa mendesak, misalnya pelanggan VIP atau jam sibuk).",
      },
      {
        t: "table",
        head: ["Dampak \\ Urgensi", "Urgensi tinggi", "Urgensi sedang", "Urgensi rendah"],
        rows: [
          ["Dampak luas", "P1 Kritis", "P2 Tinggi", "P3 Sedang"],
          ["Dampak sedang", "P2 Tinggi", "P3 Sedang", "P4 Rendah"],
          ["Dampak kecil", "P3 Sedang", "P4 Rendah", "P4 Rendah"],
        ],
        caption: "Contoh matriks prioritas (dampak x urgensi).",
      },
      {
        t: "ul",
        items: [
          "P1: layanan utama mati untuk banyak pelanggan, atau backbone down.",
          "P2: layanan terganggu berat, atau satu pelanggan penting mati.",
          "P3: gangguan sebagian, ada jalur alternatif.",
          "P4: pertanyaan, permintaan, atau masalah kosmetik.",
        ],
      },
      {
        t: "warn",
        x: "Prioritas bisa berubah selama penanganan. Jika dampak ternyata lebih luas dari laporan awal, naikkan prioritas dan catat alasannya di tiket.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membedakan severity dan prioritas.",
          "Saya bisa menentukan prioritas dari dampak dan urgensi.",
        ],
      },
    ],
  },
  {
    title: "SLA: Respons, Resolusi & Cara Menghitungnya",
    blocks: [
      {
        t: "p",
        x: "SLA (Service Level Agreement) adalah janji layanan yang terukur. Dua angka yang paling sering dipakai: waktu respons (kapan tiket pertama kali ditanggapi) dan waktu resolusi (kapan masalah selesai). Waktu dihitung sejak tiket dibuat, bukan sejak petugas mulai mengerjakan.",
      },
      {
        t: "table",
        head: ["Prioritas", "Respons", "Resolusi", "Jam hitung"],
        rows: [
          ["P1", "15 menit", "4 jam", "24x7"],
          ["P2", "30 menit", "8 jam", "24x7"],
          ["P3", "2 jam", "3 hari kerja", "Jam kerja"],
          ["P4", "1 hari", "5 hari kerja", "Jam kerja"],
        ],
        caption: "Contoh kebijakan SLA.",
      },
      { t: "h", x: "Contoh 1: tiket P1 (24x7)" },
      {
        t: "p",
        x: "Tiket P1 masuk pukul 02:20. Batas respons 02:35 dan batas resolusi 06:20, karena jam dihitung terus tanpa memandang malam atau akhir pekan.",
      },
      { t: "h", x: "Contoh 2: SLA berbasis jam kerja" },
      {
        t: "p",
        x: "Misalkan SLA resolusi 8 jam kerja, jam kerja 08:00 sampai 17:00, dan tiket masuk hari Jumat pukul 15:00. Sisa jam kerja Jumat 2 jam, jadi 6 jam sisanya dilanjutkan hari Senin. Batas resolusi: Senin pukul 14:00 (08:00 + 6 jam), dengan asumsi Sabtu dan Minggu bukan hari kerja.",
      },
      { t: "h", x: "Availability" },
      {
        t: "p",
        x: "Ketersediaan 99,9% per bulan (30 hari) berarti downtime maksimal 43.200 menit x 0,1% = 43,2 menit. Pada 99,99% batasnya hanya sekitar 4,3 menit.",
      },
      {
        t: "tip",
        x: "Pasang pengingat batas SLA di tiket. Banyak sistem tiket punya SLA timer yang berubah warna menjelang batas.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menghitung batas respons dan resolusi dari jam masuk tiket.",
          "Saya bisa mengubah persentase availability menjadi menit downtime.",
        ],
      },
    ],
  },
  {
    title: "Siklus Hidup Tiket & Status",
    blocks: [
      {
        t: "p",
        x: "Setiap tiket bergerak melalui status yang jelas. Nama bisa berbeda antar aplikasi, tetapi alurnya mirip.",
      },
      {
        t: "ol",
        items: [
          "New / Open: tiket dibuat dan menunggu ditangani.",
          "In Progress: sudah ada petugas yang bertanggung jawab.",
          "Pending: menunggu pihak lain, misalnya pelanggan, vendor, atau akses lokasi. Timer SLA biasanya dijeda dengan alasan yang jelas.",
          "Escalated: dilimpahkan ke tier atau tim lain.",
          "Resolved: perbaikan dilakukan dan menunggu konfirmasi.",
          "Closed: dikonfirmasi selesai, atau otomatis tutup setelah batas waktu.",
        ],
      },
      {
        t: "warn",
        x: "Jangan menutup tiket hanya karena alert sudah hijau. Pastikan layanan benar-benar pulih lewat tes dari sisi pelanggan atau konfirmasi dari mereka, dan catat akar penyebabnya secara singkat.",
      },
      {
        t: "check",
        items: ["Saya tahu kapan tiket boleh di-pending dan kapan boleh ditutup."],
      },
    ],
  },
  {
    title: "Eskalasi & Komunikasi ke Pelanggan",
    blocks: [
      {
        t: "p",
        x: "Eskalasi dilakukan saat masalah di luar kewenangan atau keahlian tier saat ini, atau saat SLA hampir terlampaui. Eskalasi yang baik membawa konteks lengkap supaya tier berikutnya tidak mengulang pengecekan.",
      },
      {
        t: "code",
        lang: "text",
        x: `[ESKALASI L1 -> L2]
Tiket    : #20931 (P1) Link Cabang Bekasi down
Sejak    : 09:12 WIB, batas resolusi 13:12
Dampak   : 40 user, layanan Dedicated Internet DI-0231
Sudah    : Ping CPE gagal, port OLT up, redaman -29 dBm (di atas batas)
Dugaan   : Redaman fiber tinggi atau konektor kotor
Diminta  : Teknisi lapangan dan pengecekan jalur fiber`,
      },
      { t: "h", x: "Kapan harus eskalasi" },
      {
        t: "ul",
        items: [
          "Masalah di luar akses atau keahlian tier saat ini.",
          "Dampak meluas atau prioritas naik.",
          "Sisa waktu SLA tinggal sekitar 25% dan belum ada jalan keluar.",
          "Perlu pihak ketiga: vendor, ISP upstream, atau teknisi lapangan.",
        ],
      },
      { t: "h", x: "Update ke pelanggan" },
      {
        t: "code",
        lang: "text",
        x: `Update #1 (09:35 WIB)
Laporan gangguan link Cabang Bekasi sudah kami terima. Tim sedang
memeriksa perangkat di sisi jaringan kami. Update berikutnya pukul
10:05 WIB, atau lebih cepat jika ada perkembangan.`,
      },
      {
        t: "tip",
        x: "Selalu sebut jam update berikutnya. Hindari menjanjikan estimasi selesai kalau belum ada dasarnya.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menulis pesan eskalasi yang lengkap.",
          "Saya bisa menulis update ke pelanggan dengan jadwal update berikutnya.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman, Metrik & Latihan",
    blocks: [
      {
        t: "p",
        x: "Ringkasnya: tiket yang jelas, prioritas yang tepat, SLA yang dipantau, status yang jujur, dan eskalasi yang tepat waktu adalah inti kerja NOC.",
      },
      { t: "h", x: "Metrik yang biasa dilaporkan" },
      {
        t: "ul",
        items: [
          "MTTA (Mean Time To Acknowledge): rata-rata waktu sampai tiket ditanggapi.",
          "MTTR (Mean Time To Resolve): rata-rata waktu sampai tiket selesai.",
          "SLA compliance: persentase tiket yang selesai dalam batas SLA.",
          "Jumlah tiket berulang pada layanan atau lokasi yang sama.",
        ],
      },
      {
        t: "p",
        x: "Contoh SLA compliance: dari 20 tiket P2, 18 selesai dalam batas SLA. Compliance = 18 / 20 x 100% = 90%.",
      },
      { t: "h", x: "Latihan" },
      {
        t: "ol",
        items: [
          "Tulis tiket lengkap untuk laporan: Wi-Fi kantor lambat sejak pagi, 15 user terdampak.",
          "Tentukan prioritas: (a) backbone ISP down untuk 300 pelanggan, (b) satu pelanggan minta ganti password Wi-Fi, (c) link dedicated milik pelanggan bank putus 10 menit lalu.",
          "Hitung batas respons dan resolusi tiket P2 yang masuk Selasa pukul 22:40 (SLA 24x7, respons 30 menit, resolusi 8 jam).",
          "Tulis pesan eskalasi L1 ke L2 untuk gangguan yang kamu pilih sendiri.",
          "Hitung downtime maksimal sebulan (30 hari) untuk availability 99,5%.",
        ],
      },
      {
        t: "check",
        items: [
          "Saya bisa menangani satu tiket dari masuk sampai ditutup.",
          "Saya bisa menghitung SLA dan availability.",
          "Saya bisa menulis eskalasi dan update pelanggan.",
        ],
      },
    ],
  },
];

export default chapters;
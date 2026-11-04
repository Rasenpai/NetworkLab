import type { Chapter } from "./types";
import { wikiImage } from "./media";

/**
 * g-4: Kabel, Fiber Optik & Infrastruktur Fisik. UTP, crimping, tes kabel,
 * fiber SM/MM, konektor, redaman, plus rack dan kelistrikan perangkat.
 * Jumlah bab harus sama dengan `lessons` modul (8).
 *
 * Konvensi blok kode shell (tampil seperti terminal):
 *   - baris biasa     -> perintah (diberi prompt $)
 *   - "> teks"        -> output perintah
 *   - "# teks"        -> catatan
 */

const FIBER_ASCII = `Multi-mode (MM)                       Single-mode (SM)
core 50 um, cahaya memantul banyak     core 9 um, cahaya lurus satu jalur
  \\  /\\  /\\  /                          ------------------------->
 ===\\/  \\/  \\/===>
  /\\  /\\  /\\                            jarak jauh (puluhan km)
jarak pendek (ratusan m)               laser, lebih mahal`;

const chapters: Chapter[] = [
  {
    title: "Pengantar kabel dan infrastruktur fisik",
    blocks: [
      {
        t: "p",
        x: "Sebagian besar gangguan jaringan bukan di konfigurasi, melainkan di lapisan fisik: kabel longgar, konektor kotor, kabel terlalu panjang, atau perangkat mati karena listrik. Karena itu keterampilan memasang, menguji, dan merawat infrastruktur fisik adalah dasar pekerjaan teknisi jaringan.",
      },
      { t: "h", x: "Tujuan belajar modul ini" },
      {
        t: "ul",
        items: [
          "Membedakan kategori kabel UTP dan memilih yang sesuai kebutuhan.",
          "Mengurutkan kabel T568A dan T568B lalu melakukan crimping yang benar.",
          "Menguji kabel dan mengenali jenis kerusakannya.",
          "Menjelaskan fiber optik single-mode dan multi-mode, konektor, serta cara merawatnya.",
          "Menghitung redaman dan link budget sebuah jalur fiber.",
          "Menata rack dan menghitung kebutuhan listrik perangkat.",
        ],
      },
      { t: "h", x: "Peta modul" },
      {
        t: "table",
        head: ["Bab", "Topik", "Hasil yang diharapkan"],
        rows: [
          ["2", "Kabel UTP", "Memilih kategori dan memahami batas 100 m"],
          ["3", "Crimping", "Membuat kabel straight yang berfungsi"],
          ["4", "Tes kabel", "Mendiagnosis kabel rusak"],
          ["5", "Fiber SM/MM", "Memilih fiber dan transceiver yang cocok"],
          ["6", "Konektor", "Mengenali dan membersihkan konektor fiber"],
          ["7", "Redaman", "Menghitung link budget"],
          ["8", "Rangkuman", "Latihan campuran"],
        ],
      },
      { t: "h", x: "Rack dan listrik perangkat" },
      wikiImage(
        "Servers in a Rack.jpg",
        "Perangkat server dan jaringan terpasang di rack 19 inci",
        "Perangkat terpasang di rack 19 inci",
      ),
      {
        t: "p",
        x: "Perangkat jaringan dipasang di rack standar 19 inci. Tinggi perangkat dihitung dalam satuan U, dengan 1U = 44,45 mm (1,75 inci). Rack 42U memiliki ruang pasang 42 x 44,45 = 1.866,9 mm, sekitar 1,87 meter.",
      },
      {
        t: "ul",
        items: [
          "Patch panel menerima kabel permanen dari dinding; perangkat dihubungkan dengan patch cord pendek dari panel ke switch.",
          "Pakai cable manager dan pengikat velcro, bukan zip tie yang terlalu kencang karena bisa merusak kabel.",
          "Pisahkan jalur kabel listrik dari kabel data agar tidak terkena interferensi.",
          "Beri label di kedua ujung kabel dan di patch panel.",
          "Pasang UPS dan PDU, dan sambungkan rack ke grounding.",
        ],
      },
      {
        t: "p",
        x: "Contoh menghitung UPS: 8 perangkat x 150 W = 1.200 W. Sisakan ruang cadangan sehingga beban tidak lebih dari 80% kapasitas: 1.200 / 0,8 = 1.500 W kapasitas minimum. UPS 2000 VA dengan power factor 0,9 memberi 2000 x 0,9 = 1.800 W, jadi cukup.",
      },
      {
        t: "warn",
        x: "Pekerjaan di rack dan listrik memerlukan kehati-hatian: matikan perangkat sebelum memindahkannya, jangan membebani satu stop kontak berlebihan, dan jangan membuka catu daya sendiri. Pekerjaan listrik instalasi gedung harus dilakukan teknisi listrik berwenang.",
      },
      {
        t: "check",
        items: [
          "Saya tahu apa yang akan dipelajari di modul ini.",
          "Saya bisa menghitung tinggi rack dalam U dan kebutuhan kapasitas UPS.",
          "Saya tahu kebiasaan baik penataan kabel di rack.",
        ],
      },
    ],
  },
  {
    title: "Kabel UTP",
    blocks: [
      {
        t: "p",
        x: "UTP (Unshielded Twisted Pair) berisi 4 pasang kawat tembaga (8 konduktor) yang saling dipilin. Pilinan membuat gangguan elektromagnetik pada dua kawat dalam satu pasang saling meniadakan, sehingga sinyal lebih bersih tanpa perlu pelindung logam.",
      },
      wikiImage(
        "U-UTP twisted pair cable shielding.svg",
        "Struktur kabel U/UTP: empat pasang kawat berpilin tanpa pelindung logam",
        "Kabel U/UTP: empat pasang berpilin tanpa shielding",
      ),
      { t: "h", x: "Kategori kabel" },
      {
        t: "table",
        head: ["Kategori", "Frekuensi", "Kecepatan umum", "Catatan"],
        rows: [
          ["Cat5e", "100 MHz", "1 Gbps sampai 100 m", "Minimum yang layak untuk instalasi baru"],
          ["Cat6", "250 MHz", "1 Gbps; 10 Gbps hingga sekitar 55 m", "Konduktor lebih tebal"],
          ["Cat6a", "500 MHz", "10 Gbps sampai 100 m", "Lebih tebal dan kaku"],
          ["Cat8", "2000 MHz", "25/40 Gbps sampai 30 m", "Untuk data center, biasanya berpelindung"],
        ],
        caption: "Angka jarak adalah batas spesifikasi; kualitas instalasi dan kabel sangat menentukan hasil sebenarnya.",
      },
      { t: "h", x: "Batas jarak 100 meter" },
      {
        t: "p",
        x: "Panjang maksimum satu channel Ethernet tembaga adalah 100 m. Pembagian standarnya: permanent link maksimal 90 m (kabel dari patch panel ke outlet dinding) ditambah patch cord total maksimal 10 m. Kabel lebih panjang menyebabkan redaman dan error, jadi gunakan switch atau fiber untuk jarak lebih jauh.",
      },
      {
        t: "table",
        head: ["Bagian", "Maksimal"],
        rows: [
          ["Permanent link (panel ke outlet)", "90 m"],
          ["Patch cord di rak + di meja kerja", "10 m"],
          ["Channel total", "100 m"],
        ],
      },
      { t: "h", x: "Pilihan material" },
      {
        t: "table",
        head: ["Jenis", "Kegunaan", "Catatan"],
        rows: [
          ["Solid", "Instalasi permanen di dinding/langit-langit", "Kaku, tahan redaman; jangan sering ditekuk"],
          ["Stranded", "Patch cord", "Lentur, redaman lebih besar sehingga tidak untuk run panjang"],
          ["Indoor / outdoor", "Sesuai lokasi", "Outdoor memakai jaket tahan UV"],
          ["CCA (aluminium berlapis tembaga)", "Hindari", "Resistansi tinggi, tidak sesuai standar, bermasalah untuk PoE"],
        ],
      },
      { t: "h", x: "Power over Ethernet (PoE)" },
      {
        t: "table",
        head: ["Standar", "Daya dari switch", "Daya untuk perangkat"],
        rows: [
          ["802.3af (PoE)", "15,4 W", "12,95 W"],
          ["802.3at (PoE+)", "30 W", "25,5 W"],
          ["802.3bt (PoE++)", "60 W / 90 W", "51 W / 71,3 W"],
        ],
      },
      {
        t: "tip",
        x: "Sebelum membeli kabel, cek bahwa tertulis tembaga murni (pure copper, solid bare copper) dan kategori yang jelas pada jaketnya. Kabel murah berbahan CCA sering gagal di PoE dan di jarak mendekati 100 m.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut kategori UTP dan kecepatannya.",
          "Saya tahu pembagian 90 m + 10 m pada batas 100 m.",
          "Saya bisa menyebut tiga standar PoE dan dayanya.",
        ],
      },
    ],
  },
  {
    title: "Crimping kabel UTP",
    blocks: [
      {
        t: "p",
        x: "Crimping adalah memasang konektor RJ-45 (8P8C) pada ujung kabel UTP. Hasilnya bergantung pada urutan warna yang benar dan potongan yang rapi. Satu kawat yang tidak menyentuh pin sudah cukup membuat link putus-putus.",
      },
      wikiImage(
        "Ethernet RJ45 connector p1160054.jpg",
        "Konektor RJ-45 pada ujung kabel Ethernet",
        "Konektor RJ-45 (8P8C) setelah dipasang",
      ),
      { t: "h", x: "Urutan warna" },
      {
        t: "table",
        head: ["Pin", "T568A", "T568B"],
        rows: [
          ["1", "Putih-hijau", "Putih-oranye"],
          ["2", "Hijau", "Oranye"],
          ["3", "Putih-oranye", "Putih-hijau"],
          ["4", "Biru", "Biru"],
          ["5", "Putih-biru", "Putih-biru"],
          ["6", "Oranye", "Hijau"],
          ["7", "Putih-cokelat", "Putih-cokelat"],
          ["8", "Cokelat", "Cokelat"],
        ],
        caption: "T568A dan T568B hanya menukar pasangan hijau dan oranye. Yang penting adalah konsisten di satu instalasi.",
      },
      {
        t: "table",
        head: ["Jenis kabel", "Ujung 1", "Ujung 2", "Dipakai untuk"],
        rows: [
          ["Straight-through", "T568B", "T568B", "PC ke switch, switch ke router"],
          ["Crossover", "T568A", "T568B", "Perangkat sejenis, misalnya PC ke PC; kini jarang diperlukan karena auto MDI-X"],
        ],
      },
      {
        t: "p",
        x: "Fast Ethernet (100 Mbps) hanya memakai pin 1, 2, 3, dan 6 (pasangan oranye dan hijau). Gigabit Ethernet memakai keempat pasang. Karena itu kabel yang salah di pin 4, 5, 7, 8 sering tetap jalan di 100 Mbps tetapi gagal atau turun kecepatan pada gigabit.",
      },
      { t: "h", x: "Langkah crimping" },
      {
        t: "ol",
        items: [
          "Kupas jaket luar sekitar 2,5 cm tanpa melukai kawat di dalam.",
          "Pisahkan empat pasang dan urai pilinan seminimal mungkin, tidak lebih dari sekitar 13 mm dari ujung jaket.",
          "Susun kawat sesuai T568B (atau T568A) dan rapatkan sejajar.",
          "Potong rata ujungnya sehingga tersisa sekitar 12 sampai 13 mm kawat di luar jaket.",
          "Masukkan ke konektor, pastikan setiap kawat menyentuh ujung depan dan jaket ikut masuk di bawah penjepit.",
          "Jepit dengan crimping tool sampai pin menembus kawat.",
          "Uji dengan LAN tester sebelum dipakai.",
        ],
      },
      {
        t: "warn",
        x: "Kesalahan umum: pilinan diurai terlalu panjang (meningkatkan crosstalk), kawat tidak masuk sampai ujung, jaket tidak terjepit sehingga kawat bergerak, atau memakai konektor Cat5 pada kabel Cat6 yang lebih tebal. Hati-hati dengan pisau kupas agar tidak melukai tangan.",
      },
      {
        t: "tip",
        x: "Berlatihlah dengan sisa kabel. Crimping yang baik terasa dari konektor yang tidak bisa ditarik lepas dan dari hasil tes yang menunjukkan kedelapan kawat 1 sampai 8 menyala berurutan.",
      },
      {
        t: "check",
        items: [
          "Saya hafal urutan warna T568B dan perbedaannya dengan T568A.",
          "Saya bisa menjelaskan kapan memakai straight dan crossover.",
          "Saya bisa menyebut langkah crimping dan kesalahan yang sering terjadi.",
        ],
      },
    ],
  },
  {
    title: "Tes kabel",
    blocks: [
      {
        t: "p",
        x: "Kabel yang tampak baik belum tentu berfungsi. Pengujian memastikan setiap kawat tersambung di pin yang benar dan tidak bersentuhan dengan kawat lain. Ada tiga tingkat alat: tester sederhana, tester dengan pengukur panjang, dan certifier.",
      },
      { t: "h", x: "Apa yang diuji" },
      {
        t: "table",
        head: ["Kondisi", "Arti", "Gejala di jaringan"],
        rows: [
          ["Open", "Satu atau lebih kawat putus atau tidak tersambung", "Link putus, atau turun ke 100 Mbps bila pasangan 4/5/7/8 yang rusak"],
          ["Short", "Dua kawat bersentuhan", "Link tidak naik atau tidak stabil"],
          ["Reversed / crossed", "Pin 1 ke 2, 3 ke 6 tertukar (urutan salah)", "Link tidak naik atau hanya satu arah"],
          ["Split pair", "Warna benar tetapi pasangan salah (mis. pin 3 dan 6 bukan satu pilinan)", "Link naik, tetapi crosstalk tinggi dan banyak error"],
        ],
      },
      {
        t: "code",
        lang: "text",
        x: `Tester sederhana: unit utama (A) <--kabel--> unit remote (B)
Lampu menyala berurutan di kedua unit:

 A: 1 2 3 4 5 6 7 8
 B: 1 2 3 4 5 6 7 8     -> kabel straight benar

 B: 1 2 3 4 5 7 6 8     -> pin 6 dan 7 tertukar (urutan salah)
 B: 1 2 - 4 5 6 7 8     -> pin 3 tidak menyala (open)
 B: 1 2 (3 & 6 tidak menyala) -> kemungkinan short/rusak`,
      },
      {
        t: "warn",
        x: "Tester sederhana tidak bisa mendeteksi split pair, karena setiap kawat tetap tersambung ke pin yang benar. Jika ada masalah kecepatan atau error padahal tester menunjukkan normal, gunakan certifier.",
      },
      { t: "h", x: "Tingkat alat uji" },
      {
        t: "table",
        head: ["Alat", "Menguji", "Cocok untuk"],
        rows: [
          ["Tester sederhana (LED)", "Kontinuitas dan urutan pin", "Cek kabel hasil crimping"],
          ["Tester dengan TDR / wiremap", "Panjang kabel dan jarak ke titik putus", "Mencari lokasi kerusakan"],
          ["Certifier", "Kategori, NEXT, return loss, panjang, insertion loss", "Serah terima instalasi dan dokumentasi"],
          ["Toner / wire tracker", "Melacak ujung kabel di dalam dinding", "Menemukan pasangan outlet dan port"],
        ],
      },
      { t: "h", x: "Tes dari sisi sistem operasi" },
      {
        t: "code",
        lang: "bash",
        x: `ip -br link
ethtool eth0 | grep -E 'Speed|Duplex|Link detected'
> Speed: 100Mb/s
> Duplex: Full
> Link detected: yes`,
      },
      {
        t: "p",
        x: "Jika port dan perangkat sama-sama gigabit tetapi hasilnya Speed 100Mb/s, curigai kabel: salah satu pasangan (pin 4/5 atau 7/8) tidak tersambung baik. Ganti atau crimp ulang, lalu cek kembali. Sesuaikan nama eth0 dengan nama interface-mu.",
      },
      {
        t: "tip",
        x: "Urutan cepat saat link tidak naik: periksa lampu link di port, tukar patch cord dengan yang pasti baik, uji dengan tester, lalu pindah ke port lain. Ubah satu hal per langkah supaya sumber masalah jelas.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membaca urutan lampu tester dan menyimpulkan jenis kerusakan.",
          "Saya tahu bahwa tester sederhana tidak mendeteksi split pair.",
          "Saya bisa mencurigai kabel dari hasil ethtool yang turun ke 100 Mbps.",
        ],
      },
    ],
  },
  {
    title: "Fiber optik SM dan MM",
    blocks: [
      {
        t: "p",
        x: "Fiber optik mengirim data sebagai cahaya lewat serat kaca. Keunggulannya: jarak jauh, bandwidth sangat besar, kebal gangguan elektromagnetik, dan aman dari masalah beda potensial antar gedung. Kekurangannya: perangkat dan konektor lebih mahal serta penanganannya butuh ketelitian.",
      },
      wikiImage(
        "Optical-fibre.svg",
        "Struktur serat optik: core, cladding, buffer, dan jaket pelindung",
        "Struktur serat optik: core, cladding, dan lapisan pelindung",
      ),
      { t: "h", x: "Single-mode dan multi-mode" },
      wikiImage(
        "Optical fiber types.svg",
        "Perbandingan jalur cahaya pada fiber multi-mode dan single-mode",
        "Jalur cahaya pada fiber multi-mode dan single-mode",
        FIBER_ASCII,
      ),
      {
        t: "table",
        head: ["Aspek", "Single-mode (SM)", "Multi-mode (MM)"],
        rows: [
          ["Diameter core / cladding", "9 / 125 um", "50 / 125 um (OM2-OM5); 62,5 / 125 um (OM1)"],
          ["Sumber cahaya", "Laser", "LED atau VCSEL"],
          ["Panjang gelombang", "1310 nm, 1550 nm", "850 nm (juga 1300 nm pada OM1/OM2 tertentu)"],
          ["Jarak umum", "Hingga puluhan km", "Beberapa ratus meter"],
          ["Biaya", "Kabel murah, optik lebih mahal", "Kabel lebih mahal, optik lebih murah"],
          ["Warna jaket umum", "Kuning (OS2)", "Oranye (OM1/OM2), aqua (OM3/OM4), hijau limau (OM5)"],
        ],
      },
      { t: "h", x: "Contoh standar dan jaraknya" },
      {
        t: "table",
        head: ["Standar", "Kabel", "Jarak maksimal umum"],
        rows: [
          ["1000BASE-SX", "MM 850 nm", "Hingga sekitar 550 m (OM2: 500 m)"],
          ["1000BASE-LX", "SM 1310 nm", "10 km"],
          ["10GBASE-SR", "MM 850 nm", "OM3: 300 m; OM4: 400 m"],
          ["10GBASE-LR", "SM 1310 nm", "10 km"],
          ["10GBASE-ER", "SM 1550 nm", "40 km"],
        ],
        caption: "Angka resmi tergantung kategori kabel dan vendor transceiver; selalu cek datasheet modul.",
      },
      {
        t: "p",
        x: "Aturan penting: jenis fiber dan transceiver harus cocok. Transceiver SR (multi-mode) pada kabel single-mode atau sebaliknya akan tidak bekerja atau mengalami redaman tinggi. Fiber dipakai berpasangan: satu serat untuk kirim (Tx), satu untuk terima (Rx). Tx di satu sisi harus bertemu Rx di sisi lainnya.",
      },
      {
        t: "warn",
        x: "Jangan menatap ujung fiber atau port transceiver yang aktif, terutama laser single-mode: cahayanya tak terlihat tetapi bisa merusak mata. Gunakan power meter atau kartu inspeksi, bukan mata telanjang, dan matikan sumber sebelum membuka konektor.",
      },
      {
        t: "tip",
        x: "Serat kaca tidak boleh ditekuk tajam. Radius tekuk minimum biasanya sekitar 10 kali diameter kabel saat terpasang dan lebih besar saat ditarik. Gunakan jenis bend-insensitive (G.657) bila jalurnya banyak tikungan.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membedakan single-mode dan multi-mode dari core, sumber cahaya, dan jarak.",
          "Saya bisa memilih transceiver yang cocok untuk jenis fiber dan jarak tertentu.",
          "Saya tahu keselamatan laser dan batas tekukan fiber.",
        ],
      },
    ],
  },
  {
    title: "Konektor fiber dan perawatannya",
    blocks: [
      {
        t: "p",
        x: "Konektor fiber menyejajarkan dua inti kaca yang berdiameter hanya mikron. Sedikit debu atau goresan pada ujung (endface) sudah cukup menambah redaman besar. Karena itu mengenali jenis konektor dan membersihkannya sama pentingnya dengan memasangnya.",
      },
      { t: "h", x: "Jenis konektor" },
      {
        t: "table",
        head: ["Konektor", "Ukuran ferrule", "Cara pasang", "Ciri dan pemakaian"],
        rows: [
          ["LC", "1,25 mm", "Klik (push-pull) dengan klip", "Kecil, duplex; standar pada SFP/SFP+ dan perangkat padat"],
          ["SC", "2,5 mm", "Push-pull", "Persegi; banyak di jaringan telekomunikasi dan patch panel"],
          ["ST", "2,5 mm", "Bayonet (putar)", "Bulat; banyak di jaringan lama atau kampus"],
          ["FC", "2,5 mm", "Ulir sekrup", "Tahan getaran; peralatan ukur dan telekomunikasi"],
          ["MPO/MTP", "12 atau 24 serat", "Push-pull dengan pin penyelaras", "Backbone data center 40/100G"],
        ],
      },
      {
        t: "code",
        lang: "text",
        x: `LC  : [=]  kecil, 1,25 mm   (pasangan duplex = 2 LC dijepit)
SC  : [#]  persegi, 2,5 mm
ST  : (o)  bulat, bayonet
FC  : (O)  bulat, ulir sekrup
MPO : [||||||||||||]  12 serat dalam satu konektor pipih`,
      },
      { t: "h", x: "Jenis poles: PC, UPC, APC" },
      {
        t: "table",
        head: ["Poles", "Warna umum", "Bentuk ujung", "Catatan"],
        rows: [
          ["UPC", "Biru", "Melengkung, halus", "Umum untuk Ethernet dan data"],
          ["APC", "Hijau", "Miring 8 derajat", "Return loss lebih baik; untuk FTTH dan sinyal sensitif"],
        ],
      },
      {
        t: "warn",
        x: "Konektor UPC (biru) dan APC (hijau) tidak boleh dihubungkan satu sama lain. Sudut ujungnya tidak sejajar sehingga redaman tinggi dan ujung bisa rusak. Cocokkan warna di patch cord, adaptor, dan perangkat.",
      },
      { t: "h", x: "Inspeksi dan pembersihan" },
      {
        t: "ol",
        items: [
          "Matikan atau lepaskan sumber cahaya, lalu periksa konektor dengan mikroskop (fiber scope) sebelum disambung.",
          "Bersihkan dengan pembersih kering sekali-gerak (one-click cleaner) atau kain/tisu khusus fiber.",
          "Jika masih kotor, ulangi dengan metode basah (cairan isopropil khusus) lalu kering.",
          "Periksa ulang; sambung hanya jika endface bersih dan tanpa goresan.",
          "Pasang tutup debu pada setiap konektor dan port yang tidak dipakai.",
        ],
      },
      {
        t: "tip",
        x: "Anggap setiap konektor kotor sampai terbukti bersih, termasuk yang baru dari kemasan. Konektor kotor adalah penyebab terbanyak jalur fiber yang redamannya tinggi atau error-nya naik.",
      },
      {
        t: "check",
        items: [
          "Saya bisa mengenali konektor LC, SC, ST, FC, dan MPO.",
          "Saya tahu perbedaan UPC dan APC serta tidak boleh mencampurnya.",
          "Saya bisa menyebut langkah inspeksi dan pembersihan konektor.",
        ],
      },
    ],
  },
  {
    title: "Redaman dan link budget",
    blocks: [
      {
        t: "p",
        x: "Redaman (attenuation) adalah berkurangnya kekuatan sinyal sepanjang jalur. Pada fiber, redaman berasal dari serat itu sendiri, konektor, sambungan (splice), dan tekukan. Jika sinyal yang tiba di penerima lebih lemah dari batas sensitivitasnya, link putus atau penuh error.",
      },
      { t: "h", x: "Satuan: dB dan dBm" },
      {
        t: "table",
        head: ["Satuan", "Rumus", "Arti"],
        rows: [
          ["dB", "10 x log10(P_masuk / P_keluar)", "Perbandingan dua daya; dipakai untuk redaman"],
          ["dBm", "10 x log10(P / 1 mW)", "Daya absolut; 0 dBm = 1 mW"],
        ],
      },
      {
        t: "table",
        head: ["Redaman", "Daya yang tersisa"],
        rows: [
          ["3 dB", "Sekitar 50%"],
          ["10 dB", "10%"],
          ["20 dB", "1%"],
        ],
        caption: "Contoh: daya 1 mW (0 dBm) yang turun menjadi 0,1 mW berarti rugi 10 dB, atau -10 dBm di penerima.",
      },
      { t: "h", x: "Nilai redaman tipikal untuk perencanaan" },
      {
        t: "table",
        head: ["Komponen", "Nilai tipikal"],
        rows: [
          ["Single-mode 1310 nm", "0,35 dB/km"],
          ["Single-mode 1550 nm", "0,25 dB/km"],
          ["Multi-mode 850 nm", "3,0 dB/km"],
          ["Sepasang konektor (satu sambungan konektor)", "0,5 dB"],
          ["Splice fusi", "0,1 dB"],
        ],
        caption: "Gunakan angka datasheet kabel dan komponen yang sebenarnya jika tersedia.",
      },
      { t: "h", x: "Menghitung link budget" },
      {
        t: "p",
        x: "Soal: jalur single-mode 1310 nm sepanjang 10 km dengan 2 sambungan konektor dan 3 splice. Transmitter memberi -3 dBm, sensitivitas receiver -14 dBm.",
      },
      {
        t: "code",
        lang: "text",
        x: `Redaman serat   = 10 km x 0,35 dB/km      = 3,5 dB
Redaman konektor = 2 x 0,5 dB                = 1,0 dB
Redaman splice   = 3 x 0,1 dB                = 0,3 dB
------------------------------------------------------
Total redaman                                = 4,8 dB

Daya diterima    = -3 dBm - 4,8 dB           = -7,8 dBm
Link budget      = -3 - (-14)                = 11 dB
Margin           = 11 dB - 4,8 dB            = 6,2 dB`,
      },
      {
        t: "p",
        x: "Daya diterima (-7,8 dBm) lebih tinggi dari sensitivitas (-14 dBm), jadi link bekerja dengan margin 6,2 dB. Margin sekitar 3 dB atau lebih disarankan untuk cadangan penuaan, perbaikan splice, dan tekukan.",
      },
      {
        t: "warn",
        x: "Pada receiver ada juga batas atas (daya maksimum). Link yang terlalu pendek dengan transmitter kuat bisa membuat receiver jenuh (overload). Cek rentang daya input pada datasheet, dan pasang attenuator bila perlu.",
      },
      { t: "h", x: "Alat ukur" },
      {
        t: "table",
        head: ["Alat", "Fungsi"],
        rows: [
          ["Optical power meter + light source", "Mengukur redaman total jalur secara langsung"],
          ["OTDR", "Memetakan redaman di sepanjang serat dan mencari lokasi putus atau tekukan"],
          ["VFL (visual fault locator)", "Laser merah untuk menemukan putus atau tekukan pada jarak pendek"],
          ["Fiber scope", "Memeriksa endface konektor"],
        ],
      },
      { t: "h", x: "Membaca daya optik di Linux (transceiver SFP)" },
      {
        t: "code",
        lang: "bash",
        x: `sudo ethtool -m eth1 | grep -Ei 'power|temperature'
> Laser output power                        : 0.5012 mW / -3.00 dBm
> Receiver signal average optical power     : 0.1660 mW / -7.80 dBm`,
      },
      {
        t: "p",
        x: "Output di atas hanya contoh yang cocok dengan hitungan tadi. Hanya modul SFP yang mendukung DOM (digital optical monitoring) yang menampilkannya. Bandingkan hasilnya dengan batas pada datasheet modul.",
      },
      {
        t: "check",
        items: [
          "Saya bisa mengubah redaman dB menjadi persentase daya sisa untuk nilai 3, 10, dan 20 dB.",
          "Saya bisa menghitung total redaman dan margin sebuah link fiber.",
          "Saya tahu alat ukur fiber dan fungsinya.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman dan latihan infrastruktur fisik",
    blocks: [
      { t: "h", x: "Rangkuman" },
      {
        t: "table",
        head: ["Topik", "Intisari"],
        rows: [
          ["UTP", "4 pasang berpilin. Cat5e 1G, Cat6a 10G sampai 100 m. Channel maksimal 100 m (90 m + 10 m). Hindari CCA."],
          ["Crimping", "T568B-T568B untuk straight, T568A-T568B untuk crossover. Urai pilinan seminimal mungkin, kawat harus menyentuh ujung konektor."],
          ["Tes kabel", "Open, short, reversed, split pair. Tester sederhana tidak mendeteksi split pair; certifier untuk serah terima."],
          ["Fiber SM/MM", "SM 9/125 um laser jarak jauh; MM 50/125 um jarak pendek. Jenis fiber harus cocok dengan transceiver. Tx ke Rx."],
          ["Konektor", "LC, SC, ST, FC, MPO. UPC (biru) tidak boleh dicampur APC (hijau). Inspeksi dan bersihkan sebelum menyambung."],
          ["Redaman", "Total = km x dB/km + konektor + splice. Link budget dikurangi redaman = margin. 3 dB = setengah daya."],
          ["Rack dan listrik", "1U = 44,45 mm. Beban UPS maksimal sekitar 80% kapasitas. Label dan rapikan kabel."],
        ],
      },
      { t: "h", x: "Soal latihan" },
      {
        t: "ol",
        items: [
          "Berapa tinggi ruang pasang rack 24U dalam milimeter?",
          "Sebuah kabel permanent link 85 m dan dua patch cord 3 m dan 4 m. Apakah channel-nya masih di dalam batas?",
          "Port gigabit hanya mendapat 100 Mbps. Pin mana yang kemungkinan bermasalah, dan mengapa?",
          "Mengapa kabel dengan warna benar tetapi pasangan salah (split pair) lolos tester sederhana?",
          "Link single-mode 1550 nm sepanjang 40 km, 2 sambungan konektor, dan 4 splice. Hitung total redaman dengan nilai tipikal di bab Redaman.",
          "Transmitter -2 dBm dan receiver sensitivitas -18 dBm. Total redaman 9,5 dB. Berapa margin link?",
          "Mengapa konektor UPC dan APC tidak boleh dihubungkan?",
        ],
      },
      {
        t: "tip",
        x: "Kunci jawaban: (1) 24 x 44,45 = 1.066,8 mm; (2) 85 + 3 + 4 = 92 m, di bawah 100 m, tetapi patch cord 7 m masih dalam batas 10 m, jadi ya; (3) pin 4, 5, 7, 8 (pasangan biru dan cokelat), karena Fast Ethernet hanya memakai pin 1, 2, 3, 6; (4) tester hanya memeriksa kontinuitas pin ke pin, sedangkan split pair tetap tersambung ke pin yang benar tetapi pilinan pasangan berbeda; (5) serat 40 x 0,25 = 10 dB; konektor 2 x 0,5 = 1 dB; splice 4 x 0,1 = 0,4 dB; total 11,4 dB; (6) budget = -2 - (-18) = 16 dB; margin = 16 - 9,5 = 6,5 dB; (7) ujung APC miring 8 derajat dan UPC rata, sehingga sambungannya tidak rapat, redaman besar, dan endface bisa rusak.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjawab semua soal tanpa melihat kunci.",
          "Saya sudah mencoba crimping dan menguji satu kabel UTP.",
          "Saya siap melanjutkan ke modul berikutnya.",
        ],
      },
    ],
  },
];

export default chapters;
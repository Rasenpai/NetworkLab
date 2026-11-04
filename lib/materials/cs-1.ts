import { wikiImage } from "./media";
import type { Chapter } from "./types";

const TOPOLOGI_ASCII = `Star (bintang)            Bus                      Ring (cincin)

    PC1                   PC1   PC2   PC3             PC1 ---- PC2
     |                     |     |     |               |        |
PC2--SW--PC3          =====+=====+=====+=====         PC4 ---- PC3
     |
    PC4

Mesh penuh                Hybrid
 A ----- B                Gabungan beberapa topologi,
 | \\   / |                misalnya star di tiap lantai
 |   X   |                yang dihubungkan dalam ring
 | /   \\ |                atau mesh antar gedung.
 C ----- D`;

const ENKAPSULASI_ASCII = `Pengirim                                         Penerima
Application   [ Data ]                          Application
Transport     [ TCP hdr | Data ]   = Segment     Transport
Network       [ IP hdr | Segment ] = Packet      Network
Data Link     [ Eth hdr | Packet | FCS ] = Frame Data Link
Physical      1010011100101... (bit)             Physical`;

const chapters: Chapter[] = [
  {
    title: "Pengantar: Apa Itu Jaringan Komputer",
    blocks: [
      {
        t: "p",
        x: "Jaringan komputer adalah sekumpulan perangkat (komputer, server, ponsel, printer, kamera, dan lainnya) yang saling terhubung supaya bisa bertukar data dan berbagi sumber daya. Hubungannya bisa lewat kabel atau nirkabel.",
      },
      { t: "h", x: "Mengapa jaringan dibutuhkan" },
      {
        t: "ul",
        items: [
          "Berbagi sumber daya: printer, file, dan koneksi internet dipakai bersama.",
          "Komunikasi: email, chat, panggilan suara dan video.",
          "Layanan terpusat: login, database, backup, dan aplikasi di server.",
          "Efisiensi biaya: satu koneksi internet atau satu server dipakai banyak pengguna.",
        ],
      },
      { t: "h", x: "Komponen dasar" },
      {
        t: "table",
        head: ["Komponen", "Peran", "Contoh"],
        rows: [
          ["Host / end device", "Mengirim atau menerima data", "PC, laptop, server, ponsel"],
          ["Perangkat perantara", "Menyalurkan data antar host", "Switch, router, access point, firewall"],
          ["Media", "Jalur fisik atau radio untuk data", "Kabel tembaga, fiber optik, Wi-Fi"],
          ["Protokol", "Aturan format dan urutan pesan", "IP, TCP, HTTP, DNS"],
        ],
      },
      { t: "h", x: "Client dan server" },
      {
        t: "p",
        x: "Pada model client-server, client meminta layanan dan server menyediakannya. Contoh: browser (client) meminta halaman web ke web server. Pada model peer-to-peer, tiap perangkat bisa berperan sebagai client sekaligus server, misalnya berbagi file antar dua laptop.",
      },
      {
        t: "tip",
        x: "Satu perangkat bisa berperan ganda. Laptopmu adalah client saat membuka website, tetapi bisa menjadi server saat kamu menjalankan web server untuk latihan.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan apa itu jaringan dan mengapa dibutuhkan.",
          "Saya bisa membedakan end device dan perangkat perantara.",
          "Saya bisa membedakan client-server dan peer-to-peer.",
        ],
      },
    ],
  },
  {
    title: "Jenis Jaringan & Topologi",
    blocks: [
      { t: "h", x: "Jenis jaringan berdasarkan cakupan" },
      {
        t: "table",
        head: ["Jenis", "Cakupan", "Keterangan"],
        rows: [
          ["PAN", "Beberapa meter", "Personal Area Network, misalnya Bluetooth antara ponsel dan earphone."],
          ["LAN", "Satu gedung atau kampus", "Local Area Network, biasanya dimiliki dan dikelola satu organisasi."],
          ["MAN", "Satu kota", "Metropolitan Area Network, menghubungkan beberapa gedung atau cabang."],
          ["WAN", "Antar kota atau negara", "Wide Area Network, biasanya memakai layanan ISP. Internet adalah gabungan WAN terbesar."],
        ],
      },
      { t: "h", x: "Topologi fisik" },
      {
        t: "p",
        x: "Topologi menggambarkan cara perangkat terhubung. Topologi fisik adalah susunan kabel dan perangkatnya, sedangkan topologi logis adalah jalur data yang sebenarnya mengalir.",
      },
      wikiImage(
        "Diagram of different network topologies.svg",
        "Diagram berbagai topologi jaringan: bus, ring, star, mesh, dan tree",
        "Berbagai topologi jaringan",
        TOPOLOGI_ASCII,
      ),
      {
        t: "table",
        head: ["Topologi", "Kelebihan", "Kekurangan"],
        rows: [
          ["Star", "Mudah dikelola. Satu kabel putus hanya memengaruhi satu perangkat.", "Switch pusat menjadi titik gagal tunggal (single point of failure)."],
          ["Bus", "Hemat kabel.", "Sulit dilacak, dan satu kabel putus memutus semua. Sudah jarang dipakai."],
          ["Ring", "Jalur data teratur.", "Satu titik putus bisa mengganggu seluruh cincin, kecuali memakai dual ring."],
          ["Mesh", "Sangat redundan.", "Mahal dan rumit, jumlah link bertambah cepat seiring jumlah perangkat."],
          ["Hybrid", "Fleksibel, menggabungkan kelebihan beberapa topologi.", "Desain dan pengelolaannya lebih kompleks."],
        ],
      },
      {
        t: "tip",
        x: "Hampir semua LAN modern memakai topologi star (perangkat ke switch). Antar switch atau antar gedung sering memakai mesh sebagian untuk redundansi.",
      },
      {
        t: "check",
        items: [
          "Saya bisa membedakan LAN, MAN, dan WAN.",
          "Saya bisa menggambar topologi star dan menyebut kelemahannya.",
          "Saya bisa membedakan topologi fisik dan logis.",
        ],
      },
    ],
  },
  {
    title: "Model OSI: 7 Lapisan",
    blocks: [
      {
        t: "p",
        x: "Model OSI (Open Systems Interconnection) adalah kerangka acuan yang membagi komunikasi jaringan menjadi 7 lapisan. Tiap lapisan punya tugas sendiri dan hanya berhubungan dengan lapisan di atas dan di bawahnya. Manfaatnya: mempermudah belajar, merancang, dan terutama troubleshooting, karena masalah bisa dipersempit per lapisan.",
      },
      wikiImage(
        "OSI Model v1.svg",
        "Tujuh lapisan model OSI dari Physical sampai Application",
        "Tujuh lapisan model OSI",
      ),
      {
        t: "table",
        head: ["No", "Lapisan", "Tugas utama", "Contoh"],
        rows: [
          ["7", "Application", "Antarmuka layanan untuk aplikasi", "HTTP, DNS, SMTP, FTP"],
          ["6", "Presentation", "Format data, enkripsi, kompresi", "TLS, JPEG, ASCII"],
          ["5", "Session", "Membuka, menjaga, dan menutup sesi", "RPC, NetBIOS"],
          ["4", "Transport", "Pengiriman antar proses, nomor port", "TCP, UDP"],
          ["3", "Network", "Pengalamatan logis dan routing", "IP, ICMP, router"],
          ["2", "Data Link", "Pengiriman antar perangkat dalam satu LAN", "Ethernet, MAC, switch"],
          ["1", "Physical", "Sinyal dan media", "Kabel, fiber, radio"],
        ],
      },
      { t: "h", x: "Penjelasan tiap lapisan (dari bawah)" },
      {
        t: "ol",
        items: [
          "Physical: mengubah bit menjadi sinyal listrik, cahaya, atau radio. Membahas kabel, konektor, dan kecepatan sinyal.",
          "Data Link: membungkus data menjadi frame dan menambahkan alamat MAC. Mendeteksi kesalahan transmisi (FCS). Switch bekerja di sini.",
          "Network: memberi alamat IP dan memilih jalur antar jaringan. Router bekerja di sini.",
          "Transport: memecah data menjadi segmen dan menentukan port tujuan. TCP menyediakan pengiriman andal (ada konfirmasi dan urutan), UDP cepat tanpa jaminan.",
          "Session: mengatur dialog antar aplikasi, misalnya membuka dan menutup sesi.",
          "Presentation: menerjemahkan format data, mengenkripsi, dan mengompresi.",
          "Application: layanan yang langsung dipakai aplikasi, seperti web (HTTP), nama domain (DNS), dan email (SMTP).",
        ],
      },
      {
        t: "tip",
        x: "Pengingat urutan dari lapisan 7 ke 1: All People Seem To Need Data Processing. Dari 1 ke 7: Please Do Not Throw Sausage Pizza Away.",
      },
      {
        t: "warn",
        x: "OSI adalah model acuan, bukan protokol yang benar-benar dipakai di internet. Internet memakai TCP/IP (dibahas di bab 5), dan lapisan 5 sampai 7 di praktik sering menyatu dalam satu aplikasi.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut 7 lapisan OSI secara berurutan.",
          "Saya tahu di lapisan mana switch, router, dan kabel bekerja.",
          "Saya bisa membedakan TCP dan UDP secara singkat.",
        ],
      },
    ],
  },
  {
    title: "Enkapsulasi & Alur Data",
    blocks: [
      {
        t: "p",
        x: "Saat data dikirim, tiap lapisan menambahkan informasi kontrolnya sendiri (header) di depan data dari lapisan di atasnya. Proses ini disebut enkapsulasi. Di sisi penerima terjadi sebaliknya, yaitu dekapsulasi: tiap lapisan membuka header miliknya lalu meneruskan sisanya ke atas.",
      },
      wikiImage(
        "UDP encapsulation.svg",
        "Data aplikasi dibungkus header UDP, lalu IP, lalu Ethernet",
        "Contoh enkapsulasi: data aplikasi dibungkus header tiap lapisan hingga menjadi frame",
        ENKAPSULASI_ASCII,
      ),
      {
        t: "table",
        head: ["Lapisan", "Nama unit data (PDU)", "Alamat / pengenal"],
        rows: [
          ["Application", "Data", "-"],
          ["Transport", "Segment (TCP) atau Datagram (UDP)", "Nomor port"],
          ["Network", "Packet", "Alamat IP"],
          ["Data Link", "Frame", "Alamat MAC"],
          ["Physical", "Bit", "-"],
        ],
      },
      { t: "h", x: "Contoh: membuka website" },
      {
        t: "ol",
        items: [
          "Browser membuat permintaan HTTP (Application).",
          "Transport menambahkan header TCP dengan port tujuan 443 (HTTPS).",
          "Network menambahkan header IP berisi alamat IP asal dan tujuan.",
          "Data Link menambahkan alamat MAC perangkat berikutnya (biasanya MAC gateway) dan FCS.",
          "Physical mengirim bit sebagai sinyal ke kabel atau Wi-Fi.",
          "Di tiap router, frame dibuka sampai lapisan IP lalu dibungkus lagi dengan MAC baru untuk hop berikutnya.",
        ],
      },
      {
        t: "tip",
        x: "Alamat IP tujuan tetap sama dari ujung ke ujung, sedangkan alamat MAC berganti di setiap hop. Memahami ini menjelaskan banyak hal saat membaca capture paket nanti.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan enkapsulasi dan dekapsulasi.",
          "Saya hafal nama PDU tiap lapisan.",
          "Saya tahu alamat mana yang berubah dan yang tetap selama paket melintasi router.",
        ],
      },
    ],
  },
  {
    title: "Model TCP/IP & Perbandingannya dengan OSI",
    blocks: [
      {
        t: "p",
        x: "TCP/IP adalah model yang benar-benar dipakai di internet. Modelnya lebih ringkas, dengan 4 lapisan (sebagian buku memakai 5 lapisan dengan memisahkan Physical dari Network Access).",
      },
      {
        t: "table",
        head: ["Lapisan OSI", "Lapisan TCP/IP", "Contoh protokol"],
        rows: [
          ["7 Application, 6 Presentation, 5 Session", "Application", "HTTP, HTTPS, DNS, DHCP, SSH, SMTP"],
          ["4 Transport", "Transport", "TCP, UDP"],
          ["3 Network", "Internet", "IP, ICMP (ARP sering digambarkan di antara lapisan 2 dan 3)"],
          ["2 Data Link, 1 Physical", "Network Access", "Ethernet, Wi-Fi (802.11)"],
        ],
      },
      { t: "h", x: "Protokol dan port yang wajib dikenal" },
      {
        t: "table",
        head: ["Layanan", "Protokol", "Port"],
        rows: [
          ["HTTP", "TCP", "80"],
          ["HTTPS", "TCP", "443"],
          ["DNS", "UDP / TCP", "53"],
          ["DHCP", "UDP", "67 (server), 68 (client)"],
          ["SSH", "TCP", "22"],
          ["Telnet", "TCP", "23"],
          ["SMTP", "TCP", "25"],
          ["FTP", "TCP", "20 / 21"],
          ["SNMP", "UDP", "161"],
        ],
      },
      { t: "h", x: "Perbedaan utama OSI dan TCP/IP" },
      {
        t: "ul",
        items: [
          "OSI: model acuan 7 lapisan yang dipakai untuk belajar dan troubleshooting.",
          "TCP/IP: model praktis 4 lapisan yang dipakai di internet.",
          "Istilah seperti Layer 2 switch atau Layer 3 router tetap mengacu pada nomor lapisan OSI.",
        ],
      },
      {
        t: "warn",
        x: "Telnet mengirim data, termasuk password, sebagai teks biasa. Gunakan SSH (port 22) untuk mengelola perangkat dari jauh.",
      },
      {
        t: "check",
        items: [
          "Saya bisa memetakan lapisan OSI ke lapisan TCP/IP.",
          "Saya hafal port layanan umum (80, 443, 53, 22, 25).",
          "Saya tahu mengapa SSH dipilih dibanding Telnet.",
        ],
      },
    ],
  },
  {
    title: "Media Transmisi: Kabel Tembaga (UTP)",
    blocks: [
      {
        t: "p",
        x: "Kabel UTP (Unshielded Twisted Pair) berisi 4 pasang kawat tembaga yang dipilin untuk mengurangi interferensi. Ini media paling umum untuk menghubungkan perangkat dalam satu gedung. Konektornya RJ-45.",
      },
      wikiImage(
        "Ethernet RJ45 connector p1160054.jpg",
        "Konektor RJ-45 pada kabel Ethernet",
        "Konektor RJ-45 (8P8C) pada kabel UTP",
      ),
      {
        t: "table",
        head: ["Kategori", "Standar Ethernet", "Kecepatan", "Catatan"],
        rows: [
          ["Cat5", "100BASE-TX", "100 Mbps", "Sudah jarang dipakai untuk instalasi baru."],
          ["Cat5e", "1000BASE-T", "1 Gbps", "Umum untuk LAN kantor dan rumah."],
          ["Cat6", "1000BASE-T / 10GBASE-T", "1 Gbps / 10 Gbps", "10 Gbps hanya sampai sekitar 55 m."],
          ["Cat6a", "10GBASE-T", "10 Gbps", "Sampai 100 m."],
        ],
      },
      {
        t: "warn",
        x: "Panjang maksimal kabel UTP Ethernet adalah 100 meter per segmen (termasuk patch cord di kedua ujung). Lebih dari itu sinyal melemah dan koneksi tidak stabil. Gunakan switch atau fiber untuk jarak lebih jauh.",
      },
      { t: "h", x: "Urutan warna T568B" },
      {
        t: "table",
        head: ["Pin", "Warna kabel", "Pasangan"],
        rows: [
          ["1", "Putih-oranye", "Oranye"],
          ["2", "Oranye", "Oranye"],
          ["3", "Putih-hijau", "Hijau"],
          ["4", "Biru", "Biru"],
          ["5", "Putih-biru", "Biru"],
          ["6", "Hijau", "Hijau"],
          ["7", "Putih-coklat", "Coklat"],
          ["8", "Coklat", "Coklat"],
        ],
        caption:
          "Ethernet 10/100 Mbps hanya memakai pin 1, 2, 3, dan 6. Gigabit memakai kedelapan pin.",
      },
      { t: "h", x: "Straight-through dan crossover" },
      {
        t: "table",
        head: ["Jenis", "Ujung A", "Ujung B", "Dipakai untuk"],
        rows: [
          ["Straight-through", "T568B", "T568B", "Perangkat berbeda jenis, misalnya PC ke switch."],
          ["Crossover", "T568A", "T568B", "Perangkat sejenis pada perangkat lama, misalnya switch ke switch atau PC ke PC."],
        ],
        caption:
          "Perangkat modern umumnya mendukung Auto MDI-X sehingga straight-through bisa dipakai di hampir semua kondisi.",
      },
      { t: "h", x: "Tes dan masalah umum" },
      {
        t: "ul",
        items: [
          "Gunakan LAN tester untuk mengecek 8 kawat berurutan.",
          "Gejala kabel buruk: link naik turun, kecepatan turun ke 100 Mbps, atau banyak error di interface.",
          "Penyebab: crimping salah, kabel terlalu dekat dengan kabel listrik, panjang melebihi 100 m, atau konektor longgar.",
        ],
      },
      {
        t: "tip",
        x: "Jika link hanya naik di 100 Mbps padahal kedua perangkat mendukung gigabit, curigai kabel atau crimpingan: salah satu pasangan yang dipakai gigabit (pin 4, 5, 7, 8) kemungkinan tidak terhubung.",
      },
      {
        t: "check",
        items: [
          "Saya tahu batas panjang UTP dan alasannya.",
          "Saya bisa membedakan straight-through dan crossover.",
          "Saya bisa menyebut kategori kabel untuk 1 Gbps dan 10 Gbps.",
        ],
      },
    ],
  },
  {
    title: "Media Transmisi: Fiber Optik & Nirkabel",
    blocks: [
      { t: "h", x: "Fiber optik" },
      {
        t: "p",
        x: "Fiber optik mengirim data berupa cahaya lewat serat kaca. Keunggulannya: jarak jauh, bandwidth sangat besar, dan kebal terhadap interferensi elektromagnetik.",
      },
      wikiImage(
        "Optical fiber types.svg",
        "Perbandingan jalur cahaya pada fiber multi-mode dan single-mode",
        "Jalur cahaya pada fiber multi-mode dan single-mode",
      ),
      {
        t: "table",
        head: ["Jenis", "Inti serat", "Sumber cahaya", "Jarak umum"],
        rows: [
          ["Single-mode (SM)", "Sekitar 9 µm", "Laser", "Sampai puluhan km"],
          ["Multi-mode (MM)", "50 atau 62,5 µm", "LED / VCSEL", "Puluhan sampai beberapa ratus meter"],
        ],
      },
      {
        t: "ul",
        items: [
          "Multi-mode: untuk dalam gedung atau antar gedung dekat. Contoh: OM3 sekitar 300 m dan OM4 sekitar 400 m pada 10 Gbps.",
          "Single-mode: untuk jarak jauh, backbone antar kota, dan jaringan operator.",
          "Konektor umum: LC (kecil, banyak dipakai di SFP), SC, ST, dan FC.",
          "Warna jaket kabel yang lazim: kuning untuk single-mode, aqua untuk OM3 atau OM4, oranye untuk OM1 atau OM2.",
        ],
      },
      {
        t: "warn",
        x: "Jangan menatap ujung fiber atau port SFP yang aktif. Cahaya laser tidak terlihat dan bisa merusak mata. Tutup konektor yang tidak dipakai dengan dust cap, karena debu adalah penyebab utama redaman tinggi.",
      },
      {
        t: "p",
        x: "Kekuatan sinyal fiber diukur dalam dBm dan redaman dalam dB. Semakin negatif nilai dBm, semakin lemah sinyalnya. Misalnya, level terima -8 dBm jauh lebih kuat daripada -28 dBm.",
      },
      { t: "h", x: "Nirkabel (Wi-Fi)" },
      {
        t: "p",
        x: "Wi-Fi memakai gelombang radio sebagai media. Medianya dipakai bersama oleh semua perangkat di sekitarnya, sehingga lebih mudah terganggu dan lebih perlu diamankan dibanding kabel.",
      },
      wikiImage(
        "2.4 GHz Wi-Fi channels (802.11b,g WLAN).svg",
        "Channel Wi-Fi 2,4 GHz yang saling tumpang tindih",
        "Channel Wi-Fi 2,4 GHz. Hanya channel 1, 6, dan 11 yang tidak saling tumpang tindih.",
      ),
      {
        t: "table",
        head: ["Pita", "Jangkauan", "Kecepatan", "Catatan"],
        rows: [
          ["2,4 GHz", "Lebih jauh, tembus dinding lebih baik", "Lebih rendah", "Padat dan rawan interferensi. Channel yang tidak tumpang tindih: 1, 6, 11."],
          ["5 GHz", "Lebih pendek", "Lebih tinggi", "Lebih sedikit gangguan."],
          ["6 GHz", "Lebih pendek dari 5 GHz", "Tinggi", "Hanya tersedia pada Wi-Fi 6E ke atas, channel lebih lega."],
        ],
      },
      {
        t: "ul",
        items: [
          "Standar umum: 802.11n (Wi-Fi 4), 802.11ac (Wi-Fi 5), 802.11ax (Wi-Fi 6).",
          "Gunakan WPA2 atau WPA3 untuk keamanan. Hindari jaringan terbuka dan WEP.",
          "Sumber gangguan: oven microwave, perangkat Bluetooth, dan AP tetangga di channel yang sama.",
        ],
      },
      {
        t: "check",
        items: [
          "Saya bisa membedakan single-mode dan multi-mode.",
          "Saya tahu risiko dan perlakuan aman terhadap fiber dan konektornya.",
          "Saya bisa membandingkan pita 2,4 GHz dan 5 GHz.",
        ],
      },
    ],
  },
  {
    title: "Perangkat Jaringan: Switch, Router & Lainnya",
    blocks: [
      { t: "h", x: "Perangkat dan lapisan kerjanya" },
      {
        t: "table",
        head: ["Perangkat", "Lapisan OSI", "Fungsi"],
        rows: [
          ["Hub", "1", "Mengulang sinyal ke semua port. Sudah usang."],
          ["Switch", "2", "Meneruskan frame berdasarkan alamat MAC."],
          ["Router", "3", "Meneruskan paket antar jaringan berdasarkan alamat IP."],
          ["Switch Layer 3", "2 dan 3", "Switching cepat plus routing antar VLAN."],
          ["Access Point (AP)", "1 dan 2", "Menghubungkan perangkat nirkabel ke jaringan kabel."],
          ["Firewall", "3 sampai 7", "Menyaring trafik berdasarkan aturan keamanan."],
          ["Modem / ONT", "1", "Mengubah sinyal antara media ISP dan jaringan lokal."],
        ],
      },
      { t: "h", x: "Cara kerja switch" },
      {
        t: "ol",
        items: [
          "Switch membaca alamat MAC sumber dari frame yang masuk, lalu mencatatnya di tabel MAC beserta nomor port-nya (learning).",
          "Jika MAC tujuan ada di tabel, frame dikirim hanya ke port itu (forwarding).",
          "Jika MAC tujuan belum dikenal atau berupa broadcast, frame dikirim ke semua port kecuali port asal (flooding).",
        ],
      },
      { t: "h", x: "Collision domain dan broadcast domain" },
      {
        t: "table",
        head: ["Perangkat", "Collision domain", "Broadcast domain"],
        rows: [
          ["Hub", "Satu untuk semua port", "Satu"],
          ["Switch", "Satu per port (full-duplex)", "Satu, kecuali dipisah VLAN"],
          ["Router", "Satu per interface", "Satu per interface"],
        ],
        caption:
          "Broadcast tidak diteruskan oleh router, sehingga router memisahkan broadcast domain.",
      },
      {
        t: "code",
        lang: "text",
        x: `[PC1]--+
[PC2]--+--[Switch]--[Router]--[Internet]
[PC3]--+      |          |
         satu LAN    default gateway
       (satu broadcast domain)`,
      },
      { t: "h", x: "Peran router" },
      {
        t: "p",
        x: "PC memakai default gateway (alamat IP router) untuk mengirim paket ke luar jaringannya. Router memeriksa tabel routing, memilih jalur terbaik, lalu meneruskan paket ke hop berikutnya. Router juga umumnya menjalankan NAT agar banyak perangkat berbagi satu alamat IP publik.",
      },
      {
        t: "tip",
        x: "Aturan cepat: perangkat satu jaringan berkomunikasi lewat switch (MAC), sedangkan antar jaringan harus lewat router (IP).",
      },
      {
        t: "check",
        items: [
          "Saya bisa menyebut lapisan kerja switch, router, dan hub.",
          "Saya bisa menjelaskan learning, forwarding, dan flooding pada switch.",
          "Saya bisa menjelaskan perbedaan collision domain dan broadcast domain.",
        ],
      },
    ],
  },
  {
    title: "Rangkuman, Troubleshooting per Lapisan & Latihan",
    blocks: [
      {
        t: "p",
        x: "Modul ini membahas konsep jaringan, model OSI dan TCP/IP, media transmisi, dan perangkat jaringan. Nilai praktisnya paling terasa saat troubleshooting: dengan model berlapis, masalah dipersempit dari bawah ke atas.",
      },
      { t: "h", x: "Troubleshooting bottom-up" },
      {
        t: "table",
        head: ["Lapisan", "Yang dicek", "Alat / tanda"],
        rows: [
          ["1 Physical", "Kabel terpasang dan lampu link menyala", "Pemeriksaan fisik, LAN tester"],
          ["2 Data Link", "Interface up, VLAN dan MAC benar", "Status port, tabel MAC"],
          ["3 Network", "IP, subnet mask, dan gateway benar", "ipconfig atau ip a, ping gateway"],
          ["4 Transport", "Port layanan terbuka dan tidak diblokir", "Tes port, aturan firewall"],
          ["7 Application", "Aplikasi atau DNS bermasalah", "nslookup, log aplikasi"],
        ],
      },
      { t: "h", x: "Contoh kasus" },
      {
        t: "p",
        x: "Laptop tersambung ke Wi-Fi tetapi website tidak terbuka. Ping ke gateway berhasil, ping ke 8.8.8.8 berhasil, tetapi ping ke nama domain gagal. Lapisan 1 sampai 3 normal, jadi masalahnya di DNS (lapisan 7). Solusinya memeriksa pengaturan server DNS.",
      },
      { t: "h", x: "Latihan" },
      {
        t: "ol",
        items: [
          "Gambar 7 lapisan OSI dari ingatan, lengkap dengan satu contoh protokol atau perangkat di tiap lapisan.",
          "Sebutkan nama PDU di tiap lapisan saat kamu membuka sebuah website.",
          "Gambar topologi star untuk 4 PC, 1 switch, dan 1 router. Tandai broadcast domain dan collision domain-nya.",
          "Jelaskan mengapa kabel UTP sepanjang 130 m bermasalah, dan sebutkan dua solusi.",
          "Pilih media yang tepat: (a) antar dua gedung berjarak 15 km, (b) PC ke switch di satu ruangan, (c) tablet di lobi. Jelaskan alasannya.",
          "Laptop mendapat IP 169.254.x.x dan tidak bisa mengakses jaringan. Di lapisan mana kamu mulai mencurigai masalahnya, dan apa yang kamu cek lebih dulu?",
        ],
      },
      {
        t: "tip",
        x: "Untuk nomor 6: alamat 169.254.x.x muncul saat perangkat gagal mendapat IP dari DHCP. Mulailah dari kabel atau koneksi Wi-Fi, lalu cek apakah DHCP server menjawab.",
      },
      {
        t: "check",
        items: [
          "Saya bisa menjelaskan model OSI dan TCP/IP beserta contohnya.",
          "Saya bisa memilih media dan perangkat yang sesuai kebutuhan.",
          "Saya bisa menelusuri masalah jaringan dari lapisan bawah ke atas.",
        ],
      },
    ],
  },
];

export default chapters;
// Mock data NetworkLab — statis, tanpa backend.

export type Vendor = "MikroTik" | "Cisco";
export type Level = "Beginner" | "Intermediate" | "Advanced";
export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} mnt`;
  return m ? `${h}j ${m}m` : `${h} jam`;
}

/* ---------- Courses ---------- */

export type Course = {
  id: string;
  title: string;
  vendor: Vendor;
  level: Level;
  lessons: number;
  minutes: number;
  progress: number;
  description: string;
};

export const courses: Course[] = [
  // MikroTik
  { id: "mt-1", vendor: "MikroTik", level: "Beginner", title: "Pengenalan RouterOS & Winbox", lessons: 8, minutes: 120, progress: 100, description: "Mengenal RouterOS, akses Winbox, WebFig, dan terminal serta konfigurasi awal router." },
  { id: "mt-2", vendor: "MikroTik", level: "Beginner", title: "IP Address, DHCP & DNS", lessons: 10, minutes: 180, progress: 80, description: "Setup IP, DHCP server, DNS cache, dan routing statis untuk jaringan lokal." },
  { id: "mt-3", vendor: "MikroTik", level: "Intermediate", title: "Firewall & NAT", lessons: 12, minutes: 240, progress: 45, description: "Filter rule, connection tracking, masquerade, dst-nat, dan hardening router." },
  { id: "mt-4", vendor: "MikroTik", level: "Intermediate", title: "Queue & Bandwidth Management", lessons: 9, minutes: 210, progress: 20, description: "Simple queue, queue tree, mangle, dan PCQ untuk pembagian bandwidth yang adil." },
  { id: "mt-5", vendor: "MikroTik", level: "Intermediate", title: "Hotspot & User Manager", lessons: 8, minutes: 180, progress: 0, description: "Membangun captive portal, voucher, dan manajemen user hotspot." },
  { id: "mt-6", vendor: "MikroTik", level: "Advanced", title: "Routing Dinamis: OSPF & BGP", lessons: 14, minutes: 360, progress: 0, description: "Implementasi OSPF multi-area, dasar BGP, dan route filtering di RouterOS v7." },
  { id: "mt-7", vendor: "MikroTik", level: "Advanced", title: "VPN: L2TP, WireGuard & IPsec", lessons: 11, minutes: 270, progress: 0, description: "Remote access dan site-to-site VPN dengan keamanan yang tepat." },
  { id: "mt-8", vendor: "MikroTik", level: "Advanced", title: "High Availability: VRRP & Failover", lessons: 7, minutes: 180, progress: 0, description: "Redundansi gateway, recursive routing, dan failover dual ISP." },
  // Cisco
  { id: "cs-1", vendor: "Cisco", level: "Beginner", title: "Dasar Jaringan & Model OSI", lessons: 9, minutes: 150, progress: 100, description: "Konsep jaringan, model OSI/TCP-IP, media transmisi, dan perangkat jaringan." },
  { id: "cs-2", vendor: "Cisco", level: "Beginner", title: "Subnetting & IP Addressing", lessons: 12, minutes: 240, progress: 70, description: "IPv4, CIDR, VLSM, dan pengenalan IPv6 dengan latihan terstruktur." },
  { id: "cs-3", vendor: "Cisco", level: "Intermediate", title: "Switching & VLAN", lessons: 11, minutes: 240, progress: 55, description: "Konfigurasi switch Catalyst, VLAN, trunking 802.1Q, dan port security." },
  { id: "cs-4", vendor: "Cisco", level: "Intermediate", title: "Inter-VLAN Routing", lessons: 8, minutes: 180, progress: 30, description: "Router-on-a-stick dan SVI pada multilayer switch." },
  { id: "cs-5", vendor: "Cisco", level: "Intermediate", title: "Routing OSPF Single Area", lessons: 10, minutes: 240, progress: 10, description: "Konsep link-state, neighbor adjacency, dan verifikasi OSPFv2." },
  { id: "cs-6", vendor: "Cisco", level: "Intermediate", title: "STP & EtherChannel", lessons: 8, minutes: 180, progress: 0, description: "Mencegah loop layer 2 dan menggabungkan link dengan LACP." },
  { id: "cs-7", vendor: "Cisco", level: "Advanced", title: "ACL & Network Security", lessons: 10, minutes: 240, progress: 0, description: "Standard dan extended ACL, DHCP snooping, dan hardening perangkat." },
  { id: "cs-8", vendor: "Cisco", level: "Advanced", title: "WAN, BGP & IPsec VPN", lessons: 13, minutes: 300, progress: 0, description: "Konektivitas WAN, eBGP dasar, dan site-to-site IPsec VPN." },
];

export const levelInfo: Record<Level, string> = {
  Beginner: "Fondasi konsep jaringan dan konfigurasi dasar perangkat.",
  Intermediate: "Segmentasi, keamanan, dan routing untuk jaringan skala menengah.",
  Advanced: "Routing dinamis, VPN, redundansi, dan desain jaringan produksi.",
};

export function avgProgress(list: { progress: number }[]) {
  if (!list.length) return 0;
  return Math.round(list.reduce((s, c) => s + c.progress, 0) / list.length);
}

/* ---------- Virtual Lab ---------- */

export type Lab = {
  id: string;
  title: string;
  vendor: Vendor;
  level: Level;
  kind: "Simulasi" | "Studi Kasus";
  devices: number;
  minutes: number;
  status: "Belum dimulai" | "Berjalan" | "Selesai";
  description: string;
};

export const labs: Lab[] = [
  // ───────────── Beginner ─────────────
  // MikroTik · Simulasi
  { id: "lab-1", kind: "Simulasi", vendor: "MikroTik", level: "Beginner", title: "Setup Router Pertama via Winbox", devices: 2, minutes: 30, status: "Selesai", description: "Reset, set identity, IP address, dan akses internet dasar." },
  { id: "lab-2", kind: "Simulasi", vendor: "MikroTik", level: "Beginner", title: "DHCP Server & Static Route", devices: 4, minutes: 45, status: "Selesai", description: "Distribusi IP otomatis ke client dan routing antar dua segmen." },
  { id: "lab-12", kind: "Simulasi", vendor: "MikroTik", level: "Beginner", title: "Static Routing 3 Router", devices: 5, minutes: 40, status: "Belum dimulai", description: "Hubungkan dua LAN lewat tiga router dengan static route dan default route." },
  // MikroTik · Studi Kasus
  { id: "lab-17", kind: "Studi Kasus", vendor: "MikroTik", level: "Beginner", title: "Jaringan Kedai Kopi", devices: 4, minutes: 40, status: "Belum dimulai", description: "Siapkan router bekas untuk jaringan kasir dan WiFi tamu sampai semua perangkat online." },
  { id: "lab-27", kind: "Studi Kasus", vendor: "MikroTik", level: "Beginner", title: "Dua Ruko Satu Internet", devices: 5, minutes: 50, status: "Belum dimulai", description: "Bagikan satu langganan internet ke dua ruko bersebelahan lewat dua router, lengkap dengan DHCP di tiap ruko." },
  // Cisco · Simulasi
  { id: "lab-18", kind: "Simulasi", vendor: "Cisco", level: "Beginner", title: "Konfigurasi Dasar Router & Switch Cisco", devices: 3, minutes: 30, status: "Belum dimulai", description: "Atur hostname, IP interface, dan verifikasi dengan show command." },
  { id: "lab-19", kind: "Simulasi", vendor: "Cisco", level: "Beginner", title: "Static Routing 2 Router Cisco", devices: 4, minutes: 40, status: "Belum dimulai", description: "Hubungkan dua LAN lewat dua router dengan static route dan default route." },
  { id: "lab-20", kind: "Simulasi", vendor: "Cisco", level: "Beginner", title: "DHCP Server di Router Cisco", devices: 4, minutes: 35, status: "Belum dimulai", description: "Buat DHCP pool, excluded address, dan pastikan client mendapat IP otomatis." },
  // Cisco · Studi Kasus
  { id: "lab-30", kind: "Studi Kasus", vendor: "Cisco", level: "Beginner", title: "Jaringan Toko Buku", devices: 5, minutes: 40, status: "Belum dimulai", description: "Siapkan router Cisco bekas untuk jaringan toko buku sampai semua komputer online secara otomatis." },
  { id: "lab-31", kind: "Studi Kasus", vendor: "Cisco", level: "Beginner", title: "Kantor Dua Gedung", devices: 5, minutes: 45, status: "Belum dimulai", description: "Hubungkan gedung utama dan gedung gudang dengan routing statis, lalu bagikan internet ke keduanya." },

  // ───────────── Intermediate ─────────────
  // MikroTik · Simulasi
  { id: "lab-4", kind: "Simulasi", vendor: "MikroTik", level: "Intermediate", title: "Firewall Filter & NAT Masquerade", devices: 4, minutes: 50, status: "Berjalan", description: "Lindungi router dan berikan akses internet ke jaringan lokal." },
  { id: "lab-11", kind: "Simulasi", vendor: "MikroTik", level: "Intermediate", title: "Troubleshooting Kantor Cabang", devices: 5, minutes: 60, status: "Belum dimulai", description: "Cari dan perbaiki gangguan berlapis: interface, IP, gateway, route balik, NAT, dan DNS." },
  { id: "lab-13", kind: "Simulasi", vendor: "MikroTik", level: "Intermediate", title: "Segmentasi 3 LAN dengan Firewall", devices: 5, minutes: 55, status: "Belum dimulai", description: "Pisahkan LAN Guru, Siswa, dan Server dengan matriks akses lewat rule firewall forward." },
  { id: "lab-14", kind: "Simulasi", vendor: "MikroTik", level: "Intermediate", title: "Dua Kantor: DHCP, Routing & NAT", devices: 5, minutes: 70, status: "Belum dimulai", description: "Bangun jaringan dua kantor dari nol: DHCP di tiap LAN, routing antar kantor, dan internet lewat NAT." },
  // MikroTik · Studi Kasus
  { id: "lab-7", kind: "Studi Kasus", vendor: "MikroTik", level: "Intermediate", title: "Jaringan Warnet: Operator, Billing, dan Client", devices: 5, minutes: 60, status: "Selesai", description: "Siapkan jaringan warnet tiga segmen dengan DHCP, internet, dan akses client dibatasi hanya ke server billing." },
  { id: "lab-28", kind: "Studi Kasus", vendor: "MikroTik", level: "Intermediate", title: "Ekspedisi: Pusat dan Dua Gudang", devices: 7, minutes: 85, status: "Belum dimulai", description: "Hubungkan kantor pusat dengan dua gudang dalam topologi bintang: DHCP, routing, dan internet lewat pusat." },
  // Cisco · Simulasi
  { id: "lab-3", kind: "Simulasi", vendor: "Cisco", level: "Intermediate", title: "VLAN & Inter-VLAN Routing", devices: 5, minutes: 60, status: "Berjalan", description: "Buat VLAN, trunk, dan router-on-a-stick di Packet Tracer." },
  { id: "lab-5", kind: "Simulasi", vendor: "Cisco", level: "Intermediate", title: "OSPF Multi-Router", devices: 6, minutes: 75, status: "Belum dimulai", description: "Bangun adjacency OSPF dan verifikasi tabel routing." },
  { id: "lab-21", kind: "Simulasi", vendor: "Cisco", level: "Intermediate", title: "NAT Overload (PAT) ke Internet", devices: 5, minutes: 50, status: "Belum dimulai", description: "Berikan akses internet ke LAN lokal dengan PAT dan verifikasi tabel translasi." },
  { id: "lab-22", kind: "Simulasi", vendor: "Cisco", level: "Intermediate", title: "ACL Standard & Extended", devices: 4, minutes: 55, status: "Belum dimulai", description: "Batasi akses antar jaringan dengan ACL dan uji hasilnya dari tiap segmen." },
  { id: "lab-23", kind: "Simulasi", vendor: "Cisco", level: "Intermediate", title: "Router-on-a-Stick dengan DHCP per VLAN", devices: 4, minutes: 60, status: "Belum dimulai", description: "Pisahkan dua VLAN, hubungkan lewat satu link trunk, dan bagikan IP otomatis dari router." },
  // Cisco · Studi Kasus
  { id: "lab-8", kind: "Studi Kasus", vendor: "Cisco", level: "Intermediate", title: "Jaringan Kantor Cabang 3 Lantai", devices: 8, minutes: 90, status: "Belum dimulai", description: "Rancang VLAN per divisi, DHCP, dan routing antar lantai." },
  { id: "lab-32", kind: "Studi Kasus", vendor: "Cisco", level: "Intermediate", title: "Kampus Tiga Gedung", devices: 6, minutes: 70, status: "Belum dimulai", description: "Hubungkan tiga gedung kampus yang saling terkoneksi dengan OSPF, tanpa satu pun static route." },

  // ───────────── Advanced ─────────────
  // MikroTik · Simulasi
  { id: "lab-6", kind: "Simulasi", vendor: "MikroTik", level: "Advanced", title: "Site-to-Site VPN WireGuard", devices: 4, minutes: 60, status: "Belum dimulai", description: "Hubungkan dua site lewat tunnel WireGuard dengan routing." },
  { id: "lab-15", kind: "Simulasi", vendor: "MikroTik", level: "Advanced", title: "WireGuard Hub-and-Spoke 3 Site", devices: 7, minutes: 90, status: "Belum dimulai", description: "Hubungkan dua cabang ke kantor pusat lewat WireGuard, termasuk trafik antar cabang dan internet lewat hub." },
  { id: "lab-16", kind: "Simulasi", vendor: "MikroTik", level: "Advanced", title: "Troubleshooting Routing 4 Router", devices: 7, minutes: 75, status: "Belum dimulai", description: "Telusuri routing loop, next-hop salah, link mati, dan route balik yang hilang di jaringan 4 router." },
  // MikroTik · Studi Kasus
  { id: "lab-9", kind: "Studi Kasus", vendor: "MikroTik", level: "Advanced", title: "Jaringan Kantor dengan Dual ISP", devices: 5, minutes: 75, status: "Belum dimulai", description: "Hubungkan satu kantor ke dua ISP: kedua jalur terpasang, NAT di keduanya, dan semua LAN online." },
  { id: "lab-33", kind: "Studi Kasus", vendor: "MikroTik", level: "Advanced", title: "Dual ISP Load Balancing & Failover", devices: 6, minutes: 80, status: "Belum dimulai", description: "Gabungkan dua ISP dengan failover otomatis via recursive routing." },
  { id: "lab-29", kind: "Studi Kasus", vendor: "MikroTik", level: "Advanced", title: "Toko Cabang Terhubung ke Pusat", devices: 5, minutes: 75, status: "Belum dimulai", description: "Hubungkan toko cabang ke kantor pusat lewat tunnel WireGuard yang aman di atas internet publik." },
  // Cisco · Simulasi
  { id: "lab-24", kind: "Simulasi", vendor: "Cisco", level: "Advanced", title: "OSPF dengan Default Route ke ISP", devices: 6, minutes: 80, status: "Belum dimulai", description: "Bangun OSPF tiga router, sebarkan default route dari router tepi, dan aktifkan NAT ke internet." },
  { id: "lab-26", kind: "Simulasi", vendor: "Cisco", level: "Advanced", title: "Troubleshooting Routing 3 Router Cisco", devices: 5, minutes: 60, status: "Belum dimulai", description: "Telusuri interface mati, IP salah, next-hop salah, dan route balik yang hilang di jaringan 3 router." },
  // Cisco · Studi Kasus
  { id: "lab-10", kind: "Studi Kasus", vendor: "Cisco", level: "Advanced", title: "Segmentasi Jaringan Sekolah dengan ACL", devices: 7, minutes: 90, status: "Belum dimulai", description: "Pisahkan jaringan guru, siswa, dan server dengan kebijakan ACL." },
  { id: "lab-25", kind: "Studi Kasus", vendor: "Cisco", level: "Advanced", title: "Jaringan Hotel: Staf dan Tamu", devices: 5, minutes: 70, status: "Belum dimulai", description: "Rancang jaringan hotel kecil: VLAN Staf dan Tamu, DHCP, internet, dan pembatasan akses tamu." },
];

/* ---------- Quiz & Exam ---------- */

export type Quiz = {
  id: string;
  title: string;
  vendor: Vendor;
  level: Level;
  kind: "Quiz" | "Exam" | "Sertifikasi";
  questions: number;
  minutes: number;
  passing: number;
  score: number | null;
};

export const quizzes: Quiz[] = [
  { id: "q-1", kind: "Quiz", vendor: "Cisco", level: "Beginner", title: "Dasar Jaringan & OSI", questions: 20, minutes: 15, passing: 70, score: 90 },
  { id: "q-2", kind: "Quiz", vendor: "Cisco", level: "Beginner", title: "Subnetting Cepat", questions: 25, minutes: 20, passing: 70, score: 85 },
  { id: "q-3", kind: "Quiz", vendor: "MikroTik", level: "Beginner", title: "Dasar RouterOS", questions: 20, minutes: 15, passing: 70, score: 95 },
  { id: "q-4", kind: "Quiz", vendor: "MikroTik", level: "Intermediate", title: "Firewall & NAT", questions: 25, minutes: 25, passing: 70, score: 65 },
  { id: "q-5", kind: "Quiz", vendor: "Cisco", level: "Intermediate", title: "VLAN & Trunking", questions: 25, minutes: 25, passing: 70, score: null },
  { id: "q-6", kind: "Quiz", vendor: "MikroTik", level: "Intermediate", title: "Queue & Bandwidth", questions: 20, minutes: 20, passing: 70, score: null },
  { id: "q-7", kind: "Exam", vendor: "MikroTik", level: "Intermediate", title: "Ujian MikroTik Dasar", questions: 50, minutes: 60, passing: 75, score: 82 },
  { id: "q-8", kind: "Exam", vendor: "Cisco", level: "Intermediate", title: "Ujian Networking Fundamentals", questions: 60, minutes: 90, passing: 75, score: null },
  { id: "q-9", kind: "Exam", vendor: "MikroTik", level: "Advanced", title: "Ujian MikroTik Advanced", questions: 50, minutes: 75, passing: 80, score: null },
  { id: "q-10", kind: "Exam", vendor: "Cisco", level: "Advanced", title: "Ujian Routing & Security", questions: 60, minutes: 90, passing: 80, score: null },
  // Simulasi sertifikasi: format mengikuti ujian resmi MikroTik (25 soal, 60 menit, lulus 60%).
  { id: "q-11", kind: "Sertifikasi", vendor: "MikroTik", level: "Beginner", title: "MTCNA — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-12", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCRE — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-13", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCIPv6E — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-14", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCWE — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-15", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCSE — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-16", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCTCE — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-17", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCSWE — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-18", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCUME — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  { id: "q-19", kind: "Sertifikasi", vendor: "MikroTik", level: "Intermediate", title: "MTCEWE — Simulasi Sertifikasi", questions: 25, minutes: 60, passing: 60, score: null },
  // Simulasi CCNA 200-301 v1.1: Cisco hanya mempublikasikan durasi (120 menit). Jumlah soal (100) dan batas lulus (82) adalah perkiraan.
  { id: "q-20", kind: "Sertifikasi", vendor: "Cisco", level: "Intermediate", title: "CCNA — Simulasi Sertifikasi", questions: 100, minutes: 120, passing: 82, score: null },
{ id: "q-21", kind: "Sertifikasi", vendor: "Cisco", level: "Intermediate", title: "CCNA Cybersecurity — Simulasi Sertifikasi", questions: 100, minutes: 120, passing: 82, score: null },
 { id: "q-22", kind: "Sertifikasi", vendor: "Cisco", level: "Intermediate", title: "CCNA Automation — Simulasi Sertifikasi", questions: 100, minutes: 120, passing: 82, score: null },
];

/* ---------- Command Library ---------- */

export type Command = {
  id: string;
  vendor: Vendor;
  category: string;
  title: string;
  command: string;
  note?: string;
};

type RawCommand = Omit<Command, "id">;

const mt = (
  category: string,
  title: string,
  command: string,
  note?: string,
): RawCommand => ({ vendor: "MikroTik", category, title, command, note });

const cs = (
  category: string,
  title: string,
  command: string,
  note?: string,
): RawCommand => ({ vendor: "Cisco", category, title, command, note });

const withIds = (list: RawCommand[], prefix: string): Command[] =>
  list.map((c, i) => ({ id: `c-${prefix}-${i + 1}`, ...c }));

/* ----- MikroTik (RouterOS) ----- */

const mikrotikCommands: RawCommand[] = [
  // ===== Dasar =====
  mt("Dasar", "Ganti nama router", "/system identity set name=R-Core"),
  mt("Dasar", "Lihat resource (CPU, RAM, versi)", "/system resource print"),
  mt("Dasar", "Info board & firmware", "/system routerboard print"),
  mt("Dasar", "Lihat paket terpasang", "/system package print"),
  mt("Dasar", "Cek update RouterOS", "/system package update check-for-updates"),
  mt("Dasar", "Install update RouterOS", "/system package update install", "Router akan reboot otomatis."),
  mt("Dasar", "Upgrade firmware RouterBOARD", "/system routerboard upgrade", "Jalankan /system reboot setelahnya agar firmware baru aktif."),
  mt("Dasar", "Reboot router", "/system reboot"),
  mt("Dasar", "Matikan router", "/system shutdown"),
  mt("Dasar", "Backup konfigurasi", "/system backup save name=backup-awal", "File .backup hanya bisa direstore di perangkat yang sama."),
  mt("Dasar", "Restore backup", "/system backup load name=backup-awal"),
  mt("Dasar", "Export konfigurasi", "/export file=config-awal", "Hasil berupa file teks .rsc yang mudah dibaca dan dipindahkan."),
  mt("Dasar", "Export konfigurasi ke terminal", "/export", "Tanpa file=, hasil langsung ditampilkan di terminal."),
  mt("Dasar", "Export konfigurasi lengkap (verbose)", "/export verbose", "Menyertakan semua parameter, termasuk yang bernilai default."),
  mt("Dasar", "Export termasuk data sensitif", "/export show-sensitive file=config-lengkap", "RouterOS v7. Di v6 export sudah menyertakan data sensitif kecuali memakai hide-sensitive."),
  mt("Dasar", "Import file script (.rsc)", "/import file-name=config-awal.rsc"),
  mt("Dasar", "Reset tanpa konfigurasi default", "/system reset-configuration no-defaults=yes skip-backup=yes", "Menghapus seluruh konfigurasi. Backup dulu jika perlu."),
  mt("Dasar", "Atur zona waktu", "/system clock set time-zone-name=Asia/Jakarta"),
  mt("Dasar", "Aktifkan NTP client", "/system ntp client set enabled=yes\n/system ntp client servers add address=id.pool.ntp.org", "RouterOS v7. Di v6 pakai: /system ntp client set enabled=yes primary-ntp=<ip-server>."),
  mt("Dasar", "Tambah user", "/user add name=teknisi password=<password> group=full"),
  mt("Dasar", "Ganti password user", "/user set admin password=<password>"),
  mt("Dasar", "Nonaktifkan user admin default", "/user disable admin", "Buat user pengganti dulu sebelum menonaktifkan admin."),
  mt("Dasar", "Lihat user yang sedang login", "/user active print"),
  mt("Dasar", "Riwayat perubahan konfigurasi", "/system history print", "Perubahan terakhir bisa di-undo dengan /system history undo."),
  mt("Dasar", "Lihat layanan router", "/ip service print"),
  mt("Dasar", "Matikan layanan yang tidak dipakai", "/ip service disable telnet,ftp,www"),
  mt("Dasar", "Batasi akses Winbox ke subnet tertentu", "/ip service set winbox address=192.168.10.0/24"),
  mt("Dasar", "Matikan neighbor discovery di luar LAN", "/ip neighbor discovery-settings set discover-interface-list=LAN", "Butuh interface list LAN (lihat kategori Interface & VLAN)."),
  mt("Dasar", "Batasi MAC server/Winbox ke LAN", "/tool mac-server set allowed-interface-list=LAN\n/tool mac-server mac-winbox set allowed-interface-list=LAN"),
  mt("Dasar", "Aktifkan RoMON", "/tool romon set enabled=yes", "RoMON memungkinkan manajemen router lewat router lain di layer 2."),
  mt("Dasar", "Lihat neighbor RoMON", "/tool romon discover"),
  mt("Dasar", "Lihat daftar file", "/file print"),
  mt("Dasar", "Aktifkan Cloud DDNS", "/ip cloud set ddns-enabled=yes\n/ip cloud print"),

  // ===== Interface & VLAN =====
  mt("Interface & VLAN", "Lihat daftar interface", "/interface print"),
  mt("Interface & VLAN", "Lihat detail interface ethernet", "/interface ethernet print detail"),
  mt("Interface & VLAN", "Ubah nama interface", "/interface set ether1 name=ether1-WAN"),
  mt("Interface & VLAN", "Nonaktifkan / aktifkan interface", "/interface disable ether5\n/interface enable ether5"),
  mt("Interface & VLAN", "Buat interface list WAN & LAN", "/interface list add name=WAN\n/interface list add name=LAN\n/interface list member add list=WAN interface=ether1\n/interface list member add list=LAN interface=bridge-lan"),
  mt("Interface & VLAN", "Buat bridge dan tambah port", "/interface bridge add name=bridge-lan\n/interface bridge port add bridge=bridge-lan interface=ether2\n/interface bridge port add bridge=bridge-lan interface=ether3"),
  mt("Interface & VLAN", "Lihat konfigurasi bridge", "/interface bridge print detail"),
  mt("Interface & VLAN", "Lihat port bridge", "/interface bridge port print detail"),
  mt("Interface & VLAN", "Atur protokol STP bridge", "/interface bridge set bridge-lan protocol-mode=rstp"),
  mt("Interface & VLAN", "Buat interface VLAN", "/interface vlan add name=vlan10 vlan-id=10 interface=bridge-lan"),
  mt("Interface & VLAN", "Bridge VLAN filtering", "/interface bridge vlan add bridge=bridge-lan tagged=bridge-lan,ether3 untagged=ether2 vlan-ids=10\n/interface bridge port set [find interface=ether2] pvid=10\n/interface bridge set bridge-lan vlan-filtering=yes", "Aktifkan vlan-filtering paling akhir agar koneksi manajemen tidak terputus."),
  mt("Interface & VLAN", "Lihat tabel VLAN bridge", "/interface bridge vlan print"),
  mt("Interface & VLAN", "Bonding (LACP)", "/interface bonding add name=bond1 slaves=ether3,ether4 mode=802.3ad"),
  mt("Interface & VLAN", "Atur speed & duplex manual", "/interface ethernet set ether1 auto-negotiation=no speed=100Mbps full-duplex=yes"),
  mt("Interface & VLAN", "Cek status link ethernet", "/interface ethernet monitor ether1 once"),
  mt("Interface & VLAN", "Lihat tabel MAC bridge", "/interface bridge host print"),
  mt("Interface & VLAN", "Aktifkan neighbor discovery (MNDP/CDP/LLDP) di semua interface", "/ip neighbor discovery-settings set discover-interface-list=all", "Hanya untuk lab. Di jaringan produksi batasi ke interface list LAN."),
  mt("Interface & VLAN", "Lihat neighbor beserta detail", "/ip neighbor print detail"),

  // ===== IP & DHCP =====
  mt("IP & DHCP", "Tambah IP address", "/ip address add address=192.168.10.1/24 interface=ether2"),
  mt("IP & DHCP", "IP kedua di interface yang sama", "/ip address add address=192.168.20.1/24 interface=bridge-lan"),
  mt("IP & DHCP", "Lihat IP address detail", "/ip address print detail"),
  mt("IP & DHCP", "Hapus IP address", "/ip address remove numbers=0"),
  mt("IP & DHCP", "Default route", "/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1"),
  mt("IP & DHCP", "Static route ke jaringan lain", "/ip route add dst-address=192.168.20.0/24 gateway=192.168.1.2"),
  mt("IP & DHCP", "Blackhole route", "/ip route add dst-address=10.0.0.0/8 type=blackhole"),
  mt("IP & DHCP", "DHCP client di interface WAN", "/ip dhcp-client add interface=ether1 disable=no"),
  mt("IP & DHCP", "Lihat DHCP client detail", "/ip dhcp-client print detail"),
  mt("IP & DHCP", "Renew DHCP client", "/ip dhcp-client renew numbers=0"),
  mt("IP & DHCP", "Release DHCP client", "/ip dhcp-client release numbers=0"),
  mt("IP & DHCP", "Setup DHCP server interaktif", "/ip dhcp-server setup"),
  mt("IP & DHCP", "Setup DHCP server manual", "/ip pool add name=pool-lan ranges=192.168.10.10-192.168.10.200\n/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=192.168.10.1\n/ip dhcp-server add name=dhcp-lan interface=bridge-lan address-pool=pool-lan disabled=no"),
  mt("IP & DHCP", "Lihat lease DHCP", "/ip dhcp-server lease print"),
  mt("IP & DHCP", "Static lease (IP tetap per MAC)", "/ip dhcp-server lease add address=192.168.10.50 mac-address=AA:BB:CC:DD:EE:FF server=dhcp-lan"),
  mt("IP & DHCP", "Ubah lease dinamis jadi static", "/ip dhcp-server lease make-static numbers=0"),
  mt("IP & DHCP", "Hapus DHCP lease", "/ip dhcp-server lease remove numbers=0"),
  mt("IP & DHCP", "DHCP relay", "/ip dhcp-relay add name=relay1 interface=ether2 dhcp-server=10.0.0.5 local-address=192.168.10.1 disabled=no"),
  mt("IP & DHCP", "Atur DNS", "/ip dns set servers=8.8.8.8,1.1.1.1 allow-remote-requests=yes"),
  mt("IP & DHCP", "DNS static", "/ip dns static add name=server.lab address=192.168.10.10"),
  mt("IP & DHCP", "Lihat DNS cache", "/ip dns cache print detail"),
  mt("IP & DHCP", "Bersihkan DNS cache", "/ip dns cache flush"),
  mt("IP & DHCP", "Lihat tabel ARP", "/ip arp print"),
  mt("IP & DHCP", "Hapus ARP dinamis", "/ip arp remove [find dynamic=yes]", "Entri ARP static tidak ikut terhapus."),
  mt("IP & DHCP", "ARP static", "/ip arp add address=192.168.10.50 mac-address=AA:BB:CC:DD:EE:FF interface=bridge-lan"),
  mt("IP & DHCP", "PPPoE client", "/interface pppoe-client add name=pppoe-out1 interface=ether1 user=<username> password=<password> add-default-route=yes use-peer-dns=yes disabled=no"),
  mt("IP & DHCP", "PPPoE server", "/interface pppoe-server server add service-name=pppoe1 interface=bridge-lan default-profile=default disabled=no\n/ppp secret add name=user1 password=<password> service=pppoe profile=default"),
  mt("IP & DHCP", "Alamat IPv6", "/ipv6 address add address=2001:db8:1::1/64 interface=ether2"),
  mt("IP & DHCP", "Default route IPv6", "/ipv6 route add dst-address=::/0 gateway=2001:db8::1"),

  // ===== Firewall =====
  mt("Firewall", "Terima koneksi established, related", "/ip firewall filter add chain=input connection-state=established,related action=accept"),
  mt("Firewall", "Buang koneksi invalid", "/ip firewall filter add chain=input connection-state=invalid action=drop"),
  mt("Firewall", "Izinkan ICMP (ping)", "/ip firewall filter add chain=input protocol=icmp action=accept"),
  mt("Firewall", "Batasi laju ICMP", "/ip firewall filter add chain=input protocol=icmp limit=10,20:packet action=accept"),
  mt("Firewall", "Izinkan akses router dari LAN", "/ip firewall filter add chain=input in-interface-list=LAN action=accept"),
  mt("Firewall", "Izinkan SSH hanya dari subnet LAN", "/ip firewall filter add chain=input protocol=tcp dst-port=22 src-address=192.168.10.0/24 action=accept"),
  mt("Firewall", "Drop input baru dari WAN", "/ip firewall filter add chain=input in-interface=ether1 connection-state=new action=drop", "Pasang setelah rule accept untuk established,related dan akses dari LAN."),
  mt("Firewall", "Drop semua input lainnya", "/ip firewall filter add chain=input action=drop", "Harus berada di urutan paling bawah chain input."),
  mt("Firewall", "Drop koneksi dari IP tertentu", "/ip firewall filter add chain=input src-address=203.0.113.10 action=drop"),
  mt("Firewall", "Forward: terima established,related & buang invalid", "/ip firewall filter add chain=forward connection-state=established,related action=accept\n/ip firewall filter add chain=forward connection-state=invalid action=drop"),
  mt("Firewall", "Blokir akses antar subnet", "/ip firewall filter add chain=forward src-address=192.168.10.0/24 dst-address=192.168.20.0/24 action=drop"),
  mt("Firewall", "Blokir IP/subnet via address list", "/ip firewall address-list add list=blokir address=203.0.113.0/24\n/ip firewall filter add chain=forward dst-address-list=blokir action=drop"),
  mt("Firewall", "Lihat address list", "/ip firewall address-list print detail"),
  mt("Firewall", "Deteksi port scan", `/ip firewall filter add chain=input protocol=tcp psd=21,3s,3,1 action=add-src-to-address-list address-list=port-scanner address-list-timeout=2w`),
  mt("Firewall", "Proteksi brute force SSH", `/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh-tahap2 action=add-src-to-address-list address-list=ssh-blacklist address-list-timeout=1d
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new src-address-list=ssh-tahap1 action=add-src-to-address-list address-list=ssh-tahap2 address-list-timeout=1m
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new action=add-src-to-address-list address-list=ssh-tahap1 address-list-timeout=1m
/ip firewall filter add chain=input src-address-list=ssh-blacklist action=drop`, "Rule drop untuk blacklist idealnya diletakkan di urutan atas dengan move."),
  mt("Firewall", "Batasi jumlah koneksi per client", "/ip firewall filter add chain=forward protocol=tcp connection-limit=200,32 action=drop"),
  mt("Firewall", "Batasi SYN dari satu sumber (SYN flood sederhana)", "/ip firewall filter add chain=input protocol=tcp tcp-flags=syn connection-limit=100,32 action=drop", "Proteksi dasar saja. Serangan DDoS skala besar harus ditangani di upstream."),
  mt("Firewall", "Raw: buang trafik dari blacklist lebih awal", "/ip firewall raw add chain=prerouting src-address-list=port-scanner action=drop"),
  mt("Firewall", "FastTrack", "/ip firewall filter add chain=forward action=fasttrack-connection connection-state=established,related hw-offload=yes", "Parameter hw-offload hanya ada di RouterOS v7. FastTrack melewati queue dan mangle."),
  mt("Firewall", "Lihat rule beserta statistik", "/ip firewall filter print stats"),
  mt("Firewall", "Nonaktifkan / pindahkan rule", "/ip firewall filter disable numbers=0\n/ip firewall filter move numbers=5 destination=0"),
  mt("Firewall", "Reset counter rule", "/ip firewall filter reset-counters-all"),
  mt("Firewall", "Lihat koneksi aktif", "/ip firewall connection print"),
  mt("Firewall", "Hapus semua connection tracking", "/ip firewall connection remove [find]", "Memutus semua koneksi yang sedang berjalan, termasuk NAT. Gunakan saat uji rule baru."),
  mt("Firewall", "Lihat raw rule detail", "/ip firewall raw print detail"),
  mt("Firewall", "Lihat mangle rule detail", "/ip firewall mangle print detail"),
  mt("Firewall", "Mangle: mark connection & routing", "/ip firewall mangle add chain=prerouting in-interface=bridge-lan connection-mark=no-mark action=mark-connection new-connection-mark=conn-isp1 passthrough=yes\n/ip firewall mangle add chain=prerouting connection-mark=conn-isp1 in-interface=bridge-lan action=mark-routing new-routing-mark=to-isp1 passthrough=no"),
  mt("Firewall", "Mangle: PCC load balancing", "/ip firewall mangle add chain=prerouting in-interface=bridge-lan dst-address-type=!local per-connection-classifier=both-addresses:2/0 action=mark-connection new-connection-mark=isp1_conn passthrough=yes"),
  mt("Firewall", "Mangle: clamp MSS (PPPoE)", "/ip firewall mangle add chain=forward protocol=tcp tcp-flags=syn out-interface=pppoe-out1 action=change-mss new-mss=clamp-to-pmtu passthrough=yes"),

  // ===== NAT =====
  mt("NAT", "NAT masquerade", "/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade"),
  mt("NAT", "NAT masquerade dengan interface list", "/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade"),
  mt("NAT", "Port forwarding", "/ip firewall nat add chain=dstnat in-interface=ether1 protocol=tcp dst-port=8080 action=dst-nat to-addresses=192.168.10.10 to-ports=80"),
  mt("NAT", "Hairpin NAT (akses server via IP publik dari LAN)", "/ip firewall nat add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.10.10 protocol=tcp dst-port=80 action=masquerade"),
  mt("NAT", "Paksa semua DNS client ke router", "/ip firewall nat add chain=dstnat in-interface-list=LAN protocol=udp dst-port=53 action=redirect to-ports=53"),
  mt("NAT", "Transparent redirect port", "/ip firewall nat add chain=dstnat protocol=tcp dst-port=80 src-address=192.168.10.0/24 action=redirect to-ports=8080"),
  mt("NAT", "Netmap (petakan subnet)", "/ip firewall nat add chain=dstnat dst-address=10.1.1.0/24 action=netmap to-addresses=192.168.10.0/24"),
  mt("NAT", "Nonaktifkan service-port ALG", "/ip firewall service-port disable sip,h323"),
  mt("NAT", "Lihat NAT rule detail", "/ip firewall nat print detail"),

  // ===== Routing =====
  mt("Routing", "Lihat tabel routing", "/ip route print"),
  mt("Routing", "Lihat route aktif saja", "/ip route print where active"),
  mt("Routing", "Lihat route berdasarkan gateway", "/ip route print where gateway=192.168.1.1"),
  mt("Routing", "Route cadangan (distance lebih besar)", "/ip route add dst-address=0.0.0.0/0 gateway=192.168.2.1 distance=2"),
  mt("Routing", "ECMP load balancing", "/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1,192.168.2.1"),
  mt("Routing", "Tabel routing & aturan policy routing (v7)", "/routing table add name=to-isp2 fib\n/routing rule add src-address=192.168.10.0/24 action=lookup table=to-isp2\n/ip route add dst-address=0.0.0.0/0 gateway=192.168.2.1 routing-table=to-isp2"),
  mt("Routing", "Lihat tabel routing & rule (v7)", "/routing table print\n/routing rule print"),
  mt("Routing", "OSPF instance (v7)", "/routing ospf instance add name=ospf1 version=2 router-id=1.1.1.1"),
  mt("Routing", "OSPF area & interface template (v7)", "/routing ospf area add name=backbone area-id=0.0.0.0 instance=ospf1\n/routing ospf interface-template add area=backbone networks=192.168.10.0/24", "Tambahkan parameter passive pada template untuk interface yang tidak perlu membentuk neighbor."),
  mt("Routing", "OSPF (v6)", "/routing ospf instance set default router-id=1.1.1.1\n/routing ospf network add network=192.168.10.0/24 area=backbone"),
  mt("Routing", "Cek neighbor & LSA OSPF", "/routing ospf neighbor print\n/routing ospf lsa print", "Di v6, perintah neighbor sama; lsa tersedia dengan nama yang sama."),
  mt("Routing", "Lihat interface & LSA OSPF detail", "/routing ospf interface print detail\n/routing ospf lsa print detail"),
  mt("Routing", "BGP (v7)", "/routing bgp template set default as=65000 router-id=1.1.1.1\n/routing bgp connection add name=ke-isp remote.address=203.0.113.1 remote.as=65001 local.role=ebgp templates=default", "Parameter BGP v7 berbeda dari v6, sesuaikan dengan versi RouterOS."),
  mt("Routing", "BGP (v6)", "/routing bgp instance set default as=65000 router-id=1.1.1.1\n/routing bgp peer add name=ke-isp remote-address=203.0.113.1 remote-as=65001\n/routing bgp network add network=192.168.10.0/24"),
  mt("Routing", "Lihat status BGP (v7)", "/routing bgp connection print detail\n/routing bgp session print\n/routing bgp advertisements print"),
  mt("Routing", "RIP (v6)", "/routing rip network add network=192.168.10.0/24"),
  mt("Routing", "Route filter (v7)", `/routing filter rule add chain=ospf-out rule="if (dst == 10.0.0.0/8) { reject }"`),

  // ===== VPN =====
  mt("VPN", "WireGuard: interface & IP", "/interface wireguard add name=wg0 listen-port=13231\n/ip address add address=10.10.10.1/24 interface=wg0"),
  mt("VPN", "WireGuard: tambah peer", `/interface wireguard peers add interface=wg0 public-key="<public-key-peer>" allowed-address=10.10.10.2/32 endpoint-address=203.0.113.2 endpoint-port=13231 persistent-keepalive=25s`, "Lihat public key router sendiri lewat /interface wireguard print."),
  mt("VPN", "WireGuard: izinkan port di firewall", "/ip firewall filter add chain=input protocol=udp dst-port=13231 action=accept"),
  mt("VPN", "L2TP server + IPsec", "/interface l2tp-server server set enabled=yes use-ipsec=yes ipsec-secret=<secret> default-profile=default-encryption\n/ppp secret add name=vpn1 password=<password> service=l2tp local-address=10.10.20.1 remote-address=10.10.20.2"),
  mt("VPN", "L2TP client", "/interface l2tp-client add name=l2tp-out1 connect-to=203.0.113.1 user=vpn1 password=<password> use-ipsec=yes ipsec-secret=<secret> disabled=no"),
  mt("VPN", "IPsec site-to-site", "/ip ipsec profile add name=prof1 hash-algorithm=sha256 enc-algorithm=aes-256 dh-group=modp2048\n/ip ipsec proposal add name=prop1 auth-algorithms=sha256 enc-algorithms=aes-256-cbc pfs-group=modp2048\n/ip ipsec peer add name=peer1 address=203.0.113.2/32 profile=prof1 exchange-mode=ike2\n/ip ipsec identity add peer=peer1 auth-method=pre-shared-key secret=<secret>\n/ip ipsec policy add src-address=192.168.10.0/24 dst-address=192.168.20.0/24 tunnel=yes sa-src-address=203.0.113.1 sa-dst-address=203.0.113.2 peer=peer1 proposal=prop1"),
  mt("VPN", "IPsec: bypass NAT untuk trafik tunnel", "/ip firewall nat add chain=srcnat src-address=192.168.10.0/24 dst-address=192.168.20.0/24 action=accept place-before=0"),
  mt("VPN", "EoIP tunnel", "/interface eoip add name=eoip1 remote-address=203.0.113.2 tunnel-id=10"),
  mt("VPN", "GRE tunnel", "/interface gre add name=gre1 remote-address=203.0.113.2 local-address=203.0.113.1"),
  mt("VPN", "Lihat status IPsec", "/ip ipsec active-peers print\n/ip ipsec installed-sa print"),

  // ===== Hotspot =====
  mt("Hotspot", "Setup hotspot interaktif", "/ip hotspot setup"),
  mt("Hotspot", "Profil user hotspot", "/ip hotspot user profile add name=paket-1jam rate-limit=2M/5M session-timeout=1h shared-users=1"),
  mt("Hotspot", "Tambah user hotspot", "/ip hotspot user add name=user1 password=<password> profile=paket-1jam limit-uptime=1h"),
  mt("Hotspot", "Lihat user aktif", "/ip hotspot active print"),
  mt("Hotspot", "Kick user aktif", "/ip hotspot active remove numbers=0"),
  mt("Hotspot", "Walled garden (situs tanpa login)", "/ip hotspot walled-garden add dst-host=*.contoh.com"),
  mt("Hotspot", "IP binding bypass untuk perangkat tertentu", "/ip hotspot ip-binding add mac-address=AA:BB:CC:DD:EE:FF type=bypassed"),
  mt("Hotspot", "User Manager: daftarkan router (v7)", "/user-manager router add name=lokal address=127.0.0.1 shared-secret=<secret>", "Butuh paket user-manager di RouterOS v7."),
  mt("Hotspot", "User Manager: tambah user (v7)", "/user-manager user add name=user1 password=<password>"),

  // ===== Wireless (termasuk CAPsMAN & roaming) =====
  mt("Wireless", "Security profile WPA2 (v6)", "/interface wireless security-profiles add name=sec1 mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key=<password>"),
  mt("Wireless", "Aktifkan AP (v6)", "/interface wireless set wlan1 mode=ap-bridge ssid=NetworkLab security-profile=sec1 disabled=no"),
  mt("Wireless", "Konfigurasi AP (v7, paket wifi)", "/interface wifi set wifi1 configuration.ssid=NetworkLab configuration.mode=ap security.authentication-types=wpa2-psk security.passphrase=<password> disabled=no", "Untuk perangkat dengan paket wifi di RouterOS v7.13 ke atas."),
  mt("Wireless", "Scan jaringan WiFi (v6)", "/interface wireless scan wlan1"),
  mt("Wireless", "Lihat client terhubung (v6)", "/interface wireless registration-table print"),
  mt("Wireless", "Lihat client terhubung (v7, paket wifi)", "/interface wifi registration-table print"),
  mt("Wireless", "Access list MAC (v6)", "/interface wireless access-list add mac-address=AA:BB:CC:DD:EE:FF interface=wlan1 authentication=yes"),
  mt("Wireless", "CAPsMAN controller (v6)", "/caps-man manager set enabled=yes\n/caps-man security add name=sec-nl authentication-types=wpa2-psk encryption=aes-ccm passphrase=<password>\n/caps-man configuration add name=cfg-nl ssid=NetworkLab security=sec-nl\n/caps-man provisioning add action=create-dynamic-enabled master-configuration=cfg-nl", "Berlaku untuk paket wireless (legacy) di RouterOS v6 dan v7 yang masih memakai paket wireless."),
  mt("Wireless", "CAPsMAN: forwarding lokal di AP (v6)", "/caps-man datapath add name=dp-local local-forwarding=yes bridge=bridge-lan\n/caps-man configuration set cfg-nl datapath=dp-local", "Trafik client tidak perlu lewat controller sehingga controller tidak jadi bottleneck."),
  mt("Wireless", "CAP: hubungkan AP ke controller (v6)", "/interface wireless cap set enabled=yes interfaces=wlan1 discovery-interfaces=bridge-lan"),
  mt("Wireless", "CAPsMAN: lihat AP & client (v6)", "/caps-man remote-cap print\n/caps-man interface print\n/caps-man registration-table print"),
  mt("Wireless", "CAPsMAN controller (v7, paket wifi)", "/interface wifi security add name=sec-nl authentication-types=wpa2-psk passphrase=<password>\n/interface wifi configuration add name=cfg-nl ssid=NetworkLab security=sec-nl\n/interface wifi capsman set enabled=yes interfaces=bridge-lan\n/interface wifi provisioning add action=create-dynamic-enabled master-configuration=cfg-nl", "Untuk paket wifi di RouterOS v7.13 ke atas."),
  mt("Wireless", "CAP: hubungkan AP ke controller (v7)", "/interface wifi cap set enabled=yes discovery-interfaces=bridge-lan"),
  mt("Wireless", "CAPsMAN: lihat AP (v7)", "/interface wifi capsman remote-cap print"),
  mt("Wireless", "Roaming: tolak client sinyal lemah (CAPsMAN v6)", "/caps-man access-list add action=reject signal-range=-120..-85 interface=any", "Client dipaksa pindah ke AP lain yang sinyalnya lebih kuat. Jangan set terlalu agresif."),
  mt("Wireless", "Roaming: tolak client sinyal lemah (v7)", "/interface wifi access-list add action=reject signal-range=-120..-85"),
  mt("Wireless", "Roaming cepat 802.11r/k/v (v7)", "/interface wifi security set sec-nl ft=yes ft-over-ds=yes\n/interface wifi configuration set cfg-nl steering.rrm=yes steering.wnm=yes", "Butuh RouterOS v7.13+ dan client yang mendukung 802.11r/k/v."),

  // ===== Network Security =====
  mt("Network Security", "RADIUS: daftarkan server", "/radius add service=hotspot,ppp,wireless address=192.168.10.5 secret=<secret>"),
  mt("Network Security", "RADIUS: terima CoA/Disconnect dari server", "/radius incoming set accept=yes port=3799"),
  mt("Network Security", "RADIUS untuk login PPP (PPPoE/L2TP)", "/ppp aaa set use-radius=yes accounting=yes"),
  mt("Network Security", "RADIUS untuk hotspot", "/ip hotspot profile set default use-radius=yes"),
  mt("Network Security", "RADIUS: cek statistik", "/radius monitor 0 once"),
  mt("Network Security", "802.1X di port ethernet (v7)", "/interface dot1x server add interface=ether2 auth-types=dot1x", "RouterOS v7. RADIUS server wajib sudah terdaftar dengan service=dot1x."),
  mt("Network Security", "WPA2-Enterprise 802.1X (v6)", "/interface wireless security-profiles add name=eap1 mode=dynamic-keys authentication-types=wpa2-eap eap-methods=passthrough", "AP meneruskan autentikasi ke RADIUS (service=wireless)."),
  mt("Network Security", "DHCP snooping pada bridge", "/interface bridge set bridge-lan dhcp-snooping=yes add-dhcp-option82=yes\n/interface bridge port set [find interface=ether1] trusted=yes", "Port yang menuju DHCP server resmi harus ditandai trusted."),
  mt("Network Security", "Cegah ARP spoofing (reply-only)", "/interface bridge set bridge-lan arp=reply-only\n/ip dhcp-server set dhcp-lan add-arp=yes", "Hanya perangkat yang punya lease DHCP yang dijawab ARP-nya."),
  mt("Network Security", "Strong crypto untuk SSH", "/ip ssh set strong-crypto=yes"),
  mt("Network Security", "Batasi SSH ke subnet manajemen", "/ip service set ssh address=192.168.10.0/24"),

  // ===== QoS (traffic shaping, policing, prioritization) =====
  mt("QoS", "Simple queue per client", "/queue simple add name=client-1 target=192.168.10.20/32 max-limit=5M/10M", "Format max-limit: upload/download."),
  mt("QoS", "Simple queue dengan burst", "/queue simple add name=client-burst target=192.168.10.21/32 max-limit=5M/10M burst-limit=10M/20M burst-threshold=3M/6M burst-time=10s/10s"),
  mt("QoS", "Simple queue dengan limit-at & prioritas", "/queue simple add name=server target=192.168.10.10/32 max-limit=20M/20M limit-at=5M/5M priority=1/1"),
  mt("QoS", "Buat tipe queue PCQ", "/queue type add name=pcq-upload kind=pcq pcq-classifier=src-address pcq-rate=0\n/queue type add name=pcq-download kind=pcq pcq-classifier=dst-address pcq-rate=0"),
  mt("QoS", "PCQ untuk seluruh LAN", "/queue simple add name=semua-lan target=192.168.10.0/24 queue=pcq-upload/pcq-download max-limit=20M/50M"),
  mt("QoS", "Mangle mark packet untuk queue tree", "/ip firewall mangle add chain=prerouting src-address=192.168.10.0/24 action=mark-packet new-packet-mark=pkt-up passthrough=no\n/ip firewall mangle add chain=forward dst-address=192.168.10.0/24 action=mark-packet new-packet-mark=pkt-down passthrough=no"),
  mt("QoS", "Queue tree", "/queue tree add name=total-down parent=bridge-lan packet-mark=pkt-down queue=pcq-download max-limit=50M\n/queue tree add name=total-up parent=ether1 packet-mark=pkt-up queue=pcq-upload max-limit=20M"),
  mt("QoS", "Prioritaskan trafik VoIP di queue tree", "/ip firewall mangle add chain=forward protocol=udp dst-port=5060,10000-20000 action=mark-packet new-packet-mark=voip passthrough=no\n/queue tree add name=prio-voip parent=global packet-mark=voip priority=1 limit-at=2M max-limit=10M", "Priority 1 adalah yang tertinggi, 8 yang terendah."),
  mt("QoS", "Marking DSCP", "/ip firewall mangle add chain=forward protocol=udp dst-port=5060 action=change-dscp new-dscp=46 passthrough=yes"),
  mt("QoS", "Set priority (VLAN PCP) pada paket", "/ip firewall mangle add chain=postrouting protocol=udp dst-port=5060 action=set-priority new-priority=6 passthrough=yes"),
  mt("QoS", "Tipe queue SFQ", "/queue type add name=sfq-adil kind=sfq sfq-perturb=5 sfq-allot=1514"),
  mt("QoS", "Tipe queue CAKE (v7)", "/queue type add name=cake-down kind=cake cake-bandwidth=50M\n/queue simple add name=cake-lan target=192.168.10.0/24 queue=cake-down/cake-down", "Hanya tersedia di RouterOS v7. Cocok untuk mengurangi bufferbloat."),
  mt("QoS", "Policing: batasi laju ICMP dengan drop", "/ip firewall filter add chain=forward protocol=icmp limit=50,5:packet action=accept\n/ip firewall filter add chain=forward protocol=icmp action=drop", "RouterOS tidak punya policer khusus. Pembatasan laju dengan drop dilakukan lewat limit di firewall."),
  mt("QoS", "Lihat statistik queue", "/queue simple print stats\n/queue tree print stats"),

  // ===== High Availability =====
  mt("High Availability", "VRRP (redundansi gateway)", "/interface vrrp add name=vrrp1 interface=ether2 vrid=10 priority=200\n/ip address add address=192.168.10.254/24 interface=vrrp1", "Router backup memakai vrid sama dengan priority lebih rendah."),
  mt("High Availability", "Lihat status VRRP", "/interface vrrp print detail"),
  mt("High Availability", "Failover recursive dual ISP", "/ip route add dst-address=8.8.8.8/32 gateway=192.168.1.1 scope=10\n/ip route add dst-address=0.0.0.0/0 gateway=8.8.8.8 target-scope=11 check-gateway=ping distance=1"),
  mt("High Availability", "Failover dengan check-gateway", "/ip route add dst-address=0.0.0.0/0 gateway=192.168.1.1 distance=1 check-gateway=ping\n/ip route add dst-address=0.0.0.0/0 gateway=192.168.2.1 distance=2"),
  mt("High Availability", "Netwatch (jalankan script saat host down/up)", `/tool netwatch add host=8.8.8.8 interval=10s down-script="/log warning isp-down" up-script="/log info isp-up"`),
  mt("High Availability", "Lihat status netwatch", "/tool netwatch print"),
  mt("High Availability", "Bonding active-backup (redundansi link)", "/interface bonding add name=bond-ha slaves=ether3,ether4 mode=active-backup link-monitoring=mii"),

  // ===== Monitoring (SNMP, Syslog, NetFlow, Traffic) =====
  mt("Monitoring", "Aktifkan SNMP", "/snmp set enabled=yes contact=admin location=lab"),
  mt("Monitoring", "SNMP community: batasi ke monitoring server", "/snmp community set [find default=yes] name=<community> addresses=192.168.10.5/32 read-access=yes write-access=no"),
  mt("Monitoring", "Lihat pengaturan SNMP", "/snmp print\n/snmp community print"),
  mt("Monitoring", "Lihat log", "/log print"),
  mt("Monitoring", "Filter log berdasarkan topik", `/log print where topics~"firewall"`),
  mt("Monitoring", "Lihat log realtime", "/log print follow"),
  mt("Monitoring", "Log firewall (rule dengan log=yes)", `/ip firewall filter add chain=input protocol=tcp dst-port=22 action=accept log=yes log-prefix="SSH"`),
  mt("Monitoring", "Kirim log ke syslog server", "/system logging action add name=remote target=remote remote=192.168.10.5\n/system logging add topics=info action=remote"),
  mt("Monitoring", "NetFlow / Traffic-Flow", "/ip traffic-flow set enabled=yes interfaces=ether1\n/ip traffic-flow target add dst-address=192.168.10.5 port=2055 version=9"),
  mt("Monitoring", "Lihat pengaturan Traffic-Flow", "/ip traffic-flow print\n/ip traffic-flow target print"),
  mt("Monitoring", "Monitor trafik interface", "/interface monitor-traffic ether1"),
  mt("Monitoring", "Monitor trafik interface sekali tampil", "/interface monitor-traffic ether1 once"),
  mt("Monitoring", "Torch trafik interface", "/tool torch interface=ether1"),
  mt("Monitoring", "Torch berdasarkan protokol", "/tool torch interface=ether1 protocol=tcp"),
  mt("Monitoring", "Torch berdasarkan port", "/tool torch interface=ether1 port=443"),
  mt("Monitoring", "Graphing interface", "/tool graphing interface add interface=ether1 store-on-disk=no"),
  mt("Monitoring", "Graphing resource (CPU, RAM, disk)", "/tool graphing resource add"),
  mt("Monitoring", "IP accounting (volume per IP)", "/ip accounting set enabled=yes\n/ip accounting snapshot take\n/ip accounting snapshot print", "Menghitung total byte per pasangan IP sumber dan tujuan."),
  mt("Monitoring", "Bandwidth test antar router", "/tool bandwidth-test address=192.168.10.2 direction=both user=admin password=<password>"),
  mt("Monitoring", "Cek counter & error interface", "/interface print stats"),
  mt("Monitoring", "Statistik interface detail", "/interface print stats-detail"),
  mt("Monitoring", "Hitung jumlah koneksi aktif", "/ip firewall connection print count-only"),
  mt("Monitoring", "Pengaturan connection tracking", "/ip firewall connection tracking print"),
  mt("Monitoring", "Kondisi hardware (suhu, voltase)", "/system health print"),
  mt("Monitoring", "Beban CPU per core", "/system resource cpu print"),
  mt("Monitoring", "Profil beban CPU per proses", "/tool profile"),

  // ===== Automation (API, scripting, scheduled tasks) =====
  mt("Automation", "Jadwalkan tugas (scheduler)", `/system scheduler add name=reboot-mingguan interval=1w start-time=03:00:00 on-event="/system reboot"`),
  mt("Automation", "Jalankan script saat router menyala", `/system scheduler add name=saat-boot start-time=startup on-event="/log info router-menyala"`),
  mt("Automation", "Lihat scheduler", "/system scheduler print detail"),
  mt("Automation", "Buat script", `/system script add name=hello source="/log info hello"`),
  mt("Automation", "Jalankan script", "/system script run hello"),
  mt("Automation", "Lihat script", "/system script print detail"),
  mt("Automation", "Lihat job script yang sedang berjalan", "/system script job print"),
  mt("Automation", "Script: variabel dan output", `:local nama "NetworkLab"
:put ("Halo " . $nama)`),
  mt("Automation", "Script: loop semua interface", `:foreach i in=[/interface find] do={ :put [/interface get $i name] }`),
  mt("Automation", "Script: kondisi if", `:if ([/ping 8.8.8.8 count=2] = 0) do={ :log warning "Internet putus" }`),
  mt("Automation", "Script: backup otomatis dengan nama identity", `/system backup save name=("backup-" . [/system identity get name])`, "Tempel di script lalu jadwalkan dengan scheduler."),
  mt("Automation", "Kirim email dari router", `/tool e-mail set server=<smtp-server> port=587 from=router@contoh.com user=<username> password=<password> tls=yes
/tool e-mail send to=admin@contoh.com subject="Peringatan" body="ISP down"`, "Parameter tls berbeda antar versi. Di v7 gunakan tls=starttls untuk port 587."),
  mt("Automation", "Aktifkan API (port 8728)", "/ip service enable api\n/ip service set api address=192.168.10.0/24", "API tanpa enkripsi. Batasi ke subnet manajemen."),
  mt("Automation", "Aktifkan API-SSL (port 8729)", "/ip service enable api-ssl", "Butuh sertifikat. Lebih aman daripada API biasa."),
  mt("Automation", "REST API (v7)", "/ip service enable www-ssl\n# contoh pemanggilan dari komputer lain:\n# curl -k -u admin:<password> https://192.168.10.1/rest/system/resource", "REST API tersedia di RouterOS v7.1 ke atas dan berjalan di service www / www-ssl."),

  // ===== Troubleshooting (packet capture, MTU, duplex, routing) =====
  mt("Troubleshooting", "Ping dengan jumlah terbatas", "/ping 8.8.8.8 count=4"),
  mt("Troubleshooting", "Ping lewat interface tertentu", "/ping 8.8.8.8 interface=ether1 count=5"),
  mt("Troubleshooting", "Traceroute", "/tool traceroute 8.8.8.8"),
  mt("Troubleshooting", "Traceroute lewat interface tertentu", "/tool traceroute 8.8.8.8 interface=ether1"),
  mt("Troubleshooting", "Packet sniffer cepat", "/tool sniffer quick ip-address=192.168.10.20"),
  mt("Troubleshooting", "Packet sniffer dengan filter port", "/tool sniffer quick interface=ether1 port=53"),
  mt("Troubleshooting", "Packet capture ke file (.pcap)", "/tool sniffer set filter-interface=ether1 filter-ip-address=192.168.10.20/32 file-name=capture.pcap file-limit=4000\n/tool sniffer start\n/tool sniffer stop", "Ambil file dari /file print lalu buka di Wireshark."),
  mt("Troubleshooting", "Streaming capture ke Wireshark", "/tool sniffer set streaming-enabled=yes streaming-server=192.168.10.5 filter-interface=ether1\n/tool sniffer start", "Di Wireshark gunakan filter: udp port 37008."),
  mt("Troubleshooting", "Lihat paket hasil capture", "/tool sniffer packet print"),
  mt("Troubleshooting", "Uji MTU (do-not-fragment)", "/ping 8.8.8.8 size=1500 do-not-fragment count=3", "Ukuran 1500 termasuk header IP+ICMP (28 byte). Jika gagal, turunkan ukuran sampai berhasil. MTU efektif = ukuran berhasil + 28."),
  mt("Troubleshooting", "Cari path MTU dengan ukuran 1472", "/ping 8.8.8.8 size=1472 do-not-fragment count=3", "Jika berhasil, path MTU 1500. Pada PPPoE biasanya 1492 sehingga ukuran maksimum 1464."),
  mt("Troubleshooting", "Lihat MTU interface", "/interface print detail where name=ether1"),
  mt("Troubleshooting", "Ubah MTU interface", "/interface set ether1 mtu=1480"),
  mt("Troubleshooting", "Cek speed & duplex hasil negosiasi", "/interface ethernet monitor ether1 once", "Perhatikan field rate dan full-duplex. Setengah duplex atau rate rendah menandakan kabel atau mismatch."),
  mt("Troubleshooting", "Cek error CRC / FCS interface", "/interface ethernet print stats", "Nilai rx-fcs-error yang terus naik menandakan kabel bermasalah atau duplex mismatch."),
  mt("Troubleshooting", "Cable test", "/interface ethernet cable-test ether1", "Hanya tersedia di model RouterBOARD tertentu."),
  mt("Troubleshooting", "Cek route menuju IP tertentu", "/ip route check 8.8.8.8"),
  mt("Troubleshooting", "Cari route berdasarkan tujuan", "/ip route print where dst-address=0.0.0.0/0"),
  mt("Troubleshooting", "Cari koneksi berdasarkan IP tujuan", `/ip firewall connection print where dst-address~"8.8.8.8"`),
  mt("Troubleshooting", "Lihat ARP yang belum terjawab", "/ip arp print where status=incomplete"),
  mt("Troubleshooting", "Ping lewat MAC address", "/tool mac-ping AA:BB:CC:DD:EE:FF", "Berguna saat IP perangkat belum diatur atau salah."),
  mt("Troubleshooting", "Scan IP di jaringan", "/tool ip-scan interface=bridge-lan"),
  mt("Troubleshooting", "Lihat perangkat tetangga", "/ip neighbor print"),
  mt("Troubleshooting", "Test resolve DNS", ":resolve domain-name=google.com"),
  mt("Troubleshooting", "Download file / cek HTTP dari router", `/tool fetch url="https://example.com" mode=https`),
  mt("Troubleshooting", "Wake on LAN", "/tool wol mac=AA:BB:CC:DD:EE:FF interface=bridge-lan"),
];

/* ----- Cisco (IOS / IOS-XE) ----- */

const ciscoCommands: RawCommand[] = [
  // ===== Dasar =====
  cs("Dasar", "Masuk mode konfigurasi", "enable\nconfigure terminal"),
  cs("Dasar", "Keluar mode / kembali ke privileged", "exit\nend\ndisable", "end langsung kembali ke privileged EXEC dari mode konfigurasi mana pun."),
  cs("Dasar", "Set hostname", "hostname SW-Core"),
  cs("Dasar", "Matikan DNS lookup salah ketik", "no ip domain-lookup"),
  cs("Dasar", "Banner login", "banner motd #Akses hanya untuk pihak berwenang#"),
  cs("Dasar", "Konfigurasi line console", "line console 0\n logging synchronous\n exec-timeout 10 0\n password <password>\n login"),
  cs("Dasar", "Default gateway untuk switch layer 2", "ip default-gateway 192.168.10.1"),
  cs("Dasar", "Simpan konfigurasi", "copy running-config startup-config", "Alternatif singkat: write memory."),
  cs("Dasar", "Lihat konfigurasi aktif", "show running-config"),
  cs("Dasar", "Lihat konfigurasi tersimpan", "show startup-config"),
  cs("Dasar", "Info versi & uptime", "show version"),
  cs("Dasar", "Lihat uptime saja", "show version | include uptime"),
  cs("Dasar", "Info hardware & serial number", "show inventory"),
  cs("Dasar", "Isi flash", "show flash:\ndir flash:"),
  cs("Dasar", "Lihat filesystem yang tersedia", "show file systems"),
  cs("Dasar", "Lihat boot variable", "show boot", "Pada beberapa platform perintahnya show bootvar."),
  cs("Dasar", "Ringkasan lisensi", "show license summary", "Tersedia di IOS-XE 16.9 ke atas. Platform lama memakai show license."),
  cs("Dasar", "Lihat jam perangkat", "show clock"),
  cs("Dasar", "Set jam manual", "clock set 10:30:00 1 Nov 2026", "Dijalankan di mode privileged EXEC."),
  cs("Dasar", "Zona waktu & NTP", "clock timezone WIB 7\nntp server 192.168.10.5", "Cek dengan show ntp status."),
  cs("Dasar", "Cek sinkronisasi NTP", "show ntp status\nshow ntp associations"),
  cs("Dasar", "Tampilkan output tanpa paging", "terminal length 0"),
  cs("Dasar", "Lihat riwayat command", "show history"),
  cs("Dasar", "Lihat user yang sedang login", "show users"),
  cs("Dasar", "Filter output command", "show running-config | section ospf\nshow running-config | include hostname\nshow ip interface brief | begin Gig"),
  cs("Dasar", "Jalankan perintah show dari mode konfigurasi", "do show running-config"),
  cs("Dasar", "Backup konfigurasi ke TFTP", "copy running-config tftp:", "Perangkat akan menanyakan alamat server dan nama file."),
  cs("Dasar", "Restore konfigurasi dari TFTP", "copy tftp: running-config"),
  cs("Dasar", "Backup konfigurasi ke flash", "copy running-config flash:backup-config"),
  cs("Dasar", "Gabungkan konfigurasi tersimpan ke running", "copy startup-config running-config", "Bersifat merge, bukan replace. Perintah yang sudah ada di running-config tidak dihapus."),
  cs("Dasar", "Reset konfigurasi ke default", "erase startup-config\nreload", "Menghapus seluruh konfigurasi tersimpan. Pada switch, hapus juga vlan.dat dengan: delete flash:vlan.dat"),
  cs("Dasar", "Reboot perangkat", "reload"),
  cs("Dasar", "Aktifkan CDP / LLDP", "cdp run\nlldp run"),
  cs("Dasar", "Matikan CDP di interface", "interface g0/1\n no cdp enable"),
  cs("Dasar", "Timestamp & logging", "service timestamps log datetime msec\nlogging buffered 16384\nlogging host 192.168.10.5"),

  // ===== Interface =====
  cs("Interface", "Set IP address interface", "interface g0/0\n ip address 192.168.10.1 255.255.255.0\n no shutdown"),
  cs("Interface", "IP dari DHCP", "interface g0/1\n ip address dhcp\n no shutdown"),
  cs("Interface", "IP secondary", "interface g0/0\n ip address 192.168.20.1 255.255.255.0 secondary"),
  cs("Interface", "Deskripsi interface", "interface g0/0\n description Link ke Switch Lantai 1"),
  cs("Interface", "Matikan interface", "interface g0/1\n shutdown"),
  cs("Interface", "Aktifkan interface", "interface g0/1\n no shutdown"),
  cs("Interface", "Atur speed & duplex", "interface f0/1\n speed 100\n duplex full"),
  cs("Interface", "Konfigurasi banyak interface sekaligus", "interface range f0/1 - 24\n switchport mode access"),
  cs("Interface", "Port switch jadi routed port (L3 switch)", "interface g0/1\n no switchport\n ip address 10.0.0.1 255.255.255.252"),
  cs("Interface", "Sub-interface (router-on-a-stick)", "interface g0/0.10\n encapsulation dot1q 10\n ip address 192.168.10.1 255.255.255.0\ninterface g0/0\n no shutdown"),
  cs("Interface", "Interface loopback", "interface loopback0\n ip address 1.1.1.1 255.255.255.255"),
  cs("Interface", "Serial DCE (clock rate)", "interface s0/0/0\n ip address 10.0.0.1 255.255.255.252\n clock rate 64000\n no shutdown", "Clock rate hanya di sisi DCE."),
  cs("Interface", "Aktifkan IPv6 & alamat interface", "ipv6 unicast-routing\ninterface g0/0\n ipv6 address 2001:db8:1::1/64\n no shutdown"),
  cs("Interface", "Ringkasan status interface", "show ip interface brief"),
  cs("Interface", "Hanya interface yang punya IP", "show ip interface brief | exclude unassigned"),
  cs("Interface", "Interface yang down", "show ip interface brief | include down"),
  cs("Interface", "Detail semua interface", "show interfaces"),
  cs("Interface", "Detail satu interface", "show interfaces g0/0"),
  cs("Interface", "Konfigurasi IP lengkap interface (ACL, helper, NAT)", "show ip interface g0/0"),
  cs("Interface", "Status port switch", "show interfaces status"),
  cs("Interface", "Konfigurasi satu interface", "show running-config interface g0/1"),
  cs("Interface", "Ringkasan IPv6 interface", "show ipv6 interface brief"),
  cs("Interface", "Deskripsi semua interface", "show interfaces description"),
  cs("Interface", "Level sinyal transceiver optik (SFP)", "show interfaces transceiver detail", "Tersedia di switch Catalyst yang mendukung DOM. Perintahnya bisa berbeda antar platform."),
  cs("Interface", "Reset counter interface", "clear counters"),

  // ===== VLAN =====
  cs("VLAN", "Buat VLAN", "vlan 10\n name SISWA"),
  cs("VLAN", "Hapus VLAN", "no vlan 10"),
  cs("VLAN", "Access port", "interface f0/1\n switchport mode access\n switchport access vlan 10"),
  cs("VLAN", "Trunk port", "interface g0/1\n switchport mode trunk\n switchport trunk allowed vlan 10,20", "Pada switch layer 3 tambahkan dulu: switchport trunk encapsulation dot1q."),
  cs("VLAN", "Encapsulation dot1q (switch L3)", "interface g0/1\n switchport trunk encapsulation dot1q\n switchport mode trunk"),
  cs("VLAN", "Izinkan semua VLAN pada trunk", "interface g0/1\n switchport trunk allowed vlan all"),
  cs("VLAN", "Tambah VLAN ke trunk", "interface g0/1\n switchport trunk allowed vlan add 30", "Gunakan add, bukan menimpa daftar VLAN yang sudah ada."),
  cs("VLAN", "Hapus VLAN dari trunk", "interface g0/1\n switchport trunk allowed vlan remove 30"),
  cs("VLAN", "Native VLAN trunk", "interface g0/1\n switchport trunk native vlan 99"),
  cs("VLAN", "Matikan DTP di port", "interface g0/1\n switchport nonegotiate"),
  cs("VLAN", "Voice VLAN", "interface f0/2\n switchport mode access\n switchport access vlan 10\n switchport voice vlan 150"),
  cs("VLAN", "SVI (interface VLAN)", "interface vlan 10\n ip address 192.168.10.1 255.255.255.0\n no shutdown"),
  cs("VLAN", "Aktifkan routing di switch L3", "ip routing"),
  cs("VLAN", "VTP transparent", "vtp mode transparent\nvtp domain NETWORKLAB"),
  cs("VLAN", "Ringkasan VLAN", "show vlan brief"),
  cs("VLAN", "Database VLAN lengkap", "show vlan"),
  cs("VLAN", "Detail satu VLAN", "show vlan id 10"),
  cs("VLAN", "Status trunk", "show interfaces trunk"),
  cs("VLAN", "Status VTP", "show vtp status"),
  cs("VLAN", "Switchport satu interface (termasuk native VLAN)", "show interfaces f0/1 switchport"),
  cs("VLAN", "Tabel MAC address", "show mac address-table"),
  cs("VLAN", "Tabel MAC berdasarkan VLAN", "show mac address-table vlan 10"),
  cs("VLAN", "Tabel MAC berdasarkan interface", "show mac address-table interface f0/1"),
  cs("VLAN", "MAC address static", "mac address-table static aaaa.bbbb.cccc vlan 10 interface f0/1"),
  cs("VLAN", "Hapus MAC dinamis", "clear mac address-table dynamic"),

  // ===== STP & EtherChannel =====
  cs("STP & EtherChannel", "Mode Rapid PVST+", "spanning-tree mode rapid-pvst"),
  cs("STP & EtherChannel", "Jadikan root bridge", "spanning-tree vlan 10 root primary"),
  cs("STP & EtherChannel", "Set priority bridge", "spanning-tree vlan 10 priority 4096"),
  cs("STP & EtherChannel", "Set cost port", "interface g0/1\n spanning-tree cost 10"),
  cs("STP & EtherChannel", "PortFast pada port access", "interface f0/1\n spanning-tree portfast"),
  cs("STP & EtherChannel", "BPDU Guard", "interface f0/1\n spanning-tree bpduguard enable"),
  cs("STP & EtherChannel", "BPDU Filter", "interface f0/1\n spanning-tree bpdufilter enable", "Hati-hati. Port akan mengabaikan BPDU sehingga bisa menimbulkan loop."),
  cs("STP & EtherChannel", "PortFast & BPDU Guard default", "spanning-tree portfast default\nspanning-tree portfast bpduguard default"),
  cs("STP & EtherChannel", "Root Guard", "interface g0/2\n spanning-tree guard root"),
  cs("STP & EtherChannel", "Loop Guard", "interface g0/1\n spanning-tree guard loop"),
  cs("STP & EtherChannel", "MST", "spanning-tree mode mst\nspanning-tree mst configuration\n name REGION1\n revision 1\n instance 1 vlan 10,20"),
  cs("STP & EtherChannel", "Lihat status STP", "show spanning-tree\nshow spanning-tree vlan 10\nshow spanning-tree summary"),
  cs("STP & EtherChannel", "Lihat root bridge", "show spanning-tree root"),
  cs("STP & EtherChannel", "Lihat port STP yang blocking", "show spanning-tree blockedports"),
  cs("STP & EtherChannel", "EtherChannel LACP", "interface range g0/1 - 2\n channel-group 1 mode active\ninterface port-channel 1\n switchport mode trunk", "PAgP: ganti mode active dengan desirable. Static: mode on."),
  cs("STP & EtherChannel", "Load balance EtherChannel", "port-channel load-balance src-dst-ip"),
  cs("STP & EtherChannel", "Verifikasi EtherChannel", "show etherchannel summary\nshow interfaces port-channel 1"),
  cs("STP & EtherChannel", "Detail & metode load balance EtherChannel", "show etherchannel detail\nshow etherchannel load-balance"),

  // ===== Routing =====
  cs("Routing", "Static route", "ip route 10.0.0.0 255.255.255.0 192.168.1.2"),
  cs("Routing", "Default route", "ip route 0.0.0.0 0.0.0.0 192.168.1.1"),
  cs("Routing", "Floating static route (backup)", "ip route 0.0.0.0 0.0.0.0 192.168.2.1 5"),
  cs("Routing", "Static route IPv6", "ipv6 route ::/0 2001:db8::1"),
  cs("Routing", "RIP v2", "router rip\n version 2\n no auto-summary\n network 192.168.10.0\n passive-interface g0/1"),
  cs("Routing", "EIGRP", "router eigrp 100\n eigrp router-id 1.1.1.1\n network 192.168.10.0 0.0.0.255\n no auto-summary"),
  cs("Routing", "OSPF dasar", "router ospf 1\n network 192.168.10.0 0.0.0.255 area 0"),
  cs("Routing", "OSPF: router-id & passive interface", "router ospf 1\n router-id 1.1.1.1\n passive-interface g0/0\n auto-cost reference-bandwidth 1000"),
  cs("Routing", "OSPF: aktifkan langsung di interface", "interface g0/0\n ip ospf 1 area 0\n ip ospf cost 10\n ip ospf priority 100"),
  cs("Routing", "OSPF: sebarkan default route", "router ospf 1\n default-information originate"),
  cs("Routing", "OSPF: autentikasi MD5", "interface g0/0\n ip ospf authentication message-digest\n ip ospf message-digest-key 1 md5 <key>"),
  cs("Routing", "OSPF: summarization & stub area", "router ospf 1\n area 1 range 10.1.0.0 255.255.0.0\n area 1 stub"),
  cs("Routing", "OSPFv3 (IPv6)", "ipv6 router ospf 1\n router-id 1.1.1.1\ninterface g0/0\n ipv6 ospf 1 area 0"),
  cs("Routing", "eBGP", "router bgp 65000\n bgp router-id 1.1.1.1\n neighbor 203.0.113.1 remote-as 65001\n network 192.168.10.0 mask 255.255.255.0"),
  cs("Routing", "BGP: update-source & multihop", "router bgp 65000\n neighbor 203.0.113.1 update-source loopback0\n neighbor 203.0.113.1 ebgp-multihop 2"),
  cs("Routing", "Prefix-list & route-map", "ip prefix-list DARI-ISP seq 5 permit 10.0.0.0/8 le 24\nroute-map RM-ISP permit 10\n match ip address prefix-list DARI-ISP\n set local-preference 200"),
  cs("Routing", "Redistribute static ke OSPF", "router ospf 1\n redistribute static subnets"),
  cs("Routing", "Policy-based routing", "access-list 110 permit ip 192.168.10.0 0.0.0.255 any\nroute-map PBR permit 10\n match ip address 110\n set ip next-hop 192.168.2.1\ninterface g0/0\n ip policy route-map PBR"),
  cs("Routing", "Lihat tabel routing", "show ip route"),
  cs("Routing", "Lihat default route", "show ip route 0.0.0.0"),
  cs("Routing", "Lihat route menuju IP tertentu", "show ip route 8.8.8.8"),
  cs("Routing", "Ringkasan tabel routing", "show ip route summary"),
  cs("Routing", "Lihat route per protokol", "show ip route ospf\nshow ip route static\nshow ip route connected"),
  cs("Routing", "Ringkasan protokol routing", "show ip protocols"),
  cs("Routing", "Neighbor & database OSPF", "show ip ospf neighbor\nshow ip ospf interface brief\nshow ip ospf database"),
  cs("Routing", "Detail neighbor & interface OSPF", "show ip ospf neighbor detail\nshow ip ospf interface g0/0"),
  cs("Routing", "LSA router OSPF", "show ip ospf database router"),
  cs("Routing", "Neighbor & topology EIGRP", "show ip eigrp neighbors\nshow ip eigrp topology"),
  cs("Routing", "EIGRP: semua jalur & interface", "show ip eigrp topology all-links\nshow ip eigrp interfaces"),
  cs("Routing", "Status BGP", "show ip bgp summary\nshow ip bgp"),
  cs("Routing", "Detail neighbor BGP", "show ip bgp neighbors"),
  cs("Routing", "Route yang diiklankan / diterima BGP", "show ip bgp neighbors 203.0.113.1 advertised-routes\nshow ip bgp neighbors 203.0.113.1 routes", "Untuk melihat route sebelum filter inbound, aktifkan neighbor soft-reconfiguration inbound lalu gunakan received-routes."),
  cs("Routing", "Lihat policy routing", "show ip policy"),
  cs("Routing", "Reset proses routing", "clear ip ospf process\nclear ip bgp *"),

  // ===== DHCP =====
  cs("DHCP", "DHCP pool", "ip dhcp pool LAN\n network 192.168.10.0 255.255.255.0\n default-router 192.168.10.1\n dns-server 8.8.8.8"),
  cs("DHCP", "Alamat yang dikecualikan dari pool", "ip dhcp excluded-address 192.168.10.1 192.168.10.10", "Wajib dikonfigurasi di mode global sebelum pool dipakai."),
  cs("DHCP", "Opsi tambahan pool (domain, lease)", "ip dhcp pool LAN\n domain-name networklab.local\n lease 7"),
  cs("DHCP", "DHCP relay (helper address)", "interface g0/0\n ip helper-address 10.0.0.5"),
  cs("DHCP", "IP tetap per client (static binding)", "ip dhcp pool PC1\n host 192.168.10.50 255.255.255.0\n hardware-address aaaa.bbbb.cccc"),
  cs("DHCP", "Lihat lease aktif", "show ip dhcp binding"),
  cs("DHCP", "Statistik pool", "show ip dhcp pool"),
  cs("DHCP", "Statistik DHCP server", "show ip dhcp server statistics"),
  cs("DHCP", "Konflik IP DHCP", "show ip dhcp conflict"),
  cs("DHCP", "Hapus lease", "clear ip dhcp binding *"),
  cs("DHCP", "Hapus catatan konflik", "clear ip dhcp conflict *"),

  // ===== NAT =====
  cs("NAT", "Tandai interface inside & outside", "interface g0/0\n ip nat inside\ninterface g0/1\n ip nat outside"),
  cs("NAT", "NAT static", "ip nat inside source static 192.168.10.10 203.0.113.10"),
  cs("NAT", "NAT dinamis dengan pool", "ip nat pool PUBLIK 203.0.113.10 203.0.113.20 netmask 255.255.255.0\naccess-list 1 permit 192.168.10.0 0.0.0.255\nip nat inside source list 1 pool PUBLIK"),
  cs("NAT", "PAT (overload) ke interface WAN", "access-list 1 permit 192.168.10.0 0.0.0.255\nip nat inside source list 1 interface g0/1 overload"),
  cs("NAT", "Port forwarding", "ip nat inside source static tcp 192.168.10.10 80 interface g0/1 8080"),
  cs("NAT", "Lihat translasi NAT", "show ip nat translations\nshow ip nat statistics"),
  cs("NAT", "Translasi NAT detail (verbose)", "show ip nat translations verbose"),
  cs("NAT", "Cari translasi NAT untuk satu IP", "show ip nat translations | include 192.168.10.10"),
  cs("NAT", "Hapus translasi NAT", "clear ip nat translation *"),

  // ===== ACL =====
  cs("ACL", "Standard ACL", "access-list 10 permit 192.168.10.0 0.0.0.255\ninterface g0/0\n ip access-group 10 in"),
  cs("ACL", "Standard ACL bernama", "ip access-list standard HANYA-LAN\n permit 192.168.10.0 0.0.0.255\n deny any log"),
  cs("ACL", "Extended ACL bernama", "ip access-list extended BLOK-SISWA\n deny ip 192.168.20.0 0.0.0.255 192.168.30.0 0.0.0.255\n permit ip any any"),
  cs("ACL", "Extended ACL numerik (izinkan web)", "access-list 100 permit tcp 192.168.10.0 0.0.0.255 any eq 80\naccess-list 100 permit tcp 192.168.10.0 0.0.0.255 any eq 443"),
  cs("ACL", "Izinkan balasan ICMP", "ip access-list extended DARI-LUAR\n permit icmp any any echo-reply\n permit tcp any any established"),
  cs("ACL", "Pasang ACL di interface", "interface g0/0\n ip access-group BLOK-SISWA in", "Extended ACL sebaiknya dekat sumber, standard ACL dekat tujuan."),
  cs("ACL", "Batasi akses VTY dengan ACL", "access-list 10 permit 192.168.10.0 0.0.0.255\nline vty 0 4\n access-class 10 in"),
  cs("ACL", "Sisipkan entri di ACL (sequence)", "ip access-list extended BLOK-SISWA\n 5 deny tcp any any eq 23"),
  cs("ACL", "Komentar pada ACL", "access-list 100 remark Izinkan web LAN"),
  cs("ACL", "ACL IPv6", "ipv6 access-list BLOK-V6\n deny ipv6 2001:db8:bad::/48 any\n permit ipv6 any any\ninterface g0/0\n ipv6 traffic-filter BLOK-V6 in"),
  cs("ACL", "Lihat ACL & hit counter", "show access-lists"),
  cs("ACL", "Lihat satu ACL berdasarkan nomor", "show access-lists 100"),
  cs("ACL", "Lihat ACL khusus IP", "show ip access-lists"),
  cs("ACL", "Hapus ACL", "no access-list 100", "Lepas dulu dari interface (no ip access-group) agar tidak ada perilaku tak terduga."),
  cs("ACL", "Reset counter ACL", "clear access-list counters"),

  // ===== WAN & VPN =====
  cs("WAN & VPN", "GRE tunnel", "interface tunnel 0\n ip address 10.255.0.1 255.255.255.252\n tunnel source g0/1\n tunnel destination 203.0.113.2"),
  cs("WAN & VPN", "IPsec site-to-site (crypto map)", "crypto isakmp policy 10\n encryption aes 256\n hash sha256\n authentication pre-share\n group 14\n lifetime 86400\ncrypto isakmp key <key> address 203.0.113.2\ncrypto ipsec transform-set TS esp-aes 256 esp-sha256-hmac\n mode tunnel\naccess-list 110 permit ip 192.168.10.0 0.0.0.255 192.168.20.0 0.0.0.255\ncrypto map CMAP 10 ipsec-isakmp\n set peer 203.0.113.2\n set transform-set TS\n match address 110\ninterface g0/1\n crypto map CMAP"),
  cs("WAN & VPN", "Verifikasi IPsec", "show crypto isakmp sa\nshow crypto ipsec sa"),
  cs("WAN & VPN", "PPP dengan CHAP", "username R2 password <password>\ninterface s0/0/0\n encapsulation ppp\n ppp authentication chap", "Username harus sama dengan hostname router lawan."),
  cs("WAN & VPN", "Kembali ke HDLC", "interface s0/0/0\n encapsulation hdlc"),

  // ===== Wireless (controller & roaming) =====
  cs("Wireless", "Autonomous AP: buat SSID WPA2-PSK", "dot11 ssid NetworkLab\n vlan 10\n authentication open\n authentication key-management wpa version 2\n wpa-psk ascii <password>\ninterface Dot11Radio0\n ssid NetworkLab\n no shutdown", "Untuk AP autonomous (IOS). AP lightweight dikelola lewat controller."),
  cs("Wireless", "Controller: daftar AP yang join", "show ap summary", "Berlaku di WLC AireOS maupun Catalyst 9800."),
  cs("Wireless", "Controller: daftar WLAN/SSID", "show wlan summary"),
  cs("Wireless", "Controller: daftar client (AireOS)", "show client summary"),
  cs("Wireless", "Controller: daftar client (Catalyst 9800)", "show wireless client summary"),
  cs("Wireless", "Detail satu client wireless (9800)", "show wireless client mac-address aaaa.bbbb.cccc detail", "Menampilkan AP tempat client terhubung, sinyal, dan riwayat roaming."),
  cs("Wireless", "Ringkasan mobility / roaming antar controller (9800)", "show wireless mobility summary"),
  cs("Wireless", "Detail konfigurasi satu AP (9800)", "show ap name AP-LANTAI1 config general"),
  cs("Wireless", "Daftar AP per band (9800)", "show ap dot11 5ghz summary\nshow ap dot11 24ghz summary"),

  // ===== Network Security =====
  cs("Network Security", "Enable secret", "enable secret <password>", "Ganti <password> dengan password yang kuat."),
  cs("Network Security", "Enkripsi password di konfigurasi", "service password-encryption"),
  cs("Network Security", "Buat user lokal", "username admin privilege 15 secret <password>"),
  cs("Network Security", "Aktifkan SSH", "hostname SW-Core\nip domain-name networklab.local\ncrypto key generate rsa modulus 2048\nip ssh version 2\nusername admin privilege 15 secret <password>\nline vty 0 4\n transport input ssh\n login local", "Hostname dan domain-name wajib diset sebelum membuat key RSA."),
  cs("Network Security", "Hardening SSH", "ip ssh time-out 60\nip ssh authentication-retries 3"),
  cs("Network Security", "Akses SSH dari perangkat lain", "ssh -l admin 192.168.10.1"),
  cs("Network Security", "Cek SSH", "show ip ssh\nshow ssh"),
  cs("Network Security", "Blokir login setelah gagal berulang", "login block-for 120 attempts 3 within 60"),
  cs("Network Security", "Lihat kegagalan login", "show login failures"),
  cs("Network Security", "Panjang minimal password", "security passwords min-length 10"),
  cs("Network Security", "Timeout sesi VTY", "line vty 0 4\n exec-timeout 5 0"),
  cs("Network Security", "AAA lokal", "aaa new-model\naaa authentication login default local\naaa authorization exec default local"),
  cs("Network Security", "RADIUS: daftarkan server", "radius server RAD1\n address ipv4 192.168.10.5 auth-port 1812 acct-port 1813\n key <key>"),
  cs("Network Security", "RADIUS: autentikasi login perangkat", "aaa new-model\naaa authentication login default group radius local\naaa authorization exec default group radius local\naaa accounting exec default start-stop group radius", "Keyword local sebagai cadangan jika RADIUS tidak terjangkau."),
  cs("Network Security", "RADIUS: uji koneksi ke server", "test aaa group radius <username> <password> new-code", "Hasil Success berarti server dan shared key sudah benar."),
  cs("Network Security", "TACACS+: daftarkan server", "tacacs server TAC1\n address ipv4 192.168.10.6\n key <key>\naaa authentication login default group tacacs+ local"),
  cs("Network Security", "Status server AAA", "show aaa servers"),
  cs("Network Security", "802.1X: aktifkan global", "aaa new-model\naaa authentication dot1x default group radius\ndot1x system-auth-control", "RADIUS server harus sudah didaftarkan."),
  cs("Network Security", "802.1X: aktifkan di port access", "interface f0/1\n switchport mode access\n authentication port-control auto\n dot1x pae authenticator", "Pada IOS lama gunakan: dot1x port-control auto."),
  cs("Network Security", "802.1X dengan fallback MAB", "interface f0/1\n authentication order dot1x mab\n authentication priority dot1x mab\n mab", "MAB dipakai untuk perangkat tanpa supplicant, misalnya printer."),
  cs("Network Security", "802.1X: lihat sesi autentikasi", "show authentication sessions\nshow authentication sessions interface f0/1\nshow dot1x all"),
  cs("Network Security", "Matikan layanan HTTP", "no ip http server\nno ip http secure-server"),
  cs("Network Security", "Matikan layanan tidak perlu", "no service pad\nno ip source-route"),
  cs("Network Security", "Matikan port tidak terpakai", "interface range f0/10 - 24\n shutdown"),
  cs("Network Security", "Port security", "interface f0/1\n switchport mode access\n switchport port-security\n switchport port-security maximum 2\n switchport port-security mac-address sticky\n switchport port-security violation shutdown"),
  cs("Network Security", "Auto-recovery port err-disabled", "errdisable recovery cause psecure-violation\nerrdisable recovery interval 300"),
  cs("Network Security", "DHCP snooping", "ip dhcp snooping\nip dhcp snooping vlan 10\ninterface g0/1\n ip dhcp snooping trust"),
  cs("Network Security", "DHCP snooping: batasi laju DHCP di port client", "interface f0/1\n ip dhcp snooping limit rate 15"),
  cs("Network Security", "Dynamic ARP Inspection", "ip arp inspection vlan 10\ninterface g0/1\n ip arp inspection trust", "Membutuhkan DHCP snooping aktif agar binding table terisi."),
  cs("Network Security", "IP Source Guard", "interface f0/1\n ip verify source"),
  cs("Network Security", "Storm control", "interface f0/1\n storm-control broadcast level 20"),
  cs("Network Security", "Cek port security", "show port-security\nshow port-security interface f0/1\nshow port-security address"),
  cs("Network Security", "Port yang err-disabled", "show interfaces status err-disabled"),
  cs("Network Security", "Cek DHCP snooping", "show ip dhcp snooping\nshow ip dhcp snooping binding\nshow ip dhcp snooping database"),
  cs("Network Security", "Cek DAI & IP Source Guard", "show ip arp inspection\nshow ip verify source"),

  // ===== QoS (traffic shaping, policing, prioritization) =====
  cs("QoS", "Klasifikasi trafik dengan ACL", "ip access-list extended WEB-ACL\n permit tcp any any eq 443\nclass-map match-all WEB\n match access-group name WEB-ACL"),
  cs("QoS", "Class-map & policy-map prioritas (LLQ)", "class-map match-any VOICE\n match dscp ef\npolicy-map WAN-OUT\n class VOICE\n  priority percent 30\n class class-default\n  fair-queue"),
  cs("QoS", "Marking DSCP", "policy-map MARKING\n class WEB\n  set dscp af21\n class class-default\n  set dscp default"),
  cs("QoS", "Alokasi bandwidth per kelas (CBWFQ)", "policy-map CBWFQ\n class WEB\n  bandwidth percent 20\n class class-default\n  fair-queue"),
  cs("QoS", "WRED (hindari congestion)", "policy-map WRED\n class class-default\n  random-detect dscp-based"),
  cs("QoS", "Traffic shaping", "policy-map SHAPE\n class class-default\n  shape average 10000000", "Nilai dalam bit per detik (10 Mbps)."),
  cs("QoS", "Shaping bertingkat (parent-child)", "policy-map SHAPE-PARENT\n class class-default\n  shape average 10000000\n  service-policy WAN-OUT\ninterface g0/1\n service-policy output SHAPE-PARENT", "Child policy WAN-OUT memberi prioritas voice di dalam batas 10 Mbps."),
  cs("QoS", "Policing (batasi rate)", "policy-map LIMIT\n class class-default\n  police 5000000 conform-action transmit exceed-action drop"),
  cs("QoS", "Pasang policy di interface", "interface g0/1\n service-policy output WAN-OUT\n service-policy input MARKING"),
  cs("QoS", "Trust marking dari perangkat (switch)", "interface g0/1\n mls qos trust dscp", "Perintah mls qos hanya ada di Catalyst lama. Platform baru memakai MQC (policy-map)."),
  cs("QoS", "AutoQoS untuk VoIP", "interface g0/1\n auto qos voip trust"),
  cs("QoS", "Lihat policy di interface", "show policy-map interface g0/1"),
  cs("QoS", "Lihat policy & class map", "show policy-map\nshow class-map"),
  cs("QoS", "Lihat antrian interface", "show queueing interface g0/1", "Ketersediaan tergantung platform."),
  cs("QoS", "Status QoS switch", "show mls qos\nshow mls qos interface g0/1"),

  // ===== High Availability =====
  cs("High Availability", "HSRP", "interface g0/0\n standby version 2\n standby 1 ip 192.168.10.254\n standby 1 priority 110\n standby 1 preempt"),
  cs("High Availability", "HSRP: timer & autentikasi", "interface g0/0\n standby 1 timers 1 3\n standby 1 authentication md5 key-string <key>"),
  cs("High Availability", "HSRP: tracking interface", "track 1 interface g0/1 line-protocol\ninterface g0/0\n standby 1 track 1 decrement 20", "Priority turun 20 saat uplink mati sehingga router lain menjadi active."),
  cs("High Availability", "VRRP", "interface g0/0\n vrrp 1 ip 192.168.10.254\n vrrp 1 priority 110"),
  cs("High Availability", "VRRPv3", "fhrp version vrrp v3\ninterface g0/0\n vrrp 1 address-family ipv4\n  address 192.168.10.254 primary\n  priority 110", "Tersedia di IOS-XE dan IOS 15.x yang mendukung VRRPv3."),
  cs("High Availability", "GLBP", "interface g0/0\n glbp 1 ip 192.168.10.254\n glbp 1 priority 110\n glbp 1 preempt"),
  cs("High Availability", "IP SLA + tracking failover", "ip sla 1\n icmp-echo 8.8.8.8\n frequency 10\nip sla schedule 1 life forever start-time now\ntrack 1 ip sla 1 reachability\nip route 0.0.0.0 0.0.0.0 192.168.1.1 track 1\nip route 0.0.0.0 0.0.0.0 192.168.2.1 5"),
  cs("High Availability", "Redundansi supervisor (SSO)", "redundancy\n mode sso", "Hanya untuk platform dengan dual supervisor."),
  cs("High Availability", "Status HSRP", "show standby brief\nshow standby"),
  cs("High Availability", "Status VRRP", "show vrrp brief"),
  cs("High Availability", "Status GLBP", "show glbp brief"),
  cs("High Availability", "Status tracking", "show track"),
  cs("High Availability", "Status & konfigurasi IP SLA", "show ip sla statistics\nshow ip sla configuration"),
  cs("High Availability", "Status redundancy supervisor", "show redundancy"),
  cs("High Availability", "Status stack switch", "show switch", "Hanya untuk switch yang distack (StackWise)."),

  // ===== Monitoring (SNMP, Syslog, NetFlow, Traffic) =====
  cs("Monitoring", "SNMPv2c dengan batasan ACL", "access-list 10 permit 192.168.10.5\nsnmp-server community <string> RO 10\nsnmp-server location Lab\nsnmp-server contact admin@contoh.com"),
  cs("Monitoring", "SNMPv3 (auth + enkripsi)", "snmp-server group NL-GRP v3 priv\nsnmp-server user nl-user NL-GRP v3 auth sha <auth-pass> priv aes 128 <priv-pass>"),
  cs("Monitoring", "SNMP trap ke server", "snmp-server enable traps snmp linkdown linkup\nsnmp-server host 192.168.10.5 version 2c <string>"),
  cs("Monitoring", "Lihat konfigurasi SNMP", "show snmp\nshow snmp community\nshow snmp host"),
  cs("Monitoring", "Syslog ke server", "logging host 192.168.10.5\nlogging trap informational\nlogging source-interface loopback0"),
  cs("Monitoring", "Pengaturan buffer & console log", "logging buffered 16384 informational\nlogging console warnings\nservice timestamps log datetime msec"),
  cs("Monitoring", "Lihat log", "show logging"),
  cs("Monitoring", "Cari log perubahan status link", "show logging | include UPDOWN"),
  cs("Monitoring", "NetFlow (Flexible NetFlow)", "flow exporter EXP\n destination 192.168.10.5\n transport udp 2055\nflow monitor MON\n exporter EXP\n record netflow ipv4 original-input\ninterface g0/0\n ip flow monitor MON input"),
  cs("Monitoring", "NetFlow tradisional", "ip flow-export destination 192.168.10.5 2055\nip flow-export version 9\ninterface g0/0\n ip flow ingress", "Tidak tersedia di semua platform IOS-XE terbaru. Gunakan Flexible NetFlow."),
  cs("Monitoring", "Lihat cache & exporter NetFlow", "show flow monitor MON cache\nshow flow exporter EXP statistics\nshow ip cache flow"),
  cs("Monitoring", "Interval rata-rata trafik 30 detik", "interface g0/0\n load-interval 30"),
  cs("Monitoring", "Lihat rate trafik interface", "show interfaces | include rate\nshow interfaces g0/0 | include rate"),
  cs("Monitoring", "Statistik trafik IP", "show ip traffic"),
  cs("Monitoring", "Deteksi protokol aplikasi (NBAR)", "interface g0/0\n ip nbar protocol-discovery", "Lihat hasilnya dengan: show ip nbar protocol-discovery. Tersedia di router IOS/IOS-XE."),
  cs("Monitoring", "Beban CPU", "show processes cpu sorted"),
  cs("Monitoring", "Riwayat CPU", "show processes cpu history"),
  cs("Monitoring", "Penggunaan memori", "show memory statistics\nshow memory summary"),
  cs("Monitoring", "Suhu, kipas, power", "show environment all", "Pada beberapa platform terpisah: show environment power dan show environment fan."),
  cs("Monitoring", "Status PoE", "show power inline"),

  // ===== Automation (API, scripting, scheduled tasks) =====
  cs("Automation", "EEM: aksi saat interface down", `event manager applet INT-DOWN
 event syslog pattern "Interface GigabitEthernet0/1, changed state to down"
 action 1.0 syslog msg "Gi0/1 down terdeteksi"`),
  cs("Automation", "EEM: jalankan tugas terjadwal (cron)", `event manager applet BACKUP-HARIAN
 event timer cron cron-entry "0 2 * * *"
 action 1.0 cli command "enable"
 action 2.0 cli command "write memory"`),
  cs("Automation", "Kron: jadwalkan perintah", "kron policy-list SIMPAN\n cli write memory\nkron occurrence HARIAN at 02:00 recurring\n policy-list SIMPAN"),
  cs("Automation", "Archive: backup konfigurasi otomatis", "archive\n path flash:archive-\n write-memory\n time-period 1440", "Menyimpan salinan konfigurasi setiap kali write memory dan setiap 24 jam."),
  cs("Automation", "Lihat perbedaan konfigurasi (archive)", "show archive config differences", "Butuh fitur archive yang sudah aktif."),
  cs("Automation", "Rollback ke konfigurasi tersimpan", "configure replace flash:backup-config force", "Mengganti seluruh running-config. Pastikan file backup lengkap."),
  cs("Automation", "Alias command", "alias exec sib show ip interface brief"),
  cs("Automation", "Aktifkan NETCONF (IOS-XE)", "netconf-yang"),
  cs("Automation", "Aktifkan RESTCONF (IOS-XE)", "ip http secure-server\nrestconf", "Pemanggilan API lewat https://<ip>/restconf/data/... dengan user privilege 15."),
  cs("Automation", "Guest Shell untuk Python (IOS-XE)", "iox\nguestshell enable", "Tersedia di Catalyst 9000 dan router IOS-XE tertentu. Setelah aktif jalankan: guestshell run python3."),
  cs("Automation", "Lihat status EEM & kron", "show event manager policy registered\nshow kron schedule"),

  // ===== Troubleshooting (packet capture, MTU, duplex, routing) =====
  cs("Troubleshooting", "Ping & traceroute", "ping 192.168.10.1\ntraceroute 8.8.8.8"),
  cs("Troubleshooting", "Ping dari interface tertentu", "ping 8.8.8.8 source g0/0"),
  cs("Troubleshooting", "Traceroute IPv6", "traceroute ipv6 2001:db8::1"),
  cs("Troubleshooting", "Tabel ARP", "show ip arp"),
  cs("Troubleshooting", "Neighbor CDP / LLDP", "show cdp neighbors\nshow cdp neighbors detail\nshow lldp neighbors\nshow lldp neighbors detail"),
  cs("Troubleshooting", "SPAN: mirror port untuk capture", "monitor session 1 source interface f0/1 both\nmonitor session 1 destination interface f0/24", "Hubungkan laptop dengan Wireshark ke f0/24."),
  cs("Troubleshooting", "Lihat sesi SPAN", "show monitor session 1"),
  cs("Troubleshooting", "Embedded Packet Capture (IOS-XE)", "monitor capture CAP1 interface g0/0 both\nmonitor capture CAP1 match ipv4 any any\nmonitor capture CAP1 buffer size 10\nmonitor capture CAP1 start\nmonitor capture CAP1 stop", "Dijalankan dari privileged EXEC. Tersedia di IOS-XE."),
  cs("Troubleshooting", "Lihat & ekspor hasil capture", "show monitor capture CAP1 buffer brief\nmonitor capture CAP1 export flash:cap1.pcap"),
  cs("Troubleshooting", "Uji MTU dengan DF-bit", "ping 8.8.8.8 size 1500 df-bit", "Jika gagal, turunkan size sampai berhasil untuk menemukan path MTU."),
  cs("Troubleshooting", "Lihat MTU interface", "show interfaces g0/0 | include MTU"),
  cs("Troubleshooting", "Ubah MTU IP interface", "interface g0/0\n ip mtu 1400"),
  cs("Troubleshooting", "Adjust TCP MSS (tunnel/PPPoE)", "interface g0/0\n ip tcp adjust-mss 1360"),
  cs("Troubleshooting", "MTU sistem switch (jumbo frame)", "system mtu jumbo 9000\nshow system mtu", "Butuh reload. Perintah berbeda antar platform."),
  cs("Troubleshooting", "Cek speed, duplex, dan CRC", "show interfaces f0/1 | include duplex|CRC", "Duplex half atau CRC naik terus menandakan kabel buruk atau mismatch."),
  cs("Troubleshooting", "Counter error interface", "show interfaces counters errors"),
  cs("Troubleshooting", "Deteksi duplex mismatch dari log", "show logging | include DUPLEX_MISMATCH", "CDP melaporkan mismatch dengan pesan %CDP-4-DUPLEX_MISMATCH."),
  cs("Troubleshooting", "Kembalikan speed & duplex ke auto", "interface f0/1\n speed auto\n duplex auto"),
  cs("Troubleshooting", "Cek route via CEF", "show ip cef 8.8.8.8"),
  cs("Troubleshooting", "Cari route dengan prefix lebih spesifik", "show ip route 10.0.0.0 255.0.0.0 longer-prefixes"),
  cs("Troubleshooting", "Debug routing table", "debug ip routing", "Matikan segera setelah selesai dengan: undebug all"),
  cs("Troubleshooting", "Debug OSPF adjacency", "debug ip ospf adj", "Debug membebani CPU. Matikan segera dengan: undebug all"),
  cs("Troubleshooting", "Debug paket IP", "debug ip packet", "Gunakan hanya di lab atau dengan ACL pembatas. Matikan dengan: undebug all"),
  cs("Troubleshooting", "Debug paket dengan ACL pembatas", "access-list 150 permit icmp host 192.168.10.20 any\ndebug ip packet 150"),
  cs("Troubleshooting", "Tampilkan debug di sesi remote", "terminal monitor"),
  cs("Troubleshooting", "Matikan semua debug", "undebug all"),
  cs("Troubleshooting", "Kumpulkan info untuk TAC", "show tech-support"),
];

export const commands: Command[] = [
  ...withIds(mikrotikCommands, "mt"),
  ...withIds(ciscoCommands, "cs"),
];

/* ---------- Portfolio ---------- */

export type Project = {
  id: string;
  title: string;
  vendor: Vendor;
  status: "Selesai" | "Dalam Proses";
  date: string;
  summary: string;
  setup: string;
  tags: string[];
  docs: { topology: boolean; config: boolean; test: boolean };
};

export const projects: Project[] = [
  { id: "p-1", vendor: "Cisco", status: "Selesai", date: "Okt 2026", title: "Jaringan Kantor Cabang dengan VLAN", summary: "Segmentasi tiga divisi dengan VLAN, DHCP terpusat, dan inter-VLAN routing.", setup: "1 Router · 2 Switch · 12 PC", tags: ["VLAN", "Trunking", "DHCP"], docs: { topology: true, config: true, test: true } },
  { id: "p-2", vendor: "MikroTik", status: "Selesai", date: "Sep 2026", title: "Dual ISP Load Balancing & Failover", summary: "Dua jalur internet dengan failover otomatis dan pembagian trafik per koneksi.", setup: "1 Router · 2 ISP · 1 Switch", tags: ["Failover", "Mangle", "Routing"], docs: { topology: true, config: true, test: true } },
  { id: "p-3", vendor: "MikroTik", status: "Selesai", date: "Agu 2026", title: "Hotspot Warnet dengan Limit Bandwidth", summary: "Captive portal, voucher berbatas waktu, dan limit kecepatan per user.", setup: "1 Router · 1 AP · 20 Client", tags: ["Hotspot", "Queue", "User Profile"], docs: { topology: true, config: true, test: true } },
  { id: "p-4", vendor: "Cisco", status: "Dalam Proses", date: "Okt 2026", title: "OSPF Multi-Area untuk Kampus", summary: "Desain area backbone dan area distribusi dengan summarization.", setup: "6 Router · 3 Switch", tags: ["OSPF", "Multi-Area"], docs: { topology: true, config: true, test: false } },
  { id: "p-5", vendor: "MikroTik", status: "Dalam Proses", date: "Nov 2026", title: "Site-to-Site VPN WireGuard", summary: "Menghubungkan kantor pusat dan cabang lewat tunnel terenkripsi.", setup: "2 Router · 2 LAN", tags: ["WireGuard", "VPN"], docs: { topology: true, config: true, test: false } },
  { id: "p-6", vendor: "Cisco", status: "Dalam Proses", date: "Nov 2026", title: "Segmentasi Jaringan Sekolah dengan ACL", summary: "Kebijakan akses antara jaringan guru, siswa, dan server.", setup: "1 Router · 3 Switch · 15 PC", tags: ["ACL", "Security", "VLAN"], docs: { topology: true, config: false, test: false } },
];

/* ---------- Dashboard ---------- */

export const weeklyActivity = [
  { day: "Sen", minutes: 45 },
  { day: "Sel", minutes: 80 },
  { day: "Rab", minutes: 30 },
  { day: "Kam", minutes: 95 },
  { day: "Jum", minutes: 60 },
  { day: "Sab", minutes: 120 },
  { day: "Min", minutes: 70 },
];

export type Activity = {
  id: string;
  type: "course" | "quiz" | "lab" | "portfolio";
  text: string;
  time: string;
};

export const recentActivity: Activity[] = [
  { id: "a-1", type: "course", text: "Melanjutkan Firewall & NAT (MikroTik)", time: "2 jam lalu" },
  { id: "a-2", type: "lab", text: "Mengerjakan lab VLAN & Inter-VLAN Routing", time: "Kemarin" },
  { id: "a-3", type: "quiz", text: "Menyelesaikan Quiz Subnetting Cepat · skor 85", time: "2 hari lalu" },
  { id: "a-4", type: "portfolio", text: "Menambah project Site-to-Site VPN WireGuard", time: "3 hari lalu" },
  { id: "a-5", type: "course", text: "Menyelesaikan IP Address, DHCP & DNS: bab 8", time: "4 hari lalu" },
];
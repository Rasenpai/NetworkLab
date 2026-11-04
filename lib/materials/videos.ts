import { ytSearch, ytVideo } from "./media";
import type { Block } from "./types";

/**
 * Video pendukung per bab, dikunci dengan JUDUL BAB (persis seperti di file materi).
 * Video disisipkan otomatis sebelum blok "Cek pemahaman" di bab tersebut,
 * jadi file materi (cs-1, g-1, n-2) tidak perlu diubah.
 *
 * ytVideo(id, judul, channel?, start?): `id` = bagian setelah `v=` pada link YouTube,
 * `start` = detik mulai putar.
 * Kalau ada video yang mati atau kurang cocok, cukup ganti ID-nya di sini.
 * (ytSearch(kata kunci, judul) di media.ts masih tersedia untuk kartu pencarian.)
 */
export const videosByChapterTitle: Record<string, Block[]> = {
  // ---- Jaringan komputer (cs-1) ----
  "Model OSI: 7 Lapisan": [
    ytVideo("AYgXr1dynKU", "Understanding the OSI Model (Network+ N10-009)", "Professor Messer"),
    ytVideo("w-zpGeIPPgE", "OSI Model Explained: A Complete Guide to the 7 Layers"),
  ],
  "Enkapsulasi & Alur Data": [
    ytVideo("Kcz62MOzFGc", "Enkapsulasi dan Dekapsulasi Layer OSI"),
    ytVideo("n7mtJ3ZV6xM", "Proses Enkapsulasi dan Dekapsulasi (Warrior of the Net)"),
  ],
  "Media Transmisi: Kabel Tembaga (UTP)": [
    ytVideo("l47kaQBQar8", "Cara Crimping Kabel LAN UTP RJ45 Straight & Cross (Cat5e & Cat6)"),
    ytVideo("_G717flG_fQ", "Cara membuat kabel LAN Straight T568B"),
  ],
  "Media Transmisi: Fiber Optik & Nirkabel": [
    ytVideo("sFYDo_qxRBE", "Optical Fiber: multimode vs single-mode (Network+ N10-008)", "Professor Messer"),
    ytVideo("t24NyGSdJzc", "Difference Between Single Mode and Multimode Fiber Optic Cable"),
  ],
  "Perangkat Jaringan: Switch, Router & Lainnya": [
    ytVideo("GRxyFffEHp8", "Perbedaan Switch dan Hub: cara kerja CAM / MAC address table"),
    ytVideo("9DSSyffnMn0", "How does a Switch learn MAC addresses? (CCNA 200-301)"),
  ],

  // ---- Linux CLI (g-1) ----
  "Izin Akses, User & Group": [
    ytVideo("_MYMY_4qwOg", "Linux File Permissions (chmod, SUID, SGID, sticky bit)", "zSecurity"),
  ],
  "Tes Jaringan dari CLI": [
    ytVideo("J5191lLPd3I", "The ping command: ping dan traceroute untuk troubleshooting"),
    ytVideo("NmWAJvIbY04", "Linux Networking commands: ip, ping, traceroute"),
  ],
  "SSH: Remote Login yang Aman": [
    ytVideo("KFlivuVj7-8", "SSH key authentication: ssh-keygen dan ssh-copy-id (Ubuntu & Cisco)"),
    ytVideo("oAbYL3bktMA", "SSH Keys: membuat key pair dengan ssh-keygen (RSA dan ed25519)"),
  ],

  // ---- TCP/IP dari dalam (g-2) ----
  "Pengantar dan tujuan belajar": [
    ytVideo("Auwn3RWapRE", "How TCP really works: Top 3 things you need to know! (Chris Greer)"),
  ],
  "Alur paket dari aplikasi ke kabel": [
    ytVideo("Kcz62MOzFGc", "Enkapsulasi dan Dekapsulasi Layer OSI"),
    ytVideo("n7mtJ3ZV6xM", "Proses Enkapsulasi dan Dekapsulasi (Warrior of the Net)"),
  ],
  "Three-way handshake": [
    ytVideo("LyDqA-dAPW4", "What Is a Three-Way Handshake in TCP?", "Cisco"),
    ytVideo("DwcuU-plF44", "TCP Three Way Handshake"),
  ],
  "Window: kecepatan dan pengiriman andal": [
    ytVideo(
      "rmFX1V49K8U",
      "How TCP really works // Three-way handshake // TCP/IP Deep Dive (mulai dari bagian TCP Window)",
      undefined,
      2513,
    ),
    ytVideo("IImJtO8Jn7k", "How TCP Survives the Worst Network on Earth", "Neural Download"),
  ],
  "Port dan socket": [
    ytVideo(
      "rmFX1V49K8U",
      "How TCP really works // Three-way handshake // TCP/IP Deep Dive (mulai dari bagian Port numbers)",
      undefined,
      530,
    ),
    ytVideo("Ygmp5wBjeEo", "ss: inspect sockets and connections on Linux (complete guide)"),
  ],
  "Cara membaca header IP dan TCP": [
    ytVideo(
      "rmFX1V49K8U",
      "How TCP really works // Three-way handshake // TCP/IP Deep Dive (mulai dari bagian TCP flags)",
      undefined,
      2216,
    ),
    ytSearch("wireshark tcp header fields explained", "Membaca field header TCP di Wireshark"),
  ],
  "Praktik: Alur paket dari aplikasi ke kabel": [
    ytVideo("1lDfCRM6dWk", "tcpdump - Traffic Capture & Analysis", "HackerSploit"),
    ytVideo("5pDepRoEXNs", "Capture Network Traffic with TCPDump"),
  ],
  "Praktik: Three-way handshake": [
    ytVideo("fSFeIdMZ_3I", "TCP 3-Way Handshake Explained (analisis dengan Wireshark)"),
    ytVideo("xyFLY1saDh0", "Learn Tcpdump - Tutorial with Examples"),
  ],
  "Praktik: Window": [
    ytVideo("V0EhVCCxTuc", "Local Area Network Bandwidth Speed Test with iperf3 Tutorial"),
    ytSearch("tc netem delay latency simulation linux", "tc netem: simulasi latensi di Linux"),
  ],
  "Rangkuman dan latihan": [
    ytVideo(
      "Auwn3RWapRE",
      "How TCP really works: Top 3 things you need to know! (mulai dari bagian rangkuman 3 hal penting)",
      undefined,
      1602,
    ),
  ],

  // ---- Pengalamatan IP / Cisco (cs-2) ----
  "Pengantar pengalamatan IP untuk CCNA": [
    ytVideo("2Fnn36Nu_8s", "Introduction to Cisco Packet Tracer"),
    ytVideo("OYOpsT7lRwc", "Cisco Packet Tracer CCNA 200-301 Lab Walkthroughs - Lab 01 - Basic Device Configuration"),
  ],
  "IPv4": [
    ytVideo("Dcc7ZY1jqQI", "30-Day CCNA Challenge Day 7: IPv4 Addressing and Subnetting"),
    ytVideo("VfNGHAkub3g", "Demystifying IPv4 Subnetting: Part 2 - The IP Address & Subnet Mask"),
  ],
  "CIDR": [
    ytVideo("Oe8Vd12m4H4", "subnetting doesn't have to be hard..."),
    ytVideo("7hIbzlxbebc", "IP Subnetting tutorial"),
  ],
  "VLSM": [
    ytVideo("przn0GNpGOc", "VLSM Practical Lab"),
  ],
  "Pengenalan IPv6 dengan latihan terstruktur": [
    ytVideo("LMOcRYmV4Lc", "What Is IPv6? | IPv4 versus IPv6 Explained", "Akamai Developer"),
    ytVideo("WiX0g8IAibM", "What's IPv6 Link-Local Address and Global Unicast Address"),
  ],
  "Praktik: IPv4": [
    ytVideo("skFguwQxjU0", "How to assign IP Address on a Router in Packet Tracer"),
    ytVideo("LyxoYIsjeKM", "Packet Tracer 1.4.7 - Configure Router Interfaces"),
  ],
  "Praktik: CIDR": [
    ytVideo("Jv9ceit-fmw", "6.4.1.5 Packet Tracer - Configuring IPv4 Route Summarization - Scenario 1"),
    ytVideo("S3BGwpEOj_g", "Static Routing Lab with 3 Routes in Cisco Packet Tracer"),
  ],
  "Praktik: VLSM": [
    ytVideo("XCyiD-EjkDg", "Cisco Packet Tracer CCNA 200-301 Lab Walkthroughs - Lab 03 - Variable Length Subnet Masking (VLSM)"),
  ],
  "Praktik: pengenalan IPv6 dengan latihan terstruktur": [
    ytVideo("M7w4wLg64eo", "Packet Tracer - Configuring IPv4 and IPv6 Interfaces"),
    ytVideo("plA6IxpFyWY", "configuring ipv6 unicast routing"),
    ytVideo("yMK1NVHksDE", "IPv6 SLAAC and EUI-64 Basics in Packet Tracer"),
  ],
  "Studi kasus: IPv4": [
    ytVideo("q5ObBkBWBHQ", "How to find Network ID and Broadcast ID for any IP Address"),
    ytVideo("hb2yTNT2rBU", "Calculate Network, Broadcast and host addresses"),
  ],
  "Studi kasus: CIDR": [
    ytVideo("J3AIytvPDpQ", "Packet Tracer 6.4.1.6 - Configuring IPv4 Route Summarization - Scenario 2 - CCNA 2"),
  ],

  // ---- Layanan jaringan: DNS, DHCP, HTTP & NTP (g-3) ----
  "Pengantar layanan jaringan": [
    ytVideo("qr5Gij15EmE", "DHCP dan ARP: bagaimana perangkat mendapat IP", "Theo Ong"),
  ],
  "Cara kerja DHCP": [
    ytVideo("4pkDL1pgCgQ", "DHCP Explained - Dynamic Host Configuration Protocol | DHCP DORA process", "TechTerms"),
    ytVideo("ywkJepIQNIU", "DHCP DORA Process Explained: Discover, Offer, Request, Ack"),
  ],
  "Cara kerja DNS": [
    ytVideo("NiQTs9DbtW4", "How DNS Works", "NetworkChuck"),
    ytVideo("UVR9lhUGAyU", "DNS explained", "Fireship"),
  ],
  "Cara kerja HTTP": [
    ytVideo("iYM2zFP3Zn0", "HTTP Crash Course & Exploration"),
    ytVideo("Km2VTefqfpk", "HTTP Status Codes Explained"),
    ytVideo("86cQJ0MMses", "TLS Handshake Explained", "Computerphile"),
  ],
  "Cara kerja NTP": [
    ytVideo("5QeRJ_C4jlY", "NTP: Network Time Protocol Explained for Beginners!"),
    ytVideo("f1hlCZB0GDA", "What is Network Time Protocol?"),
  ],
  "Praktik: DHCP dan DNS": [
    ytVideo("K3jSjRAJof4", "Windows DHCP Wireshark DORA (Discover, Offer, Request, Acknowledge) Illustrated"),
    ytVideo("YRDif_1DNQY", "DHCP DORA Explained with LAB & Packet Capture"),
    ytVideo("_6aL4m8aDjc", "Perintah dig untuk query DNS"),
  ],
  "Praktik: HTTP dan NTP": [
    ytVideo("jouHK2vp-vs", "How to Send HTTP request Headers through CURL Command Call"),
    ytVideo("70Vdzmj4x2A", "How to install Chrony NTP Server on Linux"),
    ytVideo("4bAz9tchVEg", "How to Set Up an NTP Server on Linux (Chrony)"),
  ],
  "Studi kasus: gejala yang muncul saat salah satunya bermasalah": [
    ytVideo("mx8RP-XsEKw", "Network Troubleshooting using the NSLOOKUP Command"),
    ytVideo("kdn2f2CQYgY", "Fixing DNS resolution issues"),
  ],
  "Rangkuman dan latihan layanan jaringan": [
    ytVideo("NiQTs9DbtW4", "How DNS Works (rangkuman DNS)", "NetworkChuck"),
  ],

  // ---- Kabel, Fiber Optik & Infrastruktur Fisik (g-4) ----
  "Pengantar kabel dan infrastruktur fisik": [
    ytVideo("teah142FGBc", "Learn Network Cable Management Inside Rack From Scratch"),
    ytVideo("99yu9wXuYDg", "Power Distribution Units"),
  ],
  "Kabel UTP": [
    ytVideo("I60tbQ3cRco", "Ethernet Cable Types, UTP vs STP, Cat5? Cat5e? Cat6 ..."),
    ytVideo("v0Ixl_Jr95Y", "Don't Buy the Wrong Cable - Cat 5 to Cat 8 Explained"),
  ],
  "Crimping kabel UTP": [
    ytVideo("l47kaQBQar8", "Cara Crimping Kabel LAN UTP RJ45 Straight & Cross (Cat5e & Cat6)"),
    ytVideo("_G717flG_fQ", "Cara membuat kabel LAN Straight T568B"),
  ],
  "Tes kabel": [
    ytVideo("Tx5W7ayh3-Q", "How to Use Lan Cable Tester - Easy Guide"),
    ytVideo("Le72u_OpwF0", "Basic Network Troubleshooting: Cable Tester"),
  ],
  "Fiber optik SM dan MM": [
    ytVideo("sFYDo_qxRBE", "Optical Fiber: multimode vs single-mode (Network+ N10-008)", "Professor Messer"),
    ytVideo("t24NyGSdJzc", "Difference Between Single Mode and Multimode Fiber Optic Cable"),
  ],
  "Konektor fiber dan perawatannya": [
    ytVideo("iCJM7IRbsYU", "Most Common Fiber Optic Connectors - Full Breakdown with Examples"),
    ytVideo("lyYx-xxaEP4", "How to Differentiate UPC from APC Connectors"),
  ],
  "Redaman dan link budget": [
    ytVideo("V7we1VkaI_A", "dB vs dBm Explained Simply"),
  ],

  // ---- Dokumentasi Jaringan: Topologi, IPAM & Penamaan (g-5) ----
  "Pengantar dokumentasi jaringan": [
    ytVideo("aNdjYRLSZTc", "Tutorial: How to use Draw.io to create a Network Diagram for FREE! (Part 1)"),
  ],
  "Diagram topologi": [
    ytVideo("3yM8-bZ51ck", "Logical vs Physical Topology Explained"),
    ytVideo("8sJx_sGWGzw", "How to Create a Basic Network Diagram Using Draw.io"),
  ],
  "Rencana IP": [
    ytVideo("R-dvzKvLFyI", "IP Address Management with full explanation - IPAM"),
    ytVideo("mzoRCOK5HCo", "NetBox IPAM Explained: How to Model Your IP Address Space Correctly"),
  ],
  "Standar penamaan perangkat": [
    ytVideo("npHbJVpYPLc", "Hostnames and Domains on Linux Servers"),
  ],
  "Label kabel yang konsisten": [
    ytVideo("UYgPtCNhoG4", "Cable Labelling and cable management"),
    ytVideo("gVJqly0rRnU", "Patch Panel labeling The best way!"),
    ytVideo("HD_jnup9lPg", "How To Label Cat6 Cables!"),
  ],

  // ---- Ticketing, SLA & NOC (n-2) ----
  "Severity vs Prioritas": [
    ytVideo("cYA1VIEX7fg", "ITIL: Incident Prioritization (Urgency vs Impact)"),
    ytVideo("tQYQEk580GA", "Incident priority matrix di ITSM"),
  ],
  "SLA: Respons, Resolusi & Cara Menghitungnya": [
    ytVideo("uy7rPpxwbUY", "Apa Itu SLA (Service Level Agreement)?"),
    ytVideo("K9s3I4urtok", "Penjelasan SLA (Service Level Agreement)"),
  ],
};

/** Sisipkan video bab (kalau ada) sebelum blok "check" terakhir, atau di akhir bab. */
export function withVideos<T extends { title: string; blocks: Block[] }>(
  chapter: T,
): T {
  const videos = videosByChapterTitle[chapter.title];
  if (!videos?.length) return chapter;

  const extra: Block[] = [{ t: "h", x: "Video pendukung" }, ...videos];

  const blocks = [...chapter.blocks];
  let at = blocks.length;
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].t === "check") {
      at = i;
      break;
    }
  }
  blocks.splice(at, 0, ...extra);
  return { ...chapter, blocks };
}
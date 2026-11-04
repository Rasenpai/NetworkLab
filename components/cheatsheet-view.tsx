"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge, Card, SectionTitle } from "@/components/ui";

/* ───────────────────────── Data: Port ───────────────────────── */

type Proto = "TCP" | "UDP" | "TCP/UDP";

type PortItem = {
  port: string;
  proto: Proto;
  service: string;
  desc: string;
  category: string;
};

const PORTS: PortItem[] = [
  // Web
  {
    port: "80",
    proto: "TCP",
    service: "HTTP",
    desc: "Web tanpa enkripsi",
    category: "Web",
  },
  {
    port: "443",
    proto: "TCP",
    service: "HTTPS",
    desc: "Web terenkripsi (TLS)",
    category: "Web",
  },
  {
    port: "8080",
    proto: "TCP",
    service: "HTTP-Alt",
    desc: "HTTP alternatif, sering untuk proxy dan web panel",
    category: "Web",
  },
  {
    port: "3128",
    proto: "TCP",
    service: "Squid Proxy",
    desc: "Web proxy default Squid",
    category: "Web",
  },

  // Remote access
  {
    port: "22",
    proto: "TCP",
    service: "SSH",
    desc: "Remote CLI terenkripsi, juga SFTP dan SCP",
    category: "Remote Access",
  },
  {
    port: "23",
    proto: "TCP",
    service: "Telnet",
    desc: "Remote CLI tanpa enkripsi (hindari)",
    category: "Remote Access",
  },
  {
    port: "3389",
    proto: "TCP",
    service: "RDP",
    desc: "Remote Desktop Windows",
    category: "Remote Access",
  },
  {
    port: "5900",
    proto: "TCP",
    service: "VNC",
    desc: "Remote desktop berbasis VNC",
    category: "Remote Access",
  },

  // Email
  {
    port: "25",
    proto: "TCP",
    service: "SMTP",
    desc: "Kirim email antar server",
    category: "Email",
  },
  {
    port: "465",
    proto: "TCP",
    service: "SMTPS",
    desc: "SMTP dengan SSL/TLS langsung",
    category: "Email",
  },
  {
    port: "587",
    proto: "TCP",
    service: "SMTP Submission",
    desc: "Kirim email dari klien (STARTTLS)",
    category: "Email",
  },
  {
    port: "110",
    proto: "TCP",
    service: "POP3",
    desc: "Ambil email, biasanya dihapus dari server",
    category: "Email",
  },
  {
    port: "995",
    proto: "TCP",
    service: "POP3S",
    desc: "POP3 terenkripsi",
    category: "Email",
  },
  {
    port: "143",
    proto: "TCP",
    service: "IMAP",
    desc: "Ambil email, tetap tersimpan di server",
    category: "Email",
  },
  {
    port: "993",
    proto: "TCP",
    service: "IMAPS",
    desc: "IMAP terenkripsi",
    category: "Email",
  },

  // File transfer
  {
    port: "20, 21",
    proto: "TCP",
    service: "FTP",
    desc: "20 untuk data, 21 untuk kontrol",
    category: "File Transfer",
  },
  {
    port: "69",
    proto: "UDP",
    service: "TFTP",
    desc: "Transfer file sederhana, untuk backup config dan firmware",
    category: "File Transfer",
  },
  {
    port: "445",
    proto: "TCP",
    service: "SMB",
    desc: "Berbagi file Windows / Samba",
    category: "File Transfer",
  },
  {
    port: "2049",
    proto: "TCP/UDP",
    service: "NFS",
    desc: "Berbagi file di Linux/Unix",
    category: "File Transfer",
  },

  // Name & network services
  {
    port: "53",
    proto: "TCP/UDP",
    service: "DNS",
    desc: "UDP untuk query biasa, TCP untuk zone transfer dan respons besar",
    category: "Layanan Jaringan",
  },
  {
    port: "67, 68",
    proto: "UDP",
    service: "DHCP",
    desc: "67 untuk server, 68 untuk klien",
    category: "Layanan Jaringan",
  },
  {
    port: "123",
    proto: "UDP",
    service: "NTP",
    desc: "Sinkronisasi waktu",
    category: "Layanan Jaringan",
  },
  {
    port: "389",
    proto: "TCP/UDP",
    service: "LDAP",
    desc: "Direktori user (Active Directory)",
    category: "Layanan Jaringan",
  },
  {
    port: "636",
    proto: "TCP",
    service: "LDAPS",
    desc: "LDAP terenkripsi",
    category: "Layanan Jaringan",
  },
  {
    port: "1812, 1813",
    proto: "UDP",
    service: "RADIUS",
    desc: "1812 autentikasi, 1813 accounting (hotspot, 802.1X)",
    category: "Layanan Jaringan",
  },
  {
    port: "5060, 5061",
    proto: "TCP/UDP",
    service: "SIP",
    desc: "Sinyal VoIP, 5061 untuk TLS",
    category: "Layanan Jaringan",
  },

  // Routing
  {
    port: "179",
    proto: "TCP",
    service: "BGP",
    desc: "Routing antar Autonomous System",
    category: "Routing",
  },
  {
    port: "520",
    proto: "UDP",
    service: "RIP",
    desc: "Routing protocol RIP",
    category: "Routing",
  },
  {
    port: "646",
    proto: "TCP/UDP",
    service: "LDP",
    desc: "Distribusi label MPLS",
    category: "Routing",
  },

  // VPN
  {
    port: "500, 4500",
    proto: "UDP",
    service: "IPsec (IKE / NAT-T)",
    desc: "Negosiasi kunci IPsec, 4500 jika ada NAT",
    category: "VPN",
  },
  {
    port: "1194",
    proto: "UDP",
    service: "OpenVPN",
    desc: "Default OpenVPN (bisa TCP juga)",
    category: "VPN",
  },
  {
    port: "1701",
    proto: "UDP",
    service: "L2TP",
    desc: "Tunnel L2TP, biasanya dipasangkan dengan IPsec",
    category: "VPN",
  },
  {
    port: "1723",
    proto: "TCP",
    service: "PPTP",
    desc: "VPN lama, tidak lagi aman",
    category: "VPN",
  },
  {
    port: "51820",
    proto: "UDP",
    service: "WireGuard",
    desc: "Default WireGuard (bisa diganti)",
    category: "VPN",
  },

  // Monitoring
  {
    port: "161, 162",
    proto: "UDP",
    service: "SNMP",
    desc: "161 polling, 162 trap",
    category: "Monitoring",
  },
  {
    port: "514",
    proto: "UDP",
    service: "Syslog",
    desc: "Pengiriman log ke server",
    category: "Monitoring",
  },
  {
    port: "10050, 10051",
    proto: "TCP",
    service: "Zabbix",
    desc: "10050 agent, 10051 server/trapper",
    category: "Monitoring",
  },
  {
    port: "2055",
    proto: "UDP",
    service: "NetFlow",
    desc: "Ekspor data flow (umum dipakai, bisa diubah)",
    category: "Monitoring",
  },
  {
    port: "3000",
    proto: "TCP",
    service: "Grafana",
    desc: "Web UI default Grafana",
    category: "Monitoring",
  },

  // Database
  {
    port: "3306",
    proto: "TCP",
    service: "MySQL / MariaDB",
    desc: "Database MySQL",
    category: "Database",
  },
  {
    port: "5432",
    proto: "TCP",
    service: "PostgreSQL",
    desc: "Database PostgreSQL",
    category: "Database",
  },
  {
    port: "6379",
    proto: "TCP",
    service: "Redis",
    desc: "In-memory data store",
    category: "Database",
  },
  {
    port: "27017",
    proto: "TCP",
    service: "MongoDB",
    desc: "Database MongoDB",
    category: "Database",
  },

  // MikroTik
  {
    port: "8291",
    proto: "TCP",
    service: "Winbox",
    desc: "Akses GUI Winbox ke RouterOS",
    category: "MikroTik",
  },
  {
    port: "8728",
    proto: "TCP",
    service: "RouterOS API",
    desc: "API RouterOS tanpa SSL",
    category: "MikroTik",
  },
  {
    port: "8729",
    proto: "TCP",
    service: "RouterOS API-SSL",
    desc: "API RouterOS terenkripsi",
    category: "MikroTik",
  },
  {
    port: "5678",
    proto: "UDP",
    service: "MNDP",
    desc: "MikroTik Neighbor Discovery",
    category: "MikroTik",
  },
];

const IP_PROTOCOLS: { num: string; name: string; desc: string }[] = [
  { num: "1", name: "ICMP", desc: "Ping, traceroute, pesan error" },
  { num: "6", name: "TCP", desc: "Transport andal, berorientasi koneksi" },
  { num: "17", name: "UDP", desc: "Transport cepat, tanpa koneksi" },
  { num: "47", name: "GRE", desc: "Tunnel generik (dipakai PPTP, tunnel GRE)" },
  { num: "50", name: "ESP", desc: "Payload terenkripsi IPsec" },
  { num: "51", name: "AH", desc: "Autentikasi header IPsec" },
  { num: "88", name: "EIGRP", desc: "Routing protocol Cisco" },
  { num: "89", name: "OSPF", desc: "Routing link-state (tidak memakai port)" },
  { num: "112", name: "VRRP", desc: "Redundansi gateway" },
];

/* ───────────────────────── Data: OSI ───────────────────────── */

const OSI: {
  n: number;
  name: string;
  func: string;
  pdu: string;
  protocols: string;
  devices: string;
  tcpip: string;
}[] = [
  {
    n: 7,
    name: "Application",
    func: "Antarmuka layanan jaringan untuk aplikasi",
    pdu: "Data",
    protocols: "HTTP, DNS, DHCP, SSH, FTP, SMTP",
    devices: "Gateway, firewall L7",
    tcpip: "Application",
  },
  {
    n: 6,
    name: "Presentation",
    func: "Format data, enkripsi, dan kompresi",
    pdu: "Data",
    protocols: "TLS/SSL, JPEG, MPEG, ASCII",
    devices: "Gateway",
    tcpip: "Application",
  },
  {
    n: 5,
    name: "Session",
    func: "Membuka, menjaga, dan menutup sesi komunikasi",
    pdu: "Data",
    protocols: "NetBIOS, RPC, SIP",
    devices: "Gateway",
    tcpip: "Application",
  },
  {
    n: 4,
    name: "Transport",
    func: "Pengiriman end-to-end, segmentasi, nomor port",
    pdu: "Segment (TCP) / Datagram (UDP)",
    protocols: "TCP, UDP",
    devices: "Firewall, load balancer",
    tcpip: "Transport",
  },
  {
    n: 3,
    name: "Network",
    func: "Pengalamatan logis dan pemilihan jalur (routing)",
    pdu: "Packet",
    protocols: "IP, ICMP, OSPF, BGP, IPsec",
    devices: "Router, switch L3",
    tcpip: "Internet",
  },
  {
    n: 2,
    name: "Data Link",
    func: "Pengalamatan fisik (MAC), deteksi error, akses media",
    pdu: "Frame",
    protocols: "Ethernet, ARP, VLAN (802.1Q), STP, PPP",
    devices: "Switch, bridge, access point",
    tcpip: "Network Access",
  },
  {
    n: 1,
    name: "Physical",
    func: "Transmisi bit lewat kabel, serat optik, atau radio",
    pdu: "Bit",
    protocols: "Kabel UTP, fiber, RJ45, SFP, WiFi (radio)",
    devices: "Hub, repeater, kabel, NIC",
    tcpip: "Network Access",
  },
];

const TCPIP: { name: string; osi: string; examples: string }[] = [
  {
    name: "Application",
    osi: "Layer 7, 6, 5",
    examples: "HTTP, DNS, DHCP, SSH, SMTP",
  },
  { name: "Transport", osi: "Layer 4", examples: "TCP, UDP" },
  { name: "Internet", osi: "Layer 3", examples: "IP, ICMP, IPsec" },
  {
    name: "Network Access",
    osi: "Layer 2, 1",
    examples: "Ethernet, WiFi, ARP",
  },
];

/* ───────────────────────── Data: IP ───────────────────────── */

const IP_CLASSES: {
  cls: string;
  range: string;
  mask: string;
  prefix: string;
  hosts: string;
  note: string;
}[] = [
  {
    cls: "A",
    range: "1.0.0.0 – 126.255.255.255",
    mask: "255.0.0.0",
    prefix: "/8",
    hosts: "16.777.214",
    note: "Jaringan sangat besar",
  },
  {
    cls: "B",
    range: "128.0.0.0 – 191.255.255.255",
    mask: "255.255.0.0",
    prefix: "/16",
    hosts: "65.534",
    note: "Jaringan menengah",
  },
  {
    cls: "C",
    range: "192.0.0.0 – 223.255.255.255",
    mask: "255.255.255.0",
    prefix: "/24",
    hosts: "254",
    note: "Jaringan kecil (LAN)",
  },
  {
    cls: "D",
    range: "224.0.0.0 – 239.255.255.255",
    mask: "-",
    prefix: "-",
    hosts: "-",
    note: "Multicast",
  },
  {
    cls: "E",
    range: "240.0.0.0 – 255.255.255.255",
    mask: "-",
    prefix: "-",
    hosts: "-",
    note: "Eksperimental / cadangan",
  },
];

const PRIVATE_RANGES: { range: string; cidr: string; cls: string }[] = [
  { range: "10.0.0.0 – 10.255.255.255", cidr: "10.0.0.0/8", cls: "A" },
  { range: "172.16.0.0 – 172.31.255.255", cidr: "172.16.0.0/12", cls: "B" },
  { range: "192.168.0.0 – 192.168.255.255", cidr: "192.168.0.0/16", cls: "C" },
];

const SPECIAL_ADDRESSES: { addr: string; use: string }[] = [
  {
    addr: "127.0.0.0/8",
    use: "Loopback (127.0.0.1 = localhost, mengarah ke diri sendiri)",
  },
  { addr: "169.254.0.0/16", use: "APIPA / link-local, muncul saat DHCP gagal" },
  {
    addr: "0.0.0.0",
    use: "Alamat tidak ditentukan; 0.0.0.0/0 berarti default route",
  },
  { addr: "255.255.255.255", use: "Limited broadcast (seluruh segmen lokal)" },
  { addr: "224.0.0.0/4", use: "Multicast (224.0.0.5 dan .6 dipakai OSPF)" },
  { addr: "100.64.0.0/10", use: "CGNAT, dipakai ISP untuk berbagi IP publik" },
];

const IPV6_TYPES: { prefix: string; name: string; note: string }[] = [
  { prefix: "::1/128", name: "Loopback", note: "Setara 127.0.0.1" },
  {
    prefix: "fe80::/10",
    name: "Link-local",
    note: "Otomatis di tiap interface, hanya dalam satu segmen",
  },
  {
    prefix: "fc00::/7",
    name: "Unique local (ULA)",
    note: "Setara IP privat IPv4",
  },
  {
    prefix: "2000::/3",
    name: "Global unicast",
    note: "Alamat publik yang bisa dirutekan di internet",
  },
  {
    prefix: "ff00::/8",
    name: "Multicast",
    note: "Pengganti broadcast, IPv6 tidak punya broadcast",
  },
];

function toDotted(n: number) {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}

const CIDR_ROWS = Array.from({ length: 25 }, (_, i) => {
  const p = 8 + i;
  const mask = (0xffffffff << (32 - p)) >>> 0;
  const wildcard = ~mask >>> 0;
  const total = 2 ** (32 - p);
  const usable = p === 32 ? 1 : p === 31 ? 2 : total - 2;
  const note =
    p === 32
      ? "Satu host"
      : p === 31
        ? "Link point-to-point"
        : p === 30
          ? "Link antar router"
          : p === 24
            ? "Satu LAN kecil"
            : "";
  return {
    prefix: `/${p}`,
    mask: toDotted(mask),
    wildcard: toDotted(wildcard),
    total: total.toLocaleString("id-ID"),
    usable: usable.toLocaleString("id-ID"),
    note,
  };
});

/* ───────────────────────── Data: Glosarium ───────────────────────── */

type Term = { term: string; def: string; category: string };

const GLOSSARY: Term[] = [
  // Dasar
  {
    term: "LAN",
    def: "Local Area Network. Jaringan di area terbatas seperti rumah, kantor, atau sekolah.",
    category: "Dasar",
  },
  {
    term: "WAN",
    def: "Wide Area Network. Jaringan yang menghubungkan lokasi berjauhan, termasuk internet.",
    category: "Dasar",
  },
  {
    term: "Bandwidth",
    def: "Kapasitas maksimum sebuah link, diukur dalam bps (bit per detik).",
    category: "Dasar",
  },
  {
    term: "Throughput",
    def: "Kecepatan data yang benar-benar tercapai, biasanya lebih kecil dari bandwidth.",
    category: "Dasar",
  },
  {
    term: "Latency",
    def: "Waktu tempuh paket dari asal ke tujuan, diukur dalam milidetik (ms).",
    category: "Dasar",
  },
  {
    term: "Jitter",
    def: "Variasi latency antar paket. Jitter tinggi merusak kualitas suara dan video.",
    category: "Dasar",
  },
  {
    term: "Packet Loss",
    def: "Persentase paket yang hilang di jalan. Sedikit saja sudah terasa pada VoIP dan game.",
    category: "Dasar",
  },
  {
    term: "Packet",
    def: "Unit data di layer 3 (Network) yang membawa alamat IP asal dan tujuan.",
    category: "Dasar",
  },
  {
    term: "Frame",
    def: "Unit data di layer 2 (Data Link) yang membawa alamat MAC.",
    category: "Dasar",
  },
  {
    term: "MTU",
    def: "Maximum Transmission Unit. Ukuran paket terbesar yang boleh lewat tanpa dipecah, umumnya 1500 byte.",
    category: "Dasar",
  },
  {
    term: "TTL",
    def: "Time To Live. Batas jumlah hop sebuah paket, dikurangi 1 di tiap router untuk mencegah loop.",
    category: "Dasar",
  },
  {
    term: "Hop",
    def: "Satu lompatan melewati sebuah router dalam perjalanan paket.",
    category: "Dasar",
  },
  {
    term: "Full-duplex",
    def: "Kirim dan terima data bersamaan. Standar switch modern.",
    category: "Dasar",
  },
  {
    term: "Half-duplex",
    def: "Kirim dan terima bergantian, tidak bersamaan.",
    category: "Dasar",
  },
  {
    term: "Three-way Handshake",
    def: "Proses SYN, SYN-ACK, ACK untuk membuka koneksi TCP.",
    category: "Dasar",
  },
  {
    term: "TCP",
    def: "Protokol transport yang andal: ada koneksi, urutan, dan pengiriman ulang.",
    category: "Dasar",
  },
  {
    term: "UDP",
    def: "Protokol transport yang cepat dan ringan, tanpa jaminan pengiriman.",
    category: "Dasar",
  },
  {
    term: "Ping",
    def: "Perintah berbasis ICMP untuk mengecek apakah perangkat tujuan terjangkau dan berapa latency-nya.",
    category: "Dasar",
  },

  // Addressing
  {
    term: "IP Address",
    def: "Alamat logis perangkat di jaringan. IPv4 panjangnya 32 bit, IPv6 128 bit.",
    category: "Addressing",
  },
  {
    term: "MAC Address",
    def: "Alamat fisik 48 bit pada NIC, dipakai di layer 2 dalam satu segmen.",
    category: "Addressing",
  },
  {
    term: "Subnet Mask",
    def: "Penanda bagian network dan host pada alamat IP, contoh 255.255.255.0.",
    category: "Addressing",
  },
  {
    term: "Subnet",
    def: "Pembagian jaringan besar menjadi segmen-segmen yang lebih kecil.",
    category: "Addressing",
  },
  {
    term: "CIDR",
    def: "Penulisan prefix tanpa kelas, contoh 192.168.1.0/24.",
    category: "Addressing",
  },
  {
    term: "VLSM",
    def: "Variable Length Subnet Mask. Subnet dengan ukuran berbeda-beda sesuai kebutuhan tiap segmen.",
    category: "Addressing",
  },
  {
    term: "Wildcard Mask",
    def: "Kebalikan subnet mask, dipakai di ACL dan OSPF (0 = harus cocok).",
    category: "Addressing",
  },
  {
    term: "Default Gateway",
    def: "Alamat router yang dipakai host untuk menuju jaringan lain.",
    category: "Addressing",
  },
  {
    term: "Broadcast",
    def: "Pengiriman ke semua perangkat dalam satu segmen. Tidak ada di IPv6.",
    category: "Addressing",
  },
  {
    term: "Unicast / Multicast",
    def: "Unicast ke satu tujuan, multicast ke sekelompok tujuan tertentu.",
    category: "Addressing",
  },
  {
    term: "Loopback",
    def: "Alamat atau interface virtual yang mengarah ke perangkat itu sendiri.",
    category: "Addressing",
  },
  {
    term: "APIPA",
    def: "Alamat 169.254.x.x yang dipasang otomatis saat klien gagal mendapat IP dari DHCP.",
    category: "Addressing",
  },
  {
    term: "DHCP",
    def: "Layanan pembagi IP otomatis ke klien, lengkap dengan gateway dan DNS.",
    category: "Addressing",
  },
  {
    term: "DNS",
    def: "Layanan yang menerjemahkan nama domain menjadi alamat IP.",
    category: "Addressing",
  },
  {
    term: "ARP",
    def: "Address Resolution Protocol. Mencari MAC address dari sebuah IP address dalam satu segmen.",
    category: "Addressing",
  },

  // Routing & switching
  {
    term: "Router",
    def: "Perangkat layer 3 yang meneruskan paket antar jaringan berdasarkan tabel routing.",
    category: "Routing & Switching",
  },
  {
    term: "Switch",
    def: "Perangkat layer 2 yang meneruskan frame berdasarkan MAC address.",
    category: "Routing & Switching",
  },
  {
    term: "Static Route",
    def: "Rute yang diisi manual oleh admin. Sederhana, tapi tidak beradaptasi saat ada gangguan.",
    category: "Routing & Switching",
  },
  {
    term: "Default Route",
    def: "Rute cadangan (0.0.0.0/0) untuk semua tujuan yang tidak ada di tabel routing.",
    category: "Routing & Switching",
  },
  {
    term: "Dynamic Routing",
    def: "Router saling bertukar informasi rute secara otomatis, contoh OSPF dan BGP.",
    category: "Routing & Switching",
  },
  {
    term: "OSPF",
    def: "Routing protocol link-state untuk jaringan internal, memakai konsep area.",
    category: "Routing & Switching",
  },
  {
    term: "BGP",
    def: "Routing protocol antar Autonomous System, tulang punggung internet.",
    category: "Routing & Switching",
  },
  {
    term: "Autonomous System (AS)",
    def: "Kumpulan jaringan di bawah satu administrasi, diidentifikasi dengan nomor AS.",
    category: "Routing & Switching",
  },
  {
    term: "Metric",
    def: "Nilai biaya sebuah rute yang dipakai protokol untuk memilih jalur terbaik.",
    category: "Routing & Switching",
  },
  {
    term: "Administrative Distance",
    def: "Tingkat kepercayaan sumber rute; nilai lebih kecil lebih diprioritaskan.",
    category: "Routing & Switching",
  },
  {
    term: "VLAN",
    def: "Pemisahan jaringan secara logis di switch yang sama, tiap VLAN punya broadcast domain sendiri.",
    category: "Routing & Switching",
  },
  {
    term: "Trunk",
    def: "Port yang membawa banyak VLAN sekaligus lewat tagging 802.1Q.",
    category: "Routing & Switching",
  },
  {
    term: "Inter-VLAN Routing",
    def: "Routing antar VLAN, bisa lewat router-on-a-stick atau switch layer 3.",
    category: "Routing & Switching",
  },
  {
    term: "STP",
    def: "Spanning Tree Protocol. Mencegah loop layer 2 dengan memblokir jalur berlebih.",
    category: "Routing & Switching",
  },
  {
    term: "Broadcast Domain",
    def: "Area tempat broadcast sampai. Router dan VLAN memisahkannya.",
    category: "Routing & Switching",
  },
  {
    term: "Collision Domain",
    def: "Area tempat tabrakan frame bisa terjadi. Tiap port switch adalah satu collision domain.",
    category: "Routing & Switching",
  },
  {
    term: "EtherChannel / LAG",
    def: "Menggabungkan beberapa link fisik menjadi satu link logis.",
    category: "Routing & Switching",
  },
  {
    term: "VRRP / HSRP",
    def: "Protokol redundansi gateway: dua router berbagi satu IP virtual.",
    category: "Routing & Switching",
  },
  {
    term: "Load Balancing",
    def: "Membagi trafik ke beberapa jalur atau server.",
    category: "Routing & Switching",
  },
  {
    term: "Failover",
    def: "Perpindahan otomatis ke jalur atau perangkat cadangan saat yang utama gagal.",
    category: "Routing & Switching",
  },
  {
    term: "PoE",
    def: "Power over Ethernet. Daya listrik dikirim lewat kabel UTP, praktis untuk AP dan CCTV.",
    category: "Routing & Switching",
  },

  // Keamanan
  {
    term: "Firewall",
    def: "Penyaring trafik berdasarkan aturan: IP, port, protokol, atau status koneksi.",
    category: "Keamanan",
  },
  {
    term: "ACL",
    def: "Access Control List. Daftar aturan izinkan atau tolak pada router atau switch.",
    category: "Keamanan",
  },
  {
    term: "NAT",
    def: "Network Address Translation. Menerjemahkan IP privat menjadi IP publik.",
    category: "Keamanan",
  },
  {
    term: "PAT / Masquerade",
    def: "NAT yang membuat banyak perangkat berbagi satu IP publik dengan beda nomor port.",
    category: "Keamanan",
  },
  {
    term: "Port Forwarding",
    def: "Meneruskan akses dari luar ke sebuah perangkat di dalam jaringan privat (dst-nat).",
    category: "Keamanan",
  },
  {
    term: "DMZ",
    def: "Zona terpisah untuk server yang diakses publik, agar jaringan internal tetap aman.",
    category: "Keamanan",
  },
  {
    term: "VPN",
    def: "Tunnel terenkripsi lewat jaringan publik untuk menghubungkan lokasi atau pengguna dengan aman.",
    category: "Keamanan",
  },
  {
    term: "Tunnel",
    def: "Jalur logis yang membungkus paket di dalam paket lain, contoh GRE dan WireGuard.",
    category: "Keamanan",
  },
  {
    term: "IDS / IPS",
    def: "Sistem deteksi (IDS) dan pencegahan (IPS) serangan pada jaringan.",
    category: "Keamanan",
  },
  {
    term: "Proxy",
    def: "Perantara antara klien dan server, bisa untuk cache, filter, atau menyembunyikan identitas.",
    category: "Keamanan",
  },
  {
    term: "RADIUS",
    def: "Protokol autentikasi terpusat, dipakai di hotspot dan 802.1X.",
    category: "Keamanan",
  },
  {
    term: "802.1X",
    def: "Autentikasi per port atau per user sebelum perangkat boleh terhubung ke jaringan.",
    category: "Keamanan",
  },

  // Wireless
  {
    term: "SSID",
    def: "Nama jaringan WiFi yang terlihat oleh pengguna.",
    category: "Wireless",
  },
  {
    term: "Access Point (AP)",
    def: "Perangkat yang memancarkan sinyal WiFi dan menghubungkannya ke jaringan kabel.",
    category: "Wireless",
  },
  {
    term: "2.4 GHz / 5 GHz",
    def: "2.4 GHz jangkauan luas tapi padat, 5 GHz lebih cepat dengan jangkauan lebih pendek.",
    category: "Wireless",
  },
  {
    term: "Roaming",
    def: "Perpindahan klien WiFi antar AP tanpa memutus koneksi.",
    category: "Wireless",
  },
  {
    term: "RSSI / dBm",
    def: "Ukuran kekuatan sinyal; makin mendekati 0 dBm makin kuat (-50 lebih baik dari -80).",
    category: "Wireless",
  },

  // Operasional
  {
    term: "NOC",
    def: "Network Operations Center. Tim yang memantau dan menangani gangguan jaringan.",
    category: "Operasional",
  },
  {
    term: "SNMP",
    def: "Protokol untuk memantau dan mengelola perangkat jaringan.",
    category: "Operasional",
  },
  {
    term: "Syslog",
    def: "Standar pengiriman log perangkat ke server pusat.",
    category: "Operasional",
  },
  {
    term: "NetFlow",
    def: "Data statistik aliran trafik, berguna untuk melihat siapa memakai bandwidth.",
    category: "Operasional",
  },
  {
    term: "QoS",
    def: "Quality of Service. Memprioritaskan jenis trafik tertentu, misalnya VoIP di atas download.",
    category: "Operasional",
  },
  {
    term: "SLA",
    def: "Service Level Agreement. Kesepakatan tingkat layanan, misalnya uptime 99,9%.",
    category: "Operasional",
  },
  {
    term: "MTTR",
    def: "Mean Time To Repair. Rata-rata waktu pemulihan setelah gangguan.",
    category: "Operasional",
  },
  {
    term: "Uptime",
    def: "Persentase waktu layanan tetap hidup dalam periode tertentu.",
    category: "Operasional",
  },
  {
    term: "Runbook",
    def: "Panduan langkah demi langkah menangani jenis gangguan tertentu.",
    category: "Operasional",
  },
  {
    term: "Eskalasi",
    def: "Menaikkan penanganan gangguan ke level yang lebih tinggi (L1, L2, L3).",
    category: "Operasional",
  },
].sort((a, b) => a.term.localeCompare(b.term, "id"));

/* ───────────────────────── UI helpers ───────────────────────── */

type TabId = "port" | "osi" | "ip" | "glosarium";

const TABS: { id: TabId; label: string }[] = [
  { id: "port", label: "Port & Protokol" },
  { id: "osi", label: "OSI & TCP/IP" },
  { id: "ip", label: "IP & Subnet" },
  { id: "glosarium", label: "Glosarium" },
];

const protoStyle: Record<Proto, string> = {
  TCP: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  UDP: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  "TCP/UDP": "border-accent/30 bg-accent/15 text-purple-300",
};

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-line bg-card py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {["Semua", ...options].map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              active
                ? "border-accent/30 bg-accent/15 text-purple-300"
                : "border-line bg-white/5 text-muted hover:text-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted">
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-2.5 align-top ${className}`}>{children}</td>;
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm">{children}</table>
      </div>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return <Card className="p-8 text-center text-sm text-muted">{text}</Card>;
}

const rowLine = "border-t border-line";

/* ───────────────────────── Tab: Port ───────────────────────── */

const PORT_CATEGORIES = Array.from(new Set(PORTS.map((p) => p.category)));

function PortTab() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PORTS.filter((p) => {
      if (cat !== "Semua" && p.category !== cat) return false;
      if (!s) return true;
      return (
        p.port.includes(s) ||
        p.service.toLowerCase().includes(s) ||
        p.desc.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s)
      );
    });
  }, [q, cat]);

  return (
    <div className="space-y-4">
      <SearchBox
        value={q}
        onChange={setQ}
        placeholder="Cari port atau layanan, misalnya 443 atau SSH"
      />
      <Chips options={PORT_CATEGORIES} value={cat} onChange={setCat} />

      {rows.length === 0 ? (
        <Empty text="Tidak ada port yang cocok dengan pencarian." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Port</Th>
              <Th>Protokol</Th>
              <Th>Layanan</Th>
              <Th>Keterangan</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={`${p.port}-${p.service}`} className={rowLine}>
                <Td className="whitespace-nowrap font-mono font-medium text-accent">
                  {p.port}
                </Td>
                <Td>
                  <Badge className={protoStyle[p.proto]}>{p.proto}</Badge>
                </Td>
                <Td className="whitespace-nowrap font-medium">{p.service}</Td>
                <Td className="text-muted">{p.desc}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <section className="pt-4">
        <SectionTitle
          title="Nomor Protokol IP"
          hint="Protokol yang tidak memakai port TCP/UDP"
        />
        <Table>
          <thead>
            <tr>
              <Th>No.</Th>
              <Th>Protokol</Th>
              <Th>Keterangan</Th>
            </tr>
          </thead>
          <tbody>
            {IP_PROTOCOLS.map((p) => (
              <tr key={p.num} className={rowLine}>
                <Td className="font-mono font-medium text-accent">{p.num}</Td>
                <Td className="font-medium">{p.name}</Td>
                <Td className="text-muted">{p.desc}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
}

/* ───────────────────────── Tab: OSI ───────────────────────── */

function OsiTab() {
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle
          title="Model OSI (7 Layer)"
          hint="Dari atas (aplikasi) ke bawah (fisik)"
        />
        <div className="space-y-3">
          {OSI.map((l) => (
            <Card key={l.n} className="flex gap-4 p-4 sm:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/15 text-base font-semibold text-purple-300">
                {l.n}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold">{l.name}</h4>
                  <Badge>PDU: {l.pdu}</Badge>
                  <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-300">
                    TCP/IP: {l.tcpip}
                  </Badge>
                </div>
                <p className="mt-1.5 text-sm text-muted">{l.func}</p>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Protokol / contoh
                    </dt>
                    <dd className="mt-0.5">{l.protocols}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted">
                      Perangkat
                    </dt>
                    <dd className="mt-0.5">{l.devices}</dd>
                  </div>
                </dl>
              </div>
            </Card>
          ))}
        </div>

        <Card className="mt-4 p-4 text-sm sm:p-5">
          <p className="font-medium">Jembatan keledai</p>
          <p className="mt-1.5 text-muted">
            Layer 7 ke 1:{" "}
            <span className="text-foreground">
              All People Seem To Need Data Processing
            </span>
          </p>
          <p className="mt-1 text-muted">
            Layer 1 ke 7:{" "}
            <span className="text-foreground">
              Please Do Not Throw Sausage Pizza Away
            </span>
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle
          title="Model TCP/IP (4 Layer)"
          hint="Versi ringkas yang dipakai di praktik"
        />
        <Table>
          <thead>
            <tr>
              <Th>Layer TCP/IP</Th>
              <Th>Setara OSI</Th>
              <Th>Contoh</Th>
            </tr>
          </thead>
          <tbody>
            {TCPIP.map((t) => (
              <tr key={t.name} className={rowLine}>
                <Td className="font-medium">{t.name}</Td>
                <Td className="text-muted">{t.osi}</Td>
                <Td className="text-muted">{t.examples}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section>
        <SectionTitle
          title="Urutan Troubleshooting"
          hint="Mulai dari bawah, naik satu per satu"
        />
        <Card className="p-4 text-sm sm:p-5">
          <ol className="space-y-2">
            {[
              "Layer 1: kabel terpasang, lampu link menyala, interface up?",
              "Layer 2: VLAN benar, MAC terpelajar, tidak ada loop?",
              "Layer 3: IP dan gateway benar, ping gateway berhasil, route ada?",
              "Layer 4: port terbuka dan tidak diblokir firewall?",
              "Layer 7: layanan berjalan, DNS menjawab, aplikasi sehat?",
            ].map((t, i) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-purple-300">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </Card>
      </section>
    </div>
  );
}

/* ───────────────────────── Tab: IP ───────────────────────── */

function IpTab() {
  return (
    <div className="space-y-8">
      <section>
        <SectionTitle title="Kelas IPv4" hint="Berdasarkan oktet pertama" />
        <Table>
          <thead>
            <tr>
              <Th>Kelas</Th>
              <Th>Rentang</Th>
              <Th>Subnet mask</Th>
              <Th>Prefix</Th>
              <Th>Host / jaringan</Th>
              <Th>Keterangan</Th>
            </tr>
          </thead>
          <tbody>
            {IP_CLASSES.map((c) => (
              <tr key={c.cls} className={rowLine}>
                <Td className="font-semibold text-accent">{c.cls}</Td>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {c.range}
                </Td>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {c.mask}
                </Td>
                <Td className="font-mono">{c.prefix}</Td>
                <Td>{c.hosts}</Td>
                <Td className="text-muted">{c.note}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <p className="mt-2 text-xs text-muted">
          127.x.x.x dikecualikan dari kelas A karena dipakai untuk loopback.
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle title="IP Privat" hint="Tidak dirutekan di internet" />
          <Table>
            <thead>
              <tr>
                <Th>Rentang</Th>
                <Th>CIDR</Th>
                <Th>Kelas</Th>
              </tr>
            </thead>
            <tbody>
              {PRIVATE_RANGES.map((r) => (
                <tr key={r.cidr} className={rowLine}>
                  <Td className="whitespace-nowrap font-mono text-xs">
                    {r.range}
                  </Td>
                  <Td className="whitespace-nowrap font-mono font-medium text-accent">
                    {r.cidr}
                  </Td>
                  <Td>{r.cls}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>

        <section>
          <SectionTitle title="Alamat Khusus" />
          <Table>
            <thead>
              <tr>
                <Th>Alamat</Th>
                <Th>Fungsi</Th>
              </tr>
            </thead>
            <tbody>
              {SPECIAL_ADDRESSES.map((a) => (
                <tr key={a.addr} className={rowLine}>
                  <Td className="whitespace-nowrap font-mono text-xs font-medium text-accent">
                    {a.addr}
                  </Td>
                  <Td className="text-muted">{a.use}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      </div>

      <section>
        <SectionTitle
          title="Tabel CIDR /8 sampai /32"
          hint="Host usable = total dikurangi alamat network dan broadcast"
        />
        <Table>
          <thead>
            <tr>
              <Th>Prefix</Th>
              <Th>Subnet mask</Th>
              <Th>Wildcard</Th>
              <Th>Total IP</Th>
              <Th>Host usable</Th>
              <Th>Catatan</Th>
            </tr>
          </thead>
          <tbody>
            {CIDR_ROWS.map((r) => (
              <tr key={r.prefix} className={rowLine}>
                <Td className="font-mono font-medium text-accent">
                  {r.prefix}
                </Td>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {r.mask}
                </Td>
                <Td className="whitespace-nowrap font-mono text-xs">
                  {r.wildcard}
                </Td>
                <Td>{r.total}</Td>
                <Td>{r.usable}</Td>
                <Td className="text-muted">{r.note}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section>
        <SectionTitle title="Jenis Alamat IPv6" />
        <Table>
          <thead>
            <tr>
              <Th>Prefix</Th>
              <Th>Jenis</Th>
              <Th>Keterangan</Th>
            </tr>
          </thead>
          <tbody>
            {IPV6_TYPES.map((t) => (
              <tr key={t.prefix} className={rowLine}>
                <Td className="whitespace-nowrap font-mono text-xs font-medium text-accent">
                  {t.prefix}
                </Td>
                <Td className="whitespace-nowrap font-medium">{t.name}</Td>
                <Td className="text-muted">{t.note}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>
    </div>
  );
}

/* ───────────────────────── Tab: Glosarium ───────────────────────── */

const TERM_CATEGORIES = Array.from(new Set(GLOSSARY.map((t) => t.category)));

function GlossaryTab() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Semua");

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return GLOSSARY.filter((t) => {
      if (cat !== "Semua" && t.category !== cat) return false;
      if (!s) return true;
      return (
        t.term.toLowerCase().includes(s) || t.def.toLowerCase().includes(s)
      );
    });
  }, [q, cat]);

  return (
    <div className="space-y-4">
      <SearchBox
        value={q}
        onChange={setQ}
        placeholder="Cari istilah, misalnya VLAN atau NAT"
      />
      <Chips options={TERM_CATEGORIES} value={cat} onChange={setCat} />
      <p className="text-xs text-muted">{rows.length} istilah</p>

      {rows.length === 0 ? (
        <Empty text="Istilah tidak ditemukan." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((t) => (
            <Card key={t.term} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <h4 className="font-semibold">{t.term}</h4>
                <Badge>{t.category}</Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted">{t.def}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Main ───────────────────────── */

export default function CheatsheetView() {
  const [tab, setTab] = useState<TabId>("port");

  return (
    <>
      <div
        role="tablist"
        aria-label="Pilih topik"
        className="mb-6 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-line bg-card p-1 sm:inline-flex"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                active
                  ? "bg-accent/15 text-purple-300"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {tab === "port" && <PortTab />}
        {tab === "osi" && <OsiTab />}
        {tab === "ip" && <IpTab />}
        {tab === "glosarium" && <GlossaryTab />}
      </div>
    </>
  );
}

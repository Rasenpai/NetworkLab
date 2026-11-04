import type { LabSpec } from "../types";

export const mikrotikDuaKantor: LabSpec = {
  id: "mikrotik-dua-kantor",
  title: "Dua Kantor: DHCP, Routing & NAT",
  vendor: "MikroTik",
  level: "Intermediate",
  kind: "Simulasi",
  description:
    "Bangun jaringan dua kantor dari nol: DHCP di tiap LAN, routing antar kantor, dan internet lewat NAT.",
  minutes: 70,
  intro:
    "Kantor pusat memakai R1 yang tersambung ke ISP, kantor cabang memakai R2 yang tersambung ke R1. Kedua router masih kosong. Siapkan agar PC di kedua kantor mendapat IP otomatis, saling terhubung, dan bisa ke internet.\n\n" +
    "Data jaringan: WAN R1 203.0.113.2/30, IP ISP 203.0.113.1, Link R1-R2 10.0.0.0/30, R1 ether2 10.0.0.1, R2 ether1 10.0.0.2, DNS 8.8.8.8.\n\n" +
    "Data LAN: LAN pusat 192.168.10.0/24, R1 ether3 gateway 192.168.10.1, LAN cabang 192.168.20.0/24, R2 ether2 gateway 192.168.20.1, Pool DHCP pusat 192.168.10.100-192.168.10.200, Pool DHCP cabang 192.168.20.100-192.168.20.200.\n\n" +
    "Urutan kerja yang disarankan: IP dulu, DHCP, routing, lalu NAT dan DNS. Kalau satu langkah gagal, periksa dengan ping dari router ke tetangga terdekat sebelum menyalahkan langkah berikutnya.",
  devices: [
    {
      id: "pchq",
      kind: "pc",
      label: "PC-Pusat",
      x: 60,
      y: 140,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      x: 220,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }, { name: "ether3" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R2",
      x: 400,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "pcbr",
      kind: "pc",
      label: "PC-Cabang",
      x: 560,
      y: 140,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 220,
      y: 20,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pchq", "eth0"], b: ["r1", "ether3"] },
    { a: ["r1", "ether2"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["pcbr", "eth0"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "wan",
      title: "Sambungkan R1 ke ISP",
      detail:
        "Pasang IP WAN di ether1 R1 dan default route ke ISP. R1 harus bisa ping ke internet.",
      hints: [
        "R1: /ip address add address=203.0.113.2/30 interface=ether1",
        "R1: /ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1",
        "R1: /ping 8.8.8.8",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "203.0.113.2/30" },
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "203.0.113.1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
      ],
    },
    {
      id: "ip",
      title: "Pasang IP link dan gateway LAN",
      detail:
        "Atur IP link R1-R2 dan IP gateway tiap LAN. Setelah itu R1 dan R2 harus saling ping lewat link mereka.",
      hints: [
        "R1: /ip address add address=10.0.0.1/30 interface=ether2",
        "R1: /ip address add address=192.168.10.1/24 interface=ether3",
        "R2: /ip address add address=10.0.0.2/30 interface=ether1",
        "R2: /ip address add address=192.168.20.1/24 interface=ether2",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether2", ip: "10.0.0.1/30" },
        { type: "iface-ip", device: "r1", iface: "ether3", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r2", iface: "ether1", ip: "10.0.0.2/30" },
        { type: "iface-ip", device: "r2", iface: "ether2", ip: "192.168.20.1/24" },
        { type: "ping", from: "r1", to: "10.0.0.2" },
        { type: "ping", from: "r2", to: "10.0.0.1" },
      ],
    },
    {
      id: "dhcp",
      title: "Aktifkan DHCP server di kedua LAN",
      detail:
        "Buat pool, DHCP server, dan network di tiap router, lalu minta IP dari kedua PC. Network harus memuat gateway dan dns-server 8.8.8.8 supaya client menerimanya. Server baru berstatus disabled sampai diaktifkan. Kalau PC sudah terlanjur minta IP sebelum network lengkap, jalankan dhcp lagi.",
      hints: [
        "R1: /ip pool add name=pool-pusat ranges=192.168.10.100-192.168.10.200",
        "R1: /ip dhcp-server add name=dhcp-pusat interface=ether3 address-pool=pool-pusat disabled=no",
        "R1: /ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=8.8.8.8",
        "R2: ulangi dengan pool-cabang, interface=ether2, jaringan 192.168.20.0/24 dan gateway 192.168.20.1",
        "Di terminal kedua PC ketik: dhcp, lalu show ip",
      ],
      checks: [
        { type: "dhcp-server", device: "r1", iface: "ether3" },
        { type: "dhcp-server", device: "r2", iface: "ether2" },
        { type: "has-lease", device: "pchq" },
        { type: "has-lease", device: "pcbr" },
        { type: "dns", device: "pchq", server: "8.8.8.8" },
        { type: "dns", device: "pcbr", server: "8.8.8.8" },
      ],
    },
    {
      id: "routes",
      title: "Hubungkan kedua kantor lewat routing",
      detail:
        "R1 perlu tahu letak LAN cabang, dan R2 memakai R1 sebagai jalan keluar untuk semua tujuan lain. Setelah route lengkap, kedua gateway LAN harus saling terjangkau dari PC di seberang.",
      hints: [
        "R1: /ip route add dst-address=192.168.20.0/24 gateway=10.0.0.2",
        "R2: /ip route add dst-address=0.0.0.0/0 gateway=10.0.0.1",
        "PC-Pusat: ping 192.168.20.1, PC-Cabang: ping 192.168.10.1",
      ],
      checks: [
        { type: "route", device: "r1", dst: "192.168.20.0/24", via: "10.0.0.2" },
        { type: "route", device: "r2", dst: "0.0.0.0/0", via: "10.0.0.1" },
        { type: "ping", from: "pchq", to: "192.168.20.1" },
        { type: "ping", from: "pcbr", to: "192.168.10.1" },
      ],
    },
    {
      id: "nat-dns",
      title: "Akses internet lewat NAT dan atur DNS router",
      detail:
        "Kedua PC masih timeout ke internet karena ISP tidak punya route balik ke IP privat. Pasang masquerade di WAN R1. Atur juga DNS di R1 dan R2, lalu uji ping ke nama domain dari kedua router.",
      hints: [
        "R1: /ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade",
        "R1 dan R2: /ip dns set servers=8.8.8.8",
        "R2: /ping google.com",
        "PC-Pusat dan PC-Cabang: ping 8.8.8.8",
      ],
      checks: [
        { type: "nat-masq", device: "r1", iface: "ether1" },
        { type: "dns", device: "r1", server: "8.8.8.8" },
        { type: "dns", device: "r2", server: "8.8.8.8" },
        { type: "ping", from: "pchq", to: "8.8.8.8" },
        { type: "ping", from: "pcbr", to: "8.8.8.8" },
        { type: "ping", from: "r2", to: "8.8.8.8" },
      ],
    },
  ],
};
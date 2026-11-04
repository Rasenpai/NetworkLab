import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const mikrotikTokoCabang: LabSpec = {
  id: "mikrotik-toko-cabang",
  title: "Toko Cabang Terhubung ke Pusat",
  vendor: "MikroTik",
  level: "Advanced",
  kind: "Studi Kasus",
  description:
    "Hubungkan toko cabang ke kantor pusat lewat tunnel WireGuard yang aman di atas internet publik.",
  minutes: 75,
  intro:
    "Toko Sumber Rejeki memiliki kantor pusat dan satu toko cabang, masing-masing dengan internet dari ISP berbeda. Pemilik ingin komputer kasir cabang bisa mengakses komputer pusat (stok dan laporan) lewat jalur yang terenkripsi, bukan lewat internet terbuka. Kamu ditugaskan menyiapkan kedua router MikroTik sampai kedua lokasi saling terhubung.\n\n" +
    "Kebutuhan pemilik: komputer pusat dan komputer cabang harus bisa saling berkomunikasi lewat tunnel WireGuard.\n\n" +
    "Data nama router: R-Pusat dan R-Cabang.\n\n" +
    "Data ISP Pusat: IP ISP 203.0.113.1, IP untuk R-Pusat 203.0.113.2/30.\n\n" +
    "Data ISP Cabang: IP ISP 198.51.100.1, IP untuk R-Cabang 198.51.100.2/30.\n\n" +
    "Data port kedua router: ether1 ISP, ether2 LAN.\n\n" +
    "Data LAN Pusat: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, PC-Pusat 192.168.10.10/24 (sudah terpasang).\n\n" +
    "Data LAN Cabang: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, PC-Cabang 192.168.20.10/24 (sudah terpasang).\n\n" +
    "Data tunnel: interface WireGuard bernama wg0 dengan port 51820 di kedua router, Jaringan 10.10.10.0/30, R-Pusat 10.10.10.1/30, R-Cabang 10.10.10.2/30.",
  devices: [
    {
      id: "pcp",
      kind: "pc",
      label: "PC-Pusat",
      x: 60,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
    },
    {
      id: "rp",
      kind: "mikrotik",
      label: "R-Pusat",
      hostname: "MikroTik",
      x: 190,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 320,
      y: 140,
      ifaces: [
        { name: "ge0", ip: "203.0.113.1/30" },
        { name: "ge1", ip: "198.51.100.1/30" },
      ],
    },
    {
      id: "rc",
      kind: "mikrotik",
      label: "R-Cabang",
      hostname: "MikroTik",
      x: 450,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "pcc",
      kind: "pc",
      label: "PC-Cabang",
      x: 580,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
    },
  ],
  links: [
    { a: ["pcp", "eth0"], b: ["rp", "ether2"] },
    { a: ["rp", "ether1"], b: ["isp", "ge0"] },
    { a: ["isp", "ge1"], b: ["rc", "ether1"] },
    { a: ["rc", "ether2"], b: ["pcc", "eth0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Kedua router punya nama",
      detail: "Router pusat harus bernama R-Pusat dan router cabang harus bernama R-Cabang.",
      checks: [
        { type: "hostname", device: "rp", equals: "R-Pusat" },
        { type: "hostname", device: "rc", equals: "R-Cabang" },
      ],
    },
    {
      id: "lan",
      title: "Gateway LAN terpasang",
      detail: "Router pusat dan router cabang harus menjadi gateway LAN masing-masing sesuai data.",
      checks: [
        { type: "iface-ip", device: "rp", iface: "ether2", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "rc", iface: "ether2", ip: "192.168.20.1/24" },
      ],
    },
    {
      id: "wan",
      title: "Kedua router saling menjangkau lewat internet",
      detail:
        "Kedua router harus terhubung ke ISP masing-masing dan bisa saling menjangkau alamat publiknya.",
      checks: [
        { type: "iface-ip", device: "rp", iface: "ether1", ip: "203.0.113.2/30" },
        { type: "iface-ip", device: "rc", iface: "ether1", ip: "198.51.100.2/30" },
        { type: "route", device: "rp", dst: "0.0.0.0/0", via: "203.0.113.1" },
        { type: "route", device: "rc", dst: "0.0.0.0/0", via: "198.51.100.1" },
        { type: "ping", from: "rp", to: "198.51.100.2" },
        { type: "ping", from: "rc", to: "203.0.113.2" },
      ],
    },
    {
      id: "tunnel",
      title: "Tunnel WireGuard terbentuk",
      detail:
        "Kedua router harus memiliki interface WireGuard sesuai data, saling terhubung sebagai peer, dan tunnelnya aktif.",
      checks: [
        { type: "wg-iface", device: "rp", name: "wg0", port: 51820 },
        { type: "wg-iface", device: "rc", name: "wg0", port: 51820 },
        { type: "iface-ip", device: "rp", iface: "wg0", ip: "10.10.10.1/30" },
        { type: "iface-ip", device: "rc", iface: "wg0", ip: "10.10.10.2/30" },
        { type: "wg-tunnel", device: "rp", iface: "wg0" },
        { type: "wg-tunnel", device: "rc", iface: "wg0" },
      ],
    },
    {
      id: "routing",
      title: "Kedua LAN saling dikenal lewat tunnel",
      detail:
        "Tiap router harus tahu jalan ke LAN di seberangnya lewat tunnel, dan kedua router harus bisa saling ping lewat alamat tunnel.",
      checks: [
        { type: "route", device: "rp", dst: "192.168.20.0/24", via: "10.10.10.2" },
        { type: "route", device: "rc", dst: "192.168.10.0/24", via: "10.10.10.1" },
        { type: "ping", from: "rp", to: "10.10.10.2" },
      ],
    },
    {
      id: "online",
      title: "Pusat dan cabang saling terhubung",
      detail: "PC-Pusat dan PC-Cabang harus bisa saling berkomunikasi.",
      checks: [
        { type: "ping", from: "pcp", to: "192.168.20.10" },
        { type: "ping", from: "pcc", to: "192.168.10.10" },
      ],
    },
  ],
};

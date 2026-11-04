import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const mikrotikEkspedisi: LabSpec = {
  id: "mikrotik-ekspedisi",
  title: "Ekspedisi: Pusat dan Dua Gudang",
  vendor: "MikroTik",
  level: "Intermediate",
  kind: "Studi Kasus",
  description:
    "Hubungkan kantor pusat dengan dua gudang dalam topologi bintang: DHCP, routing, dan internet lewat pusat.",
  minutes: 85,
  intro:
    "PT Kirim Cepat memiliki kantor pusat dan dua gudang. Internet hanya masuk di kantor pusat, sedangkan kedua gudang terhubung langsung ke router pusat. Kamu ditugaskan menyiapkan ketiga router MikroTik sampai seluruh jaringan perusahaan berjalan.\n\n" +
    "Kebutuhan perusahaan: staf tidak mau mengatur alamat manual, semua lokasi harus bisa saling berkomunikasi termasuk antar gudang, dan semua komputer harus bisa membuka internet lewat kantor pusat.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router pusat 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data nama router: R-Pusat, R-Gudang-A, dan R-Gudang-B.\n\n" +
    "Data port R-Pusat: ether1 ISP, ether2 LAN Pusat, ether3 ke Gudang A, ether4 ke Gudang B.\n\n" +
    "Data port gudang: ether1 ke pusat, ether2 LAN gudang.\n\n" +
    "Data link Pusat-Gudang A: Jaringan 10.0.1.0/30, Pusat 10.0.1.1, Gudang A 10.0.1.2.\n\n" +
    "Data link Pusat-Gudang B: Jaringan 10.0.2.0/30, Pusat 10.0.2.1, Gudang B 10.0.2.2.\n\n" +
    "Data LAN Pusat: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, Rentang IP 192.168.10.100-192.168.10.200.\n\n" +
    "Data LAN Gudang A: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, Rentang IP 192.168.20.100-192.168.20.200.\n\n" +
    "Data LAN Gudang B: Jaringan 192.168.30.0/24, Gateway 192.168.30.1, Rentang IP 192.168.30.100-192.168.30.200.",
  devices: [
    { id: "pcp", kind: "pc", label: "PC-Pusat", x: 60, y: 50, ifaces: [{ name: "eth0" }] },
    { id: "pcga", kind: "pc", label: "PC-GudangA", x: 570, y: 50, ifaces: [{ name: "eth0" }] },
    { id: "pcgb", kind: "pc", label: "PC-GudangB", x: 570, y: 230, ifaces: [{ name: "eth0" }] },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R-Pusat",
      hostname: "MikroTik",
      x: 230,
      y: 140,
      ifaces: [
        { name: "ether1" },
        { name: "ether2" },
        { name: "ether3" },
        { name: "ether4" },
      ],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R-Gudang-A",
      hostname: "MikroTik",
      x: 420,
      y: 50,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "r3",
      kind: "mikrotik",
      label: "R-Gudang-B",
      hostname: "MikroTik",
      x: 420,
      y: 230,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 230,
      y: 250,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pcp", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether3"], b: ["r2", "ether1"] },
    { a: ["r1", "ether4"], b: ["r3", "ether1"] },
    { a: ["r2", "ether2"], b: ["pcga", "eth0"] },
    { a: ["r3", "ether2"], b: ["pcgb", "eth0"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Ketiga router punya nama",
      detail: "Beri nama R-Pusat, R-Gudang-A, dan R-Gudang-B sesuai lokasinya.",
      checks: [
        { type: "hostname", device: "r1", equals: "R-Pusat" },
        { type: "hostname", device: "r2", equals: "R-Gudang-A" },
        { type: "hostname", device: "r3", equals: "R-Gudang-B" },
      ],
    },
    {
      id: "internet",
      title: "Kantor pusat terhubung ke internet",
      detail:
        "Router pusat harus bisa menjangkau internet, memakai DNS yang diberikan ISP, dan menerjemahkan alamat seluruh jaringan perusahaan agar bisa keluar.",
      checks: [
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "dns", device: "r1", server: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "ether1" },
      ],
    },
    {
      id: "gudang",
      title: "Gudang terhubung ke pusat",
      detail:
        "Kedua gudang harus bisa menjangkau router pusat lewat linknya dan memakai pusat sebagai jalan ke internet.",
      checks: [
        { type: "ping", from: "r1", to: "10.0.1.2" },
        { type: "ping", from: "r1", to: "10.0.2.2" },
        { type: "route", device: "r2", dst: "0.0.0.0/0", via: "10.0.1.1" },
        { type: "route", device: "r3", dst: "0.0.0.0/0", via: "10.0.2.1" },
      ],
    },
    {
      id: "pusat-tahu",
      title: "Pusat tahu jalan ke kedua gudang",
      detail: "Router pusat harus tahu jalan ke LAN Gudang A dan LAN Gudang B.",
      checks: [
        { type: "route", device: "r1", dst: "192.168.20.0/24", via: "10.0.1.2" },
        { type: "route", device: "r1", dst: "192.168.30.0/24", via: "10.0.2.2" },
      ],
    },
    {
      id: "otomatis",
      title: "Ketiga LAN mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Pusat, Gudang A, dan Gudang B menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama di tiap LAN harus mendapat alamat paling awal dari rentang IP-nya.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "ether2" },
        { type: "dhcp-server", device: "r2", iface: "ether2" },
        { type: "dhcp-server", device: "r3", iface: "ether2" },
        { type: "has-lease", device: "pcp" },
        { type: "iface-ip", device: "pcp", iface: "eth0", ip: "192.168.10.100/24" },
        { type: "dns", device: "pcp", server: "8.8.8.8" },
        { type: "has-lease", device: "pcga" },
        { type: "iface-ip", device: "pcga", iface: "eth0", ip: "192.168.20.100/24" },
        { type: "dns", device: "pcga", server: "8.8.8.8" },
        { type: "has-lease", device: "pcgb" },
        { type: "iface-ip", device: "pcgb", iface: "eth0", ip: "192.168.30.100/24" },
        { type: "dns", device: "pcgb", server: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua lokasi saling terhubung dan online",
      detail:
        "Seluruh komputer harus bisa menjangkau internet, dan komputer di kedua gudang harus bisa berkomunikasi dengan pusat dan satu sama lain.",
      checks: [
        { type: "ping", from: "pcp", to: "8.8.8.8" },
        { type: "ping", from: "pcga", to: "8.8.8.8" },
        { type: "ping", from: "pcgb", to: "8.8.8.8" },
        { type: "ping", from: "pcga", to: "192.168.10.100" },
        { type: "ping", from: "pcga", to: "192.168.30.100" },
        { type: "ping", from: "pcgb", to: "192.168.20.100" },
      ],
    },
  ],
};

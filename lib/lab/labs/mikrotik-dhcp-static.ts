import type { LabSpec } from "../types";

export const mikrotikDhcpStatic: LabSpec = {
  id: "mikrotik-dhcp-static",
  title: "DHCP Server & Static Route",
  vendor: "MikroTik",
  level: "Beginner",
  kind: "Simulasi",
  description: "Distribusi IP otomatis ke client dan routing antar dua segmen.",
  minutes: 45,
  intro:
    "Dua router menghubungkan dua segmen LAN. Client harus dapat IP otomatis, lalu kedua segmen harus saling berkomunikasi lewat static route.\n\n" +
    "Alamat yang dipakai:\n" +
    "R1 ether1 10.0.0.1/30 (ke R2), R1 ether2 192.168.10.1/24 (LAN PC1)\n" +
    "R2 ether1 10.0.0.2/30 (ke R1), R2 ether2 192.168.20.1/24 (LAN PC2)\n" +
    "Pool DHCP: .100 sampai .200 di masing-masing LAN.",
  devices: [
    { id: "pc1", kind: "pc", label: "PC1", x: 70, y: 140, ifaces: [{ name: "eth0" }] },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      x: 230,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R2",
      x: 410,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    { id: "pc2", kind: "pc", label: "PC2", x: 570, y: 140, ifaces: [{ name: "eth0" }] },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether1"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["pc2", "eth0"] },
  ],
  tasks: [
    {
      id: "ip",
      title: "Pasang IP address di kedua router",
      detail: "Atur IP link antar router dan IP gateway untuk tiap LAN.",
      hints: [
        "R1: /ip address add address=10.0.0.1/30 interface=ether1",
        "R1: /ip address add address=192.168.10.1/24 interface=ether2",
        "R2: /ip address add address=10.0.0.2/30 interface=ether1",
        "R2: /ip address add address=192.168.20.1/24 interface=ether2",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "10.0.0.1/30" },
        { type: "iface-ip", device: "r1", iface: "ether2", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r2", iface: "ether1", ip: "10.0.0.2/30" },
        { type: "iface-ip", device: "r2", iface: "ether2", ip: "192.168.20.1/24" },
      ],
    },
    {
      id: "dhcp",
      title: "Aktifkan DHCP server di kedua LAN",
      detail:
        "Buat pool, DHCP server, dan network di tiap router. Perhatikan: server yang baru dibuat berstatus disabled sampai diaktifkan.",
      hints: [
        "/ip pool add name=pool-lan ranges=192.168.10.100-192.168.10.200",
        "/ip dhcp-server add name=dhcp-lan interface=ether2 address-pool=pool-lan disabled=no",
        "/ip dhcp-server network add address=192.168.10.0/24 gateway=192.168.10.1 dns-server=8.8.8.8",
        "Ulangi di R2 dengan jaringan 192.168.20.x",
      ],
      checks: [
        { type: "dhcp-server", device: "r1", iface: "ether2" },
        { type: "dhcp-server", device: "r2", iface: "ether2" },
      ],
    },
    {
      id: "lease",
      title: "Minta IP otomatis di kedua PC",
      detail: "Jalankan DHCP client di PC1 dan PC2.",
      hints: ["Di terminal PC1 dan PC2 ketik: dhcp", "Lihat hasilnya dengan: show ip"],
      checks: [
        { type: "has-lease", device: "pc1" },
        { type: "has-lease", device: "pc2" },
      ],
    },
    {
      id: "routes",
      title: "Tambah static route di kedua arah",
      detail:
        "Tiap router perlu tahu jalan ke LAN di seberang. Tanpa route di salah satu sisi, ping hanya berjalan satu arah dan balasannya hilang.",
      hints: [
        "R1: /ip route add dst-address=192.168.20.0/24 gateway=10.0.0.2",
        "R2: /ip route add dst-address=192.168.10.0/24 gateway=10.0.0.1",
      ],
      checks: [
        { type: "route", device: "r1", dst: "192.168.20.0/24", via: "10.0.0.2" },
        { type: "route", device: "r2", dst: "192.168.10.0/24", via: "10.0.0.1" },
      ],
    },
    {
      id: "ping",
      title: "Uji koneksi antar segmen",
      detail: "PC1 harus bisa menjangkau gateway LAN2, begitu juga sebaliknya.",
      hints: ["PC1: ping 192.168.20.1", "PC2: ping 192.168.10.1"],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.20.1" },
        { type: "ping", from: "pc2", to: "192.168.10.1" },
      ],
    },
  ],
};
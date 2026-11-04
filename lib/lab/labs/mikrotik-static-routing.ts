import type { LabSpec } from "../types";

export const mikrotikStaticRouting: LabSpec = {
  id: "mikrotik-static-routing",
  title: "Static Routing 3 Router",
  vendor: "MikroTik",
  level: "Beginner",
  kind: "Simulasi",
  description:
    "Hubungkan dua LAN lewat tiga router dengan static route dan default route.",
  minutes: 40,
  intro:
    "Kantor pusat (LAN di belakang R1) dan kantor cabang (LAN di belakang R3) dihubungkan lewat R2 di tengah. Semua router masih kosong. PC1 dan PC2 sudah punya IP dan gateway, tugasmu membuat kedua PC saling terhubung.\n\n" +
    "Data link: Jaringan R1-R2 10.0.0.0/30, IP R1 10.0.0.1, IP R2 ke R1 10.0.0.2, Jaringan R2-R3 10.0.1.0/30, IP R2 ke R3 10.0.1.1, IP R3 10.0.1.2.\n\n" +
    "Data LAN: LAN pusat 192.168.10.0/24, Gateway R1 192.168.10.1, PC1 192.168.10.10, LAN cabang 192.168.30.0/24, Gateway R3 192.168.30.1, PC2 192.168.30.10.\n\n" +
    "Konsep: router hanya tahu jaringan yang menempel langsung padanya. Jaringan lain harus diberi tahu lewat route. R2 berada di tengah sehingga butuh route spesifik ke kedua LAN, sedangkan R1 dan R3 ada di ujung sehingga cukup memakai default route ke R2.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC1",
      x: 50,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      x: 185,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R2",
      x: 320,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "r3",
      kind: "mikrotik",
      label: "R3",
      x: 455,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC2",
      x: 590,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.30.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.30.1" }],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether1"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["r3", "ether1"] },
    { a: ["r3", "ether2"], b: ["pc2", "eth0"] },
  ],
  tasks: [
    {
      id: "ip-edge",
      title: "Pasang IP di R1 dan R3",
      detail:
        "Atur IP link ke R2 dan IP gateway LAN di router ujung. Setelah itu tiap PC harus bisa ping gateway-nya.",
      hints: [
        "R1: /ip address add address=10.0.0.1/30 interface=ether1",
        "R1: /ip address add address=192.168.10.1/24 interface=ether2",
        "R3: /ip address add address=10.0.1.2/30 interface=ether1",
        "R3: /ip address add address=192.168.30.1/24 interface=ether2",
        "Uji dari PC1: ping 192.168.10.1, dari PC2: ping 192.168.30.1",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "10.0.0.1/30" },
        { type: "iface-ip", device: "r1", iface: "ether2", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r3", iface: "ether1", ip: "10.0.1.2/30" },
        { type: "iface-ip", device: "r3", iface: "ether2", ip: "192.168.30.1/24" },
        { type: "ping", from: "pc1", to: "192.168.10.1" },
        { type: "ping", from: "pc2", to: "192.168.30.1" },
      ],
    },
    {
      id: "ip-core",
      title: "Pasang IP di R2 dan uji tetangga",
      detail:
        "R2 punya dua link: ke R1 dan ke R3. Setelah IP terpasang, setiap router harus bisa ping tetangga yang langsung terhubung. Ping ke router yang lebih jauh belum akan berhasil.",
      hints: [
        "R2: /ip address add address=10.0.0.2/30 interface=ether1",
        "R2: /ip address add address=10.0.1.1/30 interface=ether2",
        "R1: /ping 10.0.0.2",
        "R3: /ping 10.0.1.1",
      ],
      checks: [
        { type: "iface-ip", device: "r2", iface: "ether1", ip: "10.0.0.2/30" },
        { type: "iface-ip", device: "r2", iface: "ether2", ip: "10.0.1.1/30" },
        { type: "ping", from: "r1", to: "10.0.0.2" },
        { type: "ping", from: "r2", to: "10.0.0.1" },
        { type: "ping", from: "r2", to: "10.0.1.2" },
        { type: "ping", from: "r3", to: "10.0.1.1" },
      ],
    },
    {
      id: "r2-routes",
      title: "Tambah static route di R2",
      detail:
        "R2 perlu tahu jalan ke kedua LAN: LAN pusat lewat R1, LAN cabang lewat R3. Gateway sebuah route harus berupa IP tetangga yang terhubung langsung.",
      hints: [
        "R2: /ip route add dst-address=192.168.10.0/24 gateway=10.0.0.1",
        "R2: /ip route add dst-address=192.168.30.0/24 gateway=10.0.1.2",
        "Periksa: /ip route print (route yang aktif ditandai huruf A)",
      ],
      checks: [
        { type: "route", device: "r2", dst: "192.168.10.0/24", via: "10.0.0.1" },
        { type: "route", device: "r2", dst: "192.168.30.0/24", via: "10.0.1.2" },
      ],
    },
    {
      id: "default",
      title: "Pasang default route di R1 dan R3",
      detail:
        "Router ujung hanya punya satu jalan keluar: R2. Daripada mendaftar semua jaringan, pakai default route 0.0.0.0/0 yang berarti \"semua yang tidak saya kenal, kirim ke sana\".",
      hints: [
        "R1: /ip route add dst-address=0.0.0.0/0 gateway=10.0.0.2",
        "R3: /ip route add dst-address=0.0.0.0/0 gateway=10.0.1.1",
        "Uji: R1 /ping 192.168.30.1 (jaringan di balik R2 dan R3)",
      ],
      checks: [
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "10.0.0.2" },
        { type: "route", device: "r3", dst: "0.0.0.0/0", via: "10.0.1.1" },
        { type: "ping", from: "r1", to: "192.168.30.1" },
        { type: "ping", from: "r3", to: "192.168.10.1" },
      ],
    },
    {
      id: "e2e",
      title: "Uji koneksi PC ke PC",
      detail:
        "Kedua LAN sekarang harus saling terjangkau. Kalau gagal, perhatikan animasi ping di topologi: lihat di router mana paket berhenti, lalu periksa tabel routing router itu.",
      hints: ["PC1: ping 192.168.30.10", "PC2: ping 192.168.10.10"],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.30.10" },
        { type: "ping", from: "pc2", to: "192.168.10.10" },
      ],
    },
  ],
};
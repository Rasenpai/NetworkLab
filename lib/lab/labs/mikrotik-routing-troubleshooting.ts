import type { LabSpec } from "../types";

export const mikrotikRoutingTroubleshooting: LabSpec = {
  id: "mikrotik-routing-troubleshooting",
  title: "Troubleshooting Routing 4 Router",
  vendor: "MikroTik",
  level: "Advanced",
  kind: "Simulasi",
  description:
    "Telusuri routing loop, next-hop salah, link mati, dan route balik yang hilang di jaringan 4 router.",
  minutes: 75,
  intro:
    "Tiket masuk: \"PC-B di LAN-B tidak bisa ke LAN-A maupun internet, dan dari R2 ping ke LAN-B malah muter-muter.\" Jaringan terdiri dari empat router berantai (R1, R2, R3, R4), R2 terhubung ke ISP, LAN-A di belakang R1 dan LAN-B di belakang R4. Semua IP sudah terpasang, tetapi routing peninggalan teknisi lama penuh kesalahan.\n\n" +
    "Data jaringan: Link R1-R2 10.0.12.0/30, Link R2-R3 10.0.23.0/30, Link R3-R4 10.0.34.0/30, WAN R2 203.0.113.2/30, IP ISP 203.0.113.1.\n\nPada tiap link, router di sisi kiri memakai alamat .1 dan router di sisi kanan memakai alamat .2, misalnya R1 10.0.12.1 dan R2 10.0.12.2, lalu R2 10.0.23.1 dan R3 10.0.23.2.\n\n" +
    "Data LAN: LAN-A 192.168.10.0/24, Gateway R1 192.168.10.1, PC-A 192.168.10.10, LAN-B 192.168.40.0/24, Gateway R4 192.168.40.1, PC-B 192.168.40.10.\n\n" +
    "Rancangan yang benar: R1, R3, dan R4 memakai default route ke router di sisi R2. R2 punya route spesifik ke LAN-A (lewat R1) dan LAN-B (lewat R3), serta default route ke ISP. R3 butuh route spesifik ke LAN-B (lewat R4) karena default route-nya mengarah kembali ke R2.\n\n" +
    "Metode kerja: ping dari PC ke tujuan, perhatikan di router mana animasi berhenti dan apa alasannya (tidak ada route, tidak ada jawaban hop berikutnya, atau routing loop), lalu periksa /ip route print di router itu. Hati-hati: route yang salah akan tetap dipakai walau kamu menambah route yang benar, jadi hapus dulu yang keliru.\n\n" +
    "Catatan simulator: ping dari router memakai IP interface keluar sebagai sumber, sedangkan jaringan link (10.0.x.x) tidak diiklankan ke semua router. Uji ujung-ke-ujung dari PC atau ke IP LAN.",
  devices: [
    {
      id: "pca",
      kind: "pc",
      label: "PC-A",
      x: 40,
      y: 150,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      hostname: "R1",
      x: 170,
      y: 150,
      ifaces: [
        { name: "ether1", ip: "10.0.12.1/30" },
        { name: "ether2", ip: "192.168.10.1/24" },
      ],
      routes: [{ dst: "0.0.0.0/0", via: "10.0.12.2" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R2",
      hostname: "R2",
      x: 320,
      y: 150,
      ifaces: [
        { name: "ether1", ip: "10.0.12.2/30" },
        { name: "ether2", ip: "10.0.23.1/30" },
        { name: "ether3", ip: "203.0.113.2/30" },
      ],
      routes: [
        { dst: "0.0.0.0/0", via: "203.0.113.1" },
        // Kesalahan: LAN-A seharusnya lewat R1 (10.0.12.1), bukan R3.
        { dst: "192.168.10.0/24", via: "10.0.23.2" },
        { dst: "192.168.40.0/24", via: "10.0.23.2" },
      ],
    },
    {
      id: "r3",
      kind: "mikrotik",
      label: "R3",
      hostname: "R3",
      x: 470,
      y: 150,
      ifaces: [
        { name: "ether1", ip: "10.0.23.2/30" },
        // Kesalahan: link ke R4 dimatikan.
        { name: "ether2", ip: "10.0.34.1/30", adminDown: true },
      ],
      // Kesalahan: tidak ada route ke LAN-B, hanya default route balik ke R2.
      routes: [{ dst: "0.0.0.0/0", via: "10.0.23.1" }],
    },
    {
      id: "r4",
      kind: "mikrotik",
      label: "R4",
      hostname: "R4",
      x: 620,
      y: 150,
      ifaces: [
        { name: "ether1", ip: "10.0.34.2/30" },
        { name: "ether2", ip: "192.168.40.1/24" },
      ],
      // Kesalahan: gateway salah ketik (10.0.34.5, seharusnya 10.0.34.1).
      routes: [{ dst: "0.0.0.0/0", via: "10.0.34.5" }],
    },
    {
      id: "pcb",
      kind: "pc",
      label: "PC-B",
      x: 620,
      y: 290,
      ifaces: [{ name: "eth0", ip: "192.168.40.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.40.1" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 320,
      y: 20,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pca", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether1"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["r3", "ether1"] },
    { a: ["r3", "ether2"], b: ["r4", "ether1"] },
    { a: ["r4", "ether2"], b: ["pcb", "eth0"] },
    { a: ["r2", "ether3"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "link",
      title: "Hidupkan link R3-R4",
      detail:
        "R3 dan R4 tidak saling melihat padahal kabelnya tersambung. Periksa status interface di R3: tanda X berarti interface dimatikan.",
      hints: [
        "R3: /interface print (cari flag X)",
        "R3: /interface enable ether2",
        "R3: /ping 10.0.34.2",
      ],
      checks: [
        { type: "iface-up", device: "r3", iface: "ether2" },
        { type: "ping", from: "r3", to: "10.0.34.2" },
        { type: "ping", from: "r4", to: "10.0.34.1" },
      ],
    },
    {
      id: "loop-a",
      title: "Perbaiki routing loop ke LAN-A",
      detail:
        "Dari R3, ping ke LAN-A (192.168.10.1) berputar-putar: R3 mengirim ke R2 lewat default route, tetapi R2 mengembalikannya ke R3. Periksa route ke LAN-A di R2 dan arahkan ke R1. Hapus route yang salah, jangan hanya menambah yang baru.",
      hints: [
        "R3: /ping 192.168.10.1 (lihat animasi: routing loop)",
        "R2: /ip route print (route ke 192.168.10.0/24 menunjuk 10.0.23.2, yaitu R3)",
        "R2: /ip route remove 1",
        "R2: /ip route add dst-address=192.168.10.0/24 gateway=10.0.12.1",
      ],
      checks: [
        { type: "route", device: "r2", dst: "192.168.10.0/24", via: "10.0.12.1" },
        { type: "ping", from: "r3", to: "192.168.10.1" },
      ],
    },
    {
      id: "loop-b",
      title: "Perbaiki routing loop ke LAN-B",
      detail:
        "Dari R2, ping ke LAN-B (192.168.40.1) juga berputar: R2 meneruskan ke R3, R3 tidak punya route spesifik ke LAN-B sehingga default route-nya mengirim balik ke R2. Tambahkan route LAN-B di R3 lewat R4.",
      hints: [
        "R3: /ip route print (hanya ada default route ke R2)",
        "R3: /ip route add dst-address=192.168.40.0/24 gateway=10.0.34.2",
        "R3: /ping 192.168.40.1",
      ],
      checks: [
        { type: "route", device: "r3", dst: "192.168.40.0/24", via: "10.0.34.2" },
        { type: "ping", from: "r3", to: "192.168.40.1" },
      ],
    },
    {
      id: "gateway",
      title: "Benahi default route R4",
      detail:
        "LAN-B sudah dijangkau dari tengah, tetapi PC-B tidak bisa keluar dan balasan ke PC-B tidak sampai. Periksa gateway default route di R4: apakah itu IP R3 yang benar di link mereka?",
      hints: [
        "R4: /ip route print (gateway 10.0.34.5 bukan tetangga R4, route tidak aktif)",
        "R4: /ip route remove 0",
        "R4: /ip route add dst-address=0.0.0.0/0 gateway=10.0.34.1",
        "PC-B: ping 192.168.10.10",
      ],
      checks: [
        { type: "route", device: "r4", dst: "0.0.0.0/0", via: "10.0.34.1" },
        { type: "ping", from: "pcb", to: "192.168.10.10" },
        { type: "ping", from: "pca", to: "192.168.40.10" },
      ],
    },
    {
      id: "nat",
      title: "Aktifkan NAT di R2 untuk internet",
      detail:
        "Jaringan internal sudah tersambung ujung ke ujung, tetapi kedua LAN masih timeout ke internet karena ISP tidak punya route balik ke IP privat. Pasang masquerade di interface WAN R2, lalu uji dari kedua PC.",
      hints: [
        "R2: /ip firewall nat add chain=srcnat out-interface=ether3 action=masquerade",
        "PC-A dan PC-B: ping 8.8.8.8",
        "Masih gagal dari PC-B? Telusuri jalur pulang: R2 harus punya route ke LAN-B (lewat R3) dan R3 ke LAN-B (lewat R4)",
      ],
      checks: [
        { type: "nat-masq", device: "r2", iface: "ether3" },
        { type: "ping", from: "pca", to: "8.8.8.8" },
        { type: "ping", from: "pcb", to: "8.8.8.8" },
      ],
    },
  ],
};
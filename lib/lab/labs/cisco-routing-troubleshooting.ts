import type { LabSpec } from "../types";

export const ciscoRoutingTroubleshooting: LabSpec = {
  id: "cisco-routing-troubleshooting",
  title: "Troubleshooting Routing 3 Router Cisco",
  vendor: "Cisco",
  level: "Advanced",
  kind: "Simulasi",
  description:
    "Telusuri interface mati, IP salah, next-hop salah, dan route balik yang hilang di jaringan 3 router.",
  minutes: 60,
  intro:
    "Jaringan tiga router Cisco ini seharusnya menghubungkan LAN A dan LAN B, tetapi kedua PC tidak bisa saling berkomunikasi. Konfigurasi sudah terpasang oleh teknisi sebelumnya, namun ada beberapa gangguan di dalamnya. Tugasmu menemukan dan memperbaikinya sampai jaringan berjalan.\n\n" +
    "Data LAN A: Jaringan 192.168.1.0/24, Gateway R1 192.168.1.1 (GigabitEthernet0/0), PC-A 192.168.1.10/24.\n\n" +
    "Data LAN B: Jaringan 192.168.3.0/24, Gateway R3 192.168.3.1 (GigabitEthernet0/1), PC-B 192.168.3.10/24.\n\n" +
    "Data link R1-R2: Jaringan 10.0.12.0/30, R1 10.0.12.1 (GigabitEthernet0/1), R2 10.0.12.2 (GigabitEthernet0/0).\n\n" +
    "Data link R2-R3: Jaringan 10.0.23.0/30, R2 10.0.23.1 (GigabitEthernet0/1), R3 10.0.23.2 (GigabitEthernet0/0).\n\n" +
    "Ketentuan: pakai static route, dan jangan mengubah data alamat di atas. Gangguan bisa lebih dari satu dan berlapis, jadi periksa dari link ke link.",
  devices: [
    {
      id: "pca",
      kind: "pc",
      label: "PC-A",
      x: 50,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.1.10/24" }],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "R1",
      hostname: "R1",
      x: 200,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", ip: "192.168.1.1/24" },
        // Gangguan: interface masih dalam keadaan shutdown.
        { name: "GigabitEthernet0/1", ip: "10.0.12.1/30", adminDown: true },
      ],
      // Gangguan: next-hop salah (seharusnya 10.0.12.2).
      routes: [{ dst: "192.168.3.0/24", via: "10.0.12.5" }],
    },
    {
      id: "r2",
      kind: "cisco",
      role: "router",
      label: "R2",
      hostname: "R2",
      x: 340,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", ip: "10.0.12.2/30" },
        // Gangguan: IP salah (seharusnya 10.0.23.1/30).
        { name: "GigabitEthernet0/1", ip: "10.0.23.5/30" },
      ],
      routes: [
        { dst: "192.168.1.0/24", via: "10.0.12.1" },
        { dst: "192.168.3.0/24", via: "10.0.23.2" },
      ],
    },
    {
      id: "r3",
      kind: "cisco",
      role: "router",
      label: "R3",
      hostname: "R3",
      x: 480,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", ip: "10.0.23.2/30" },
        { name: "GigabitEthernet0/1", ip: "192.168.3.1/24" },
      ],
      // Gangguan: tidak ada route balik ke LAN A.
    },
    {
      id: "pcb",
      kind: "pc",
      label: "PC-B",
      x: 590,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.3.10/24" }],
    },
  ],
  links: [
    { a: ["pca", "eth0"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["r2", "GigabitEthernet0/0"] },
    { a: ["r2", "GigabitEthernet0/1"], b: ["r3", "GigabitEthernet0/0"] },
    { a: ["r3", "GigabitEthernet0/1"], b: ["pcb", "eth0"] },
  ],
  tasks: [
    {
      id: "link",
      title: "Semua link antar router berfungsi",
      detail:
        "Setiap router harus bisa melakukan ping ke router di sebelahnya.",
      hints: [
        "Mulai dari show ip interface brief di tiap router untuk melihat status dan IP.",
        "Bandingkan IP tiap sisi link dengan data. Dua sisi harus berada di jaringan /30 yang sama.",
      ],
      checks: [
        { type: "ping", from: "r1", to: "10.0.12.2" },
        { type: "ping", from: "r2", to: "10.0.23.2" },
      ],
    },
    {
      id: "route",
      title: "Routing statis lengkap dan benar",
      detail:
        "R1 harus tahu jalan ke LAN B lewat R2, dan R3 harus tahu jalan kembali ke LAN A lewat R2.",
      hints: [
        "Periksa show ip route di setiap router, terutama next-hop tiap route.",
        "Next-hop harus berada di jaringan link yang terhubung langsung ke router tersebut.",
        "Jika ada route yang salah, hapus dulu dengan no ip route sebelum membuat yang benar.",
      ],
      checks: [
        { type: "route", device: "r1", dst: "192.168.3.0/24", via: "10.0.12.2" },
        { type: "route", device: "r3", dst: "192.168.1.0/24", via: "10.0.23.1" },
      ],
    },
    {
      id: "online",
      title: "PC-A dan PC-B saling terhubung",
      detail: "Kedua PC harus bisa saling ping dari kedua arah.",
      hints: [
        "Jika satu arah berhasil dan arah sebaliknya gagal, curigai route balik.",
        "Telusuri hop demi hop dengan ping dari tiap router ke tujuan berikutnya.",
      ],
      checks: [
        { type: "ping", from: "pca", to: "192.168.3.10" },
        { type: "ping", from: "pcb", to: "192.168.1.10" },
      ],
    },
  ],
};
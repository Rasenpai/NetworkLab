import type { LabSpec } from "../types";

export const ciscoStaticRouting: LabSpec = {
  id: "cisco-static-routing",
  title: "Static Routing 2 Router Cisco",
  vendor: "Cisco",
  level: "Beginner",
  kind: "Simulasi",
  description:
    "Hubungkan dua LAN lewat dua router dengan static route dan default route.",
  minutes: 40,
  intro:
    "Dua LAN berada di belakang dua router Cisco yang saling terhubung lewat satu link point-to-point. Saat ini belum ada router yang tahu cara menjangkau LAN di seberangnya. Tugasmu mengaktifkan interface dan membuat routing statis sampai kedua PC bisa saling berkomunikasi.\n\n" +
    "Data LAN A: Jaringan 192.168.1.0/24, Gateway R1 192.168.1.1, PC-A 192.168.1.10/24 (sudah terpasang).\n\n" +
    "Data LAN B: Jaringan 192.168.2.0/24, Gateway R2 192.168.2.1, PC-B 192.168.2.10/24 (sudah terpasang).\n\n" +
    "Data link antar router: Jaringan 10.0.0.0/30, R1 10.0.0.1, R2 10.0.0.2.\n\n" +
    "Data port: GigabitEthernet0/0 ke LAN, GigabitEthernet0/1 ke link antar router.\n\n" +
    "Ketentuan: R1 memakai static route ke LAN B, sedangkan R2 cukup memakai default route lewat R1.",
  devices: [
    {
      id: "pca",
      kind: "pc",
      label: "PC-A",
      x: 70,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.1.10/24" }],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "R1",
      hostname: "R1",
      x: 240,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
      ],
    },
    {
      id: "r2",
      kind: "cisco",
      role: "router",
      label: "R2",
      hostname: "R2",
      x: 420,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
      ],
    },
    {
      id: "pcb",
      kind: "pc",
      label: "PC-B",
      x: 580,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.2.10/24" }],
    },
  ],
  links: [
    { a: ["pca", "eth0"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["r2", "GigabitEthernet0/1"] },
    { a: ["r2", "GigabitEthernet0/0"], b: ["pcb", "eth0"] },
  ],
  tasks: [
    {
      id: "interface",
      title: "Semua interface router aktif dan ber-IP",
      detail:
        "Pasang IP sesuai data pada keempat interface router, lalu nyalakan semuanya.",
      hints: [
        "Interface Cisco mati secara default, jadi jangan lupa no shutdown.",
        "Link antar router memakai /30, netmask-nya 255.255.255.252.",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.1.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "10.0.0.1/30" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/1", ip: "10.0.0.2/30" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/0", ip: "192.168.2.1/24" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/0" },
      ],
    },
    {
      id: "route-r1",
      title: "R1 tahu jalan ke LAN B",
      detail:
        "Buat static route di R1 menuju 192.168.2.0/24 lewat R2 (10.0.0.2).",
      hints: [
        "Format: ip route <jaringan> <netmask> <next-hop>.",
        "Next-hop adalah IP R2 di link antar router.",
      ],
      checks: [
        { type: "route", device: "r1", dst: "192.168.2.0/24", via: "10.0.0.2" },
      ],
    },
    {
      id: "route-r2",
      title: "R2 punya default route",
      detail:
        "Buat default route di R2 lewat R1 (10.0.0.1) agar R2 bisa membalas ke LAN A.",
      hints: [
        "Default route memakai tujuan 0.0.0.0 dengan netmask 0.0.0.0.",
      ],
      checks: [
        { type: "route", device: "r2", dst: "0.0.0.0/0", via: "10.0.0.1" },
      ],
    },
    {
      id: "konektivitas",
      title: "PC-A dan PC-B saling terhubung",
      detail: "Kedua PC harus bisa saling ping.",
      hints: [
        "Uji dari kedua arah: PC-A ke PC-B dan PC-B ke PC-A.",
        "Jika hanya satu arah yang berhasil, periksa route balik.",
      ],
      checks: [
        { type: "ping", from: "pca", to: "192.168.2.10" },
        { type: "ping", from: "pcb", to: "192.168.1.10" },
      ],
    },
  ],
};
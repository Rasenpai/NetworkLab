import type { LabSpec } from "../types";

const FA = (n: number) => `FastEthernet0/${n}`;

export const ciscoVlan: LabSpec = {
  id: "cisco-vlan",
  title: "VLAN & Inter-VLAN Routing",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Simulasi",
  description: "Buat VLAN, trunk, dan router-on-a-stick.",
  minutes: 60,
  intro:
    "Satu switch (SW1) melayani dua kelompok: SISWA (VLAN 10) dan GURU (VLAN 20). Switch terhubung ke router R1 lewat satu kabel (router-on-a-stick). Konfigurasikan VLAN, trunk, dan sub-interface sampai antar-VLAN bisa saling ping.\n\n" +
    "Data VLAN: VLAN 10 SISWA, VLAN 20 GURU, Gateway VLAN10 192.168.10.1, Gateway VLAN20 192.168.20.1.\n\n" +
    "Data host: PC1 192.168.10.11/24, PC2 192.168.20.11/24, PC3 192.168.10.12/24.\n\n" +
    "Port SW1: Fa0/1 ke R1 (trunk), Fa0/2 ke PC1, Fa0/3 ke PC2, Fa0/4 ke PC3. Port R1: Gi0/0 mati di awal. Semua PC sudah dikonfigurasi.",
  devices: [
    {
      id: "r1",
      kind: "cisco",
      label: "R1",
      hostname: "Router",
      x: 70,
      y: 140,
      ifaces: [{ name: "GigabitEthernet0/0", adminDown: true }],
    },
    {
      id: "sw1",
      kind: "cisco",
      role: "switch",
      label: "SW1",
      hostname: "Switch",
      x: 260,
      y: 140,
      ifaces: [FA(1), FA(2), FA(3), FA(4)].map((name) => ({ name })),
    },
    {
      id: "pc1",
      kind: "pc",
      label: "PC1",
      x: 470,
      y: 40,
      ifaces: [{ name: "eth0", ip: "192.168.10.11/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC2",
      x: 470,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.20.11/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.20.1" }],
    },
    {
      id: "pc3",
      kind: "pc",
      label: "PC3",
      x: 470,
      y: 240,
      ifaces: [{ name: "eth0", ip: "192.168.10.12/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
  ],
  links: [
    { a: ["r1", "GigabitEthernet0/0"], b: ["sw1", FA(1)] },
    { a: ["sw1", FA(2)], b: ["pc1", "eth0"] },
    { a: ["sw1", FA(3)], b: ["pc2", "eth0"] },
    { a: ["sw1", FA(4)], b: ["pc3", "eth0"] },
  ],
  tasks: [
    {
      id: "vlan",
      title: "Buat VLAN di SW1",
      detail: "Beri nama switch SW1, lalu buat VLAN 10 bernama SISWA dan VLAN 20 bernama GURU.",
      hints: [
        "enable → configure terminal → hostname SW1",
        "vlan 10 → name SISWA → exit",
        "vlan 20 → name GURU → exit",
        "Periksa dengan: show vlan brief",
      ],
      checks: [
        { type: "hostname", device: "sw1", equals: "SW1" },
        { type: "vlan", device: "sw1", id: 10, name: "SISWA" },
        { type: "vlan", device: "sw1", id: 20, name: "GURU" },
      ],
    },
    {
      id: "access",
      title: "Masukkan port PC ke VLAN-nya",
      detail:
        "PC1 dan PC3 ke VLAN 10, PC2 ke VLAN 20. Port yang tersambung ke PC harus mode access.",
      hints: [
        "interface f0/2 → switchport mode access → switchport access vlan 10",
        "interface f0/3 → switchport mode access → switchport access vlan 20",
        "interface f0/4 → switchport mode access → switchport access vlan 10",
        "Periksa dengan: show vlan brief",
      ],
      checks: [
        { type: "access-port", device: "sw1", iface: FA(2), vlan: 10 },
        { type: "access-port", device: "sw1", iface: FA(3), vlan: 20 },
        { type: "access-port", device: "sw1", iface: FA(4), vlan: 10 },
      ],
    },
    {
      id: "trunk",
      title: "Jadikan Fa0/1 trunk ke router",
      detail:
        "Satu kabel ke router harus membawa VLAN 10 dan 20 sekaligus, jadi port ini mode trunk.",
      hints: [
        "interface f0/1 → switchport mode trunk",
        "Periksa dengan: show interfaces trunk",
      ],
      checks: [
        { type: "trunk-port", device: "sw1", iface: FA(1), vlans: [10, 20] },
      ],
    },
    {
      id: "subif",
      title: "Buat sub-interface di R1",
      detail:
        "Aktifkan Gi0/0, lalu buat satu sub-interface per VLAN. Sub-interface menjadi gateway masing-masing VLAN.",
      hints: [
        "hostname R1",
        "interface g0/0 → no shutdown",
        "interface g0/0.10 → encapsulation dot1q 10 → ip address 192.168.10.1 255.255.255.0",
        "interface g0/0.20 → encapsulation dot1q 20 → ip address 192.168.20.1 255.255.255.0",
        "Periksa dengan: show ip interface brief",
      ],
      checks: [
        { type: "hostname", device: "r1", equals: "R1" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.10", vlan: 10 },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.10", ip: "192.168.10.1/24" },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.20", vlan: 20 },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.20", ip: "192.168.20.1/24" },
      ],
    },
    {
      id: "ping",
      title: "Uji konektivitas",
      detail:
        "Satu VLAN saling terhubung langsung lewat switch. Beda VLAN harus lewat gateway di R1.",
      hints: [
        "PC1: ping 192.168.10.12 (satu VLAN, tidak lewat router)",
        "PC1: ping 192.168.20.11 (beda VLAN, lewat R1)",
        "Gagal? Cek show vlan brief dan show interfaces trunk di SW1",
      ],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.10.12" },
        { type: "ping", from: "pc1", to: "192.168.20.11" },
        { type: "ping", from: "pc2", to: "192.168.10.11" },
        { type: "ping", from: "pc3", to: "192.168.20.11" },
      ],
    },
  ],
};
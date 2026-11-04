import type { DeviceSpec, LabSpec } from "../types";

const router = (
  id: string,
  label: string,
  x: number,
  y: number,
  ports: string[]
): DeviceSpec => ({
  id,
  kind: "cisco",
  label,
  hostname: "Router",
  x,
  y,
  ifaces: ports.map((name) => ({ name, adminDown: true })),
});

const pc = (
  id: string,
  label: string,
  x: number,
  ip: string,
  gw: string
): DeviceSpec => ({
  id,
  kind: "pc",
  label,
  x,
  y: 220,
  ifaces: [{ name: "eth0", ip }],
  routes: [{ dst: "0.0.0.0/0", via: gw }],
});

const G = (n: string) => `GigabitEthernet${n}`;

export const ciscoOspf: LabSpec = {
  id: "cisco-ospf",
  title: "OSPF Multi-Router",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Simulasi",
  description: "Bangun adjacency OSPF dan verifikasi tabel routing.",
  minutes: 75,
  intro:
    "Tiga router dihubungkan berantai dan tiap router punya satu LAN. Konfigurasikan interface, aktifkan OSPF di area 0, lalu pastikan semua PC saling terhubung.\n\n" +
    "R1: Gi0/0 10.0.12.1/24 (ke R2), Gi0/1 192.168.1.1/24 (PC1)\n" +
    "R2: Gi0/0 10.0.12.2/24 (ke R1), Gi0/1 10.0.23.2/24 (ke R3), Gi0/2 192.168.2.1/24 (PC2)\n" +
    "R3: Gi0/0 10.0.23.3/24 (ke R2), Gi0/1 192.168.3.1/24 (PC3)\n" +
    "Semua interface router mati di awal, dan PC sudah dikonfigurasi.",
  devices: [
    router("r1", "R1", 130, 70, [G("0/0"), G("0/1")]),
    router("r2", "R2", 320, 70, [G("0/0"), G("0/1"), G("0/2")]),
    router("r3", "R3", 510, 70, [G("0/0"), G("0/1")]),
    pc("pc1", "PC1", 130, "192.168.1.10/24", "192.168.1.1"),
    pc("pc2", "PC2", 320, "192.168.2.10/24", "192.168.2.1"),
    pc("pc3", "PC3", 510, "192.168.3.10/24", "192.168.3.1"),
  ],
  links: [
    { a: ["r1", G("0/0")], b: ["r2", G("0/0")] },
    { a: ["r2", G("0/1")], b: ["r3", G("0/0")] },
    { a: ["pc1", "eth0"], b: ["r1", G("0/1")] },
    { a: ["pc2", "eth0"], b: ["r2", G("0/2")] },
    { a: ["pc3", "eth0"], b: ["r3", G("0/1")] },
  ],
  tasks: [
    {
      id: "r1-if",
      title: "Konfigurasi interface R1",
      detail: "Beri nama R1, pasang IP, dan aktifkan kedua interface.",
      hints: [
        "enable → configure terminal → hostname R1",
        "interface g0/0 → ip address 10.0.12.1 255.255.255.0 → no shutdown",
        "interface g0/1 → ip address 192.168.1.1 255.255.255.0 → no shutdown",
        "Periksa dengan: show ip interface brief",
      ],
      checks: [
        { type: "hostname", device: "r1", equals: "R1" },
        { type: "iface-ip", device: "r1", iface: G("0/0"), ip: "10.0.12.1/24" },
        { type: "iface-ip", device: "r1", iface: G("0/1"), ip: "192.168.1.1/24" },
        { type: "iface-up", device: "r1", iface: G("0/0") },
        { type: "iface-up", device: "r1", iface: G("0/1") },
      ],
    },
    {
      id: "r2-if",
      title: "Konfigurasi interface R2",
      detail: "R2 punya tiga interface: ke R1, ke R3, dan ke LAN PC2.",
      hints: [
        "hostname R2",
        "g0/0 10.0.12.2/24, g0/1 10.0.23.2/24, g0/2 192.168.2.1/24",
        "Jangan lupa no shutdown di setiap interface",
      ],
      checks: [
        { type: "hostname", device: "r2", equals: "R2" },
        { type: "iface-ip", device: "r2", iface: G("0/0"), ip: "10.0.12.2/24" },
        { type: "iface-ip", device: "r2", iface: G("0/1"), ip: "10.0.23.2/24" },
        { type: "iface-ip", device: "r2", iface: G("0/2"), ip: "192.168.2.1/24" },
        { type: "iface-up", device: "r2", iface: G("0/0") },
        { type: "iface-up", device: "r2", iface: G("0/1") },
        { type: "iface-up", device: "r2", iface: G("0/2") },
      ],
    },
    {
      id: "r3-if",
      title: "Konfigurasi interface R3",
      detail: "Beri nama R3, pasang IP, dan aktifkan interface.",
      hints: ["hostname R3", "g0/0 10.0.23.3/24, g0/1 192.168.3.1/24, lalu no shutdown"],
      checks: [
        { type: "hostname", device: "r3", equals: "R3" },
        { type: "iface-ip", device: "r3", iface: G("0/0"), ip: "10.0.23.3/24" },
        { type: "iface-ip", device: "r3", iface: G("0/1"), ip: "192.168.3.1/24" },
        { type: "iface-up", device: "r3", iface: G("0/0") },
        { type: "iface-up", device: "r3", iface: G("0/1") },
      ],
    },
    {
      id: "ospf",
      title: "Aktifkan OSPF area 0",
      detail:
        "Umumkan semua jaringan yang terhubung langsung di setiap router. Hasilnya, tiap router punya neighbor.",
      hints: [
        "router ospf 1",
        "network 10.0.12.0 0.0.0.255 area 0",
        "network 192.168.1.0 0.0.0.255 area 0",
        "Ulangi di R2 dan R3 untuk jaringan masing-masing, lalu cek: show ip ospf neighbor",
      ],
      checks: [
        { type: "ospf-neighbors", device: "r1", min: 1 },
        { type: "ospf-neighbors", device: "r2", min: 2 },
        { type: "ospf-neighbors", device: "r3", min: 1 },
      ],
    },
    {
      id: "routes",
      title: "Verifikasi tabel routing",
      detail: "Pastikan LAN di ujung lain dipelajari lewat OSPF (kode O di show ip route).",
      hints: ["show ip route", "Cari baris berawalan O"],
      checks: [
        { type: "ospf-route", device: "r1", dst: "192.168.3.0/24" },
        { type: "ospf-route", device: "r2", dst: "192.168.1.0/24" },
        { type: "ospf-route", device: "r2", dst: "192.168.3.0/24" },
        { type: "ospf-route", device: "r3", dst: "192.168.1.0/24" },
      ],
    },
    {
      id: "e2e",
      title: "Uji end-to-end",
      detail: "PC di ujung kiri dan kanan harus saling menjangkau.",
      hints: ["PC1: ping 192.168.3.10", "PC3: ping 192.168.1.10"],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.3.10" },
        { type: "ping", from: "pc3", to: "192.168.1.10" },
      ],
    },
  ],
};
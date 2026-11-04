import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const ciscoKampus: LabSpec = {
  id: "cisco-kampus",
  title: "Kampus Tiga Gedung",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Studi Kasus",
  description:
    "Hubungkan tiga gedung kampus yang saling terkoneksi dengan OSPF, tanpa satu pun static route.",
  minutes: 70,
  intro:
    "Akademi Teknik Nusantara memiliki tiga gedung yang saling dihubungkan dengan kabel langsung sehingga membentuk segitiga. Tiap gedung punya satu router Cisco dan satu LAN. Pengelola ingin jaringan ini tetap berjalan saat gedung bertambah atau satu link bermasalah, jadi routing tidak boleh diatur manual. Kamu ditugaskan menyiapkan ketiga router sampai seluruh gedung saling terhubung.\n\n" +
    "Kebutuhan pengelola: komputer di ketiga gedung harus bisa saling berkomunikasi, dan semua rute antar gedung dipelajari secara dinamis dengan OSPF. Static route tidak boleh dipakai.\n\n" +
    "Data nama router: R-GedungA, R-GedungB, dan R-GedungC.\n\n" +
    "Data port tiap router: GigabitEthernet0/0 LAN gedung. R-GedungA: GigabitEthernet0/1 ke Gedung B, GigabitEthernet0/2 ke Gedung C. R-GedungB: GigabitEthernet0/1 ke Gedung A, GigabitEthernet0/2 ke Gedung C. R-GedungC: GigabitEthernet0/1 ke Gedung A, GigabitEthernet0/2 ke Gedung B.\n\n" +
    "Data link A-B: Jaringan 10.0.12.0/30, Gedung A 10.0.12.1, Gedung B 10.0.12.2.\n\n" +
    "Data link B-C: Jaringan 10.0.23.0/30, Gedung B 10.0.23.1, Gedung C 10.0.23.2.\n\n" +
    "Data link A-C: Jaringan 10.0.13.0/30, Gedung A 10.0.13.1, Gedung C 10.0.13.2.\n\n" +
    "Data LAN Gedung A: Jaringan 192.168.1.0/24, Gateway 192.168.1.1, PC-A 192.168.1.10/24 (sudah terpasang).\n\n" +
    "Data LAN Gedung B: Jaringan 192.168.2.0/24, Gateway 192.168.2.1, PC-B 192.168.2.10/24 (sudah terpasang).\n\n" +
    "Data LAN Gedung C: Jaringan 192.168.3.0/24, Gateway 192.168.3.1, PC-C 192.168.3.10/24 (sudah terpasang).\n\n" +
    "Catatan: interface Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    { id: "pca", kind: "pc", label: "PC-A", x: 320, y: 30, ifaces: [{ name: "eth0", ip: "192.168.1.10/24" }] },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "R-GedungA",
      hostname: "Router",
      x: 320,
      y: 110,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
      ],
    },
    {
      id: "r2",
      kind: "cisco",
      role: "router",
      label: "R-GedungB",
      hostname: "Router",
      x: 160,
      y: 190,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
      ],
    },
    {
      id: "r3",
      kind: "cisco",
      role: "router",
      label: "R-GedungC",
      hostname: "Router",
      x: 480,
      y: 190,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
      ],
    },
    { id: "pcb", kind: "pc", label: "PC-B", x: 60, y: 250, ifaces: [{ name: "eth0", ip: "192.168.2.10/24" }] },
    { id: "pcc", kind: "pc", label: "PC-C", x: 580, y: 250, ifaces: [{ name: "eth0", ip: "192.168.3.10/24" }] },
  ],
  links: [
    { a: ["pca", "eth0"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["pcb", "eth0"], b: ["r2", "GigabitEthernet0/0"] },
    { a: ["pcc", "eth0"], b: ["r3", "GigabitEthernet0/0"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["r2", "GigabitEthernet0/1"] },
    { a: ["r2", "GigabitEthernet0/2"], b: ["r3", "GigabitEthernet0/2"] },
    { a: ["r1", "GigabitEthernet0/2"], b: ["r3", "GigabitEthernet0/1"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Ketiga router punya nama",
      detail: "Beri nama R-GedungA, R-GedungB, dan R-GedungC sesuai gedungnya.",
      checks: [
        { type: "hostname", device: "r1", equals: "R-GedungA" },
        { type: "hostname", device: "r2", equals: "R-GedungB" },
        { type: "hostname", device: "r3", equals: "R-GedungC" },
      ],
    },
    {
      id: "interface",
      title: "Semua interface router aktif dan ber-IP",
      detail: "Seluruh interface pada ketiga router harus menyala dan memakai alamat sesuai data.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.1.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "10.0.12.1/30" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/2", ip: "10.0.13.1/30" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/0", ip: "192.168.2.1/24" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/1", ip: "10.0.12.2/30" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/2", ip: "10.0.23.1/30" },
        { type: "iface-ip", device: "r3", iface: "GigabitEthernet0/0", ip: "192.168.3.1/24" },
        { type: "iface-ip", device: "r3", iface: "GigabitEthernet0/1", ip: "10.0.13.2/30" },
        { type: "iface-ip", device: "r3", iface: "GigabitEthernet0/2", ip: "10.0.23.2/30" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/2" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/2" },
        { type: "iface-up", device: "r3", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r3", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r3", iface: "GigabitEthernet0/2" },
      ],
    },
    {
      id: "ospf",
      title: "Routing antar gedung berjalan dinamis",
      detail:
        "Tiap router harus bertetangga dengan dua router lainnya dan mempelajari LAN kedua gedung lain secara dinamis.",
      checks: [
        { type: "ospf-neighbors", device: "r1", min: 2 },
        { type: "ospf-neighbors", device: "r2", min: 2 },
        { type: "ospf-neighbors", device: "r3", min: 2 },
        { type: "ospf-route", device: "r1", dst: "192.168.2.0/24" },
        { type: "ospf-route", device: "r1", dst: "192.168.3.0/24" },
        { type: "ospf-route", device: "r2", dst: "192.168.1.0/24" },
        { type: "ospf-route", device: "r2", dst: "192.168.3.0/24" },
        { type: "ospf-route", device: "r3", dst: "192.168.1.0/24" },
        { type: "ospf-route", device: "r3", dst: "192.168.2.0/24" },
      ],
    },
    {
      id: "online",
      title: "Semua gedung saling terhubung",
      detail: "Komputer di ketiga gedung harus bisa saling berkomunikasi.",
      checks: [
        { type: "ping", from: "pca", to: "192.168.2.10" },
        { type: "ping", from: "pca", to: "192.168.3.10" },
        { type: "ping", from: "pcb", to: "192.168.1.10" },
        { type: "ping", from: "pcb", to: "192.168.3.10" },
        { type: "ping", from: "pcc", to: "192.168.1.10" },
        { type: "ping", from: "pcc", to: "192.168.2.10" },
      ],
    },
  ],
};

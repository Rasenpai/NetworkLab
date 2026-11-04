import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const ciscoDuaGedung: LabSpec = {
  id: "cisco-dua-gedung",
  title: "Kantor Dua Gedung",
  vendor: "Cisco",
  level: "Beginner",
  kind: "Studi Kasus",
  description:
    "Hubungkan gedung utama dan gedung gudang dengan routing statis, lalu bagikan internet ke keduanya.",
  minutes: 45,
  intro:
    "CV Maju Bersama memiliki gedung utama dan gedung gudang yang bersebelahan. Internet hanya masuk di gedung utama, sedangkan gedung gudang dihubungkan dengan satu kabel ke router utama. Kamu ditugaskan menyiapkan kedua router Cisco sampai komputer di kedua gedung bisa saling berkomunikasi dan membuka internet.\n\n" +
    "Kebutuhan perusahaan: komputer di kedua gedung harus saling terhubung, dan semuanya harus bisa membuka internet lewat gedung utama.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router utama 203.0.113.2/30.\n\n" +
    "Data nama router: R-Utama dan R-Gudang.\n\n" +
    "Data port R-Utama: GigabitEthernet0/0 LAN, GigabitEthernet0/1 ISP, GigabitEthernet0/2 ke gedung gudang.\n\n" +
    "Data port R-Gudang: GigabitEthernet0/0 LAN, GigabitEthernet0/1 ke gedung utama.\n\n" +
    "Data link antar gedung: Jaringan 10.0.0.0/30, R-Utama 10.0.0.1, R-Gudang 10.0.0.2.\n\n" +
    "Data LAN Utama: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, PC-Utama 192.168.10.10/24 (sudah terpasang).\n\n" +
    "Data LAN Gudang: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, PC-Gudang 192.168.20.10/24 (sudah terpasang).",
  devices: [
    {
      id: "pcu",
      kind: "pc",
      label: "PC-Utama",
      x: 60,
      y: 160,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
    },
    {
      id: "ru",
      kind: "cisco",
      role: "router",
      label: "R-Utama",
      hostname: "Router",
      x: 230,
      y: 160,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
      ],
    },
    {
      id: "rg",
      kind: "cisco",
      role: "router",
      label: "R-Gudang",
      hostname: "Router",
      x: 410,
      y: 160,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
      ],
    },
    {
      id: "pcg",
      kind: "pc",
      label: "PC-Gudang",
      x: 570,
      y: 160,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 230,
      y: 40,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pcu", "eth0"], b: ["ru", "GigabitEthernet0/0"] },
    { a: ["ru", "GigabitEthernet0/2"], b: ["rg", "GigabitEthernet0/1"] },
    { a: ["rg", "GigabitEthernet0/0"], b: ["pcg", "eth0"] },
    { a: ["ru", "GigabitEthernet0/1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Kedua router punya nama",
      detail: "Router gedung utama harus bernama R-Utama dan router gedung gudang harus bernama R-Gudang.",
      checks: [
        { type: "hostname", device: "ru", equals: "R-Utama" },
        { type: "hostname", device: "rg", equals: "R-Gudang" },
      ],
    },
    {
      id: "interface",
      title: "Semua interface router aktif dan ber-IP",
      detail: "Seluruh interface yang dipakai pada kedua router harus menyala dan memakai alamat sesuai data.",
      checks: [
        { type: "iface-ip", device: "ru", iface: "GigabitEthernet0/0", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "ru", iface: "GigabitEthernet0/1", ip: "203.0.113.2/30" },
        { type: "iface-ip", device: "ru", iface: "GigabitEthernet0/2", ip: "10.0.0.1/30" },
        { type: "iface-ip", device: "rg", iface: "GigabitEthernet0/0", ip: "192.168.20.1/24" },
        { type: "iface-ip", device: "rg", iface: "GigabitEthernet0/1", ip: "10.0.0.2/30" },
        { type: "iface-up", device: "ru", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "ru", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "ru", iface: "GigabitEthernet0/2" },
        { type: "iface-up", device: "rg", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "rg", iface: "GigabitEthernet0/1" },
      ],
    },
    {
      id: "routing",
      title: "Kedua gedung saling dikenal",
      detail:
        "R-Utama harus tahu jalan ke LAN gudang, dan R-Gudang harus memakai R-Utama sebagai jalan ke luar. R-Utama juga harus punya jalan ke internet lewat ISP.",
      checks: [
        { type: "route", device: "ru", dst: "192.168.20.0/24", via: "10.0.0.2" },
        { type: "route", device: "rg", dst: "0.0.0.0/0", via: "10.0.0.1" },
        { type: "route", device: "ru", dst: "0.0.0.0/0", via: "203.0.113.1" },
      ],
    },
    {
      id: "nat",
      title: "Alamat kedua gedung bisa keluar ke internet",
      detail:
        "Alamat jaringan kedua gedung harus diterjemahkan agar bisa keluar lewat IP router utama di sisi ISP.",
      checks: [
        { type: "nat-masq", device: "ru", iface: "GigabitEthernet0/1" },
        { type: "ping", from: "ru", to: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua komputer saling terhubung dan online",
      detail:
        "Komputer gedung utama dan gedung gudang harus bisa saling berkomunikasi dan sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "pcu", to: "192.168.20.10" },
        { type: "ping", from: "pcg", to: "192.168.10.10" },
        { type: "ping", from: "pcu", to: "8.8.8.8" },
        { type: "ping", from: "pcg", to: "8.8.8.8" },
      ],
    },
  ],
};

import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const mikrotikDuaRuko: LabSpec = {
  id: "mikrotik-dua-ruko",
  title: "Dua Ruko Satu Internet",
  vendor: "MikroTik",
  level: "Beginner",
  kind: "Studi Kasus",
  description:
    "Bagikan satu langganan internet ke dua ruko bersebelahan lewat dua router, lengkap dengan DHCP di tiap ruko.",
  minutes: 50,
  intro:
    "Pak Hendra memiliki dua ruko bersebelahan, tetapi hanya berlangganan satu internet di Ruko A. Ruko B harus ikut memakai internet itu lewat sebuah router tambahan. Kamu ditugaskan menyiapkan kedua router MikroTik sampai semua komputer di kedua ruko online.\n\n" +
    "Kebutuhan pemilik: karyawan tidak mau repot mengatur alamat di tiap perangkat, komputer di Ruko A dan Ruko B harus bisa saling berkomunikasi, dan semuanya harus bisa membuka internet.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router Ruko A 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data nama router: Ruko A bernama R-RukoA, Ruko B bernama R-RukoB.\n\n" +
    "Data port Ruko A: ether1 ISP, ether2 LAN, ether3 ke Ruko B.\n\n" +
    "Data port Ruko B: ether1 ke Ruko A, ether2 LAN.\n\n" +
    "Data link antar ruko: Jaringan 10.0.0.0/30, Ruko A 10.0.0.1, Ruko B 10.0.0.2.\n\n" +
    "Data LAN Ruko A: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, Rentang IP 192.168.10.100-192.168.10.200.\n\n" +
    "Data LAN Ruko B: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, Rentang IP 192.168.20.100-192.168.20.200.",
  devices: [
    { id: "pca", kind: "pc", label: "PC-RukoA", x: 60, y: 160, ifaces: [{ name: "eth0" }] },
    {
      id: "r1",
      kind: "mikrotik",
      label: "Router Ruko A",
      hostname: "MikroTik",
      x: 230,
      y: 160,
      ifaces: [{ name: "ether1" }, { name: "ether2" }, { name: "ether3" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "Router Ruko B",
      hostname: "MikroTik",
      x: 410,
      y: 160,
      ifaces: [{ name: "ether1" }, { name: "ether2" }],
    },
    { id: "pcb", kind: "pc", label: "PC-RukoB", x: 570, y: 160, ifaces: [{ name: "eth0" }] },
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
    { a: ["pca", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether3"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["pcb", "eth0"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Kedua router punya nama",
      detail: "Router Ruko A harus bernama R-RukoA dan router Ruko B harus bernama R-RukoB.",
      checks: [
        { type: "hostname", device: "r1", equals: "R-RukoA" },
        { type: "hostname", device: "r2", equals: "R-RukoB" },
      ],
    },
    {
      id: "internet",
      title: "Router Ruko A terhubung ke internet",
      detail:
        "Router Ruko A harus bisa menjangkau internet, memakai DNS yang diberikan ISP, dan menerjemahkan alamat jaringan ruko agar bisa keluar.",
      checks: [
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "dns", device: "r1", server: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "ether1" },
      ],
    },
    {
      id: "antar-ruko",
      title: "Kedua ruko saling terhubung",
      detail:
        "Router Ruko A dan Ruko B harus saling menjangkau lewat link antar ruko, dan Ruko B harus memakai Ruko A sebagai jalan ke internet. Ruko A juga harus tahu jalan ke LAN Ruko B.",
      checks: [
        { type: "ping", from: "r1", to: "10.0.0.2" },
        { type: "route", device: "r1", dst: "192.168.20.0/24", via: "10.0.0.2" },
        { type: "route", device: "r2", dst: "0.0.0.0/0", via: "10.0.0.1" },
        { type: "ping", from: "r2", to: "8.8.8.8" },
      ],
    },
    {
      id: "otomatis",
      title: "Kedua LAN mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Ruko A dan Ruko B menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama di tiap LAN harus mendapat alamat paling awal dari rentang IP-nya.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "ether2" },
        { type: "dhcp-server", device: "r2", iface: "ether2" },
        { type: "has-lease", device: "pca" },
        { type: "iface-ip", device: "pca", iface: "eth0", ip: "192.168.10.100/24" },
        { type: "dns", device: "pca", server: "8.8.8.8" },
        { type: "has-lease", device: "pcb" },
        { type: "iface-ip", device: "pcb", iface: "eth0", ip: "192.168.20.100/24" },
        { type: "dns", device: "pcb", server: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua komputer saling terhubung dan online",
      detail:
        "Komputer Ruko A dan Ruko B harus bisa saling berkomunikasi dan sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "pca", to: "192.168.20.100" },
        { type: "ping", from: "pcb", to: "192.168.10.100" },
        { type: "ping", from: "pca", to: "8.8.8.8" },
        { type: "ping", from: "pcb", to: "8.8.8.8" },
      ],
    },
  ],
};

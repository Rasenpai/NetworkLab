import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const mikrotikDualIsp: LabSpec = {
  id: "mikrotik-dual-isp",
  title: "Jaringan Kantor dengan Dual ISP",
  vendor: "MikroTik",
  level: "Advanced",
  kind: "Studi Kasus",
  description:
    "Hubungkan satu kantor ke dua ISP: kedua jalur terpasang, NAT di keduanya, dan semua LAN online.",
  minutes: 75,
  intro:
    "Kantor Konsultan Arunika berlangganan dua ISP: satu sebagai jalur utama dan satu lagi sebagai cadangan supaya pekerjaan tidak terhenti saat salah satu ISP bermasalah. Kamu ditugaskan menyiapkan router MikroTik agar kedua jalur terpasang dan seluruh jaringan kantor online.\n\n" +
    "Kebutuhan kantor: kedua ISP harus terpasang dan bisa dipakai, staf dan server tidak mau repot mengatur alamat manual, dan semua perangkat harus bisa membuka internet.\n\n" +
    "Data ISP Utama: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30.\n\n" +
    "Data ISP Cadangan: IP ISP 198.51.100.1, IP untuk router 198.51.100.2/30.\n\n" +
    "Data DNS: 8.8.8.8.\n\n" +
    "Data nama router: R-Kantor.\n\n" +
    "Data port router: ether1 ISP Utama, ether2 ISP Cadangan, ether3 Kantor, ether4 Server.\n\n" +
    "Data LAN Kantor: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, Rentang IP 192.168.10.100-192.168.10.200.\n\n" +
    "Data LAN Server: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, Rentang IP 192.168.20.100-192.168.20.200.",
  devices: [
    { id: "pck", kind: "pc", label: "PC-Kantor", x: 60, y: 80, ifaces: [{ name: "eth0" }] },
    { id: "srv", kind: "pc", label: "PC-Server", x: 60, y: 200, ifaces: [{ name: "eth0" }] },
    {
      id: "r1",
      kind: "mikrotik",
      label: "Router",
      hostname: "MikroTik",
      x: 290,
      y: 140,
      ifaces: [
        { name: "ether1" },
        { name: "ether2" },
        { name: "ether3" },
        { name: "ether4" },
      ],
    },
    {
      id: "ispa",
      kind: "cloud",
      label: "ISP Utama",
      x: 520,
      y: 60,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
    {
      id: "ispb",
      kind: "cloud",
      label: "ISP Cadangan",
      x: 520,
      y: 220,
      ifaces: [{ name: "ge0", ip: "198.51.100.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pck", "eth0"], b: ["r1", "ether3"] },
    { a: ["srv", "eth0"], b: ["r1", "ether4"] },
    { a: ["r1", "ether1"], b: ["ispa", "ge0"] },
    { a: ["r1", "ether2"], b: ["ispb", "ge0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Router punya nama",
      detail: "Router harus bernama R-Kantor.",
      checks: [{ type: "hostname", device: "r1", equals: "R-Kantor" }],
    },
    {
      id: "isp",
      title: "Kedua ISP terpasang",
      detail:
        "Router harus bisa menjangkau ISP Utama dan ISP Cadangan lewat alamat yang diberikan masing-masing.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "203.0.113.2/30" },
        { type: "iface-ip", device: "r1", iface: "ether2", ip: "198.51.100.2/30" },
        { type: "ping", from: "r1", to: "203.0.113.1" },
        { type: "ping", from: "r1", to: "198.51.100.1" },
      ],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet lewat kedua jalur",
      detail:
        "Router harus punya jalan ke internet lewat ISP Utama maupun ISP Cadangan, dan memakai DNS yang diberikan ISP.",
      checks: [
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "203.0.113.1" },
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "198.51.100.1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "dns", device: "r1", server: "8.8.8.8" },
      ],
    },
    {
      id: "nat",
      title: "Alamat LAN bisa keluar lewat kedua ISP",
      detail:
        "Alamat jaringan kantor harus diterjemahkan agar bisa keluar lewat ISP Utama dan juga lewat ISP Cadangan.",
      checks: [
        { type: "nat-masq", device: "r1", iface: "ether1" },
        { type: "nat-masq", device: "r1", iface: "ether2" },
      ],
    },
    {
      id: "otomatis",
      title: "Kedua LAN mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Kantor dan LAN Server menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama di tiap LAN harus mendapat alamat paling awal dari rentang IP-nya.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "ether3" },
        { type: "dhcp-server", device: "r1", iface: "ether4" },
        { type: "has-lease", device: "pck" },
        { type: "iface-ip", device: "pck", iface: "eth0", ip: "192.168.10.100/24" },
        { type: "dns", device: "pck", server: "8.8.8.8" },
        { type: "has-lease", device: "srv" },
        { type: "iface-ip", device: "srv", iface: "eth0", ip: "192.168.20.100/24" },
        { type: "dns", device: "srv", server: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua perangkat bisa membuka internet",
      detail: "Komputer kantor dan server harus sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "pck", to: "8.8.8.8" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
  ],
};

import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const mikrotikWarnet: LabSpec = {
  id: "mikrotik-warnet",
  title: "Jaringan Warnet: Operator, Billing, dan Client",
  vendor: "MikroTik",
  level: "Intermediate",
  kind: "Studi Kasus",
  description:
    "Siapkan jaringan warnet tiga segmen dengan DHCP, internet, dan akses client dibatasi hanya ke server billing.",
  minutes: 60,
  intro:
    "Warnet Cahaya Net ingin merapikan jaringannya dengan satu router MikroTik. Ada tiga segmen yang harus terpisah: komputer operator, server billing, dan komputer client untuk pelanggan. Kamu ditugaskan menyiapkan router sampai semua segmen berjalan.\n\n" +
    "Kebutuhan pemilik: tidak ada pengaturan alamat manual di perangkat mana pun, semua segmen harus bisa membuka internet, client boleh mengakses server billing untuk login, tetapi client tidak boleh bisa mengakses komputer operator.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data port router: ether1 ISP, ether2 Operator, ether3 Billing, ether4 Client.\n\n" +
    "Data LAN Operator: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, Rentang IP 192.168.10.100-192.168.10.200.\n\n" +
    "Data LAN Billing: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, Rentang IP 192.168.20.100-192.168.20.200.\n\n" +
    "Data LAN Client: Jaringan 192.168.30.0/24, Gateway 192.168.30.1, Rentang IP 192.168.30.100-192.168.30.200.",
  devices: [
    { id: "op", kind: "pc", label: "PC-Operator", x: 70, y: 50, ifaces: [{ name: "eth0" }] },
    { id: "billing", kind: "pc", label: "Server-Billing", x: 70, y: 140, ifaces: [{ name: "eth0" }] },
    { id: "client", kind: "pc", label: "PC-Client", x: 70, y: 230, ifaces: [{ name: "eth0" }] },
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
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 520,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["op", "eth0"], b: ["r1", "ether2"] },
    { a: ["billing", "eth0"], b: ["r1", "ether3"] },
    { a: ["client", "eth0"], b: ["r1", "ether4"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Router punya nama",
      detail: "Router harus bernama R-Warnet.",
      checks: [{ type: "hostname", device: "r1", equals: "R-Warnet" }],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet",
      detail:
        "Router harus bisa menjangkau internet, memakai DNS yang diberikan ISP, dan alamat ketiga LAN harus bisa keluar lewat IP router di sisi ISP.",
      checks: [
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "dns", device: "r1", server: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "ether1" },
      ],
    },
    {
      id: "otomatis",
      title: "Ketiga LAN mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Operator, Billing, dan Client menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama di tiap LAN harus mendapat alamat paling awal dari rentang IP-nya.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "ether2" },
        { type: "dhcp-server", device: "r1", iface: "ether3" },
        { type: "dhcp-server", device: "r1", iface: "ether4" },
        { type: "has-lease", device: "op" },
        { type: "iface-ip", device: "op", iface: "eth0", ip: "192.168.10.100/24" },
        { type: "dns", device: "op", server: "8.8.8.8" },
        { type: "has-lease", device: "billing" },
        { type: "iface-ip", device: "billing", iface: "eth0", ip: "192.168.20.100/24" },
        { type: "dns", device: "billing", server: "8.8.8.8" },
        { type: "has-lease", device: "client" },
        { type: "iface-ip", device: "client", iface: "eth0", ip: "192.168.30.100/24" },
        { type: "dns", device: "client", server: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua perangkat bisa membuka internet",
      detail:
        "Komputer operator, server billing, dan komputer client harus sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "op", to: "8.8.8.8" },
        { type: "ping", from: "billing", to: "8.8.8.8" },
        { type: "ping", from: "client", to: "8.8.8.8" },
      ],
    },
    {
      id: "akses",
      title: "Akses client dibatasi",
      detail:
        "Komputer client harus tetap bisa mengakses server billing, tetapi tidak boleh bisa mengakses komputer operator.",
      checks: [
        { type: "ping", from: "client", to: "192.168.20.100" },
        { type: "no-ping", from: "client", to: "192.168.10.100" },
      ],
    },
  ],
};

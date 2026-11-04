import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const mikrotikKedaiKopi: LabSpec = {
  id: "mikrotik-kedai-kopi",
  title: "Jaringan Kedai Kopi",
  vendor: "MikroTik",
  level: "Beginner",
  kind: "Studi Kasus",
  description:
    "Siapkan router bekas untuk jaringan kasir dan WiFi tamu sampai semua perangkat online.",
  minutes: 40,
  intro:
    "Kedai Kopi Senja baru saja membeli sebuah router MikroTik bekas dari toko lain. Pemilik ingin dua jaringan yang terpisah: satu untuk komputer kasir dan satu lagi untuk WiFi pelanggan. Kamu ditugaskan menyiapkan router ini sampai seluruh jaringan kedai berjalan.\n\n" +
    "Kebutuhan pemilik: karyawan tidak mau repot mengatur alamat di tiap perangkat, dan semua perangkat di kedua jaringan harus bisa membuka internet. Router bekas ini kemungkinan masih membawa pengaturan lama dari pemilik sebelumnya.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data port router: ether1 ISP, ether2 Kasir, ether3 Tamu.\n\n" +
    "Data LAN Kasir: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, Rentang IP 192.168.10.100-192.168.10.200.\n\n" +
    "Data LAN Tamu: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, Rentang IP 192.168.20.100-192.168.20.200.",
  devices: [
    {
      id: "kasir",
      kind: "pc",
      label: "PC-Kasir",
      x: 70,
      y: 70,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "tamu",
      kind: "pc",
      label: "PC-Tamu",
      x: 70,
      y: 210,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "Router",
      hostname: "MikroTik",
      x: 280,
      y: 140,
      ifaces: [
        { name: "ether1" },
        { name: "ether2" },
        { name: "ether3" },
        // Sisa konfigurasi pemilik lama.
        { name: "ether4", ip: "192.168.88.1/24" },
      ],
      routes: [{ dst: "172.16.0.0/16", via: "192.168.88.2" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 500,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["kasir", "eth0"], b: ["r1", "ether2"] },
    { a: ["tamu", "eth0"], b: ["r1", "ether3"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "bersih",
      title: "Router bersih dan punya nama",
      detail:
        "Router tidak boleh membawa pengaturan IP maupun route peninggalan pemilik lama, dan harus bernama R-Kedai.",
      checks: [
        { type: "hostname", device: "r1", equals: "R-Kedai" },
        { type: "iface-no-ip", device: "r1", iface: "ether4" },
        { type: "no-route", device: "r1", dst: "172.16.0.0/16" },
      ],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet",
      detail:
        "Router harus bisa menjangkau internet dan memakai DNS yang diberikan ISP.",
      checks: [
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "dns", device: "r1", server: "8.8.8.8" },
      ],
    },
    {
      id: "kasir",
      title: "LAN Kasir mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Kasir menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama yang meminta harus mendapat alamat paling awal dari rentang IP.",
      checks: [
        { type: "has-lease", device: "kasir" },
        { type: "iface-ip", device: "kasir", iface: "eth0", ip: "192.168.10.100/24" },
        { type: "dns", device: "kasir", server: "8.8.8.8" },
        { type: "ping", from: "kasir", to: "192.168.10.1" },
      ],
    },
    {
      id: "tamu",
      title: "LAN Tamu mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Tamu juga menerima alamat IP, gateway, dan DNS secara otomatis sesuai data, dengan alamat pertama dari rentang IP-nya.",
      checks: [
        { type: "has-lease", device: "tamu" },
        { type: "iface-ip", device: "tamu", iface: "eth0", ip: "192.168.20.100/24" },
        { type: "dns", device: "tamu", server: "8.8.8.8" },
        { type: "ping", from: "tamu", to: "192.168.20.1" },
      ],
    },
    {
      id: "online",
      title: "Semua perangkat bisa membuka internet",
      detail:
        "Komputer kasir dan perangkat tamu harus sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "kasir", to: "8.8.8.8" },
        { type: "ping", from: "tamu", to: "8.8.8.8" },
      ],
    },
  ],
};
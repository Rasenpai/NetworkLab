import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const ciscoTokoBuku: LabSpec = {
  id: "cisco-toko-buku",
  title: "Jaringan Toko Buku",
  vendor: "Cisco",
  level: "Beginner",
  kind: "Studi Kasus",
  description:
    "Siapkan router Cisco bekas untuk jaringan toko buku sampai semua komputer online secara otomatis.",
  minutes: 40,
  intro:
    "Toko Buku Pelita membeli sebuah router Cisco bekas dari sebuah kantor yang tutup. Pemilik ingin komputer kasir dan komputer katalog bisa membuka internet tanpa pengaturan alamat manual. Kamu ditugaskan menyiapkan router dan switch ini sampai jaringan toko berjalan.\n\n" +
    "Kebutuhan pemilik: karyawan tidak mau repot mengatur alamat di tiap komputer dan semua komputer harus bisa membuka internet. Router bekas ini kemungkinan masih membawa pengaturan lama dari pemilik sebelumnya.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data nama router: R-Toko.\n\n" +
    "Data port router: GigabitEthernet0/0 LAN toko, GigabitEthernet0/1 ISP. GigabitEthernet0/2 tidak dipakai.\n\n" +
    "Data LAN Toko: Jaringan 192.168.1.0/24, Gateway 192.168.1.1, alamat .1 sampai .9 dicadangkan untuk perangkat jaringan.",
  devices: [
    { id: "pc1", kind: "pc", label: "PC-Kasir", x: 60, y: 70, ifaces: [{ name: "eth0" }] },
    { id: "pc2", kind: "pc", label: "PC-Katalog", x: 60, y: 210, ifaces: [{ name: "eth0" }] },
    {
      id: "sw1",
      kind: "cisco",
      role: "switch",
      label: "Switch",
      hostname: "Switch",
      x: 220,
      y: 140,
      ifaces: [
        { name: "FastEthernet0/1" },
        { name: "FastEthernet0/2" },
        { name: "FastEthernet0/3" },
      ],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "Router",
      hostname: "Router",
      x: 400,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        // Sisa konfigurasi pemilik lama.
        { name: "GigabitEthernet0/2", ip: "192.168.99.1/24", adminDown: true },
      ],
      routes: [{ dst: "172.20.0.0/16", via: "192.168.99.2" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 570,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["sw1", "FastEthernet0/1"] },
    { a: ["pc2", "eth0"], b: ["sw1", "FastEthernet0/2"] },
    { a: ["sw1", "FastEthernet0/3"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "bersih",
      title: "Router bersih dan punya nama",
      detail:
        "Router tidak boleh membawa pengaturan IP maupun route peninggalan pemilik lama, dan harus bernama R-Toko.",
      checks: [
        { type: "hostname", device: "r1", equals: "R-Toko" },
        { type: "iface-no-ip", device: "r1", iface: "GigabitEthernet0/2" },
        { type: "no-route", device: "r1", dst: "172.20.0.0/16" },
      ],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet",
      detail:
        "Router harus bisa menjangkau internet, dan alamat LAN toko harus diterjemahkan agar bisa keluar lewat IP router di sisi ISP.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "203.0.113.2/30" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "GigabitEthernet0/1" },
      ],
    },
    {
      id: "otomatis",
      title: "LAN Toko mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Toko menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama yang meminta harus mendapat alamat paling awal yang boleh dibagikan.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.1.1/24" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "has-lease", device: "pc1" },
        { type: "iface-ip", device: "pc1", iface: "eth0", ip: "192.168.1.10/24" },
        { type: "dns", device: "pc1", server: "8.8.8.8" },
        { type: "has-lease", device: "pc2" },
        { type: "dns", device: "pc2", server: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua komputer bisa membuka internet",
      detail: "Komputer kasir dan komputer katalog harus sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "pc2", to: "8.8.8.8" },
      ],
    },
  ],
};

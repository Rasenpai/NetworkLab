import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const ciscoSekolahAcl: LabSpec = {
  id: "cisco-sekolah-acl",
  title: "Segmentasi Jaringan Sekolah dengan ACL",
  vendor: "Cisco",
  level: "Advanced",
  kind: "Studi Kasus",
  description:
    "Pisahkan jaringan guru, siswa, dan server dengan kebijakan ACL, lengkap dengan DHCP dan internet.",
  minutes: 90,
  intro:
    "SMK Harapan Bangsa memiliki satu router Cisco untuk tiga segmen: ruang guru, laboratorium siswa, dan server sekolah. Selama ini semua segmen saling terbuka, sehingga siswa bisa menjangkau komputer guru dan server nilai. Kamu ditugaskan menyiapkan router sampai jaringan berjalan dengan kebijakan akses yang benar.\n\n" +
    "Kebutuhan sekolah: guru dan siswa tidak mau mengatur alamat manual, semua komputer guru dan siswa harus bisa membuka internet, guru boleh mengakses siswa dan server, sedangkan siswa tidak boleh mengakses jaringan Guru maupun Server.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data nama router: R-Sekolah.\n\n" +
    "Data port router: GigabitEthernet0/0 Guru, GigabitEthernet0/1 Siswa (lewat switch), GigabitEthernet0/2 Server, GigabitEthernet0/3 ISP.\n\n" +
    "Data port switch siswa: FastEthernet0/1 PC-Siswa1, FastEthernet0/2 PC-Siswa2, FastEthernet0/3 ke router.\n\n" +
    "Data LAN Guru: Jaringan 192.168.10.0/24, Gateway 192.168.10.1, alamat .1 sampai .9 dicadangkan.\n\n" +
    "Data LAN Siswa: Jaringan 192.168.20.0/24, Gateway 192.168.20.1, alamat .1 sampai .9 dicadangkan.\n\n" +
    "Data LAN Server: Jaringan 192.168.30.0/24, Gateway 192.168.30.1, Server 192.168.30.10/24 (sudah terpasang).\n\n" +
    "Catatan: interface router Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    { id: "guru", kind: "pc", label: "PC-Guru", x: 320, y: 30, ifaces: [{ name: "eth0" }] },
    { id: "siswa1", kind: "pc", label: "PC-Siswa1", x: 60, y: 100, ifaces: [{ name: "eth0" }] },
    { id: "siswa2", kind: "pc", label: "PC-Siswa2", x: 60, y: 200, ifaces: [{ name: "eth0" }] },
    {
      id: "sw1",
      kind: "cisco",
      role: "switch",
      label: "Switch Siswa",
      hostname: "Switch",
      x: 190,
      y: 150,
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
      x: 340,
      y: 150,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
        { name: "GigabitEthernet0/3", adminDown: true },
      ],
    },
    {
      id: "server",
      kind: "pc",
      label: "Server",
      x: 340,
      y: 250,
      ifaces: [{ name: "eth0", ip: "192.168.30.10/24" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 560,
      y: 150,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["guru", "eth0"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["siswa1", "eth0"], b: ["sw1", "FastEthernet0/1"] },
    { a: ["siswa2", "eth0"], b: ["sw1", "FastEthernet0/2"] },
    { a: ["sw1", "FastEthernet0/3"], b: ["r1", "GigabitEthernet0/1"] },
    { a: ["server", "eth0"], b: ["r1", "GigabitEthernet0/2"] },
    { a: ["r1", "GigabitEthernet0/3"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Router punya nama",
      detail: "Router harus bernama R-Sekolah.",
      checks: [{ type: "hostname", device: "r1", equals: "R-Sekolah" }],
    },
    {
      id: "interface",
      title: "Semua interface router aktif dan ber-IP",
      detail: "Seluruh interface yang dipakai pada router harus menyala dan memakai alamat sesuai data.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "192.168.20.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/2", ip: "192.168.30.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/3", ip: "203.0.113.2/30" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/2" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/3" },
      ],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet",
      detail:
        "Router harus bisa menjangkau internet, dan alamat jaringan Guru dan Siswa harus diterjemahkan agar bisa keluar lewat IP router di sisi ISP.",
      checks: [
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "GigabitEthernet0/3" },
      ],
    },
    {
      id: "otomatis",
      title: "LAN Guru dan Siswa mendapat pengaturan otomatis",
      detail:
        "Perangkat di LAN Guru dan Siswa menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama yang meminta di tiap LAN harus mendapat alamat paling awal yang boleh dibagikan.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "has-lease", device: "guru" },
        { type: "iface-ip", device: "guru", iface: "eth0", ip: "192.168.10.10/24" },
        { type: "dns", device: "guru", server: "8.8.8.8" },
        { type: "has-lease", device: "siswa1" },
        { type: "iface-ip", device: "siswa1", iface: "eth0", ip: "192.168.20.10/24" },
        { type: "dns", device: "siswa1", server: "8.8.8.8" },
        { type: "has-lease", device: "siswa2" },
        { type: "dns", device: "siswa2", server: "8.8.8.8" },
      ],
    },
    {
      id: "guru",
      title: "Guru bisa mengakses semua segmen dan internet",
      detail: "Komputer guru harus bisa menjangkau siswa, server, dan internet.",
      checks: [
        { type: "ping", from: "guru", to: "192.168.20.10" },
        { type: "ping", from: "guru", to: "192.168.30.10" },
        { type: "ping", from: "guru", to: "8.8.8.8" },
      ],
    },
    {
      id: "siswa",
      title: "Siswa dibatasi tetapi tetap online",
      detail:
        "Komputer siswa tidak boleh bisa menjangkau jaringan Guru maupun Server, tetapi tetap bisa menjangkau gateway-nya sendiri dan internet.",
      checks: [
        { type: "ping", from: "siswa1", to: "192.168.20.1" },
        { type: "ping", from: "siswa1", to: "8.8.8.8" },
        { type: "ping", from: "siswa2", to: "8.8.8.8" },
        { type: "no-ping", from: "siswa1", to: "192.168.10.10" },
        { type: "no-ping", from: "siswa1", to: "192.168.30.10" },
        { type: "no-ping", from: "siswa2", to: "192.168.30.10" },
      ],
    },
  ],
};

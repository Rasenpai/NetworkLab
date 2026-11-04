import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const ciscoHotel: LabSpec = {
  id: "cisco-hotel",
  title: "Jaringan Hotel: Staf dan Tamu",
  vendor: "Cisco",
  level: "Advanced",
  kind: "Studi Kasus",
  description:
    "Rancang jaringan hotel kecil: VLAN Staf dan Tamu, DHCP, internet, dan pembatasan akses tamu.",
  minutes: 70,
  intro:
    "Hotel Melati Indah baru memasang satu router dan satu switch Cisco. Pemilik ingin dua jaringan terpisah: satu untuk komputer staf resepsionis dan satu lagi untuk WiFi tamu. Kamu ditugaskan menyiapkan perangkat sampai jaringan hotel berjalan, hanya dengan satu kabel antara switch dan router.\n\n" +
    "Kebutuhan pemilik: karyawan tidak mau repot mengatur alamat di tiap perangkat, semua perangkat harus bisa membuka internet, dan tamu tidak boleh bisa mengakses komputer staf.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data port router: GigabitEthernet0/0 ke switch, GigabitEthernet0/1 ISP.\n\n" +
    "Data port switch: FastEthernet0/1 PC-Staf, FastEthernet0/2 PC-Tamu, FastEthernet0/24 ke router.\n\n" +
    "Data LAN Staf: VLAN 10 bernama Staf, Jaringan 192.168.10.0/24, Gateway 192.168.10.1, alamat .1 sampai .9 dicadangkan.\n\n" +
    "Data LAN Tamu: VLAN 20 bernama Tamu, Jaringan 192.168.20.0/24, Gateway 192.168.20.1, alamat .1 sampai .9 dicadangkan.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC-Staf",
      x: 60,
      y: 70,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC-Tamu",
      x: 60,
      y: 210,
      ifaces: [{ name: "eth0" }],
    },
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
        { name: "FastEthernet0/24" },
      ],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "Router",
      hostname: "Router",
      x: 390,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
      ],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 560,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8"],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["sw1", "FastEthernet0/1"] },
    { a: ["pc2", "eth0"], b: ["sw1", "FastEthernet0/2"] },
    { a: ["sw1", "FastEthernet0/24"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "switch",
      title: "Switch memisahkan Staf dan Tamu",
      detail:
        "Switch harus memiliki VLAN Staf dan VLAN Tamu sesuai data, tiap PC berada di VLAN-nya, dan link ke router membawa kedua VLAN.",
      checks: [
        { type: "vlan", device: "sw1", id: 10, name: "Staf" },
        { type: "vlan", device: "sw1", id: 20, name: "Tamu" },
        { type: "access-port", device: "sw1", iface: "FastEthernet0/1", vlan: 10 },
        { type: "access-port", device: "sw1", iface: "FastEthernet0/2", vlan: 20 },
        { type: "trunk-port", device: "sw1", iface: "FastEthernet0/24", vlans: [10, 20] },
      ],
    },
    {
      id: "gateway",
      title: "Router menjadi gateway kedua VLAN",
      detail:
        "Router harus menjadi gateway Staf dan Tamu sesuai data, hanya lewat satu interface fisik ke switch.",
      checks: [
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.10", vlan: 10 },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.20", vlan: 20 },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.10", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.20", ip: "192.168.20.1/24" },
      ],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet",
      detail:
        "Router harus bisa menjangkau internet, dan alamat kedua jaringan harus bisa keluar lewat IP router di sisi ISP.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "203.0.113.2/30" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "GigabitEthernet0/1" },
      ],
    },
    {
      id: "otomatis",
      title: "Perangkat mendapat pengaturan otomatis",
      detail:
        "Perangkat di tiap VLAN menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama yang meminta harus mendapat alamat paling awal yang boleh dibagikan.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.10" },
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.20" },
        { type: "has-lease", device: "pc1" },
        { type: "iface-ip", device: "pc1", iface: "eth0", ip: "192.168.10.10/24" },
        { type: "dns", device: "pc1", server: "8.8.8.8" },
        { type: "has-lease", device: "pc2" },
        { type: "iface-ip", device: "pc2", iface: "eth0", ip: "192.168.20.10/24" },
        { type: "dns", device: "pc2", server: "8.8.8.8" },
      ],
    },
    {
      id: "online",
      title: "Semua perangkat online, tamu terbatas",
      detail:
        "Komputer staf dan perangkat tamu harus sama-sama bisa menjangkau internet. Tamu tidak boleh bisa mengakses jaringan Staf, tetapi tetap bisa menjangkau gateway-nya sendiri.",
      checks: [
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "pc2", to: "8.8.8.8" },
        { type: "ping", from: "pc2", to: "192.168.20.1" },
        { type: "no-ping", from: "pc2", to: "192.168.10.10" },
      ],
    },
  ],
};
import type { LabSpec } from "../types";

/**
 * Studi Kasus: sengaja tanpa `hints` dan tanpa langkah pengerjaan.
 * Setiap tugas hanya menyatakan kebutuhan yang harus terpenuhi,
 * cara mencapainya ditentukan sendiri oleh pengguna.
 */
export const ciscoKantorCabang: LabSpec = {
  id: "cisco-kantor-cabang",
  title: "Jaringan Kantor Cabang 3 Lantai",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Studi Kasus",
  description:
    "Rancang VLAN per divisi di tiga lantai: trunk antar switch, DHCP, routing antar VLAN, dan internet.",
  minutes: 90,
  intro:
    "Kantor cabang Bank Sentosa menempati tiga lantai, dan tiap lantai dipakai satu divisi. Tiap lantai punya satu switch, dan switch-switch itu berantai ke atas hingga ke satu router di lantai 1. Kamu ditugaskan menyiapkan switch dan router Cisco sampai seluruh jaringan cabang berjalan.\n\n" +
    "Kebutuhan kantor: tiap divisi berada di VLAN sendiri, karyawan tidak mau mengatur alamat manual, semua divisi harus bisa saling berkomunikasi lewat router, dan semua komputer harus bisa membuka internet.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, DNS 8.8.8.8.\n\n" +
    "Data port router: GigabitEthernet0/0 ke SW-L1, GigabitEthernet0/1 ISP.\n\n" +
    "Data switch: SW-L1 FastEthernet0/1 PC, FastEthernet0/24 ke router, FastEthernet0/23 ke SW-L2. SW-L2 FastEthernet0/1 PC, FastEthernet0/24 ke SW-L1, FastEthernet0/23 ke SW-L3. SW-L3 FastEthernet0/1 PC, FastEthernet0/24 ke SW-L2.\n\n" +
    "Data VLAN Keuangan (Lantai 1): VLAN 10 bernama Keuangan, Jaringan 192.168.10.0/24, Gateway 192.168.10.1, alamat .1 sampai .9 dicadangkan.\n\n" +
    "Data VLAN Pemasaran (Lantai 2): VLAN 20 bernama Pemasaran, Jaringan 192.168.20.0/24, Gateway 192.168.20.1, alamat .1 sampai .9 dicadangkan.\n\n" +
    "Data VLAN IT (Lantai 3): VLAN 30 bernama IT, Jaringan 192.168.30.0/24, Gateway 192.168.30.1, alamat .1 sampai .9 dicadangkan.\n\n" +
    "Catatan: interface router Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    { id: "pc1", kind: "pc", label: "PC-Keuangan", x: 330, y: 245, ifaces: [{ name: "eth0" }] },
    { id: "pc2", kind: "pc", label: "PC-Pemasaran", x: 200, y: 245, ifaces: [{ name: "eth0" }] },
    { id: "pc3", kind: "pc", label: "PC-IT", x: 70, y: 245, ifaces: [{ name: "eth0" }] },
    {
      id: "sw1",
      kind: "cisco",
      role: "switch",
      label: "SW-L1",
      hostname: "Switch",
      x: 330,
      y: 140,
      ifaces: [
        { name: "FastEthernet0/1" },
        { name: "FastEthernet0/23" },
        { name: "FastEthernet0/24" },
      ],
    },
    {
      id: "sw2",
      kind: "cisco",
      role: "switch",
      label: "SW-L2",
      hostname: "Switch",
      x: 200,
      y: 140,
      ifaces: [
        { name: "FastEthernet0/1" },
        { name: "FastEthernet0/23" },
        { name: "FastEthernet0/24" },
      ],
    },
    {
      id: "sw3",
      kind: "cisco",
      role: "switch",
      label: "SW-L3",
      hostname: "Switch",
      x: 70,
      y: 140,
      ifaces: [{ name: "FastEthernet0/1" }, { name: "FastEthernet0/24" }],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "Router",
      hostname: "Router",
      x: 460,
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
      x: 580,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["sw1", "FastEthernet0/1"] },
    { a: ["pc2", "eth0"], b: ["sw2", "FastEthernet0/1"] },
    { a: ["pc3", "eth0"], b: ["sw3", "FastEthernet0/1"] },
    { a: ["sw1", "FastEthernet0/24"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["sw1", "FastEthernet0/23"], b: ["sw2", "FastEthernet0/24"] },
    { a: ["sw2", "FastEthernet0/23"], b: ["sw3", "FastEthernet0/24"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "vlan",
      title: "VLAN per divisi ada di semua switch",
      detail:
        "Ketiga switch harus memiliki VLAN Keuangan, Pemasaran, dan IT sesuai data supaya divisi bisa tersebar di beberapa lantai.",
      checks: [
        { type: "vlan", device: "sw1", id: 10, name: "Keuangan" },
        { type: "vlan", device: "sw1", id: 20, name: "Pemasaran" },
        { type: "vlan", device: "sw1", id: 30, name: "IT" },
        { type: "vlan", device: "sw2", id: 10, name: "Keuangan" },
        { type: "vlan", device: "sw2", id: 20, name: "Pemasaran" },
        { type: "vlan", device: "sw2", id: 30, name: "IT" },
        { type: "vlan", device: "sw3", id: 10, name: "Keuangan" },
        { type: "vlan", device: "sw3", id: 20, name: "Pemasaran" },
        { type: "vlan", device: "sw3", id: 30, name: "IT" },
      ],
    },
    {
      id: "port",
      title: "Port PC dan link antar switch benar",
      detail:
        "Tiap komputer harus berada di VLAN divisinya, dan semua link antar switch serta link ke router harus membawa ketiga VLAN.",
      checks: [
        { type: "access-port", device: "sw1", iface: "FastEthernet0/1", vlan: 10 },
        { type: "access-port", device: "sw2", iface: "FastEthernet0/1", vlan: 20 },
        { type: "access-port", device: "sw3", iface: "FastEthernet0/1", vlan: 30 },
        { type: "trunk-port", device: "sw1", iface: "FastEthernet0/24", vlans: [10, 20, 30] },
        { type: "trunk-port", device: "sw1", iface: "FastEthernet0/23", vlans: [10, 20, 30] },
        { type: "trunk-port", device: "sw2", iface: "FastEthernet0/24", vlans: [10, 20, 30] },
        { type: "trunk-port", device: "sw2", iface: "FastEthernet0/23", vlans: [10, 20, 30] },
        { type: "trunk-port", device: "sw3", iface: "FastEthernet0/24", vlans: [10, 20, 30] },
      ],
    },
    {
      id: "gateway",
      title: "Router menjadi gateway ketiga VLAN",
      detail:
        "Router harus menjadi gateway semua VLAN sesuai data, hanya lewat satu interface fisik ke switch.",
      checks: [
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.10", vlan: 10 },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.20", vlan: 20 },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.30", vlan: 30 },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.10", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.20", ip: "192.168.20.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.30", ip: "192.168.30.1/24" },
      ],
    },
    {
      id: "otomatis",
      title: "Semua divisi mendapat pengaturan otomatis",
      detail:
        "Perangkat di tiap VLAN menerima alamat IP, gateway, dan DNS secara otomatis sesuai data. Perangkat pertama di tiap VLAN harus mendapat alamat paling awal yang boleh dibagikan.",
      checks: [
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.10" },
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.20" },
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.30" },
        { type: "has-lease", device: "pc1" },
        { type: "iface-ip", device: "pc1", iface: "eth0", ip: "192.168.10.10/24" },
        { type: "dns", device: "pc1", server: "8.8.8.8" },
        { type: "has-lease", device: "pc2" },
        { type: "iface-ip", device: "pc2", iface: "eth0", ip: "192.168.20.10/24" },
        { type: "dns", device: "pc2", server: "8.8.8.8" },
        { type: "has-lease", device: "pc3" },
        { type: "iface-ip", device: "pc3", iface: "eth0", ip: "192.168.30.10/24" },
        { type: "dns", device: "pc3", server: "8.8.8.8" },
      ],
    },
    {
      id: "internet",
      title: "Router terhubung ke internet",
      detail:
        "Router harus bisa menjangkau internet, dan alamat seluruh VLAN harus diterjemahkan agar bisa keluar lewat IP router di sisi ISP.",
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "203.0.113.2/30" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
        { type: "nat-masq", device: "r1", iface: "GigabitEthernet0/1" },
      ],
    },
    {
      id: "online",
      title: "Semua divisi saling terhubung dan online",
      detail:
        "Komputer di ketiga lantai harus bisa saling berkomunikasi lewat router dan sama-sama bisa menjangkau internet.",
      checks: [
        { type: "ping", from: "pc1", to: "192.168.20.10" },
        { type: "ping", from: "pc2", to: "192.168.30.10" },
        { type: "ping", from: "pc3", to: "192.168.10.10" },
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "pc2", to: "8.8.8.8" },
        { type: "ping", from: "pc3", to: "8.8.8.8" },
      ],
    },
  ],
};

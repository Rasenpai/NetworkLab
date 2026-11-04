import type { LabSpec } from "../types";

export const ciscoDhcp: LabSpec = {
  id: "cisco-dhcp",
  title: "DHCP Server di Router Cisco",
  vendor: "Cisco",
  level: "Beginner",
  kind: "Simulasi",
  description:
    "Buat DHCP pool, excluded address, dan pastikan client mendapat IP otomatis.",
  minutes: 35,
  intro:
    "Sebuah LAN kecil berisi dua PC yang tersambung ke switch, lalu ke satu router Cisco. Alamat IP belum diatur di PC mana pun. Jadikan router sebagai DHCP server supaya kedua PC mendapat pengaturan jaringan secara otomatis.\n\n" +
    "Data LAN: Jaringan 192.168.10.0/24, Gateway 192.168.10.1 (GigabitEthernet0/0 pada router), DNS 8.8.8.8.\n\n" +
    "Data alamat: alamat 192.168.10.1 sampai 192.168.10.9 dicadangkan untuk perangkat jaringan dan tidak boleh dibagikan. Perangkat pertama yang meminta harus mendapat alamat paling awal yang boleh dibagikan.\n\n" +
    "Catatan: interface Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC-1",
      x: 70,
      y: 70,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC-2",
      x: 70,
      y: 210,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "sw1",
      kind: "cisco",
      role: "switch",
      label: "Switch",
      hostname: "Switch",
      x: 280,
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
      x: 500,
      y: 140,
      ifaces: [{ name: "GigabitEthernet0/0", adminDown: true }],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["sw1", "FastEthernet0/1"] },
    { a: ["pc2", "eth0"], b: ["sw1", "FastEthernet0/2"] },
    { a: ["sw1", "FastEthernet0/3"], b: ["r1", "GigabitEthernet0/0"] },
  ],
  tasks: [
    {
      id: "gateway",
      title: "Router menjadi gateway LAN",
      detail:
        "GigabitEthernet0/0 pada router harus menyala dan memakai IP 192.168.10.1/24.",
      hints: [
        "Masuk ke interface, pasang ip address, lalu no shutdown.",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.10.1/24" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
      ],
    },
    {
      id: "dhcp",
      title: "Router berjalan sebagai DHCP server",
      detail:
        "Buat DHCP pool untuk LAN dengan gateway dan DNS sesuai data, dan cadangkan 192.168.10.1 sampai 192.168.10.9 agar tidak dibagikan.",
      hints: [
        "Cadangkan alamat dengan ip dhcp excluded-address <awal> <akhir>.",
        "Buat pool dengan ip dhcp pool <nama>, lalu isi network, default-router, dan dns-server.",
      ],
      checks: [{ type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0" }],
    },
    {
      id: "client",
      title: "PC mendapat pengaturan otomatis",
      detail:
        "Kedua PC harus menerima IP dan DNS secara otomatis. PC-1 sebagai perangkat pertama harus mendapat alamat paling awal yang boleh dibagikan.",
      hints: [
        "Minta alamat dari tiap PC (mis. dengan perintah DHCP di terminal PC).",
        "Alamat pertama setelah excluded range adalah 192.168.10.10.",
      ],
      checks: [
        { type: "has-lease", device: "pc1" },
        { type: "iface-ip", device: "pc1", iface: "eth0", ip: "192.168.10.10/24" },
        { type: "dns", device: "pc1", server: "8.8.8.8" },
        { type: "has-lease", device: "pc2" },
        { type: "dns", device: "pc2", server: "8.8.8.8" },
      ],
    },
    {
      id: "konektivitas",
      title: "PC bisa menjangkau gateway dan PC lain",
      detail: "PC-1 harus bisa ping ke gateway dan ke PC-2.",
      hints: [
        "Cek IP PC-2 terlebih dulu sebelum menguji ping dari PC-1.",
      ],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.10.1" },
        { type: "ping", from: "pc2", to: "192.168.10.1" },
      ],
    },
  ],
};
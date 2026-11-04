import type { LabSpec } from "../types";

export const ciscoDasar: LabSpec = {
  id: "cisco-dasar",
  title: "Konfigurasi Dasar Router & Switch Cisco",
  vendor: "Cisco",
  level: "Beginner",
  kind: "Simulasi",
  description:
    "Atur hostname, IP interface, dan verifikasi dengan show command.",
  minutes: 30,
  intro:
    "Kamu baru menerima satu router dan satu switch Cisco yang masih kosong. Sebelum dipakai, kedua perangkat harus diberi nama yang jelas dan router harus punya IP di jaringan admin supaya bisa dijangkau dari PC.\n\n" +
    "Data nama perangkat: router R-Dasar, switch SW-Dasar.\n\n" +
    "Data jaringan admin: Jaringan 192.168.1.0/24, IP router 192.168.1.1/24 di GigabitEthernet0/0, IP PC-Admin 192.168.1.10/24 (sudah terpasang).\n\n" +
    "Catatan: interface Cisco aktif-nya harus kamu nyalakan sendiri. Setelah selesai, biasakan memeriksa hasilnya dengan show command.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC-Admin",
      x: 70,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.1.10/24" }],
    },
    {
      id: "sw1",
      kind: "cisco",
      role: "switch",
      label: "Switch",
      hostname: "Switch",
      x: 280,
      y: 140,
      ifaces: [{ name: "FastEthernet0/1" }, { name: "FastEthernet0/2" }],
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
    { a: ["sw1", "FastEthernet0/2"], b: ["r1", "GigabitEthernet0/0"] },
  ],
  tasks: [
    {
      id: "nama",
      title: "Router dan switch punya nama",
      detail: "Beri router nama R-Dasar dan switch nama SW-Dasar.",
      hints: [
        "Masuk ke mode konfigurasi global: enable lalu configure terminal.",
        "Perintah untuk nama perangkat: hostname <nama>.",
      ],
      checks: [
        { type: "hostname", device: "r1", equals: "R-Dasar" },
        { type: "hostname", device: "sw1", equals: "SW-Dasar" },
      ],
    },
    {
      id: "ip",
      title: "Interface router aktif dan ber-IP",
      detail:
        "GigabitEthernet0/0 pada router harus menyala dan memakai IP 192.168.1.1/24.",
      hints: [
        "Masuk ke interface: interface GigabitEthernet0/0.",
        "Pasang IP dengan ip address <ip> <netmask>, lalu nyalakan dengan no shutdown.",
      ],
      checks: [
        {
          type: "iface-ip",
          device: "r1",
          iface: "GigabitEthernet0/0",
          ip: "192.168.1.1/24",
        },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
      ],
    },
    {
      id: "verifikasi",
      title: "PC-Admin bisa menjangkau router",
      detail:
        "PC-Admin harus bisa melakukan ping ke router. Periksa juga dengan show ip interface brief.",
      hints: [
        "Gunakan show ip interface brief untuk melihat status dan IP tiap interface.",
        "Kalau ping gagal, cek status interface router dan kabel di topologi.",
      ],
      checks: [{ type: "ping", from: "pc1", to: "192.168.1.1" }],
    },
  ],
};
import type { LabSpec } from "../types";

export const ciscoOspfDefaultRoute: LabSpec = {
  id: "cisco-ospf-default-route",
  title: "OSPF dengan Default Route ke ISP",
  vendor: "Cisco",
  level: "Advanced",
  kind: "Simulasi",
  description:
    "Bangun OSPF tiga router, sebarkan default route dari router tepi, dan aktifkan NAT ke internet.",
  minutes: 80,
  intro:
    "Sebuah jaringan memakai tiga router Cisco dalam satu baris: R1 di LAN A, R2 di tengah, dan R3 di LAN B yang juga terhubung ke ISP. Alih-alih static route di setiap router, jaringan ini harus memakai OSPF. Hanya R3 yang tahu jalan ke internet, jadi R3 harus menyebarkan default route ke router lain lewat OSPF dan menerjemahkan alamat LAN dengan NAT.\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk R3 203.0.113.2/30, tujuan uji 8.8.8.8.\n\n" +
    "Data LAN A: Jaringan 192.168.1.0/24, Gateway R1 192.168.1.1 (GigabitEthernet0/0), PC-A 192.168.1.10/24 (sudah terpasang).\n\n" +
    "Data LAN B: Jaringan 192.168.3.0/24, Gateway R3 192.168.3.1 (GigabitEthernet0/2), PC-B 192.168.3.10/24 (sudah terpasang).\n\n" +
    "Data link R1-R2: Jaringan 10.0.12.0/30, R1 10.0.12.1 (GigabitEthernet0/1), R2 10.0.12.2 (GigabitEthernet0/0).\n\n" +
    "Data link R2-R3: Jaringan 10.0.23.0/30, R2 10.0.23.1 (GigabitEthernet0/1), R3 10.0.23.2 (GigabitEthernet0/0).\n\n" +
    "Data link R3-ISP: GigabitEthernet0/1 pada R3.\n\n" +
    "Ketentuan: semua rute internal dipelajari lewat OSPF, bukan static route. Satu-satunya route statis yang dibolehkan adalah default route di R3 ke ISP.\n\n" +
    "Catatan: interface Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    {
      id: "pca",
      kind: "pc",
      label: "PC-A",
      x: 50,
      y: 70,
      ifaces: [{ name: "eth0", ip: "192.168.1.10/24" }],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "R1",
      hostname: "R1",
      x: 190,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
      ],
    },
    {
      id: "r2",
      kind: "cisco",
      role: "router",
      label: "R2",
      hostname: "R2",
      x: 330,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
      ],
    },
    {
      id: "r3",
      kind: "cisco",
      role: "router",
      label: "R3",
      hostname: "R3",
      x: 470,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
      ],
    },
    {
      id: "pcb",
      kind: "pc",
      label: "PC-B",
      x: 590,
      y: 230,
      ifaces: [{ name: "eth0", ip: "192.168.3.10/24" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 590,
      y: 60,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8"],
    },
  ],
  links: [
    { a: ["pca", "eth0"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["r1", "GigabitEthernet0/1"], b: ["r2", "GigabitEthernet0/0"] },
    { a: ["r2", "GigabitEthernet0/1"], b: ["r3", "GigabitEthernet0/0"] },
    { a: ["r3", "GigabitEthernet0/1"], b: ["isp", "ge0"] },
    { a: ["r3", "GigabitEthernet0/2"], b: ["pcb", "eth0"] },
  ],
  tasks: [
    {
      id: "interface",
      title: "Semua interface router aktif dan ber-IP",
      detail:
        "Pasang IP sesuai data pada seluruh interface R1, R2, dan R3, lalu nyalakan semuanya.",
      hints: [
        "Interface Cisco mati secara default, jadi jangan lupa no shutdown.",
        "Semua link antar router memakai /30, netmask-nya 255.255.255.252.",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.1.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "10.0.12.1/30" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/0", ip: "10.0.12.2/30" },
        { type: "iface-ip", device: "r2", iface: "GigabitEthernet0/1", ip: "10.0.23.1/30" },
        { type: "iface-ip", device: "r3", iface: "GigabitEthernet0/0", ip: "10.0.23.2/30" },
        { type: "iface-ip", device: "r3", iface: "GigabitEthernet0/1", ip: "203.0.113.2/30" },
        { type: "iface-ip", device: "r3", iface: "GigabitEthernet0/2", ip: "192.168.3.1/24" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r2", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r3", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r3", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r3", iface: "GigabitEthernet0/2" },
      ],
    },
    {
      id: "ospf",
      title: "OSPF terbentuk dan LAN saling dikenal",
      detail:
        "Aktifkan OSPF di ketiga router sehingga R1 mengenal LAN B dan R3 mengenal LAN A. R2 harus bertetangga dengan kedua router lain.",
      hints: [
        "Mulai dengan router ospf 1 dan beri router-id jika perlu.",
        "Umumkan jaringan dengan network <ip> <wildcard> area 0 untuk tiap jaringan yang ingin disebarkan.",
        "Periksa dengan show ip ospf neighbor dan show ip route ospf.",
      ],
      checks: [
        { type: "ospf-neighbors", device: "r1", min: 1 },
        { type: "ospf-neighbors", device: "r2", min: 2 },
        { type: "ospf-neighbors", device: "r3", min: 1 },
        { type: "ospf-route", device: "r1", dst: "192.168.3.0/24" },
        { type: "ospf-route", device: "r3", dst: "192.168.1.0/24" },
      ],
    },
    {
      id: "default",
      title: "R3 menyebarkan jalan ke internet",
      detail:
        "R3 memiliki default route ke ISP dan menyebarkannya ke R1 dan R2 lewat OSPF, bukan dengan static route di router lain.",
      hints: [
        "Default route di R3: ip route 0.0.0.0 0.0.0.0 <next-hop ISP>.",
        "Sebarkan lewat OSPF dengan default-information originate pada konfigurasi OSPF R3.",
      ],
      checks: [
        { type: "route", device: "r3", dst: "0.0.0.0/0", via: "203.0.113.1" },
        { type: "ospf-route", device: "r1", dst: "0.0.0.0/0" },
        { type: "ospf-route", device: "r2", dst: "0.0.0.0/0" },
      ],
    },
    {
      id: "nat",
      title: "R3 menerjemahkan alamat LAN",
      detail:
        "Aktifkan NAT overload di R3 pada interface sisi ISP agar alamat private bisa keluar ke internet.",
      hints: [
        "Tandai interface sisi dalam dan luar, buat ACL yang mencakup LAN A dan LAN B.",
        "Perhatikan bahwa trafik LAN A juga lewat R3, jadi ACL harus mencakup keduanya.",
      ],
      checks: [{ type: "nat-masq", device: "r3", iface: "GigabitEthernet0/1" }],
    },
    {
      id: "online",
      title: "Semua PC terhubung dan bisa membuka internet",
      detail:
        "PC-A dan PC-B harus bisa saling ping dan sama-sama bisa menjangkau internet.",
      hints: [
        "Uji dari kedua arah dan ke 8.8.8.8 dari kedua PC.",
        "Jika hanya satu LAN yang berhasil, periksa cakupan ACL NAT.",
      ],
      checks: [
        { type: "ping", from: "pca", to: "192.168.3.10" },
        { type: "ping", from: "pcb", to: "192.168.1.10" },
        { type: "ping", from: "pca", to: "8.8.8.8" },
        { type: "ping", from: "pcb", to: "8.8.8.8" },
      ],
    },
  ],
};
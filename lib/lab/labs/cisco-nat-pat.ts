import type { LabSpec } from "../types";

export const ciscoNatPat: LabSpec = {
  id: "cisco-nat-pat",
  title: "NAT Overload (PAT) ke Internet",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Simulasi",
  description:
    "Berikan akses internet ke LAN lokal dengan PAT dan verifikasi tabel translasi.",
  minutes: 50,
  intro:
    "Sebuah kantor kecil memakai router Cisco yang terhubung ke ISP. Alamat LAN adalah alamat private, sehingga tidak bisa dikenali di internet. Tugasmu menyiapkan router agar semua PC di LAN bisa membuka internet lewat satu IP publik dengan NAT overload (PAT).\n\n" +
    "Data ISP: IP ISP 203.0.113.1, IP untuk router 203.0.113.2/30, tujuan uji 8.8.8.8.\n\n" +
    "Data port router: GigabitEthernet0/0 ke LAN, GigabitEthernet0/1 ke ISP.\n\n" +
    "Data LAN: Jaringan 192.168.1.0/24, Gateway 192.168.1.1, PC-1 192.168.1.10/24 dan PC-2 192.168.1.11/24 (sudah terpasang).\n\n" +
    "Catatan: interface Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC-1",
      x: 70,
      y: 70,
      ifaces: [{ name: "eth0", ip: "192.168.1.10/24" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC-2",
      x: 70,
      y: 210,
      ifaces: [{ name: "eth0", ip: "192.168.1.11/24" }],
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
      ],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 570,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8"],
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
      id: "interface",
      title: "Interface LAN dan WAN aktif",
      detail:
        "Pasang IP 192.168.1.1/24 di sisi LAN dan 203.0.113.2/30 di sisi ISP, lalu nyalakan keduanya.",
      hints: [
        "Interface Cisco mati secara default, jadi jangan lupa no shutdown.",
        "Link ke ISP memakai /30, netmask-nya 255.255.255.252.",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.1.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "203.0.113.2/30" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
      ],
    },
    {
      id: "route",
      title: "Router punya jalan ke internet",
      detail:
        "Buat default route lewat ISP (203.0.113.1) sehingga router bisa menjangkau 8.8.8.8.",
      hints: [
        "Default route: ip route 0.0.0.0 0.0.0.0 <next-hop>.",
        "Uji dari router dengan ping 8.8.8.8.",
      ],
      checks: [
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "203.0.113.1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
      ],
    },
    {
      id: "nat",
      title: "PAT aktif di interface ISP",
      detail:
        "Aktifkan NAT overload agar alamat LAN diterjemahkan ke IP publik router di interface sisi ISP.",
      hints: [
        "Tandai sisi dalam dan luar: ip nat inside pada interface LAN, ip nat outside pada interface ISP.",
        "Buat ACL untuk jaringan LAN, lalu ip nat inside source list <acl> interface <if> overload.",
        "Periksa hasilnya dengan show ip nat translations.",
      ],
      checks: [{ type: "nat-masq", device: "r1", iface: "GigabitEthernet0/1" }],
    },
    {
      id: "online",
      title: "Semua PC bisa membuka internet",
      detail: "PC-1 dan PC-2 harus sama-sama bisa menjangkau internet.",
      hints: [
        "Uji dari kedua PC, bukan hanya satu.",
        "Jika gagal, periksa sisi inside dan outside serta ACL NAT-nya.",
      ],
      checks: [
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "pc2", to: "8.8.8.8" },
      ],
    },
  ],
};
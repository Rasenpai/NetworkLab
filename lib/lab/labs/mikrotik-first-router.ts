import type { LabSpec } from "../types";

export const mikrotikFirstRouter: LabSpec = {
  id: "mikrotik-first-router",
  title: "Setup Router Pertama via Winbox",
  vendor: "MikroTik",
  level: "Beginner",
  kind: "Simulasi",
  description: "Reset, set identity, IP address, akses internet dasar.",
  minutes: 30,
  intro:
    "Router R1 baru datang dengan konfigurasi sisa pemakaian lama. Siapkan R1 sampai bisa mengakses internet lewat ISP.\n" +
    "Di simulator ini kamu memakai terminal, setara dengan New Terminal di Winbox.\n\n" +
    "Data dari ISP: IP ISP 203.0.113.1, IP untuk R1 203.0.113.2/30, DNS 8.8.8.8.",
  devices: [
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      hostname: "MikroTik-Lama",
      x: 200,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2", ip: "192.168.88.1/24" }],
      routes: [{ dst: "172.16.0.0/16", via: "192.168.88.2" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 460,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [{ a: ["r1", "ether1"], b: ["isp", "ge0"] }],
  tasks: [
    {
      id: "reset",
      title: "Bersihkan konfigurasi lama",
      detail:
        "R1 masih punya IP di ether2 dan sebuah route sisa. Kosongkan semuanya.",
      hints: [
        "/system reset-configuration no-defaults=yes skip-backup=yes",
        "Periksa hasilnya dengan /ip address print dan /ip route print",
      ],
      checks: [
        { type: "iface-no-ip", device: "r1", iface: "ether2" },
        { type: "no-route", device: "r1", dst: "172.16.0.0/16" },
      ],
    },
    {
      id: "identity",
      title: "Beri nama router",
      detail: "Ubah identity router menjadi R1-Kantor.",
      hints: ["/system identity set name=R1-Kantor"],
      checks: [{ type: "hostname", device: "r1", equals: "R1-Kantor" }],
    },
    {
      id: "wan-ip",
      title: "Pasang IP di sisi ISP",
      detail: "Pasang 203.0.113.2/30 pada ether1, yang terhubung ke ISP.",
      hints: ["/ip address add address=203.0.113.2/30 interface=ether1"],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "203.0.113.2/30" },
        { type: "iface-up", device: "r1", iface: "ether1" },
      ],
    },
    {
      id: "default-route",
      title: "Tambah default route",
      detail: "Arahkan semua trafik keluar ke gateway ISP 203.0.113.1.",
      hints: ["/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1"],
      checks: [
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "203.0.113.1" },
      ],
    },
    {
      id: "internet",
      title: "Atur DNS dan uji internet",
      detail: "Set DNS ke 8.8.8.8, lalu pastikan R1 bisa ping ke internet.",
      hints: [
        "/ip dns set servers=8.8.8.8",
        "/ping 8.8.8.8",
        "/ping google.com",
      ],
      checks: [
        { type: "dns", device: "r1", server: "8.8.8.8" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
      ],
    },
  ],
};
import type { LabSpec } from "../types";

export const mikrotikFirewallNat: LabSpec = {
  id: "mikrotik-firewall-nat",
  title: "Firewall Filter & NAT Masquerade",
  vendor: "MikroTik",
  level: "Intermediate",
  kind: "Simulasi",
  description: "Lindungi router dan berikan akses internet ke jaringan lokal.",
  minutes: 50,
  intro:
    "R1 adalah gateway kantor dengan dua LAN: LAN1 (PC1) di ether2 dan LAN2 (PC2) di ether3. IP LAN sudah terpasang, tetapi R1 belum tersambung ke ISP.\n\n" +
    "Hubungkan R1 ke internet, bagikan akses ke kedua LAN dengan NAT masquerade, lalu batasi LAN2 agar tidak bisa mengakses LAN1 (tetapi PC1 tetap bisa ke PC2).\n\n" +
    "Data jaringan: IP ISP 203.0.113.1, IP WAN R1 203.0.113.2/30, LAN1 192.168.10.0/24, LAN2 192.168.20.0/24, IP PC1 192.168.10.10, IP PC2 192.168.20.10.\n\n" +
    "Catatan simulator: firewall hanya mendukung chain=forward dan uji ping (ICMP).",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC1",
      x: 70,
      y: 70,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC2",
      x: 70,
      y: 210,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.20.1" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      x: 280,
      y: 140,
      ifaces: [
        { name: "ether1" },
        { name: "ether2", ip: "192.168.10.1/24" },
        { name: "ether3", ip: "192.168.20.1/24" },
      ],
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
    { a: ["pc1", "eth0"], b: ["r1", "ether2"] },
    { a: ["pc2", "eth0"], b: ["r1", "ether3"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "wan",
      title: "Sambungkan R1 ke ISP",
      detail:
        "Pasang IP WAN di ether1 dan default route ke ISP. R1 sendiri harus bisa ping ke internet.",
      hints: [
        "/ip address add address=203.0.113.2/30 interface=ether1",
        "/ip route add dst-address=0.0.0.0/0 gateway=203.0.113.1",
        "/ping 8.8.8.8",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "203.0.113.2/30" },
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "203.0.113.1" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
      ],
    },
    {
      id: "nat",
      title: "Aktifkan NAT masquerade",
      detail:
        "Sebelum NAT, PC masih timeout ke internet karena ISP tidak punya route balik ke IP privat. Tambahkan masquerade di interface WAN.",
      hints: [
        "PC1: ping 8.8.8.8 (timeout, ISP tidak tahu jalan balik ke 192.168.10.0/24)",
        "/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade",
        "Uji ulang dari PC1 dan PC2: ping 8.8.8.8",
      ],
      checks: [
        { type: "nat-masq", device: "r1", iface: "ether1" },
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "pc2", to: "8.8.8.8" },
      ],
    },
    {
      id: "filter",
      title: "Blokir LAN2 ke LAN1",
      detail:
        "PC2 tidak boleh menjangkau LAN1, tetapi PC1 tetap harus bisa ping ke PC2 dan kedua PC tetap bisa ke internet. Perhatikan: balasan PC2 ke PC1 juga melewati chain forward.",
      hints: [
        "/ip firewall filter add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.0/24 action=drop",
        "Coba PC1: ping 192.168.20.10. Gagal? Rule tanpa connection-state juga mencocokkan balasan PC2.",
        "Perbaiki: tambahkan connection-state=new pada rule drop, atau pasang rule accept connection-state=established,related di paling atas (place-before=0).",
        "Cek urutan rule dengan: /ip firewall filter print",
      ],
      checks: [
        { type: "no-ping", from: "pc2", to: "192.168.10.10" },
        { type: "ping", from: "pc1", to: "192.168.20.10" },
        { type: "ping", from: "pc2", to: "8.8.8.8" },
      ],
    },
  ],
};
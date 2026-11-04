import type { LabSpec } from "../types";

export const mikrotikTroubleshooting: LabSpec = {
  id: "mikrotik-troubleshooting",
  title: "Troubleshooting Kantor Cabang",
  vendor: "MikroTik",
  level: "Intermediate",
  kind: "Simulasi",
  description:
    "Cari dan perbaiki gangguan berlapis: interface, IP, gateway, route balik, NAT, dan DNS.",
  minutes: 60,
  intro:
    "Tiket masuk: \"PC1 di kantor cabang tidak bisa akses server pusat maupun internet.\" R1 adalah router cabang, R2 router pusat yang tersambung ke ISP dan server. Teknisi sebelumnya meninggalkan konfigurasi yang belum beres di beberapa tempat.\n\n" +
    "Data link: Jaringan R1-R2 10.0.0.0/30, IP R1 10.0.0.1, IP R2 10.0.0.2, WAN R2 203.0.113.2/30, IP ISP 203.0.113.1, DNS 8.8.8.8.\n\nData LAN: LAN cabang 192.168.10.0/24, Gateway cabang 192.168.10.1, PC1 192.168.10.10, LAN pusat 192.168.20.0/24, Gateway pusat 192.168.20.1, SRV 192.168.20.10.\n\n" +
    "Cara kerja: telusuri dari lapisan paling bawah ke atas (interface, IP, routing, NAT, DNS). Pakai /interface print, /ip address print, /ip route print, dan ping untuk menemukan titik putusnya, lalu perbaiki satu per satu. Animasi ping di topologi menunjukkan di router mana paket berhenti.\n\n" +
    "Catatan simulator: firewall hanya mendukung chain=forward dan uji ping (ICMP). Satu interface hanya boleh punya satu IP, jadi hapus IP yang salah sebelum memasang yang benar.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC1",
      x: 70,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      hostname: "R1-Cabang",
      x: 230,
      y: 140,
      ifaces: [
        { name: "ether1", ip: "10.0.0.1/30" },
        // Gangguan 1: LAN cabang dimatikan.
        { name: "ether2", ip: "192.168.10.1/24", adminDown: true },
      ],
      // Gangguan 3: gateway salah ketik (10.0.0.3, seharusnya 10.0.0.2).
      routes: [{ dst: "0.0.0.0/0", via: "10.0.0.3" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R2",
      hostname: "R2-Pusat",
      x: 410,
      y: 140,
      ifaces: [
        // Gangguan 2: IP link salah subnet (seharusnya 10.0.0.2/30).
        { name: "ether1", ip: "10.0.0.5/30" },
        { name: "ether2", ip: "203.0.113.2/30" },
        { name: "ether3", ip: "192.168.20.1/24" },
      ],
      routes: [{ dst: "0.0.0.0/0", via: "203.0.113.1" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 570,
      y: 60,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
    {
      id: "srv",
      kind: "pc",
      label: "SRV",
      x: 570,
      y: 220,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.20.1" }],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether1"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["isp", "ge0"] },
    { a: ["r2", "ether3"], b: ["srv", "eth0"] },
  ],
  tasks: [
    {
      id: "l1",
      title: "Hidupkan interface LAN cabang",
      detail:
        "PC1 bahkan tidak bisa menjangkau gateway-nya. Periksa status interface R1: tanda X berarti interface dimatikan.",
      hints: [
        "R1: /interface print (cari flag X di ether2)",
        "R1: /interface enable ether2",
        "PC1: ping 192.168.10.1",
      ],
      checks: [
        { type: "iface-up", device: "r1", iface: "ether2" },
        { type: "ping", from: "pc1", to: "192.168.10.1" },
      ],
    },
    {
      id: "link",
      title: "Perbaiki IP link R1-R2",
      detail:
        "R1 tidak bisa ping R2 padahal kabel tersambung. Bandingkan IP di kedua ujung link: keduanya harus berada di subnet yang sama.",
      hints: [
        "R1: /ping 10.0.0.2 (timeout)",
        "R2: /ip address print (ether1 memakai 10.0.0.5/30, subnet berbeda dari R1)",
        "R2: /ip address remove 0",
        "R2: /ip address add address=10.0.0.2/30 interface=ether1",
      ],
      checks: [
        { type: "iface-ip", device: "r2", iface: "ether1", ip: "10.0.0.2/30" },
        { type: "ping", from: "r1", to: "10.0.0.2" },
        { type: "ping", from: "r2", to: "10.0.0.1" },
      ],
    },
    {
      id: "gateway",
      title: "Benahi default route R1",
      detail:
        "Link sudah hidup, tetapi R1 masih tidak bisa menjangkau jaringan pusat. Lihat gateway di default route R1: apakah itu IP R2 yang benar? Perhatikan, route bisa tampil aktif walaupun gateway-nya tidak ada.",
      hints: [
        "R1: /ip route print (gateway 10.0.0.3, bukan 10.0.0.2)",
        "R1: /ip route remove 0",
        "R1: /ip route add dst-address=0.0.0.0/0 gateway=10.0.0.2",
        "R1: /ping 192.168.20.10",
      ],
      checks: [
        { type: "route", device: "r1", dst: "0.0.0.0/0", via: "10.0.0.2" },
        { type: "ping", from: "r1", to: "192.168.20.10" },
      ],
    },
    {
      id: "return",
      title: "Tambah route balik ke LAN cabang",
      detail:
        "PC1 sudah sampai ke R2, tetapi ping PC1 ke SRV masih gagal. Paket pergi diterima SRV, namun balasannya salah jalan karena R2 tidak tahu letak LAN cabang. Perhatikan animasi ping: gagal di jalur pergi atau pulang?",
      hints: [
        "PC1: ping 192.168.20.10 (balasan hilang)",
        "R2: /ip route print (tidak ada route ke 192.168.10.0/24, paket balasan dibuang ke ISP lewat default route)",
        "R2: /ip route add dst-address=192.168.10.0/24 gateway=10.0.0.1",
      ],
      checks: [
        { type: "route", device: "r2", dst: "192.168.10.0/24", via: "10.0.0.1" },
        { type: "ping", from: "pc1", to: "192.168.20.10" },
      ],
    },
    {
      id: "nat",
      title: "Aktifkan NAT di R2 untuk akses internet",
      detail:
        "Jaringan internal sudah saling terhubung, tetapi PC1 dan SRV masih timeout ke internet. ISP tidak punya route balik ke IP privat. Pasang masquerade di interface WAN R2 (bukan di R1).",
      hints: [
        "PC1: ping 8.8.8.8 (timeout di jalur pulang)",
        "R2: /ip firewall nat add chain=srcnat out-interface=ether2 action=masquerade",
        "Uji ulang dari PC1 dan SRV: ping 8.8.8.8",
      ],
      checks: [
        { type: "nat-masq", device: "r2", iface: "ether2" },
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
    {
      id: "dns",
      title: "Atur DNS di R1",
      detail:
        "Tim cabang melapor ping ke nama domain gagal. Atur DNS server di R1 lalu uji resolusi nama.",
      hints: [
        "R1: /ping google.com (failure: dns name does not exist)",
        "R1: /ip dns set servers=8.8.8.8",
        "R1: /ping google.com",
      ],
      checks: [
        { type: "dns", device: "r1", server: "8.8.8.8" },
        { type: "ping", from: "r1", to: "8.8.8.8" },
      ],
    },
    {
      id: "policy",
      title: "Cegah SRV memulai koneksi ke LAN cabang",
      detail:
        "Kebijakan baru: LAN cabang boleh mengakses SRV, tetapi SRV tidak boleh memulai koneksi ke LAN cabang. Pasang rule di R2 tanpa memutus balasan ping dari PC1 ke SRV dan tanpa mengganggu akses internet.",
      hints: [
        "R2: /ip firewall filter add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.0/24 connection-state=new action=drop",
        "connection-state=new membuat rule hanya cocok dengan paket permintaan baru, jadi balasan (established) tetap lolos",
        "Uji: SRV ping 192.168.10.10 (diblokir), PC1 ping 192.168.20.10 (tetap berhasil)",
      ],
      checks: [
        { type: "no-ping", from: "srv", to: "192.168.10.10" },
        { type: "ping", from: "pc1", to: "192.168.20.10" },
        { type: "ping", from: "pc1", to: "8.8.8.8" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
  ],
};
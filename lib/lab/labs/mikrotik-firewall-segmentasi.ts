import type { LabSpec } from "../types";

export const mikrotikFirewallSegmentasi: LabSpec = {
  id: "mikrotik-firewall-segmentasi",
  title: "Segmentasi 3 LAN dengan Firewall",
  vendor: "MikroTik",
  level: "Intermediate",
  kind: "Simulasi",
  description:
    "Pisahkan LAN Guru, Siswa, dan Server dengan matriks akses lewat rule firewall forward.",
  minutes: 55,
  intro:
    "Sebuah sekolah memakai satu router R1 untuk tiga segmen: LAN Guru (ether2), LAN Siswa (ether3), dan LAN Server (ether4). IP semua interface, link ISP, dan default route sudah terpasang. Yang belum ada: NAT dan kebijakan akses antar segmen.\n\n" +
    "Data jaringan: WAN R1 203.0.113.2/30, IP ISP 203.0.113.1, LAN Guru 192.168.10.0/24, PC-Guru 192.168.10.10, LAN Siswa 192.168.20.0/24, PC-Siswa 192.168.20.10, LAN Server 192.168.30.0/24, SRV 192.168.30.10.\n\n" +
    "Kebijakan akses: Guru boleh ke Siswa dan ke Server. Siswa tidak boleh ke Guru maupun ke Server. Server tidak boleh memulai koneksi ke Guru maupun Siswa (tetapi balasan untuk koneksi dari Guru tetap harus lolos). Semua segmen boleh ke internet.\n\n" +
    "Ingat: firewall bekerja berurutan dari atas, rule pertama yang cocok yang menang. Balasan ping juga melewati chain forward, jadi rule drop tanpa memperhatikan connection-state bisa ikut memutus balasan.\n\n" +
    "Catatan simulator: firewall hanya mendukung chain=forward dan uji ping (ICMP).",
  devices: [
    {
      id: "guru",
      kind: "pc",
      label: "PC-Guru",
      x: 70,
      y: 40,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "siswa",
      kind: "pc",
      label: "PC-Siswa",
      x: 70,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.20.1" }],
    },
    {
      id: "srv",
      kind: "pc",
      label: "SRV",
      x: 70,
      y: 240,
      ifaces: [{ name: "eth0", ip: "192.168.30.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.30.1" }],
    },
    {
      id: "r1",
      kind: "mikrotik",
      label: "R1",
      x: 290,
      y: 140,
      ifaces: [
        { name: "ether1", ip: "203.0.113.2/30" },
        { name: "ether2", ip: "192.168.10.1/24" },
        { name: "ether3", ip: "192.168.20.1/24" },
        { name: "ether4", ip: "192.168.30.1/24" },
      ],
      routes: [{ dst: "0.0.0.0/0", via: "203.0.113.1" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 510,
      y: 140,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["guru", "eth0"], b: ["r1", "ether2"] },
    { a: ["siswa", "eth0"], b: ["r1", "ether3"] },
    { a: ["srv", "eth0"], b: ["r1", "ether4"] },
    { a: ["r1", "ether1"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "nat",
      title: "Aktifkan NAT masquerade",
      detail:
        "Semua segmen harus bisa ke internet. Saat ini PC masih timeout karena ISP tidak punya route balik ke IP privat.",
      hints: [
        "PC-Guru: ping 8.8.8.8 (timeout)",
        "R1: /ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade",
        "Uji ulang dari ketiga PC: ping 8.8.8.8",
      ],
      checks: [
        { type: "nat-masq", device: "r1", iface: "ether1" },
        { type: "ping", from: "guru", to: "8.8.8.8" },
        { type: "ping", from: "siswa", to: "8.8.8.8" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
    {
      id: "siswa-srv",
      title: "Blokir Siswa ke Server",
      detail:
        "Siswa tidak boleh menjangkau LAN Server, sementara Guru tetap bisa ke Server dan Siswa tetap bisa ke internet. Mulai dengan rule untuk balasan: rule accept established,related harus berada di paling atas chain forward, baru rule drop di bawahnya.",
      hints: [
        "R1: /ip firewall filter add chain=forward connection-state=established,related action=accept",
        "R1: /ip firewall filter add chain=forward src-address=192.168.20.0/24 dst-address=192.168.30.0/24 action=drop",
        "Periksa urutan: /ip firewall filter print",
        "Uji: PC-Siswa ping 192.168.30.10 (gagal), PC-Guru ping 192.168.30.10 (berhasil)",
      ],
      checks: [
        { type: "no-ping", from: "siswa", to: "192.168.30.10" },
        { type: "ping", from: "guru", to: "192.168.30.10" },
        { type: "ping", from: "siswa", to: "8.8.8.8" },
      ],
    },
    {
      id: "siswa-guru",
      title: "Blokir Siswa ke Guru",
      detail:
        "Siswa tidak boleh ke LAN Guru, tetapi Guru tetap boleh ping ke Siswa. Kalau ping Guru ke Siswa ikut gagal, balasan dari Siswa terkena rule drop: periksa apakah rule established,related ada di atas rule drop.",
      hints: [
        "R1: /ip firewall filter add chain=forward src-address=192.168.20.0/24 dst-address=192.168.10.0/24 action=drop",
        "Uji: PC-Siswa ping 192.168.10.10 (gagal), PC-Guru ping 192.168.20.10 (berhasil)",
        "Guru ke Siswa gagal? Letakkan rule established,related di paling atas: hapus dengan /ip firewall filter remove <no>, lalu tambah lagi dengan place-before=0",
      ],
      checks: [
        { type: "no-ping", from: "siswa", to: "192.168.10.10" },
        { type: "ping", from: "guru", to: "192.168.20.10" },
      ],
    },
    {
      id: "srv-out",
      title: "Cegah Server memulai koneksi ke LAN lain",
      detail:
        "Server yang diretas tidak boleh dipakai menyerang Guru atau Siswa. Blokir koneksi baru dari LAN Server ke kedua LAN itu. Balasan untuk koneksi dari Guru ke Server dan akses Server ke internet harus tetap jalan.",
      hints: [
        "R1: /ip firewall filter add chain=forward src-address=192.168.30.0/24 dst-address=192.168.10.0/24 action=drop",
        "R1: /ip firewall filter add chain=forward src-address=192.168.30.0/24 dst-address=192.168.20.0/24 action=drop",
        "Uji: SRV ping 192.168.10.10 (gagal), PC-Guru ping 192.168.30.10 (berhasil), SRV ping 8.8.8.8 (berhasil)",
      ],
      checks: [
        { type: "no-ping", from: "srv", to: "192.168.10.10" },
        { type: "no-ping", from: "srv", to: "192.168.20.10" },
        { type: "ping", from: "guru", to: "192.168.30.10" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
    {
      id: "matrix",
      title: "Verifikasi seluruh matriks akses",
      detail:
        "Uji semua arah sesuai kebijakan: Guru ke Siswa, Server, dan internet harus berhasil. Siswa ke Guru dan Server harus gagal, tetapi Siswa ke internet berhasil. Server ke Guru dan Siswa gagal, ke internet berhasil.",
      hints: [
        "Lihat urutan akhir rule: /ip firewall filter print",
        "Rule accept established,related harus nomor 0, lalu rule drop di bawahnya",
      ],
      checks: [
        { type: "ping", from: "guru", to: "192.168.20.10" },
        { type: "ping", from: "guru", to: "192.168.30.10" },
        { type: "ping", from: "guru", to: "8.8.8.8" },
        { type: "no-ping", from: "siswa", to: "192.168.10.10" },
        { type: "no-ping", from: "siswa", to: "192.168.30.10" },
        { type: "ping", from: "siswa", to: "8.8.8.8" },
        { type: "no-ping", from: "srv", to: "192.168.10.10" },
        { type: "no-ping", from: "srv", to: "192.168.20.10" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
  ],
};
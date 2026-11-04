import type { LabSpec } from "../types";

export const ciscoAcl: LabSpec = {
  id: "cisco-acl",
  title: "ACL Standard & Extended",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Simulasi",
  description:
    "Batasi akses antar jaringan dengan ACL dan uji hasilnya dari tiap segmen.",
  minutes: 55,
  intro:
    "Sebuah sekolah memakai satu router Cisco untuk tiga segmen: Guru, Siswa, dan Server. Saat ini semua segmen saling bisa mengakses. Pihak sekolah ingin akses dibatasi dengan ACL, tanpa mengubah alamat apa pun.\n\n" +
    "Data LAN Guru: Jaringan 192.168.10.0/24, Gateway 192.168.10.1 (GigabitEthernet0/0), PC-Guru 192.168.10.10/24.\n\n" +
    "Data LAN Siswa: Jaringan 192.168.20.0/24, Gateway 192.168.20.1 (GigabitEthernet0/1), PC-Siswa 192.168.20.10/24.\n\n" +
    "Data LAN Server: Jaringan 192.168.30.0/24, Gateway 192.168.30.1 (GigabitEthernet0/2), Server 192.168.30.10/24.\n\n" +
    "Kebutuhan akses: Guru boleh mengakses Siswa dan Server. Siswa tidak boleh mengakses Guru maupun Server, tetapi tetap bisa menjangkau gateway-nya sendiri.\n\n" +
    "Catatan: PC sudah ber-IP, tetapi interface router masih mati dan belum ber-IP.",
  devices: [
    {
      id: "guru",
      kind: "pc",
      label: "PC-Guru",
      x: 70,
      y: 50,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
    },
    {
      id: "siswa",
      kind: "pc",
      label: "PC-Siswa",
      x: 70,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
    },
    {
      id: "server",
      kind: "pc",
      label: "Server",
      x: 70,
      y: 230,
      ifaces: [{ name: "eth0", ip: "192.168.30.10/24" }],
    },
    {
      id: "r1",
      kind: "cisco",
      role: "router",
      label: "Router",
      hostname: "Router",
      x: 340,
      y: 140,
      ifaces: [
        { name: "GigabitEthernet0/0", adminDown: true },
        { name: "GigabitEthernet0/1", adminDown: true },
        { name: "GigabitEthernet0/2", adminDown: true },
      ],
    },
  ],
  links: [
    { a: ["guru", "eth0"], b: ["r1", "GigabitEthernet0/0"] },
    { a: ["siswa", "eth0"], b: ["r1", "GigabitEthernet0/1"] },
    { a: ["server", "eth0"], b: ["r1", "GigabitEthernet0/2"] },
  ],
  tasks: [
    {
      id: "interface",
      title: "Semua interface router aktif dan ber-IP",
      detail:
        "Pasang IP gateway pada ketiga interface sesuai data, lalu nyalakan semuanya.",
      hints: [
        "Interface Cisco mati secara default, jadi jangan lupa no shutdown.",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/1", ip: "192.168.20.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/2", ip: "192.168.30.1/24" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/1" },
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/2" },
      ],
    },
    {
      id: "guru",
      title: "Guru bisa mengakses Siswa dan Server",
      detail: "PC-Guru harus tetap bisa menjangkau LAN Siswa dan Server.",
      hints: [
        "Pastikan ACL yang kamu buat tidak ikut memblokir trafik Guru.",
      ],
      checks: [
        { type: "ping", from: "guru", to: "192.168.20.10" },
        { type: "ping", from: "guru", to: "192.168.30.10" },
      ],
    },
    {
      id: "siswa",
      title: "Siswa dibatasi",
      detail:
        "PC-Siswa tidak boleh menjangkau LAN Guru dan Server, tetapi masih bisa menjangkau gateway-nya sendiri.",
      hints: [
        "Pilih jenis ACL: standard dicocokkan dari alamat sumber saja, extended bisa menyebut sumber dan tujuan.",
        "Pasang ACL pada interface dengan ip access-group <acl> in/out. Letakkan sedekat mungkin dengan sumber untuk ACL extended.",
        "Di akhir ACL ada deny any implisit. Pikirkan apakah itu mengganggu trafik yang masih diizinkan.",
        "Periksa dengan show access-lists.",
      ],
      checks: [
        { type: "ping", from: "siswa", to: "192.168.20.1" },
        { type: "no-ping", from: "siswa", to: "192.168.10.10" },
        { type: "no-ping", from: "siswa", to: "192.168.30.10" },
      ],
    },
  ],
};
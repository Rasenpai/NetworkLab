import type { LabSpec } from "../types";

export const ciscoRouterOnAStickDhcp: LabSpec = {
  id: "cisco-router-on-a-stick-dhcp",
  title: "Router-on-a-Stick dengan DHCP per VLAN",
  vendor: "Cisco",
  level: "Intermediate",
  kind: "Simulasi",
  description:
    "Pisahkan dua VLAN, hubungkan lewat satu link trunk, dan bagikan IP otomatis dari router.",
  minutes: 60,
  intro:
    "Sebuah kantor memakai satu switch dan satu router Cisco. Staf dan Tamu harus berada di VLAN berbeda, tetapi tetap bisa saling berkomunikasi lewat router yang hanya memakai satu kabel ke switch. Karyawan tidak mau mengatur alamat manual, jadi router juga harus menjadi DHCP server untuk kedua VLAN.\n\n" +
    "Data VLAN Staf: VLAN 10 bernama Staf, Jaringan 192.168.10.0/24, Gateway 192.168.10.1, PC-Staf di FastEthernet0/1.\n\n" +
    "Data VLAN Tamu: VLAN 20 bernama Tamu, Jaringan 192.168.20.0/24, Gateway 192.168.20.1, PC-Tamu di FastEthernet0/2.\n\n" +
    "Data trunk: FastEthernet0/24 pada switch ke GigabitEthernet0/0 pada router.\n\n" +
    "Data DHCP: alamat .1 sampai .9 di tiap jaringan dicadangkan dan tidak dibagikan. Perangkat pertama di tiap VLAN harus mendapat alamat .10.\n\n" +
    "Catatan: interface Cisco aktif-nya harus kamu nyalakan sendiri.",
  devices: [
    {
      id: "pc1",
      kind: "pc",
      label: "PC-Staf",
      x: 70,
      y: 70,
      ifaces: [{ name: "eth0" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC-Tamu",
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
        { name: "FastEthernet0/24" },
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
    { a: ["sw1", "FastEthernet0/24"], b: ["r1", "GigabitEthernet0/0"] },
  ],
  tasks: [
    {
      id: "vlan",
      title: "VLAN dan port switch",
      detail:
        "Buat VLAN 10 (Staf) dan VLAN 20 (Tamu), pasang PC ke VLAN masing-masing, dan jadikan FastEthernet0/24 trunk untuk kedua VLAN.",
      hints: [
        "Buat VLAN: vlan <id>, lalu name <nama>.",
        "Port PC: switchport mode access dan switchport access vlan <id>.",
        "Port ke router: switchport mode trunk.",
      ],
      checks: [
        { type: "vlan", device: "sw1", id: 10, name: "Staf" },
        { type: "vlan", device: "sw1", id: 20, name: "Tamu" },
        { type: "access-port", device: "sw1", iface: "FastEthernet0/1", vlan: 10 },
        { type: "access-port", device: "sw1", iface: "FastEthernet0/2", vlan: 20 },
        { type: "trunk-port", device: "sw1", iface: "FastEthernet0/24", vlans: [10, 20] },
      ],
    },
    {
      id: "subif",
      title: "Router punya gateway per VLAN",
      detail:
        "Nyalakan GigabitEthernet0/0, lalu buat satu subinterface untuk tiap VLAN dengan IP gateway sesuai data.",
      hints: [
        "Interface fisik harus no shutdown agar subinterface ikut aktif.",
        "Subinterface: interface GigabitEthernet0/0.10, lalu encapsulation dot1Q 10 dan ip address.",
      ],
      checks: [
        { type: "iface-up", device: "r1", iface: "GigabitEthernet0/0" },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.10", vlan: 10 },
        { type: "iface-vlan", device: "r1", iface: "GigabitEthernet0/0.20", vlan: 20 },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.10", ip: "192.168.10.1/24" },
        { type: "iface-ip", device: "r1", iface: "GigabitEthernet0/0.20", ip: "192.168.20.1/24" },
      ],
    },
    {
      id: "dhcp",
      title: "DHCP server untuk kedua VLAN",
      detail:
        "Buat dua DHCP pool dengan gateway sesuai data, dan cadangkan alamat .1 sampai .9 di tiap jaringan.",
      hints: [
        "Cadangkan alamat dengan ip dhcp excluded-address <awal> <akhir>.",
        "Satu pool per jaringan, masing-masing dengan network dan default-router.",
      ],
      checks: [
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.10" },
        { type: "dhcp-server", device: "r1", iface: "GigabitEthernet0/0.20" },
      ],
    },
    {
      id: "client",
      title: "PC mendapat alamat otomatis",
      detail:
        "Kedua PC harus menerima IP otomatis sesuai VLAN-nya, dengan alamat pertama .10.",
      hints: [
        "Minta alamat dari tiap PC lewat DHCP.",
        "Jika PC mendapat alamat dari jaringan yang salah, periksa VLAN pada port switch.",
      ],
      checks: [
        { type: "has-lease", device: "pc1" },
        { type: "iface-ip", device: "pc1", iface: "eth0", ip: "192.168.10.10/24" },
        { type: "has-lease", device: "pc2" },
        { type: "iface-ip", device: "pc2", iface: "eth0", ip: "192.168.20.10/24" },
      ],
    },
    {
      id: "antarvlan",
      title: "Antar VLAN saling terhubung",
      detail: "PC-Staf dan PC-Tamu harus bisa saling ping lewat router.",
      hints: [
        "Uji dari kedua arah.",
        "Kalau gagal, periksa trunk, encapsulation, dan gateway tiap PC.",
      ],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.20.10" },
        { type: "ping", from: "pc2", to: "192.168.10.10" },
      ],
    },
  ],
};
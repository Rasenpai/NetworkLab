import type { LabSpec } from "../types";

export const mikrotikWireguardHub: LabSpec = {
  id: "mikrotik-wireguard-hub",
  title: "WireGuard Hub-and-Spoke 3 Site",
  vendor: "MikroTik",
  level: "Advanced",
  kind: "Simulasi",
  description:
    "Hubungkan dua cabang ke kantor pusat lewat WireGuard, termasuk trafik antar cabang dan internet lewat hub.",
  minutes: 90,
  intro:
    "Kantor pusat (hub, R-Hub) punya server dan koneksi internet. Cabang A (R-A) dan Cabang B (R-B) tidak punya internet sendiri: semua trafik mereka, termasuk antar cabang dan ke internet, dikirim lewat tunnel WireGuard ke hub. Link underlay dan IP semua LAN sudah terpasang, tugasmu membangun tunnel dan routing-nya.\n\n" +
    "Data underlay: R-Hub ether1 198.51.100.1/30, R-A ether1 198.51.100.2/30, R-Hub ether2 192.0.2.1/30, R-B ether1 192.0.2.2/30, WAN R-Hub ether4 203.0.113.2/30, IP ISP 203.0.113.1.\n\n" +
    "Data LAN: LAN Cabang A 192.168.10.0/24, PC-A 192.168.10.10, LAN Cabang B 192.168.20.0/24, PC-B 192.168.20.10, LAN Pusat 192.168.100.0/24, SRV 192.168.100.10.\n\n" +
    "Data tunnel: wg0 R-Hub 10.10.10.1/24, wg0 R-A 10.10.10.2/24, wg0 R-B 10.10.10.3/24, Port WireGuard 13231.\n\n" +
    "Konsep kunci: allowed-address di WireGuard berfungsi seperti tabel routing sekaligus filter. Router memilih peer tujuan berdasarkan allowed-address, dan menolak paket dari peer yang alamat sumbernya tidak ada di allowed-address peer itu. Di hub, peer tiap cabang cukup memuat LAN cabang itu. Di cabang, peer hub harus memuat semua tujuan yang boleh lewat hub.\n\n" +
    "Catatan simulator: tunnel dinilai dari public key, endpoint, port, dan allowed-address, sehingga peer di hub juga wajib memakai endpoint-address milik cabang. Firewall hanya mendukung chain=forward dan uji ping (ICMP).",
  devices: [
    {
      id: "pca",
      kind: "pc",
      label: "PC-A",
      x: 50,
      y: 60,
      ifaces: [{ name: "eth0", ip: "192.168.10.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.10.1" }],
    },
    {
      id: "ra",
      kind: "mikrotik",
      label: "R-A",
      hostname: "R-A",
      x: 200,
      y: 60,
      ifaces: [
        { name: "ether1", ip: "198.51.100.2/30" },
        { name: "ether2", ip: "192.168.10.1/24" },
      ],
    },
    {
      id: "rh",
      kind: "mikrotik",
      label: "R-Hub",
      hostname: "R-Hub",
      x: 350,
      y: 140,
      ifaces: [
        { name: "ether1", ip: "198.51.100.1/30" },
        { name: "ether2", ip: "192.0.2.1/30" },
        { name: "ether3", ip: "192.168.100.1/24" },
        { name: "ether4", ip: "203.0.113.2/30" },
      ],
      routes: [{ dst: "0.0.0.0/0", via: "203.0.113.1" }],
    },
    {
      id: "rb",
      kind: "mikrotik",
      label: "R-B",
      hostname: "R-B",
      x: 200,
      y: 220,
      ifaces: [
        { name: "ether1", ip: "192.0.2.2/30" },
        { name: "ether2", ip: "192.168.20.1/24" },
      ],
    },
    {
      id: "pcb",
      kind: "pc",
      label: "PC-B",
      x: 50,
      y: 220,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.20.1" }],
    },
    {
      id: "srv",
      kind: "pc",
      label: "SRV",
      x: 520,
      y: 60,
      ifaces: [{ name: "eth0", ip: "192.168.100.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.100.1" }],
    },
    {
      id: "isp",
      kind: "cloud",
      label: "ISP / Internet",
      x: 520,
      y: 220,
      ifaces: [{ name: "ge0", ip: "203.0.113.1/30" }],
      ownedIps: ["8.8.8.8", "1.1.1.1"],
    },
  ],
  links: [
    { a: ["pca", "eth0"], b: ["ra", "ether2"] },
    { a: ["ra", "ether1"], b: ["rh", "ether1"] },
    { a: ["rh", "ether2"], b: ["rb", "ether1"] },
    { a: ["rb", "ether2"], b: ["pcb", "eth0"] },
    { a: ["rh", "ether3"], b: ["srv", "eth0"] },
    { a: ["rh", "ether4"], b: ["isp", "ge0"] },
  ],
  tasks: [
    {
      id: "wg-if",
      title: "Buat interface WireGuard di ketiga router",
      detail:
        "Buat wg0 dengan port 13231 di R-Hub, R-A, dan R-B, lalu beri IP tunnel dari subnet 10.10.10.0/24. Public key dibuat otomatis.",
      hints: [
        "Di ketiga router: /interface wireguard add name=wg0 listen-port=13231",
        "R-Hub: /ip address add address=10.10.10.1/24 interface=wg0",
        "R-A: /ip address add address=10.10.10.2/24 interface=wg0",
        "R-B: /ip address add address=10.10.10.3/24 interface=wg0",
        "Lihat public key: /interface wireguard print",
      ],
      checks: [
        { type: "wg-iface", device: "rh", name: "wg0", port: 13231 },
        { type: "wg-iface", device: "ra", name: "wg0", port: 13231 },
        { type: "wg-iface", device: "rb", name: "wg0", port: 13231 },
        { type: "iface-ip", device: "rh", iface: "wg0", ip: "10.10.10.1/24" },
        { type: "iface-ip", device: "ra", iface: "wg0", ip: "10.10.10.2/24" },
        { type: "iface-ip", device: "rb", iface: "wg0", ip: "10.10.10.3/24" },
      ],
    },
    {
      id: "peers",
      title: "Daftarkan peer: hub dengan dua cabang",
      detail:
        "R-Hub butuh dua peer (satu per cabang) pada interface wg0 yang sama, masing-masing dengan allowed-address LAN cabang dan IP tunnel-nya. Tiap cabang punya satu peer: hub, dengan allowed-address subnet tunnel. Endpoint peer menunjuk ke IP underlay lawan.",
      hints: [
        "Salin public key tiap router dari /interface wireguard print",
        'R-Hub: /interface wireguard peers add interface=wg0 public-key="<key R-A>" allowed-address=192.168.10.0/24,10.10.10.2/32 endpoint-address=198.51.100.2 endpoint-port=13231',
        'R-Hub: /interface wireguard peers add interface=wg0 public-key="<key R-B>" allowed-address=192.168.20.0/24,10.10.10.3/32 endpoint-address=192.0.2.2 endpoint-port=13231',
        'R-A: /interface wireguard peers add interface=wg0 public-key="<key R-Hub>" allowed-address=10.10.10.0/24 endpoint-address=198.51.100.1 endpoint-port=13231',
        'R-B: /interface wireguard peers add interface=wg0 public-key="<key R-Hub>" allowed-address=10.10.10.0/24 endpoint-address=192.0.2.1 endpoint-port=13231',
        "Uji: R-Hub /ping 10.10.10.2 dan /ping 10.10.10.3, R-A /ping 10.10.10.1",
      ],
      checks: [
        { type: "wg-tunnel", device: "ra", iface: "wg0" },
        { type: "wg-tunnel", device: "rb", iface: "wg0" },
        { type: "ping", from: "rh", to: "10.10.10.2" },
        { type: "ping", from: "rh", to: "10.10.10.3" },
        { type: "ping", from: "ra", to: "10.10.10.1" },
        { type: "ping", from: "rb", to: "10.10.10.1" },
      ],
    },
    {
      id: "hub-lan",
      title: "Hubungkan LAN cabang dengan LAN pusat",
      detail:
        "Tambahkan route ke LAN cabang di hub dan route ke LAN pusat di tiap cabang, semuanya lewat wg0. Di cabang, allowed-address peer hub juga harus memuat LAN pusat, kalau tidak paket dibuang oleh WireGuard.",
      hints: [
        "R-Hub: /ip route add dst-address=192.168.10.0/24 gateway=wg0",
        "R-Hub: /ip route add dst-address=192.168.20.0/24 gateway=wg0",
        "R-A dan R-B: /ip route add dst-address=192.168.100.0/24 gateway=wg0",
        "R-A dan R-B: /interface wireguard peers set 0 allowed-address=10.10.10.0/24,192.168.100.0/24",
        "Uji: PC-A ping 192.168.100.10, PC-B ping 192.168.100.1, SRV ping 192.168.20.10",
      ],
      checks: [
        { type: "route", device: "rh", dst: "192.168.10.0/24", via: "wg0" },
        { type: "route", device: "rh", dst: "192.168.20.0/24", via: "wg0" },
        { type: "route", device: "ra", dst: "192.168.100.0/24", via: "wg0" },
        { type: "route", device: "rb", dst: "192.168.100.0/24", via: "wg0" },
        { type: "ping", from: "pca", to: "192.168.100.10" },
        { type: "ping", from: "pcb", to: "192.168.100.1" },
        { type: "ping", from: "srv", to: "192.168.10.10" },
        { type: "ping", from: "srv", to: "192.168.20.10" },
      ],
    },
    {
      id: "spoke-spoke",
      title: "Buka jalur antar cabang lewat hub",
      detail:
        "Cabang A dan B belum bisa saling ping karena allowed-address peer hub di tiap cabang belum memuat LAN cabang lain. Tambahkan LAN seberang ke allowed-address dan pasang route-nya. Paket akan masuk ke hub lewat tunnel lalu keluar lagi lewat tunnel cabang lawan.",
      hints: [
        "PC-A: ping 192.168.20.10 (gagal), lihat animasi ping untuk titik berhentinya",
        "R-A: /interface wireguard peers set 0 allowed-address=10.10.10.0/24,192.168.100.0/24,192.168.20.0/24",
        "R-B: /interface wireguard peers set 0 allowed-address=10.10.10.0/24,192.168.100.0/24,192.168.10.0/24",
        "R-A: /ip route add dst-address=192.168.20.0/24 gateway=wg0",
        "R-B: /ip route add dst-address=192.168.10.0/24 gateway=wg0",
      ],
      checks: [
        { type: "route", device: "ra", dst: "192.168.20.0/24", via: "wg0" },
        { type: "route", device: "rb", dst: "192.168.10.0/24", via: "wg0" },
        { type: "ping", from: "pca", to: "192.168.20.10" },
        { type: "ping", from: "pcb", to: "192.168.10.10" },
      ],
    },
    {
      id: "internet",
      title: "Internet semua site lewat hub",
      detail:
        "Cabang tidak punya internet sendiri. Pasang NAT masquerade di WAN hub, arahkan default route cabang ke wg0, dan ubah allowed-address peer hub di cabang menjadi 0.0.0.0/0 supaya WireGuard mau menerima balasan dari alamat internet mana pun. Server pusat juga harus tetap bisa ke internet.",
      hints: [
        "R-Hub: /ip firewall nat add chain=srcnat out-interface=ether4 action=masquerade",
        "R-A dan R-B: /interface wireguard peers set 0 allowed-address=0.0.0.0/0",
        "R-A dan R-B: /ip route add dst-address=0.0.0.0/0 gateway=wg0",
        "Uji: PC-A, PC-B, dan SRV: ping 8.8.8.8",
        "Ping dari PC-A ke 8.8.8.8 tidak ada balasan? Cek allowed-address di R-A: sumber balasan (8.8.8.8) harus ada di sana",
      ],
      checks: [
        { type: "nat-masq", device: "rh", iface: "ether4" },
        { type: "route", device: "ra", dst: "0.0.0.0/0", via: "wg0" },
        { type: "route", device: "rb", dst: "0.0.0.0/0", via: "wg0" },
        { type: "ping", from: "pca", to: "8.8.8.8" },
        { type: "ping", from: "pcb", to: "8.8.8.8" },
        { type: "ping", from: "srv", to: "8.8.8.8" },
      ],
    },
    {
      id: "policy",
      title: "Isolasi Cabang B dari server pusat",
      detail:
        "Kebijakan baru: Cabang B tidak boleh mengakses LAN Pusat. Namun Cabang B tetap boleh ke Cabang A dan internet, Cabang A tetap boleh ke server, dan SRV tetap boleh memulai koneksi ke Cabang B. Pasang rule di hub dengan memperhatikan balasan: rule drop yang tidak memakai connection-state juga memutus balasan SRV ke PC-B.",
      hints: [
        "R-Hub: /ip firewall filter add chain=forward src-address=192.168.20.0/24 dst-address=192.168.100.0/24 connection-state=new action=drop",
        "Alternatif: pasang rule accept connection-state=established,related di paling atas (place-before=0), lalu rule drop tanpa connection-state",
        "Uji: PC-B ping 192.168.100.10 (gagal), SRV ping 192.168.20.10 (berhasil), PC-A ping 192.168.100.10 (berhasil)",
      ],
      checks: [
        { type: "no-ping", from: "pcb", to: "192.168.100.10" },
        { type: "ping", from: "srv", to: "192.168.20.10" },
        { type: "ping", from: "pca", to: "192.168.100.10" },
        { type: "ping", from: "pcb", to: "192.168.10.10" },
        { type: "ping", from: "pcb", to: "8.8.8.8" },
      ],
    },
  ],
};
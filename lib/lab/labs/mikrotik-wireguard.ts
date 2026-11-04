import type { LabSpec } from "../types";

export const mikrotikWireguard: LabSpec = {
  id: "mikrotik-wireguard",
  title: "Site-to-Site VPN WireGuard",
  vendor: "MikroTik",
  level: "Advanced",
  kind: "Simulasi",
  description: "Hubungkan dua site lewat tunnel WireGuard dengan routing.",
  minutes: 60,
  intro:
    "Dua kantor (Site A di belakang R1, Site B di belakang R2) terhubung lewat link WAN. Bangun tunnel WireGuard supaya LAN kedua kantor saling terjangkau lewat tunnel.\n\n" +
    "Data WAN: R1 ether1 203.0.113.1/30, R2 ether1 203.0.113.2/30.\n\n" +
    "Data LAN: LAN A 192.168.10.0/24, LAN B 192.168.20.0/24, PC1 192.168.10.10, PC2 192.168.20.10.\n\n" +
    "Data tunnel: wg0 R1 10.10.10.1/30, wg0 R2 10.10.10.2/30, Port WireGuard 13231.\n\n" +
    "Alur kerja: buat interface wg0 di tiap router, lihat public key dengan /interface wireguard print, lalu daftarkan key itu sebagai peer di router lawan. IP LAN dan PC sudah dikonfigurasi.\n\n" +
    "Catatan simulator: firewall tidak dipakai di lab ini. Tunnel dinilai dari public key, endpoint, port, dan allowed-address.",
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
      x: 230,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2", ip: "192.168.10.1/24" }],
    },
    {
      id: "r2",
      kind: "mikrotik",
      label: "R2",
      x: 410,
      y: 140,
      ifaces: [{ name: "ether1" }, { name: "ether2", ip: "192.168.20.1/24" }],
    },
    {
      id: "pc2",
      kind: "pc",
      label: "PC2",
      x: 570,
      y: 140,
      ifaces: [{ name: "eth0", ip: "192.168.20.10/24" }],
      routes: [{ dst: "0.0.0.0/0", via: "192.168.20.1" }],
    },
  ],
  links: [
    { a: ["pc1", "eth0"], b: ["r1", "ether2"] },
    { a: ["r1", "ether1"], b: ["r2", "ether1"] },
    { a: ["r2", "ether2"], b: ["pc2", "eth0"] },
  ],
  tasks: [
    {
      id: "wan",
      title: "Pasang IP WAN di kedua router",
      detail: "Tunnel berjalan di atas link WAN, jadi R1 dan R2 harus bisa saling ping lewat ether1.",
      hints: [
        "R1: /ip address add address=203.0.113.1/30 interface=ether1",
        "R2: /ip address add address=203.0.113.2/30 interface=ether1",
        "R1: /ping 203.0.113.2",
      ],
      checks: [
        { type: "iface-ip", device: "r1", iface: "ether1", ip: "203.0.113.1/30" },
        { type: "iface-ip", device: "r2", iface: "ether1", ip: "203.0.113.2/30" },
        { type: "ping", from: "r1", to: "203.0.113.2" },
        { type: "ping", from: "r2", to: "203.0.113.1" },
      ],
    },
    {
      id: "wg-if",
      title: "Buat interface WireGuard",
      detail:
        "Buat wg0 dengan port 13231 di kedua router, lalu beri IP tunnel. Public key dibuat otomatis.",
      hints: [
        "/interface wireguard add name=wg0 listen-port=13231",
        "R1: /ip address add address=10.10.10.1/30 interface=wg0",
        "R2: /ip address add address=10.10.10.2/30 interface=wg0",
        "Lihat public key: /interface wireguard print",
      ],
      checks: [
        { type: "wg-iface", device: "r1", name: "wg0", port: 13231 },
        { type: "wg-iface", device: "r2", name: "wg0", port: 13231 },
        { type: "iface-ip", device: "r1", iface: "wg0", ip: "10.10.10.1/30" },
        { type: "iface-ip", device: "r2", iface: "wg0", ip: "10.10.10.2/30" },
      ],
    },
    {
      id: "wg-peer",
      title: "Daftarkan peer di kedua sisi",
      detail:
        "Tiap router memakai public key lawan sebagai peer. Allowed-address memuat LAN seberang dan IP tunnel lawan. Endpoint menunjuk ke IP WAN lawan.",
      hints: [
        "Salin public key R2 dari /interface wireguard print di R2, lalu pakai di R1",
        'R1: /interface wireguard peers add interface=wg0 public-key="<key R2>" allowed-address=192.168.20.0/24,10.10.10.2/32 endpoint-address=203.0.113.2 endpoint-port=13231',
        'R2: /interface wireguard peers add interface=wg0 public-key="<key R1>" allowed-address=192.168.10.0/24,10.10.10.1/32 endpoint-address=203.0.113.1 endpoint-port=13231',
        "Cek: /interface wireguard peers print (last-handshake harus bukan never), lalu R1: /ping 10.10.10.2",
      ],
      checks: [
        { type: "wg-tunnel", device: "r1", iface: "wg0" },
        { type: "wg-tunnel", device: "r2", iface: "wg0" },
        { type: "ping", from: "r1", to: "10.10.10.2" },
        { type: "ping", from: "r2", to: "10.10.10.1" },
      ],
    },
    {
      id: "routes",
      title: "Arahkan LAN seberang lewat tunnel",
      detail:
        "WireGuard di RouterOS tidak membuat route otomatis. Tambahkan route ke LAN lawan dengan gateway interface wg0.",
      hints: [
        "R1: /ip route add dst-address=192.168.20.0/24 gateway=wg0",
        "R2: /ip route add dst-address=192.168.10.0/24 gateway=wg0",
        "Periksa: /ip route print",
      ],
      checks: [
        { type: "route", device: "r1", dst: "192.168.20.0/24", via: "wg0" },
        { type: "route", device: "r2", dst: "192.168.10.0/24", via: "wg0" },
      ],
    },
    {
      id: "e2e",
      title: "Uji LAN ke LAN",
      detail:
        "PC di kedua site harus saling ping lewat tunnel. Kalau gagal, cek allowed-address di kedua sisi: alamat sumber paket harus ada di allowed-address peer penerima.",
      hints: ["PC1: ping 192.168.20.10", "PC2: ping 192.168.10.10"],
      checks: [
        { type: "ping", from: "pc1", to: "192.168.20.10" },
        { type: "ping", from: "pc2", to: "192.168.10.10" },
      ],
    },
  ],
};
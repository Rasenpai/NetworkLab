import type { Level, Vendor } from "@/lib/data";

export type Scenario = {
  id: string;
  title: string;
  vendor: Vendor;
  level: Level;
  brief: string;
  topology: string;
  commands: { label: string; output: string }[];
  options: string[];
  answer: number;
  explanation: string;
  fix: string[];
};

/** Hasil terbaik user pada satu tantangan (data dari database). */
export type SavedResult = { score: number; seconds: number; attempts: number };

const lines = (...l: string[]) => l.join("\n");

export const SCENARIOS: Scenario[] = [
  {
    id: "ts-1",
    title: "Gateway Salah di PC",
    vendor: "Cisco",
    level: "Beginner",
    brief:
      "PC1 bisa berkomunikasi dengan router, tetapi tidak bisa mengakses server di jaringan 10.0.0.0/24. Padahal semua kabel dan lampu link terlihat normal.",
    topology: lines(
      "PC1 ── SW1 ── R1 ── Server",
      "192.168.10.10   G0/0: 192.168.10.1 | G0/1: 10.0.0.1   10.0.0.10"
    ),
    commands: [
      {
        label: "PC1> ipconfig",
        output: lines(
          "IPv4 Address......: 192.168.10.10",
          "Subnet Mask.......: 255.255.255.0",
          "Default Gateway...: 192.168.10.254"
        ),
      },
      {
        label: "PC1> ping 192.168.10.1",
        output: lines(
          "Reply from 192.168.10.1: bytes=32 time=1ms TTL=255",
          "Reply from 192.168.10.1: bytes=32 time<1ms TTL=255",
          "Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)"
        ),
      },
      {
        label: "PC1> ping 10.0.0.10",
        output: lines(
          "Request timed out.",
          "Request timed out.",
          "Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)"
        ),
      },
      {
        label: "R1# show ip interface brief",
        output: lines(
          "Interface          IP-Address     OK? Method Status Protocol",
          "GigabitEthernet0/0 192.168.10.1   YES manual up     up",
          "GigabitEthernet0/1 10.0.0.1       YES manual up     up"
        ),
      },
    ],
    options: [
      "Interface G0/1 di R1 dalam keadaan shutdown",
      "Default gateway di PC1 tidak sesuai dengan IP router",
      "Subnet mask di PC1 salah",
      "Kabel PC1 ke switch putus",
    ],
    answer: 1,
    explanation:
      "PC1 bisa ping 192.168.10.1 karena masih satu segmen, tetapi untuk keluar ke jaringan lain PC mengirim paket ke gateway 192.168.10.254, padahal IP router adalah 192.168.10.1. Interface R1 up/up, jadi sisi router sehat.",
    fix: ["Ubah default gateway PC1 menjadi 192.168.10.1"],
  },
  {
    id: "ts-2",
    title: "Router Online, Klien Tidak",
    vendor: "MikroTik",
    level: "Beginner",
    brief:
      "Router MikroTik sudah terhubung ke ISP dan bisa ping internet. Namun semua komputer di LAN tidak bisa membuka internet, meski bisa ping router.",
    topology: lines(
      "Internet ── ISP (192.168.100.1) ── ether1 [MikroTik] bridge-lan ── PC (192.168.10.0/24)"
    ),
    commands: [
      {
        label: "PC> ipconfig",
        output: lines(
          "IPv4 Address......: 192.168.10.10",
          "Subnet Mask.......: 255.255.255.0",
          "Default Gateway...: 192.168.10.1"
        ),
      },
      {
        label: "PC> ping 8.8.8.8",
        output: lines("Request timed out.", "Request timed out.", "Request timed out."),
      },
      {
        label: "[admin@MikroTik] > /ping 8.8.8.8",
        output: lines(
          "SEQ HOST    SIZE TTL TIME",
          "0   8.8.8.8  56  117 12ms",
          "1   8.8.8.8  56  117 11ms"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip route print",
        output: lines(
          "Flags: D - DYNAMIC; A - ACTIVE; c - CONNECT, s - STATIC",
          "#   DST-ADDRESS      GATEWAY         DISTANCE",
          "0 As 0.0.0.0/0       192.168.100.1   1",
          "1 DAc 192.168.100.0/24 ether1        0",
          "2 DAc 192.168.10.0/24  bridge-lan    0"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip firewall nat print",
        output: lines("Flags: X - disabled, I - invalid; D - dynamic", "(tidak ada rule)"),
      },
    ],
    options: [
      "Default route di router salah",
      "Gateway di PC salah",
      "Belum ada rule NAT masquerade untuk trafik keluar",
      "ISP memutus koneksi",
    ],
    answer: 2,
    explanation:
      "Router sendiri bisa ping 8.8.8.8, jadi ISP dan default route sehat. Tanpa NAT, paket dari 192.168.10.x keluar dengan IP privat dan tidak bisa dibalas oleh internet.",
    fix: ["/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade"],
  },
  {
    id: "ts-3",
    title: "Klien Tidak Dapat IP",
    vendor: "MikroTik",
    level: "Beginner",
    brief:
      "Setelah router di-reset dan dikonfigurasi ulang, semua komputer mendapat IP 169.254.x.x dan tidak bisa terhubung ke apa pun.",
    topology: lines("PC (DHCP) ── [MikroTik bridge-lan 192.168.10.1/24]"),
    commands: [
      {
        label: "PC> ipconfig",
        output: lines(
          "IPv4 Address......: 169.254.37.21",
          "Subnet Mask.......: 255.255.0.0",
          "Default Gateway...: (kosong)"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip address print",
        output: lines(
          "#  ADDRESS          NETWORK        INTERFACE",
          "0  192.168.10.1/24  192.168.10.0   bridge-lan"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip pool print",
        output: lines(
          "#  NAME        RANGES",
          "0  dhcp_pool   192.168.10.10-192.168.10.200"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip dhcp-server print",
        output: lines(
          "Flags: X - disabled, I - invalid",
          "#   NAME   INTERFACE   ADDRESS-POOL  LEASE-TIME",
          "0 X dhcp1  bridge-lan  dhcp_pool     10m"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip dhcp-server lease print",
        output: "(kosong, belum ada lease)",
      },
    ],
    options: [
      "Pool IP sudah habis",
      "IP router di bridge-lan salah",
      "DHCP server dalam keadaan disabled",
      "Kabel klien rusak",
    ],
    answer: 2,
    explanation:
      "Tanda X pada dhcp1 berarti server dinonaktifkan. Pool dan IP router sudah benar, dan klien yang mendapat 169.254.x.x (APIPA) menandakan link fisik hidup tetapi tidak ada jawaban DHCP.",
    fix: ["/ip dhcp-server enable dhcp1"],
  },
  {
    id: "ts-4",
    title: "LAN B Tidak Terjangkau",
    vendor: "Cisco",
    level: "Intermediate",
    brief:
      "Dua kantor dihubungkan lewat link serial R1–R2 dengan static route. PC di LAN A tidak bisa menjangkau LAN B (10.2.2.0/24), padahal link antar router terlihat normal.",
    topology: lines(
      "LAN A 10.1.1.0/24 ── R1 ══ Serial 10.12.12.0/29 ══ R2 ── LAN B 10.2.2.0/24",
      "                     .1                          .2"
    ),
    commands: [
      {
        label: "PC-A> ping 10.2.2.10",
        output: "Reply from 10.1.1.1: Destination host unreachable.",
      },
      {
        label: "R1# show ip interface brief",
        output: lines(
          "Interface          IP-Address    OK? Method Status Protocol",
          "GigabitEthernet0/0 10.1.1.1      YES manual up     up",
          "Serial0/0/0        10.12.12.1    YES manual up     up"
        ),
      },
      {
        label: "R1# ping 10.12.12.2",
        output: lines("!!!!!", "Success rate is 100 percent (5/5)"),
      },
      {
        label: "R1# show ip route",
        output: lines(
          "C    10.1.1.0/24 is directly connected, GigabitEthernet0/0",
          "C    10.12.12.0/29 is directly connected, Serial0/0/0",
          "S    10.2.2.0/24 [1/0] via 10.12.12.6"
        ),
      },
      {
        label: "R2# show ip route",
        output: lines(
          "C    10.2.2.0/24 is directly connected, GigabitEthernet0/0",
          "C    10.12.12.0/29 is directly connected, Serial0/0/0",
          "S    10.1.1.0/24 [1/0] via 10.12.12.1"
        ),
      },
    ],
    options: [
      "Interface serial R1 dalam keadaan down",
      "R2 tidak punya route balik ke LAN A",
      "Next-hop static route di R1 menunjuk alamat yang salah",
      "Subnet mask LAN B di R2 salah",
    ],
    answer: 2,
    explanation:
      "R1 bisa ping 10.12.12.2, jadi link sehat. Namun route ke 10.2.2.0/24 memakai next-hop 10.12.12.6, padahal IP R2 di link itu adalah 10.12.12.2. R2 sudah punya route balik yang benar.",
    fix: [
      "no ip route 10.2.2.0 255.255.255.0 10.12.12.6",
      "ip route 10.2.2.0 255.255.255.0 10.12.12.2",
    ],
  },
  {
    id: "ts-5",
    title: "VLAN 20 Terisolasi",
    vendor: "Cisco",
    level: "Intermediate",
    brief:
      "Jaringan memakai router-on-a-stick dengan VLAN 10 dan VLAN 20. PC di VLAN 10 bisa mengakses gateway-nya, tetapi PC di VLAN 20 sama sekali tidak bisa keluar.",
    topology: lines(
      "PC10 (Fa0/1, VLAN 10) ─┐",
      "                       SW1 ══ trunk Gi0/1 ══ R1 (Gi0/0.10 | Gi0/0.20)",
      "PC20 (Fa0/2, VLAN 20) ─┘"
    ),
    commands: [
      {
        label: "PC10> ping 192.168.10.1",
        output: "Reply from 192.168.10.1: bytes=32 time=1ms TTL=255",
      },
      {
        label: "PC20> ping 192.168.20.1",
        output: lines("Request timed out.", "Request timed out."),
      },
      {
        label: "SW1# show vlan brief",
        output: lines(
          "VLAN Name    Status  Ports",
          "1    default active  Fa0/3-24, Gi0/2",
          "10   SALES   active  Fa0/1",
          "20   IT      active  Fa0/2"
        ),
      },
      {
        label: "SW1# show interfaces trunk",
        output: lines(
          "Port  Mode Encapsulation Status   Native vlan",
          "Gi0/1 on   802.1q        trunking 1",
          "",
          "Port  Vlans allowed on trunk",
          "Gi0/1 1,10",
          "",
          "Port  Vlans allowed and active in management domain",
          "Gi0/1 1,10"
        ),
      },
      {
        label: "R1# show ip interface brief",
        output: lines(
          "Interface             IP-Address     Status Protocol",
          "GigabitEthernet0/0.10 192.168.10.1   up     up",
          "GigabitEthernet0/0.20 192.168.20.1   up     up"
        ),
      },
    ],
    options: [
      "VLAN 20 belum dibuat di SW1",
      "Subinterface R1 untuk VLAN 20 salah",
      "PC20 dipasang di port VLAN yang salah",
      "VLAN 20 tidak diizinkan lewat trunk di SW1",
    ],
    answer: 3,
    explanation:
      "VLAN 20 ada dan PC20 berada di port yang benar, subinterface R1 juga up. Daftar allowed VLAN pada trunk Gi0/1 hanya 1 dan 10, jadi frame VLAN 20 tidak pernah sampai ke router.",
    fix: ["interface GigabitEthernet0/1", " switchport trunk allowed vlan add 20"],
  },
  {
    id: "ts-6",
    title: "Ping Sampai, Balasan Hilang",
    vendor: "MikroTik",
    level: "Intermediate",
    brief:
      "Dua kantor dihubungkan lewat R-A dan R-B. Dari PC kantor A, ping ke server kantor B selalu timeout. Traceroute dari R-A terlihat sampai R-B.",
    topology: lines(
      "10.1.1.0/24 ── R-A ══ 10.12.12.0/30 ══ R-B ── 10.2.2.0/24",
      "                .1                    .2"
    ),
    commands: [
      {
        label: "PC-A> ping 10.2.2.10",
        output: lines("Request timed out.", "Request timed out.", "Request timed out."),
      },
      {
        label: "[R-A] > /ip route print",
        output: lines(
          "#   DST-ADDRESS     GATEWAY       DISTANCE",
          "0 As 10.2.2.0/24    10.12.12.2    1",
          "1 DAc 10.1.1.0/24   bridge-lan    0",
          "2 DAc 10.12.12.0/30 ether1        0"
        ),
      },
      {
        label: "[R-A] > /tool traceroute 10.2.2.10",
        output: lines(
          "#  ADDRESS      LOSS SENT LAST",
          "1  10.12.12.2   0%   3    1ms",
          "2              100%  3    timeout"
        ),
      },
      {
        label: "[R-B] > /ip route print",
        output: lines(
          "#   DST-ADDRESS     GATEWAY       DISTANCE",
          "0 DAc 10.2.2.0/24   bridge-lan    0",
          "1 DAc 10.12.12.0/30 ether1        0"
        ),
      },
      {
        label: "[R-B] > /ip firewall filter print",
        output: "(tidak ada rule)",
      },
      {
        label: "[R-B] > /ping 10.12.12.1",
        output: lines("SEQ HOST       TTL TIME", "0   10.12.12.1 64  1ms", "1   10.12.12.1 64  1ms"),
      },
    ],
    options: [
      "Firewall di R-B memblokir ICMP",
      "Static route di R-A salah",
      "Kabel antar router putus",
      "R-B tidak punya route balik ke 10.1.1.0/24",
    ],
    answer: 3,
    explanation:
      "Paket sampai ke R-B dan server, tetapi balasan dari 10.2.2.10 tidak tahu jalan pulang ke 10.1.1.0/24 karena R-B tidak punya route ke sana. Firewall kosong dan link terbukti hidup.",
    fix: ["/ip route add dst-address=10.1.1.0/24 gateway=10.12.12.1"],
  },
  {
    id: "ts-7",
    title: "Failover ISP Tidak Jalan",
    vendor: "MikroTik",
    level: "Advanced",
    brief:
      "Kantor memakai dua ISP dengan ISP1 sebagai jalur utama dan ISP2 sebagai cadangan. Saat ISP1 mengalami gangguan di sisi upstream, seluruh LAN kehilangan internet dan tidak berpindah ke ISP2.",
    topology: lines(
      "ISP1 (192.168.1.1) ── ether1 ┐",
      "                              [MikroTik] ── LAN",
      "ISP2 (192.168.2.1) ── ether2 ┘"
    ),
    commands: [
      {
        label: "PC> ping 8.8.8.8",
        output: lines("Request timed out.", "Request timed out."),
      },
      {
        label: "[admin@MikroTik] > /interface print",
        output: lines(
          "#   NAME         TYPE    RUNNING",
          "0 R ether1-ISP1  ether   yes",
          "1 R ether2-ISP2  ether   yes",
          "2 R bridge-lan   bridge  yes"
        ),
      },
      {
        label: "[admin@MikroTik] > /ip route print",
        output: lines(
          "Flags: A - ACTIVE; s - STATIC",
          "#   DST-ADDRESS GATEWAY      DISTANCE  CHECK-GATEWAY",
          "0 As 0.0.0.0/0  192.168.1.1  1",
          "1  s 0.0.0.0/0  192.168.2.1  2"
        ),
      },
      {
        label: "[admin@MikroTik] > /ping 8.8.8.8 src-address=192.168.1.2",
        output: lines("SEQ HOST    STATUS", "0   8.8.8.8 timeout", "1   8.8.8.8 timeout"),
      },
      {
        label: "[admin@MikroTik] > /ping 8.8.8.8 src-address=192.168.2.2",
        output: lines("SEQ HOST    TTL TIME", "0   8.8.8.8 115 18ms", "1   8.8.8.8 115 17ms"),
      },
      {
        label: "[admin@MikroTik] > /ip firewall nat print",
        output: lines(
          "#  CHAIN   ACTION      OUT-INTERFACE",
          "0  srcnat  masquerade  ether1-ISP1",
          "1  srcnat  masquerade  ether2-ISP2"
        ),
      },
    ],
    options: [
      "Distance ISP2 harus dibuat lebih kecil dari ISP1",
      "NAT untuk ISP2 belum dibuat",
      "Route ISP1 tidak memakai check-gateway, jadi tetap aktif walau upstream mati",
      "Kabel ISP2 bermasalah",
    ],
    answer: 2,
    explanation:
      "Link ether1 masih running, jadi route ISP1 dianggap hidup walau internet di belakangnya mati. Tanpa check-gateway, router tidak pernah menonaktifkan route itu dan trafik tetap diarahkan ke jalur yang rusak. ISP2 dan NAT-nya sehat.",
    fix: [
      "/ip route set [find gateway=192.168.1.1] check-gateway=ping",
      "/ip route set [find gateway=192.168.2.1] check-gateway=ping",
    ],
  },
];

/* ───────────────────────── Skor ───────────────────────── */

export const BASE_SCORE = 100;
export const CMD_PENALTY = 5;
export const WRONG_PENALTY = 15;
export const MIN_SCORE = 10;

export function calcScore(seconds: number, commands: number, wrong: number) {
  const timePenalty = Math.min(30, Math.floor(seconds / 10));
  return Math.max(
    MIN_SCORE,
    BASE_SCORE - timePenalty - commands * CMD_PENALTY - wrong * WRONG_PENALTY
  );
}

export function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
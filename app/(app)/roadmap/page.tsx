import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Flag, Wrench } from "lucide-react";
import type { Level } from "@/lib/data";
import {
  Badge,
  Card,
  LevelBadge,
  PageHeader,
  SectionTitle,
} from "@/components/ui";
import { ToolChip, ToolIcon } from "@/components/tool-icon";

export const metadata: Metadata = { title: "Roadmap" };

type TrackId = "engineer" | "noc";

type Stage = {
  title: string;
  level: Level;
  duration: string;
  description: string;
  skills: string[];
  tools: string[];
  goal: string;
};

type ToolGroup = {
  name: string;
  items: { name: string; core?: boolean }[];
};

type Track = {
  id: TrackId;
  label: string;
  tagline: string;
  stages: Stage[];
  toolGroups: ToolGroup[];
  certs: { name: string; note: string }[];
};

const TRACKS: Track[] = [
  {
    id: "engineer",
    label: "Network Engineer",
    tagline:
      "Merancang, membangun, dan mengoptimalkan jaringan. Fokusnya pada konfigurasi, desain, dan otomasi.",
    stages: [
      {
        title: "Fondasi Jaringan",
        level: "Beginner",
        duration: "1–2 bulan",
        description:
          "Pahami cara data bergerak dari satu perangkat ke perangkat lain sebelum menyentuh konfigurasi apa pun.",
        skills: [
          "Model OSI & TCP/IP",
          "IPv4 addressing & subnetting (VLSM)",
          "Ethernet, MAC address, ARP",
          "Protokol inti: DNS, DHCP, ICMP, HTTP/S",
          "Dasar IPv6",
        ],
        tools: [
          "Packet Tracer",
          "Wireshark",
          "ping & traceroute",
          "Subnet calculator",
        ],
        goal: "Bisa subnetting tanpa kalkulator dan menjelaskan perjalanan sebuah paket dari PC ke internet.",
      },
      {
        title: "Switching & Routing Dasar",
        level: "Beginner",
        duration: "2–3 bulan",
        description:
          "Mulai konfigurasi perangkat nyata: menghubungkan segmen jaringan dan memberi akses internet.",
        skills: [
          "Static route & default route",
          "VLAN, trunk, inter-VLAN routing",
          "DHCP server & relay",
          "NAT / PAT (masquerade)",
          "Spanning Tree (STP/RSTP)",
        ],
        tools: ["MikroTik RouterOS + Winbox", "Cisco IOS CLI", "GNS3 / EVE-NG"],
        goal: "Bisa membangun jaringan kantor kecil dari nol: VLAN, DHCP, routing, dan internet.",
      },
      {
        title: "Routing Dinamis & Keamanan",
        level: "Intermediate",
        duration: "3–4 bulan",
        description:
          "Jaringan yang lebih besar tidak bisa dikelola dengan static route. Saatnya routing dinamis dan pengamanan perangkat.",
        skills: [
          "OSPF (single & multi-area)",
          "Dasar BGP (eBGP, advertise prefix)",
          "ACL standard & extended",
          "Firewall filter, NAT, address-list",
          "EtherChannel, VRRP / HSRP",
          "Port security & hardening perangkat",
        ],
        tools: [
          "Cisco IOS",
          "RouterOS firewall",
          "EVE-NG",
          "SSH & key-based login",
        ],
        goal: "Bisa membangun jaringan multi-router dengan OSPF dan membatasi akses antar segmen dengan firewall/ACL.",
      },
      {
        title: "VPN, Redundansi & QoS",
        level: "Intermediate",
        duration: "2–3 bulan",
        description:
          "Menghubungkan lokasi berbeda dengan aman dan menjaga jaringan tetap hidup saat ada link yang gagal.",
        skills: [
          "Site-to-site VPN: WireGuard, IPsec",
          "Remote access VPN",
          "Dual ISP: load balancing & failover",
          "Recursive routing & health check",
          "QoS: queue, simple queue, PCQ",
        ],
        tools: ["WireGuard", "IPsec", "RouterOS Queue", "Netwatch / SLA"],
        goal: "Bisa menghubungkan kantor pusat dan cabang lewat VPN dengan internet cadangan yang otomatis berpindah.",
      },
      {
        title: "Wireless, Monitoring & Linux",
        level: "Advanced",
        duration: "2–3 bulan",
        description:
          "Jaringan yang baik harus bisa dipantau dan dijalankan di atas server Linux yang sehat.",
        skills: [
          "WiFi: kanal, roaming, controller (CAPsMAN / WLC)",
          "SNMP, syslog, NetFlow",
          "Dasar Linux: file, service, jaringan",
          "DNS & DHCP server di Linux",
          "Reverse proxy & dasar web server",
        ],
        tools: [
          "Zabbix",
          "LibreNMS",
          "Grafana",
          "Linux (Ubuntu/Debian)",
          "tcpdump",
        ],
        goal: "Bisa memasang monitoring untuk seluruh perangkat dan membaca grafik untuk menemukan sumber masalah.",
      },
      {
        title: "Otomasi & Spesialisasi",
        level: "Advanced",
        duration: "Berkelanjutan",
        description:
          "Tinggalkan konfigurasi manual satu per satu. Otomasi membuat perubahan cepat, konsisten, dan bisa dilacak.",
        skills: [
          "Python untuk network automation",
          "Backup & push konfigurasi massal",
          "Version control dengan Git",
          "Infrastructure as Code",
          "Pilih jalur: ISP/BGP, enterprise, cloud, atau security",
        ],
        tools: [
          "Python",
          "Netmiko / Paramiko",
          "Ansible",
          "Git",
          "REST API router",
        ],
        goal: "Bisa mengubah konfigurasi puluhan perangkat sekaligus lewat script dan menyimpan riwayatnya di Git.",
      },
    ],
    toolGroups: [
      {
        name: "Simulasi & Lab",
        items: [
          { name: "Packet Tracer", core: true },
          { name: "GNS3" },
          { name: "EVE-NG", core: true },
          { name: "Virtual Lab NetworkLab", core: true },
        ],
      },
      {
        name: "Konfigurasi Perangkat",
        items: [
          { name: "MikroTik RouterOS / Winbox", core: true },
          { name: "Cisco IOS CLI", core: true },
          { name: "PuTTY / SSH client", core: true },
          { name: "Juniper Junos" },
        ],
      },
      {
        name: "Analisis & Troubleshooting",
        items: [
          { name: "Wireshark", core: true },
          { name: "tcpdump" },
          { name: "nmap" },
          { name: "iperf3" },
          { name: "mtr" },
        ],
      },
      {
        name: "Monitoring",
        items: [
          { name: "Zabbix", core: true },
          { name: "LibreNMS" },
          { name: "Grafana" },
          { name: "The Dude" },
        ],
      },
      {
        name: "Otomasi & Dokumentasi",
        items: [
          { name: "Python", core: true },
          { name: "Ansible" },
          { name: "Git", core: true },
          { name: "draw.io / diagrams.net" },
          { name: "NetBox" },
        ],
      },
    ],
    certs: [
      {
        name: "MikroTik MTCNA",
        note: "Titik awal paling cocok untuk perangkat MikroTik.",
      },
      {
        name: "Cisco CCNA",
        note: "Standar industri untuk fondasi routing & switching.",
      },
      {
        name: "MikroTik MTCRE / MTCINE",
        note: "Lanjutan routing dan desain ISP di MikroTik.",
      },
      {
        name: "Cisco CCNP Enterprise",
        note: "Level lanjut untuk jaringan enterprise skala besar.",
      },
    ],
  },
  {
    id: "noc",
    label: "NOC",
    tagline:
      "Memantau, mendeteksi, dan menangani gangguan jaringan 24/7. Fokusnya pada ketelitian, kecepatan, dan komunikasi.",
    stages: [
      {
        title: "Fondasi Jaringan & Linux",
        level: "Beginner",
        duration: "1–2 bulan",
        description:
          "Sebelum memantau jaringan, kamu harus paham cara kerjanya dan nyaman bekerja di terminal.",
        skills: [
          "Model OSI & TCP/IP",
          "Subnetting & IP addressing",
          "Protokol inti: DNS, DHCP, ICMP, HTTP/S",
          "Perintah dasar Linux",
          "Mengenali perangkat: router, switch, AP, OLT, modem",
        ],
        tools: [
          "ping & traceroute",
          "Terminal Linux",
          "Packet Tracer",
          "SSH client",
        ],
        goal: "Bisa membaca topologi sederhana dan menjelaskan di lapisan mana sebuah masalah terjadi.",
      },
      {
        title: "Monitoring & Alerting",
        level: "Beginner",
        duration: "1–2 bulan",
        description:
          "Inilah pekerjaan harian NOC: memastikan semua perangkat terlihat dan setiap masalah memicu alarm yang jelas.",
        skills: [
          "SNMP, syslog, ICMP monitoring",
          "Membaca grafik trafik, CPU, dan latency",
          "Membuat trigger & threshold alert",
          "Membedakan alarm penting dan noise",
          "Dasar NetFlow untuk melihat top talker",
        ],
        tools: ["Zabbix", "LibreNMS", "PRTG", "Grafana", "The Dude"],
        goal: "Bisa memasang perangkat ke monitoring dan membuat alert yang masuk ke Telegram atau email.",
      },
      {
        title: "Troubleshooting & Penanganan Insiden",
        level: "Intermediate",
        duration: "2–3 bulan",
        description:
          "Ketika alarm berbunyi, kamu harus menemukan sumber masalah dengan cepat dan sistematis, bukan menebak-nebak.",
        skills: [
          "Metode troubleshooting bottom-up (L1 → L7)",
          "Diagnosa: link down, packet loss, latency tinggi, flapping",
          "Packet capture & analisis dasar",
          "Eskalasi L1 → L2 → L3 yang tepat",
          "Menulis tiket dan laporan insiden yang jelas",
        ],
        tools: [
          "mtr",
          "Wireshark",
          "tcpdump",
          "Ticketing (GLPI / Jira / ServiceNow)",
        ],
        goal: "Bisa menemukan akar masalah dari satu alarm dalam hitungan menit dan mencatatnya di tiket dengan rapi.",
      },
      {
        title: "Operasional ISP & Enterprise",
        level: "Intermediate",
        duration: "2–3 bulan",
        description:
          "Memahami jaringan yang kamu pantau: cara routing bekerja, kondisi fisik link, dan proses perubahan yang aman.",
        skills: [
          "Membaca tabel routing OSPF & BGP",
          "Dasar fiber optik: level dBm, SFP, OTDR",
          "Change management & maintenance window",
          "Runbook dan SOP penanganan gangguan",
          "SLA, uptime, dan MTTR",
        ],
        tools: [
          "Cisco IOS & RouterOS (read & verify)",
          "Looking glass",
          "Optical power meter",
        ],
        goal: "Bisa mengikuti runbook untuk menangani gangguan umum dan menjelaskan dampaknya ke pelanggan.",
      },
      {
        title: "Otomasi & Naik Level",
        level: "Advanced",
        duration: "Berkelanjutan",
        description:
          "Pekerjaan berulang harus diotomasi supaya waktumu dipakai untuk masalah yang benar-benar butuh analisis.",
        skills: [
          "Scripting Bash & Python",
          "Bot notifikasi (Telegram / Slack)",
          "Pengecekan massal perangkat dengan script",
          "Dasar Ansible",
          "ITIL: incident, problem, dan change management",
        ],
        tools: ["Python", "Bash", "Ansible", "Git", "Telegram Bot API"],
        goal: "Bisa membuat script yang mengecek puluhan perangkat dan mengirim laporan otomatis, siap naik ke Network Engineer.",
      },
    ],
    toolGroups: [
      {
        name: "Monitoring & Alerting",
        items: [
          { name: "Zabbix", core: true },
          { name: "LibreNMS", core: true },
          { name: "Grafana", core: true },
          { name: "PRTG" },
          { name: "Nagios" },
        ],
      },
      {
        name: "Troubleshooting",
        items: [
          { name: "ping / traceroute / mtr", core: true },
          { name: "Wireshark", core: true },
          { name: "tcpdump" },
          { name: "nmap" },
          { name: "iperf3" },
        ],
      },
      {
        name: "Ticketing & Dokumentasi",
        items: [
          { name: "GLPI / Jira / ServiceNow", core: true },
          { name: "Runbook & SOP", core: true },
          { name: "NetBox" },
          { name: "draw.io / diagrams.net" },
        ],
      },
      {
        name: "Akses Perangkat",
        items: [
          { name: "SSH / PuTTY", core: true },
          { name: "Winbox", core: true },
          { name: "Cisco IOS CLI" },
          { name: "Looking glass" },
        ],
      },
      {
        name: "Otomasi",
        items: [
          { name: "Python" },
          { name: "Bash", core: true },
          { name: "Ansible" },
          { name: "Telegram Bot API" },
        ],
      },
    ],
    certs: [
      {
        name: "MikroTik MTCNA",
        note: "Dasar yang sangat berguna untuk NOC di ISP lokal.",
      },
      {
        name: "Cisco CCNA",
        note: "Memperkuat pemahaman routing dan switching.",
      },
      {
        name: "ITIL 4 Foundation",
        note: "Kerangka kerja incident dan change management.",
      },
      {
        name: "Zabbix Certified User / Specialist",
        note: "Membuktikan kemampuan monitoring.",
      },
    ],
  },
];

type SearchParams = Promise<{ track?: string | string[] }>;

function TrackTabs({ active }: { active: TrackId }) {
  return (
    <div
      role="tablist"
      aria-label="Pilih jalur karier"
      className="mb-6 inline-flex gap-1 rounded-xl border border-line bg-card p-1"
    >
      {TRACKS.map((t) => {
        const isActive = t.id === active;
        return (
          <Link
            key={t.id}
            role="tab"
            aria-selected={isActive}
            href={`?track=${t.id}`}
            scroll={false}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              isActive
                ? "bg-accent/15 text-purple-300"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function StageCard({
  stage,
  index,
  isLast,
}: {
  stage: Stage;
  index: number;
  isLast: boolean;
}) {
  return (
    <li className="relative flex gap-4 sm:gap-5">
      <div className="flex flex-col items-center">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-accent/15 text-sm font-semibold text-purple-300">
          {index + 1}
        </span>
        {!isLast && <span className="mt-2 w-px flex-1 bg-line" />}
      </div>

      <Card className="mb-6 flex-1 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <LevelBadge level={stage.level} />
          <Badge>{stage.duration}</Badge>
        </div>
        <h4 className="mt-3 text-base font-semibold sm:text-lg">
          {stage.title}
        </h4>
        <p className="mt-1.5 text-sm text-muted">{stage.description}</p>

        <div className="mt-4 grid gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Yang dipelajari
            </p>
            <ul className="space-y-1.5 text-sm">
              {stage.skills.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              <Wrench className="size-3.5" /> Tools
            </p>
            <div className="flex flex-wrap gap-2">
              {stage.tools.map((t) => (
                <ToolChip key={t} name={t} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2.5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
          <Flag className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-medium">Target: </span>
            {stage.goal}
          </p>
        </div>
      </Card>
    </li>
  );
}

function ToolsSection({ groups }: { groups: ToolGroup[] }) {
  return (
    <section className="mt-2">
      <SectionTitle
        title="Tools yang Harus Dikuasai"
        hint="Berlabel ungu = wajib"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <Card key={g.name} className="p-5">
            <h4 className="font-semibold">{g.name}</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.items.map((it) => (
                <ToolChip key={it.name} name={it.name} core={it.core} />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CertSection({ certs }: { certs: Track["certs"] }) {
  return (
    <section className="mt-8">
      <SectionTitle
        title="Sertifikasi yang Relevan"
        hint="Opsional, tapi membantu saat melamar kerja"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {certs.map((c) => (
          <Card key={c.name} className="flex items-start gap-3 p-4">
            <ToolIcon name={c.name} />
            <div>
              <p className="font-medium">{c.name}</p>
              <p className="mt-0.5 text-sm text-muted">{c.note}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

async function RoadmapContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { track: trackParam } = await searchParams;
  const raw = Array.isArray(trackParam) ? trackParam[0] : trackParam;
  const track = TRACKS.find((t) => t.id === raw?.toLowerCase()) ?? TRACKS[0];

  return (
    <>
      <TrackTabs active={track.id} />

      <p className="mb-6 max-w-3xl text-sm text-muted sm:text-base">
        {track.tagline}
      </p>

      <section>
        <SectionTitle
          title={`Tahapan Belajar (${track.stages.length})`}
          hint="Ikuti urutannya dari atas ke bawah"
        />
        <ol>
          {track.stages.map((stage, i) => (
            <StageCard
              key={stage.title}
              stage={stage}
              index={i}
              isLast={i === track.stages.length - 1}
            />
          ))}
        </ol>
      </section>

      <ToolsSection groups={track.toolGroups} />
      <CertSection certs={track.certs} />

      <Card className="mt-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Siap praktik?</p>
          <p className="mt-0.5 text-sm text-muted">
            Latih tiap tahap di Virtual Lab tanpa perlu perangkat fisik.
          </p>
        </div>
        <Link
          href="/latihan-konfigurasi"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          Buka Virtual Lab <ArrowRight className="size-4" />
        </Link>
      </Card>
    </>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="h-56 animate-pulse rounded-2xl border border-line bg-card"
        />
      ))}
    </div>
  );
}

export default function RoadmapPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader
        title="Roadmap"
        description="Peta belajar dari nol sampai siap kerja sebagai Network Engineer atau NOC, lengkap dengan skill, tools, dan sertifikasi yang perlu dikuasai."
      />
      <Suspense fallback={<RoadmapSkeleton />}>
        <RoadmapContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

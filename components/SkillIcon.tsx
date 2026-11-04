import type { CSSProperties, ComponentType } from "react";
import {
  Activity,
  ArrowLeftRight,
  Calculator,
  Database,
  GitBranch,
  Globe,
  Hash,
  Lock,
  Network,
  Route,
  Scale,
  Share2,
  ShieldCheck,
  Shuffle,
  Wifi,
  Gauge,
} from "lucide-react";
import {
  SiAnsible,
  SiC,
  SiCisco,
  SiCplusplus,
  SiSharp,
  SiDart,
  SiGnubash,
  SiGo,
  SiHtml5,
  SiJavascript,
  SiKotlin,
  SiLinux,
  SiMikrotik,
  SiOpenjdk,
  SiPhp,
  SiPowers,
  SiPython,
  SiRust,
  SiSwift,
  SiTypescript,
  SiWireshark,
} from "react-icons/si";

type IconCmp = ComponentType<{ className?: string; style?: CSSProperties }>;
type Def = { icon: IconCmp; color?: string };

/** Ikon brand pakai warna aslinya (sudah disesuaikan agar terbaca di tema gelap). Konsep tanpa logo pakai ikon lucide. */
const ICONS: Record<string, Def> = {
  // Jaringan
  mikrotik: { icon: SiMikrotik, color: "#9CC3E6" },
  "cisco-ios": { icon: SiCisco, color: "#1BA0D7" },
  subnetting: { icon: Calculator },
  vlan: { icon: Network },
  "static-routing": { icon: Route },
  ospf: { icon: GitBranch },
  bgp: { icon: Share2 },
  eigrp: { icon: Shuffle },
  nat: { icon: ArrowLeftRight },
  "dhcp-dns": { icon: Globe },
  firewall: { icon: ShieldCheck },
  vpn: { icon: Lock },
  wireless: { icon: Wifi },
  qos: { icon: Gauge },
  "load-balancing": { icon: Scale },
  monitoring: { icon: Activity },
  wireshark: { icon: SiWireshark, color: "#4FB0E0" },
  "linux-server": { icon: SiLinux, color: "#FCC624" },
  "net-automation": { icon: SiAnsible, color: "#EE0000" },
  // Bahasa pemrograman
  python: { icon: SiPython, color: "#4F9BD9" },
  javascript: { icon: SiJavascript, color: "#F7DF1E" },
  typescript: { icon: SiTypescript, color: "#3178C6" },
  php: { icon: SiPhp, color: "#777BB4" },
  java: { icon: SiOpenjdk, color: "#ED8B00" },
  kotlin: { icon: SiKotlin, color: "#7F52FF" },
  c: { icon: SiC, color: "#A8B9CC" },
  cpp: { icon: SiCplusplus, color: "#4A9BD9" },
  csharp: { icon: SiSharp, color: "#A97BFF" },
  go: { icon: SiGo, color: "#00ADD8" },
  rust: { icon: SiRust, color: "#DEA584" },
  swift: { icon: SiSwift, color: "#F05138" },
  dart: { icon: SiDart, color: "#40C4FF" },
  sql: { icon: Database },
  bash: { icon: SiGnubash, color: "#4EAA25" },
  powershell: { icon: SiPowers, color: "#5391FE" },
  "html-css": { icon: SiHtml5, color: "#E34F26" },
};

export default function SkillIcon({
  id,
  className = "size-4",
}: {
  id: string;
  className?: string;
}) {
  const def = ICONS[id] ?? { icon: Hash };
  const Icon = def.icon;
  return (
    <Icon
      className={`${className} shrink-0 ${def.color ? "" : "text-muted"}`}
      style={def.color ? { color: def.color } : undefined}
    />
  );
}
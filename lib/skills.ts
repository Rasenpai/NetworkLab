export const BIO_MAX = 200;
export const SKILLS_MAX = 12;

export type SkillGroup = {
  id: string;
  title: string;
  skills: { id: string; label: string }[];
};

export const SKILL_GROUPS: SkillGroup[] = [
  {
    id: "network",
    title: "Jaringan",
    skills: [
      { id: "mikrotik", label: "MikroTik RouterOS" },
      { id: "cisco-ios", label: "Cisco IOS" },
      { id: "subnetting", label: "Subnetting & VLSM" },
      { id: "vlan", label: "VLAN & Trunking" },
      { id: "static-routing", label: "Static Routing" },
      { id: "ospf", label: "OSPF" },
      { id: "bgp", label: "BGP" },
      { id: "eigrp", label: "EIGRP" },
      { id: "nat", label: "NAT" },
      { id: "dhcp-dns", label: "DHCP & DNS" },
      { id: "firewall", label: "Firewall" },
      { id: "vpn", label: "VPN (IPsec / WireGuard)" },
      { id: "wireless", label: "Wireless / Wi-Fi" },
      { id: "qos", label: "QoS & Bandwidth Management" },
      { id: "load-balancing", label: "Load Balancing & Failover" },
      { id: "monitoring", label: "Network Monitoring" },
      { id: "wireshark", label: "Wireshark / Packet Analysis" },
      { id: "linux-server", label: "Linux Server" },
      { id: "net-automation", label: "Network Automation" },
    ],
  },
  {
    id: "programming",
    title: "Bahasa pemrograman",
    skills: [
      { id: "python", label: "Python" },
      { id: "javascript", label: "JavaScript" },
      { id: "typescript", label: "TypeScript" },
      { id: "php", label: "PHP" },
      { id: "java", label: "Java" },
      { id: "kotlin", label: "Kotlin" },
      { id: "c", label: "C" },
      { id: "cpp", label: "C++" },
      { id: "csharp", label: "C#" },
      { id: "go", label: "Go" },
      { id: "rust", label: "Rust" },
      { id: "swift", label: "Swift" },
      { id: "dart", label: "Dart" },
      { id: "sql", label: "SQL" },
      { id: "bash", label: "Bash" },
      { id: "powershell", label: "PowerShell" },
      { id: "html-css", label: "HTML & CSS" },
    ],
  },
];

export const SKILL_LABEL: Record<string, string> = Object.fromEntries(
  SKILL_GROUPS.flatMap((g) => g.skills.map((s) => [s.id, s.label])),
);

export const ALL_SKILL_IDS = new Set(Object.keys(SKILL_LABEL));
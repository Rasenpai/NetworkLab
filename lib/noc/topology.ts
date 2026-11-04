import type { Device, Link } from "./types";

/** Topologi tetap: 2 ISP, 2 core router, firewall, 2 distribution, 4 access switch, 4 server, 3 AP. */
export const DEVICES: Device[] = [
  { id: "isp-a", name: "ISP-A", type: "internet", ip: "203.0.113.1", role: "Uplink utama", x: 270, y: 40 },
  { id: "isp-b", name: "ISP-B", type: "internet", ip: "198.51.100.1", role: "Uplink cadangan", x: 530, y: 40 },

  { id: "core-r1", name: "CORE-R1", type: "router", ip: "10.0.0.1", role: "Core router (ISP-A)", x: 270, y: 125 },
  { id: "core-r2", name: "CORE-R2", type: "router", ip: "10.0.0.2", role: "Core router (ISP-B)", x: 530, y: 125 },

  { id: "fw-01", name: "FW-01", type: "firewall", ip: "10.0.0.10", role: "Firewall perimeter", x: 400, y: 210 },

  { id: "dist-sw1", name: "DIST-SW1", type: "switch", ip: "10.0.1.1", role: "Distribution switch", x: 270, y: 295 },
  { id: "dist-sw2", name: "DIST-SW2", type: "switch", ip: "10.0.1.2", role: "Distribution switch", x: 530, y: 295 },

  { id: "acc-sw1", name: "ACC-SW1", type: "switch", ip: "10.0.2.1", role: "Access switch lantai 1", x: 130, y: 385 },
  { id: "acc-sw2", name: "ACC-SW2", type: "switch", ip: "10.0.2.2", role: "Access switch server web/DB", x: 300, y: 385 },
  { id: "acc-sw3", name: "ACC-SW3", type: "switch", ip: "10.0.2.3", role: "Access switch server DNS/DHCP", x: 500, y: 385 },
  { id: "acc-sw4", name: "ACC-SW4", type: "switch", ip: "10.0.2.4", role: "Access switch lantai 2", x: 670, y: 385 },

  { id: "ap-1", name: "AP-1", type: "ap", ip: "10.0.3.1", role: "Access point lantai 1", x: 80, y: 475 },
  { id: "ap-2", name: "AP-2", type: "ap", ip: "10.0.3.2", role: "Access point lantai 1", x: 180, y: 475 },
  { id: "web-01", name: "WEB-01", type: "server", ip: "10.0.10.10", role: "Web server", x: 255, y: 475 },
  { id: "db-01", name: "DB-01", type: "server", ip: "10.0.10.11", role: "Database server", x: 345, y: 475 },
  { id: "dns-01", name: "DNS-01", type: "server", ip: "10.0.10.20", role: "DNS server", x: 455, y: 475 },
  { id: "dhcp-01", name: "DHCP-01", type: "server", ip: "10.0.10.21", role: "DHCP server", x: 545, y: 475 },
  { id: "ap-3", name: "AP-3", type: "ap", ip: "10.0.3.3", role: "Access point lantai 2", x: 670, y: 475 },
];

const link = (a: string, b: string, mbps: number, peak: number): Link => ({
  id: `${a}--${b}`,
  a,
  b,
  mbps,
  peak,
});

export const LINKS: Link[] = [
  link("isp-a", "core-r1", 1000, 0.55),
  link("isp-b", "core-r2", 500, 0.3),
  link("core-r1", "core-r2", 10000, 0.1),
  link("core-r1", "fw-01", 10000, 0.2),
  link("core-r2", "fw-01", 10000, 0.1),
  link("fw-01", "dist-sw1", 10000, 0.2),
  link("fw-01", "dist-sw2", 10000, 0.2),
  link("dist-sw1", "dist-sw2", 10000, 0.08),
  link("dist-sw1", "acc-sw1", 1000, 0.4),
  link("dist-sw1", "acc-sw2", 1000, 0.45),
  link("dist-sw2", "acc-sw3", 1000, 0.3),
  link("dist-sw2", "acc-sw4", 1000, 0.4),
  link("acc-sw1", "ap-1", 1000, 0.3),
  link("acc-sw1", "ap-2", 1000, 0.3),
  link("acc-sw2", "web-01", 1000, 0.4),
  link("acc-sw2", "db-01", 1000, 0.35),
  link("acc-sw3", "dns-01", 1000, 0.1),
  link("acc-sw3", "dhcp-01", 1000, 0.05),
  link("acc-sw4", "ap-3", 1000, 0.3),
];

export const deviceById: Record<string, Device> = Object.fromEntries(DEVICES.map((d) => [d.id, d]));

export const linkName = (l: Link) => `${deviceById[l.a].name} ↔ ${deviceById[l.b].name}`;
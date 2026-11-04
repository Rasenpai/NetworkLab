export type DeviceKind = "mikrotik" | "cisco" | "pc" | "cloud";

export interface IfaceSpec {
  name: string;
  /** Format CIDR, mis. "10.0.0.1/24" */
  ip?: string;
  /** true = interface mati saat lab dimulai (default perangkat Cisco) */
  adminDown?: boolean;
}

export interface RouteSpec {
  dst: string;
  via: string;
}

export interface DeviceSpec {
  id: string;
  kind: DeviceKind;
  /** Hanya untuk kind "cisco": "switch" = perangkat layer 2 (VLAN, trunk). Default "router". */
  role?: "router" | "switch";
  label: string;
  /** Posisi di kanvas topologi (viewBox 640 x 280) */
  x: number;
  y: number;
  ifaces: IfaceSpec[];
  hostname?: string;
  routes?: RouteSpec[];
  /** IP tambahan yang dimiliki perangkat (untuk "internet", mis. 8.8.8.8) */
  ownedIps?: string[];
}

export interface LinkSpec {
  a: [deviceId: string, iface: string];
  b: [deviceId: string, iface: string];
}

export type Check =
  | { type: "hostname"; device: string; equals: string }
  | { type: "iface-ip"; device: string; iface: string; ip: string }
  | { type: "iface-no-ip"; device: string; iface: string }
  | { type: "iface-up"; device: string; iface: string }
  | { type: "route"; device: string; dst: string; via: string }
  | { type: "no-route"; device: string; dst: string }
  | { type: "dns"; device: string; server: string }
  | { type: "dhcp-server"; device: string; iface: string }
  | { type: "has-lease"; device: string }
  | { type: "ospf-neighbors"; device: string; min: number }
  | { type: "ospf-route"; device: string; dst: string }
  | { type: "ping"; from: string; to: string }
  | { type: "no-ping"; from: string; to: string }
  | { type: "nat-masq"; device: string; iface: string }
  | { type: "vlan"; device: string; id: number; name?: string }
  | { type: "access-port"; device: string; iface: string; vlan: number }
  | { type: "trunk-port"; device: string; iface: string; vlans: number[] }
  | { type: "iface-vlan"; device: string; iface: string; vlan: number }
  | { type: "wg-iface"; device: string; name: string; port: number }
  | { type: "wg-tunnel"; device: string; iface: string };

export interface Task {
  id: string;
  title: string;
  detail: string;
  hints?: string[];
  checks: Check[];
}

export interface LabSpec {
  id: string;
  title: string;
  vendor: "MikroTik" | "Cisco";
  level: "Beginner" | "Intermediate" | "Advanced";
  kind: "Simulasi" | "Studi Kasus";
  description: string;
  minutes: number;
  /** Teks pengantar (boleh multi-baris) */
  intro: string;
  devices: DeviceSpec[];
  links: LinkSpec[];
  tasks: Task[];
}
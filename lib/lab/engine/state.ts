import type { DeviceKind, DeviceSpec } from "../types";
import type { Cidr } from "./net";

export interface IfaceState {
  name: string;
  /** CIDR, mis. "10.0.0.1/24" */
  ip: string | null;
  adminDown: boolean;
  /** Sub-interface router: nama interface fisik induknya. */
  parent?: string;
  /** Sub-interface: VLAN dot1q. null = belum ada encapsulation. */
  vlan: number | null;
  /** Interface virtual tanpa kabel (WireGuard). */
  virtual?: boolean;
  /** Konfigurasi port switch. */
  mode: "access" | "trunk";
  accessVlan: number;
  /** null = semua VLAN diizinkan */
  trunkAllowed: number[] | null;
  native: number;
}

export function makeIface(
  name: string,
  ip: string | null = null,
  adminDown = false,
  parent?: string,
): IfaceState {
  return {
    name,
    ip,
    adminDown,
    parent,
    vlan: null,
    mode: "access",
    accessVlan: 1,
    trunkAllowed: null,
    native: 1,
  };
}

/** Trunk meneruskan VLAN ini? */
export function trunkAllows(port: IfaceState, vlan: number): boolean {
  return port.trunkAllowed === null || port.trunkAllowed.includes(vlan);
}

export interface RouteState {
  dst: string;
  via: string;
}

export interface FilterRule {
  chain: string;
  action: string;
  src: string;
  dst: string;
  protocol: string;
  inIface: string;
  outIface: string;
  /** new, established, related, invalid */
  states: string[];
}

export interface WgPeer {
  publicKey: string;
  /** CIDR, mis. "192.168.20.0/24" */
  allowed: string[];
  endpoint: string;
  endpointPort: number;
  disabled: boolean;
}

export interface WgIface {
  name: string;
  listenPort: number;
  publicKey: string;
  peers: WgPeer[];
}

export interface MtState {
  /** Konteks menu RouterOS yang aktif, mis. ["ip", "address"] */
  path: string[];
  dns: string[];
  pools: { name: string; from: number; to: number }[];
  servers: { name: string; iface: string; pool: string; disabled: boolean }[];
  networks: { address: string; gateway: string; dns: string }[];
  leases: { ip: string; client: string }[];
  nat: { chain: string; action: string; outIface: string }[];
  filter: FilterRule[];
  wg: WgIface[];
}

export interface CsState {
  mode: "user" | "priv" | "config" | "config-if" | "config-router" | "config-vlan";
  iface: string | null;
  /** VLAN yang sedang diedit (mode config-vlan) */
  vlan: number | null;
  ospf: {
    pid: number;
    networks: { net: number; wild: number; area: string }[];
  } | null;
}

export interface DeviceState {
  id: string;
  kind: DeviceKind;
  role: "router" | "switch";
  label: string;
  hostname: string;
  ifaces: IfaceState[];
  routes: RouteState[];
  ownedIps: string[];
  /** Database VLAN (dipakai bila role = switch) */
  sw: { vlans: { id: number; name: string }[] };
  mt: MtState;
  cs: CsState;
  pc: { viaDhcp: boolean };
}

export interface RouteHit {
  kind: "connected" | "static" | "ospf";
  dst: Cidr;
  via: number | null;
  iface: IfaceState;
  metric: number;
}

export function freshMt(): MtState {
  return {
    path: [],
    dns: [],
    pools: [],
    servers: [],
    networks: [],
    leases: [],
    nat: [],
    filter: [],
    wg: [],
  };
}

export function makeDevice(s: DeviceSpec): DeviceState {
  return {
    id: s.id,
    kind: s.kind,
    role: s.role ?? "router",
    label: s.label,
    hostname: s.hostname ?? s.label,
    ifaces: s.ifaces.map((i) => makeIface(i.name, i.ip ?? null, i.adminDown ?? false)),
    routes: (s.routes ?? []).map((r) => ({ dst: r.dst, via: r.via })),
    ownedIps: s.ownedIps ?? [],
    sw: { vlans: [{ id: 1, name: "default" }] },
    mt: freshMt(),
    cs: { mode: "user", iface: null, vlan: null, ospf: null },
    pc: { viaDhcp: false },
  };
}
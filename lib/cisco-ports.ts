/**
 * Daftar port per perangkat + aturan kabel ala Cisco.
 * Tidak server-only: dipakai server (validasi) dan klien (UI). Hanya mengimpor TIPE dari cisco-canvas.
 */
import type { DeviceType } from "@/lib/cisco-canvas";

/** eth = RJ-45 Ethernet, con = port Console (router/switch), rs = RS-232 (PC/laptop), ser = Serial. */
export type PortKind = "eth" | "con" | "rs" | "ser";
export type PortDef = { name: string; kind: PortKind };
export type CableType = "straight" | "cross" | "console" | "serial";

export const CABLE_TYPES: readonly CableType[] = ["straight", "cross", "console", "serial"];

export const CABLE_LABEL: Record<CableType, string> = {
  straight: "Straight-through",
  cross: "Cross-over",
  console: "Console",
  serial: "Serial",
};

const eth = (names: string[]): PortDef[] => names.map((name) => ({ name, kind: "eth" as const }));
const FA24 = Array.from({ length: 24 }, (_, i) => `FastEthernet0/${i + 1}`);

const hostPorts: PortDef[] = [...eth(["FastEthernet0"]), { name: "RS232", kind: "rs" }];

export const PORTS: Record<DeviceType, PortDef[]> = {
  pc: hostPorts,
  laptop: hostPorts,
  server: eth(["FastEthernet0"]),
  printer: eth(["FastEthernet0"]),
  phone: eth(["FastEthernet0"]),
  tablet: eth(["FastEthernet0"]),
  // Mirip Catalyst 2960-24TT: 24 FastEthernet + 2 uplink Gigabit + Console.
  sw: [...eth(FA24), ...eth(["GigabitEthernet0/1", "GigabitEthernet0/2"]), { name: "Console", kind: "con" }],
  // Mirip router ISR: 3 Gigabit + 2 Serial + Console.
  rt: [
    ...eth(["GigabitEthernet0/0", "GigabitEthernet0/1", "GigabitEthernet0/2"]),
    { name: "Serial0/0/0", kind: "ser" },
    { name: "Serial0/0/1", kind: "ser" },
    { name: "Console", kind: "con" },
  ],
};

export const portDef = (t: DeviceType, name: string) => PORTS[t].find((p) => p.name === name);

/** Dua jenis port boleh dihubungkan? */
export function kindsCompatible(a: PortKind, b: PortKind) {
  return (
    (a === "eth" && b === "eth") ||
    (a === "ser" && b === "ser") ||
    (a === "con" && b === "rs") ||
    (a === "rs" && b === "con")
  );
}

const CABLE_FITS: Record<CableType, PortKind[]> = {
  straight: ["eth"],
  cross: ["eth"],
  console: ["con", "rs"],
  serial: ["ser"],
};

/** Kabel ini bisa dicolok ke port jenis ini? */
export const cableFits = (c: CableType, k: PortKind) => CABLE_FITS[c].includes(k);

/** Switch memakai MDI-X, sisanya (PC, router, dll) MDI. */
const isMdix = (t: DeviceType) => t === "sw";

/** Pilihan "otomatis": kabel yang benar untuk dua port ini. */
export function autoCable(ta: DeviceType, ka: PortKind, tb: DeviceType, kb: PortKind): CableType {
  if (ka === "ser") return "serial";
  if (ka === "eth" && kb === "eth") return isMdix(ta) === isMdix(tb) ? "cross" : "straight";
  return "console";
}

/**
 * Apakah link menyala? Straight hanya benar antara tipe berbeda (PC-switch, router-switch),
 * cross hanya benar antara tipe sama (PC-PC, PC-router, switch-switch). Salah kabel = link mati.
 */
export function linkUp(c: CableType, ta: DeviceType, tb: DeviceType) {
  if (c === "straight") return isMdix(ta) !== isMdix(tb);
  if (c === "cross") return isMdix(ta) === isMdix(tb);
  return true;
}

/** "FastEthernet0/1" -> "Fa0/1", "GigabitEthernet0/0" -> "Gi0/0", dst. */
export const shortPort = (n: string) =>
  n.replace("FastEthernet", "Fa").replace("GigabitEthernet", "Gi").replace("Serial", "Se").replace("Console", "Con");
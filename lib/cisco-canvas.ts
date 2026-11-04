import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import {
  CABLE_TYPES,
  PORTS,
  autoCable,
  cableFits,
  kindsCompatible,
  portDef,
  type CableType,
} from "@/lib/cisco-ports";

/* ---------- Tipe ---------- */

export type DeviceType = "pc" | "laptop" | "server" | "phone" | "tablet" | "printer" | "sw" | "rt";
export const DEVICE_TYPES: readonly DeviceType[] = [
  "pc",
  "laptop",
  "server",
  "phone",
  "tablet",
  "printer",
  "sw",
  "rt",
];
export type IfaceCfg = { ip: string; p: number };

export type CanvasDevice = {
  id: number;
  t: DeviceType;
  x: number;
  y: number;
  name: string;
  /** Perangkat ujung (PC, laptop, server, phone, tablet, printer): alamat sendiri. Router/switch mengabaikan ip/p/gw ini. */
  ip: string;
  p: number;
  gw: string;
  /** Router: konfigurasi per kabel, kunci = id kabel. */
  ifs: Record<string, IfaceCfg>;
};

/** Kabel: a/b = id device, ap/bp = nama port di masing-masing ujung, c = jenis kabel. */
export type CanvasLink = { id: number; a: number; ap: string; b: number; bp: string; c: CableType };

export type Topology = {
  v: 1;
  /** Penghitung id berikutnya (device dan kabel berbagi satu penghitung). */
  nextId: number;
  devices: CanvasDevice[];
  links: CanvasLink[];
};

export type CanvasSummary = { id: string; name: string; devices: number; updatedAt: number };
export type CanvasFull = { id: string; name: string; topology: Topology; updatedAt: number };

export const MAX_CANVASES = 20;
export const MAX_DEVICES = 60;
export const MAX_LINKS = 150;
const MAX_BYTES = 200_000;

export const CANVAS_W = 3000;
export const CANVAS_H = 2000;

export const emptyTopology = (): Topology => ({ v: 1, nextId: 1, devices: [], links: [] });

/* ---------- Validasi ---------- */

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const int = (v: unknown, fb = 0) => (typeof v === "number" && Number.isFinite(v) ? Math.round(v) : fb);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const obj = (v: unknown) => (v && typeof v === "object" ? (v as Record<string, unknown>) : null);

/** Bersihkan data dari browser: buang yang tidak valid, batasi ukuran, jangan percaya klien. */
export function sanitizeTopology(raw: unknown): Topology {
  const r = obj(raw) ?? {};
  const devices: CanvasDevice[] = [];
  const rawIfs = new Map<number, Record<string, unknown>>();
  const ids = new Set<number>();

  for (const d of (Array.isArray(r.devices) ? r.devices : []).slice(0, MAX_DEVICES)) {
    const o = obj(d);
    if (!o) continue;
    const id = int(o.id, -1);
    const t = o.t;
    if (id < 1 || ids.has(id)) continue;
    if (typeof t !== "string" || !(DEVICE_TYPES as readonly string[]).includes(t)) continue;
    const type = t as DeviceType;
    ids.add(id);
    rawIfs.set(id, obj(o.ifs) ?? {});
    devices.push({
      id,
      t: type,
      x: clamp(int(o.x), 0, CANVAS_W),
      y: clamp(int(o.y), 0, CANVAS_H),
      name: str(o.name, 24) || `${type.toUpperCase()}${id}`,
      ip: str(o.ip, 15),
      p: clamp(int(o.p, 24), 1, 32),
      gw: str(o.gw, 15),
      ifs: {},
    });
  }

  const typeOf = new Map(devices.map((d) => [d.id, d.t] as const));
  const portUse = new Set<string>(); // "idDevice|namaPort": satu port hanya boleh satu kabel
  const links: CanvasLink[] = [];
  const linkIds = new Set<number>();

  /** Pakai port yang diminta kalau valid dan bebas; kalau tidak (mis. canvas lama), ambil port Ethernet bebas pertama. */
  const pickPort = (devId: number, want: string) => {
    const t = typeOf.get(devId)!;
    const def = portDef(t, want);
    if (def && !portUse.has(`${devId}|${def.name}`)) return def;
    return PORTS[t].find((p) => p.kind === "eth" && !portUse.has(`${devId}|${p.name}`));
  };

  for (const l of (Array.isArray(r.links) ? r.links : []).slice(0, MAX_LINKS)) {
    const o = obj(l);
    if (!o) continue;
    const id = int(o.id, -1);
    const a = int(o.a, -1);
    const b = int(o.b, -1);
    if (id < 1 || linkIds.has(id) || a === b || !ids.has(a) || !ids.has(b)) continue;
    if (ids.has(id)) continue; // id kabel tidak boleh sama dengan id device

    const pa = pickPort(a, str(o.ap, 32));
    const pb = pickPort(b, str(o.bp, 32));
    if (!pa || !pb || !kindsCompatible(pa.kind, pb.kind)) continue;

    const cand = o.c as CableType;
    const c =
      CABLE_TYPES.includes(cand) && cableFits(cand, pa.kind) && cableFits(cand, pb.kind)
        ? cand
        : autoCable(typeOf.get(a)!, pa.kind, typeOf.get(b)!, pb.kind);

    portUse.add(`${a}|${pa.name}`);
    portUse.add(`${b}|${pb.name}`);
    linkIds.add(id);
    links.push({ id, a, ap: pa.name, b, bp: pb.name, c });
  }

  // Konfigurasi interface router: hanya untuk kabel yang benar-benar ada di router itu.
  for (const d of devices) {
    if (d.t !== "rt") continue;
    const src = rawIfs.get(d.id) ?? {};
    for (const l of links) {
      if (l.a !== d.id && l.b !== d.id) continue;
      const f = obj(src[String(l.id)]);
      if (f) d.ifs[String(l.id)] = { ip: str(f.ip, 15), p: clamp(int(f.p, 24), 1, 32) };
    }
  }

  const maxId = Math.max(0, ...devices.map((d) => d.id), ...links.map((l) => l.id));
  return { v: 1, nextId: Math.max(maxId + 1, int(r.nextId, 1)), devices, links };
}

const cleanName = (name: unknown) => str(name, 40) || "Tanpa nama";

/* ---------- Baca ---------- */

type SummaryRow = { id: string; name: string; updated_at: number; devices: number };

export function listCanvases(userId: number): CanvasSummary[] {
  const rows = db
    .prepare(
      `SELECT id, name, updated_at,
              COALESCE(json_array_length(json_extract(data, '$.devices')), 0) AS devices
         FROM cisco_canvases WHERE user_id = ?
        ORDER BY updated_at DESC, created_at DESC`,
    )
    .all(userId) as SummaryRow[];
  return rows.map((r) => ({ id: r.id, name: r.name, devices: r.devices, updatedAt: r.updated_at }));
}

export function getCanvas(userId: number, id: string): CanvasFull | null {
  const row = db
    .prepare("SELECT id, name, data, updated_at FROM cisco_canvases WHERE id = ? AND user_id = ?")
    .get(id, userId) as { id: string; name: string; data: string; updated_at: number } | undefined;
  if (!row) return null;
  let topology = emptyTopology();
  try {
    topology = sanitizeTopology(JSON.parse(row.data));
  } catch {
    /* data rusak: buka sebagai canvas kosong */
  }
  return { id: row.id, name: row.name, topology, updatedAt: row.updated_at };
}

/* ---------- Tulis ---------- */

/** Nama default "Canvas 1", "Canvas 2", ... yang belum dipakai user. */
function nextDefaultName(userId: number) {
  const used = new Set(
    (db.prepare("SELECT name FROM cisco_canvases WHERE user_id = ?").all(userId) as { name: string }[]).map((r) => r.name),
  );
  let n = 1;
  while (used.has(`Canvas ${n}`)) n++;
  return `Canvas ${n}`;
}

export function createCanvas(userId: number, name?: string, topology?: unknown): CanvasFull {
  const count = (
    db.prepare("SELECT COUNT(*) AS n FROM cisco_canvases WHERE user_id = ?").get(userId) as { n: number }
  ).n;
  if (count >= MAX_CANVASES) throw new Error(`Maksimal ${MAX_CANVASES} canvas. Hapus salah satu dulu.`);

  const id = randomUUID();
  const now = Date.now();
  const topo = topology ? sanitizeTopology(topology) : emptyTopology();
  const finalName = name?.trim() ? cleanName(name) : nextDefaultName(userId);

  db.prepare(
    "INSERT INTO cisco_canvases (id, user_id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, userId, finalName, JSON.stringify(topo), now, now);
  return { id, name: finalName, topology: topo, updatedAt: now };
}

/** Simpan canvas (nama + isi). Mengembalikan waktu simpan untuk label "Tersimpan". */
export function saveCanvas(userId: number, id: string, name: unknown, raw: unknown): number {
  const topo = sanitizeTopology(raw);
  const json = JSON.stringify(topo);
  if (json.length > MAX_BYTES) throw new Error("Canvas terlalu besar untuk disimpan.");

  const now = Date.now();
  const res = db
    .prepare("UPDATE cisco_canvases SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?")
    .run(cleanName(name), json, now, id, userId);
  if (res.changes === 0) throw new Error("Canvas tidak ditemukan.");
  return now;
}

export function deleteCanvas(userId: number, id: string) {
  const res = db.prepare("DELETE FROM cisco_canvases WHERE id = ? AND user_id = ?").run(id, userId);
  if (res.changes === 0) throw new Error("Canvas tidak ditemukan.");
}
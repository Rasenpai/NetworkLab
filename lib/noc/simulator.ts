import { DEVICES, LINKS, deviceById, linkName } from "./topology";
import {
  THRESHOLDS,
  type Device,
  type DeviceSample,
  type DeviceType,
  type Link,
  type LinkSample,
  type NocEvent,
  type Snapshot,
  type Status,
} from "./types";

/**
 * Semua data adalah fungsi murni dari waktu: (id perangkat, timestamp) -> nilai.
 * Jadi tidak perlu menyimpan apa pun, riwayat bisa dibuat ulang, dan seed yang sama
 * selalu menghasilkan data yang sama. Insiden (tahap 2) nanti memodifikasi hasil ini.
 */
const SEED = "noc-v1";

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296; // [0, 1)
}

/** Noise halus [0,1): nilai acak per "bucket" waktu, diinterpolasi supaya grafik tidak patah-patah. */
function noise(key: string, t: number, periodMs: number): number {
  const x = t / periodMs;
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash(`${SEED}:${key}:${i}`);
  const b = hash(`${SEED}:${key}:${i + 1}`);
  return a + (b - a) * s;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const r1 = (v: number) => Math.round(v * 10) / 10;

/** Beban harian: 0.25 (malam) sampai 1.0 (puncak sekitar pukul 14:00, jam lokal). */
export function dayLoad(t: number): number {
  const d = new Date(t);
  const h = d.getHours() + d.getMinutes() / 60;
  const wave = Math.max(0, Math.sin((Math.PI * (h - 6)) / 16));
  return 0.25 + 0.75 * wave;
}

const PROFILE: Record<DeviceType, { cpu: number; ram: number; temp: number; lat: number }> = {
  internet: { cpu: 0, ram: 0, temp: 0, lat: 14 },
  router: { cpu: 28, ram: 45, temp: 46, lat: 1.5 },
  firewall: { cpu: 34, ram: 52, temp: 48, lat: 2 },
  switch: { cpu: 12, ram: 35, temp: 40, lat: 1 },
  ap: { cpu: 18, ram: 40, temp: 42, lat: 3 },
  server: { cpu: 30, ram: 58, temp: 44, lat: 2 },
};

const RANK: Record<Status, number> = { up: 0, warning: 1, critical: 2, down: 3 };
const worst = (...s: Status[]): Status => s.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "up" as Status);

function level(v: number, [warn, crit]: readonly [number, number]): Status {
  return v >= crit ? "critical" : v >= warn ? "warning" : "up";
}

function sampleDevice(d: Device, t: number, load: number): DeviceSample {
  const p = PROFILE[d.type];
  const k = 1 + (hash(`${d.id}:scale`) - 0.5) * 0.4; // tiap perangkat sedikit berbeda (±20%)
  const n = (name: string, period: number) => noise(`${d.id}:${name}`, t, period) - 0.5;
  const isNet = d.type === "internet";

  const cpu = isNet ? null : r1(clamp(p.cpu * k * (0.55 + 0.65 * load) + n("cpu", 15000) * 6, 1, 100));
  const ram = isNet ? null : r1(clamp(p.ram + (k - 1) * 20 + load * 4 + n("ram", 120000) * 4, 1, 100));
  const temp = isNet ? null : r1(p.temp + (k - 1) * 10 + load * 5 + n("temp", 60000) * 3);
  const latency = r1(Math.max(0.2, p.lat * (1 + n("lat", 7000) * 0.6) + (load - 0.25) * p.lat * 0.15));
  const l = noise(`${d.id}:loss`, t, 30000);
  const loss = l > 0.9 ? r1((l - 0.9) * 3) : 0; // micro-loss sesekali, jauh di bawah ambang

  const status = worst(
    cpu === null ? "up" : level(cpu, THRESHOLDS.cpu),
    ram === null ? "up" : level(ram, THRESHOLDS.ram),
    temp === null ? "up" : level(temp, THRESHOLDS.temp),
    level(latency, THRESHOLDS.latency),
    level(loss, THRESHOLDS.loss),
  );
  return { status, cpu, ram, temp, latency, loss };
}

function sampleLink(l: Link, t: number, load: number): LinkSample {
  const n = (name: string, period: number) => noise(`${l.id}:${name}`, t, period);
  const util = clamp(l.peak * load * (0.85 + 0.3 * n("u", 9000)) + (n("burst", 3000) - 0.5) * 0.03, 0.005, 1);
  const inMbps = util * l.mbps;
  const outMbps = inMbps * (0.3 + 0.3 * n("dir", 120000));
  return { status: level(util * 100, THRESHOLDS.util), util, inMbps, outMbps };
}

export function takeSnapshot(t: number): Snapshot {
  const load = dayLoad(t);
  const devices: Snapshot["devices"] = {};
  const links: Snapshot["links"] = {};
  for (const d of DEVICES) devices[d.id] = sampleDevice(d, t, load);
  for (const l of LINKS) links[l.id] = sampleLink(l, t, load);
  return { t, devices, links };
}

/** Riwayat `points` snapshot berakhir di `now`, urutan lama -> baru. */
export function buildHistory(now: number, points: number, stepMs: number): Snapshot[] {
  return Array.from({ length: points }, (_, i) => takeSnapshot(now - (points - 1 - i) * stepMs));
}

const METRIC_LABELS: [keyof DeviceSample, string, keyof typeof THRESHOLDS, string][] = [
  ["cpu", "CPU", "cpu", "%"],
  ["ram", "RAM", "ram", "%"],
  ["temp", "Suhu", "temp", "°C"],
  ["latency", "Latency", "latency", " ms"],
  ["loss", "Packet loss", "loss", "%"],
];

function deviceReason(s: DeviceSample): string {
  for (const [key, label, th, unit] of METRIC_LABELS) {
    const v = s[key] as number | null;
    if (v !== null && v >= THRESHOLDS[th][0]) return `${label} ${v}${unit}`;
  }
  return "";
}

/** Bandingkan dua snapshot berurutan dan hasilkan event untuk tiap perubahan status. */
export function diffEvents(prev: Snapshot, next: Snapshot): Omit<NocEvent, "id">[] {
  const out: Omit<NocEvent, "id">[] = [];
  const push = (name: string, from: Status, to: Status, reason: string) => {
    if (from === to) return;
    if (to === "up") out.push({ t: next.t, level: "recovered", text: `${name} kembali normal` });
    else {
      const lv = to === "warning" ? "warning" : "critical";
      out.push({ t: next.t, level: lv, text: `${name} ${to.toUpperCase()}${reason ? ` (${reason})` : ""}` });
    }
  };
  for (const d of DEVICES) {
    const s = next.devices[d.id];
    push(d.name, prev.devices[d.id].status, s.status, deviceReason(s));
  }
  for (const l of LINKS) {
    const s = next.links[l.id];
    push(linkName(l), prev.links[l.id].status, s.status, `utilisasi ${Math.round(s.util * 100)}%`);
  }
  return out;
}

export function summarize(s: Snapshot) {
  const devs = Object.values(s.devices);
  const ispLinks = LINKS.filter((l) => deviceById[l.a].type === "internet");
  const isp = DEVICES.filter((d) => d.type === "internet");
  return {
    up: devs.filter((d) => d.status === "up").length,
    alerts: devs.filter((d) => d.status !== "up").length + Object.values(s.links).filter((l) => l.status !== "up").length,
    inMbps: ispLinks.reduce((sum, l) => sum + s.links[l.id].inMbps, 0),
    outMbps: ispLinks.reduce((sum, l) => sum + s.links[l.id].outMbps, 0),
    ispLatency: isp.reduce((sum, d) => sum + s.devices[d.id].latency, 0) / isp.length,
  };
}
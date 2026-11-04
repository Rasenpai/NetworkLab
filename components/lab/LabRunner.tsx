"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type ComponentType,
} from "react";
import Link from "next/link";
import {
  Check,
  ClipboardList,
  Cloud,
  Columns2,
  Copy,
  FileText,
  FolderPlus,
  Lightbulb,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  Power,
  RotateCcw,
  Router,
  Square,
  X,
} from "lucide-react";
import {
  CiscoRouterViewerLazy,
  HapLiteViewerLazy,
  PcViewerLazy,
} from "@/components/device3d/lazy";
import type { CableInfo, DeviceViewerProps } from "@/components/device3d/types";
import { LabSim, type PingTrace, type TaskResult } from "@/lib/lab/engine/sim";
import { loadLabState, resetLabState, saveLabState } from "@/lib/lab/progress";
import { saveLabToPortfolio } from "@/lib/lab/portfolio";
import type { DeviceKind, LabSpec } from "@/lib/lab/types";

type Line = { kind: "in" | "out"; text: string };
type Lines = Record<string, Line[]>;
type TraceState = { key: number; t: PingTrace };

/**
 * Log aksi pengguna. Simulator tidak diserialisasi langsung; saat halaman
 * dimuat ulang, LabSim baru dibuat lalu aksi-aksi ini diputar ulang berurutan.
 */
type Action =
  | { k: "exec"; id: string; cmd: string }
  | { k: "power"; id: string; on: boolean }
  | { k: "plug"; id: string; iface: string; plugged: boolean };

type Saved = {
  log: Action[];
  lines: Lines;
  results: TaskResult[] | null;
  hints: Record<string, number>;
  active: string;
};

const MAX_LINES = 500;
const SAVE_DELAY_MS = 400;
const PING_STEP_MS = 550;

const KIND_STROKE: Record<DeviceKind, string> = {
  mikrotik: "stroke-accent",
  cisco: "stroke-sky-400",
  pc: "stroke-slate-400",
  cloud: "stroke-amber-400",
};

const KIND_FILL: Record<DeviceKind, string> = {
  mikrotik: "fill-accent",
  cisco: "fill-sky-400",
  pc: "fill-slate-400",
  cloud: "fill-amber-400",
};

const KIND_NAME: Record<DeviceKind, string> = {
  mikrotik: "MikroTik",
  cisco: "Cisco",
  pc: "PC",
  cloud: "Internet",
};

/** Model 3D per jenis perangkat. Cloud (internet) tidak punya model. */
const VIEWERS: Record<
  Exclude<DeviceKind, "cloud">,
  { Viewer: ComponentType<DeviceViewerProps>; note: string }
> = {
  mikrotik: {
    Viewer: HapLiteViewerLazy,
    note: "ditampilkan dengan model referensi MikroTik hAP lite.",
  },
  cisco: {
    Viewer: CiscoRouterViewerLazy,
    note: "ditampilkan dengan model referensi Cisco ISR 2911.",
  },
  pc: {
    Viewer: PcViewerLazy,
    note: "ditampilkan sebagai PC desktop tampak belakang.",
  },
};

function KindIcon({
  kind,
  className,
}: {
  kind: DeviceKind;
  className?: string;
}) {
  if (kind === "pc") return <Monitor className={className} />;
  if (kind === "cloud") return <Cloud className={className} />;
  return <Router className={className} />;
}

function initialLines(sim: LabSim): Lines {
  const out: Lines = {};
  for (const d of sim.devices) {
    if (d.kind !== "cloud")
      out[d.id] = [{ kind: "out", text: sim.banner(d.id) }];
  }
  return out;
}

/** Status link semua interface, untuk mendeteksi perubahan akibat cabut kabel / daya. */
function linkSnapshot(sim: LabSim): Record<string, boolean> {
  const snap: Record<string, boolean> = {};
  for (const d of sim.devices)
    for (const i of d.ifaces) snap[`${d.id}|${i.name}`] = sim.isUp(d, i);
  return snap;
}

/** Pesan log link seperti yang muncul di konsol perangkat sungguhan. */
function linkMessages(kind: DeviceKind, iface: string, up: boolean): string[] {
  const s = up ? "up" : "down";
  if (kind === "cisco")
    return [
      `%LINK-3-UPDOWN: Interface ${iface}, changed state to ${s}`,
      `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${iface}, changed state to ${s}`,
    ];
  if (kind === "mikrotik")
    return [
      `[log] interface,info ${iface} link ${up ? "up (speed 100M, full duplex)" : "down"}`,
    ];
  if (kind === "pc") return [`${iface}: link ${s}`];
  return [];
}

/** Nama interface singkat: GigabitEthernet0/0 -> Gi0/0. */
const shortIface = (n: string) =>
  n
    .replace("TenGigabitEthernet", "Te")
    .replace("GigabitEthernet", "Gi")
    .replace("FastEthernet", "Fa");

/* ───────── skenario (instruksi di atas) ───────── */

/**
 * Teks intro dipecah per paragraf. Paragraf yang diawali "Data ..." dan berformat
 * "Judul: label nilai, label nilai" ditampilkan sebagai tabel kecil supaya
 * IP dan DNS mudah dilihat; selain itu tampil sebagai paragraf biasa.
 */
function parseDataBlock(p: string) {
  const idx = p.indexOf(":");
  if (!/^data\b/i.test(p) || idx < 0) return null;
  const rows = p
    .slice(idx + 1)
    .replace(/\.\s*$/, "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      const parts = item.split(/\s+/);
      if (parts.length < 2) return null;
      return {
        label: parts.slice(0, -1).join(" "),
        value: parts[parts.length - 1],
      };
    });
  if (rows.length === 0 || rows.some((r) => !r)) return null;
  return {
    title: p.slice(0, idx).trim(),
    rows: rows as { label: string; value: string }[],
  };
}

function Intro({ text }: { text: string }) {
  const paras = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-2 border-b border-line bg-white/[0.03] px-4 py-2.5">
        <ClipboardList className="size-4 text-accent" />
        <h2 className="text-sm font-semibold">Skenario lab</h2>
      </div>
      <div className="space-y-3 p-4 text-sm leading-relaxed">
        {paras.map((p, i) => {
          const data = parseDataBlock(p);
          if (!data)
            return (
              <p key={i} className="whitespace-pre-line text-muted">
                {p}
              </p>
            );
          return (
            <div key={i} className="rounded-xl border border-line bg-bg/60 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                {data.title}
              </p>
              <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                {data.rows.map((r) => (
                  <div
                    key={r.label}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <dt className="text-muted">{r.label}</dt>
                    <dd className="font-mono text-[13px] text-fg">{r.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── topologi ───────── */

const NODE_W = 112;
const NODE_H = 56;
const PILL_H = 20;
const PAD = 40;

const pillWidth = (name: string) => shortIface(name).length * 6.8 + 16;

/** Titik di tepi kotak perangkat `c` yang menghadap ke `toward`, plus arah satuannya. */
function edgePoint(
  c: { x: number; y: number },
  toward: { x: number; y: number },
) {
  const dx = toward.x - c.x;
  const dy = toward.y - c.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tx = ux ? NODE_W / 2 / Math.abs(ux) : Infinity;
  const ty = uy ? NODE_H / 2 / Math.abs(uy) : Infinity;
  const t = Math.min(tx, ty);
  return { x: c.x + ux * t, y: c.y + uy * t, ux, uy };
}

/**
 * Atur jarak antar perangkat: koordinat dari spec diperbesar secukupnya supaya
 * di antara dua perangkat selalu ada ruang untuk kabel dan label port, lalu
 * viewBox dipas ke batas gambar sehingga tidak ada ruang kosong berlebih.
 */
function layoutDevices(spec: LabSpec) {
  const byId = new Map(spec.devices.map((d) => [d.id, d]));
  let s = 1;
  for (const l of spec.links) {
    const a = byId.get(l.a[0]);
    const b = byId.get(l.b[0]);
    if (!a || !b) continue;
    const ea = edgePoint(a, b);
    const eb = edgePoint(b, a);
    const dist = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const pillW = Math.max(pillWidth(l.a[1]), pillWidth(l.b[1]));
    const along = Math.abs(ea.ux) * pillW + Math.abs(ea.uy) * PILL_H;
    const extA = Math.hypot(ea.x - a.x, ea.y - a.y);
    const extB = Math.hypot(eb.x - b.x, eb.y - b.y);
    s = Math.max(s, (extA + extB + along + 24) / dist);
  }

  const pos = new Map<string, { x: number; y: number }>();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const d of spec.devices) {
    const x = d.x * s;
    const y = d.y * s;
    pos.set(d.id, { x, y });
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  if (!pos.size) return { pos, vb: { x: 0, y: 0, w: 640, h: 280 } };

  minX -= NODE_W / 2 + PAD;
  maxX += NODE_W / 2 + PAD;
  minY -= NODE_H / 2 + PAD;
  maxY += NODE_H / 2 + PAD;
  const minH = 150;
  if (maxY - minY < minH) {
    const extra = (minH - (maxY - minY)) / 2;
    minY -= extra;
    maxY += extra;
  }
  return { pos, vb: { x: minX, y: minY, w: maxX - minX, h: maxY - minY } };
}

type Tone = "ok" | "idle" | "cut";
const PILL_STROKE: Record<Tone, string> = {
  ok: "stroke-emerald-400",
  idle: "stroke-slate-500",
  cut: "stroke-red-400",
};
const PILL_TEXT: Record<Tone, string> = {
  ok: "fill-emerald-300",
  idle: "fill-slate-300",
  cut: "fill-red-300",
};

/**
 * Label port di ujung kabel. Diletakkan di samping garis (bukan menimpanya),
 * dan sisi A / sisi B berseberangan supaya tidak bertabrakan di kabel pendek.
 */
function PortPill({
  from,
  toward,
  name,
  tone,
}: {
  from: { x: number; y: number };
  toward: { x: number; y: number };
  name: string;
  tone: Tone;
}) {
  const text = shortIface(name);
  const w = pillWidth(name);
  const e = edgePoint(from, toward);
  const along = Math.abs(e.ux) * (w / 2) + Math.abs(e.uy) * (PILL_H / 2) + 5;
  const perp = Math.abs(e.ux) * (PILL_H / 2) + Math.abs(e.uy) * (w / 2) + 5;
  const cx = e.x + e.ux * along - e.uy * perp;
  const cy = e.y + e.uy * along + e.ux * perp;
  return (
    <g>
      <rect
        x={cx - w / 2}
        y={cy - PILL_H / 2}
        width={w}
        height={PILL_H}
        rx={PILL_H / 2}
        strokeWidth={1.5}
        className={`fill-bg ${PILL_STROKE[tone]}`}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        className={`font-mono text-[11px] font-medium ${PILL_TEXT[tone]}`}
      >
        {text}
      </text>
    </g>
  );
}

/**
 * Animasi ping: paket (titik) berpindah dari perangkat ke perangkat sepanjang jalur
 * pergi lalu jalur pulang. Kalau gagal, titik berhenti di perangkat tempat paket terputus.
 */
type Dot = { at: string; leg: "pergi" | "pulang"; done: boolean };

function usePingDot(trace: TraceState | null): Dot | null {
  const [dot, setDot] = useState<Dot | null>(null);
  useEffect(() => {
    if (!trace) return;
    const { fwd, back } = trace.t;
    const stops = [
      ...fwd.map((id) => ({ id, leg: "pergi" as const })),
      ...back.slice(1).map((id) => ({ id, leg: "pulang" as const })),
    ];
    if (!stops.length) return;
    const timers: number[] = [];
    let i = -1;
    const step = () => {
      i++;
      if (i >= stops.length) {
        setDot((d) => (d ? { ...d, done: true } : d));
        timers.push(window.setTimeout(() => setDot(null), 3500));
        return;
      }
      setDot({ at: stops[i].id, leg: stops[i].leg, done: false });
      timers.push(window.setTimeout(step, PING_STEP_MS));
    };
    timers.push(window.setTimeout(step, 0));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [trace]);
  return dot;
}

function PingOverlay({
  pos,
  trace,
  dot,
  label,
}: {
  pos: Map<string, { x: number; y: number }>;
  trace: TraceState;
  dot: Dot;
  label: (id: string) => string;
}) {
  const p = pos.get(dot.at);
  if (!p) return null;
  const { fail, ok, fwd } = trace.t;
  const failPos = fail && dot.done ? pos.get(fail.at) : undefined;
  const srcPos = ok && dot.done ? pos.get(fwd[0]) : undefined;
  const halo = {
    stroke: "paint-order:stroke",
  };
  return (
    <g pointerEvents="none">
      {!dot.done && (
        <g
          style={{
            transform: `translate(${p.x}px, ${p.y}px)`,
            transition: `transform ${PING_STEP_MS - 50}ms linear`,
          }}
        >
          <circle
            r={11}
            fill="none"
            strokeWidth={1.5}
            className={
              dot.leg === "pergi" ? "stroke-sky-400" : "stroke-emerald-400"
            }
            opacity={0.6}
          />
          <circle
            r={6}
            className={
              dot.leg === "pergi" ? "fill-sky-400" : "fill-emerald-400"
            }
          />
        </g>
      )}
      {failPos && fail && (
        <g>
          <circle
            cx={failPos.x}
            cy={failPos.y}
            r={NODE_W / 2 + 4}
            fill="none"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            className="stroke-red-400"
          />
          <text
            x={failPos.x}
            y={failPos.y - NODE_H / 2 - 10}
            textAnchor="middle"
            style={{ paintOrder: halo.stroke }}
            strokeWidth={4}
            className="stroke-bg fill-red-300 text-[11px] font-semibold"
          >
            {fail.leg === "pergi"
              ? `✕ paket berhenti di ${label(fail.at)}: ${fail.why}`
              : `✕ balasan hilang di ${label(fail.at)}: ${fail.why}`}
          </text>
        </g>
      )}
      {srcPos && (
        <text
          x={srcPos.x}
          y={srcPos.y - NODE_H / 2 - 10}
          textAnchor="middle"
          style={{ paintOrder: halo.stroke }}
          strokeWidth={4}
          className="stroke-bg fill-emerald-300 text-[11px] font-semibold"
        >
          ✓ balasan diterima ({fwd.length - 1} hop)
        </text>
      )}
    </g>
  );
}

function Topology({
  spec,
  sim,
  active,
  trace,
  onSelect,
}: {
  spec: LabSpec;
  sim: LabSim;
  active: string;
  trace: TraceState | null;
  onSelect: (id: string) => void;
}) {
  const { pos, vb } = layoutDevices(spec);
  const dot = usePingDot(trace);
  const labelOf = (id: string) =>
    spec.devices.find((d) => d.id === id)?.label ?? id;
  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-xl border border-line bg-black/20">
        <svg
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="w-full"
          role="img"
          aria-label="Topologi lab"
        >
          <defs>
            <pattern
              id="topo-grid"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M20 0H0V20"
                fill="none"
                strokeWidth={1}
                className="stroke-white/[0.04]"
              />
            </pattern>
          </defs>
          <rect
            x={vb.x}
            y={vb.y}
            width={vb.w}
            height={vb.h}
            fill="url(#topo-grid)"
          />

          {/* kabel */}
          {spec.links.map((l, i) => {
            const pa = pos.get(l.a[0]);
            const pb = pos.get(l.b[0]);
            if (!pa || !pb) return null;
            const sa = sim.dev(l.a[0]);
            const ia = sa?.ifaces.find((x) => x.name === l.a[1]);
            const sb = sim.dev(l.b[0]);
            const ib = sb?.ifaces.find((x) => x.name === l.b[1]);
            let up: boolean;
            if (sa && ia) up = sim.isUp(sa, ia);
            else if (sb && ib) up = sim.isUp(sb, ib);
            else return null;

            const plugA = sim.isPlugged(l.a[0], l.a[1]);
            const plugB = sim.isPlugged(l.b[0], l.b[1]);
            const cut = !plugA || !plugB;
            const ea = edgePoint(pa, pb);
            const eb = edgePoint(pb, pa);
            const tone = (plugged: boolean): Tone =>
              !plugged ? "cut" : up ? "ok" : "idle";

            return (
              <g key={i}>
                <line
                  x1={ea.x}
                  y1={ea.y}
                  x2={eb.x}
                  y2={eb.y}
                  strokeWidth={up ? 3 : 2}
                  strokeLinecap="round"
                  strokeDasharray={up ? undefined : cut ? "2 7" : "7 6"}
                  className={
                    up
                      ? "stroke-emerald-400/80"
                      : cut
                        ? "stroke-red-400/80"
                        : "stroke-slate-500"
                  }
                />
                <PortPill
                  from={pa}
                  toward={pb}
                  name={l.a[1]}
                  tone={tone(plugA)}
                />
                <PortPill
                  from={pb}
                  toward={pa}
                  name={l.b[1]}
                  tone={tone(plugB)}
                />
              </g>
            );
          })}

          {/* perangkat */}
          {spec.devices.map((d) => {
            const p = pos.get(d.id);
            if (!p) return null;
            const st = sim.dev(d.id);
            const clickable = d.kind !== "cloud";
            const isActive = active === d.id;
            const off = !sim.isOn(d.id);
            const showHost = !!st && d.kind !== "cloud";
            return (
              <g
                key={d.id}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-label={clickable ? `Buka terminal ${d.label}` : undefined}
                opacity={off ? 0.5 : 1}
                onClick={() => clickable && onSelect(d.id)}
                onKeyDown={(e) => {
                  if (clickable && (e.key === "Enter" || e.key === " "))
                    onSelect(d.id);
                }}
                className={clickable ? "cursor-pointer outline-none" : ""}
              >
                <rect
                  x={p.x - NODE_W / 2}
                  y={p.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={d.kind === "cloud" ? NODE_H / 2 : 12}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  strokeDasharray={off ? "4 4" : undefined}
                  className={`fill-bg ${isActive ? "stroke-white" : KIND_STROKE[d.kind]}`}
                />
                {clickable && (
                  <circle
                    cx={p.x + NODE_W / 2 - 12}
                    cy={p.y - NODE_H / 2 + 12}
                    r={4}
                    className={off ? "fill-red-400" : "fill-emerald-400"}
                  />
                )}
                <text
                  x={p.x}
                  y={p.y + (showHost ? -11 : -6)}
                  textAnchor="middle"
                  className={`text-[9px] font-semibold uppercase tracking-widest ${KIND_FILL[d.kind]}`}
                >
                  {KIND_NAME[d.kind]}
                </text>
                <text
                  x={p.x}
                  y={p.y + (showHost ? 6 : 11)}
                  textAnchor="middle"
                  className="fill-fg text-[14px] font-semibold"
                >
                  {d.label}
                </text>
                {showHost && (
                  <text
                    x={p.x}
                    y={p.y + 20}
                    textAnchor="middle"
                    className="fill-muted font-mono text-[10px]"
                  >
                    {off ? "MATI" : st.hostname}
                  </text>
                )}
              </g>
            );
          })}

          {/* animasi ping */}
          {trace && dot && (
            <PingOverlay pos={pos} trace={trace} dot={dot} label={labelOf} />
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded bg-emerald-400" />
          Link aktif
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dashed border-slate-500" />
          Link down
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dotted border-red-400" />
          Kabel dicabut
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-sky-400" />
          Ping pergi
          <span className="size-2 rounded-full bg-emerald-400" />
          pulang
        </span>
        <span className="ml-auto">Klik perangkat untuk membuka terminal</span>
      </div>
    </div>
  );
}

/* ───────── terminal ───────── */

const MONO =
  "Consolas, 'Lucida Console', 'DejaVu Sans Mono', 'Courier New', monospace";

/** Warna latar dan teks per jenis terminal. */
const TERM_THEME: Record<DeviceKind, { bg: string; fg: string }> = {
  mikrotik: { bg: "#000000", fg: "#e8e8e8" }, // WinBox
  cisco: { bg: "#000000", fg: "#c0c0c0" }, // PuTTY
  pc: { bg: "#300a24", fg: "#eeeeec" }, // terminal Ubuntu
  cloud: { bg: "#000000", fg: "#c0c0c0" },
};

/** Prompt RouterOS: "[admin@R1] > " atau "[admin@R1] /ip firewall> ". */
const MT_PROMPT = /^\[([^\]]+)\]\s?([^>]*>)\s/;

function MikrotikLine({ text }: { text: string }) {
  const m = MT_PROMPT.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <span className="text-[#9aa4ad]">[</span>
      <span className="text-[#6cc4ff]">{m[1]}</span>
      <span className="text-[#9aa4ad]">] </span>
      <span className="text-[#6cc4ff]">{m[2]}</span> {text.slice(m[0].length)}
    </>
  );
}

/** Prompt PC: "PC1> " atau "user@pc1:~$ ", diwarnai hijau ala terminal Ubuntu. */
const LX_PROMPT = /^(\S+?[>$#])\s/;

function LinuxLine({ text }: { text: string }) {
  const m = LX_PROMPT.exec(text);
  if (!m) return <>{text}</>;
  return (
    <>
      <span className="font-bold text-[#8ae234]">{m[1]}</span>{" "}
      {text.slice(m[0].length)}
    </>
  );
}

/** Bilah judul jendela: WinBox (MikroTik), PuTTY (Cisco), terminal Ubuntu (PC). */
function TitleBar({ kind, title }: { kind: DeviceKind; title: string }) {
  if (kind === "pc") {
    return (
      <div className="relative flex items-center justify-center bg-[#2c2c2c] px-3 py-1.5 text-xs text-[#dcdcdc]">
        <span className="font-medium">{title}</span>
        <span
          className="absolute right-2.5 flex items-center gap-1.5"
          aria-hidden
        >
          {["–", "□", "✕"].map((g) => (
            <span
              key={g}
              className="grid size-4 place-items-center rounded-full bg-white/10 text-[9px] leading-none"
            >
              {g}
            </span>
          ))}
        </span>
      </div>
    );
  }
  const mt = kind === "mikrotik";
  return (
    <div
      className={`flex items-center justify-between px-2.5 py-1 text-xs text-slate-800 ${
        mt ? "bg-[#cfd8e3]" : "bg-[#f3f3f3]"
      }`}
    >
      <span className="flex items-center gap-1.5 font-medium">
        {mt ? (
          <span className="grid size-3.5 place-items-center rounded-sm bg-[#1d6fb8] text-[8px] font-bold text-white">
            W
          </span>
        ) : (
          <Monitor className="size-3.5 text-slate-700" />
        )}
        {title}
      </span>
      <span className="flex items-center gap-3 text-slate-500" aria-hidden>
        <Minus className="size-3.5" />
        <Square className="size-3" />
        <X className="size-3.5" />
      </span>
    </div>
  );
}

/** Awalan terpanjang yang sama di antara semua kandidat. */
function commonPrefix(list: string[]): string {
  return list.reduce((a, b) => {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return a.slice(0, i);
  });
}

/** Kata terakhir yang sedang diketik (dipisah spasi atau "/"). */
const lastWord = (v: string) => /[^\s/]*$/.exec(v)![0];

function Terminal({
  kind,
  title,
  prompt,
  lines,
  focused,
  visible,
  height,
  disabled,
  onRun,
  onPower,
  onSuggest,
  onEcho,
}: {
  kind: DeviceKind;
  /** Nama perangkat, dipakai di judul jendela. */
  title: string;
  prompt: string;
  lines: Line[];
  /** Terminal aktif: input otomatis fokus. */
  focused: boolean;
  /** Sedang tampil (aktif atau panel kedua). */
  visible: boolean;
  /** Kelas tinggi area teks. */
  height: string;
  /** Perangkat mati: input dikunci dan ada lapisan penutup. */
  disabled: boolean;
  onRun: (cmd: string) => void;
  onPower: () => void;
  onSuggest: (value: string) => string[];
  onEcho: (input: string, out: string) => void;
}) {
  const [value, setValue] = useState("");
  const history = useRef<string[]>([]);
  const cursor = useRef(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const theme = TERM_THEME[kind];
  const mt = kind === "mikrotik";
  const pc = kind === "pc";
  const barTitle = mt ? "Terminal" : pc ? `${title}: ~` : `${title} - PuTTY`;

  useEffect(() => {
    if (!visible) return;
    if (focused && !disabled) input.current?.focus();
    box.current?.scrollTo({ top: box.current.scrollHeight });
  }, [visible, focused, lines, disabled]);

  /** Tab: lengkapi kata; kalau ada beberapa pilihan, lengkapi awalan sama atau tampilkan daftar. */
  function complete() {
    const opts = onSuggest(value).filter((o) => !o.startsWith("<"));
    if (!opts.length) return;
    const partial = lastWord(value);
    const base = value.slice(0, value.length - partial.length);
    if (opts.length === 1) {
      setValue(`${base}${opts[0]} `);
      return;
    }
    const common = commonPrefix(opts);
    if (common.length > partial.length) {
      setValue(base + common);
      return;
    }
    onEcho(value, opts.join("   "));
  }

  /** ?: tampilkan pilihan berikutnya tanpa menjalankan perintah. */
  function help() {
    const opts = onSuggest(value);
    onEcho(
      `${value}?`,
      opts.length
        ? opts.map((o) => `  ${o}`).join("\n")
        : "% Tidak ada saran untuk posisi ini.",
    );
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      if (value.trim()) history.current.push(value);
      cursor.current = history.current.length;
      onRun(value);
      setValue("");
    } else if (e.key === "Tab") {
      e.preventDefault();
      complete();
    } else if (e.key === "?") {
      e.preventDefault();
      help();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      cursor.current = Math.max(0, cursor.current - 1);
      setValue(history.current[cursor.current] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      cursor.current = Math.min(history.current.length, cursor.current + 1);
      setValue(history.current[cursor.current] ?? "");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      onRun("clear");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 shadow-lg shadow-black/30">
      <TitleBar kind={kind} title={barTitle} />
      <div
        ref={box}
        onClick={() => input.current?.focus()}
        style={{ fontFamily: MONO, color: theme.fg, background: theme.bg }}
        className={`${height} cursor-text overflow-y-auto px-2.5 py-2 text-[13px] leading-[18px]`}
      >
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            {l.kind === "in" && mt ? (
              <MikrotikLine text={l.text} />
            ) : l.kind === "in" && pc ? (
              <LinuxLine text={l.text} />
            ) : (
              l.text || "\u00a0"
            )}
          </div>
        ))}
        {!disabled && (
          <div className="flex items-start">
            <span className="shrink-0 whitespace-pre">
              {mt ? (
                <MikrotikLine text={prompt} />
              ) : pc ? (
                <LinuxLine text={prompt} />
              ) : (
                prompt
              )}
            </span>
            <input
              ref={input}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Input perintah"
              style={{
                fontFamily: "inherit",
                color: "inherit",
                caretColor: theme.fg,
              }}
              className="min-w-0 flex-1 bg-transparent outline-none [caret-shape:block]"
            />
          </div>
        )}
      </div>

      {disabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 p-4 text-center">
          <Power className="size-8 text-red-300" />
          <p className="text-sm text-fg">Perangkat mati</p>
          <p className="max-w-xs text-xs text-muted">
            Terminal tidak bisa dipakai. Nyalakan lewat tombol di bawah, atau
            dari tampilan Perangkat 3D.
          </p>
          <button
            type="button"
            onClick={onPower}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Power className="size-4" />
            Nyalakan
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────── tampilan konfigurasi ───────── */

function ConfigDialog({
  sim,
  devices,
  id,
  onSelect,
  onClose,
}: {
  sim: LabSim;
  devices: { id: string; label: string; kind: DeviceKind }[];
  id: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const dev = sim.dev(id);
  const text = sim.config(id) || "(konfigurasi kosong)";
  const cmd =
    dev?.kind === "mikrotik"
      ? "/export"
      : dev?.kind === "cisco"
        ? "show running-config"
        : "show ip";

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard ditolak: abaikan */
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Konfigurasi perangkat"
    >
      <div
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <FileText className="size-4 text-accent" />
          <h3 className="text-sm font-semibold">Konfigurasi</h3>
          <div className="ml-2 flex flex-wrap gap-1">
            {devices.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={id === d.id}
                onClick={() => onSelect(d.id)}
                className={`rounded-md border px-2 py-0.5 text-xs transition-colors ${
                  id === d.id
                    ? "border-accent/40 bg-accent/15 text-fg"
                    : "border-line text-muted hover:text-fg"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="ml-auto rounded-md p-1 text-muted hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
        <p className="border-b border-line px-4 py-2 font-mono text-xs text-muted">
          $ {cmd}
        </p>
        <pre className="min-h-[200px] flex-1 overflow-auto whitespace-pre bg-bg px-4 py-3 font-mono text-xs leading-relaxed text-fg">
          {text}
        </pre>
        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <span className="text-xs text-muted">Esc untuk menutup</span>
          <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition hover:text-fg"
          >
            {copied ? (
              <Check className="size-3.5" />
            ) : (
              <Copy className="size-3.5" />
            )}
            {copied ? "Tersalin" : "Salin"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── runner ───────── */

type PortfolioState = {
  state: "idle" | "saving" | "done" | "error";
  msg: string;
};

export default function LabRunner({ spec }: { spec: LabSpec }) {
  const [sim, setSim] = useState(() => new LabSim(spec));
  const [lines, setLines] = useState<Lines>(() => initialLines(sim));
  const [active, setActive] = useState(
    () => sim.devices.find((d) => d.kind !== "cloud")?.id ?? "",
  );
  const [results, setResults] = useState<TaskResult[] | null>(null);
  const [hints, setHints] = useState<Record<string, number>>({});
  const [epoch, setEpoch] = useState(0);
  const [view, setView] = useState<"topologi" | "3d">("topologi");
  // Tampilan terminal: dua panel sejajar, layar penuh, dan panel kanan.
  const [split, setSplit] = useState(false);
  const [full, setFull] = useState(false);
  const [second, setSecond] = useState("");
  const [cfgDev, setCfgDev] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceState | null>(null);
  const [pf, setPf] = useState<PortfolioState>({ state: "idle", msg: "" });
  // Simulator dimutasi langsung (daya, kabel), jadi render dipicu manual.
  const [, bump] = useReducer((n: number) => n + 1, 0);

  // Progres lab disimpan per akun di SQLite (lib/lab/progress.ts).
  // `ready` = pemulihan sudah selesai, supaya state awal yang kosong
  // tidak menimpa data tersimpan.
  const log = useRef<Action[]>([]);
  const [ready, setReady] = useState(false);

  // Pulihkan sekali setelah mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await loadLabState(spec.id);
        if (cancelled || !raw) return;
        const saved = JSON.parse(raw) as Saved;
        const s = new LabSim(spec);
        for (const a of saved.log) {
          if (a.k === "exec") s.exec(a.id, a.cmd);
          else if (a.k === "power") s.setPower(a.id, a.on);
          else s.setPlugged(a.id, a.iface, a.plugged);
        }
        log.current = saved.log;
        setSim(s);
        setLines(saved.lines);
        setResults(saved.results);
        setHints(saved.hints);
        if (s.dev(saved.active)) setActive(saved.active);
      } catch {
        // Data rusak atau tidak cocok dengan lab ini: mulai dari awal.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spec]);

  // Simpan ke server (debounce) setiap ada perubahan, setelah pemulihan selesai.
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const trimmed: Lines = {};
      for (const [id, ls] of Object.entries(lines))
        trimmed[id] = ls.slice(-MAX_LINES);
      const data: Saved = {
        log: log.current,
        lines: trimmed,
        results,
        hints,
        active,
      };
      const passed = results?.filter((r) => r.ok).length ?? 0;
      saveLabState(spec.id, JSON.stringify(data), passed).catch(() => {});
    }, SAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [ready, lines, results, hints, active, spec]);

  // Layar penuh: Esc keluar (kecuali dialog konfigurasi sedang terbuka), halaman tidak ikut scroll.
  useEffect(() => {
    if (!full) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !cfgDev) setFull(false);
    };
    window.addEventListener("keydown", h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", h);
      document.body.style.overflow = prev;
    };
  }, [full, cfgDev]);

  const terminals = sim.devices.filter((d) => d.kind !== "cloud");
  const activeDev = spec.devices.find((d) => d.id === active);
  const activeOn = sim.isOn(active);

  // Panel kanan: pilihan user kalau valid, kalau tidak terminal lain pertama.
  const right = split
    ? second && second !== active && terminals.some((d) => d.id === second)
      ? second
      : (terminals.find((d) => d.id !== active)?.id ?? "")
    : "";

  /** Semua kabel di perangkat, termasuk yang sedang dicabut. Status link dari simulator. */
  function cablesFor(deviceId: string): CableInfo[] {
    const st = sim.dev(deviceId);
    if (!st) return [];
    const out: CableInfo[] = [];
    for (const l of spec.links) {
      const [mine, peer] =
        l.a[0] === deviceId
          ? [l.a, l.b]
          : l.b[0] === deviceId
            ? [l.b, l.a]
            : [null, null];
      if (!mine || !peer) continue;
      const ifc = st.ifaces.find((x) => x.name === mine[1]);
      const peerLabel =
        spec.devices.find((d) => d.id === peer[0])?.label ?? peer[0];
      out.push({
        portId: mine[1],
        label: `${peerLabel} · ${shortIface(peer[1])}`,
        up: ifc ? sim.isUp(st, ifc) : false,
        plugged: sim.isPlugged(deviceId, mine[1]),
      });
    }
    return out;
  }
  const passed = results?.filter((r) => r.ok).length ?? 0;
  const total = spec.tasks.length;

  function run(id: string, cmd: string) {
    const t = cmd.trim();
    if (t === "clear" || t === "cls") {
      setLines((p) => ({ ...p, [id]: [] }));
      return;
    }
    if (!sim.isOn(id)) return;
    const prompt = sim.prompt(id);
    const out = sim.exec(id, cmd);
    log.current.push({ k: "exec", id, cmd });
    const add: Line[] = [{ kind: "in", text: prompt + cmd }];
    if (out) add.push({ kind: "out", text: out });
    setLines((p) => ({ ...p, [id]: [...(p[id] ?? []), ...add] }));

    // Ping: jalankan animasi paket di topologi.
    const tr = sim.traceCommand(id, cmd);
    if (tr) setTrace((p) => ({ key: (p?.key ?? 0) + 1, t: tr }));

    // Perintah seperti "shutdown" bisa mengubah status link di topologi/3D.
    bump();
  }

  /** Tulis input + keluaran bantuan (Tab / ?) ke terminal, tanpa menjalankan perintah. */
  function echo(id: string, input: string, out: string) {
    const add: Line[] = [{ kind: "in", text: sim.prompt(id) + input }];
    if (out) add.push({ kind: "out", text: out });
    setLines((p) => ({ ...p, [id]: [...(p[id] ?? []), ...add] }));
  }

  /**
   * Terapkan perubahan fisik (daya/kabel), lalu tulis pesan link ke terminal
   * perangkat yang statusnya berubah, seperti syslog di perangkat sungguhan.
   */
  function change(apply: () => void, notes: Lines = {}) {
    const before = linkSnapshot(sim);
    apply();
    const after = linkSnapshot(sim);

    const add: Lines = {};
    const push = (id: string, l: Line) => (add[id] ??= []).push(l);
    for (const [id, ls] of Object.entries(notes))
      ls.forEach((l) => push(id, l));
    for (const d of sim.devices) {
      if (d.kind === "cloud" || !sim.isOn(d.id)) continue;
      for (const i of d.ifaces) {
        const k = `${d.id}|${i.name}`;
        if (before[k] === after[k]) continue;
        for (const text of linkMessages(d.kind, i.name, after[k]))
          push(d.id, { kind: "out", text });
      }
    }
    setLines((p) => {
      const next = { ...p };
      for (const [id, ls] of Object.entries(add))
        next[id] = [...(next[id] ?? []), ...ls];
      return next;
    });
    bump();
  }

  function togglePower(id: string) {
    const on = !sim.isOn(id);
    change(
      () => {
        sim.setPower(id, on);
        log.current.push({ k: "power", id, on });
      },
      {
        [id]: [
          {
            kind: "out",
            text: on
              ? `Perangkat dinyalakan.\n${sim.banner(id)}`
              : "— perangkat dimatikan —",
          },
        ],
      },
    );
  }

  function togglePlug(deviceId: string, iface: string) {
    const next = !sim.isPlugged(deviceId, iface);
    change(() => {
      sim.setPlugged(deviceId, iface, next);
      log.current.push({ k: "plug", id: deviceId, iface, plugged: next });
    });
  }

  function resetLab() {
    const s = new LabSim(spec);
    log.current = [];
    resetLabState(spec.id).catch(() => {});
    setSim(s);
    setLines(initialLines(s));
    setActive(s.devices.find((d) => d.kind !== "cloud")?.id ?? "");
    setResults(null);
    setHints({});
    setTrace(null);
    setPf({ state: "idle", msg: "" });
    setEpoch((e) => e + 1);
  }

  async function saveToPortfolio() {
    setPf({ state: "saving", msg: "" });
    try {
      const r = await saveLabToPortfolio(spec.id, sim.configAll());
      setPf({ state: r.ok ? "done" : "error", msg: r.message });
    } catch {
      setPf({ state: "error", msg: "Gagal menyimpan. Coba lagi." });
    }
  }

  const entry =
    activeDev && activeDev.kind !== "cloud" ? VIEWERS[activeDev.kind] : null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        <Intro text={spec.intro} />

        {/* Topologi */}
        <section className="rounded-2xl border border-line bg-card p-3">
          <div
            className="mb-2 flex flex-wrap items-center gap-2"
            role="tablist"
            aria-label="Tampilan topologi"
          >
            {(
              [
                ["topologi", "Topologi"],
                ["3d", "Perangkat 3D"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`rounded-lg border px-3 py-1 text-xs transition-colors ${
                  view === id
                    ? "border-accent/40 bg-accent/15 text-fg"
                    : "border-line text-muted hover:text-fg"
                }`}
              >
                {label}
              </button>
            ))}
            {view === "3d" && (
              <div className="ml-auto flex flex-wrap items-center gap-1">
                <span className="mr-1 text-xs text-muted">Perangkat:</span>
                {terminals.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    aria-pressed={active === d.id}
                    onClick={() => setActive(d.id)}
                    className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs transition-colors ${
                      active === d.id
                        ? "border-accent/40 bg-accent/15 text-fg"
                        : "border-line text-muted hover:text-fg"
                    }`}
                  >
                    {!sim.isOn(d.id) && (
                      <span
                        aria-label="mati"
                        className="size-1.5 rounded-full bg-red-400"
                      />
                    )}
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {view === "topologi" ? (
            <Topology
              spec={spec}
              sim={sim}
              active={active}
              trace={trace}
              onSelect={setActive}
            />
          ) : entry && activeDev ? (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                {activeDev.label} {entry.note} Matikan perangkat, cabut kabel,
                atau pasang kembali: terminal, LED, dan topologi ikut berubah.
              </p>
              <entry.Viewer
                key={`${activeDev.id}-${epoch}`}
                layout="stacked"
                cables={cablesFor(activeDev.id)}
                powered={activeOn}
                onTogglePower={() => togglePower(activeDev.id)}
                onToggleCable={(port) => togglePlug(activeDev.id, port)}
              />
            </div>
          ) : (
            <p className="rounded-xl border border-line px-4 py-10 text-center text-sm text-muted">
              Model 3D untuk {activeDev?.label ?? "perangkat ini"} belum
              tersedia.
            </p>
          )}
        </section>

        {/* Terminal */}
        <section
          className={
            full
              ? "fixed inset-0 z-50 flex flex-col gap-2 overflow-auto bg-bg p-4"
              : "space-y-2"
          }
        >
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {terminals.map((d) => (
              <button
                key={d.id}
                type="button"
                role="tab"
                aria-selected={active === d.id}
                onClick={() => setActive(d.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                  active === d.id
                    ? "border-accent/40 bg-accent/15 text-fg"
                    : "border-line text-muted hover:text-fg"
                }`}
              >
                <KindIcon kind={d.kind} className="size-4" />
                {d.label}
                {!sim.isOn(d.id) && (
                  <span
                    aria-label="mati"
                    className="size-1.5 rounded-full bg-red-400"
                  />
                )}
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {split && right && (
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  Panel kanan
                  <select
                    value={right}
                    onChange={(e) => setSecond(e.target.value)}
                    className="rounded-lg border border-line bg-bg px-2 py-1 text-xs text-fg outline-none"
                  >
                    {terminals
                      .filter((d) => d.id !== active)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {activeDev && activeDev.kind !== "cloud" && (
                <button
                  type="button"
                  onClick={() => togglePower(active)}
                  aria-pressed={activeOn}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    activeOn
                      ? "border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10"
                      : "border-red-400/30 text-red-300 hover:bg-red-400/10"
                  }`}
                >
                  <Power className="size-3.5" />
                  {activeOn ? "Matikan" : "Nyalakan"}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCfgDev(active)}
                disabled={!activeDev || activeDev.kind === "cloud"}
                className="flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:text-fg disabled:opacity-40"
              >
                <FileText className="size-3.5" />
                Konfigurasi
              </button>
              <button
                type="button"
                onClick={() => setSplit((v) => !v)}
                disabled={terminals.length < 2}
                aria-pressed={split}
                title="Dua terminal sejajar"
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition disabled:opacity-40 ${
                  split
                    ? "border-accent/40 bg-accent/15 text-fg"
                    : "border-line text-muted hover:text-fg"
                }`}
              >
                <Columns2 className="size-3.5" />
                Sejajar
              </button>
              <button
                type="button"
                onClick={() => setFull((v) => !v)}
                aria-pressed={full}
                title={full ? "Keluar layar penuh (Esc)" : "Layar penuh"}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                  full
                    ? "border-accent/40 bg-accent/15 text-fg"
                    : "border-line text-muted hover:text-fg"
                }`}
              >
                {full ? (
                  <Minimize2 className="size-3.5" />
                ) : (
                  <Maximize2 className="size-3.5" />
                )}
                {full ? "Tutup" : "Layar penuh"}
              </button>
              <span className="rounded-full border border-line px-2.5 py-1 text-xs text-muted">
                Mode simulasi
              </span>
            </div>
          </div>

          <div className={split ? "grid gap-3 lg:grid-cols-2" : ""}>
            {terminals.map((d) => {
              const visible = d.id === active || d.id === right;
              return (
                <div
                  key={`${d.id}-${epoch}`}
                  hidden={!visible}
                  style={{ order: d.id === active ? 0 : 1 }}
                >
                  <Terminal
                    kind={d.kind}
                    title={d.label}
                    prompt={sim.prompt(d.id)}
                    lines={lines[d.id] ?? []}
                    focused={active === d.id}
                    visible={visible}
                    height={full ? "h-[calc(100dvh-9rem)]" : "h-[360px]"}
                    disabled={!sim.isOn(d.id)}
                    onRun={(cmd) => run(d.id, cmd)}
                    onPower={() => togglePower(d.id)}
                    onSuggest={(v) => sim.suggest(d.id, v)}
                    onEcho={(input, out) => echo(d.id, input, out)}
                  />
                </div>
              );
            })}
          </div>
          <p className="px-1 text-xs text-muted">
            <kbd className="rounded border border-line px-1">Tab</kbd>{" "}
            melengkapi perintah,{" "}
            <kbd className="rounded border border-line px-1">?</kbd> menampilkan
            pilihan berikutnya,{" "}
            <kbd className="rounded border border-line px-1">↑</kbd>{" "}
            <kbd className="rounded border border-line px-1">↓</kbd> riwayat.
          </p>
        </section>
      </div>

      {/* Tugas */}
      <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Tugas</h3>
            <span className="text-sm text-muted">
              {passed}/{total} selesai
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${(passed / total) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setResults(sim.evaluateTasks())}
              className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            >
              Periksa jawaban
            </button>
            <button
              type="button"
              onClick={resetLab}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:text-fg"
            >
              <RotateCcw className="size-4" />
              Ulang lab
            </button>
          </div>
          {results && passed === total && (
            <div className="mt-3 space-y-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-300">
              <p>Semua tugas selesai. Lab ini tuntas.</p>
              <button
                type="button"
                onClick={saveToPortfolio}
                disabled={pf.state === "saving"}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-400/20 px-3 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-400/30 disabled:opacity-60"
              >
                <FolderPlus className="size-4" />
                {pf.state === "saving"
                  ? "Menyimpan…"
                  : pf.state === "done"
                    ? "Simpan ulang ke portofolio"
                    : "Simpan ke portofolio"}
              </button>
              {pf.msg && (
                <p
                  className={`text-xs ${pf.state === "error" ? "text-red-300" : "text-emerald-200"}`}
                >
                  {pf.msg}{" "}
                  {pf.state === "done" && (
                    <Link href="/portfolio" className="underline">
                      Lihat portofolio
                    </Link>
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        {spec.tasks.map((t, i) => {
          const r = results?.find((x) => x.id === t.id);
          const shown = hints[t.id] ?? 0;
          return (
            <div
              key={t.id}
              className={`rounded-2xl border p-4 ${
                r?.ok
                  ? "border-emerald-400/30 bg-emerald-400/5"
                  : r
                    ? "border-red-400/30 bg-card"
                    : "border-line bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    r?.ok
                      ? "bg-emerald-400/20 text-emerald-300"
                      : r
                        ? "bg-red-400/20 text-red-300"
                        : "bg-white/5 text-muted"
                  }`}
                >
                  {r?.ok ? (
                    <Check className="size-3.5" />
                  ) : r ? (
                    <X className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold leading-snug">
                    {t.title}
                  </h4>
                  <p className="mt-1 text-sm text-muted">{t.detail}</p>
                </div>
              </div>

              {r && (
                <ul className="mt-3 space-y-1 text-xs">
                  {r.checks.map((c, k) => (
                    <li key={k} className="flex items-start gap-2">
                      {c.ok ? (
                        <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-300" />
                      ) : (
                        <X className="mt-0.5 size-3.5 shrink-0 text-red-300" />
                      )}
                      <span className={c.ok ? "text-muted" : "text-fg"}>
                        {c.label}
                        {!c.ok && (
                          <span className="text-muted"> ({c.detail})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {t.hints && t.hints.length > 0 && (
                <div className="mt-3 space-y-2">
                  {t.hints.slice(0, shown).map((h, k) => (
                    <code
                      key={k}
                      className="block whitespace-pre-wrap break-words rounded-lg bg-bg px-3 py-2 font-mono text-xs text-fg"
                    >
                      {h}
                    </code>
                  ))}
                  {shown < t.hints.length && (
                    <button
                      type="button"
                      onClick={() =>
                        setHints((p) => ({ ...p, [t.id]: shown + 1 }))
                      }
                      className="flex items-center gap-1.5 text-xs text-muted transition hover:text-fg"
                    >
                      <Lightbulb className="size-3.5" />
                      Tampilkan petunjuk ({shown}/{t.hints.length})
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {cfgDev && (
        <ConfigDialog
          sim={sim}
          devices={terminals.map((d) => ({
            id: d.id,
            label: d.label,
            kind: d.kind,
          }))}
          id={cfgDev}
          onSelect={setCfgDev}
          onClose={() => setCfgDev(null)}
        />
      )}
    </div>
  );
}

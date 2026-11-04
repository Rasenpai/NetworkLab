"use client";

import { useEffect, useRef, useState } from "react";
import { DEVICES, LINKS, deviceById } from "@/lib/noc/topology";
import type { Device, Snapshot, Status } from "@/lib/noc/types";

export const STATUS_LABEL: Record<Status, string> = {
  up: "Normal",
  warning: "Warning",
  critical: "Critical",
  down: "Down",
};

export const STATUS_STYLE: Record<
  Status,
  { shape: string; link: string; badge: string }
> = {
  up: {
    shape: "fill-emerald-500/15 stroke-emerald-500",
    link: "stroke-emerald-500/45",
    badge: "bg-emerald-500/15 text-emerald-400",
  },
  warning: {
    shape: "fill-amber-500/20 stroke-amber-500",
    link: "stroke-amber-500",
    badge: "bg-amber-500/15 text-amber-400",
  },
  critical: {
    shape: "fill-red-500/20 stroke-red-500",
    link: "stroke-red-500",
    badge: "bg-red-500/15 text-red-400",
  },
  down: {
    shape: "fill-zinc-500/20 stroke-zinc-500",
    link: "stroke-zinc-500 [stroke-dasharray:6_6]",
    badge: "bg-zinc-500/20 text-zinc-400",
  },
};

const COLOR: Record<Status, string> = {
  up: "#10b981",
  warning: "#f59e0b",
  critical: "#ef4444",
  down: "#71717a",
};

const DOWNLOAD = "#38bdf8";
const UPLOAD = "#c084fc";

const VB_W = 750;
const VB_H = 520;
const MAX_ZOOM = 5;

/** Zona jaringan (latar belakang berlapis) dalam koordinat viewBox 750x520. */
const ZONES = [
  { label: "INTERNET", y: 4, h: 70, tint: "#38bdf8" },
  { label: "CORE & PERIMETER", y: 82, h: 160, tint: "#a78bfa" },
  { label: "DISTRIBUTION", y: 250, h: 82, tint: "#2dd4bf" },
  { label: "ACCESS & SERVER", y: 340, h: 176, tint: "#fbbf24" },
];

/* ---------- Nama port di tiap ujung link (dibuat sekali, deterministik) ---------- */

const PORTS: Record<string, { a: string; b: string }> = (() => {
  const counter: Record<string, number> = {};
  const name = (d: Device, mbps: number) => {
    const n = (counter[d.id] = (counter[d.id] ?? 0) + 1);
    if (d.type === "internet") return `ge-0/0/${n - 1}`;
    if (d.type === "ap" || d.type === "server") return `eth${n - 1}`;
    return mbps >= 10000 ? `Te1/0/${n}` : `Gi1/0/${n}`;
  };
  const out: Record<string, { a: string; b: string }> = {};
  for (const l of LINKS)
    out[l.id] = {
      a: name(deviceById[l.a], l.mbps),
      b: name(deviceById[l.b], l.mbps),
    };
  return out;
})();

/* ---------- Ikon perangkat (digambar di sekitar 0,0) ---------- */

function Icon({ d, c }: { d: Device; c: string }) {
  const body = "#0f1220";
  switch (d.type) {
    case "internet":
      return (
        <g>
          <path
            d="M-22 10 a9 9 0 0 1 2-17.5 a13 13 0 0 1 25-3 a11 11 0 0 1 17 9 a8 8 0 0 1 -2 11.5 Z"
            fill={body}
            stroke={c}
            strokeWidth={2}
            strokeLinejoin="round"
          />
          <ellipse
            cx={0}
            cy={-1}
            rx={9}
            ry={9}
            fill="none"
            stroke={c}
            strokeOpacity={0.7}
          />
          <ellipse
            cx={0}
            cy={-1}
            rx={4}
            ry={9}
            fill="none"
            stroke={c}
            strokeOpacity={0.5}
          />
          <line x1={-9} y1={-1} x2={9} y2={-1} stroke={c} strokeOpacity={0.5} />
        </g>
      );
    case "router":
      return (
        <g>
          <circle r={18} fill={body} stroke={c} strokeWidth={2} />
          <g stroke={c} strokeWidth={1.8} strokeLinecap="round" fill="none">
            <path d="M-9 0 H9 M-9 0 l3-3 M-9 0 l3 3 M9 0 l-3-3 M9 0 l-3 3" />
            <path d="M0 -9 V9 M0 -9 l-3 3 M0 -9 l3 3 M0 9 l-3-3 M0 9 l3-3" />
          </g>
        </g>
      );
    case "firewall":
      return (
        <g>
          <rect
            x={-22}
            y={-17}
            width={44}
            height={34}
            rx={4}
            fill={body}
            stroke={c}
            strokeWidth={2}
          />
          <g stroke={c} strokeOpacity={0.55} strokeWidth={1}>
            <line x1={-22} y1={-6} x2={22} y2={-6} />
            <line x1={-22} y1={5} x2={22} y2={5} />
            <line x1={-4} y1={-17} x2={-4} y2={-6} />
            <line x1={10} y1={-6} x2={10} y2={5} />
            <line x1={-10} y1={5} x2={-10} y2={17} />
            <line x1={4} y1={5} x2={4} y2={17} />
          </g>
          <path
            d="M0 -12 c4 4 6 7 3 11 c-1 -2 -2 -2 -3 -4 c-2 3 -5 4 -3 8 c-5 -3 -4 -10 3 -15Z"
            fill={c}
            opacity={0.9}
            transform="translate(0 4) scale(.75)"
          />
        </g>
      );
    case "switch":
      return (
        <g>
          <rect
            x={-26}
            y={-10}
            width={52}
            height={20}
            rx={3}
            fill={body}
            stroke={c}
            strokeWidth={2}
          />
          {Array.from({ length: 8 }, (_, i) => (
            <rect
              key={i}
              x={-21 + i * 5.6}
              y={-2}
              width={4}
              height={5}
              rx={0.8}
              fill={c}
              opacity={0.75}
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <circle key={i} cx={-19 + i * 5.6} cy={-6} r={0.9} fill={c}>
              <animate
                attributeName="opacity"
                values="1;0.2;1"
                dur={`${1.2 + (i % 3) * 0.5}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </g>
      );
    case "ap":
      return (
        <g>
          <circle r={12} fill={body} stroke={c} strokeWidth={2} />
          <circle r={2.2} cy={4} fill={c} />
          <g fill="none" stroke={c} strokeWidth={1.6} strokeLinecap="round">
            <path d="M-4.5 0.5 a6.5 6.5 0 0 1 9 0" />
            <path d="M-8 -2.5 a11 11 0 0 1 16 0" opacity={0.6} />
          </g>
        </g>
      );
    case "server":
      return (
        <g>
          <rect
            x={-14}
            y={-19}
            width={28}
            height={38}
            rx={3}
            fill={body}
            stroke={c}
            strokeWidth={2}
          />
          {[-13, -3, 7].map((yy, i) => (
            <g key={yy}>
              <rect
                x={-10}
                y={yy}
                width={20}
                height={7.5}
                rx={1.5}
                fill="none"
                stroke={c}
                strokeOpacity={0.6}
              />
              <circle cx={6} cy={yy + 3.75} r={1.3} fill={c}>
                <animate
                  attributeName="opacity"
                  values="1;0.25;1"
                  dur={`${1 + i * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
              <line
                x1={-7}
                y1={yy + 3.75}
                x2={0}
                y2={yy + 3.75}
                stroke={c}
                strokeOpacity={0.5}
              />
            </g>
          ))}
        </g>
      );
  }
}

/** Panah kecil yang bergerak sepanjang `path`, menghadap arah gerak. */
function Arrow({
  path,
  color,
  dur,
  delay,
}: {
  path: string;
  color: string;
  dur: number;
  delay: number;
}) {
  return (
    <path
      d="M-4.5 -3.2 L4.5 0 L-4.5 3.2 L-2.5 0 Z"
      fill={color}
      filter="url(#noc-glow)"
    >
      <animateMotion
        dur={`${dur}s`}
        begin={`${-delay}s`}
        repeatCount="indefinite"
        rotate="auto"
        path={path}
      />
    </path>
  );
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

type Props = {
  snapshot: Snapshot;
  selected: string | null;
  onSelect: (id: string) => void;
};

export function TopologyMap({ snapshot, selected, onSelect }: Props) {
  const [vb, setVb] = useState({ x: 0, y: 0, w: VB_W, h: VB_H });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    px: number;
    py: number;
    vx: number;
    vy: number;
  } | null>(null);
  const [panning, setPanning] = useState(false);

  const zoom = VB_W / vb.w;
  const showAllPorts = zoom >= 1.6;

  function zoomAt(factor: number, fx = 0.5, fy = 0.5) {
    setVb((v) => {
      const w = clamp(v.w / factor, VB_W / MAX_ZOOM, VB_W);
      const h = (w * VB_H) / VB_W;
      return {
        w,
        h,
        x: clamp(v.x + (v.w - w) * fx, 0, VB_W - w),
        y: clamp(v.y + (v.h - h) * fy, 0, VB_H - h),
      };
    });
  }

  // Ctrl/⌘ + scroll (juga pinch di trackpad) = zoom. Scroll biasa tetap menggulung halaman.
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(
        e.deltaY < 0 ? 1.18 : 1 / 1.18,
        (e.clientX - r.left) / r.width,
        (e.clientY - r.top) / r.height,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if ((e.target as Element).closest("[role=button]")) return; // klik perangkat, bukan geser
    if (zoom <= 1) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, vx: vb.x, vy: vb.y };
    setPanning(true);
  }
  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;
    const r = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - d.px) * vb.w) / r.width;
    const dy = ((e.clientY - d.py) * vb.h) / r.height;
    setVb((v) => ({
      ...v,
      x: clamp(d.vx - dx, 0, VB_W - v.w),
      y: clamp(d.vy - dy, 0, VB_H - v.h),
    }));
  }
  function endDrag() {
    drag.current = null;
    setPanning(false);
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className={`h-auto w-full touch-pan-y select-none ${
          zoom > 1 ? (panning ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
        role="group"
        aria-label="Peta topologi jaringan"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={(e) => {
          if ((e.target as Element).closest("[role=button]")) return;
          const r = e.currentTarget.getBoundingClientRect();
          zoomAt(
            1.6,
            (e.clientX - r.left) / r.width,
            (e.clientY - r.top) / r.height,
          );
        }}
      >
        <defs>
          <pattern
            id="noc-grid"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0H0V20"
              fill="none"
              stroke="currentColor"
              strokeOpacity={0.06}
            />
          </pattern>
          <filter id="noc-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect
          width={VB_W}
          height={VB_H}
          fill="url(#noc-grid)"
          className="text-white"
        />

        {/* zona */}
        {ZONES.map((z) => (
          <g key={z.label}>
            <rect
              x={6}
              y={z.y}
              width={738}
              height={z.h}
              rx={12}
              fill={z.tint}
              fillOpacity={0.045}
              stroke={z.tint}
              strokeOpacity={0.18}
              strokeDasharray="5 5"
            />
            <text
              x={16}
              y={z.y + 14}
              className="fill-current text-muted text-[9px] font-semibold tracking-[0.18em]"
              opacity={0.7}
            >
              {z.label}
            </text>
          </g>
        ))}

        {/* link: kabel + panah download (a→b) dan upload (b→a) */}
        {LINKS.map((l) => {
          const a = deviceById[l.a];
          const b = deviceById[l.b];
          const s = snapshot.links[l.id];
          const c = COLOR[s.status];
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          const ux = dx / len;
          const uy = dy / len;
          const nx = -uy * 3.5; // dua jalur sejajar, dipisah ±3.5
          const ny = ux * 3.5;
          const downPath = `M${a.x + nx} ${a.y + ny} L${b.x + nx} ${b.y + ny}`;
          const upPath = `M${b.x - nx} ${b.y - ny} L${a.x - nx} ${a.y - ny}`;
          const downDur = clamp(5.2 - (s.inMbps / l.mbps) * 8, 1.3, 5.2);
          const upDur = clamp(5.2 - (s.outMbps / l.mbps) * 8, 1.3, 5.2);
          const isSelLink = selected === l.a || selected === l.b;
          const showLabel = s.util >= 0.25 || s.status !== "up";
          const showPorts = showAllPorts || isSelLink;
          const live = s.status !== "down";
          return (
            <g key={l.id}>
              <title>{`${a.name} ↔ ${b.name} · ↓ ${Math.round(s.inMbps)} Mbps · ↑ ${Math.round(s.outMbps)} Mbps · ${Math.round(s.util * 100)}%`}</title>
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#05060d"
                strokeWidth={4 + s.util * 5}
                strokeLinecap="round"
                opacity={0.7}
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={c}
                strokeOpacity={
                  s.status === "up" ? (isSelLink ? 0.85 : 0.5) : 0.95
                }
                strokeWidth={1.5 + s.util * 4}
                strokeLinecap="round"
                strokeDasharray={s.status === "down" ? "6 6" : undefined}
              />
              {live && (
                <>
                  {[0, 1].map((k) => (
                    <Arrow
                      key={`d${k}`}
                      path={downPath}
                      color={DOWNLOAD}
                      dur={downDur}
                      delay={k * (downDur / 2)}
                    />
                  ))}
                  {[0, 1].map((k) => (
                    <Arrow
                      key={`u${k}`}
                      path={upPath}
                      color={UPLOAD}
                      dur={upDur}
                      delay={k * (upDur / 2)}
                    />
                  ))}
                </>
              )}
              {showLabel && (
                <g transform={`translate(${mx} ${my})`}>
                  <rect
                    x={-17}
                    y={-8}
                    width={34}
                    height={16}
                    rx={8}
                    fill="#0b0b14"
                    stroke={c}
                    strokeOpacity={0.7}
                  />
                  <text
                    textAnchor="middle"
                    y={3.5}
                    className="fill-current text-[9px] font-semibold tabular-nums"
                  >
                    {Math.round(s.util * 100)}%
                  </text>
                </g>
              )}
              {showPorts &&
                (
                  [
                    [a, b, PORTS[l.id].a],
                    [b, a, PORTS[l.id].b],
                  ] as const
                ).map(([from, to, port]) => {
                  const ex = to.x - from.x;
                  const ey = to.y - from.y;
                  const el = Math.hypot(ex, ey) || 1;
                  const ex1 = ex / el;
                  const ey1 = ey / el;
                  let px = -ey1;
                  let py = ex1;
                  if (px < 0 || (px === 0 && py < 0)) {
                    px = -px;
                    py = -py;
                  }
                  const w = port.length * 4.3 + 7;
                  const dist = Math.min(40, el * 0.38);
                  const cx = from.x + ex1 * dist + px * (6 + w / 2);
                  const cy = from.y + ey1 * dist + py * 8;
                  return (
                    <g
                      key={`${l.id}-${from.id}`}
                      transform={`translate(${cx} ${cy})`}
                    >
                      <rect
                        x={-w / 2}
                        y={-6}
                        width={w}
                        height={12}
                        rx={3}
                        fill="#0b0b14"
                        stroke="#ffffff"
                        strokeOpacity={0.18}
                      />
                      <text
                        textAnchor="middle"
                        y={3}
                        fontSize={7.5}
                        className="fill-current text-muted font-mono"
                      >
                        {port}
                      </text>
                    </g>
                  );
                })}
            </g>
          );
        })}

        {/* perangkat */}
        {DEVICES.map((d) => {
          const s = snapshot.devices[d.id];
          const isSel = selected === d.id;
          const c = COLOR[s.status];
          return (
            <g
              key={d.id}
              transform={`translate(${d.x} ${d.y})`}
              role="button"
              tabIndex={0}
              aria-label={`${d.name}, status ${STATUS_LABEL[s.status]}`}
              aria-pressed={isSel}
              className="cursor-pointer outline-none"
              onClick={() => onSelect(d.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(d.id);
                }
              }}
            >
              <title>{`${d.name} · ${d.ip} · ${d.role}`}</title>
              {s.status !== "up" && (
                <circle r={26} fill="none" stroke={c} strokeWidth={2}>
                  <animate
                    attributeName="r"
                    values="24;38;24"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0;0.7"
                    dur="1.6s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {isSel && (
                <circle
                  r={34}
                  fill="none"
                  strokeDasharray="4 4"
                  className="stroke-accent"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="14s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <g filter={s.status === "up" ? undefined : "url(#noc-glow)"}>
                <Icon d={d} c={c} />
              </g>
              {/* lampu status */}
              <circle
                cx={d.type === "internet" ? 26 : 18}
                cy={-16}
                r={3.5}
                fill={c}
                stroke="#0b0b14"
                strokeWidth={1.5}
              />
              <text
                y={d.type === "server" ? 34 : 32}
                textAnchor="middle"
                className="fill-current text-[11px] font-semibold"
              >
                {d.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* kontrol zoom */}
      <div className="absolute right-2 top-2 flex flex-col gap-1">
        {[
          ["+", "Perbesar", () => zoomAt(1.4)],
          ["−", "Perkecil", () => zoomAt(1 / 1.4)],
          [
            "⟲",
            "Reset tampilan",
            () => setVb({ x: 0, y: 0, w: VB_W, h: VB_H }),
          ],
        ].map(([label, tip, fn]) => (
          <button
            key={label as string}
            type="button"
            title={tip as string}
            aria-label={tip as string}
            onClick={fn as () => void}
            className="size-7 rounded border border-white/15 bg-black/50 text-sm leading-none hover:bg-white/10"
          >
            {label as string}
          </button>
        ))}
        <span className="mt-0.5 text-center text-[10px] tabular-nums text-muted">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* legenda arah trafik */}
      <div className="pointer-events-none absolute bottom-1 left-2 flex items-center gap-3 rounded bg-black/40 px-2 py-1 text-[10px] text-muted">
        <span className="flex items-center gap-1">
          <svg width="12" height="8" viewBox="-6 -4 12 8">
            <path d="M-5 -3 L5 0 L-5 3 Z" fill={DOWNLOAD} />
          </svg>
          Download
        </span>
        <span className="flex items-center gap-1">
          <svg width="12" height="8" viewBox="-6 -4 12 8">
            <path d="M-5 -3 L5 0 L-5 3 Z" fill={UPLOAD} />
          </svg>
          Upload
        </span>
      </div>
    </div>
  );
}

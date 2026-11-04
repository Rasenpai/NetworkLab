"use client";

import { useId, useState } from "react";

type Series = {
  label: string;
  values: number[];
  className: string; // mis. "stroke-sky-400"
  dot: string; // mis. "bg-sky-400"
};

const W = 600;
const H = 150;
const PAD = { l: 44, r: 10, t: 10, b: 22 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

/** Spline halus (Catmull-Rom -> Bezier) supaya garis tidak patah-patah. */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const niceMax = (peak: number) => {
  const raw = Math.max(1, peak * 1.15);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * mag;
};

const fmtVal = (v: number) => (v >= 100 ? v.toFixed(0) : v.toFixed(1));
const fmtClock = (t: number, sec = false) =>
  new Date(t).toLocaleTimeString("id-ID", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    ...(sec ? { second: "2-digit" } : {}),
  });

/**
 * Grafik area dengan gradient, grid, label sumbu, dan tooltip saat hover.
 * `times` (timestamp ms per titik) opsional; dipakai untuk label sumbu X.
 */
export function LineChart({
  series,
  unit,
  times,
}: {
  series: Series[];
  unit: string;
  times?: number[];
}) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const n = series[0]?.values.length ?? 0;
  const peak = Math.max(1, ...series.flatMap((s) => s.values));
  const max = niceMax(peak);
  const x = (i: number) => PAD.l + (i / Math.max(1, n - 1)) * IW;
  const y = (v: number) => PAD.t + IH - (Math.min(v, max) / max) * IH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xTicks =
    times && n > 1
      ? [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * (n - 1)))
      : [];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.l) / IW) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  }

  const hi = hover ?? n - 1; // tanpa hover: tampilkan nilai terkini

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className={`inline-block size-2 rounded-full ${s.dot}`} />
              {s.label}
              <span className="font-medium text-current">
                {n ? fmtVal(s.values[hi]) : "-"} {unit}
              </span>
            </span>
          ))}
        </span>
        {times && n > 0 && (
          <span className="tabular-nums">{fmtClock(times[hi], true)}</span>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        role="img"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          {series.map((s, k) => (
            <linearGradient
              key={s.label}
              id={`${uid}-g${k}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="currentColor"
                stopOpacity={0.35}
                className={s.className.replace("stroke-", "text-")}
              />
              <stop
                offset="100%"
                stopColor="currentColor"
                stopOpacity={0}
                className={s.className.replace("stroke-", "text-")}
              />
            </linearGradient>
          ))}
        </defs>

        {/* grid + label Y */}
        {yTicks.map((f) => {
          const yy = PAD.t + IH - f * IH;
          return (
            <g key={f}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={yy}
                y2={yy}
                strokeDasharray={f === 0 ? undefined : "3 4"}
                className="stroke-current text-muted opacity-20"
              />
              <text
                x={PAD.l - 6}
                y={yy + 3}
                textAnchor="end"
                className="fill-current text-muted text-[9px] tabular-nums"
              >
                {fmtVal(max * f)}
              </text>
            </g>
          );
        })}
        <text
          x={PAD.l - 6}
          y={PAD.t - 1}
          textAnchor="end"
          className="fill-current text-muted text-[8px]"
        >
          {unit}
        </text>

        {/* label X (waktu) */}
        {xTicks.map((i) => (
          <text
            key={i}
            x={x(i)}
            y={H - 6}
            textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
            className="fill-current text-muted text-[9px] tabular-nums"
          >
            {fmtClock(times![i])}
          </text>
        ))}

        {/* area + garis */}
        {series.map((s, k) => {
          const pts = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
          const line = smoothPath(pts);
          return (
            <g key={s.label}>
              <path
                d={`${line} L${x(n - 1)},${PAD.t + IH} L${x(0)},${PAD.t + IH} Z`}
                fill={`url(#${uid}-g${k})`}
              />
              <path
                d={line}
                fill="none"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={s.className}
              />
            </g>
          );
        })}

        {/* titik nilai terkini / crosshair hover */}
        {n > 0 && (
          <g>
            <line
              x1={x(hi)}
              x2={x(hi)}
              y1={PAD.t}
              y2={PAD.t + IH}
              strokeDasharray={hover === null ? "2 3" : undefined}
              className="stroke-current text-muted opacity-40"
            />
            {series.map((s) => (
              <g key={s.label}>
                <circle
                  cx={x(hi)}
                  cy={y(s.values[hi])}
                  r={5}
                  className={`${s.className} fill-none opacity-30`}
                  strokeWidth={4}
                />
                <circle
                  cx={x(hi)}
                  cy={y(s.values[hi])}
                  r={3}
                  className={`${s.className} fill-[#0b0b14]`}
                  strokeWidth={2}
                />
              </g>
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

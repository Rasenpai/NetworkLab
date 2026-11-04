"use client";

import { useEffect, useRef, useState } from "react";
import { DEVICES, LINKS, deviceById, linkName } from "@/lib/noc/topology";
import {
  buildHistory,
  diffEvents,
  summarize,
  takeSnapshot,
} from "@/lib/noc/simulator";
import type { NocEvent, Snapshot, Status } from "@/lib/noc/types";
import { LineChart } from "./line-chart";
import { STATUS_LABEL, STATUS_STYLE, TopologyMap } from "./topology-map";

const TICK_MS = 5000;
const HISTORY = 120; // 10 menit terakhir
const MAX_EVENTS = 50;

/* ---------- Format ---------- */

const fmtMbps = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(2)} Gbps` : `${Math.round(v)} Mbps`;
const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("id-ID", { hour12: false });
const fmtDateTime = (t: number) =>
  new Date(t).toLocaleString("id-ID", { hour12: false });
const fmtDur = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}j ${m % 60}m`;
  if (m) return `${m}m ${s % 60}d`;
  return `${s}d`;
};

/* ---------- Severity ala Zabbix ---------- */

type Sev = "disaster" | "high" | "average" | "warning" | "info" | "nc";

const SEV: Record<Sev, { label: string; color: string; text: string }> = {
  disaster: { label: "Disaster", color: "#E45959", text: "#fff" },
  high: { label: "High", color: "#E97659", text: "#fff" },
  average: { label: "Average", color: "#FFA059", text: "#1a1a1a" },
  warning: { label: "Warning", color: "#FFC859", text: "#1a1a1a" },
  info: { label: "Information", color: "#7499FF", text: "#fff" },
  nc: { label: "Not classified", color: "#97AAB3", text: "#1a1a1a" },
};
const SEV_ORDER: Sev[] = [
  "disaster",
  "high",
  "average",
  "warning",
  "info",
  "nc",
];
const sevOf = (s: Status): Sev =>
  s === "down" ? "disaster" : s === "critical" ? "high" : "warning";

const THRESH = {
  cpu: [80, 95],
  ram: [85, 95],
  temp: [70, 80],
} as const;
const barColor = (v: number, [w, c]: readonly [number, number]) =>
  v >= c ? "#E45959" : v >= w ? "#FFC859" : "#59DB8F";

type Problem = {
  key: string;
  host: string;
  hostId: string | null;
  text: string;
  sev: Sev;
};

function problemsOf(s: Snapshot): Problem[] {
  const out: Problem[] = [];
  for (const d of DEVICES) {
    const x = s.devices[d.id];
    if (x.status === "up") continue;
    const bits: string[] = [];
    if (x.cpu !== null && x.cpu >= THRESH.cpu[0]) bits.push(`CPU ${x.cpu}%`);
    if (x.ram !== null && x.ram >= THRESH.ram[0]) bits.push(`RAM ${x.ram}%`);
    if (x.temp !== null && x.temp >= THRESH.temp[0])
      bits.push(`Suhu ${x.temp}°C`);
    if (x.latency >= 80) bits.push(`Latency ${x.latency} ms`);
    if (x.loss >= 1) bits.push(`Packet loss ${x.loss}%`);
    out.push({
      key: `d:${d.id}`,
      host: d.name,
      hostId: d.id,
      text:
        x.status === "down"
          ? "Host tidak merespons ICMP"
          : bits.join(", ") || "Nilai di atas ambang",
      sev: sevOf(x.status),
    });
  }
  for (const l of LINKS) {
    const x = s.links[l.id];
    if (x.status === "up") continue;
    out.push({
      key: `l:${l.id}`,
      host: linkName(l),
      hostId: null,
      text:
        x.status === "down"
          ? "Link down"
          : `Utilisasi link ${Math.round(x.util * 100)}%`,
      sev: sevOf(x.status),
    });
  }
  return out;
}

/** Catat kapan tiap problem mulai; problem yang sudah hilang dibuang. */
function trackSince(cur: Record<string, number>, s: Snapshot) {
  const out: Record<string, number> = {};
  for (const p of problemsOf(s)) out[p.key] = cur[p.key] ?? s.t;
  return out;
}

/* ---------- Komponen kecil gaya Zabbix ---------- */

function Widget({
  title,
  right,
  className = "",
  bodyClass = "",
  children,
}: {
  title: string;
  right?: React.ReactNode;
  className?: string;
  bodyClass?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col overflow-hidden rounded-md border border-white/10 bg-white/2.5 ${className}`}
    >
      <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-white/4 px-3">
        <h3 className="truncate text-[13px] font-semibold">{title}</h3>
        {right && <div className="text-[11px] text-muted">{right}</div>}
      </header>
      <div className={`min-h-0 flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

function SevBadge({ sev }: { sev: Sev }) {
  const v = SEV[sev];
  return (
    <span
      className="inline-block rounded-sm px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: v.color, color: v.text }}
    >
      {v.label}
    </span>
  );
}

const TH =
  "px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted";
const TD = "px-3 py-1.5 text-[13px]";

function Bar({ v, th }: { v: number | null; th: readonly [number, number] }) {
  if (v === null) return <span className="text-muted">-</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-full min-w-12 overflow-hidden rounded-sm bg-white/10">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${Math.min(100, v)}%`, background: barColor(v, th) }}
        />
      </div>
      <span className="w-11 shrink-0 text-right text-xs tabular-nums">
        {v}%
      </span>
    </div>
  );
}

function stats(vals: number[]) {
  const last = vals[vals.length - 1] ?? 0;
  return {
    last,
    min: Math.min(...vals),
    avg: vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length),
    max: Math.max(...vals),
  };
}

const EVENT_STYLE: Record<NocEvent["level"], { label: string; color: string }> =
  {
    info: { label: "INFO", color: "#7499FF" },
    warning: { label: "PROBLEM", color: "#FFC859" },
    critical: { label: "PROBLEM", color: "#E97659" },
    recovered: { label: "RESOLVED", color: "#59DB8F" },
  };

/* ---------- Dashboard ---------- */

export function NocDashboard() {
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [events, setEvents] = useState<NocEvent[]>([]);
  const [since, setSince] = useState<Record<string, number>>({}); // kapan sebuah problem mulai
  const [selected, setSelected] = useState("core-r1");
  const last = useRef<Snapshot | null>(null);
  const nextId = useRef(1);

  // Data dibuat di browser (bukan saat SSR) supaya jam lokal dan hidrasi tidak bentrok.
  useEffect(() => {
    // setState dipanggil dari callback, bukan langsung di badan effect
    const boot = setTimeout(() => {
      const now = Date.now();
      const h = buildHistory(now, HISTORY, TICK_MS);
      const first = h[h.length - 1];
      last.current = first;
      setHistory(h);
      setSince(trackSince({}, first));
      setEvents([
        {
          id: 0,
          t: now,
          level: "info",
          text: "Monitoring dimulai. Semua perangkat dipantau tiap 5 detik.",
        },
      ]);
    }, 0);

    const timer = setInterval(() => {
      const next = takeSnapshot(Date.now());
      const prev = last.current;
      last.current = next;

      setSince((cur) => trackSince(cur, next));
      setHistory((cur) => [...cur.slice(-(HISTORY - 1)), next]);
      if (prev) {
        const fresh = diffEvents(prev, next).map((e) => ({
          ...e,
          id: nextId.current++,
        }));
        if (fresh.length)
          setEvents((cur) => [...fresh.reverse(), ...cur].slice(0, MAX_EVENTS));
      }
    }, TICK_MS);

    return () => {
      clearTimeout(boot);
      clearInterval(timer);
    };
  }, []);

  const now = history[history.length - 1];
  if (!now)
    return (
      <div className="rounded-md border border-white/10 p-5 text-sm text-muted">
        Memuat data monitoring…
      </div>
    );

  const sum = summarize(now);
  const sel = deviceById[selected];
  const selSample = now.devices[selected];
  const isInternet = sel.type === "internet";
  const series = history.map(summarize);
  const times = history.map((s) => s.t);

  const problems = problemsOf(now).sort(
    (a, b) => SEV_ORDER.indexOf(a.sev) - SEV_ORDER.indexOf(b.sev),
  );
  const sevCount = Object.fromEntries(SEV_ORDER.map((s) => [s, 0])) as Record<
    Sev,
    number
  >;
  for (const p of problems) sevCount[p.sev]++;

  const avail: Record<Status, number> = {
    up: 0,
    warning: 0,
    critical: 0,
    down: 0,
  };
  for (const d of DEVICES) avail[now.devices[d.id].status]++;
  const AVAIL_COLOR: Record<Status, string> = {
    up: "#59DB8F",
    warning: "#FFC859",
    critical: "#E97659",
    down: "#E45959",
  };

  const topCpu = DEVICES.filter((d) => now.devices[d.id].cpu !== null)
    .sort((a, b) => (now.devices[b.id].cpu ?? 0) - (now.devices[a.id].cpu ?? 0))
    .slice(0, 8);

  const dl = stats(series.map((s) => s.inMbps));
  const ul = stats(series.map((s) => s.outMbps));

  const items: [
    string,
    number | null,
    string,
    readonly [number, number] | null,
  ][] = [
    ["CPU utilization", selSample.cpu, "%", THRESH.cpu],
    ["Memory utilization", selSample.ram, "%", THRESH.ram],
    ["Temperature", selSample.temp, "°C", THRESH.temp],
    ["ICMP response time", selSample.latency, " ms", null],
    ["ICMP packet loss", selSample.loss, "%", null],
  ];

  return (
    <div className="space-y-4">
      {/* bar atas */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          Monitoring <span className="px-1">›</span> Dashboard{" "}
          <span className="px-1">›</span>
          <span className="font-medium text-current"> Global view</span>
        </span>
        <span className="flex items-center gap-3 tabular-nums">
          <span className="flex items-center gap-1.5">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Refresh {TICK_MS / 1000}d
          </span>
          <span>Update terakhir {fmtTime(now.t)}</span>
        </span>
      </div>

      {/* baris 1: ringkasan */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Widget
          title="Problems by severity"
          bodyClass="grid grid-cols-3 gap-px bg-white/10"
        >
          {SEV_ORDER.map((s) => (
            <div
              key={s}
              className="flex flex-col items-center justify-center py-3"
              style={{
                background: sevCount[s] ? SEV[s].color : "#14141f",
                color: sevCount[s] ? SEV[s].text : "#8b8fa3",
              }}
            >
              <span className="text-xl font-semibold tabular-nums">
                {sevCount[s]}
              </span>
              <span className="text-[10px] font-medium">{SEV[s].label}</span>
            </div>
          ))}
        </Widget>

        <Widget title="Host availability" bodyClass="p-3">
          <div className="flex h-5 overflow-hidden rounded-sm bg-white/10">
            {(Object.keys(avail) as Status[]).map(
              (s) =>
                avail[s] > 0 && (
                  <div
                    key={s}
                    style={{
                      width: `${(avail[s] / DEVICES.length) * 100}%`,
                      background: AVAIL_COLOR[s],
                    }}
                    title={`${STATUS_LABEL[s]}: ${avail[s]}`}
                  />
                ),
            )}
          </div>
          <table className="mt-3 w-full text-[13px]">
            <tbody>
              {(Object.keys(avail) as Status[]).map((s) => (
                <tr key={s}>
                  <td className="py-0.5">
                    <span
                      className="mr-2 inline-block size-2.5 rounded-sm align-middle"
                      style={{ background: AVAIL_COLOR[s] }}
                    />
                    {s === "up" ? "Available" : STATUS_LABEL[s]}
                  </td>
                  <td className="py-0.5 text-right font-medium tabular-nums">
                    {avail[s]}
                  </td>
                </tr>
              ))}
              <tr className="border-t border-white/10 text-muted">
                <td className="pt-1">Total</td>
                <td className="pt-1 text-right tabular-nums">
                  {DEVICES.length}
                </td>
              </tr>
            </tbody>
          </table>
        </Widget>

        <Widget
          title="Trafik internet"
          bodyClass="grid grid-cols-2 divide-x divide-white/10"
        >
          <div className="p-3">
            <p className="text-[11px] text-muted">Download</p>
            <p
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{ color: "#38bdf8" }}
            >
              {fmtMbps(sum.inMbps)}
            </p>
          </div>
          <div className="p-3">
            <p className="text-[11px] text-muted">Upload</p>
            <p
              className="mt-1 text-xl font-semibold tabular-nums"
              style={{ color: "#c084fc" }}
            >
              {fmtMbps(sum.outMbps)}
            </p>
          </div>
          <div className="col-span-2 border-t border-white/10 p-3">
            <p className="text-[11px] text-muted">
              Latency ISP (rata-rata ISP-A & ISP-B)
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {sum.ispLatency.toFixed(0)} ms
            </p>
          </div>
        </Widget>

        <Widget title="System information">
          <table className="w-full text-[13px]">
            <tbody className="divide-y divide-white/5">
              {[
                ["Host dipantau", `${DEVICES.length}`],
                ["Link dipantau", `${LINKS.length}`],
                ["Problem aktif", `${problems.length}`],
                ["Interval polling", `${TICK_MS / 1000} detik`],
                ["Mode", "Simulasi"],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="px-3 py-1.5 text-muted">{k}</td>
                  <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                    {v}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Widget>
      </div>

      {/* baris 2: peta + detail host */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Widget
          title="Network map: Topologi"
          className="lg:col-span-2"
          right="Klik perangkat · seret untuk geser · Ctrl+scroll untuk zoom"
          bodyClass="p-3"
        >
          <TopologyMap
            snapshot={now}
            selected={selected}
            onSelect={setSelected}
          />
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: AVAIL_COLOR[s] }}
                />
                {STATUS_LABEL[s]}
              </span>
            ))}
            <span className="ml-auto">Tebal garis & % = utilisasi link</span>
          </div>
        </Widget>

        <Widget
          title={`Host: ${sel.name}`}
          right={
            <span
              className={`rounded-sm px-2 py-0.5 font-medium ${STATUS_STYLE[selSample.status].badge}`}
            >
              {STATUS_LABEL[selSample.status]}
            </span>
          }
        >
          <div className="border-b border-white/10 px-3 py-2 text-[13px]">
            <p className="text-muted">{sel.role}</p>
            <p className="font-mono text-xs">{sel.ip}</p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className={TH}>Item</th>
                <th className={`${TH} text-right`}>Last value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items
                .filter(([, v]) => v !== null)
                .map(([name, v, unit, th]) => (
                  <tr key={name}>
                    <td className={TD}>{name}</td>
                    <td className={`${TD} text-right`}>
                      {th ? (
                        <Bar v={v} th={th} />
                      ) : (
                        <span className="font-medium tabular-nums">
                          {v}
                          {unit}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="border-t border-white/10 p-3">
            <LineChart
              unit={isInternet ? "ms" : "%"}
              times={times}
              series={[
                isInternet
                  ? {
                      label: "ICMP response time",
                      values: history.map((s) => s.devices[selected].latency),
                      className: "stroke-sky-400",
                      dot: "bg-sky-400",
                    }
                  : {
                      label: "CPU utilization",
                      values: history.map((s) => s.devices[selected].cpu ?? 0),
                      className: "stroke-sky-400",
                      dot: "bg-sky-400",
                    },
              ]}
            />
          </div>
        </Widget>
      </div>

      {/* baris 3: problems */}
      <Widget title="Problems" right={`${problems.length} aktif`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160">
            <thead>
              <tr className="border-b border-white/10">
                <th className={TH}>Time</th>
                <th className={TH}>Severity</th>
                <th className={TH}>Host</th>
                <th className={TH}>Problem</th>
                <th className={TH}>Duration</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {problems.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-[13px] text-muted"
                  >
                    Tidak ada problem aktif.
                  </td>
                </tr>
              )}
              {problems.map((p) => {
                const t0 = since[p.key] ?? now.t;
                return (
                  <tr
                    key={p.key}
                    className="cursor-pointer hover:bg-white/4"
                    style={{ boxShadow: `inset 3px 0 0 ${SEV[p.sev].color}` }}
                    onClick={() => p.hostId && setSelected(p.hostId)}
                  >
                    <td className={`${TD} tabular-nums text-muted`}>
                      {fmtDateTime(t0)}
                    </td>
                    <td className={TD}>
                      <SevBadge sev={p.sev} />
                    </td>
                    <td className={TD}>{p.host}</td>
                    <td className={TD}>{p.text}</td>
                    <td className={`${TD} tabular-nums`}>
                      {fmtDur(now.t - t0)}
                    </td>
                    <td className={TD}>
                      <span
                        className="font-semibold"
                        style={{ color: "#E45959" }}
                      >
                        PROBLEM
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Widget>

      {/* baris 4: grafik + top CPU */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Widget
          title="Graph: Trafik Internet (ISP-A + ISP-B)"
          right="10 menit terakhir"
          className="lg:col-span-2"
          bodyClass="p-3"
        >
          <LineChart
            unit="Mbps"
            times={times}
            series={[
              {
                label: "Download",
                values: series.map((s) => s.inMbps),
                className: "stroke-sky-400",
                dot: "bg-sky-400",
              },
              {
                label: "Upload",
                values: series.map((s) => s.outMbps),
                className: "stroke-violet-400",
                dot: "bg-violet-400",
              },
            ]}
          />
          <table className="mt-3 w-full text-[12px]">
            <thead>
              <tr className="border-b border-white/10 text-muted">
                <th className="py-1 text-left font-medium" />
                {["last", "min", "avg", "max"].map((h) => (
                  <th key={h} className="py-1 text-right font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {[
                ["Download", "bg-sky-400", dl],
                ["Upload", "bg-violet-400", ul],
              ].map(([name, dot, st]) => {
                const x = st as ReturnType<typeof stats>;
                return (
                  <tr key={name as string}>
                    <td className="py-1">
                      <span
                        className={`mr-2 inline-block size-2 rounded-sm ${dot}`}
                      />
                      {name as string}
                    </td>
                    {[x.last, x.min, x.avg, x.max].map((v, i) => (
                      <td key={i} className="py-1 text-right">
                        {fmtMbps(v)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Widget>

        <Widget title="Top hosts by CPU utilization">
          <table className="w-full">
            <tbody className="divide-y divide-white/5">
              {topCpu.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer hover:bg-white/4"
                  onClick={() => setSelected(d.id)}
                >
                  <td className={`${TD} w-24`}>{d.name}</td>
                  <td className={TD}>
                    <Bar v={now.devices[d.id].cpu} th={THRESH.cpu} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Widget>
      </div>

      {/* baris 5: latest data + events */}
      <div className="grid gap-4 xl:grid-cols-3">
        <Widget
          title="Hosts: Latest data"
          right={`${DEVICES.length} host`}
          className="xl:col-span-2"
        >
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-180">
              <thead className="sticky top-0 bg-[#14141f]">
                <tr className="border-b border-white/10">
                  {[
                    "Name",
                    "IP",
                    "Status",
                    "CPU",
                    "RAM",
                    "Temp",
                    "Latency",
                    "Loss",
                  ].map((h) => (
                    <th key={h} className={TH}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {DEVICES.map((d) => {
                  const x = now.devices[d.id];
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d.id)}
                      className={`cursor-pointer hover:bg-white/4 ${selected === d.id ? "bg-white/6" : ""}`}
                    >
                      <td className={`${TD} font-medium`}>{d.name}</td>
                      <td className={`${TD} font-mono text-xs text-muted`}>
                        {d.ip}
                      </td>
                      <td className={TD}>
                        <span
                          className={`rounded-sm px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[x.status].badge}`}
                        >
                          {STATUS_LABEL[x.status]}
                        </span>
                      </td>
                      <td className={`${TD} w-36`}>
                        <Bar v={x.cpu} th={THRESH.cpu} />
                      </td>
                      <td className={`${TD} w-36`}>
                        <Bar v={x.ram} th={THRESH.ram} />
                      </td>
                      <td className={`${TD} tabular-nums`}>
                        {x.temp === null ? "-" : `${x.temp}°C`}
                      </td>
                      <td className={`${TD} tabular-nums`}>{x.latency} ms</td>
                      <td className={`${TD} tabular-nums`}>{x.loss}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Widget>

        <Widget title="Latest events" right={`${events.length} terbaru`}>
          <ul className="max-h-96 divide-y divide-white/5 overflow-y-auto">
            {events.map((e) => {
              const st = EVENT_STYLE[e.level];
              return (
                <li
                  key={e.id}
                  className="px-3 py-2"
                  style={{ boxShadow: `inset 3px 0 0 ${st.color}` }}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold" style={{ color: st.color }}>
                      {st.label}
                    </span>
                    <span className="tabular-nums text-muted">
                      {fmtTime(e.t)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug">{e.text}</p>
                </li>
              );
            })}
          </ul>
        </Widget>
      </div>
    </div>
  );
}

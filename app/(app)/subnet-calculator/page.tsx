"use client";

import { useState } from "react";

/* ───────────────────────── Helpers umum ───────────────────────── */

type Row = [string, string];

const inputCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

const btnPrimary =
  "rounded-lg bg-accent px-5 py-2 text-sm font-medium text-white transition hover:opacity-90";

const btnGhost =
  "rounded-lg border border-line px-5 py-2 text-sm font-medium text-muted transition hover:text-fg";

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
      {children}
    </section>
  );
}

function ResultTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([label, value], i) => (
            <tr key={label} className={i % 2 === 0 ? "bg-bg/40" : "bg-card"}>
              <th className="w-2/5 whitespace-nowrap px-4 py-2 text-left font-medium text-muted sm:w-1/3">
                {label}
              </th>
              <td className="break-all px-4 py-2 font-mono text-fg">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      {message}
    </p>
  );
}

/* ───────────────────────── IPv4 ───────────────────────── */

type NetClass = "any" | "A" | "B" | "C";

const MIN_PREFIX: Record<NetClass, number> = { any: 1, A: 8, B: 16, C: 24 };

type V4Entry = {
  network: string;
  range: string;
  broadcast: string;
  current: boolean;
};

type V4Data = {
  main: Row[];
  extra: Row[];
  listTitle: string | null;
  list: V4Entry[];
};

function parseIPv4(s: string): number | null {
  const parts = s.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function toDotted(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}

function maskFromPrefix(p: number): number {
  return p === 0 ? 0 : (0xffffffff << (32 - p)) >>> 0;
}

function ipClass(first: number): string {
  if (first < 128) return "A";
  if (first < 192) return "B";
  if (first < 224) return "C";
  if (first < 240) return "D (Multicast)";
  return "E (Reserved)";
}

function ipType(ip: number): string {
  const a = (ip >>> 24) & 255;
  const b = (ip >>> 16) & 255;
  if (ip === 0xffffffff) return "Limited Broadcast";
  if (a === 0) return "This Network (Reserved)";
  if (a === 10) return "Private";
  if (a === 127) return "Loopback";
  if (a === 172 && b >= 16 && b <= 31) return "Private";
  if (a === 192 && b === 168) return "Private";
  if (a === 169 && b === 254) return "Link-Local";
  if (a === 100 && b >= 64 && b <= 127) return "Shared Address Space (CGNAT)";
  if (a >= 224 && a <= 239) return "Multicast";
  if (a >= 240) return "Reserved";
  return "Public";
}

function usableRange(network: number, broadcast: number, p: number) {
  if (p === 32) return { first: network, last: network, count: 1 };
  if (p === 31) return { first: network, last: broadcast, count: 2 };
  return {
    first: network + 1,
    last: broadcast - 1,
    count: broadcast - network - 1,
  };
}

function calcV4(ipStr: string, p: number | ""): V4Data | string {
  if (p === "") return "Pilih subnet mask terlebih dahulu.";
  if (!ipStr.trim()) return "Masukkan alamat IPv4 terlebih dahulu.";

  const ip = parseIPv4(ipStr);
  if (ip === null) return "Alamat IPv4 tidak valid. Contoh: 192.168.1.10";

  const mask = maskFromPrefix(p);
  const wildcard = ~mask >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const total = Math.pow(2, 32 - p);
  const u = usableRange(network, broadcast, p);

  const ipDotted = toDotted(ip);
  const hi = ip >>> 16;
  const lo = ip & 0xffff;
  const binMask = [24, 16, 8, 0]
    .map((s) => ((mask >>> s) & 255).toString(2).padStart(8, "0"))
    .join(".");

  const main: Row[] = [
    ["IP Address", ipDotted],
    ["Network Address", toDotted(network)],
    ["Usable Host IP Range", `${toDotted(u.first)} - ${toDotted(u.last)}`],
    ["Broadcast Address", toDotted(broadcast)],
    ["Total Number of Hosts", total.toLocaleString("en-US")],
    ["Number of Usable Hosts", u.count.toLocaleString("en-US")],
    ["Subnet Mask", toDotted(mask)],
    ["Wildcard Mask", toDotted(wildcard)],
    ["Binary Subnet Mask", binMask],
    ["IP Class", ipClass(ip >>> 24)],
    ["CIDR Notation", `/${p}`],
    ["IP Type", ipType(ip)],
  ];

  const extra: Row[] = [
    ["Short", `${ipDotted} /${p}`],
    ["Binary ID", ip.toString(2).padStart(32, "0")],
    ["Integer ID", String(ip)],
    ["Hex ID", "0x" + ip.toString(16).padStart(8, "0")],
    ["in-addr.arpa", ipDotted.split(".").reverse().join(".") + ".in-addr.arpa"],
    ["IPv4 Mapped Address", `::ffff:${hi.toString(16)}:${lo.toString(16)}`],
    ["6to4 Prefix", `2002:${hi.toString(16)}:${lo.toString(16)}::/48`],
  ];

  // Daftar semua subnet dengan ukuran yang sama di dalam /24 yang sama
  let listTitle: string | null = null;
  const list: V4Entry[] = [];
  if (p >= 24) {
    const base = (ip & 0xffffff00) >>> 0;
    const size = Math.pow(2, 32 - p);
    const count = Math.pow(2, p - 24);
    const prefix3 = toDotted(base).split(".").slice(0, 3).join(".");
    listTitle = `All ${count} of the Possible /${p} Networks for ${prefix3}.*`;
    for (let i = 0; i < count; i++) {
      const net = base + i * size;
      const bc = net + size - 1;
      const r = usableRange(net, bc, p);
      list.push({
        network: toDotted(net),
        range: `${toDotted(r.first)} - ${toDotted(r.last)}`,
        broadcast: toDotted(bc),
        current: net === network,
      });
    }
  }

  return { main, extra, listTitle, list };
}

function IPv4Calculator() {
  const [cls, setCls] = useState<NetClass>("any");
  const [prefix, setPrefix] = useState<number | "">("");
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<V4Data | string | null>(null);

  const minPrefix = MIN_PREFIX[cls];
  const prefixes = Array.from(
    { length: 32 - minPrefix + 1 },
    (_, i) => minPrefix + i,
  );

  function changeClass(c: NetClass) {
    setCls(c);
    setPrefix((p) => (p === "" ? "" : Math.max(p, MIN_PREFIX[c])));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(calcV4(ip, prefix));
  }

  function onClear() {
    setCls("any");
    setPrefix("");
    setIp("");
    setResult(null);
  }

  return (
    <Panel>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <span className="w-28 text-sm text-muted">Network Class</span>
          {(["any", "A", "B", "C"] as NetClass[]).map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2 text-sm text-fg"
            >
              <input
                type="radio"
                name="net-class"
                checked={cls === c}
                onChange={() => changeClass(c)}
                className="accent-accent"
              />
              {c === "any" ? "Any" : c}
            </label>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="v4-subnet" className="w-28 text-sm text-muted">
            Subnet
          </label>
          <select
            id="v4-subnet"
            value={prefix}
            onChange={(e) =>
              setPrefix(e.target.value === "" ? "" : Number(e.target.value))
            }
            className={`${inputCls} sm:max-w-xs`}
          >
            <option value="" disabled>
              Pilih subnet...
            </option>
            {prefixes.map((p) => (
              <option key={p} value={p}>
                {toDotted(maskFromPrefix(p))} /{p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="v4-ip" className="w-28 text-sm text-muted">
            IP Address
          </label>
          <input
            id="v4-ip"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.10"
            inputMode="decimal"
            autoComplete="off"
            spellCheck={false}
            className={`${inputCls} font-mono sm:max-w-xs`}
          />
        </div>

        <div className="flex gap-2 sm:pl-28">
          <button type="submit" className={btnPrimary}>
            Calculate
          </button>
          <button type="button" onClick={onClear} className={btnGhost}>
            Clear
          </button>
        </div>
      </form>

      {typeof result === "string" && <ErrorBox message={result} />}

      {result && typeof result !== "string" && (
        <div className="mt-6 space-y-4">
          <ResultTable rows={result.main} />
          <ResultTable rows={result.extra} />

          {result.listTitle && (
            <div className="space-y-3 pt-2">
              <h3 className="text-base font-semibold text-fg">
                {result.listTitle}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent/20 text-left text-fg">
                      <th className="whitespace-nowrap px-4 py-2 font-semibold">
                        Network Address
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-semibold">
                        Usable Host Range
                      </th>
                      <th className="whitespace-nowrap px-4 py-2 font-semibold">
                        Broadcast Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {result.list.map((r, i) => (
                      <tr
                        key={r.network}
                        className={
                          r.current
                            ? "bg-accent/25 text-fg"
                            : i % 2 === 0
                              ? "bg-bg/40 text-fg"
                              : "bg-card text-fg"
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-2">
                          {r.network}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {r.range}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2">
                          {r.broadcast}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ───────────────────────── IPv6 ───────────────────────── */

const ZERO = BigInt(0);
const ONE = BigInt(1);
const MAX128 = (ONE << BigInt(128)) - ONE;

type V6Data = { main: Row[]; extra: Row[] };

function parseIPv6(input: string): bigint | null {
  let s = input.trim();
  if (!s || /[^0-9a-fA-F:.]/.test(s)) return null;

  // Dukungan IPv4 di ujung, misal ::ffff:192.168.1.1
  if (s.includes(".")) {
    const idx = s.lastIndexOf(":");
    if (idx === -1) return null;
    const v4 = parseIPv4(s.slice(idx + 1));
    if (v4 === null) return null;
    s =
      s.slice(0, idx + 1) +
      (v4 >>> 16).toString(16) +
      ":" +
      (v4 & 0xffff).toString(16);
  }

  const dbl = s.split("::");
  if (dbl.length > 2) return null;
  const toGroups = (part: string) => (part === "" ? [] : part.split(":"));
  const head = toGroups(dbl[0]);
  const tail = dbl.length === 2 ? toGroups(dbl[1]) : [];

  let groups: string[];
  if (dbl.length === 2) {
    const missing = 8 - head.length - tail.length;
    if (missing < 1) return null;
    groups = [...head, ...Array(missing).fill("0"), ...tail];
  } else {
    groups = head;
    if (groups.length !== 8) return null;
  }

  let n = ZERO;
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    n = (n << BigInt(16)) | BigInt(parseInt(g, 16));
  }
  return n;
}

function groupsOf(n: bigint): number[] {
  return Array.from({ length: 8 }, (_, i) =>
    Number((n >> BigInt((7 - i) * 16)) & BigInt(0xffff)),
  );
}

function compressV6(n: bigint): string {
  const hex = groupsOf(n).map((g) => g.toString(16));
  let bestStart = -1;
  let bestLen = 0;
  let i = 0;
  while (i < 8) {
    if (hex[i] === "0") {
      let j = i;
      while (j < 8 && hex[j] === "0") j++;
      if (j - i > bestLen) {
        bestStart = i;
        bestLen = j - i;
      }
      i = j;
    } else {
      i++;
    }
  }
  if (bestLen < 2) return hex.join(":");
  const left = hex.slice(0, bestStart).join(":");
  const right = hex.slice(bestStart + bestLen).join(":");
  return `${left}::${right}`;
}

function expandV6(n: bigint): string {
  return groupsOf(n)
    .map((g) => g.toString(16).padStart(4, "0"))
    .join(":");
}

function v6Type(n: bigint): string {
  const g = groupsOf(n);
  if (n === ZERO) return "Unspecified (::/128)";
  if (n === ONE) return "Loopback (::1/128)";
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff)
    return "IPv4-Mapped (::ffff:0:0/96)";
  if ((g[0] & 0xffc0) === 0xfe80) return "Link-Local Unicast (fe80::/10)";
  if ((g[0] & 0xfe00) === 0xfc00) return "Unique Local (fc00::/7)";
  if ((g[0] & 0xff00) === 0xff00) return "Multicast (ff00::/8)";
  if (g[0] === 0x2001 && g[1] === 0x0db8)
    return "Documentation (2001:db8::/32)";
  if (g[0] === 0x2002) return "6to4 (2002::/16)";
  if ((g[0] & 0xe000) === 0x2000) return "Global Unicast (2000::/3)";
  return "Reserved / Unassigned";
}

function calcV6(ipStr: string, p: number | ""): V6Data | string {
  if (p === "") return "Pilih prefix length terlebih dahulu.";
  if (!ipStr.trim()) return "Masukkan alamat IPv6 terlebih dahulu.";

  const addr = parseIPv6(ipStr);
  if (addr === null)
    return "Alamat IPv6 tidak valid. Contoh: 2001:db8:85a3::8a2e:370:7334";

  const hostBits = BigInt(128 - p);
  const hostMask = (ONE << hostBits) - ONE;
  const netMask = MAX128 ^ hostMask;
  const network = addr & netMask;
  const last = network | hostMask;
  const total = ONE << hostBits;

  const main: Row[] = [
    ["IP Address", compressV6(addr)],
    ["Expanded Address", expandV6(addr)],
    ["Prefix Length", `/${p}`],
    ["Network Address", `${compressV6(network)}/${p}`],
    ["First Address", compressV6(network)],
    ["Last Address", compressV6(last)],
    ["Total Addresses", total.toLocaleString("en-US")],
  ];
  if (p <= 64) {
    main.push([
      "Number of /64 Subnets",
      (ONE << BigInt(64 - p)).toLocaleString("en-US"),
    ]);
  }
  main.push(["Address Type", v6Type(addr)]);

  const nibbles = expandV6(addr).replace(/:/g, "");
  const extra: Row[] = [
    ["Short", `${compressV6(addr)} /${p}`],
    ["Integer ID", addr.toString()],
    ["Hex ID", "0x" + addr.toString(16).padStart(32, "0")],
    ["ip6.arpa", nibbles.split("").reverse().join(".") + ".ip6.arpa"],
  ];

  return { main, extra };
}

function IPv6Calculator() {
  const [prefix, setPrefix] = useState<number | "">("");
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<V6Data | string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResult(calcV6(ip, prefix));
  }

  function onClear() {
    setPrefix("");
    setIp("");
    setResult(null);
  }

  return (
    <Panel>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="v6-prefix" className="w-28 text-sm text-muted">
            Prefix Length
          </label>
          <select
            id="v6-prefix"
            value={prefix}
            onChange={(e) =>
              setPrefix(e.target.value === "" ? "" : Number(e.target.value))
            }
            className={`${inputCls} sm:max-w-[12rem]`}
          >
            <option value="" disabled>
              Pilih prefix...
            </option>
            {Array.from({ length: 128 }, (_, i) => i + 1).map((p) => (
              <option key={p} value={p}>
                /{p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="v6-ip" className="w-28 text-sm text-muted">
            IP Address
          </label>
          <input
            id="v6-ip"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="2001:db8::1"
            autoComplete="off"
            spellCheck={false}
            className={`${inputCls} font-mono sm:max-w-md`}
          />
        </div>

        <div className="flex gap-2 sm:pl-28">
          <button type="submit" className={btnPrimary}>
            Calculate
          </button>
          <button type="button" onClick={onClear} className={btnGhost}>
            Clear
          </button>
        </div>
      </form>

      {typeof result === "string" && <ErrorBox message={result} />}

      {result && typeof result !== "string" && (
        <div className="mt-6 space-y-4">
          <ResultTable rows={result.main} />
          <ResultTable rows={result.extra} />
        </div>
      )}
    </Panel>
  );
}

/* ───────────────────────── Page ───────────────────────── */

type Tab = "ipv4" | "ipv6";

const TABS: { id: Tab; label: string }[] = [
  { id: "ipv4", label: "IPv4" },
  { id: "ipv6", label: "IPv6" },
];

export default function SubnetCalculatorPage() {
  const [tab, setTab] = useState<Tab>("ipv4");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <p className="text-sm text-muted">
        Hitung network address, rentang host, broadcast, dan detail subnet untuk
        IPv4 maupun IPv6.
      </p>

      <div
        role="tablist"
        aria-label="Versi IP"
        className="inline-flex rounded-xl border border-line bg-card p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-white shadow"
                  : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Dua-duanya tetap ter-mount supaya isian tidak hilang saat pindah tab */}
      <div
        role="tabpanel"
        id="panel-ipv4"
        aria-labelledby="tab-ipv4"
        hidden={tab !== "ipv4"}
      >
        <IPv4Calculator />
      </div>
      <div
        role="tabpanel"
        id="panel-ipv6"
        aria-labelledby="tab-ipv6"
        hidden={tab !== "ipv6"}
      >
        <IPv6Calculator />
      </div>
    </div>
  );
}

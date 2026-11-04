"use client";

import type {
  CanvasDevice,
  CanvasLink,
  IfaceCfg,
  Topology,
} from "@/lib/cisco-canvas";
import { CABLE_LABEL, linkUp, portDef, shortPort } from "@/lib/cisco-ports";
import { cidrLabel, isValidIp, sameSubnet } from "@/lib/net-utils";
import { DEVICE_LABEL, isHost } from "./device-icons";

type Theme = "dark" | "light";

const CLS = {
  dark: {
    card: "border-white/10 bg-[#171225] text-zinc-200",
    input:
      "border-white/10 bg-black/25 text-zinc-100 placeholder:text-zinc-600",
    mu: "text-zinc-400",
  },
  light: {
    card: "border-zinc-300 bg-white text-zinc-800",
    input: "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400",
    mu: "text-zinc-500",
  },
} as const;

const PREFIXES = Array.from({ length: 25 }, (_, i) => i + 8); // /8 .. /32

type Props = {
  device: CanvasDevice;
  topo: Topology;
  theme: Theme;
  onUpdate: (id: number, patch: Partial<CanvasDevice>) => void;
  onIface: (id: number, linkId: number, cfg: IfaceCfg) => void;
};

/** Semua IP yang terpasang di canvas, untuk mendeteksi duplikat. */
function usedIps(t: Topology) {
  const out: { key: string; ip: string; name: string }[] = [];
  for (const d of t.devices) {
    if (isHost(d.t) && d.ip)
      out.push({ key: `d${d.id}`, ip: d.ip, name: d.name });
    if (d.t === "rt")
      for (const [lid, f] of Object.entries(d.ifs))
        if (f.ip) out.push({ key: `d${d.id}l${lid}`, ip: f.ip, name: d.name });
  }
  return out;
}

function Hint({ text }: { text: string | null }) {
  return text ? <p className="mt-1 text-xs text-amber-500">{text}</p> : null;
}

export function DevicePanel({ device, topo, theme, onUpdate, onIface }: Props) {
  const c = CLS[theme];
  const used = usedIps(topo);

  const ipHint = (ip: string, key: string) => {
    if (!ip) return null;
    if (!isValidIp(ip)) return "Format IP tidak valid (contoh 192.168.1.10).";
    const dup = used.find((u) => u.ip === ip && u.key !== key);
    return dup ? `IP ini sudah dipakai ${dup.name}.` : null;
  };

  const field = `w-full rounded-lg border px-2.5 py-1.5 text-sm outline-none focus:border-violet-400 ${c.input}`;
  const label = `mt-3 block text-xs ${c.mu}`;

  const prefixSelect = (value: number, onChange: (p: number) => void) => {
    const opts = PREFIXES.includes(value) ? PREFIXES : [value, ...PREFIXES];
    return (
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`${field} !w-20 shrink-0`}
      >
        {opts.map((p) => (
          <option key={p} value={p}>
            /{p}
          </option>
        ))}
      </select>
    );
  };

  const links = topo.links
    .filter((l) => l.a === device.id || l.b === device.id)
    .sort((x, y) => x.id - y.id);

  const portOf = (l: CanvasLink) => (l.a === device.id ? l.ap : l.bp);
  const peerPortOf = (l: CanvasLink) => (l.a === device.id ? l.bp : l.ap);
  const otherOf = (l: CanvasLink) =>
    topo.devices.find((d) => d.id === (l.a === device.id ? l.b : l.a));
  const statusOf = (l: CanvasLink) => {
    const a = topo.devices.find((d) => d.id === l.a);
    const b = topo.devices.find((d) => d.id === l.b);
    return a && b && !linkUp(l.c, a.t, b.t)
      ? `Link mati: kabel ${CABLE_LABEL[l.c]} salah untuk koneksi ini.`
      : null;
  };

  // Router: hanya port yang bisa diberi IP (Ethernet / Serial), console tidak.
  const rtLinks = links.filter((l) => {
    const k = portDef(device.t, portOf(l))?.kind;
    return k === "eth" || k === "ser";
  });

  return (
    <aside
      className={`w-full rounded-xl border p-4 text-sm ${c.card}`}
      style={{ colorScheme: theme }}
    >
      <h2 className="font-semibold">{DEVICE_LABEL[device.t]}</h2>

      <label className={label}>Hostname</label>
      <input
        className={field}
        value={device.name}
        maxLength={24}
        onChange={(e) => onUpdate(device.id, { name: e.target.value })}
      />

      {isHost(device.t) && (
        <>
          <label className={label}>IP address</label>
          <div className="flex gap-2">
            <input
              className={field}
              value={device.ip}
              placeholder="192.168.1.10"
              maxLength={15}
              inputMode="decimal"
              onChange={(e) =>
                onUpdate(device.id, { ip: e.target.value.trim() })
              }
            />
            {prefixSelect(device.p, (p) => onUpdate(device.id, { p }))}
          </div>
          <Hint text={ipHint(device.ip, `d${device.id}`)} />
          {cidrLabel(device.ip, device.p) && (
            <p className={`mt-1 text-xs ${c.mu}`}>
              Network: {cidrLabel(device.ip, device.p)}
            </p>
          )}

          <label className={label}>Default gateway</label>
          <input
            className={field}
            value={device.gw}
            placeholder="192.168.1.1"
            maxLength={15}
            inputMode="decimal"
            onChange={(e) => onUpdate(device.id, { gw: e.target.value.trim() })}
          />
          <Hint
            text={
              device.gw && !isValidIp(device.gw)
                ? "Format gateway tidak valid."
                : device.gw &&
                    isValidIp(device.ip) &&
                    !sameSubnet(device.ip, device.p, device.gw)
                  ? "Gateway berada di luar subnet perangkat."
                  : null
            }
          />
        </>
      )}

      {device.t === "rt" && (
        <>
          <p
            className={`mt-4 text-xs font-medium uppercase tracking-wide ${c.mu}`}
          >
            Interface
          </p>
          {rtLinks.length === 0 && (
            <p className={`mt-2 ${c.mu}`}>
              Belum ada kabel. Hubungkan router ke switch atau PC dulu.
            </p>
          )}
          {rtLinks.map((l) => {
            const other = otherOf(l);
            const cfg = device.ifs[String(l.id)] ?? { ip: "", p: 24 };
            return (
              <div key={l.id}>
                <label className={label}>
                  {portOf(l)} → {other?.name ?? "?"}{" "}
                  <span className="opacity-70">({CABLE_LABEL[l.c]})</span>
                </label>
                <div className="flex gap-2">
                  <input
                    className={field}
                    value={cfg.ip}
                    placeholder="IP interface"
                    maxLength={15}
                    inputMode="decimal"
                    onChange={(e) =>
                      onIface(device.id, l.id, {
                        ...cfg,
                        ip: e.target.value.trim(),
                      })
                    }
                  />
                  {prefixSelect(cfg.p, (p) =>
                    onIface(device.id, l.id, { ...cfg, p }),
                  )}
                </div>
                <Hint
                  text={statusOf(l) ?? ipHint(cfg.ip, `d${device.id}l${l.id}`)}
                />
              </div>
            );
          })}
        </>
      )}

      {device.t !== "rt" && links.length > 0 && (
        <>
          <p
            className={`mt-4 text-xs font-medium uppercase tracking-wide ${c.mu}`}
          >
            Koneksi
          </p>
          {links.map((l) => (
            <div key={l.id} className="mt-2 text-xs">
              <span className="font-medium">{shortPort(portOf(l))}</span> →{" "}
              {otherOf(l)?.name ?? "?"} ({shortPort(peerPortOf(l))}){" "}
              <span className={c.mu}>· {CABLE_LABEL[l.c]}</span>
              <Hint text={statusOf(l)} />
            </div>
          ))}
        </>
      )}

      {device.t === "sw" && (
        <p className={`mt-4 ${c.mu}`}>
          Switch bekerja di Layer 2: meneruskan frame antar port tanpa alamat
          IP. Konfigurasi VLAN dan trunk menyusul bersama CLI.
        </p>
      )}
    </aside>
  );
}

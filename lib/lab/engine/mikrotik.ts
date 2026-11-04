import type { LabSim } from "./sim";
import { freshMt, makeIface, type DeviceState } from "./state";
import {
  intToIp,
  ipToInt,
  maskToPrefix,
  netOf,
  netStr,
  parseCidr,
} from "./net";

type Args = Record<string, string>;
interface Ctx {
  sim: LabSim;
  dev: DeviceState;
  args: Args;
  pos: string[];
}
type Handler = (c: Ctx) => string;

/* ───────── util ───────── */

function table(head: string[], rows: string[][]): string {
  const w = head.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length))
  );
  const fmt = (r: string[]) =>
    r.map((c, i) => (c ?? "").padEnd(w[i])).join("  ").trimEnd();
  return [fmt(head), ...rows.map(fmt)].join("\n");
}

function show(flags: string, head: string[], rows: string[][]): string {
  return rows.length ? `${flags}\n${table(head, rows)}` : "";
}

const unquote = (v: string) => v.replace(/^"(.*)"$/, "$1");

function ifaceRef(dev: DeviceState, ref?: string) {
  if (!ref) return undefined;
  return (
    dev.ifaces.find((i) => i.name === ref) ??
    (/^\d+$/.test(ref) ? dev.ifaces[Number(ref)] : undefined)
  );
}

/* ───────── /system ───────── */

const identitySet: Handler = ({ dev, args, pos }) => {
  const name = args.name ?? pos[0];
  if (!name) return "failure: nama tidak boleh kosong";
  dev.hostname = name;
  return "";
};

const identityPrint: Handler = ({ dev }) => `  name: ${dev.hostname}`;

const resetCmd: Handler = ({ dev }) => {
  dev.hostname = "MikroTik";
  dev.ifaces = dev.ifaces.filter((i) => !i.virtual);
  for (const i of dev.ifaces) {
    i.ip = null;
    i.adminDown = false;
  }
  dev.routes = [];
  dev.mt = freshMt();
  return "Konfigurasi dikosongkan (simulasi: router tidak perlu reboot).";
};

/* ───────── /interface ───────── */

const ifPrint: Handler = ({ sim, dev }) =>
  show(
    "Flags: X - disabled, R - running",
    ["#", "NAME", "TYPE"],
    dev.ifaces.map((i, n) => [
      `${n} ${i.adminDown ? "X" : sim.isUp(dev, i) ? "R" : " "}`,
      i.name,
      i.virtual ? "wg" : "ether",
    ])
  );

const ifSet =
  (down: boolean): Handler =>
  ({ dev, args, pos }) => {
    const i = ifaceRef(dev, pos[0] ?? args.numbers);
    if (!i) return "no such item";
    i.adminDown = down;
    return "";
  };

/* ───────── /ip address ───────── */

const addrList = (dev: DeviceState) => dev.ifaces.filter((i) => i.ip);

const addrAdd: Handler = ({ dev, args }) => {
  let cidr = args.address ?? "";
  if (args.netmask && !cidr.includes("/")) {
    const p = maskToPrefix(args.netmask);
    if (p === null) return "invalid value for argument netmask";
    cidr = `${cidr}/${p}`;
  }
  if (cidr && !cidr.includes("/")) cidr += "/32";
  const c = parseCidr(cidr);
  if (!c) return "invalid value for argument address";
  const ifc = ifaceRef(dev, args.interface);
  if (!ifc) return "input does not match any value of interface";
  if (dev.ifaces.some((i) => i.ip && parseCidr(i.ip)!.ip === c.ip))
    return "failure: already have such address";
  if (ifc.ip)
    return "failure: simulator hanya mendukung satu IP per interface, hapus IP lama dulu";
  ifc.ip = `${intToIp(c.ip)}/${c.prefix}`;
  return "";
};

const addrPrint: Handler = ({ dev }) =>
  show(
    "Flags: X - disabled, I - invalid, D - dynamic",
    ["#", "ADDRESS", "NETWORK", "INTERFACE"],
    addrList(dev).map((i, n) => {
      const c = parseCidr(i.ip!)!;
      return [
        `${n} ${i.adminDown ? "I" : " "}`,
        i.ip!,
        intToIp(netOf(c.ip, c.prefix)),
        i.name,
      ];
    })
  );

const addrRemove: Handler = ({ dev, args, pos }) => {
  const item = addrList(dev)[Number(pos[0] ?? args.numbers)];
  if (!item) return "no such item";
  item.ip = null;
  return "";
};

/* ───────── /ip route ───────── */

const routeAdd: Handler = ({ dev, args }) => {
  const raw = args["dst-address"] ?? "0.0.0.0/0";
  const c = parseCidr(raw.includes("/") ? raw : `${raw}/32`);
  if (!c) return "invalid value for argument dst-address";
  const gw = args.gateway;
  // gateway = alamat IP, atau nama interface virtual (mis. wg0)
  const viaIface = gw ? ifaceRef(dev, gw) : undefined;
  if (!gw || (ipToInt(gw) === null && !viaIface?.virtual))
    return "invalid value for argument gateway";
  const dst = netStr(c);
  if (dev.routes.some((r) => r.dst === dst && r.via === gw))
    return "failure: already have such route";
  dev.routes.push({ dst, via: gw });
  return "";
};

const routePrint: Handler = ({ sim, dev }) => {
  const rows: string[][] = [];
  dev.routes.forEach((r, n) => {
    const via = ipToInt(r.via);
    const ifc = via === null ? ifaceRef(dev, r.via) : undefined;
    const active =
      via !== null
        ? sim.connectedIface(dev, via) !== null
        : !!ifc && sim.isUp(dev, ifc);
    rows.push([`${n} ${active ? "A" : " "} S`, r.dst, r.via, "1"]);
  });
  for (const i of dev.ifaces) {
    if (!i.ip || !sim.isUp(dev, i)) continue;
    rows.push([
      `${rows.length} ADC`,
      netStr(parseCidr(i.ip)!),
      i.name,
      "0",
    ]);
  }
  return show(
    "Flags: X - disabled, A - active, D - dynamic, C - connect, S - static",
    ["#", "DST-ADDRESS", "GATEWAY", "DISTANCE"],
    rows
  );
};

const routeRemove: Handler = ({ dev, args, pos }) => {
  const idx = Number(pos[0] ?? args.numbers);
  if (Number.isNaN(idx)) return "no such item";
  if (idx >= dev.routes.length) return "failure: tidak bisa menghapus route dinamis";
  dev.routes.splice(idx, 1);
  return "";
};

/* ───────── /ip dns ───────── */

const dnsSet: Handler = ({ dev, args }) => {
  if (args.servers === undefined) return "";
  const list = args.servers.split(",").map((s) => s.trim()).filter(Boolean);
  if (list.some((s) => ipToInt(s) === null))
    return "invalid value for argument servers";
  dev.mt.dns = list;
  return "";
};

const dnsPrint: Handler = ({ dev }) => `  servers: ${dev.mt.dns.join(",")}`;

/* ───────── /ip pool, /ip dhcp-server ───────── */

const poolAdd: Handler = ({ dev, args }) => {
  if (!args.name) return "failure: nama pool wajib diisi";
  const m = /^([\d.]+)-([\d.]+)$/.exec(args.ranges ?? "");
  const from = m ? ipToInt(m[1]) : null;
  const to = m ? ipToInt(m[2]) : null;
  if (from === null || to === null || from > to)
    return "invalid value for argument ranges";
  if (dev.mt.pools.some((p) => p.name === args.name))
    return "failure: already have such entry";
  dev.mt.pools.push({ name: args.name, from, to });
  return "";
};

const poolPrint: Handler = ({ dev }) =>
  show(
    "",
    ["#", "NAME", "RANGES"],
    dev.mt.pools.map((p, n) => [
      String(n),
      p.name,
      `${intToIp(p.from)}-${intToIp(p.to)}`,
    ])
  ).trimStart();

const dhcpAdd: Handler = ({ dev, args }) => {
  const ifc = ifaceRef(dev, args.interface);
  if (!ifc) return "input does not match any value of interface";
  if (!dev.mt.pools.some((p) => p.name === args["address-pool"]))
    return "input does not match any value of address-pool";
  dev.mt.servers.push({
    name: args.name ?? `dhcp${dev.mt.servers.length + 1}`,
    iface: ifc.name,
    pool: args["address-pool"],
    // Seperti RouterOS asli: server baru berstatus disabled kecuali disabled=no
    disabled: args.disabled !== "no",
  });
  return "";
};

const dhcpPrint: Handler = ({ dev }) =>
  show(
    "Flags: X - disabled, I - invalid",
    ["#", "NAME", "INTERFACE", "ADDRESS-POOL"],
    dev.mt.servers.map((s, n) => [
      `${n} ${s.disabled ? "X" : " "}`,
      s.name,
      s.iface,
      s.pool,
    ])
  );

const dhcpToggle =
  (disabled: boolean): Handler =>
  ({ dev, args, pos }) => {
    const ref = pos[0] ?? args.numbers;
    const s =
      dev.mt.servers.find((x) => x.name === ref) ??
      dev.mt.servers[Number(ref)];
    if (!s) return "no such item";
    s.disabled = disabled;
    return "";
  };

const netAdd: Handler = ({ dev, args }) => {
  const c = parseCidr(args.address ?? "");
  if (!c) return "invalid value for argument address";
  if (args.gateway && ipToInt(args.gateway) === null)
    return "invalid value for argument gateway";
  dev.mt.networks.push({
    address: netStr(c),
    gateway: args.gateway ?? "",
    dns: args["dns-server"] ?? "",
  });
  return "";
};

const netPrint: Handler = ({ dev }) =>
  show(
    "",
    ["#", "ADDRESS", "GATEWAY", "DNS-SERVER"],
    dev.mt.networks.map((n, i) => [String(i), n.address, n.gateway, n.dns])
  ).trimStart();

const leasePrint: Handler = ({ dev }) =>
  show(
    "",
    ["#", "ADDRESS", "CLIENT"],
    dev.mt.leases.map((l, n) => [String(n), l.ip, l.client])
  ).trimStart();

/* ───────── /ip firewall nat ───────── */

const natAdd: Handler = ({ dev, args }) => {
  if (!["srcnat", "dstnat"].includes(args.chain ?? ""))
    return "input does not match any value of chain";
  if (!args.action) return "failure: action wajib diisi";
  if (args["out-interface"] && !ifaceRef(dev, args["out-interface"]))
    return "input does not match any value of out-interface";
  dev.mt.nat.push({
    chain: args.chain,
    action: args.action,
    outIface: args["out-interface"] ?? "",
  });
  return "";
};

const natPrint: Handler = ({ dev }) =>
  show(
    "Flags: X - disabled, I - invalid, D - dynamic",
    ["#", "CHAIN", "ACTION", "OUT-INTERFACE"],
    dev.mt.nat.map((r, n) => [String(n), r.chain, r.action, r.outIface])
  );

/* ───────── /ip firewall filter, nat remove ───────── */

const FILTER_ACTIONS = ["accept", "drop", "reject", "passthrough", "log"];

const filterAdd: Handler = ({ dev, args }) => {
  const chain = args.chain ?? "";
  if (chain === "input" || chain === "output")
    return "failure: simulator hanya mendukung chain=forward";
  if (chain !== "forward") return "input does not match any value of chain";
  const action = args.action ?? "accept";
  if (!FILTER_ACTIONS.includes(action))
    return "input does not match any value of action";
  for (const k of ["src-address", "dst-address"]) {
    const v = args[k];
    if (v && !parseCidr(v.includes("/") ? v : `${v}/32`))
      return `invalid value for argument ${k}`;
  }
  for (const k of ["in-interface", "out-interface"]) {
    if (args[k] && !ifaceRef(dev, args[k]))
      return `input does not match any value of ${k}`;
  }
  const rule = {
    chain,
    action,
    src: args["src-address"] ?? "",
    dst: args["dst-address"] ?? "",
    protocol: args.protocol ?? "",
    inIface: args["in-interface"] ?? "",
    outIface: args["out-interface"] ?? "",
    states: (args["connection-state"] ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
  const pb = args["place-before"];
  if (pb === undefined) {
    dev.mt.filter.push(rule);
    return "";
  }
  const idx = Number(pb);
  if (!Number.isInteger(idx) || idx < 0 || idx > dev.mt.filter.length)
    return "input does not match any value of place-before";
  dev.mt.filter.splice(idx, 0, rule);
  return "";
};

const filterPrint: Handler = ({ dev }) =>
  show(
    "Flags: X - disabled, I - invalid, D - dynamic",
    ["#", "CHAIN", "ACTION", "SRC-ADDRESS", "DST-ADDRESS", "STATE"],
    dev.mt.filter.map((r, n) => [
      String(n),
      r.chain,
      r.action,
      r.src,
      r.dst,
      r.states.join(","),
    ])
  );

const filterRemove: Handler = ({ dev, args, pos }) => {
  const idx = Number(pos[0] ?? args.numbers);
  if (!Number.isInteger(idx) || !dev.mt.filter[idx]) return "no such item";
  dev.mt.filter.splice(idx, 1);
  return "";
};

const natRemove: Handler = ({ dev, args, pos }) => {
  const idx = Number(pos[0] ?? args.numbers);
  if (!Number.isInteger(idx) || !dev.mt.nat[idx]) return "no such item";
  dev.mt.nat.splice(idx, 1);
  return "";
};

/* ───────── /interface wireguard ───────── */

const WG_KEY = /^[A-Za-z0-9+/]{43}=$/;

/** Key tiruan yang deterministik (dari id perangkat + nama interface), bentuknya seperti key WireGuard asli. */
function wgKey(seed: string): string {
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = "";
  for (let i = 0; i < 43; i++) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    out += A[(h >>> 24) & 63];
  }
  return `${out}=`;
}

function parseAllowed(v: string): string[] | null {
  const list = v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.includes("/") ? s : `${s}/32`));
  return list.every((s) => parseCidr(s)) ? list : null;
}

const wgAdd: Handler = ({ dev, args }) => {
  const name = args.name;
  if (!name) return "failure: nama interface wajib diisi";
  if (dev.ifaces.some((i) => i.name === name))
    return "failure: already have interface with such name";
  const port = args["listen-port"] === undefined ? 13231 : Number(args["listen-port"]);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    return "invalid value for argument listen-port";
  if (dev.mt.wg.some((w) => w.listenPort === port))
    return "failure: listen-port sudah dipakai interface WireGuard lain";
  dev.ifaces.push({ ...makeIface(name), virtual: true });
  dev.mt.wg.push({
    name,
    listenPort: port,
    publicKey: wgKey(`${dev.id}:${name}`),
    peers: [],
  });
  return "";
};

const wgFind = (dev: DeviceState, ref?: string) =>
  dev.mt.wg.find((w) => w.name === ref) ??
  (ref !== undefined && /^\d+$/.test(ref) ? dev.mt.wg[Number(ref)] : undefined);

const wgPrint: Handler = ({ dev }) =>
  dev.mt.wg.length
    ? [
        "Flags: X - disabled, R - running",
        ...dev.mt.wg.map((w, n) => {
          const i = dev.ifaces.find((x) => x.name === w.name);
          return ` ${n} ${i?.adminDown ? "X" : "R"}  name="${w.name}" mtu=1420 listen-port=${w.listenPort}\n      public-key="${w.publicKey}"`;
        }),
      ].join("\n")
    : "";

const wgSet: Handler = ({ dev, args, pos }) => {
  const w = wgFind(dev, pos[0] ?? args.numbers);
  if (!w) return "no such item";
  if (args["listen-port"] !== undefined) {
    const port = Number(args["listen-port"]);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      return "invalid value for argument listen-port";
    w.listenPort = port;
  }
  return "";
};

const wgRemove: Handler = ({ dev, args, pos }) => {
  const w = wgFind(dev, pos[0] ?? args.numbers);
  if (!w) return "no such item";
  dev.mt.wg = dev.mt.wg.filter((x) => x !== w);
  dev.ifaces = dev.ifaces.filter((i) => i.name !== w.name);
  dev.routes = dev.routes.filter((r) => r.via !== w.name);
  return "";
};

const peerList = (dev: DeviceState) =>
  dev.mt.wg.flatMap((w) => w.peers.map((p) => ({ w, p })));

const wgPeerAdd: Handler = ({ dev, args }) => {
  const w = dev.mt.wg.find((x) => x.name === args.interface);
  if (!w) return "input does not match any value of interface";
  const key = args["public-key"] ?? "";
  if (!WG_KEY.test(key)) return "invalid value for argument public-key";
  if (w.peers.some((p) => p.publicKey === key))
    return "failure: peer dengan public key ini sudah ada";
  const allowed = parseAllowed(args["allowed-address"] ?? "");
  if (!allowed) return "invalid value for argument allowed-address";
  const ep = args["endpoint-address"] ?? "";
  if (ep && ipToInt(ep) === null) return "invalid value for argument endpoint-address";
  const port = args["endpoint-port"] === undefined ? 51820 : Number(args["endpoint-port"]);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    return "invalid value for argument endpoint-port";
  w.peers.push({
    publicKey: key,
    allowed,
    endpoint: ep,
    endpointPort: port,
    disabled: false,
  });
  return "";
};

const wgPeerPrint: Handler = ({ sim, dev }) => {
  const rows = peerList(dev);
  if (!rows.length) return "";
  return [
    "Flags: X - disabled",
    ...rows.map(({ w, p }, n) => {
      const ok = !!sim.wgLink(dev, w, p);
      return (
        ` ${n} ${p.disabled ? "X" : " "}  interface=${w.name} public-key="${p.publicKey}"\n` +
        `      allowed-address=${p.allowed.join(",") || "-"} endpoint=${p.endpoint ? `${p.endpoint}:${p.endpointPort}` : "-"}\n` +
        `      last-handshake=${ok ? "00:00:07" : "never"}`
      );
    }),
  ].join("\n");
};

const wgPeerSet: Handler = ({ dev, args, pos }) => {
  const item = peerList(dev)[Number(pos[0] ?? args.numbers)];
  if (!item) return "no such item";
  const { p } = item;
  if (args["allowed-address"] !== undefined) {
    const a = parseAllowed(args["allowed-address"]);
    if (!a) return "invalid value for argument allowed-address";
    p.allowed = a;
  }
  if (args["endpoint-address"] !== undefined) {
    const ep = args["endpoint-address"];
    if (ep && ipToInt(ep) === null) return "invalid value for argument endpoint-address";
    p.endpoint = ep;
  }
  if (args["endpoint-port"] !== undefined) {
    const port = Number(args["endpoint-port"]);
    if (!Number.isInteger(port) || port < 1 || port > 65535)
      return "invalid value for argument endpoint-port";
    p.endpointPort = port;
  }
  if (args.disabled !== undefined) p.disabled = args.disabled === "yes";
  return "";
};

const wgPeerRemove: Handler = ({ dev, args, pos }) => {
  const item = peerList(dev)[Number(pos[0] ?? args.numbers)];
  if (!item) return "no such item";
  item.w.peers = item.w.peers.filter((x) => x !== item.p);
  return "";
};

/* ───────── ping & export ───────── */

const pingCmd: Handler = ({ sim, dev, args, pos }) => {
  const target = pos[0] ?? args.address;
  if (!target) return "failure: alamat tujuan wajib diisi";
  let ip = ipToInt(target);
  if (ip === null) {
    ip = sim.resolveName(dev, target);
    if (ip === null) return "failure: dns name does not exist";
  }
  const count = Math.min(Number(args.count) || 4, 10);
  const r = sim.pingResult(dev, ip);
  const rtt = 1 + r.hops;
  const ttl = 64 - Math.max(0, r.hops - 1);
  const lines = [
    `  SEQ ${"HOST".padEnd(40)}SIZE  TTL TIME   STATUS`,
  ];
  for (let i = 0; i < count; i++) {
    const head = `${String(i).padStart(5)} ${target.padEnd(40)}`;
    lines.push(
      r.ok
        ? `${head}${"56".padStart(4)} ${String(ttl).padStart(4)} ${`${rtt}ms`.padEnd(6)}`
        : `${head}${r.noRoute ? "no route to host" : "timeout"}`
    );
  }
  const got = r.ok ? count : 0;
  lines.push(
    `    sent=${count} received=${got} packet-loss=${Math.round(((count - got) / count) * 100)}%` +
      (r.ok ? ` min-rtt=${rtt}ms avg-rtt=${rtt}ms max-rtt=${rtt}ms` : "")
  );
  return lines.join("\n");
};

const exportCmd: Handler = ({ dev }) => {
  const L: string[] = [];
  const sec = (title: string, items: string[]) => {
    if (items.length) L.push(title, ...items);
  };
  sec(
    "/interface wireguard",
    dev.mt.wg.map((w) => `add listen-port=${w.listenPort} name=${w.name}`)
  );
  sec(
    "/interface wireguard peers",
    dev.mt.wg.flatMap((w) =>
      w.peers.map(
        (p) =>
          `add allowed-address=${p.allowed.join(",")}` +
          (p.endpoint
            ? ` endpoint-address=${p.endpoint} endpoint-port=${p.endpointPort}`
            : "") +
          ` interface=${w.name} public-key="${p.publicKey}"` +
          (p.disabled ? " disabled=yes" : "")
      )
    )
  );
  sec(
    "/ip pool",
    dev.mt.pools.map(
      (p) => `add name=${p.name} ranges=${intToIp(p.from)}-${intToIp(p.to)}`
    )
  );
  sec(
    "/ip address",
    addrList(dev).map((i) => `add address=${i.ip} interface=${i.name}`)
  );
  sec(
    "/ip dhcp-server",
    dev.mt.servers.map(
      (s) =>
        `add address-pool=${s.pool} disabled=${s.disabled ? "yes" : "no"} interface=${s.iface} name=${s.name}`
    )
  );
  sec(
    "/ip dhcp-server network",
    dev.mt.networks.map(
      (n) =>
        `add address=${n.address}${n.dns ? ` dns-server=${n.dns}` : ""}${n.gateway ? ` gateway=${n.gateway}` : ""}`
    )
  );
  sec("/ip dns", dev.mt.dns.length ? [`set servers=${dev.mt.dns.join(",")}`] : []);
  sec(
    "/ip firewall filter",
    dev.mt.filter.map(
      (r) =>
        `add action=${r.action} chain=${r.chain}` +
        (r.states.length ? ` connection-state=${r.states.join(",")}` : "") +
        (r.src ? ` src-address=${r.src}` : "") +
        (r.dst ? ` dst-address=${r.dst}` : "") +
        (r.protocol ? ` protocol=${r.protocol}` : "") +
        (r.inIface ? ` in-interface=${r.inIface}` : "") +
        (r.outIface ? ` out-interface=${r.outIface}` : "")
    )
  );
  sec(
    "/ip firewall nat",
    dev.mt.nat.map(
      (r) =>
        `add action=${r.action} chain=${r.chain}${r.outIface ? ` out-interface=${r.outIface}` : ""}`
    )
  );
  sec(
    "/ip route",
    dev.routes.map((r) => `add dst-address=${r.dst} gateway=${r.via}`)
  );
  sec("/system identity", [`set name=${dev.hostname}`]);
  return L.join("\n");
};

/* ───────── tabel menu ───────── */

const MENUS: Record<string, Record<string, Handler>> = {
  "": { ping: pingCmd, export: exportCmd },
  system: { "reset-configuration": resetCmd },
  "system identity": { set: identitySet, print: identityPrint },
  interface: { print: ifPrint, enable: ifSet(false), disable: ifSet(true) },
  "interface wireguard": {
    add: wgAdd,
    print: wgPrint,
    set: wgSet,
    remove: wgRemove,
  },
  "interface wireguard peers": {
    add: wgPeerAdd,
    print: wgPeerPrint,
    set: wgPeerSet,
    remove: wgPeerRemove,
  },
  "ip address": { add: addrAdd, print: addrPrint, remove: addrRemove },
  "ip route": { add: routeAdd, print: routePrint, remove: routeRemove },
  "ip dns": { set: dnsSet, print: dnsPrint },
  "ip pool": { add: poolAdd, print: poolPrint },
  "ip dhcp-server": {
    add: dhcpAdd,
    print: dhcpPrint,
    enable: dhcpToggle(false),
    disable: dhcpToggle(true),
  },
  "ip dhcp-server network": { add: netAdd, print: netPrint },
  "ip dhcp-server lease": { print: leasePrint },
  "ip firewall filter": { add: filterAdd, print: filterPrint, remove: filterRemove },
  "ip firewall nat": { add: natAdd, print: natPrint, remove: natRemove },
};

const isMenu = (c: string) =>
  Object.keys(MENUS).some((k) => k === c || k.startsWith(`${c} `));

function helpText(): string {
  return [
    "Perintah yang didukung simulator:",
    ...Object.entries(MENUS)
      .filter(([, m]) => Object.keys(m).length)
      .map(([k, m]) => `  /${k}`.padEnd(28) + Object.keys(m).join(" | ")),
  ].join("\n");
}

export function promptMikrotik(dev: DeviceState): string {
  const p = dev.mt.path.length ? `/${dev.mt.path.join(" ")}` : "";
  return `[admin@${dev.hostname}] ${p}> `;
}

export function execMikrotik(
  sim: LabSim,
  dev: DeviceState,
  line: string
): string {
  const raw = line.trim();
  if (!raw) return "";
  if (raw === "?" || raw === "help") return helpText();

  let tokens: string[] = raw.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  const absolute = tokens[0].startsWith("/");
  tokens = tokens.flatMap((t) =>
    t.includes("=") || /^\d/.test(t) ? [t] : t.split("/").filter(Boolean)
  );

  const path = absolute ? [] : [...dev.mt.path];
  while (tokens[0] === "..") {
    path.pop();
    tokens.shift();
  }
  while (tokens.length && isMenu([...path, tokens[0]].join(" "))) {
    path.push(tokens.shift()!);
  }
  if (!tokens.length) {
    dev.mt.path = path;
    return "";
  }

  const cmd = tokens.shift()!;
  const handler = MENUS[path.join(" ")]?.[cmd];
  if (!handler)
    return `bad command name ${cmd} (line 1 column ${raw.indexOf(cmd) + 1})`;

  const args: Args = {};
  const pos: string[] = [];
  for (const t of tokens) {
    const i = t.indexOf("=");
    if (i > 0) args[t.slice(0, i)] = unquote(t.slice(i + 1));
    else pos.push(unquote(t));
  }
  return handler({ sim, dev, args, pos });
}

/* ───────── saran perintah (Tab dan ?) ───────── */

/** Sub-menu dan perintah yang valid di posisi kursor. Argumen (key=value) tidak disarankan. */
export function suggestMikrotik(dev: DeviceState, line: string): string[] {
  const raw = line.replace(/^\s+/, "");
  const endsBreak = /[\s/]$/.test(raw);
  const tokens = raw.split(/[\s/]+/).filter(Boolean);
  const partial = endsBreak ? "" : (tokens.pop() ?? "");
  const path = raw.startsWith("/") ? [] : [...dev.mt.path];
  while (tokens[0] === "..") {
    path.pop();
    tokens.shift();
  }
  while (tokens.length && isMenu([...path, tokens[0]].join(" "))) {
    path.push(tokens.shift()!);
  }
  if (tokens.length) return [];

  const here = path.join(" ");
  const out = new Set<string>();
  for (const key of Object.keys(MENUS)) {
    if (key === here) continue;
    if (here === "" ? key !== "" : key.startsWith(`${here} `)) {
      const rest = here === "" ? key : key.slice(here.length + 1);
      out.add(rest.split(" ")[0]);
    }
  }
  for (const cmd of Object.keys(MENUS[here] ?? {})) out.add(cmd);
  return [...out].filter((x) => x.startsWith(partial.toLowerCase())).sort();
}

/** Isi /export untuk tombol "Konfigurasi". */
export function configMikrotik(dev: DeviceState): string {
  return exportCmd({ dev } as Ctx);
}
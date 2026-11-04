import type { LabSim } from "./sim";
import {
  makeIface,
  type CsState,
  type DeviceState,
  type IfaceState,
} from "./state";
import {
  intToIp,
  ipToInt,
  maskToPrefix,
  netOf,
  parseCidr,
  prefixMask,
} from "./net";
import { neighbors, ospfRoutes, routerId } from "./ospf";

type Mode = CsState["mode"];
interface Env {
  sim: LabSim;
  dev: DeviceState;
}
interface Cmd {
  pat: string;
  modes: Mode[];
  run: (a: string[], e: Env) => string;
}

const EXEC: Mode[] = ["user", "priv"];
const CFG: Mode[] = ["config", "config-if", "config-router", "config-vlan"];
const INVALID = "% Invalid input detected at '^' marker.";
const ALL_VLANS = Array.from({ length: 4094 }, (_, i) => i + 1);

/* ───────── util ───────── */

function resolveIface(dev: DeviceState, s: string): IfaceState | null {
  const re = /^([a-z]+)([\d/.]+)$/i;
  const m = re.exec(s.trim());
  if (!m) return null;
  return (
    dev.ifaces.find((i) => {
      const n = re.exec(i.name);
      return (
        !!n &&
        n[2] === m[2] &&
        n[1].toLowerCase().startsWith(m[1].toLowerCase())
      );
    }) ?? null
  );
}

/** Cari interface; kalau berbentuk sub-interface (g0/0.10) pada router, buat otomatis seperti IOS. */
function ensureIface(dev: DeviceState, ref: string): IfaceState | null {
  const found = resolveIface(dev, ref);
  if (found) return found;
  const m = /^([a-z]+[\d/]+)\.(\d{1,4})$/i.exec(ref.trim());
  if (!m || dev.role === "switch") return null;
  const parent = resolveIface(dev, m[1]);
  if (!parent || parent.parent || parent.virtual) return null;
  const sub = makeIface(`${parent.name}.${m[2]}`, null, false, parent.name);
  dev.ifaces.push(sub);
  return sub;
}

const curIface = (dev: DeviceState) =>
  dev.ifaces.find((i) => i.name === dev.cs.iface);

const isSwitch = (dev: DeviceState) => dev.role === "switch";

const vlanName = (id: number) => `VLAN${String(id).padStart(4, "0")}`;

const short = (n: string) =>
  n
    .replace("TenGigabitEthernet", "Te")
    .replace("GigabitEthernet", "Gi")
    .replace("FastEthernet", "Fa");

/** [10,11,12,20] -> "10-12,20" */
function rangeStr(list: number[]): string {
  const s = [...new Set(list)].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < s.length; ) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j > i ? `${s[i]}-${s[j]}` : `${s[i]}`);
    i = j + 1;
  }
  return out.join(",");
}

/** "10,20-22" -> [10,20,21,22]; null bila format salah. */
function parseVlans(s: string): number[] | null {
  const out: number[] = [];
  for (const part of s.split(",")) {
    const m = /^(\d{1,4})(?:-(\d{1,4}))?$/.exec(part.trim());
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : a;
    if (a < 1 || b > 4094 || a > b) return null;
    for (let v = a; v <= b; v++) out.push(v);
  }
  return out.length ? out : null;
}

function changed(
  sim: LabSim,
  dev: DeviceState,
  ifc: IfaceState,
  wasUp: boolean
): string {
  const nowUp = sim.isUp(dev, ifc);
  if (wasUp === nowUp) return "";
  const state = nowUp ? "up" : ifc.adminDown ? "administratively down" : "down";
  return (
    `%LINK-5-CHANGED: Interface ${ifc.name}, changed state to ${state}\n` +
    `%LINEPROTO-5-UPDOWN: Line protocol on Interface ${ifc.name}, changed state to ${nowUp ? "up" : "down"}`
  );
}

/* ───────── show ───────── */

function showBrief(sim: LabSim, dev: DeviceState): string {
  const w = (s: string, n: number) => s.padEnd(n);
  return [
    `${w("Interface", 23)}${w("IP-Address", 16)}OK? ${w("Method", 7)}${w("Status", 22)}Protocol`,
    ...dev.ifaces.map((i) => {
      const up = sim.isUp(dev, i);
      const ip = i.ip ? intToIp(parseCidr(i.ip)!.ip) : "unassigned";
      const status = i.adminDown ? "administratively down" : up ? "up" : "down";
      return `${w(i.name, 23)}${w(ip, 16)}YES ${w(i.ip ? "manual" : "unset", 7)}${w(status, 22)}${up ? "up" : "down"}`;
    }),
  ].join("\n");
}

function showRoute(sim: LabSim, dev: DeviceState): string {
  interface Entry {
    net: number;
    prefix: number;
    text: string;
  }
  const entries: Entry[] = [];
  const connected = new Set<string>();
  let gw = "";

  for (const i of dev.ifaces) {
    if (!i.ip || !sim.isUp(dev, i)) continue;
    const c = parseCidr(i.ip)!;
    const n = netOf(c.ip, c.prefix);
    connected.add(`${n}/${c.prefix}`);
    entries.push({
      net: n,
      prefix: c.prefix,
      text: `C    ${intToIp(n)}/${c.prefix} is directly connected, ${i.name}`,
    });
  }
  for (const r of dev.routes) {
    const c = parseCidr(r.dst);
    const via = ipToInt(r.via);
    if (!c || via === null || !sim.connectedIface(dev, via)) continue;
    const isDefault = c.prefix === 0;
    if (isDefault) gw = r.via;
    entries.push({
      net: c.ip,
      prefix: c.prefix,
      text: `S${isDefault ? "*" : " "}   ${r.dst} [1/0] via ${r.via}`,
    });
  }
  for (const r of ospfRoutes(sim, dev)) {
    if (connected.has(`${r.dst.ip}/${r.dst.prefix}`)) continue;
    entries.push({
      net: r.dst.ip,
      prefix: r.dst.prefix,
      text: `O    ${intToIp(r.dst.ip)}/${r.dst.prefix} [110/${r.metric}] via ${intToIp(r.via!)}, ${r.iface.name}`,
    });
  }
  entries.sort((a, b) => a.net - b.net || a.prefix - b.prefix);

  return [
    "Codes: C - connected, S - static, O - OSPF",
    "",
    gw
      ? `Gateway of last resort is ${gw} to network 0.0.0.0`
      : "Gateway of last resort is not set",
    "",
    ...entries.map((e) => e.text),
  ].join("\n");
}

function showRunning(dev: DeviceState): string {
  const sw = isSwitch(dev);
  const L = ["Building configuration...", "", "!", `hostname ${dev.hostname}`, "!"];
  if (sw) {
    for (const v of dev.sw.vlans) {
      if (v.id === 1) continue;
      L.push(`vlan ${v.id}`, ` name ${v.name}`, "!");
    }
  }
  for (const i of dev.ifaces) {
    L.push(`interface ${i.name}`);
    if (i.parent && i.vlan !== null) L.push(` encapsulation dot1q ${i.vlan}`);
    if (sw) {
      if (i.mode === "trunk") {
        if (i.native !== 1) L.push(` switchport trunk native vlan ${i.native}`);
        if (i.trunkAllowed)
          L.push(` switchport trunk allowed vlan ${rangeStr(i.trunkAllowed)}`);
        L.push(" switchport mode trunk");
      } else {
        if (i.accessVlan !== 1) L.push(` switchport access vlan ${i.accessVlan}`);
        L.push(" switchport mode access");
      }
    } else if (i.ip) {
      const c = parseCidr(i.ip)!;
      L.push(` ip address ${intToIp(c.ip)} ${intToIp(prefixMask(c.prefix))}`);
    } else {
      L.push(" no ip address");
    }
    if (i.adminDown) L.push(" shutdown");
    L.push("!");
  }
  if (dev.cs.ospf) {
    L.push(`router ospf ${dev.cs.ospf.pid}`);
    for (const n of dev.cs.ospf.networks)
      L.push(` network ${intToIp(n.net)} ${intToIp(n.wild)} area ${n.area}`);
    L.push("!");
  }
  for (const r of dev.routes) {
    const c = parseCidr(r.dst)!;
    L.push(`ip route ${intToIp(c.ip)} ${intToIp(prefixMask(c.prefix))} ${r.via}`);
  }
  L.push("!", "end");
  return L.join("\n");
}

function showNeighbors(sim: LabSim, dev: DeviceState): string {
  const ns = neighbors(sim, dev);
  if (!ns.length) return "";
  return [
    `${"Neighbor ID".padEnd(16)}${"Pri".padEnd(6)}${"State".padEnd(16)}${"Dead Time".padEnd(12)}${"Address".padEnd(16)}Interface`,
    ...ns.map(
      (n) =>
        `${routerId(n.dev).padEnd(16)}${"1".padEnd(6)}${"FULL/  -".padEnd(16)}${"00:00:33".padEnd(12)}${intToIp(n.addr).padEnd(16)}${n.local.name}`
    ),
  ].join("\n");
}

function showVlan(dev: DeviceState): string {
  if (!isSwitch(dev)) return INVALID;
  const row = (a: string, b: string, c: string, d: string) =>
    `${a.padEnd(5)}${b.padEnd(33)}${c.padEnd(10)}${d}`;
  const rows = [...dev.sw.vlans]
    .sort((a, b) => a.id - b.id)
    .map((v) => {
      const ports = dev.ifaces
        .filter((i) => i.mode === "access" && i.accessVlan === v.id)
        .map((i) => short(i.name))
        .join(", ");
      return row(String(v.id), v.name, "active", ports);
    });
  return [
    row("VLAN", "Name", "Status", "Ports"),
    row("----", "-".repeat(32), "---------", "-".repeat(31)),
    ...rows,
  ].join("\n");
}

function showTrunk(sim: LabSim, dev: DeviceState): string {
  if (!isSwitch(dev)) return INVALID;
  const t = dev.ifaces.filter((i) => i.mode === "trunk");
  if (!t.length) return "";
  return [
    `${"Port".padEnd(12)}${"Mode".padEnd(13)}${"Encapsulation".padEnd(15)}${"Status".padEnd(14)}Native vlan`,
    ...t.map(
      (i) =>
        `${short(i.name).padEnd(12)}${"on".padEnd(13)}${"802.1q".padEnd(15)}${(sim.isUp(dev, i) ? "trunking" : "not-trunking").padEnd(14)}${i.native}`
    ),
    "",
    `${"Port".padEnd(12)}Vlans allowed on trunk`,
    ...t.map(
      (i) =>
        `${short(i.name).padEnd(12)}${i.trunkAllowed ? rangeStr(i.trunkAllowed) : "1-4094"}`
    ),
  ].join("\n");
}

/* ───────── daftar perintah ───────── */

const CMDS: Cmd[] = [
  {
    pat: "enable",
    modes: ["user"],
    run: (_a, { dev }) => {
      dev.cs.mode = "priv";
      return "";
    },
  },
  {
    pat: "disable",
    modes: ["priv"],
    run: (_a, { dev }) => {
      dev.cs.mode = "user";
      return "";
    },
  },
  {
    pat: "configure terminal",
    modes: ["priv"],
    run: (_a, { dev }) => {
      dev.cs.mode = "config";
      return "Enter configuration commands, one per line.  End with CNTL/Z.";
    },
  },
  {
    pat: "exit",
    modes: ["user", "priv", "config", "config-if", "config-router", "config-vlan"],
    run: (_a, { dev }) => {
      const m = dev.cs.mode;
      if (m === "config-if" || m === "config-router" || m === "config-vlan") {
        dev.cs.mode = "config";
        dev.cs.iface = null;
        dev.cs.vlan = null;
      } else if (m === "config") dev.cs.mode = "priv";
      else if (m === "priv") dev.cs.mode = "user";
      return "";
    },
  },
  {
    pat: "end",
    modes: CFG,
    run: (_a, { dev }) => {
      dev.cs.mode = "priv";
      dev.cs.iface = null;
      dev.cs.vlan = null;
      return "";
    },
  },
  {
    pat: "hostname <name>",
    modes: ["config"],
    run: (a, { dev }) => {
      dev.hostname = a[0];
      return "";
    },
  },
  {
    pat: "interface <if>",
    modes: ["config"],
    run: (a, { dev }) => {
      const ifc = ensureIface(dev, a[0]);
      if (!ifc) return "% Invalid interface type and number";
      dev.cs.iface = ifc.name;
      dev.cs.mode = "config-if";
      return "";
    },
  },
  {
    pat: "router ospf <pid>",
    modes: ["config"],
    run: (a, { dev }) => {
      const pid = Number(a[0]);
      if (!Number.isInteger(pid) || pid < 1 || pid > 65535) return INVALID;
      dev.cs.ospf ??= { pid, networks: [] };
      dev.cs.mode = "config-router";
      return "";
    },
  },
  {
    pat: "ip route <net> <mask> <nh>",
    modes: ["config"],
    run: (a, { dev }) => {
      const net = ipToInt(a[0]);
      const p = maskToPrefix(a[1]);
      if (net === null || p === null || ipToInt(a[2]) === null) return INVALID;
      const dst = `${intToIp(netOf(net, p))}/${p}`;
      if (!dev.routes.some((r) => r.dst === dst && r.via === a[2]))
        dev.routes.push({ dst, via: a[2] });
      return "";
    },
  },
  {
    pat: "no ip route <net> <mask> <nh>",
    modes: ["config"],
    run: (a, { dev }) => {
      const net = ipToInt(a[0]);
      const p = maskToPrefix(a[1]);
      if (net === null || p === null) return INVALID;
      const dst = `${intToIp(netOf(net, p))}/${p}`;
      dev.routes = dev.routes.filter((r) => !(r.dst === dst && r.via === a[2]));
      return "";
    },
  },

  /* ----- VLAN (switch) ----- */
  {
    pat: "vlan <id>",
    modes: ["config"],
    run: (a, { dev }) => {
      const id = Number(a[0]);
      if (!isSwitch(dev) || !Number.isInteger(id) || id < 1 || id > 4094)
        return INVALID;
      if (!dev.sw.vlans.some((v) => v.id === id))
        dev.sw.vlans.push({ id, name: vlanName(id) });
      dev.cs.vlan = id;
      dev.cs.mode = "config-vlan";
      return "";
    },
  },
  {
    pat: "no vlan <id>",
    modes: ["config"],
    run: (a, { dev }) => {
      const id = Number(a[0]);
      if (!isSwitch(dev) || !Number.isInteger(id)) return INVALID;
      if (id === 1) return "% Default VLAN 1 may not be deleted.";
      dev.sw.vlans = dev.sw.vlans.filter((v) => v.id !== id);
      return "";
    },
  },
  {
    pat: "name <name>",
    modes: ["config-vlan"],
    run: (a, { dev }) => {
      const v = dev.sw.vlans.find((x) => x.id === dev.cs.vlan);
      if (!v) return INVALID;
      v.name = a[0].slice(0, 32);
      return "";
    },
  },
  {
    pat: "switchport mode access",
    modes: ["config-if"],
    run: (_a, { dev }) => {
      const i = curIface(dev);
      if (!i || !isSwitch(dev)) return INVALID;
      i.mode = "access";
      return "";
    },
  },
  {
    pat: "switchport mode trunk",
    modes: ["config-if"],
    run: (_a, { dev }) => {
      const i = curIface(dev);
      if (!i || !isSwitch(dev)) return INVALID;
      i.mode = "trunk";
      return "";
    },
  },
  {
    pat: "switchport access vlan <id>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const i = curIface(dev);
      const id = Number(a[0]);
      if (!i || !isSwitch(dev) || !Number.isInteger(id) || id < 1 || id > 4094)
        return INVALID;
      i.accessVlan = id;
      if (!dev.sw.vlans.some((v) => v.id === id)) {
        dev.sw.vlans.push({ id, name: vlanName(id) });
        return `% Access VLAN does not exist. Creating vlan ${id}`;
      }
      return "";
    },
  },
  {
    pat: "switchport trunk native vlan <id>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const i = curIface(dev);
      const id = Number(a[0]);
      if (!i || !isSwitch(dev) || !Number.isInteger(id) || id < 1 || id > 4094)
        return INVALID;
      i.native = id;
      return "";
    },
  },
  {
    pat: "switchport trunk allowed vlan <list>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const i = curIface(dev);
      if (!i || !isSwitch(dev)) return INVALID;
      if (a[0].toLowerCase() === "all") {
        i.trunkAllowed = null;
        return "";
      }
      const v = parseVlans(a[0]);
      if (!v) return INVALID;
      i.trunkAllowed = [...new Set(v)].sort((x, y) => x - y);
      return "";
    },
  },
  {
    pat: "switchport trunk allowed vlan add <list>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const i = curIface(dev);
      const v = parseVlans(a[0]);
      if (!i || !isSwitch(dev) || !v) return INVALID;
      if (i.trunkAllowed)
        i.trunkAllowed = [...new Set([...i.trunkAllowed, ...v])].sort((x, y) => x - y);
      return "";
    },
  },
  {
    pat: "switchport trunk allowed vlan remove <list>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const i = curIface(dev);
      const v = parseVlans(a[0]);
      if (!i || !isSwitch(dev) || !v) return INVALID;
      i.trunkAllowed = (i.trunkAllowed ?? ALL_VLANS).filter((x) => !v.includes(x));
      return "";
    },
  },

  /* ----- sub-interface (router-on-a-stick) ----- */
  {
    pat: "encapsulation dot1q <id>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const i = curIface(dev);
      const id = Number(a[0]);
      if (!i || !i.parent || !Number.isInteger(id) || id < 1 || id > 4094)
        return INVALID;
      i.vlan = id;
      return "";
    },
  },

  {
    pat: "ip address <ip> <mask>",
    modes: ["config-if"],
    run: (a, { dev }) => {
      const ifc = curIface(dev);
      const ip = ipToInt(a[0]);
      const p = maskToPrefix(a[1]);
      if (!ifc || isSwitch(dev) || ip === null || p === null) return INVALID;
      if (ifc.parent && ifc.vlan === null)
        return "% Configuring IP routing on a LAN subinterface is only allowed if that subinterface is already configured as part of an IEEE 802.10, IEEE 802.1Q, or ISL vLAN.";
      for (const o of dev.ifaces) {
        if (o === ifc || !o.ip) continue;
        const c = parseCidr(o.ip)!;
        const m = Math.min(c.prefix, p);
        if (netOf(c.ip, m) === netOf(ip, m))
          return `% ${intToIp(netOf(ip, p))} overlaps with ${o.name}`;
      }
      ifc.ip = `${intToIp(ip)}/${p}`;
      return "";
    },
  },
  {
    pat: "no ip address",
    modes: ["config-if"],
    run: (_a, { dev }) => {
      const ifc = curIface(dev);
      if (ifc) ifc.ip = null;
      return "";
    },
  },
  {
    pat: "shutdown",
    modes: ["config-if"],
    run: (_a, { sim, dev }) => {
      const ifc = curIface(dev);
      if (!ifc) return "";
      const was = sim.isUp(dev, ifc);
      ifc.adminDown = true;
      return changed(sim, dev, ifc, was);
    },
  },
  {
    pat: "no shutdown",
    modes: ["config-if"],
    run: (_a, { sim, dev }) => {
      const ifc = curIface(dev);
      if (!ifc) return "";
      const was = sim.isUp(dev, ifc);
      ifc.adminDown = false;
      return changed(sim, dev, ifc, was);
    },
  },
  {
    pat: "network <net> <wildcard> area <area>",
    modes: ["config-router"],
    run: (a, { dev }) => {
      const net = ipToInt(a[0]);
      const wild = ipToInt(a[1]);
      if (net === null || wild === null || !dev.cs.ospf) return INVALID;
      dev.cs.ospf.networks.push({ net, wild, area: a[3] });
      return "";
    },
  },
  {
    pat: "show ip interface brief",
    modes: EXEC,
    run: (_a, { sim, dev }) => showBrief(sim, dev),
  },
  {
    pat: "show ip route",
    modes: EXEC,
    run: (_a, { sim, dev }) => showRoute(sim, dev),
  },
  {
    pat: "show ip ospf neighbor",
    modes: EXEC,
    run: (_a, { sim, dev }) => showNeighbors(sim, dev),
  },
  {
    pat: "show vlan brief",
    modes: EXEC,
    run: (_a, { dev }) => showVlan(dev),
  },
  {
    pat: "show interfaces trunk",
    modes: EXEC,
    run: (_a, { sim, dev }) => showTrunk(sim, dev),
  },
  {
    pat: "show running-config",
    modes: ["priv"],
    run: (_a, { dev }) => showRunning(dev),
  },
  {
    pat: "ping <ip>",
    modes: EXEC,
    run: (a, { sim, dev }) => {
      const ip = ipToInt(a[0]);
      if (ip === null) return INVALID;
      const r = sim.pingResult(dev, ip);
      const rtt = 1 + r.hops;
      return [
        "Type escape sequence to abort.",
        `Sending 5, 100-byte ICMP Echos to ${a[0]}, timeout is 2 seconds:`,
        r.ok ? "!!!!!" : ".....",
        r.ok
          ? `Success rate is 100 percent (5/5), round-trip min/avg/max = ${rtt}/${rtt + 1}/${rtt + 3} ms`
          : "Success rate is 0 percent (0/5)",
      ].join("\n");
    },
  },
  {
    pat: "write memory",
    modes: ["priv"],
    run: () => "Building configuration...\n[OK]",
  },
  {
    pat: "copy running-config startup-config",
    modes: ["priv"],
    run: () => "Destination filename [startup-config]?\nBuilding configuration...\n[OK]",
  },
];

/* ───────── pencocokan perintah ───────── */

function match(tokens: string[], pat: string): string[] | null {
  const words = pat.split(" ");
  if (tokens.length !== words.length) return null;
  const args: string[] = [];
  for (let i = 0; i < words.length; i++) {
    if (words[i].startsWith("<")) args.push(tokens[i]);
    else if (!words[i].startsWith(tokens[i].toLowerCase())) return null;
  }
  return args;
}

function find(
  tokens: string[],
  mode: Mode
): { cmd: Cmd; args: string[] } | "ambiguous" | null {
  const found: { cmd: Cmd; args: string[] }[] = [];
  for (const cmd of CMDS) {
    if (!cmd.modes.includes(mode)) continue;
    const args = match(tokens, cmd.pat);
    if (args) found.push({ cmd, args });
  }
  if (found.length === 1) return found[0];
  return found.length > 1 ? "ambiguous" : null;
}

function isIncomplete(tokens: string[], mode: Mode): boolean {
  return CMDS.some((c) => {
    if (!c.modes.includes(mode)) return false;
    const w = c.pat.split(" ");
    return (
      tokens.length < w.length &&
      tokens.every((t, i) => w[i].startsWith("<") || w[i].startsWith(t.toLowerCase()))
    );
  });
}

function helpCisco(dev: DeviceState): string {
  return CMDS.filter((c) => c.modes.includes(dev.cs.mode))
    .map((c) => `  ${c.pat}`)
    .join("\n");
}

export function promptCisco(dev: DeviceState): string {
  const suffix: Record<Mode, string> = {
    user: ">",
    priv: "#",
    config: "(config)#",
    "config-if": "(config-if)#",
    "config-router": "(config-router)#",
    "config-vlan": "(config-vlan)#",
  };
  if (dev.cs.mode === "config-if" && curIface(dev)?.parent)
    return `${dev.hostname}(config-subif)#`;
  return `${dev.hostname}${suffix[dev.cs.mode]}`;
}

export function execCisco(sim: LabSim, dev: DeviceState, line: string): string {
  let tokens = line.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return "";
  if (tokens[0] === "?") return helpCisco(dev);

  // "do show ..." di dalam mode konfigurasi
  if (tokens[0].toLowerCase() === "do" && CFG.includes(dev.cs.mode)) {
    const saved = dev.cs.mode;
    dev.cs.mode = "priv";
    const out = execCisco(sim, dev, tokens.slice(1).join(" "));
    dev.cs.mode = saved;
    return out;
  }

  // "interface gigabitEthernet 0/0" -> satu token
  if (tokens.length === 3 && /^int/i.test(tokens[0])) {
    tokens = [tokens[0], tokens[1] + tokens[2]];
  }

  let r = find(tokens, dev.cs.mode);
  if (
    r === null &&
    (dev.cs.mode === "config-if" ||
      dev.cs.mode === "config-router" ||
      dev.cs.mode === "config-vlan")
  ) {
    const g = find(tokens, "config");
    if (g && g !== "ambiguous") {
      dev.cs.mode = "config";
      dev.cs.iface = null;
      dev.cs.vlan = null;
      r = g;
    }
  }
  if (r === "ambiguous") return `% Ambiguous command:  "${line.trim()}"`;
  if (!r) return isIncomplete(tokens, dev.cs.mode) ? "% Incomplete command." : INVALID;
  return r.cmd.run(r.args, { sim, dev });
}

/* ───────── saran perintah (Tab dan ?) ───────── */

/** Kata berikutnya yang valid. Placeholder tampil sebagai <arg>, akhir perintah sebagai <cr>. */
export function suggestCisco(dev: DeviceState, line: string): string[] {
  const endsSpace = /\s$/.test(line);
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const partial = endsSpace ? "" : (tokens.pop() ?? "");
  const lower = partial.toLowerCase();

  let modes: Mode[] = [dev.cs.mode];
  if (
    dev.cs.mode === "config-if" ||
    dev.cs.mode === "config-router" ||
    dev.cs.mode === "config-vlan"
  )
    modes = [dev.cs.mode, "config"];

  const out = new Set<string>();
  let viaDo = false;
  if (CFG.includes(dev.cs.mode) && tokens[0]?.toLowerCase() === "do") {
    tokens.shift();
    modes = ["priv"];
    viaDo = true;
  }
  if (!viaDo && !tokens.length && CFG.includes(dev.cs.mode) && "do".startsWith(lower))
    out.add("do");

  for (const c of CMDS) {
    if (!c.modes.some((m) => modes.includes(m))) continue;
    const w = c.pat.split(" ");
    if (tokens.length > w.length) continue;
    const ok = tokens.every(
      (t, i) => w[i].startsWith("<") || w[i].startsWith(t.toLowerCase())
    );
    if (!ok) continue;
    if (tokens.length === w.length) {
      if (!partial) out.add("<cr>");
      continue;
    }
    const next = w[tokens.length];
    if (next.startsWith("<")) {
      if (!partial) out.add(next);
    } else if (next.startsWith(lower)) out.add(next);
  }
  return [...out];
}

/** Isi running-config untuk tombol "Konfigurasi" (tidak bergantung mode CLI). */
export function configCisco(dev: DeviceState): string {
  return showRunning(dev);
}
import type { LabSim } from "./sim";
import type { DeviceState, IfaceState, RouteHit } from "./state";
import { intToIp, netOf, netStr, parseCidr, type Cidr } from "./net";

interface OspfIface {
  iface: IfaceState;
  cidr: Cidr;
  area: string;
}

export interface Neighbor {
  dev: DeviceState;
  local: IfaceState;
  remote: IfaceState;
  addr: number;
}

/** Interface yang ikut OSPF karena cocok dengan salah satu perintah "network" */
export function ospfIfaces(dev: DeviceState): OspfIface[] {
  const o = dev.cs.ospf;
  if (!o) return [];
  const res: OspfIface[] = [];
  for (const iface of dev.ifaces) {
    if (!iface.ip) continue;
    const cidr = parseCidr(iface.ip)!;
    const n = o.networks.find((x) => ((cidr.ip ^ x.net) & ~x.wild) === 0);
    if (n) res.push({ iface, cidr, area: n.area });
  }
  return res;
}

/** Adjacency terbentuk jika kedua sisi aktif, satu subnet, dan satu area */
export function neighbors(sim: LabSim, dev: DeviceState): Neighbor[] {
  const out: Neighbor[] = [];
  for (const mine of ospfIfaces(dev)) {
    if (!sim.isUp(dev, mine.iface)) continue;
    const p = sim.peer(dev, mine.iface.name);
    if (!p || !p.iface.ip) continue;
    const theirs = ospfIfaces(p.dev).find((o) => o.iface === p.iface);
    if (!theirs || theirs.area !== mine.area) continue;
    const a = theirs.cidr;
    const b = mine.cidr;
    if (a.prefix !== b.prefix || netOf(a.ip, a.prefix) !== netOf(b.ip, b.prefix))
      continue;
    out.push({ dev: p.dev, local: mine.iface, remote: p.iface, addr: a.ip });
  }
  return out;
}

export function routerId(dev: DeviceState): string {
  let best = -1;
  for (const i of dev.ifaces) {
    if (i.ip && !i.adminDown) best = Math.max(best, parseCidr(i.ip)!.ip);
  }
  return best < 0 ? "0.0.0.0" : intToIp(best);
}

/** Route hasil OSPF (jalur terpendek berdasarkan jumlah hop) */
export function ospfRoutes(sim: LabSim, dev: DeviceState): RouteHit[] {
  const mineIfaces = ospfIfaces(dev);
  if (!mineIfaces.length) return [];

  const dist = new Map<DeviceState, number>([[dev, 0]]);
  const first = new Map<DeviceState, { via: number; iface: IfaceState }>();
  const queue: DeviceState[] = [dev];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of neighbors(sim, cur)) {
      if (dist.has(n.dev)) continue;
      dist.set(n.dev, dist.get(cur)! + 1);
      first.set(
        n.dev,
        cur === dev ? { via: n.addr, iface: n.local } : first.get(cur)!
      );
      queue.push(n.dev);
    }
  }

  const mine = new Set(mineIfaces.map((o) => netStr(o.cidr)));
  const seen = new Set<string>();
  const hits: RouteHit[] = [];
  for (const [rtr, hops] of dist) {
    if (rtr === dev) continue;
    const f = first.get(rtr)!;
    for (const o of ospfIfaces(rtr)) {
      const key = netStr(o.cidr);
      if (mine.has(key) || seen.has(key)) continue;
      seen.add(key);
      hits.push({
        kind: "ospf",
        dst: { ip: netOf(o.cidr.ip, o.cidr.prefix), prefix: o.cidr.prefix },
        via: f.via,
        iface: f.iface,
        metric: hops + 1,
      });
    }
  }
  return hits;
}
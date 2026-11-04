import type { Check, LabSpec } from "../types";
import {
  configCisco,
  execCisco,
  promptCisco,
  suggestCisco,
} from "./cisco";
import {
  configMikrotik,
  execMikrotik,
  promptMikrotik,
  suggestMikrotik,
} from "./mikrotik";
import { contains, intToIp, ipToInt, netOf, netStr, parseCidr } from "./net";
import { neighbors, ospfRoutes } from "./ospf";
import { execPc, promptPc, suggestPc } from "./pc";
import {
  makeDevice,
  trunkAllows,
  type DeviceState,
  type IfaceState,
  type RouteHit,
  type WgIface,
  type WgPeer,
} from "./state";

const HOSTS: Record<string, string> = {
  "google.com": "8.8.8.8",
  "cloudflare.com": "1.1.1.1",
};

const WHY = {
  noroute: "tidak ada route",
  unreach: "tidak ada jawaban dari hop berikutnya",
  loop: "routing loop",
  filtered: "diblokir firewall",
  wg: "tunnel WireGuard gagal (cek key, endpoint, port, allowed-address)",
} as const;

type Reason = keyof typeof WHY;

export interface Delivery {
  ok: boolean;
  dst: DeviceState | null;
  hops: number;
  /** id perangkat yang dilewati, dari pengirim sampai titik terakhir (termasuk switch) */
  path: string[];
  failAt: DeviceState | null;
  reason: Reason | null;
  /** Router yang menerjemahkan alamat sumber (masquerade) di jalur ini, kalau ada. */
  nat: { dev: DeviceState; iface: string; ip: number } | null;
}

interface DeliverOpts {
  /** Alamat sumber paket. Default: alamat interface keluar pengirim. */
  srcIp?: number | null;
  /** "new" = paket permintaan, "established" = balasan. */
  state?: "new" | "established";
  /** Isi bila paket sudah masuk lewat interface ini, jadi perangkat awal meneruskan (bukan membuat) paket. */
  inIface?: string;
}

interface Reply {
  ok: boolean;
  path: string[];
  failAt: DeviceState | null;
  reason: Reason | null;
}

/** Perangkat L3 yang terjangkau di layer 2 (menembus switch). */
interface L2Hit {
  dev: DeviceState;
  iface: IfaceState;
  /** id switch yang dilewati */
  via: string[];
}

export interface PingResult {
  ok: boolean;
  hops: number;
  /** true bila pengirim sendiri tidak punya route ke tujuan */
  noRoute: boolean;
}

/** Jejak ping untuk animasi di topologi. */
export interface PingTrace {
  /** jalur pergi (id perangkat) */
  fwd: string[];
  /** jalur pulang, dimulai dari tujuan */
  back: string[];
  ok: boolean;
  fail: { at: string; why: string; leg: "pergi" | "pulang" } | null;
}

export interface CheckResult {
  label: string;
  ok: boolean;
  detail: string;
}

export interface TaskResult {
  id: string;
  ok: boolean;
  checks: CheckResult[];
}

/** Alamat `ip` ada di `spec` (IP tunggal atau CIDR). spec kosong = cocok semua. */
function inNet(spec: string, ip: number | null): boolean {
  if (!spec) return true;
  if (ip === null) return false;
  const c = parseCidr(spec.includes("/") ? spec : `${spec}/32`);
  return !!c && contains(c, ip);
}

export class LabSim {
  readonly devices: DeviceState[];
  /** Perangkat yang sedang dimatikan (listrik putus). */
  readonly off = new Set<string>();
  /** Ujung kabel yang dicabut dari port-nya, formatnya "deviceId|iface". */
  readonly unplugged = new Set<string>();
  /** Penjaga rekursi: pengecekan underlay WireGuard memakai deliver lagi. */
  private wgDepth = 0;

  constructor(readonly spec: LabSpec) {
    this.devices = spec.devices.map(makeDevice);
  }

  /* ───────── fisik: daya dan kabel ───────── */

  isOn(id: string): boolean {
    return !this.off.has(id);
  }

  isPlugged(id: string, iface: string): boolean {
    return !this.unplugged.has(`${id}|${iface}`);
  }

  /** Nyalakan atau matikan perangkat. Konfigurasi tetap tersimpan, sesi CLI kembali ke awal. */
  setPower(id: string, on: boolean): void {
    const d = this.dev(id);
    if (!d || d.kind === "cloud") return;
    if (!on) {
      this.off.add(id);
      return;
    }
    this.off.delete(id);
    d.cs.mode = "user";
    d.cs.iface = null;
    d.cs.vlan = null;
    d.mt.path = [];
  }

  /** Cabut atau pasang kabel di satu port. Link mati bila salah satu ujung dicabut. */
  setPlugged(id: string, iface: string, plugged: boolean): void {
    const k = `${id}|${iface}`;
    if (plugged) this.unplugged.delete(k);
    else this.unplugged.add(k);
  }

  dev(id: string): DeviceState | undefined {
    return this.devices.find((d) => d.id === id);
  }

  /** Seberang kabel dari sebuah interface. Sub-interface memakai kabel interface induknya. */
  peer(
    dev: DeviceState,
    ifaceName: string
  ): { dev: DeviceState; iface: IfaceState } | null {
    const base = dev.ifaces.find((i) => i.name === ifaceName)?.parent ?? ifaceName;
    for (const { a, b } of this.spec.links) {
      const other =
        a[0] === dev.id && a[1] === base
          ? b
          : b[0] === dev.id && b[1] === base
            ? a
            : null;
      if (!other) continue;
      // Kabel dicabut di salah satu ujung = tidak ada seberang.
      if (
        this.unplugged.has(`${dev.id}|${base}`) ||
        this.unplugged.has(`${other[0]}|${other[1]}`)
      )
        return null;
      const d = this.dev(other[0]);
      const i = d?.ifaces.find((x) => x.name === other[1]);
      return d && i ? { dev: d, iface: i } : null;
    }
    return null;
  }

  /** Interface menyala secara logika: perangkat hidup, tidak di-shutdown, sub-interface punya induk aktif + VLAN. */
  alive(dev: DeviceState, ifc: IfaceState): boolean {
    if (this.off.has(dev.id) || ifc.adminDown) return false;
    if (ifc.parent) {
      const par = dev.ifaces.find((i) => i.name === ifc.parent);
      return !!par && !par.adminDown && ifc.vlan !== null;
    }
    return true;
  }

  /** Interface aktif: menyala, dan (kalau fisik) kabelnya tertancap ke perangkat yang hidup. */
  isUp(dev: DeviceState, ifc: IfaceState): boolean {
    if (!this.alive(dev, ifc)) return false;
    if (ifc.virtual) return true;
    const p = this.peer(dev, ifc.name);
    return !!p && !p.iface.adminDown && !this.off.has(p.dev.id);
  }

  owns(dev: DeviceState, ip: number): boolean {
    if (this.off.has(dev.id)) return false;
    return (
      dev.ifaces.some((i) => this.alive(dev, i) && i.ip && parseCidr(i.ip)!.ip === ip) ||
      dev.ownedIps.some((x) => ipToInt(x) === ip)
    );
  }

  /** Interface terhubung langsung yang jaringannya memuat alamat tsb */
  connectedIface(dev: DeviceState, ip: number): IfaceState | null {
    for (const i of dev.ifaces) {
      if (!i.ip || !this.isUp(dev, i)) continue;
      if (contains(parseCidr(i.ip)!, ip)) return i;
    }
    return null;
  }

  /** Pencarian route: prefix terpanjang, lalu connected > static > OSPF */
  lookup(dev: DeviceState, dst: number): RouteHit | null {
    const hits: RouteHit[] = [];
    for (const i of dev.ifaces) {
      if (!i.ip || !this.isUp(dev, i)) continue;
      const c = parseCidr(i.ip)!;
      if (contains(c, dst))
        hits.push({
          kind: "connected",
          dst: { ip: netOf(c.ip, c.prefix), prefix: c.prefix },
          via: null,
          iface: i,
          metric: 0,
        });
    }
    for (const r of dev.routes) {
      const n = parseCidr(r.dst);
      if (!n || !contains(n, dst)) continue;
      const via = ipToInt(r.via);
      if (via !== null) {
        const out = this.connectedIface(dev, via);
        if (out) hits.push({ kind: "static", dst: n, via, iface: out, metric: 1 });
      } else {
        // gateway = nama interface virtual (mis. wg0)
        const out = dev.ifaces.find(
          (i) => i.name === r.via && i.virtual && this.isUp(dev, i)
        );
        if (out) hits.push({ kind: "static", dst: n, via: null, iface: out, metric: 1 });
      }
    }
    for (const r of ospfRoutes(this, dev)) {
      if (contains(r.dst, dst)) hits.push(r);
    }
    const rank = { connected: 0, static: 1, ospf: 2 } as const;
    hits.sort((x, y) => y.dst.prefix - x.dst.prefix || rank[x.kind] - rank[y.kind]);
    return hits[0] ?? null;
  }

  /* ───────── layer 2: switch dan VLAN ───────── */

  private isSwitch(d: DeviceState): boolean {
    return d.role === "switch";
  }

  /** VLAN efektif frame yang masuk lewat `port` (tag null = tanpa tag), atau null bila dibuang. */
  private ingressVlan(sw: DeviceState, port: IfaceState, tag: number | null): number | null {
    let v: number | null;
    if (port.mode === "trunk") {
      if (tag === null) v = port.native;
      else v = trunkAllows(port, tag) ? tag : null;
    } else {
      v = tag === null ? port.accessVlan : null;
    }
    return v !== null && sw.sw.vlans.some((x) => x.id === v) ? v : null;
  }

  /** Tambahkan interface L3 yang menerima frame di ujung kabel (sub-interface bila frame bertag). */
  private collect(
    out: L2Hit[],
    dev: DeviceState,
    phys: IfaceState,
    tag: number | null,
    via: string[]
  ) {
    const cands =
      tag === null
        ? [phys]
        : dev.ifaces.filter((i) => i.parent === phys.name && i.vlan === tag);
    for (const i of cands) if (this.alive(dev, i)) out.push({ dev, iface: i, via });
  }

  /**
   * Perangkat L3 yang bisa dijangkau dari `ifc` lewat layer 2: langsung lewat kabel,
   * atau menembus switch sesuai VLAN, mode access/trunk, dan daftar VLAN di trunk.
   */
  l2Neighbors(dev: DeviceState, ifc: IfaceState): L2Hit[] {
    const out: L2Hit[] = [];
    const first = this.peer(dev, ifc.name);
    if (!first || first.iface.adminDown || this.off.has(first.dev.id)) return out;
    const tag = ifc.parent ? ifc.vlan : null;

    if (!this.isSwitch(first.dev)) {
      this.collect(out, first.dev, first.iface, tag, []);
      return out;
    }

    const seen = new Set<string>();
    const walk = (sw: DeviceState, inPort: IfaceState, v: number, via: string[]): void => {
      const key = `${sw.id}|${v}`;
      if (seen.has(key)) return;
      seen.add(key);
      const here = [...via, sw.id];
      for (const q of sw.ifaces) {
        if (q === inPort || q.adminDown) continue;
        let outTag: number | null;
        if (q.mode === "trunk") {
          if (!trunkAllows(q, v)) continue;
          outTag = v === q.native ? null : v;
        } else {
          if (q.accessVlan !== v) continue;
          outTag = null;
        }
        const far = this.peer(sw, q.name);
        if (!far || far.iface.adminDown || this.off.has(far.dev.id)) continue;
        if (this.isSwitch(far.dev)) {
          const v2 = this.ingressVlan(far.dev, far.iface, outTag);
          if (v2 !== null) walk(far.dev, far.iface, v2, here);
        } else {
          this.collect(out, far.dev, far.iface, outTag, here);
        }
      }
    };

    const v0 = this.ingressVlan(first.dev, first.iface, tag);
    if (v0 !== null) walk(first.dev, first.iface, v0, []);
    return out.filter((h) => h.iface !== ifc);
  }

  /* ───────── WireGuard ───────── */

  /**
   * Tunnel terbentuk bila endpoint peer menunjuk ke router yang punya interface WireGuard
   * dengan public key dan listen-port yang cocok, router itu punya peer balik untuk key kita,
   * dan IP endpoint terjangkau lewat underlay (ping pergi-pulang).
   */
  wgLink(
    dev: DeviceState,
    cfg: WgIface,
    peer: WgPeer
  ): { dev: DeviceState; cfg: WgIface; iface: IfaceState; ep: number } | null {
    if (peer.disabled || !peer.endpoint || this.wgDepth >= 2) return null;
    const ep = ipToInt(peer.endpoint);
    if (ep === null) return null;
    const mine = dev.ifaces.find((i) => i.name === cfg.name);
    if (!mine || !this.alive(dev, mine)) return null;

    for (const d of this.devices) {
      if (d === dev || d.kind !== "mikrotik" || !this.owns(d, ep)) continue;
      const w = d.mt.wg.find(
        (x) => x.publicKey === peer.publicKey && x.listenPort === peer.endpointPort
      );
      const wi = w ? d.ifaces.find((i) => i.name === w.name) : undefined;
      if (!w || !wi || !this.alive(d, wi)) continue;
      if (!w.peers.some((p) => !p.disabled && p.publicKey === cfg.publicKey)) continue;

      this.wgDepth++;
      let ok = false;
      try {
        ok = this.pingResult(dev, ep).ok;
      } finally {
        this.wgDepth--;
      }
      return ok ? { dev: d, cfg: w, iface: wi, ep } : null;
    }
    return null;
  }

  /** Paket keluar lewat interface WireGuard: pilih peer dari allowed-address, lalu muncul di router seberang. */
  private wgCross(
    cur: DeviceState,
    wg: IfaceState,
    nextIp: number,
    pktSrc: number | null
  ): { dev: DeviceState; iface: IfaceState; via: string[] } | { fail: DeviceState } {
    const cfg = cur.mt.wg.find((w) => w.name === wg.name);
    const peer = cfg?.peers.find((p) => !p.disabled && p.allowed.some((a) => inNet(a, nextIp)));
    const link = cfg && peer ? this.wgLink(cur, cfg, peer) : null;
    if (!cfg || !link) return { fail: cur };

    // Sisi penerima: sumber paket harus ada di allowed-address peer-nya.
    const back = link.cfg.peers.find((p) => !p.disabled && p.publicKey === cfg.publicKey);
    if (!back || !back.allowed.some((a) => inNet(a, pktSrc))) return { fail: link.dev };

    this.wgDepth++;
    let u: Delivery;
    try {
      u = this.deliver(cur, link.ep);
    } finally {
      this.wgDepth--;
    }
    const via = u.ok ? u.path.slice(1) : [link.dev.id];
    if (via[via.length - 1] !== link.dev.id) via.push(link.dev.id);
    return { dev: link.dev, iface: link.iface, via };
  }

  /* ───────── penerusan paket ───────── */

  /**
   * Chain forward MikroTik: rule dicek berurutan, yang pertama cocok menentukan.
   * Tidak ada yang cocok = lolos. Status koneksi disederhanakan:
   * paket permintaan = "new", balasan = "established".
   */
  private passes(
    dev: DeviceState,
    pkt: {
      src: number | null;
      dst: number;
      inIface: string;
      outIface: string;
      state: "new" | "established";
    }
  ): boolean {
    for (const r of dev.mt.filter) {
      if (r.chain !== "forward") continue;
      if (r.protocol && r.protocol !== "icmp") continue;
      if (r.inIface && r.inIface !== pkt.inIface) continue;
      if (r.outIface && r.outIface !== pkt.outIface) continue;
      if (!inNet(r.src, pkt.src) || !inNet(r.dst, pkt.dst)) continue;
      if (r.states.length) {
        const hit =
          pkt.state === "new"
            ? r.states.includes("new")
            : r.states.some((s) => s === "established" || s === "related");
        if (!hit) continue;
      }
      if (r.action === "accept") return true;
      if (r.action === "drop" || r.action === "reject") return false;
    }
    return true;
  }

  /** Teruskan paket hop demi hop sampai tujuan */
  deliver(src: DeviceState, dstIp: number, opts: DeliverOpts = {}): Delivery {
    let cur = src;
    let hops = 0;
    const path = [src.id];
    const state = opts.state ?? "new";
    // null = paket dibuat oleh perangkat awal, belum ada yang "meneruskan"
    let inIface: string | null = opts.inIface ?? null;
    const pktSrc0 = opts.srcIp ?? this.sourceIp(src, dstIp);
    let pktSrc: number | null = pktSrc0;
    let nat: Delivery["nat"] = null;

    const fail = (reason: Reason, at: DeviceState): Delivery => ({
      ok: false,
      dst: null,
      hops,
      path,
      failAt: at,
      reason,
      nat,
    });

    for (let ttl = 0; ttl < 16; ttl++) {
      if (this.owns(cur, dstIp))
        return { ok: true, dst: cur, hops, path, failAt: null, reason: null, nat };
      const hit = this.lookup(cur, dstIp);
      if (!hit) return fail("noroute", cur);

      // Firewall hanya berlaku pada paket yang diteruskan, bukan yang dibuat router sendiri.
      if (
        inIface !== null &&
        cur.kind === "mikrotik" &&
        !this.passes(cur, {
          src: pktSrc,
          dst: dstIp,
          inIface,
          outIface: hit.iface.name,
          state,
        })
      )
        return fail("filtered", cur);

      const nextIp = hit.via ?? dstIp;

      // Interface WireGuard: paket menyeberang tunnel ke router seberang.
      if (hit.iface.virtual) {
        const w = this.wgCross(cur, hit.iface, nextIp, pktSrc);
        if ("fail" in w) return fail("wg", w.fail);
        path.push(...w.via);
        cur = w.dev;
        hops++;
        inIface = w.iface.name;
        continue;
      }

      const nb = this.l2Neighbors(cur, hit.iface).find((n) => {
        const nip = n.iface.ip ? parseCidr(n.iface.ip)!.ip : null;
        return (
          nip === nextIp ||
          (nextIp === dstIp && n.dev.ownedIps.some((x) => ipToInt(x) === dstIp))
        );
      });
      if (!nb) return fail("unreach", cur);

      // srcnat masquerade: alamat sumber diganti IP interface keluar.
      if (
        inIface !== null &&
        !nat &&
        cur.kind === "mikrotik" &&
        hit.iface.ip &&
        cur.mt.nat.some(
          (r) =>
            r.chain === "srcnat" &&
            r.action === "masquerade" &&
            r.outIface === hit.iface.name
        )
      ) {
        pktSrc = parseCidr(hit.iface.ip)!.ip;
        nat = { dev: cur, iface: hit.iface.name, ip: pktSrc };
      }

      cur = nb.dev;
      hops++;
      path.push(...nb.via, cur.id);
      inIface = nb.iface.name;
    }
    return fail("loop", cur);
  }

  private sourceIp(src: DeviceState, dst: number): number | null {
    if (this.owns(src, dst)) return dst;
    const h = this.lookup(src, dst);
    return h?.iface.ip ? parseCidr(h.iface.ip)!.ip : null;
  }

  /**
   * Jalur balasan. Kalau jalur pergi melewati NAT, balasan dialamatkan ke IP hasil
   * terjemahan, lalu router NAT mengembalikannya ke alamat asli pengirim.
   */
  private replyLegs(
    src: DeviceState,
    dstIp: number,
    fwd: Delivery,
    dst: DeviceState
  ): Reply {
    const origIp = this.sourceIp(src, dstIp);
    const target = fwd.nat?.ip ?? origIp;
    if (target === null)
      return { ok: false, path: [dst.id], failAt: dst, reason: "noroute" };

    const meta = { srcIp: dstIp, state: "established" as const };
    const a = this.deliver(dst, target, meta);
    if (!fwd.nat || !a.ok)
      return { ok: a.ok, path: a.path, failAt: a.failAt, reason: a.reason };
    if (origIp === null)
      return { ok: false, path: a.path, failAt: a.dst, reason: "noroute" };

    const b = this.deliver(fwd.nat.dev, origIp, {
      ...meta,
      inIface: fwd.nat.iface,
    });
    return {
      ok: b.ok,
      path: [...a.path, ...b.path.slice(1)],
      failAt: b.failAt,
      reason: b.reason,
    };
  }

  /** Ping butuh jalur pergi dan jalur pulang */
  pingResult(src: DeviceState, dstIp: number): PingResult {
    const fwd = this.deliver(src, dstIp);
    if (!fwd.ok || !fwd.dst)
      return {
        ok: false,
        hops: fwd.hops,
        noRoute: fwd.reason === "noroute" && fwd.failAt === src,
      };
    return {
      ok: this.replyLegs(src, dstIp, fwd, fwd.dst).ok,
      hops: fwd.hops,
      noRoute: false,
    };
  }

  /* ───────── animasi ping ───────── */

  /** Jejak lengkap pergi-pulang, termasuk titik berhentinya paket kalau gagal. */
  tracePing(srcId: string, dstIp: number): PingTrace | null {
    const src = this.dev(srcId);
    if (!src || this.off.has(srcId)) return null;
    const go = this.deliver(src, dstIp);
    if (!go.ok || !go.dst) {
      return {
        fwd: go.path,
        back: [],
        ok: false,
        fail: {
          at: go.failAt?.id ?? srcId,
          why: WHY[go.reason ?? "unreach"],
          leg: "pergi",
        },
      };
    }
    const rt = this.replyLegs(src, dstIp, go, go.dst);
    if (rt.ok) return { fwd: go.path, back: rt.path, ok: true, fail: null };
    return {
      fwd: go.path,
      back: rt.path,
      ok: false,
      fail: {
        at: rt.failAt?.id ?? go.dst.id,
        why: WHY[rt.reason ?? "noroute"],
        leg: "pulang",
      },
    };
  }

  /** Kalau `line` adalah perintah ping yang valid, kembalikan jejaknya. Panggil setelah exec. */
  traceCommand(id: string, line: string): PingTrace | null {
    const d = this.dev(id);
    if (!d || d.kind === "cloud" || this.off.has(id)) return null;
    const m = /^\/?ping\s+(.+)$/i.exec(line.trim());
    if (!m) return null;
    if (d.kind === "cisco" && d.cs.mode !== "user" && d.cs.mode !== "priv")
      return null;
    if (d.kind === "pc" && !d.ifaces[0]?.ip) return null;
    const toks = m[1].trim().split(/\s+/);
    const raw =
      toks.find((t) => t.startsWith("address=")) ??
      toks.find((t) => !t.includes("=")) ??
      "";
    const target = raw.replace(/^address=/i, "");
    const ip =
      ipToInt(target) ??
      (d.kind === "mikrotik" ? this.resolveName(d, target) : null);
    return ip === null ? null : this.tracePing(id, ip);
  }

  resolveName(dev: DeviceState, name: string): number | null {
    const host = HOSTS[name.toLowerCase()];
    if (!host || !dev.mt.dns.length) return null;
    const reachable = dev.mt.dns.some((s) => {
      const ip = ipToInt(s);
      return ip !== null && this.pingResult(dev, ip).ok;
    });
    return reachable ? ipToInt(host) : null;
  }

  /* ───────── bantuan terminal & tampilan konfigurasi ───────── */

  /** Kandidat kata berikutnya untuk Tab dan "?". */
  suggest(id: string, line: string): string[] {
    const d = this.dev(id);
    if (!d || this.off.has(id)) return [];
    if (d.kind === "mikrotik") return suggestMikrotik(d, line);
    if (d.kind === "cisco") return suggestCisco(d, line);
    if (d.kind === "pc") return suggestPc(line);
    return [];
  }

  /** Konfigurasi satu perangkat: /export, show running-config, atau show ip. */
  config(id: string): string {
    const d = this.dev(id);
    if (!d) return "";
    if (d.kind === "mikrotik") return configMikrotik(d);
    if (d.kind === "cisco") return configCisco(d);
    if (d.kind === "pc") return execPc(this, d, "show");
    return "";
  }

  /** Konfigurasi semua perangkat, untuk dokumentasi portofolio. */
  configAll(): string {
    return this.devices
      .filter((d) => d.kind !== "cloud")
      .map((d) => {
        const name =
          d.kind === "mikrotik"
            ? "MikroTik RouterOS"
            : d.kind === "cisco"
              ? d.role === "switch"
                ? "Cisco IOS Switch"
                : "Cisco IOS"
              : "PC";
        return `### ${d.label} (${name})\n${this.config(d.id) || "(kosong)"}`;
      })
      .join("\n\n");
  }

  banner(id: string): string {
    switch (this.dev(id)?.kind) {
      case "mikrotik":
        return "MikroTik RouterOS (simulasi). Ketik help untuk daftar perintah yang didukung.";
      case "cisco":
        return "Cisco IOS (simulasi). Ketik ? untuk daftar perintah di mode saat ini.";
      case "pc":
        return "Virtual PC (simulasi). Ketik help untuk daftar perintah.";
      default:
        return "";
    }
  }

  prompt(id: string): string {
    const d = this.dev(id);
    if (!d) return "";
    if (d.kind === "mikrotik") return promptMikrotik(d);
    if (d.kind === "cisco") return promptCisco(d);
    if (d.kind === "pc") return promptPc(d);
    return "";
  }

  exec(id: string, line: string): string {
    const d = this.dev(id);
    if (!d || this.off.has(id)) return "";
    if (d.kind === "mikrotik") return execMikrotik(this, d, line);
    if (d.kind === "cisco") return execCisco(this, d, line);
    if (d.kind === "pc") return execPc(this, d, line);
    return "";
  }

  /* ───────── penilaian ───────── */

  evaluate(c: Check): CheckResult {
    const nm = (id: string) => this.dev(id)?.label ?? id;
    const res = (label: string, ok: boolean, bad: string): CheckResult => ({
      label,
      ok,
      detail: ok ? "OK" : bad,
    });

    switch (c.type) {
      case "hostname": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: nama perangkat "${c.equals}"`,
          d?.hostname === c.equals,
          `saat ini "${d?.hostname ?? "-"}"`
        );
      }
      case "iface-ip": {
        const i = this.dev(c.device)?.ifaces.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: ${c.iface} = ${c.ip}`,
          i?.ip === c.ip,
          i?.ip ? `saat ini ${i.ip}` : "belum ada IP"
        );
      }
      case "iface-no-ip": {
        const i = this.dev(c.device)?.ifaces.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: ${c.iface} tanpa IP`,
          !!i && !i.ip,
          `masih ada IP ${i?.ip ?? ""}`
        );
      }
      case "iface-up": {
        const i = this.dev(c.device)?.ifaces.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: ${c.iface} aktif`,
          !!i && !i.adminDown,
          "interface masih dimatikan"
        );
      }
      case "route": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: route ${c.dst} via ${c.via}`,
          !!d?.routes.some((r) => r.dst === c.dst && r.via === c.via),
          "route belum ada"
        );
      }
      case "no-route": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: tanpa route ke ${c.dst}`,
          !!d && !d.routes.some((r) => r.dst === c.dst),
          "route lama masih ada"
        );
      }
      case "dns": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: DNS server ${c.server}`,
          !!d?.mt.dns.includes(c.server),
          "DNS belum diatur"
        );
      }
      case "dhcp-server": {
        const s = this.dev(c.device)?.mt.servers.find((x) => x.iface === c.iface);
        return res(
          `${nm(c.device)}: DHCP server aktif di ${c.iface}`,
          !!s && !s.disabled,
          s ? "server ada tapi masih disabled" : "belum ada DHCP server"
        );
      }
      case "has-lease": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: dapat IP dari DHCP`,
          !!d?.pc.viaDhcp && !!d.ifaces[0]?.ip,
          "belum mendapat IP dari DHCP"
        );
      }
      case "ospf-neighbors": {
        const d = this.dev(c.device);
        const n = d ? neighbors(this, d).length : 0;
        return res(
          `${nm(c.device)}: minimal ${c.min} neighbor OSPF`,
          n >= c.min,
          `baru ${n} neighbor`
        );
      }
      case "ospf-route": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: route OSPF ke ${c.dst}`,
          !!d && ospfRoutes(this, d).some((r) => netStr(r.dst) === c.dst),
          "route belum dipelajari lewat OSPF"
        );
      }
      case "ping": {
        const s = this.dev(c.from);
        const ip = ipToInt(c.to);
        return res(
          `Ping ${nm(c.from)} ke ${c.to}`,
          !!s && ip !== null && this.pingResult(s, ip).ok,
          "tidak ada balasan"
        );
      }
      case "no-ping": {
        const s = this.dev(c.from);
        const ip = ipToInt(c.to);
        return res(
          `Ping ${nm(c.from)} ke ${c.to} harus diblokir`,
          !!s && ip !== null && !this.pingResult(s, ip).ok,
          "ping masih berhasil"
        );
      }
      case "nat-masq": {
        const d = this.dev(c.device);
        return res(
          `${nm(c.device)}: NAT masquerade di ${c.iface}`,
          !!d?.mt.nat.some(
            (r) =>
              r.chain === "srcnat" &&
              r.action === "masquerade" &&
              r.outIface === c.iface
          ),
          "rule NAT belum ada"
        );
      }
      case "vlan": {
        const v = this.dev(c.device)?.sw.vlans.find((x) => x.id === c.id);
        const nameOk = !c.name || v?.name.toLowerCase() === c.name.toLowerCase();
        return res(
          `${nm(c.device)}: VLAN ${c.id}${c.name ? ` bernama ${c.name}` : ""}`,
          !!v && nameOk,
          v ? `nama saat ini "${v.name}"` : "VLAN belum dibuat"
        );
      }
      case "access-port": {
        const i = this.dev(c.device)?.ifaces.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: ${c.iface} access VLAN ${c.vlan}`,
          !!i && i.mode === "access" && i.accessVlan === c.vlan,
          i
            ? i.mode === "trunk"
              ? "port masih mode trunk"
              : `saat ini VLAN ${i.accessVlan}`
            : "port tidak ditemukan"
        );
      }
      case "trunk-port": {
        const i = this.dev(c.device)?.ifaces.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: ${c.iface} trunk untuk VLAN ${c.vlans.join(", ")}`,
          !!i && i.mode === "trunk" && c.vlans.every((v) => trunkAllows(i, v)),
          i && i.mode !== "trunk"
            ? "port belum mode trunk"
            : "ada VLAN yang tidak diizinkan di trunk"
        );
      }
      case "iface-vlan": {
        const i = this.dev(c.device)?.ifaces.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: ${c.iface} encapsulation dot1q ${c.vlan}`,
          !!i && i.vlan === c.vlan,
          i
            ? i.vlan === null
              ? "belum ada encapsulation"
              : `saat ini VLAN ${i.vlan}`
            : "sub-interface belum dibuat"
        );
      }
      case "wg-iface": {
        const w = this.dev(c.device)?.mt.wg.find((x) => x.name === c.name);
        return res(
          `${nm(c.device)}: interface WireGuard ${c.name} port ${c.port}`,
          !!w && w.listenPort === c.port,
          w ? `listen-port saat ini ${w.listenPort}` : "interface belum dibuat"
        );
      }
      case "wg-tunnel": {
        const d = this.dev(c.device);
        const w = d?.mt.wg.find((x) => x.name === c.iface);
        return res(
          `${nm(c.device)}: tunnel ${c.iface} terhubung ke peer`,
          !!d && !!w && w.peers.some((p) => this.wgLink(d, w, p) !== null),
          w
            ? "handshake belum berhasil (cek public key, endpoint, port, dan peer di sisi lawan)"
            : "interface belum dibuat"
        );
      }
    }
  }

  evaluateTasks(): TaskResult[] {
    return this.spec.tasks.map((t) => {
      const checks = t.checks.map((c) => this.evaluate(c));
      return { id: t.id, ok: checks.every((x) => x.ok), checks };
    });
  }
}

export { intToIp };
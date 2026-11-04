"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  AddBtn,
  Card,
  Check2,
  DelBtn,
  Field,
  OutputPanel,
  input,
  intToIp,
  ipToInt,
  isIp,
  parseCidr,
  type Cidr,
} from "./ui";

/* ───────────── Types ───────────── */

type Ver = "v6" | "v7";
type WanMode = "dhcp" | "static" | "none";
type Vlan = { id: string; parent: string; cidr: string; dhcp: boolean };
type Route = { dst: string; gw: string };
type Net = { cidr: string; area: string };

type State = {
  ver: Ver;
  identity: string;
  password: string;
  dns: string;
  disableSvc: boolean;
  // WAN
  wanIf: string;
  wanMode: WanMode;
  wanCidr: string;
  wanGw: string;
  nat: boolean;
  fw: boolean;
  // LAN
  lanOn: boolean;
  bridge: string;
  ports: string;
  lanCidr: string;
  dhcpOn: boolean;
  poolStart: string;
  poolEnd: string;
  // Lainnya
  vlans: Vlan[];
  routes: Route[];
  ospfOn: boolean;
  routerId: string;
  nets: Net[];
  passive: string;
  defaultInfo: boolean;
};

/* ───────────── Helpers ───────────── */

const NAME = /^[A-Za-z0-9._-]+$/;

/** String RouterOS: escape \ " $ ? */
const q = (v: string) => `"${v.replace(/[\\"$?]/g, (c) => `\\${c}`)}"`;

const list = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const areaId = (n: string) => intToIp(Number(n));
const areaName = (n: string) =>
  Number(n) === 0 ? "backbone" : `area${Number(n)}`;

/* ───────────── Generator ───────────── */

export function generate(s: State): { text: string; issues: string[] } {
  const L: string[] = [];
  const issues: string[] = [];
  const add = (...lines: string[]) => {
    L.push(...lines);
  };
  const section = (title: string) => add("", `# ===== ${title} =====`);

  const name = (v: string, label: string) => {
    if (!v) {
      issues.push(`${label} belum diisi.`);
      return false;
    }
    if (NAME.test(v)) return true;
    issues.push(
      `${label} "${v}" hanya boleh huruf, angka, titik, minus, dan underscore.`,
    );
    return false;
  };

  const dnsList = list(s.dns);

  /** Tentukan range DHCP pool: custom kalau diisi, otomatis kalau kosong. */
  const pool = (
    c: Cidr,
    startIn: string,
    endIn: string,
    label: string,
  ): [string, string] | null => {
    const st = startIn.trim();
    const en = endIn.trim();
    if (st || en) {
      const inNet = (x: string) =>
        isIp(x) && (ipToInt(x) & ipToInt(c.mask)) >>> 0 === ipToInt(c.network);
      if (!inNet(st) || !inNet(en) || ipToInt(st) > ipToInt(en)) {
        issues.push(
          `${label}: range pool harus berada di dalam subnet dan awal <= akhir.`,
        );
        return null;
      }
      return [st, en];
    }
    const a = ipToInt(c.ip) + 1;
    const b = ipToInt(c.broadcast) - 1;
    if (c.len > 30 || a > b) {
      issues.push(`${label}: tidak ada ruang untuk DHCP pool di subnet ini.`);
      return null;
    }
    return [intToIp(a), intToIp(b)];
  };

  const dhcp = (tag: string, iface: string, c: Cidr, r: [string, string]) =>
    add(
      `/ip pool add name=pool-${tag} ranges=${r[0]}-${r[1]}`,
      `/ip dhcp-server add name=dhcp-${tag} interface=${iface} address-pool=pool-${tag} lease-time=1d disabled=no`,
      `/ip dhcp-server network add address=${c.network}/${c.len} gateway=${c.ip}${
        dnsList.length ? ` dns-server=${c.ip}` : ""
      }`,
    );

  add(`# MikroTik RouterOS ${s.ver} - dibuat oleh NetworkLab Config Generator`);

  // ── Identity
  const identity = s.identity.trim();
  if (name(identity, "Identity")) {
    section("Identity");
    add(`/system identity set name=${identity}`);
  }

  // ── WAN
  const wanIf = s.wanIf.trim();
  const wanOk = wanIf ? name(wanIf, "Interface WAN") : false;
  if (s.wanMode !== "none" && !wanIf) issues.push("Interface WAN belum diisi.");
  if (wanOk && s.wanMode === "dhcp") {
    section("WAN (DHCP client)");
    add(
      `/ip dhcp-client add interface=${wanIf} disabled=no use-peer-dns=yes add-default-route=yes`,
    );
  }
  if (wanOk && s.wanMode === "static") {
    section("WAN (IP statis)");
    const c = parseCidr(s.wanCidr);
    if (!c) issues.push("IP WAN tidak valid (contoh 203.0.113.2/30).");
    else
      add(
        `/ip address add address=${c.ip}/${c.len} interface=${wanIf} network=${c.network}`,
      );
    const gw = s.wanGw.trim();
    if (!isIp(gw)) issues.push("Gateway WAN tidak valid.");
    else add(`/ip route add dst-address=0.0.0.0/0 gateway=${gw}`);
  }

  // ── LAN
  if (s.lanOn) {
    section("LAN");
    const br = s.bridge.trim();
    if (name(br, "Nama bridge")) {
      add(`/interface bridge add name=${br}`);
      const ports = list(s.ports);
      if (!ports.length)
        issues.push("Bridge belum punya port (contoh: ether2, ether3).");
      ports.forEach((p) => {
        if (name(p, "Port bridge"))
          add(`/interface bridge port add bridge=${br} interface=${p}`);
      });
      const c = parseCidr(s.lanCidr);
      if (!c) issues.push("IP LAN tidak valid (contoh 192.168.88.1/24).");
      else {
        add(
          `/ip address add address=${c.ip}/${c.len} interface=${br} network=${c.network}`,
        );
        if (s.dhcpOn) {
          const r = pool(c, s.poolStart, s.poolEnd, "DHCP LAN");
          if (r) dhcp("lan", br, c, r);
        }
      }
    }
  }

  // ── VLAN
  if (s.vlans.length) {
    section("VLAN");
    const seen = new Set<number>();
    s.vlans.forEach((v) => {
      const id = Number(v.id);
      if (!v.id.trim() || !Number.isInteger(id) || id < 1 || id > 4094) {
        issues.push(`VLAN "${v.id || "(kosong)"}" tidak valid (1-4094).`);
        return;
      }
      if (seen.has(id)) {
        issues.push(`VLAN ${id} duplikat (nama interface vlan${id} bentrok).`);
        return;
      }
      seen.add(id);
      const parent = v.parent.trim();
      if (!name(parent, `Interface induk VLAN ${id}`)) return;
      const nm = `vlan${id}`;
      add(`/interface vlan add name=${nm} vlan-id=${id} interface=${parent}`);
      if (!v.cidr.trim()) return;
      const c = parseCidr(v.cidr);
      if (!c) {
        issues.push(`IP VLAN ${id} tidak valid (contoh 192.168.10.1/24).`);
        return;
      }
      add(
        `/ip address add address=${c.ip}/${c.len} interface=${nm} network=${c.network}`,
      );
      if (v.dhcp) {
        const r = pool(c, "", "", `DHCP VLAN ${id}`);
        if (r) dhcp(nm, nm, c, r);
      }
    });
  }

  // ── DNS
  if (dnsList.length) {
    section("DNS");
    const bad = dnsList.filter((d) => !isIp(d));
    if (bad.length) issues.push(`DNS tidak valid: ${bad.join(", ")}.`);
    else
      add(`/ip dns set servers=${dnsList.join(",")} allow-remote-requests=yes`);
  }

  // ── NAT & firewall
  if (s.nat) {
    section("NAT");
    if (!wanOk) issues.push("NAT butuh interface WAN yang valid.");
    else
      add(
        `/ip firewall nat add chain=srcnat out-interface=${wanIf} action=masquerade comment="NAT internet"`,
      );
  }
  if (s.fw) {
    section("Firewall dasar");
    if (!wanOk) issues.push("Firewall dasar butuh interface WAN yang valid.");
    else
      add(
        `/ip firewall filter add chain=input action=accept connection-state=established,related comment="izinkan koneksi yang sudah ada"`,
        `/ip firewall filter add chain=input action=accept protocol=icmp comment="izinkan ping"`,
        `/ip firewall filter add chain=input action=drop in-interface=${wanIf} comment="blok akses ke router dari WAN"`,
      );
  }

  // ── Static route
  if (s.routes.length) {
    section("Static route");
    s.routes.forEach((r) => {
      const c = parseCidr(r.dst);
      const gw = r.gw.trim();
      if (!c) {
        issues.push(
          `Tujuan route "${r.dst || "(kosong)"}" tidak valid (contoh 10.10.0.0/16).`,
        );
        return;
      }
      if (!isIp(gw)) {
        issues.push(`Gateway route ${r.dst} tidak valid.`);
        return;
      }
      add(`/ip route add dst-address=${c.network}/${c.len} gateway=${gw}`);
    });
  }

  // ── OSPF
  if (s.ospfOn) {
    section(`OSPF (RouterOS ${s.ver})`);
    const rid = s.routerId.trim();
    const ridOk = !!rid && isIp(rid);
    if (rid && !ridOk) issues.push("Router-ID tidak valid.");

    const passive = list(s.passive).filter((p) => name(p, "Passive interface"));

    const nets = s.nets.flatMap((n) => {
      const c = parseCidr(n.cidr);
      const area = n.area.trim() || "0";
      if (!c) {
        issues.push(`Network OSPF "${n.cidr || "(kosong)"}" tidak valid.`);
        return [];
      }
      if (!/^\d+$/.test(area) || Number(area) > 4294967295) {
        issues.push(`Area "${area}" tidak valid (angka, 0 = backbone).`);
        return [];
      }
      return [{ net: `${c.network}/${c.len}`, area: String(Number(area)) }];
    });
    if (!nets.length)
      issues.push("OSPF aktif tapi belum ada network yang valid.");

    const areas = Array.from(new Set(nets.map((n) => n.area)));
    const passiveArea = areaName(areas[0] ?? "0");

    if (s.ver === "v7") {
      const props = [
        ...(ridOk ? [`router-id=${rid}`] : []),
        ...(s.defaultInfo ? ["originate-default=if-installed"] : []),
      ];
      add(
        `/routing ospf instance add name=ospf1 version=2${
          props.length ? ` ${props.join(" ")}` : ""
        }`,
      );
      areas.forEach((a) =>
        add(
          `/routing ospf area add name=${areaName(a)} area-id=${areaId(a)} instance=ospf1`,
        ),
      );
      nets.forEach((n) =>
        add(
          `/routing ospf interface-template add area=${areaName(n.area)} networks=${n.net}`,
        ),
      );
      passive.forEach((p) =>
        add(
          `/routing ospf interface-template add area=${passiveArea} interfaces=${p} passive=yes`,
        ),
      );
    } else {
      const props = [
        ...(ridOk ? [`router-id=${rid}`] : []),
        ...(s.defaultInfo ? ["redistribute-default-route=if-installed"] : []),
      ];
      if (props.length)
        add(
          `/routing ospf instance set [ find default=yes ] ${props.join(" ")}`,
        );
      areas
        .filter((a) => Number(a) !== 0)
        .forEach((a) =>
          add(
            `/routing ospf area add name=${areaName(a)} area-id=${areaId(a)}`,
          ),
        );
      nets.forEach((n) =>
        add(
          `/routing ospf network add network=${n.net} area=${areaName(n.area)}`,
        ),
      );
      passive.forEach((p) =>
        add(`/routing ospf interface add interface=${p} passive=yes`),
      );
    }
  }

  // ── Hardening
  if (s.disableSvc) {
    section("Matikan service tidak aman");
    ["telnet", "ftp", "www", "api", "api-ssl"].forEach((x) =>
      add(`/ip service set ${x} disabled=yes`),
    );
  }

  // ── Password
  if (s.password) {
    section("User");
    add(`/user set admin password=${q(s.password)}`);
  }

  return { text: L.join("\n"), issues };
}

/* ───────────── Defaults ───────────── */

export const EXAMPLE: State = {
  ver: "v7",
  identity: "R-MIKROTIK",
  password: "ganti-password",
  dns: "8.8.8.8, 1.1.1.1",
  disableSvc: true,
  wanIf: "ether1",
  wanMode: "dhcp",
  wanCidr: "",
  wanGw: "",
  nat: true,
  fw: false,
  lanOn: true,
  bridge: "bridge-lan",
  ports: "ether2, ether3",
  lanCidr: "192.168.88.1/24",
  dhcpOn: true,
  poolStart: "",
  poolEnd: "",
  vlans: [{ id: "10", parent: "ether4", cidr: "192.168.10.1/24", dhcp: true }],
  routes: [],
  ospfOn: true,
  routerId: "1.1.1.1",
  nets: [
    { cidr: "192.168.88.0/24", area: "0" },
    { cidr: "192.168.10.0/24", area: "0" },
  ],
  passive: "bridge-lan",
  defaultInfo: false,
};

const EMPTY: State = {
  ver: "v7",
  identity: "",
  password: "",
  dns: "",
  disableSvc: false,
  wanIf: "ether1",
  wanMode: "dhcp",
  wanCidr: "",
  wanGw: "",
  nat: false,
  fw: false,
  lanOn: true,
  bridge: "bridge-lan",
  ports: "",
  lanCidr: "",
  dhcpOn: true,
  poolStart: "",
  poolEnd: "",
  vlans: [],
  routes: [],
  ospfOn: false,
  routerId: "",
  nets: [],
  passive: "",
  defaultInfo: false,
};

/* ───────────── Page ───────────── */

export default function MikrotikGenerator() {
  const [s, setS] = useState<State>(EXAMPLE);

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const upd = <T,>(items: T[], i: number, patch: Partial<T>) =>
    items.map((x, idx) => (idx === i ? { ...x, ...patch } : x));

  const { text, issues } = useMemo(() => generate(s), [s]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Isi form, hasilnya script RouterOS siap tempel ke Terminal Winbox.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setS(EXAMPLE)}
            className="rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-fg"
          >
            Isi contoh
          </button>
          <button
            type="button"
            onClick={() => setS(EMPTY)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-muted hover:text-fg"
          >
            <RotateCcw className="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ───── FORM ───── */}
        <div className="space-y-4">
          <Card
            title="Versi RouterOS"
            hint="Menentukan sintaks OSPF. Cek versi dengan /system resource print."
          >
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["v6", "v6 (6.x)"],
                  ["v7", "v7 (7.x)"],
                ] as [Ver, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("ver", v)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    s.ver === v
                      ? "bg-accent/15 text-white ring-1 ring-accent/40"
                      : "border border-line text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          <Card title="Dasar">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Identity (nama router)">
                <input
                  className={input}
                  value={s.identity}
                  onChange={(e) => set("identity", e.target.value)}
                  placeholder="R-MIKROTIK"
                />
              </Field>
              <Field label="Password user admin">
                <input
                  className={input}
                  value={s.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="opsional"
                />
              </Field>
            </div>
            <Field label="DNS server (pisah koma)">
              <input
                className={input}
                value={s.dns}
                onChange={(e) => set("dns", e.target.value)}
                placeholder="8.8.8.8, 1.1.1.1"
              />
            </Field>
            <Check2
              label="Matikan service tidak aman (telnet, ftp, www, api)"
              checked={s.disableSvc}
              onChange={(v) => set("disableSvc", v)}
            />
          </Card>

          <Card title="WAN (internet)">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Interface WAN">
                <input
                  className={input}
                  value={s.wanIf}
                  onChange={(e) => set("wanIf", e.target.value)}
                  placeholder="ether1"
                />
              </Field>
              <Field label="Mode">
                <select
                  className={input}
                  value={s.wanMode}
                  onChange={(e) => set("wanMode", e.target.value as WanMode)}
                >
                  <option value="dhcp">DHCP client</option>
                  <option value="static">IP statis</option>
                  <option value="none">Tidak diatur</option>
                </select>
              </Field>
            </div>
            {s.wanMode === "static" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="IP WAN (CIDR)">
                  <input
                    className={input}
                    value={s.wanCidr}
                    onChange={(e) => set("wanCidr", e.target.value)}
                    placeholder="203.0.113.2/30"
                  />
                </Field>
                <Field label="Gateway">
                  <input
                    className={input}
                    value={s.wanGw}
                    onChange={(e) => set("wanGw", e.target.value)}
                    placeholder="203.0.113.1"
                  />
                </Field>
              </div>
            )}
            <Check2
              label="NAT masquerade ke WAN"
              checked={s.nat}
              onChange={(v) => set("nat", v)}
            />
            <Check2
              label="Firewall dasar (blok akses ke router dari WAN)"
              checked={s.fw}
              onChange={(v) => set("fw", v)}
            />
            {s.fw && (
              <p className="text-xs text-amber-300">
                Jangan aktifkan kalau router dikelola lewat WAN, atau OSPF
                berjalan lewat interface WAN.
              </p>
            )}
          </Card>

          <Card title="LAN (bridge)">
            <Check2
              label="Buat bridge LAN"
              checked={s.lanOn}
              onChange={(v) => set("lanOn", v)}
            />
            {s.lanOn && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Nama bridge">
                    <input
                      className={input}
                      value={s.bridge}
                      onChange={(e) => set("bridge", e.target.value)}
                      placeholder="bridge-lan"
                    />
                  </Field>
                  <Field label="IP LAN (CIDR)">
                    <input
                      className={input}
                      value={s.lanCidr}
                      onChange={(e) => set("lanCidr", e.target.value)}
                      placeholder="192.168.88.1/24"
                    />
                  </Field>
                </div>
                <Field label="Port anggota bridge (pisah koma)">
                  <input
                    className={input}
                    value={s.ports}
                    onChange={(e) => set("ports", e.target.value)}
                    placeholder="ether2, ether3, ether4"
                  />
                </Field>
                <Check2
                  label="DHCP server di LAN"
                  checked={s.dhcpOn}
                  onChange={(v) => set("dhcpOn", v)}
                />
                {s.dhcpOn && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Pool awal">
                      <input
                        className={input}
                        value={s.poolStart}
                        onChange={(e) => set("poolStart", e.target.value)}
                        placeholder="otomatis"
                      />
                    </Field>
                    <Field label="Pool akhir">
                      <input
                        className={input}
                        value={s.poolEnd}
                        onChange={(e) => set("poolEnd", e.target.value)}
                        placeholder="otomatis"
                      />
                    </Field>
                  </div>
                )}
              </>
            )}
          </Card>

          <Card
            title="VLAN"
            hint="Interface VLAN dibuat di atas interface induk. IP dan DHCP opsional."
          >
            {s.vlans.map((v, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <input
                  className={`${input} !w-20`}
                  value={v.id}
                  onChange={(e) =>
                    set("vlans", upd(s.vlans, i, { id: e.target.value }))
                  }
                  placeholder="ID"
                />
                <input
                  className={`${input} !w-28`}
                  value={v.parent}
                  onChange={(e) =>
                    set("vlans", upd(s.vlans, i, { parent: e.target.value }))
                  }
                  placeholder="ether4"
                />
                <input
                  className={`${input} min-w-[8rem] flex-1`}
                  value={v.cidr}
                  onChange={(e) =>
                    set("vlans", upd(s.vlans, i, { cidr: e.target.value }))
                  }
                  placeholder="192.168.10.1/24"
                />
                <Check2
                  label="DHCP"
                  checked={v.dhcp}
                  onChange={(c) => set("vlans", upd(s.vlans, i, { dhcp: c }))}
                />
                <DelBtn
                  onClick={() =>
                    set(
                      "vlans",
                      s.vlans.filter((_, idx) => idx !== i),
                    )
                  }
                />
              </div>
            ))}
            <AddBtn
              label="Tambah VLAN"
              onClick={() =>
                set("vlans", [
                  ...s.vlans,
                  { id: "", parent: "", cidr: "", dhcp: false },
                ])
              }
            />
          </Card>

          <Card title="Static route">
            {s.routes.map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={input}
                  value={r.dst}
                  onChange={(e) =>
                    set("routes", upd(s.routes, i, { dst: e.target.value }))
                  }
                  placeholder="10.10.0.0/16"
                />
                <input
                  className={input}
                  value={r.gw}
                  onChange={(e) =>
                    set("routes", upd(s.routes, i, { gw: e.target.value }))
                  }
                  placeholder="Gateway 192.168.1.2"
                />
                <DelBtn
                  onClick={() =>
                    set(
                      "routes",
                      s.routes.filter((_, idx) => idx !== i),
                    )
                  }
                />
              </div>
            ))}
            <AddBtn
              label="Tambah route"
              onClick={() => set("routes", [...s.routes, { dst: "", gw: "" }])}
            />
          </Card>

          <Card title="OSPF">
            <Check2
              label="Aktifkan OSPF"
              checked={s.ospfOn}
              onChange={(v) => set("ospfOn", v)}
            />
            {s.ospfOn && (
              <>
                <Field label="Router-ID">
                  <input
                    className={input}
                    value={s.routerId}
                    onChange={(e) => set("routerId", e.target.value)}
                    placeholder="1.1.1.1"
                  />
                </Field>
                {s.nets.map((n, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      className={input}
                      value={n.cidr}
                      onChange={(e) =>
                        set("nets", upd(s.nets, i, { cidr: e.target.value }))
                      }
                      placeholder="192.168.88.0/24"
                    />
                    <input
                      className={`${input} !w-24`}
                      value={n.area}
                      onChange={(e) =>
                        set("nets", upd(s.nets, i, { area: e.target.value }))
                      }
                      placeholder="Area"
                    />
                    <DelBtn
                      onClick={() =>
                        set(
                          "nets",
                          s.nets.filter((_, idx) => idx !== i),
                        )
                      }
                    />
                  </div>
                ))}
                <AddBtn
                  label="Tambah network"
                  onClick={() =>
                    set("nets", [...s.nets, { cidr: "", area: "0" }])
                  }
                />
                <Field label="Passive interface (pisah koma)">
                  <input
                    className={input}
                    value={s.passive}
                    onChange={(e) => set("passive", e.target.value)}
                    placeholder="bridge-lan, vlan10"
                  />
                </Field>
                <Check2
                  label="Sebarkan default route (originate default)"
                  checked={s.defaultInfo}
                  onChange={(v) => set("defaultInfo", v)}
                />
              </>
            )}
          </Card>
        </div>

        {/* ───── OUTPUT ───── */}
        <OutputPanel
          text={text}
          issues={issues}
          filename={s.identity.trim() || "config"}
          ext="rsc"
        />
      </div>
    </div>
  );
}

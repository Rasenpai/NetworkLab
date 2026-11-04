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
  isIp,
  parseCidr,
} from "./ui";

/* ───────────── Types ───────────── */

type Device = "router" | "switch" | "l3switch";
type Vlan = { id: string; name: string; svi: string };
type Port = {
  range: string;
  mode: "access" | "trunk";
  vlan: string;
  allowed: string;
  desc: string;
};
type Iface = { name: string; cidr: string; desc: string };
type Net = { cidr: string; area: string };

type State = {
  device: Device;
  hostname: string;
  secret: string;
  domain: string;
  banner: string;
  gateway: string;
  encrypt: boolean;
  noLookup: boolean;
  logSync: boolean;
  ssh: boolean;
  sshUser: string;
  sshPass: string;
  vlans: Vlan[];
  ports: Port[];
  ifaces: Iface[];
  ospfOn: boolean;
  pid: string;
  routerId: string;
  nets: Net[];
  passive: string;
  defaultInfo: boolean;
};

/* ───────────── Generator ───────────── */

export function generate(s: State): { text: string; issues: string[] } {
  const L: string[] = [];
  const issues: string[] = [];
  const isRouter = s.device === "router";
  const isSwitch = !isRouter;
  const canRoute = s.device !== "switch";

  L.push("enable", "configure terminal", "!");

  // ── Basic
  if (s.hostname.trim()) {
    if (!/^[A-Za-z][A-Za-z0-9-]{0,62}$/.test(s.hostname.trim()))
      issues.push(
        "Hostname harus diawali huruf dan hanya berisi huruf, angka, atau tanda minus.",
      );
    L.push(`hostname ${s.hostname.trim()}`);
  } else issues.push("Hostname belum diisi.");

  if (s.noLookup) L.push("no ip domain-lookup");
  if (s.domain.trim()) L.push(`ip domain-name ${s.domain.trim()}`);
  if (s.secret) L.push(`enable secret ${s.secret}`);
  if (s.encrypt) L.push("service password-encryption");
  if (s.banner.trim()) L.push(`banner motd #${s.banner.trim()}#`);
  if (s.logSync) L.push("!", "line console 0", " logging synchronous", " exit");
  if (canRoute && s.device === "l3switch") L.push("!", "ip routing");

  // ── VLAN
  if (isSwitch && s.vlans.length) {
    L.push("!", "! ===== VLAN =====");
    const seen = new Set<string>();
    s.vlans.forEach((v) => {
      const id = Number(v.id);
      if (!Number.isInteger(id) || id < 1 || id > 4094) {
        issues.push(`VLAN "${v.id || "(kosong)"}" tidak valid (1–4094).`);
        return;
      }
      if (seen.has(v.id)) issues.push(`VLAN ${v.id} duplikat.`);
      seen.add(v.id);
      L.push(`vlan ${id}`);
      if (v.name.trim()) L.push(` name ${v.name.trim().replace(/\s+/g, "_")}`);
      L.push(" exit");
    });

    const svis = s.vlans.filter((v) => v.svi.trim());
    if (svis.length) {
      L.push("!", "! ===== SVI =====");
      svis.forEach((v) => {
        const c = parseCidr(v.svi);
        if (!c) {
          issues.push(
            `IP SVI VLAN ${v.id} tidak valid (contoh 192.168.10.1/24).`,
          );
          return;
        }
        L.push(
          `interface vlan ${v.id}`,
          ` ip address ${c.ip} ${c.mask}`,
          " no shutdown",
          " exit",
        );
      });
    }
    if (s.device === "switch" && s.gateway.trim()) {
      if (!isIp(s.gateway.trim())) issues.push("Default gateway tidak valid.");
      else L.push("!", `ip default-gateway ${s.gateway.trim()}`);
    }
  }

  // ── Switchports
  if (isSwitch && s.ports.length) {
    L.push("!", "! ===== Port Switch =====");
    s.ports.forEach((p) => {
      if (!p.range.trim()) {
        issues.push("Ada port yang belum diisi namanya.");
        return;
      }
      const isRange = /[-,]/.test(p.range);
      L.push(`interface ${isRange ? "range " : ""}${p.range.trim()}`);
      if (p.desc.trim()) L.push(` description ${p.desc.trim()}`);
      if (p.mode === "access") {
        L.push(" switchport mode access");
        if (p.vlan.trim()) L.push(` switchport access vlan ${p.vlan.trim()}`);
        else issues.push(`Port ${p.range}: VLAN access belum diisi.`);
        L.push(" spanning-tree portfast");
      } else {
        L.push(" switchport mode trunk");
        if (p.allowed.trim())
          L.push(` switchport trunk allowed vlan ${p.allowed.trim()}`);
      }
      L.push(" no shutdown", " exit");
    });
  }

  // ── Router interfaces
  if (isRouter && s.ifaces.length) {
    L.push("!", "! ===== Interface =====");
    s.ifaces.forEach((i) => {
      if (!i.name.trim()) {
        issues.push("Ada interface yang belum diisi namanya.");
        return;
      }
      const c = parseCidr(i.cidr);
      if (!c) {
        issues.push(`IP interface ${i.name} tidak valid (contoh 10.0.0.1/30).`);
        return;
      }
      L.push(`interface ${i.name.trim()}`);
      if (i.desc.trim()) L.push(` description ${i.desc.trim()}`);
      L.push(` ip address ${c.ip} ${c.mask}`, " no shutdown", " exit");
    });
  }

  // ── OSPF
  if (canRoute && s.ospfOn) {
    L.push("!", "! ===== OSPF =====");
    const pid = Number(s.pid);
    if (!Number.isInteger(pid) || pid < 1 || pid > 65535)
      issues.push("Process ID OSPF harus 1–65535.");
    L.push(`router ospf ${s.pid || "1"}`);
    if (s.routerId.trim()) {
      if (!isIp(s.routerId.trim())) issues.push("Router-ID tidak valid.");
      else L.push(` router-id ${s.routerId.trim()}`);
    }
    if (!s.nets.length) issues.push("OSPF aktif tapi belum ada network.");
    s.nets.forEach((n) => {
      const c = parseCidr(n.cidr);
      if (!c) {
        issues.push(`Network OSPF "${n.cidr || "(kosong)"}" tidak valid.`);
        return;
      }
      L.push(
        ` network ${c.network} ${c.wildcard} area ${n.area.trim() || "0"}`,
      );
    });
    s.passive
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .forEach((p) => L.push(` passive-interface ${p}`));
    if (s.defaultInfo) L.push(" default-information originate");
    L.push(" exit");
  }

  // ── SSH
  if (s.ssh) {
    L.push("!", "! ===== SSH =====");
    if (!s.domain.trim())
      issues.push("SSH butuh domain name (untuk generate RSA key).");
    if (!s.sshUser.trim() || !s.sshPass)
      issues.push("SSH butuh username dan password.");
    else
      L.push(`username ${s.sshUser.trim()} privilege 15 secret ${s.sshPass}`);
    L.push(
      "crypto key generate rsa modulus 2048",
      "ip ssh version 2",
      "line vty 0 15",
      " transport input ssh",
      " login local",
      " exit",
    );
  }

  L.push("!", "end", "copy running-config startup-config");
  return { text: L.join("\n"), issues };
}

/* ───────────── Defaults ───────────── */

export const EXAMPLE: State = {
  device: "l3switch",
  hostname: "SW-CORE",
  secret: "cisco123",
  domain: "lab.local",
  banner: "Akses hanya untuk yang berwenang",
  gateway: "",
  encrypt: true,
  noLookup: true,
  logSync: true,
  ssh: true,
  sshUser: "admin",
  sshPass: "admin123",
  vlans: [
    { id: "10", name: "STAFF", svi: "192.168.10.1/24" },
    { id: "20", name: "SERVER", svi: "192.168.20.1/24" },
  ],
  ports: [
    {
      range: "FastEthernet0/1 - 10",
      mode: "access",
      vlan: "10",
      allowed: "",
      desc: "",
    },
    {
      range: "GigabitEthernet0/1",
      mode: "trunk",
      vlan: "",
      allowed: "10,20",
      desc: "Uplink",
    },
  ],
  ifaces: [],
  ospfOn: true,
  pid: "1",
  routerId: "1.1.1.1",
  nets: [
    { cidr: "192.168.10.0/24", area: "0" },
    { cidr: "192.168.20.0/24", area: "0" },
  ],
  passive: "vlan 10",
  defaultInfo: false,
};

const EMPTY: State = {
  device: "router",
  hostname: "",
  secret: "",
  domain: "",
  banner: "",
  gateway: "",
  encrypt: false,
  noLookup: true,
  logSync: true,
  ssh: false,
  sshUser: "",
  sshPass: "",
  vlans: [],
  ports: [],
  ifaces: [],
  ospfOn: false,
  pid: "1",
  routerId: "",
  nets: [],
  passive: "",
  defaultInfo: false,
};

/* ───────────── Page ───────────── */

export default function CiscoGenerator() {
  const [s, setS] = useState<State>(EXAMPLE);

  const set = <K extends keyof State>(k: K, v: State[K]) =>
    setS((p) => ({ ...p, [k]: v }));

  const upd = <T,>(list: T[], i: number, patch: Partial<T>) =>
    list.map((x, idx) => (idx === i ? { ...x, ...patch } : x));

  const { text, issues } = useMemo(() => generate(s), [s]);

  const isRouter = s.device === "router";
  const canRoute = s.device !== "switch";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Isi form, hasilnya script Cisco IOS siap copy ke terminal.
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
          <Card title="Perangkat">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["router", "Router"],
                  ["switch", "Switch L2"],
                  ["l3switch", "Switch L3"],
                ] as [Device, string][]
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("device", v)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    s.device === v
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
              <Field label="Hostname">
                <input
                  className={input}
                  value={s.hostname}
                  onChange={(e) => set("hostname", e.target.value)}
                  placeholder="R1"
                />
              </Field>
              <Field label="Enable secret">
                <input
                  className={input}
                  value={s.secret}
                  onChange={(e) => set("secret", e.target.value)}
                  placeholder="opsional"
                />
              </Field>
              <Field label="Domain name">
                <input
                  className={input}
                  value={s.domain}
                  onChange={(e) => set("domain", e.target.value)}
                  placeholder="lab.local"
                />
              </Field>
              <Field label="Banner MOTD">
                <input
                  className={input}
                  value={s.banner}
                  onChange={(e) => set("banner", e.target.value)}
                  placeholder="opsional"
                />
              </Field>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Check2
                label="service password-encryption"
                checked={s.encrypt}
                onChange={(v) => set("encrypt", v)}
              />
              <Check2
                label="no ip domain-lookup"
                checked={s.noLookup}
                onChange={(v) => set("noLookup", v)}
              />
              <Check2
                label="logging synchronous"
                checked={s.logSync}
                onChange={(v) => set("logSync", v)}
              />
              <Check2
                label="Aktifkan SSH"
                checked={s.ssh}
                onChange={(v) => set("ssh", v)}
              />
            </div>
            {s.ssh && (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Username SSH">
                  <input
                    className={input}
                    value={s.sshUser}
                    onChange={(e) => set("sshUser", e.target.value)}
                  />
                </Field>
                <Field label="Password SSH">
                  <input
                    className={input}
                    value={s.sshPass}
                    onChange={(e) => set("sshPass", e.target.value)}
                  />
                </Field>
              </div>
            )}
          </Card>

          {!isRouter && (
            <Card
              title="VLAN"
              hint="Isi IP SVI (format CIDR) kalau VLAN perlu gateway."
            >
              {s.vlans.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={`${input} !w-20`}
                    value={v.id}
                    onChange={(e) =>
                      set("vlans", upd(s.vlans, i, { id: e.target.value }))
                    }
                    placeholder="ID"
                  />
                  <input
                    className={input}
                    value={v.name}
                    onChange={(e) =>
                      set("vlans", upd(s.vlans, i, { name: e.target.value }))
                    }
                    placeholder="Nama"
                  />
                  <input
                    className={input}
                    value={v.svi}
                    onChange={(e) =>
                      set("vlans", upd(s.vlans, i, { svi: e.target.value }))
                    }
                    placeholder="192.168.10.1/24"
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
                  set("vlans", [...s.vlans, { id: "", name: "", svi: "" }])
                }
              />
              {s.device === "switch" && (
                <Field label="Default gateway (switch L2)">
                  <input
                    className={input}
                    value={s.gateway}
                    onChange={(e) => set("gateway", e.target.value)}
                    placeholder="192.168.10.254"
                  />
                </Field>
              )}
            </Card>
          )}

          {!isRouter && (
            <Card
              title="Port Switch"
              hint="Boleh pakai range, contoh: FastEthernet0/1 - 10"
            >
              {s.ports.map((p, i) => (
                <div
                  key={i}
                  className="space-y-2 rounded-xl border border-line p-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      className={input}
                      value={p.range}
                      onChange={(e) =>
                        set("ports", upd(s.ports, i, { range: e.target.value }))
                      }
                      placeholder="FastEthernet0/1 - 10"
                    />
                    <select
                      className={`${input} !w-28`}
                      value={p.mode}
                      onChange={(e) =>
                        set(
                          "ports",
                          upd(s.ports, i, {
                            mode: e.target.value as Port["mode"],
                          }),
                        )
                      }
                    >
                      <option value="access">Access</option>
                      <option value="trunk">Trunk</option>
                    </select>
                    <DelBtn
                      onClick={() =>
                        set(
                          "ports",
                          s.ports.filter((_, idx) => idx !== i),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {p.mode === "access" ? (
                      <input
                        className={input}
                        value={p.vlan}
                        onChange={(e) =>
                          set(
                            "ports",
                            upd(s.ports, i, { vlan: e.target.value }),
                          )
                        }
                        placeholder="VLAN access (10)"
                      />
                    ) : (
                      <input
                        className={input}
                        value={p.allowed}
                        onChange={(e) =>
                          set(
                            "ports",
                            upd(s.ports, i, { allowed: e.target.value }),
                          )
                        }
                        placeholder="Allowed VLAN (10,20)"
                      />
                    )}
                    <input
                      className={input}
                      value={p.desc}
                      onChange={(e) =>
                        set("ports", upd(s.ports, i, { desc: e.target.value }))
                      }
                      placeholder="Deskripsi (opsional)"
                    />
                  </div>
                </div>
              ))}
              <AddBtn
                label="Tambah port"
                onClick={() =>
                  set("ports", [
                    ...s.ports,
                    {
                      range: "",
                      mode: "access",
                      vlan: "",
                      allowed: "",
                      desc: "",
                    },
                  ])
                }
              />
            </Card>
          )}

          {isRouter && (
            <Card title="Interface Router" hint="IP pakai format CIDR.">
              {s.ifaces.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    className={input}
                    value={f.name}
                    onChange={(e) =>
                      set("ifaces", upd(s.ifaces, i, { name: e.target.value }))
                    }
                    placeholder="GigabitEthernet0/0"
                  />
                  <input
                    className={input}
                    value={f.cidr}
                    onChange={(e) =>
                      set("ifaces", upd(s.ifaces, i, { cidr: e.target.value }))
                    }
                    placeholder="10.0.0.1/30"
                  />
                  <input
                    className={input}
                    value={f.desc}
                    onChange={(e) =>
                      set("ifaces", upd(s.ifaces, i, { desc: e.target.value }))
                    }
                    placeholder="Deskripsi"
                  />
                  <DelBtn
                    onClick={() =>
                      set(
                        "ifaces",
                        s.ifaces.filter((_, idx) => idx !== i),
                      )
                    }
                  />
                </div>
              ))}
              <AddBtn
                label="Tambah interface"
                onClick={() =>
                  set("ifaces", [...s.ifaces, { name: "", cidr: "", desc: "" }])
                }
              />
            </Card>
          )}

          {canRoute && (
            <Card title="OSPF">
              <Check2
                label="Aktifkan OSPF"
                checked={s.ospfOn}
                onChange={(v) => set("ospfOn", v)}
              />
              {s.ospfOn && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Process ID">
                      <input
                        className={input}
                        value={s.pid}
                        onChange={(e) => set("pid", e.target.value)}
                      />
                    </Field>
                    <Field label="Router-ID">
                      <input
                        className={input}
                        value={s.routerId}
                        onChange={(e) => set("routerId", e.target.value)}
                        placeholder="1.1.1.1"
                      />
                    </Field>
                  </div>
                  {s.nets.map((n, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        className={input}
                        value={n.cidr}
                        onChange={(e) =>
                          set("nets", upd(s.nets, i, { cidr: e.target.value }))
                        }
                        placeholder="192.168.10.0/24"
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
                      placeholder="GigabitEthernet0/1, vlan 10"
                    />
                  </Field>
                  <Check2
                    label="default-information originate"
                    checked={s.defaultInfo}
                    onChange={(v) => set("defaultInfo", v)}
                  />
                </>
              )}
            </Card>
          )}
        </div>

        {/* ───── OUTPUT ───── */}
        <OutputPanel
          text={text}
          issues={issues}
          filename={s.hostname.trim() || "config"}
          ext="txt"
        />
      </div>
    </div>
  );
}

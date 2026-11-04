import type { LabSim } from "./sim";
import type { DeviceState } from "./state";
import { contains, intToIp, ipToInt, parseCidr, prefixMask } from "./net";

const HELP = [
  "Perintah yang didukung:",
  "  ip <alamat>/<prefix> [gateway]   atur IP manual",
  "  dhcp                             minta IP dari DHCP server",
  "  show ip                          tampilkan konfigurasi IP",
  "  ping <alamat>                    uji koneksi",
  "  clear                            bersihkan layar",
].join("\n");

function showIp(dev: DeviceState): string {
  const c = dev.ifaces[0]?.ip ? parseCidr(dev.ifaces[0].ip) : null;
  const gw = dev.routes.find((r) => r.dst === "0.0.0.0/0")?.via ?? "";
  return [
    `NAME        : ${dev.label}`,
    `IP/MASK     : ${c ? `${intToIp(c.ip)}/${c.prefix}` : "belum diatur"}`,
    `GATEWAY     : ${gw}`,
    `DNS         : ${dev.mt.dns.join(" ")}`,
    `DHCP        : ${dev.pc.viaDhcp ? "ya" : "tidak"}`,
  ].join("\n");
}

function dhcp(sim: LabSim, dev: DeviceState): string {
  const eth = dev.ifaces[0];
  const p = sim.peer(dev, eth.name);
  if (!p || !sim.isUp(dev, eth))
    return "DHCP gagal: interface mati atau kabel tidak terhubung.";

  const srv = p.dev.mt.servers.find((s) => s.iface === p.iface.name && !s.disabled);
  if (p.dev.kind !== "mikrotik" || !srv)
    return "DHCP gagal: tidak ada DHCP server aktif di segmen ini.";

  const pool = p.dev.mt.pools.find((x) => x.name === srv.pool);
  const srvCidr = p.iface.ip ? parseCidr(p.iface.ip) : null;
  const net = srvCidr
    ? p.dev.mt.networks.find((n) => {
        const c = parseCidr(n.address);
        return !!c && contains(c, srvCidr.ip);
      })
    : undefined;
  if (!pool || !net || !srvCidr)
    return "DHCP gagal: server belum lengkap (cek pool, network, dan IP interface router).";

  const taken = new Set<number>([
    ...p.dev.mt.leases
      .filter((l) => l.client !== dev.id)
      .map((l) => ipToInt(l.ip) ?? -1),
    ...p.dev.ifaces.map((i) => (i.ip ? parseCidr(i.ip)!.ip : -1)),
  ]);
  const mine = p.dev.mt.leases.find((l) => l.client === dev.id);
  let ip = mine ? ipToInt(mine.ip) : null;
  if (ip === null) {
    for (let a = pool.from; a <= pool.to; a++) {
      if (!taken.has(a)) {
        ip = a;
        break;
      }
    }
  }
  if (ip === null) return "DHCP gagal: alamat di pool sudah habis.";

  const prefix = parseCidr(net.address)!.prefix;
  p.dev.mt.leases = p.dev.mt.leases
    .filter((l) => l.client !== dev.id)
    .concat({ ip: intToIp(ip), client: dev.id });
  eth.ip = `${intToIp(ip)}/${prefix}`;
  dev.routes = net.gateway ? [{ dst: "0.0.0.0/0", via: net.gateway }] : [];
  dev.mt.dns = net.dns ? [net.dns] : [];
  dev.pc.viaDhcp = true;
  return `DORA berhasil: ${intToIp(ip)}/${prefix} gateway ${net.gateway || "-"}`;
}

export function promptPc(dev: DeviceState): string {
  return `${dev.label}> `;
}

export function execPc(sim: LabSim, dev: DeviceState, line: string): string {
  const t = line.trim().split(/\s+/).filter(Boolean);
  if (!t.length) return "";
  const eth = dev.ifaces[0];

  switch (t[0].toLowerCase()) {
    case "help":
    case "?":
      return HELP;

    case "dhcp":
      return dhcp(sim, dev);

    case "ip": {
      if (t[1]?.toLowerCase() === "dhcp") return dhcp(sim, dev);
      const c = parseCidr(t[1] ?? "");
      if (!c) return "Format: ip <alamat>/<prefix> [gateway], contoh: ip 192.168.1.10/24 192.168.1.1";
      const gw = t[2];
      if (gw) {
        const g = ipToInt(gw);
        if (g === null) return "Alamat gateway tidak valid.";
        if (!contains(c, g)) return "Gateway tidak berada di subnet yang sama.";
      }
      eth.ip = `${intToIp(c.ip)}/${c.prefix}`;
      dev.routes = gw ? [{ dst: "0.0.0.0/0", via: gw }] : [];
      dev.pc.viaDhcp = false;
      return `${dev.label} : ${intToIp(c.ip)} ${intToIp(prefixMask(c.prefix))}${gw ? ` gateway ${gw}` : ""}`;
    }

    case "show":
    case "ipconfig":
      return showIp(dev);

    case "ping": {
      const ip = ipToInt(t[1] ?? "");
      if (ip === null) return "Format: ping <alamat>, contoh: ping 192.168.1.1";
      if (!eth.ip) return "IP belum diatur. Gunakan: ip <alamat>/<prefix> <gateway>, atau: dhcp";
      const r = sim.pingResult(dev, ip);
      if (r.noRoute) return `host (${t[1]}) not reachable`;
      const ttl = 64 - Math.max(0, r.hops - 1);
      const out: string[] = [];
      for (let i = 1; i <= 4; i++) {
        out.push(
          r.ok
            ? `84 bytes from ${t[1]} icmp_seq=${i} ttl=${ttl} time=${(0.8 + r.hops * 0.9 + i * 0.1).toFixed(3)} ms`
            : `${t[1]} icmp_seq=${i} timeout`
        );
      }
      return out.join("\n");
    }

    default:
      return `Perintah tidak dikenal: ${t[0]}. Ketik help untuk daftar perintah.`;
  }
}

/* ───────── saran perintah (Tab dan ?) ───────── */

const PC_CMDS = ["help", "dhcp", "ip", "show", "ping", "clear"];

export function suggestPc(line: string): string[] {
  const ip = /^\s*ip\s+(\S*)$/i.exec(line);
  if (ip) return "dhcp".startsWith(ip[1].toLowerCase()) ? ["dhcp"] : [];
  if (/\s/.test(line.trimStart())) return [];
  const p = line.trim().toLowerCase();
  return PC_CMDS.filter((c) => c.startsWith(p));
}
export interface Cidr {
  ip: number;
  prefix: number;
}

export function ipToInt(ip: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip.trim());
  if (!m) return null;
  let n = 0;
  for (let i = 1; i <= 4; i++) {
    const v = Number(m[i]);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

export function intToIp(n: number): string {
  return [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");
}

export function prefixMask(prefix: number): number {
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

export function maskToPrefix(mask: string): number | null {
  const m = ipToInt(mask);
  if (m === null) return null;
  let p = 0;
  while (p < 32 && ((m << p) & 0x80000000) !== 0) p++;
  return prefixMask(p) === m ? p : null;
}

export function parseCidr(s: string): Cidr | null {
  const parts = s.trim().split("/");
  if (parts.length !== 2) return null;
  const ip = ipToInt(parts[0]);
  if (ip === null || !/^\d{1,2}$/.test(parts[1])) return null;
  const prefix = Number(parts[1]);
  if (prefix > 32) return null;
  return { ip, prefix };
}

export function netOf(ip: number, prefix: number): number {
  return (ip & prefixMask(prefix)) >>> 0;
}

export function contains(net: Cidr, ip: number): boolean {
  return netOf(ip, net.prefix) === netOf(net.ip, net.prefix);
}

/** Alamat jaringan dalam format "a.b.c.d/p" (bit host dibuang) */
export function netStr(c: Cidr): string {
  return `${intToIp(netOf(c.ip, c.prefix))}/${c.prefix}`;
}
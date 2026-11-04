export function ipToNum(s: string): number | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s.trim());
  if (!m) return null;
  const parts = m.slice(1).map(Number);
  if (parts.some((n) => n > 255)) return null;
  return (((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0);
}

export const isValidIp = (s: string) => ipToNum(s) !== null;

export function numToIp(n: number): string {
  return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
}

/** Alamat network sebagai angka, atau null kalau IP/prefix tidak valid. */
export function networkOf(ip: string, prefix: number): number | null {
  const n = ipToNum(ip);
  if (n === null || !Number.isInteger(prefix) || prefix < 1 || prefix > 32) return null;
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (n & mask) >>> 0;
}

export function sameSubnet(a: string, prefix: number, b: string): boolean {
  const x = networkOf(a, prefix);
  const y = networkOf(b, prefix);
  return x !== null && x === y;
}

/** Contoh: "192.168.1.0/24" untuk ditampilkan. */
export function cidrLabel(ip: string, prefix: number): string | null {
  const n = networkOf(ip, prefix);
  return n === null ? null : `${numToIp(n)}/${prefix}`;
}
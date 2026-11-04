import "server-only";

/** Admin = email ada di ADMIN_EMAILS dan sudah terverifikasi. Dibaca di server saja. */
export function isAdmin(email: string, verifiedAt: number | null): boolean {
  if (!verifiedAt) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
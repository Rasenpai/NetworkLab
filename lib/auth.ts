import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db, type User } from "@/lib/db";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export const SESSION_COOKIE = "nl_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 hari

/* ---------- Password ---------- */

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(actual, expected);
}

/* ---------- Session ---------- */

const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_MS;

  // Bersihkan sesi yang sudah kedaluwarsa (sekalian di sini, karena jalan di server action).
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());

  // Yang disimpan di DB hanya hash-nya, bukan token asli.
  db.prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)").run(
    sha256(token),
    userId,
    expiresAt,
  );

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt),
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE id = ?").run(sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Mengembalikan user yang sedang login, atau null. Di-cache per request. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.created_at, u.avatar_updated, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ?
          AND s.expires_at > CAST(strftime('%s', 'now') AS INTEGER) * 1000`,
    )
    .get(sha256(token)) as (User & { expires_at: number }) | undefined;

  // Kedaluwarsa dicek di SQL (jam SQLite), bukan Date.now(), karena Date.now()
  // di jalur render ditolak Cache Components. Sesi lama dibersihkan di createSession().
  if (!row) return null;

  const { expires_at: _expires, ...user } = row;
  return user;
});

/** Dipakai di halaman/layout yang wajib login. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
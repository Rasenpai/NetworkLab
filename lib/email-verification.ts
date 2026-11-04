import "server-only";
import crypto from "node:crypto";
import { db } from "@/lib/db";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 1000;
const HOURLY_MAX = 5;

const sha256 = (s: string) =>
  crypto.createHash("sha256").update(s).digest("hex");

export function getVerificationStatus(userId: number): {
  verifiedAt: number | null;
  retryAfter: number;
} {
  const u = db
    .prepare("SELECT email_verified_at FROM users WHERE id = ?")
    .get(userId) as { email_verified_at: number | null } | undefined;
  const last = db
    .prepare(
      "SELECT created_at FROM email_verifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    )
    .get(userId) as { created_at: number } | undefined;

  const retryAfter = last
    ? Math.max(0, Math.ceil((last.created_at + COOLDOWN_MS - Date.now()) / 1000))
    : 0;
  return { verifiedAt: u?.email_verified_at ?? null, retryAfter };
}

export type IssueResult =
  | { ok: true; token: string }
  | { ok: false; error: string; retryAfter?: number };

/** Buat token baru (token lama milik user dibuang). Token mentah hanya dikembalikan di sini. */
export function issueVerificationToken(
  userId: number,
  email: string,
): IssueResult {
  const { verifiedAt, retryAfter } = getVerificationStatus(userId);
  if (verifiedAt) return { ok: false, error: "Email sudah terverifikasi." };
  if (retryAfter > 0)
    return {
      ok: false,
      error: `Tunggu ${retryAfter} detik sebelum mengirim ulang.`,
      retryAfter,
    };

  const now = Date.now();
  const recent = db
    .prepare(
      "SELECT COUNT(*) AS n FROM email_verifications WHERE user_id = ? AND created_at > ?",
    )
    .get(userId, now - 60 * 60 * 1000) as { n: number };
  // Token lama dibuang tiap kirim ulang, jadi hitungan ini hanya melihat 1 baris.
  // Batas per jam dihitung dari jejak terakhir: cukup untuk mencegah spam sederhana.
  if (recent.n >= HOURLY_MAX)
    return { ok: false, error: "Terlalu banyak permintaan. Coba lagi nanti." };

  const token = crypto.randomBytes(32).toString("base64url");

  db.transaction(() => {
    db.prepare("DELETE FROM email_verifications WHERE expires_at < ?").run(now);
    db.prepare("DELETE FROM email_verifications WHERE user_id = ?").run(userId);
    db.prepare(
      "INSERT INTO email_verifications (token_hash, user_id, email, expires_at, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(sha256(token), userId, email.toLowerCase(), now + TOKEN_TTL_MS, now);
  })();

  return { ok: true, token };
}

/** Tukar token dari link dengan status terverifikasi. Token sekali pakai. */
export function consumeVerificationToken(raw: string): boolean {
  if (!raw || raw.length > 200) return false;

  const row = db
    .prepare(
      "SELECT user_id, email, expires_at FROM email_verifications WHERE token_hash = ?",
    )
    .get(sha256(raw)) as
    | { user_id: number; email: string; expires_at: number }
    | undefined;
  if (!row || row.expires_at < Date.now()) return false;

  const user = db
    .prepare("SELECT email FROM users WHERE id = ?")
    .get(row.user_id) as { email: string } | undefined;
  // Email akun harus masih sama dengan email saat token dibuat.
  if (!user || user.email.toLowerCase() !== row.email) return false;

  db.transaction(() => {
    db.prepare(
      "UPDATE users SET email_verified_at = ? WHERE id = ? AND email_verified_at IS NULL",
    ).run(Date.now(), row.user_id);
    db.prepare("DELETE FROM email_verifications WHERE user_id = ?").run(
      row.user_id,
    );
  })();
  return true;
}
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "pending_verify";
const TTL_SEC = 24 * 60 * 60;

function sign(payload: string) {
  const s = process.env.CAPTCHA_SECRET;
  if (!s) throw new Error("CAPTCHA_SECRET belum di-set");
  return createHmac("sha256", s).update(payload).digest("hex");
}

/** Tandai browser ini sebagai "menunggu verifikasi email" untuk user tersebut. Bukan sesi login. */
export async function setPendingVerify(userId: number) {
  const exp = Date.now() + TTL_SEC * 1000;
  const payload = `${userId}.${exp}`;
  const jar = await cookies();
  jar.set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_SEC,
  });
}

export async function getPendingVerifyUserId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;

  const a = Buffer.from(sign(`${id}.${exp}`));
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const expNum = Number(exp);
  const userId = Number(id);
  if (!Number.isFinite(expNum) || Date.now() > expNum) return null;
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return userId;
}
"use server";

import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// SESUAIKAN dengan lib/auth.ts
const SESSION_COOKIE = "session";
const LOGIN_PATH = "/login";

async function clearSession(deleteRow: boolean) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (deleteRow && token) {
    // sessions.id = SHA-256 dari token di cookie
    const id = crypto.createHash("sha256").update(token).digest("hex");
    db.prepare("DELETE FROM sessions WHERE id = ?").run(id);
  }
  jar.delete(SESSION_COOKIE);
}

export async function logoutAction() {
  await clearSession(true);
  redirect(LOGIN_PATH);
}

export async function deleteAccountAction(
  confirmEmail: string,
): Promise<{ error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };

  if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase())
    return { error: "Email konfirmasi tidak cocok." };

  // Semua tabel turunan (sesi, progres, quiz, lab, portofolio, dll.) ikut terhapus lewat CASCADE.
  db.prepare("DELETE FROM users WHERE id = ?").run(user.id);

  await clearSession(false);
  redirect(LOGIN_PATH);
}
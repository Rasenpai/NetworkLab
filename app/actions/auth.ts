"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { verifyCaptcha } from "@/lib/captcha";
import { getVerificationStatus } from "@/lib/email-verification";
import { setPendingVerify } from "@/lib/pending-verify";
import { sendVerification } from "@/lib/verification-mail";

export type AuthState = {
  error?: string;
  fields?: { name?: string; email?: string };
  /** Diisi kalau akun perlu verifikasi email: form diganti tampilan "cek email". */
  verify?: {
    email: string;
    retryAfter: number;
    notice?: string;
    error?: string;
  };
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAPTCHA_ERROR = "Kode captcha salah atau sudah kedaluwarsa. Coba lagi.";

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { name, email };

  // Captcha dicek paling awal, sebelum validasi lain dan sebelum query ke DB,
  // supaya bot tidak bisa memakai form ini untuk mengecek email yang terdaftar.
  if (!verifyCaptcha(formData.get("captchaToken"), formData.get("captcha"))) {
    return { error: CAPTCHA_ERROR, fields };
  }

  if (name.length < 2) return { error: "Nama minimal 2 karakter.", fields };
  if (!EMAIL_RE.test(email)) return { error: "Format email tidak valid.", fields };
  if (password.length < 8) return { error: "Password minimal 8 karakter.", fields };

  const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (exists) return { error: "Email sudah terdaftar. Silakan masuk.", fields };

  const hash = await hashPassword(password);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
    .run(name, email, hash);
  const userId = Number(result.lastInsertRowid);

  // Tidak ada sesi login sampai email diverifikasi. Gagal kirim tidak membatalkan
  // pendaftaran: user bisa kirim ulang dari tampilan verifikasi.
  const sent = await sendVerification(userId, email);
  await setPendingVerify(userId);

  return {
    verify: {
      email,
      retryAfter: sent.retryAfter ?? 60,
      notice: sent.ok ? sent.message : undefined,
      error: sent.error,
    },
  };
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fields = { email };

  // Captcha dicek sebelum query DB dan sebelum verifyPassword (hash mahal),
  // jadi brute force harus lolos captcha dulu di setiap percobaan.
  if (!verifyCaptcha(formData.get("captchaToken"), formData.get("captcha"))) {
    return { error: CAPTCHA_ERROR, fields };
  }

  if (!email || !password) return { error: "Email dan password wajib diisi.", fields };

  const user = db
    .prepare("SELECT id, password_hash, email_verified_at FROM users WHERE email = ?")
    .get(email) as
    | { id: number; password_hash: string; email_verified_at: number | null }
    | undefined;

  // Pesan sama untuk email salah / password salah agar tidak membocorkan akun yang terdaftar.
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: "Email atau password salah.", fields };
  }

  // Dicek setelah password benar, jadi status verifikasi tidak bocor ke orang lain.
  if (!user.email_verified_at) {
    await setPendingVerify(user.id);
    return {
      verify: {
        email,
        retryAfter: getVerificationStatus(user.id).retryAfter,
      },
    };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
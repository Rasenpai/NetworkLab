"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPendingVerifyUserId } from "@/lib/pending-verify";
import { sendVerification, type VerifyResult } from "@/lib/verification-mail";

export type VerifyState = VerifyResult;

/** Dipakai dari halaman profil (user sudah login). */
export async function requestVerificationAction(
  _prev: VerifyState,
): Promise<VerifyState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };

  return sendVerification(user.id, user.email);
}

/** Dipakai dari halaman /verify-email (user belum punya sesi login). */
export async function resendPendingVerificationAction(
  _prev: VerifyState,
): Promise<VerifyState> {
  const userId = await getPendingVerifyUserId();
  if (!userId) return { error: "Sesi verifikasi berakhir. Silakan masuk lagi." };

  const user = db
    .prepare("SELECT email FROM users WHERE id = ?")
    .get(userId) as { email: string } | undefined;
  if (!user) return { error: "Akun tidak ditemukan." };

  return sendVerification(userId, user.email);
}
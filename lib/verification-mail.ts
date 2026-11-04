import "server-only";
import { issueVerificationToken } from "@/lib/email-verification";
import { sendVerificationEmail } from "@/lib/mailer";

export type VerifyResult = {
  ok?: boolean;
  error?: string;
  message?: string;
  retryAfter?: number;
};

/** Buat token lalu kirim email verifikasi. Dipakai oleh register dan tombol kirim ulang. */
export async function sendVerification(
  userId: number,
  email: string,
): Promise<VerifyResult> {
  const issued = issueVerificationToken(userId, email);
  if (!issued.ok) return { error: issued.error, retryAfter: issued.retryAfter };

  const base = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${base}/api/verify-email?token=${encodeURIComponent(issued.token)}`;

  const result = await sendVerificationEmail(email, link);

  if (result.delivered) {
    return {
      ok: true,
      retryAfter: 60,
      message: `Email verifikasi dikirim ke ${email}. Cek juga folder spam.`,
    };
  }
  if (result.reason === "not_configured") {
    return {
      ok: true,
      retryAfter: 60,
      message: "Layanan email belum dikonfigurasi, jadi email belum terkirim.",
    };
  }
  return {
    error: "Gagal mengirim email. Coba lagi sebentar lagi.",
    retryAfter: 60,
  };
}
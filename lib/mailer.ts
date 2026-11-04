import "server-only";
import { Resend } from "resend";

export type MailResult =
  | { delivered: true }
  | { delivered: false; reason: "not_configured" | "failed" };

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;
const FROM = process.env.MAIL_FROM ?? "NetworkLab <onboarding@resend.dev>";

export async function sendVerificationEmail(
  to: string,
  link: string,
): Promise<MailResult> {
  if (!resend) {
    // Mode stub: hanya di dev, di production tidak mencetak token ke log.
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n[mailer] RESEND_API_KEY kosong. Link verifikasi untuk ${to}:\n${link}\n`);
    }
    return { delivered: false, reason: "not_configured" };
  }

  const text = `Verifikasi email akun NetworkLab kamu dengan membuka link berikut (berlaku 24 jam):\n\n${link}\n\nJika kamu tidak merasa mendaftar, abaikan email ini.`;

  const html = `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f4f4f7;padding:32px 16px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1f">
    <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px">
      <tr><td>
        <h1 style="margin:0 0 12px;font-size:20px">Verifikasi email kamu</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#44444c">
          Klik tombol di bawah untuk memverifikasi email akun NetworkLab kamu. Link berlaku 24 jam.
        </p>
        <a href="${link}" style="display:inline-block;background:#9b59b6;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 24px;border-radius:8px">Verifikasi email</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#77777f">
          Tombol tidak berfungsi? Salin link ini ke browser:<br />
          <span style="word-break:break-all">${link}</span>
        </p>
        <p style="margin:16px 0 0;font-size:13px;color:#77777f">Jika kamu tidak merasa mendaftar, abaikan email ini.</p>
      </td></tr>
    </table>
  </body>
</html>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Verifikasi email NetworkLab",
      html,
      text,
    });
    if (error) {
      console.error("[mailer] Resend menolak:", error.name, error.message);
      return { delivered: false, reason: "failed" };
    }
    return { delivered: true };
  } catch (e) {
    console.error("[mailer] Gagal menghubungi Resend:", e);
    return { delivered: false, reason: "failed" };
  }
}
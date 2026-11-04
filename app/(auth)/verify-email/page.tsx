import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import VerifyPending from "@/components/VerifyPending";
import { db } from "@/lib/db";
import { getVerificationStatus } from "@/lib/email-verification";
import { getPendingVerifyUserId } from "@/lib/pending-verify";

export const metadata: Metadata = { title: "Verifikasi email" };

async function Content() {
  const userId = await getPendingVerifyUserId();
  if (!userId) redirect("/login");

  const user = db
    .prepare("SELECT email FROM users WHERE id = ?")
    .get(userId) as { email: string } | undefined;
  if (!user) redirect("/login");

  const { verifiedAt, retryAfter } = getVerificationStatus(userId);
  // Sudah terverifikasi (misalnya dari tab lain): tidak perlu halaman ini lagi.
  if (verifiedAt) redirect("/login");

  return <VerifyPending email={user.email} retryAfter={retryAfter} />;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Memuat…</p>}>
      <Content />
    </Suspense>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { BadgeCheck, MailWarning } from "lucide-react";
import {
  requestVerificationAction,
  type VerifyState,
} from "@/app/actions/verify-email";

export default function VerifyEmail({
  verifiedAt,
  retryAfter,
}: {
  verifiedAt: number | null;
  retryAfter: number;
}) {
  const [state, dispatch, pending] = useActionState<VerifyState, FormData>(
    requestVerificationAction,
    {},
  );
  const [cooldown, setCooldown] = useState(retryAfter);

  useEffect(() => {
    if (state.retryAfter) setCooldown(state.retryAfter);
  }, [state]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (verifiedAt) {
    const date = new Date(verifiedAt).toLocaleDateString("id-ID", {
      dateStyle: "long",
      timeZone: "Asia/Jakarta",
    });
    return (
      <span
        title={`Diverifikasi ${date}`}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400"
      >
        <BadgeCheck className="size-3.5" />
        Email terverifikasi
      </span>
    );
  }

  return (
    <div className="mt-3">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400">
        <MailWarning className="size-3.5" />
        Belum terverifikasi
      </span>

      <form action={dispatch} className="mt-2">
        <button
          type="submit"
          disabled={pending || cooldown > 0}
          className="text-xs font-medium text-accent underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted disabled:no-underline"
        >
          {pending
            ? "Memproses…"
            : cooldown > 0
              ? `Kirim ulang dalam ${cooldown} detik`
              : "Kirim email verifikasi"}
        </button>
      </form>

      <div aria-live="polite">
        {state.error && (
          <p className="mt-1.5 text-xs text-red-400">{state.error}</p>
        )}
        {state.ok && state.message && (
          <p className="mt-1.5 text-xs text-muted">{state.message}</p>
        )}
      </div>
    </div>
  );
}

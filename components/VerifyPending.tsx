"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { Loader2, MailCheck } from "lucide-react";
import {
  resendPendingVerificationAction,
  type VerifyState,
} from "@/app/actions/verify-email";

type State = VerifyState & { until?: number };

export default function VerifyPending({
  email,
  retryAfter,
  notice,
  error,
}: {
  email: string;
  retryAfter: number;
  /** Pesan hasil pengiriman pertama (dari register). */
  notice?: string;
  error?: string;
}) {
  const [initialUntil] = useState(() => Date.now() + retryAfter * 1000);
  const [now, setNow] = useState(() => Date.now());

  // Hitung mundur di sisi klien dari waktu klien sendiri, jadi tidak terpengaruh selisih jam server.
  async function submit(prev: State): Promise<State> {
    const res = await resendPendingVerificationAction(prev);
    return {
      ...res,
      until: res.retryAfter ? Date.now() + res.retryAfter * 1000 : prev.until,
    };
  }

  const [state, dispatch, pending] = useActionState<State>(submit, {});

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const until = state.until ?? initialUntil;
  const cooldown = Math.max(0, Math.ceil((until - now) / 1000));

  // Pesan dari kirim ulang menggantikan pesan pengiriman pertama.
  const touched = Boolean(state.ok || state.error);
  const shownError = touched ? state.error : error;
  const shownNotice = touched ? (state.ok ? state.message : undefined) : notice;

  return (
    <div className="text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
        <MailCheck className="size-6" aria-hidden />
      </div>

      <h1 className="mt-4 text-xl font-semibold">Cek email kamu</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Satu langkah lagi. Kami mengirim link verifikasi ke{" "}
        <span className="break-all font-medium text-fg">{email}</span>.
      </p>

      <ol className="mx-auto mt-5 max-w-xs space-y-2 text-left text-sm text-muted">
        <li className="flex gap-3">
          <span className="font-mono text-xs text-accent">01</span>
          Buka email dari NetworkLab (cek folder spam kalau tidak ada).
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-accent">02</span>
          Klik link verifikasi di dalamnya.
        </li>
        <li className="flex gap-3">
          <span className="font-mono text-xs text-accent">03</span>
          Kembali ke sini dan masuk dengan akunmu.
        </li>
      </ol>

      <form action={dispatch} className="mt-6">
        <button
          type="submit"
          disabled={pending || cooldown > 0}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {pending
            ? "Memproses…"
            : cooldown > 0
              ? `Kirim ulang dalam ${cooldown} detik`
              : "Kirim ulang email verifikasi"}
        </button>
      </form>

      <div aria-live="polite" className="min-h-5">
        {shownError && (
          <p className="mt-3 text-sm text-red-400">{shownError}</p>
        )}
        {shownNotice && (
          <p className="mt-3 text-sm text-muted">{shownNotice}</p>
        )}
      </div>

      <p className="mt-4 text-sm text-muted">
        Sudah verifikasi?{" "}
        <a href="/login" className="font-medium text-accent hover:underline">
          Masuk
        </a>
      </p>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Check, CircleCheck } from "lucide-react";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Tombol "Tandai selesai" untuk satu bab. `action` adalah server action yang sudah
 * di-bind ke courseId dan slug, jadi komponen ini tidak perlu tahu route-nya.
 */
export default function LessonDoneButton({
  done,
  action,
}: {
  done: boolean;
  action: () => Promise<Result>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="mt-10 flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm font-medium text-violet-300">
        <CircleCheck className="size-5 shrink-0" /> Bab ini sudah kamu
        selesaikan
      </div>
    );
  }

  return (
    <div className="mt-10">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const res = await action();
            if (!res.ok) setError(res.error);
          });
        }}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-500/60 bg-violet-500/10 px-4 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20 disabled:opacity-60 sm:w-auto sm:min-w-48"
      >
        <Check className="size-4" /> {pending ? "Menyimpan…" : "Tandai selesai"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

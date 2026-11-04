"use client";

import { useState, useTransition } from "react";
import { submitQuizAction } from "@/app/actions/learning";

/**
 * Pencatatan skor manual (0-100).
 * Sementara dipakai karena belum ada mesin quiz; kalau nanti ada, panggil submitQuizAction()
 * dari hasil pengerjaan quiz dan komponen ini bisa dihapus.
 */
export default function QuizScoreForm({
  quizId,
  minutes,
  taken,
}: {
  quizId: string;
  minutes: number;
  taken: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const raw = String(new FormData(form).get("score") ?? "").trim();
    const score = Number(raw);
    if (!raw || !Number.isFinite(score) || score < 0 || score > 100) {
      setError("Isi skor 0 sampai 100.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitQuizAction(quizId, score, minutes);
      if (!result.ok) setError(result.error);
      else form.reset();
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input
        name="score"
        type="number"
        min={0}
        max={100}
        inputMode="numeric"
        placeholder="Skor"
        aria-label="Skor quiz"
        className="w-20 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : taken ? "Catat ulang" : "Catat skor"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-rose-300">
          {error}
        </span>
      )}
    </form>
  );
}

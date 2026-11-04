"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setCourseProgressAction } from "@/app/actions/learning";

/** Tombol di kartu materi: tandai bab berikutnya selesai. Progres, streak, dan aktivitas ikut terbarui. */
export default function CourseActions({
  courseId,
  lessons,
  progress,
}: {
  courseId: string;
  lessons: number;
  progress: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (progress >= 100) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-emerald-300">
        <Check className="size-3.5" /> Semua bab selesai
      </p>
    );
  }

  const doneLessons = Math.round((progress * lessons) / 100);
  const nextLesson = Math.min(lessons, doneLessons + 1);
  const nextProgress = Math.min(100, Math.round((nextLesson * 100) / lessons));

  function complete() {
    setError(null);
    startTransition(async () => {
      const result = await setCourseProgressAction(courseId, nextProgress);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted">
        {doneLessons}/{lessons} bab selesai
      </span>
      <button
        type="button"
        onClick={complete}
        disabled={pending}
        className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Menyimpan…" : `Selesaikan bab ${nextLesson}`}
      </button>
      {error && (
        <span role="alert" className="sr-only">
          {error}
        </span>
      )}
    </div>
  );
}

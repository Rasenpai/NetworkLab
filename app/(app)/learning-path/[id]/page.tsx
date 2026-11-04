import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, CircleCheck, Clock, Lock } from "lucide-react";
import {
  chapterHref,
  chaptersDone,
  chapterTitles,
  getModuleById,
  MODULE_BASE,
} from "@/lib/catalog";
import { formatDuration } from "@/lib/data";
import { getMyLearning } from "@/lib/learning";
import {
  Badge,
  Card,
  LevelBadge,
  ProgressBar,
  ProgressRing,
  VendorBadge,
} from "@/components/ui";
import { completeChapter } from "./actions";

export const metadata: Metadata = { title: "Modul Pembelajaran" };

export default async function ModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const mod = getModuleById(id);
  if (!mod) notFound();

  const data = await getMyLearning();
  if (!data) return null;

  const progress = data.progressById[id] ?? 0;
  const done = chaptersDone(mod, progress);
  const titles = chapterTitles(mod);
  const finished = done >= mod.lessons;

  // Tombol utama: lanjut ke bab berikutnya, atau ulangi dari bab 1 kalau sudah selesai.
  const ctaChapter = finished ? 1 : done + 1;
  const ctaLabel = finished
    ? "Ulangi dari Bab 1"
    : done === 0
      ? "Mulai belajar"
      : `Lanjut ke Bab ${ctaChapter}`;

  return (
    <>
      <Link
        href={MODULE_BASE}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Kembali ke Learning Path
      </Link>

      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProgressRing value={progress} size={104} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {mod.vendor === "Umum" ? (
                <Badge>Umum</Badge>
              ) : (
                <VendorBadge vendor={mod.vendor} />
              )}
              <LevelBadge level={mod.level} />
            </div>
            <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
              {mod.title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              {mod.description}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-3.5" /> {mod.lessons} bab
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="size-3.5" /> {formatDuration(mod.minutes)}
              </span>
              <span>
                {done} dari {mod.lessons} bab selesai
              </span>
            </div>
            <ProgressBar value={progress} className="mt-3 max-w-md" />
            <Link
              href={chapterHref(mod.id, ctaChapter)}
              className="mt-4 inline-flex rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      </Card>

      {finished && (
        <Card className="mb-6 border-emerald-400/30 p-4 text-sm text-emerald-300">
          Modul ini sudah selesai. Kamu bisa membuka bab mana pun untuk
          mengulang.
        </Card>
      )}

      <Card className="p-3 sm:p-4">
        <h2 className="px-2 pb-3 pt-1 text-base font-semibold">Daftar bab</h2>
        <ol className="space-y-2">
          {titles.map((title, i) => {
            const number = i + 1;
            const isDone = number <= done;
            const isNext = number === done + 1;
            const unlocked = isDone || isNext;
            return (
              <li
                key={number}
                className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                  isNext
                    ? "border-accent/50 bg-accent/5"
                    : "border-line bg-bg/50"
                }`}
              >
                {isDone ? (
                  <CircleCheck className="size-5 shrink-0 text-emerald-400" />
                ) : isNext ? (
                  <span className="size-5 shrink-0 rounded-full border-2 border-accent" />
                ) : (
                  <Lock className="size-5 shrink-0 text-muted/60" />
                )}
                <div className="min-w-0 flex-1">
                  {unlocked ? (
                    <Link
                      href={chapterHref(mod.id, number)}
                      className="text-sm font-medium transition-colors hover:text-accent"
                    >
                      Bab {number}: {title}
                    </Link>
                  ) : (
                    <p className="text-sm font-medium text-muted">
                      Bab {number}: {title}
                    </p>
                  )}
                </div>
                {isDone && (
                  <Link
                    href={chapterHref(mod.id, number)}
                    className="shrink-0 text-xs text-muted transition-colors hover:text-fg"
                  >
                    Buka lagi
                  </Link>
                )}
                {isNext && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={chapterHref(mod.id, number)}
                      className="rounded-full border border-accent bg-accent px-4 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                    >
                      Belajar
                    </Link>
                    <form action={completeChapter}>
                      <input type="hidden" name="id" value={mod.id} />
                      <input type="hidden" name="chapter" value={number} />
                      <button
                        type="submit"
                        className="rounded-full border border-line px-4 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
                      >
                        Tandai selesai
                      </button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleCheck } from "lucide-react";
import {
  chapterContent,
  chapterHref,
  chaptersDone,
  getModuleById,
  moduleHref,
} from "@/lib/catalog";
import { getMyLearning } from "@/lib/learning";
import { Card, ProgressBar } from "@/components/ui";
import { completeChapter } from "../actions";
import { ChapterBody } from "./chapter-body";

type Params = { id: string; chapter: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id, chapter } = await params;
  const mod = getModuleById(id);
  return { title: mod ? `Bab ${chapter} · ${mod.title}` : "Belajar" };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id, chapter } = await params;
  const mod = getModuleById(id);
  if (!mod) notFound();

  const number = Number(chapter);
  if (!Number.isInteger(number) || number < 1 || number > mod.lessons) {
    notFound();
  }

  const data = await getMyLearning();
  if (!data) return null;

  const progress = data.progressById[id] ?? 0;
  const done = chaptersDone(mod, progress);

  // Bab yang belum terbuka: kembali ke halaman modul.
  if (number > done + 1) redirect(moduleHref(id));

  const content = chapterContent(mod, number);
  if (!content) notFound();

  const isDone = number <= done;
  const isLast = number === mod.lessons;

  return (
    <>
      <Link
        href={moduleHref(id)}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> {mod.title}
      </Link>

      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>
              Bab {number} dari {mod.lessons}
            </span>
            <span>{done} bab selesai</span>
          </div>
          <ProgressBar value={progress} />
          <h1 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">
            {content.title}
          </h1>
        </div>

        <Card className="p-5 sm:p-6">
          <ChapterBody blocks={content.blocks} />
        </Card>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {number > 1 ? (
            <Link
              href={chapterHref(id, number - 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-fg"
            >
              <ArrowLeft className="size-4" /> Bab sebelumnya
            </Link>
          ) : (
            <span />
          )}

          {isDone ? (
            isLast ? (
              <Link
                href={moduleHref(id)}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                <CircleCheck className="size-4" /> Kembali ke modul
              </Link>
            ) : (
              <Link
                href={chapterHref(id, number + 1)}
                className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Bab berikutnya <ArrowRight className="size-4" />
              </Link>
            )
          ) : (
            <form action={completeChapter}>
              <input type="hidden" name="id" value={mod.id} />
              <input type="hidden" name="chapter" value={number} />
              <input type="hidden" name="next" value="continue" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {isLast ? "Selesaikan modul" : "Selesai & lanjut"}
                <ArrowRight className="size-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

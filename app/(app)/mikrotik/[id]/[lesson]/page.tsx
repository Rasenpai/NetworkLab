import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { courses, formatDuration } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getCompletedLessons } from "@/lib/learning";
import { getCourseOutline, getLesson } from "@/lib/mikrotik-content";
import LessonMarkdown from "@/components/LessonMarkdown";
import LessonDoneButton from "@/components/LessonDoneButton";
import { completeLessonAction } from "./actions";

type Props = { params: Promise<{ id: string; lesson: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, lesson } = await params;
  const data = getLesson(id, lesson);
  return {
    title: data ? `${data.lesson.title} · MikroTik` : "Materi MikroTik",
  };
}

const btn =
  "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition sm:flex-none sm:min-w-40";
const btnGhost = `${btn} border border-current/15 hover:border-violet-500/60 hover:bg-violet-500/10`;
const btnPrimary = `${btn} bg-violet-600 text-white hover:bg-violet-500`;

export default async function MikroTikLessonPage({ params }: Props) {
  const { id, lesson: slug } = await params;
  const course = courses.find((c) => c.vendor === "MikroTik" && c.id === id);
  const data = course ? getLesson(id, slug) : null;
  if (!course || !data) notFound();

  const { lesson, prev, next, total } = data;

  const user = await getCurrentUser();
  const done = user ? getCompletedLessons(user.id, id) : new Set<string>();
  const isDone = done.has(slug);
  const slugs = getCourseOutline(id).slugs;

  return (
    <article className="mx-auto w-full min-w-0 max-w-3xl">
      <Link
        href={`/mikrotik/${id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm opacity-60 transition hover:text-violet-300 hover:opacity-100"
      >
        <ArrowLeft className="size-4 shrink-0" />
        <span className="truncate">{course.title}</span>
      </Link>

      <header className="mb-6 sm:mb-8">
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="rounded-full bg-violet-500/15 px-2.5 py-1 font-medium text-violet-300">
            Bab {lesson.number} dari {total}
          </span>
          <span className="flex items-center gap-1.5 opacity-60">
            <Clock className="size-3.5" /> {formatDuration(lesson.minutes)}
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
          {lesson.title}
        </h1>
        {lesson.summary && (
          <p className="mt-2 text-sm opacity-60 sm:text-base">
            {lesson.summary}
          </p>
        )}

        {/* Satu segmen per bab: penuh = sudah selesai, setengah = bab yang sedang dibuka. */}
        <div className="mt-4 flex gap-1.5 sm:mt-5" aria-hidden>
          {slugs.map((s, i) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full sm:h-1.5 ${
                done.has(s)
                  ? "bg-violet-500"
                  : i === lesson.number - 1
                    ? "bg-violet-500/40"
                    : "bg-current/10"
              }`}
            />
          ))}
        </div>
      </header>

      <LessonMarkdown>{lesson.body}</LessonMarkdown>

      {user && (
        <LessonDoneButton
          done={isDone}
          action={completeLessonAction.bind(null, id, slug)}
        />
      )}

      <nav
        aria-label="Navigasi bab"
        className="mt-6 flex items-center justify-between gap-3 border-t border-current/10 pt-5"
      >
        {prev ? (
          <Link
            href={`/mikrotik/${id}/${prev.slug}`}
            className={btnGhost}
            title={prev.title}
          >
            <ArrowLeft className="size-4" /> Sebelumnya
          </Link>
        ) : (
          <span className="hidden flex-1 sm:block" />
        )}
        {next ? (
          <Link
            href={`/mikrotik/${id}/${next.slug}`}
            className={btnPrimary}
            title={next.title}
          >
            Berikutnya <ArrowRight className="size-4" />
          </Link>
        ) : (
          <Link href={`/mikrotik/${id}`} className={btnPrimary}>
            <Check className="size-4" /> Selesai
          </Link>
        )}
      </nav>
    </article>
  );
}

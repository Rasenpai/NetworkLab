import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Check, ChevronRight, Clock } from "lucide-react";
import { courses, formatDuration } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getCompletedLessons } from "@/lib/learning";
import { getLessons } from "@/lib/mikrotik-content";
import { PageHeader } from "@/components/ui";

type Props = { params: Promise<{ id: string }> };

function findCourse(id: string) {
  return courses.find((c) => c.vendor === "MikroTik" && c.id === id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = findCourse(id);
  return { title: course ? `${course.title} · MikroTik` : "Materi MikroTik" };
}

export default async function MikroTikCoursePage({ params }: Props) {
  const { id } = await params;
  const course = findCourse(id);
  if (!course) notFound();

  const lessons = getLessons(id);
  const user = await getCurrentUser();
  const done = user ? getCompletedLessons(user.id, id) : new Set<string>();

  const finished = lessons.filter((l) => done.has(l.slug)).length;
  const percent = lessons.length
    ? Math.round((finished / lessons.length) * 100)
    : 0;
  // Durasi dan jumlah bab dari file .md yang ada, bukan dari angka di lib/data.ts.
  const totalMinutes = lessons.reduce((sum, l) => sum + l.minutes, 0);

  return (
    <>
      <Link
        href="/mikrotik"
        className="mb-5 inline-flex items-center gap-1.5 text-sm opacity-60 transition hover:text-violet-300 hover:opacity-100"
      >
        <ArrowLeft className="size-4" /> MikroTik Academy
      </Link>

      <PageHeader title={course.title} description={course.description} />

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm opacity-70">
        <span className="flex items-center gap-1.5">
          <BookOpen className="size-4" /> {lessons.length} bab
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> {formatDuration(totalMinutes)}
        </span>
        <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-medium text-violet-300">
          {course.level}
        </span>
      </div>

      {lessons.length > 0 && (
        <div className="mb-6">
          <div className="mb-1.5 flex items-center justify-between text-xs opacity-70">
            <span>
              {finished} dari {lessons.length} bab selesai
            </span>
            <span className="font-medium text-violet-300">{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-current/10">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      {lessons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-current/20 p-10 text-center text-sm opacity-70">
          Belum ada bab. Tambahkan file{" "}
          <code className="text-violet-300">.md</code> di{" "}
          <code className="text-violet-300">content/mikrotik/{id}/</code>.
        </div>
      ) : (
        <ol className="space-y-3">
          {lessons.map((l) => {
            const isDone = done.has(l.slug);
            return (
              <li key={l.slug}>
                <Link
                  href={`/mikrotik/${id}/${l.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-current/10 bg-current/[0.03] p-4 transition hover:border-violet-500/60 hover:bg-violet-500/[0.06]"
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-semibold ${
                      isDone
                        ? "bg-violet-500 text-white"
                        : "bg-violet-500/15 text-violet-300"
                    }`}
                  >
                    {isDone ? (
                      <Check className="size-5" aria-label="Selesai" />
                    ) : (
                      l.number
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium transition-colors group-hover:text-violet-300">
                      {l.title}
                    </span>
                    {l.summary && (
                      <span className="mt-0.5 line-clamp-2 block text-sm opacity-60">
                        {l.summary}
                      </span>
                    )}
                  </span>
                  <span className="hidden shrink-0 items-center gap-1.5 text-xs opacity-60 sm:flex">
                    <Clock className="size-3.5" /> {formatDuration(l.minutes)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 opacity-40 transition group-hover:translate-x-0.5 group-hover:text-violet-300 group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

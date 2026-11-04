import Link from "next/link";
import { BookOpen, CircleCheck, Clock, TrendingUp } from "lucide-react";
import {
  avgProgress,
  formatDuration,
  LEVELS,
  levelInfo,
  type Vendor,
} from "@/lib/data";
import { getMyLearning } from "@/lib/learning";
import CourseCatalog from "@/components/CourseCatalog";
import { PageHeader, StatCard } from "@/components/ui";

export default async function Academy({
  vendor,
  description,
  basePath,
}: {
  vendor: Vendor;
  description: string;
  /** Kalau diisi (mis. "/mikrotik"), setiap card menaut ke `${basePath}/${course.id}`. */
  basePath?: string;
}) {
  // Progres tiap materi diambil dari data milik user yang sedang login.
  const data = await getMyLearning();
  if (!data) return null;

  const list = data.courses.filter((c) => c.vendor === vendor);
  const done = list.filter((c) => c.progress === 100).length;

  return (
    <>
      <PageHeader title={`${vendor} Academy`} description={description} />
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Total Materi"
          value={`${list.length}`}
          hint="Beginner sampai Advanced"
        />
        <StatCard
          icon={CircleCheck}
          label="Materi Selesai"
          value={`${done}/${list.length}`}
        />
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Progres"
          value={`${avgProgress(list)}%`}
        />
      </div>

      {basePath ? (
        <div className="space-y-10">
          {LEVELS.map((level) => {
            const items = list.filter((c) => c.level === level);
            if (!items.length) return null;
            return (
              <section key={level}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="h-6 w-1 rounded-full bg-violet-500" />
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">
                      {level}
                    </h2>
                    <p className="text-sm opacity-60">{levelInfo[level]}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={`${basePath}/${c.id}`}
                      className="group flex flex-col rounded-2xl border border-current/10 bg-current/[0.03] p-4 transition sm:p-5 hover:-translate-y-0.5 hover:border-violet-500/60 hover:bg-violet-500/[0.06]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold leading-snug transition-colors group-hover:text-violet-300">
                          {c.title}
                        </h3>
                        {c.progress === 100 && (
                          <CircleCheck className="size-5 shrink-0 text-violet-400" />
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 flex-1 text-sm opacity-60">
                        {c.description}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-xs opacity-70">
                        <span className="flex items-center gap-1.5">
                          <BookOpen className="size-3.5" /> {c.lessons} bab
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />{" "}
                          {formatDuration(c.minutes)}
                        </span>
                        <span className="ml-auto font-medium text-violet-300">
                          {c.progress}%
                        </span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-current/10">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <CourseCatalog courses={list} />
      )}
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  BookOpen,
  CircleCheck,
  ClipboardCheck,
  Clock,
  FlaskConical,
  FolderKanban,
  Sparkles,
  Trophy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { avgProgress, formatDuration } from "@/lib/data";
import {
  Card,
  CourseCard,
  ProgressBar,
  ProgressRing,
  SectionTitle,
  StatCard,
  PageHeader,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import {
  getLearningData,
  getPracticeStats,
  type ActivityType,
} from "@/lib/learning";
import { seedDemoDataAction } from "@/app/actions/learning";

export const metadata: Metadata = { title: "Dashboard" };

const activityIcon: Record<ActivityType, LucideIcon> = {
  course: BookOpen,
  quiz: ClipboardCheck,
  lab: FlaskConical,
  portfolio: FolderKanban,
};

export default async function DashboardPage() {
  // Layout (app) sudah menjamin user login; di sini hanya mengambil id dan nama.
  const user = await getCurrentUser();
  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  // Semua angka di bawah berasal dari SQLite milik user ini.
  const { courses, quizzes, studyMinutes, weekly, recent, overall, isEmpty } =
    getLearningData(user.id);
  const practice = getPracticeStats(user.id);

  const done = courses.filter((c) => c.progress === 100).length;
  const attempted = quizzes.filter((q) => q.score !== null);
  const passed = attempted.filter((q) => (q.score ?? 0) >= q.passing).length;
  const avgScore = attempted.length
    ? Math.round(
        attempted.reduce((s, q) => s + (q.score ?? 0), 0) / attempted.length,
      )
    : 0;

  const mikrotik = avgProgress(courses.filter((c) => c.vendor === "MikroTik"));
  const cisco = avgProgress(courses.filter((c) => c.vendor === "Cisco"));

  const inProgress = courses
    .filter((c) => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 4);

  const maxMinutes = Math.max(1, ...weekly.map((d) => d.minutes));
  const totalWeek = weekly.reduce((s, d) => s + d.minutes, 0);

  return (
    <>
      <PageHeader
        title={`Selamat datang kembali, ${firstName}`}
        description="Lanjutkan perjalanan belajarmu di MikroTik dan Cisco. Konsisten sedikit setiap hari lebih baik daripada belajar maraton."
      />

      {isEmpty && (
        <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="font-semibold">Akunmu masih baru</p>
              <p className="mt-0.5 text-sm text-muted">
                Progres, streak, dan skor quiz akan muncul di sini setelah kamu
                mulai belajar.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/learning-path"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Mulai belajar
            </Link>
            
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={CircleCheck}
          label="Materi Selesai"
          value={`${done}/${courses.length}`}
          hint="Dari seluruh Academy"
        />
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Progres"
          value={`${overall}%`}
          hint="MikroTik + Cisco"
        />
        <StatCard
          icon={Clock}
          label="Waktu Belajar"
          value={formatDuration(studyMinutes)}
          hint="Akumulasi sejak awal"
        />
        <StatCard
          icon={Trophy}
          label="Quiz Lulus"
          value={`${passed}/${quizzes.length}`}
          hint={
            attempted.length
              ? `Rata-rata skor ${avgScore}`
              : "Belum ada quiz dikerjakan"
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section>
            <SectionTitle
              title="Lanjutkan Belajar"
              hint={`${inProgress.length} materi aktif`}
            />
            {inProgress.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {inProgress.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            ) : (
              <Card className="p-5 text-sm text-muted">
                Belum ada materi yang sedang dipelajari.{" "}
                <Link
                  href="/learning-path"
                  className="font-medium text-accent hover:underline"
                >
                  Pilih materi pertamamu
                </Link>
                .
              </Card>
            )}
          </section>

          <Card className="p-5">
            <SectionTitle
              title="Aktivitas Minggu Ini"
              hint={`${formatDuration(totalWeek)} dalam 7 hari terakhir`}
            />
            {/* Kolom harus meregang setinggi h-40 (tanpa items-end di induk) supaya
                tinggi persentase batang punya acuan. */}
            <div className="flex h-40 gap-2 sm:gap-4">
              {weekly.map((d, i) => {
                const today = i === weekly.length - 1;
                return (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex min-h-0 w-full flex-1 items-end">
                      <div
                        title={`${d.minutes} menit`}
                        className={`w-full rounded-t-lg transition-colors ${
                          today
                            ? "bg-accent"
                            : "bg-accent/35 hover:bg-accent/60"
                        }`}
                        style={{
                          height: `${d.minutes > 0 ? Math.max(4, (d.minutes / maxMinutes) * 100) : 2}%`,
                        }}
                      />
                    </div>
                    <span
                      className={`text-xs ${today ? "font-medium text-fg" : "text-muted"}`}
                    >
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle title="Progres Belajar" />
            <div className="flex justify-center py-2">
              <ProgressRing value={overall} />
            </div>
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>MikroTik</span>
                  <span className="text-muted">{mikrotik}%</span>
                </div>
                <ProgressBar value={mikrotik} />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>Cisco</span>
                  <span className="text-muted">{cisco}%</span>
                </div>
                <ProgressBar value={cisco} />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle title="Latihan Praktik" />
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Troubleshooting</dt>
                <dd className="font-medium">
                  {practice.tsSolved}/{practice.tsTotal} · skor{" "}
                  {practice.tsScore}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Virtual Lab selesai</dt>
                <dd className="font-medium">{practice.labsDone}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Project portofolio</dt>
                <dd className="font-medium">{practice.portfolio}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5">
            <SectionTitle title="Aktivitas Terakhir" />
            {recent.length ? (
              <ul className="space-y-4">
                {recent.map((a) => {
                  const Icon = activityIcon[a.type];
                  return (
                    <li key={a.id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm leading-snug">{a.text}</p>
                        <p className="mt-0.5 text-xs text-muted">{a.time}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">Belum ada aktivitas.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

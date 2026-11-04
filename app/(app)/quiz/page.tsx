import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CircleCheck,
  ClipboardCheck,
  Clock,
  Target,
} from "lucide-react";
import type { Quiz, Vendor } from "@/lib/data";
import { getMyLearning } from "@/lib/learning";
import {
  Badge,
  Card,
  LevelBadge,
  PageHeader,
  ProgressBar,
  SectionTitle,
  StatCard,
  VendorBadge,
} from "@/components/ui";

export const metadata: Metadata = { title: "Quiz & Exam" };

function QuizCard({ quiz }: { quiz: Quiz }) {
  const taken = quiz.score !== null;
  const pass = taken && (quiz.score ?? 0) >= quiz.passing;
  return (
    <Link
      href={`/quiz/${quiz.id}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Card className="flex h-full flex-col p-5 transition-colors group-hover:border-accent/40">
        <div className="flex flex-wrap items-center gap-2">
          <VendorBadge vendor={quiz.vendor} />
          <LevelBadge level={quiz.level} />
        </div>
        <h4 className="mt-3 font-semibold leading-snug">{quiz.title}</h4>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <ClipboardCheck className="size-3.5" /> {quiz.questions} soal
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5" /> {quiz.minutes} mnt
          </span>
          <span className="flex items-center gap-1.5">
            <Target className="size-3.5" /> Lulus {quiz.passing}
          </span>
        </div>
        <div className="mt-auto pt-4">
          {taken ? (
            <>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <Badge
                  className={
                    pass
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                  }
                >
                  {pass ? "Lulus" : "Perlu diulang"}
                </Badge>
                <span className="font-medium">Skor terbaik {quiz.score}</span>
              </div>
              <ProgressBar value={quiz.score ?? 0} />
            </>
          ) : (
            <Badge>Belum dikerjakan</Badge>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs font-medium text-accent">
            <span>{taken ? "Kerjakan ulang" : "Mulai kerjakan"}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default async function QuizPage() {
  // Skor diambil dari hasil milik user yang sedang login.
  const data = await getMyLearning();
  if (!data) return null;
  const quizzes = data.quizzes;

  const attempted = quizzes.filter((q) => q.score !== null);
  const passed = attempted.filter((q) => (q.score ?? 0) >= q.passing).length;
  const avg = attempted.length
    ? Math.round(
        attempted.reduce((s, q) => s + (q.score ?? 0), 0) / attempted.length,
      )
    : 0;

  const sections: {
    kind: Quiz["kind"];
    /** Jika diisi, hanya quiz milik vendor ini yang ditampilkan di bagian tersebut. */
    vendor?: Vendor;
    title: string;
    hint: string;
    image?: { src: string; alt: string };
  }[] = [
    { kind: "Quiz", title: "Quiz", hint: "Latihan singkat per topik" },
    { kind: "Exam", title: "Exam", hint: "Ujian lengkap per level" },
    {
      kind: "Sertifikasi",
      vendor: "MikroTik",
      title: "Sertifikasi MikroTik",
      hint: "Simulasi dengan format ujian resmi",
      image: {
        src: "https://cdn.mikrotik.com/web-assets/website/assets/images/MT_TrainingScheme.svg",
        alt: "Skema jalur pelatihan dan sertifikasi MikroTik",
      },
    },
    {
      kind: "Sertifikasi",
      vendor: "Cisco",
      title: "Sertifikasi Cisco",
      hint: "Simulasi CCNA",
    },
  ];

  return (
    <>
      <PageHeader
        title="Quiz & Exam"
        description="Uji pemahamanmu dengan quiz per topik, ujian lengkap untuk MikroTik dan Cisco, serta simulasi sertifikasi MikroTik dan CCNA."
      />

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={ClipboardCheck}
          label="Sudah Dikerjakan"
          value={`${attempted.length}/${quizzes.length}`}
        />
        <StatCard
          icon={CircleCheck}
          label="Lulus"
          value={`${passed}`}
          hint="Skor di atas batas lulus"
        />
        <StatCard icon={Target} label="Rata-rata Skor" value={`${avg}`} />
      </div>

      <div className="space-y-8">
        {sections.map(({ kind, vendor, title, hint, image }) => {
          const list = quizzes.filter(
            (q) => q.kind === kind && (!vendor || q.vendor === vendor),
          );
          if (list.length === 0) return null;
          return (
            <section key={`${kind}-${vendor ?? "all"}`}>
              <SectionTitle title={`${title} (${list.length})`} hint={hint} />
              {image && (
                // SVG-nya hitam di atas transparan, jadi dibalik (invert) agar putih di atas background halaman.
                // Tanpa bg/border: kotak dibiarkan transparan.
                <figure className="mb-4 overflow-hidden p-4 sm:p-6">
                  {/* <img> biasa: SVG eksternal tidak perlu dioptimasi next/image (dan tidak butuh remotePatterns). */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    className="mx-auto h-auto w-full max-w-4xl opacity-90 invert"
                  />
                  <figcaption className="mt-3 text-center text-xs text-muted">
                    Sumber:{" "}
                    <a
                      href="https://mikrotik.com/training/about"
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2 transition-colors hover:text-fg"
                    >
                      mikrotik.com/training
                    </a>
                  </figcaption>
                </figure>
              )}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((q) => (
                  <QuizCard key={q.id} quiz={q} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { quizzes } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { getQuizAttempts, getQuizSession } from "@/lib/learning";
import { getQuizBank, toPublic } from "@/lib/quiz-bank";
import { Card, LevelBadge, PageHeader, VendorBadge } from "@/components/ui";
import QuizRunner from "@/components/QuizRunner";

export const metadata: Metadata = { title: "Kerjakan Quiz" };

export default async function QuizDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = quizzes.find((q) => String(q.id) === id);
  if (!quiz) notFound();

  const user = await getCurrentUser();
  if (!user) return null;

  const bank = getQuizBank(id);
  const attempts = getQuizAttempts(user.id, id);
  const best = attempts.length
    ? Math.max(...attempts.map((a) => a.score))
    : null;

  return (
    <>
      <Link
        href="/quiz"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" /> Kembali ke Quiz &amp; Exam
      </Link>

      <PageHeader
        title={quiz.title}
        description={`${quiz.kind} · ${quiz.vendor}`}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <VendorBadge vendor={quiz.vendor} />
        <LevelBadge level={quiz.level} />
      </div>

      {!bank ? (
        <Card className="p-6 text-sm text-muted">
          Soal untuk {quiz.kind.toLowerCase()} ini belum tersedia.
        </Card>
      ) : (
        <QuizRunner
          quizId={id}
          title={quiz.title}
          kind={quiz.kind}
          minutes={quiz.minutes}
          passing={quiz.passing}
          questions={toPublic(bank)}
          attempts={attempts}
          best={best}
          resume={getQuizSession(user.id, id)}
        />
      )}
    </>
  );
}

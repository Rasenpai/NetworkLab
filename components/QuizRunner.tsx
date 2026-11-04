"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CircleCheck, CircleX, Clock, RotateCcw } from "lucide-react";
import Swal from "sweetalert2";
import {
  discardQuizSessionAction,
  saveQuizProgressAction,
  startQuizSessionAction,
  submitQuizSessionAction,
} from "@/app/actions/learning";
import type { QuizAttemptRow, QuizResult, QuizSession } from "@/lib/learning";

type PublicQuestion = { q: string; options: string[]; multi: boolean };
type Phase = "intro" | "running" | "result";

const card = "rounded-xl border border-line bg-white/[0.02] p-5 sm:p-6";
const btn =
  "rounded-lg border border-line px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 disabled:opacity-50";
const btnPrimary =
  "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50";

/** Dialog konfirmasi bertema gelap (SweetAlert2). Mengembalikan true kalau user menekan tombol konfirmasi. */
async function confirmDialog(opts: {
  title: string;
  text: string;
  confirmText: string;
  cancelText?: string;
  icon?: "warning" | "question";
  danger?: boolean;
}) {
  const res = await Swal.fire({
    title: opts.title,
    text: opts.text,
    icon: opts.icon ?? "warning",
    showCancelButton: true,
    confirmButtonText: opts.confirmText,
    cancelButtonText: opts.cancelText ?? "Kembali",
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: {
      popup: "!rounded-xl !border !border-line !bg-bg !text-white",
      title: "!text-lg !font-semibold !text-white",
      htmlContainer: "!text-sm !text-muted",
      actions: "!gap-2",
      confirmButton: opts.danger
        ? "rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        : "rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90",
      cancelButton:
        "rounded-lg border border-line px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5",
    },
  });
  return res.isConfirmed;
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export default function QuizRunner({
  quizId,
  title,
  kind,
  minutes,
  passing,
  questions,
  attempts,
  best,
  resume,
}: {
  quizId: string;
  title: string;
  kind: string;
  minutes: number;
  passing: number;
  questions: PublicQuestion[];
  attempts: QuizAttemptRow[];
  best: number | null;
  resume: QuizSession | null;
}) {
  const [phase, setPhase] = useState<Phase>(resume ? "running" : "intro");
  const [answers, setAnswers] = useState<Record<string, number[]>>(
    resume?.answers ?? {},
  );
  const [current, setCurrent] = useState(resume?.current ?? 0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [left, setLeft] = useState(
    resume ? Math.max(0, resume.remainingMs) : minutes * 60_000,
  );
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submitting = useRef(false);

  // Sesi yang dilanjutkan: pasang batas waktu dari sisa waktu di server (setelah mount).
  useEffect(() => {
    if (resume) setDeadline(Date.now() + Math.max(0, resume.remainingMs));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = useCallback(() => {
    if (submitting.current) return;
    submitting.current = true;
    startTransition(async () => {
      const res = await submitQuizSessionAction(quizId, answersRef.current);
      if (res.ok) {
        setResult(res.data);
        setPhase("result");
        setError(null);
      } else {
        submitting.current = false;
        setError(res.error);
      }
    });
  }, [quizId]);

  // Timer: waktu habis = otomatis dikumpulkan.
  useEffect(() => {
    if (phase !== "running" || deadline === null) return;
    const tick = () => {
      const remaining = deadline - Date.now();
      setLeft(remaining);
      if (remaining <= 0) finish();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [phase, deadline, finish]);

  function start() {
    setError(null);
    startTransition(async () => {
      const res = await startQuizSessionAction(quizId);
      if (!res.ok) return setError(res.error);
      submitting.current = false;
      setAnswers(res.data.answers);
      setCurrent(res.data.current);
      setDeadline(Date.now() + Math.max(0, res.data.remainingMs));
      setPhase("running");
    });
  }

  function pick(qi: number, oi: number) {
    const prev = answersRef.current[String(qi)] ?? [];
    const sel = questions[qi].multi
      ? prev.includes(oi)
        ? prev.filter((n) => n !== oi)
        : [...prev, oi].sort((a, b) => a - b)
      : [oi];
    const next = { ...answersRef.current };
    if (sel.length > 0) next[String(qi)] = sel;
    else delete next[String(qi)];
    setAnswers(next);
    void saveQuizProgressAction(quizId, next, current);
  }

  function go(to: number) {
    const clamped = Math.min(questions.length - 1, Math.max(0, to));
    setCurrent(clamped);
    void saveQuizProgressAction(quizId, answersRef.current, clamped);
  }

  async function abandon() {
    const ok = await confirmDialog({
      title: "Batalkan pengerjaan?",
      text: "Jawabanmu tidak akan dinilai dan waktu pengerjaan direset.",
      confirmText: "Ya, batalkan",
      danger: true,
    });
    if (!ok) return;
    startTransition(async () => {
      await discardQuizSessionAction(quizId);
      setAnswers({});
      setCurrent(0);
      setDeadline(null);
      setPhase("intro");
    });
  }

  const answered = Object.values(answers).filter((a) => a.length > 0).length;
  const hasMulti = questions.some((x) => x.multi);

  /* ---------- Hasil ---------- */
  if (phase === "result" && result) {
    return (
      <div className="space-y-6">
        <div className={card}>
          <div className="flex flex-wrap items-center gap-3">
            {result.passed ? (
              <CircleCheck className="size-8 text-emerald-300" />
            ) : (
              <CircleX className="size-8 text-rose-300" />
            )}
            <div>
              <p className="text-2xl font-semibold">Skor {result.score}</p>
              <p className="text-sm text-muted">
                {result.correct} dari {result.total} benar · batas lulus{" "}
                {result.passing} · {result.passed ? "Lulus" : "Perlu diulang"}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                setResult(null);
                setAnswers({});
                setCurrent(0);
                setDeadline(null);
                setPhase("intro");
              }}
            >
              <RotateCcw className="mr-1.5 inline size-4" />
              Ulangi
            </button>
            <a href="/quiz" className={btn}>
              Kembali ke daftar
            </a>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Pembahasan</h3>
          {questions.map((q, i) => {
            const r = result.review[i];
            const ok =
              r.chosen.length === r.answer.length &&
              r.chosen.every((n, j) => n === r.answer[j]);
            return (
              <div key={i} className={card}>
                <p className="text-sm font-medium">
                  {i + 1}. {q.q}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {q.options.map((o, oi) => {
                    const isAnswer = r.answer.includes(oi);
                    const isChosen = r.chosen.includes(oi);
                    const cls = isAnswer
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : isChosen
                        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
                        : "border-line text-muted";
                    return (
                      <li
                        key={oi}
                        className={`rounded-lg border px-3 py-2 ${cls}`}
                      >
                        {o}
                        {isAnswer && " ✓"}
                        {isChosen && !isAnswer && " (jawabanmu)"}
                      </li>
                    );
                  })}
                </ul>
                {r.chosen.length === 0 && (
                  <p className="mt-2 text-xs text-rose-300">Tidak dijawab.</p>
                )}
                {r.explain && (
                  <p
                    className={`mt-3 text-xs ${ok ? "text-emerald-300/80" : "text-muted"}`}
                  >
                    {r.explain}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- Intro ---------- */
  if (phase === "intro") {
    return (
      <div className="space-y-6">
        <div className={card}>
          <h3 className="font-semibold">Sebelum mulai</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              {questions.length} soal
              {hasMulti
                ? ". Sebagian soal punya lebih dari satu jawaban benar; soal tersebut dinilai benar hanya jika semua pilihan tepat."
                : " pilihan ganda."}
            </li>
            <li>
              Waktu {minutes} menit. Timer terus berjalan walau halaman ditutup.
            </li>
            <li>Batas lulus skor {passing}.</li>
            <li>
              Jawabanmu tersimpan otomatis, jadi bisa dilanjutkan kalau
              terputus.
            </li>
          </ul>
          {best !== null && (
            <p className="mt-3 text-sm">Skor terbaikmu: {best}</p>
          )}
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={start}
              disabled={pending}
              className={btnPrimary}
            >
              {pending ? "Menyiapkan…" : `Mulai ${kind}`}
            </button>
            {error && (
              <span role="alert" className="text-xs text-rose-300">
                {error}
              </span>
            )}
          </div>
        </div>

        {attempts.length > 0 && (
          <div className={card}>
            <h3 className="text-sm font-semibold">Riwayat percobaan</h3>
            <ul className="mt-3 divide-y divide-line text-sm">
              {attempts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-muted">{a.time}</span>
                  <span>
                    {a.correct !== null && a.total !== null
                      ? `${a.correct}/${a.total} benar · `
                      : ""}
                    skor <strong>{a.score}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Mengerjakan ---------- */
  const q = questions[current];
  const low = left < 60_000;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Soal {current + 1} dari {questions.length} · terjawab {answered}
        </p>
        <span
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium tabular-nums ${
            low ? "border-rose-400/30 text-rose-300" : "border-line"
          }`}
          aria-label="Sisa waktu"
        >
          <Clock className="size-4" /> {fmt(left)}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(answered / questions.length) * 100}%` }}
        />
      </div>

      <div className={card}>
        <p className="font-medium leading-snug">{q.q}</p>
        {q.multi && (
          <p className="mt-1 text-xs text-accent">
            Select all that apply · pilih semua jawaban yang benar
          </p>
        )}
        <div className="mt-4 space-y-2">
          {q.options.map((o, oi) => {
            const selected = (answers[String(current)] ?? []).includes(oi);
            return (
              <button
                key={oi}
                type="button"
                onClick={() => pick(current, oi)}
                aria-pressed={selected}
                className={`w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${
                  selected
                    ? "border-accent bg-accent/10"
                    : "border-line hover:bg-white/5"
                }`}
              >
                <span className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className={`mt-0.5 grid size-4 shrink-0 place-items-center border text-[10px] leading-none ${
                      q.multi ? "rounded" : "rounded-full"
                    } ${selected ? "border-accent bg-accent text-white" : "border-line"}`}
                  >
                    {selected ? "✓" : ""}
                  </span>
                  <span>{o}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {questions.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Soal ${i + 1}`}
            className={`size-8 rounded-md border text-xs font-medium transition-colors ${
              i === current
                ? "border-accent text-accent"
                : (answers[String(i)]?.length ?? 0) > 0
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-line text-muted hover:bg-white/5"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={btn}
            disabled={current === 0}
            onClick={() => go(current - 1)}
          >
            Sebelumnya
          </button>
          <button
            type="button"
            className={btn}
            disabled={current === questions.length - 1}
            onClick={() => go(current + 1)}
          >
            Berikutnya
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={btn}
            onClick={abandon}
            disabled={pending}
          >
            Batalkan
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={pending}
            onClick={async () => {
              const blank = questions.length - answered;
              const ok = await confirmDialog({
                title: "Kumpulkan sekarang?",
                text:
                  blank > 0
                    ? `${blank} soal belum dijawab. Setelah dikumpulkan, jawaban tidak bisa diubah.`
                    : "Setelah dikumpulkan, jawaban tidak bisa diubah.",
                confirmText: "Ya, kumpulkan",
                icon: blank > 0 ? "warning" : "question",
              });
              if (ok) finish();
            }}
          >
            {pending ? "Menilai…" : "Kumpulkan"}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

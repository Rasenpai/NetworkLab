"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  RotateCcw,
  Terminal,
  Trophy,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Card,
  LevelBadge,
  SectionTitle,
  VendorBadge,
} from "@/components/ui";
import {
  BASE_SCORE,
  CMD_PENALTY,
  SCENARIOS,
  WRONG_PENALTY,
  calcScore,
  fmt,
  type SavedResult,
  type Scenario,
} from "@/lib/troubleshoot-data";
import {
  saveTroubleshootAction,
  type TroubleshootActionResult,
} from "@/app/actions/troubleshoot";

type Payload = {
  scenarioId: string;
  seconds: number;
  commands: number;
  wrong: number;
};

type SaveState = "idle" | "saving" | "saved" | "error";

/* ───────────────────────── Play view ───────────────────────── */

function Play({
  scenario,
  hasNext,
  onSave,
  onNext,
  onBack,
}: {
  scenario: Scenario;
  hasNext: boolean;
  onSave: (p: Payload) => Promise<TroubleshootActionResult>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [opened, setOpened] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{
    score: number;
    seconds: number;
  } | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [isBest, setIsBest] = useState(false);

  const solved = result !== null;

  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [solved]);

  const openCommand = (i: number) =>
    setOpened((o) => (o.includes(i) ? o : [...o, i]));

  const submit = () => {
    if (selected === null || solved) return;

    if (selected !== scenario.answer) {
      setWrong((w) => [...w, selected]);
      setSelected(null);
      return;
    }

    const payload: Payload = {
      scenarioId: scenario.id,
      seconds,
      commands: opened.length,
      wrong: wrong.length,
    };
    setResult({
      score: calcScore(seconds, opened.length, wrong.length),
      seconds,
    });
    setSaveState("saving");
    onSave(payload).then((res) => {
      if (res.ok) {
        setIsBest(res.data.isBest);
        setSaveState("saved");
      } else {
        setSaveError(res.error);
        setSaveState("error");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted transition-colors hover:text-foreground"
        >
          ← Semua tantangan
        </button>
        <div className="flex items-center gap-2">
          <Badge>
            <Terminal className="mr-1 size-3" /> {opened.length} command
          </Badge>
          <Badge
            className={
              wrong.length > 0
                ? "border-rose-400/20 bg-rose-400/10 text-rose-300"
                : undefined
            }
          >
            {wrong.length} salah
          </Badge>
          <Badge className="border-accent/30 bg-accent/15 font-mono text-purple-300">
            <Clock className="mr-1 size-3" /> {fmt(seconds)}
          </Badge>
        </div>
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <VendorBadge vendor={scenario.vendor} />
          <LevelBadge level={scenario.level} />
        </div>
        <h3 className="mt-3 text-lg font-semibold">{scenario.title}</h3>
        <p className="mt-1.5 text-sm text-muted">{scenario.brief}</p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-black/30 p-3 font-mono text-xs leading-relaxed text-muted">
          {scenario.topology}
        </pre>
      </Card>

      <section>
        <SectionTitle
          title="1. Diagnosa"
          hint={`Tiap command yang dibuka mengurangi ${CMD_PENALTY} poin`}
        />
        <div className="flex flex-wrap gap-2">
          {scenario.commands.map((c, i) => {
            const isOpen = opened.includes(i);
            return (
              <button
                key={c.label}
                type="button"
                onClick={() => openCommand(i)}
                className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  isOpen
                    ? "border-accent/30 bg-accent/15 text-purple-300"
                    : "border-line bg-white/5 text-muted hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {opened.length > 0 && (
          <div className="mt-4 space-y-3">
            {opened.map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-xl border border-line bg-black/40"
              >
                <p className="border-b border-line px-3 py-1.5 font-mono text-xs text-purple-300">
                  {scenario.commands[i].label}
                </p>
                <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed">
                  {scenario.commands[i].output}
                </pre>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle
          title="2. Akar masalah"
          hint={`Jawaban salah mengurangi ${WRONG_PENALTY} poin`}
        />
        <div className="space-y-2">
          {scenario.options.map((o, i) => {
            const isWrong = wrong.includes(i);
            const isRight = solved && i === scenario.answer;
            return (
              <button
                key={o}
                type="button"
                disabled={isWrong || solved}
                onClick={() => setSelected(i)}
                className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
                  isRight
                    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                    : isWrong
                      ? "border-rose-400/20 bg-rose-400/5 text-muted line-through opacity-60"
                      : selected === i
                        ? "border-accent/50 bg-accent/15"
                        : "border-line bg-card hover:border-accent/40"
                }`}
              >
                <span className="mt-0.5 shrink-0">
                  {isRight ? (
                    <CheckCircle2 className="size-4" />
                  ) : isWrong ? (
                    <XCircle className="size-4 text-rose-300" />
                  ) : (
                    <span
                      className={`block size-4 rounded-full border ${
                        selected === i
                          ? "border-accent bg-accent"
                          : "border-line"
                      }`}
                    />
                  )}
                </span>
                {o}
              </button>
            );
          })}
        </div>

        {!solved && (
          <button
            type="button"
            onClick={submit}
            disabled={selected === null}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
          >
            Kirim jawaban
          </button>
        )}
      </section>

      {result && (
        <Card className="border-emerald-400/30 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{result.score} poin</p>
              <p className="text-sm text-muted">
                Waktu {fmt(result.seconds)} · {opened.length} command ·{" "}
                {wrong.length} salah
              </p>
            </div>
            <div className="ml-auto">
              {saveState === "saving" && <Badge>Menyimpan…</Badge>}
              {saveState === "saved" && (
                <Badge className="border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  {isBest ? "Rekor baru, tersimpan" : "Tersimpan"}
                </Badge>
              )}
              {saveState === "error" && (
                <Badge className="border-rose-400/20 bg-rose-400/10 text-rose-300">
                  Belum tersimpan
                </Badge>
              )}
            </div>
          </div>

          {saveState === "error" && (
            <p className="mt-3 text-sm text-rose-300">{saveError}</p>
          )}

          <p className="mt-4 text-sm">{scenario.explanation}</p>

          <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted">
            Perbaikan
          </p>
          <pre className="overflow-x-auto rounded-xl border border-line bg-black/40 p-3 font-mono text-xs leading-relaxed text-emerald-300">
            {scenario.fix.join("\n")}
          </pre>

          <div className="mt-5 flex flex-wrap gap-2">
            {hasNext && (
              <button
                type="button"
                onClick={onNext}
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                Tantangan berikutnya <ArrowRight className="size-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <RotateCcw className="size-4" /> Daftar tantangan
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ───────────────────────── Main ───────────────────────── */

export default function TroubleshootView({
  initialResults,
}: {
  initialResults: Record<string, SavedResult>;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [results, setResults] =
    useState<Record<string, SavedResult>>(initialResults);

  const activeIndex = SCENARIOS.findIndex((s) => s.id === activeId);
  const active = activeIndex >= 0 ? SCENARIOS[activeIndex] : null;

  const handleSave = async (p: Payload) => {
    const res = await saveTroubleshootAction(p);
    if (res.ok) {
      setResults((prev) => ({ ...prev, [p.scenarioId]: res.data.best }));
    }
    return res;
  };

  if (active) {
    return (
      <Play
        key={active.id}
        scenario={active}
        hasNext={activeIndex < SCENARIOS.length - 1}
        onSave={handleSave}
        onNext={() => setActiveId(SCENARIOS[activeIndex + 1].id)}
        onBack={() => setActiveId(null)}
      />
    );
  }

  const done = SCENARIOS.filter((s) => results[s.id]).length;
  const total = SCENARIOS.reduce((a, s) => a + (results[s.id]?.score ?? 0), 0);

  return (
    <>
      <Card className="mb-6 flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        <div>
          <p className="text-xs text-muted">Selesai</p>
          <p className="text-2xl font-semibold">
            {done}/{SCENARIOS.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Total skor terbaik</p>
          <p className="text-2xl font-semibold">{total}</p>
        </div>
        <p className="max-w-md text-sm text-muted">
          Skor awal {BASE_SCORE}. Dikurangi waktu (maks 30), tiap command yang
          dibuka, dan tiap jawaban salah. Hasil terbaik tiap tantangan tersimpan
          di akunmu.
        </p>
      </Card>

      <SectionTitle
        title={`Tantangan (${SCENARIOS.length})`}
        hint="Skor tertinggi tiap tantangan yang dihitung"
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SCENARIOS.map((s) => {
          const r = results[s.id];
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveId(s.id)}
              className="flex rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <Card className="flex w-full flex-col p-5 transition-colors hover:border-accent/40">
                <div className="flex flex-wrap items-center gap-2">
                  <VendorBadge vendor={s.vendor} />
                  <LevelBadge level={s.level} />
                  {r && (
                    <Badge className="ml-auto border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      <CheckCircle2 className="mr-1 size-3" /> {r.score} poin
                    </Badge>
                  )}
                </div>
                <h4 className="mt-3 font-semibold leading-snug">{s.title}</h4>
                <p className="mt-1.5 line-clamp-3 text-sm text-muted">
                  {s.brief}
                </p>
                <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="size-3.5" /> {s.commands.length}{" "}
                    command
                  </span>
                  {r && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="size-3.5" /> {fmt(r.seconds)}
                    </span>
                  )}
                  <span className="ml-auto font-medium text-accent">
                    {r ? `Coba lagi · ${r.attempts}×` : "Mulai"}
                  </span>
                </div>
              </Card>
            </button>
          );
        })}
      </div>
    </>
  );
}

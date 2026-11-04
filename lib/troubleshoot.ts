import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordActivity } from "@/lib/learning";
import { SCENARIOS, calcScore, type SavedResult } from "@/lib/troubleshoot-data";

/**
 * Hasil Troubleshooting Challenge per user (tabel troubleshoot_results).
 * Skor dihitung ulang di server dari waktu, jumlah command, dan jumlah jawaban salah,
 * jadi skor yang dikirim browser tidak dipakai.
 */

export type TroubleshootSaved = {
  score: number;
  best: SavedResult;
  /** true kalau percobaan ini menjadi rekor terbaru user untuk tantangan tersebut. */
  isBest: boolean;
};

export type TroubleshootInput = {
  scenarioId: string;
  seconds: number;
  commands: number;
  wrong: number;
};

function toInt(value: unknown, lo: number, hi: number) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Data tidak valid.");
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

type Row = { scenario_id: string; best_score: number; best_seconds: number; attempts: number };

/** Hasil terbaik user untuk semua tantangan yang sudah pernah diselesaikan. */
export function getTroubleshootResults(userId: number): Record<string, SavedResult> {
  const rows = db
    .prepare(
      "SELECT scenario_id, best_score, best_seconds, attempts FROM troubleshoot_results WHERE user_id = ?",
    )
    .all(userId) as Row[];
  const known = new Set(SCENARIOS.map((s) => s.id));
  const out: Record<string, SavedResult> = {};
  for (const r of rows) {
    if (!known.has(r.scenario_id)) continue;
    out[r.scenario_id] = { score: r.best_score, seconds: r.best_seconds, attempts: r.attempts };
  }
  return out;
}

/** Simpan satu penyelesaian. Rekor diganti hanya kalau skornya lebih tinggi (atau sama tapi lebih cepat). */
export function recordTroubleshootSolve(userId: number, input: TroubleshootInput): TroubleshootSaved {
  const scenario = SCENARIOS.find((s) => s.id === input.scenarioId);
  if (!scenario) throw new Error("Tantangan tidak ditemukan.");

  const seconds = toInt(input.seconds, 0, 86_400);
  const commands = toInt(input.commands, 0, scenario.commands.length);
  const wrong = toInt(input.wrong, 0, scenario.options.length - 1);
  const score = calcScore(seconds, commands, wrong);
  const now = Date.now();

  let isBest = false;
  db.transaction(() => {
    const prev = db
      .prepare("SELECT best_score, best_seconds FROM troubleshoot_results WHERE user_id = ? AND scenario_id = ?")
      .get(userId, scenario.id) as { best_score: number; best_seconds: number } | undefined;

    isBest = !prev || score > prev.best_score || (score === prev.best_score && seconds < prev.best_seconds);

    if (!prev) {
      db.prepare(
        `INSERT INTO troubleshoot_results
           (user_id, scenario_id, best_score, best_seconds, commands, wrong, attempts, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      ).run(userId, scenario.id, score, seconds, commands, wrong, now);
    } else if (isBest) {
      db.prepare(
        `UPDATE troubleshoot_results
            SET best_score = ?, best_seconds = ?, commands = ?, wrong = ?,
                attempts = attempts + 1, updated_at = ?
          WHERE user_id = ? AND scenario_id = ?`,
      ).run(score, seconds, commands, wrong, now, userId, scenario.id);
    } else {
      db.prepare(
        `UPDATE troubleshoot_results SET attempts = attempts + 1, updated_at = ?
          WHERE user_id = ? AND scenario_id = ?`,
      ).run(now, userId, scenario.id);
    }
  })();

  // Masuk ke menit belajar, streak, dan aktivitas terbaru di dashboard.
  recordActivity(
    userId,
    "lab",
    `Menyelesaikan Troubleshooting: ${scenario.title} · skor ${score}`,
    Math.min(30, Math.max(1, Math.round(seconds / 60))),
  );

  const row = db
    .prepare(
      "SELECT scenario_id, best_score, best_seconds, attempts FROM troubleshoot_results WHERE user_id = ? AND scenario_id = ?",
    )
    .get(userId, scenario.id) as Row;

  return {
    score,
    isBest,
    best: { score: row.best_score, seconds: row.best_seconds, attempts: row.attempts },
  };
}

/** Hasil milik user yang sedang login ({} kalau belum login). Dipakai halaman server. */
export async function getMyTroubleshootResults(): Promise<Record<string, SavedResult>> {
  const user = await getCurrentUser();
  return user ? getTroubleshootResults(user.id) : {};
}
"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findLabSpec } from "@/lib/lab/labs";
import { recordActivity } from "@/lib/learning";

/**
 * Progres virtual lab per user. `state` adalah JSON dari LabRunner
 * (log aksi, isi terminal, hasil tugas, petunjuk). Diperlakukan sebagai data
 * buram di server; yang divalidasi hanya pemilik, id lab, dan ukurannya.
 *
 * `passed` = jumlah tugas yang lolos pada pemeriksaan terakhir. Dari sinilah
 * status "Belum dimulai / Berjalan / Selesai" di daftar lab dihitung
 * (lihat lib/lab/status.ts).
 *
 * Saat lab pertama kali tuntas, menit lab + aktivitas dicatat ke dashboard
 * (sekali per lab per user).
 */

const MAX_BYTES = 500_000;

export async function loadLabState(labId: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user || typeof labId !== "string") return null;
  const row = db
    .prepare("SELECT state FROM lab_state WHERE user_id = ? AND lab_id = ?")
    .get(user.id, labId) as { state: string } | undefined;
  return row?.state ?? null;
}

export async function saveLabState(
  labId: string,
  state: string,
  passed: number,
): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (typeof labId !== "string" || typeof state !== "string") return false;
  if (state.length > MAX_BYTES) return false;
  if (!Number.isFinite(passed)) return false;
  const spec = findLabSpec({ id: labId });
  if (!spec) return false;

  const total = spec.tasks.length;
  const count = Math.min(total, Math.max(0, Math.round(passed)));
  const completed = total > 0 && count >= total;

  const prev = db
    .prepare("SELECT completed FROM lab_state WHERE user_id = ? AND lab_id = ?")
    .get(user.id, labId) as { completed: number } | undefined;

  db.prepare(
    `INSERT INTO lab_state (user_id, lab_id, state, completed, passed, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lab_id) DO UPDATE SET
       state = excluded.state,
       completed = excluded.completed,
       passed = excluded.passed,
       updated_at = excluded.updated_at`,
  ).run(user.id, labId, state, completed ? 1 : 0, count, Date.now());

  // Transisi ke "tuntas": catat ke dashboard, sekali saja per lab.
  if (completed && !prev?.completed) {
    const text = `Menyelesaikan lab ${spec.title}`.slice(0, 120);
    const seen = db
      .prepare("SELECT 1 FROM activity WHERE user_id = ? AND type = 'lab' AND text = ?")
      .get(user.id, text);
    if (!seen) recordActivity(user.id, "lab", text, spec.minutes);
  }
  return true;
}

export async function resetLabState(labId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user || typeof labId !== "string") return;
  db.prepare("DELETE FROM lab_state WHERE user_id = ? AND lab_id = ?").run(
    user.id,
    labId,
  );
}
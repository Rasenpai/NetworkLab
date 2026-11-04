import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findLabSpec } from "@/lib/lab/labs";

export type LabStatus = "Belum dimulai" | "Berjalan" | "Selesai";
export type LabProgress = { status: LabStatus; passed: number; total: number };

/**
 * Aturan status:
 *  - belum ada satu pun tugas yang lolos  -> "Belum dimulai"
 *  - sebagian tugas lolos                 -> "Berjalan"
 *  - semua tugas lolos                    -> "Selesai"
 */
export function statusOf(passed: number, total: number): LabStatus {
  if (passed <= 0 || total <= 0) return "Belum dimulai";
  return passed >= total ? "Selesai" : "Berjalan";
}

/**
 * Progres semua lab milik user yang sedang login, dengan kunci id spec lab
 * (lib/lab/labs.ts). Lab yang belum pernah dibuka tidak ada di hasil.
 * Total tugas dihitung dari spec saat ini, jadi kalau tugas ditambah atau
 * dikurangi, status ikut menyesuaikan.
 */
export async function getMyLabProgress(): Promise<Record<string, LabProgress>> {
  const user = await getCurrentUser();
  if (!user) return {};
  const rows = db
    .prepare("SELECT lab_id, passed FROM lab_state WHERE user_id = ?")
    .all(user.id) as { lab_id: string; passed: number }[];

  const out: Record<string, LabProgress> = {};
  for (const r of rows) {
    const spec = findLabSpec({ id: r.lab_id });
    if (!spec) continue;
    const total = spec.tasks.length;
    const passed = Math.min(Math.max(0, r.passed), total);
    out[r.lab_id] = { status: statusOf(passed, total), passed, total };
  }
  return out;
}
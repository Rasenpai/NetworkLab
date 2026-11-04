"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  discardQuizSession,
  recordActivity,
  recordQuizAttempt,
  saveQuizProgress,
  seedDemoData,
  setCourseProgress,
  startQuizSession,
  submitQuizSession,
  type QuizResult,
  type QuizSession,
} from "@/lib/learning";

export type LearningResult = { ok: true } | { ok: false; error: string };
export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function withUser(fn: (userId: number) => void): Promise<LearningResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  try {
    fn(user.id);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }
  // Segarkan dashboard dan Shell (streak, level).
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Sama seperti withUser, tapi mengembalikan data dan tidak menyegarkan halaman. */
async function withUserData<T>(fn: (userId: number) => T): Promise<DataResult<T>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  try {
    return { ok: true, data: fn(user.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }
}

/** Panggil dari halaman materi, mis. saat user menyelesaikan satu bab. */
export async function setCourseProgressAction(courseId: string, progress: number) {
  return withUser((id) => setCourseProgress(id, String(courseId), Number(progress)));
}

/** Pencatatan skor manual. Tidak dipakai lagi oleh UI; dipertahankan untuk kompatibilitas. */
export async function submitQuizAction(quizId: string, score: number, minutes?: number) {
  return withUser((id) => recordQuizAttempt(id, String(quizId), Number(score), minutes === undefined ? 15 : Number(minutes)));
}

/* ---------- Quiz / exam ---------- */

/** Mulai atau lanjutkan sesi quiz. Timer tidak diulang kalau sesi sudah ada. */
export async function startQuizSessionAction(quizId: string): Promise<DataResult<QuizSession>> {
  return withUserData((id) => startQuizSession(id, String(quizId)));
}

/** Simpan jawaban sementara. Dipanggil tiap kali user memilih jawaban atau pindah soal. */
export async function saveQuizProgressAction(
  quizId: string,
  answers: Record<string, number[]>,
  current: number,
): Promise<DataResult<null>> {
  return withUserData((id) => {
    saveQuizProgress(id, String(quizId), answers, Number(current));
    return null;
  });
}

/** Kumpulkan quiz: dinilai di server, skor tersimpan per user. */
export async function submitQuizSessionAction(
  quizId: string,
  answers: Record<string, number[]>,
): Promise<DataResult<QuizResult>> {
  const res = await withUserData((id) => submitQuizSession(id, String(quizId), answers));
  if (res.ok) revalidatePath("/", "layout");
  return res;
}

/** Batalkan sesi yang sedang berjalan (tanpa skor). */
export async function discardQuizSessionAction(quizId: string): Promise<DataResult<null>> {
  return withUserData((id) => {
    discardQuizSession(id, String(quizId));
    return null;
  });
}

/** Panggil dari Virtual Lab atau Portfolio. */
export async function logActivityAction(type: "lab" | "portfolio", text: string, minutes: number) {
  if (type !== "lab" && type !== "portfolio") return { ok: false, error: "Tipe aktivitas tidak valid." } as const;
  return withUser((id) => recordActivity(id, type, String(text), Number(minutes)));
}

/** Tombol "Isi data contoh" di dashboard (hanya untuk akun yang masih kosong). */
export async function seedDemoDataAction(): Promise<void> {
  await withUser((id) => {
    seedDemoData(id);
  });
}
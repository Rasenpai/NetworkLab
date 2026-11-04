"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { completeLesson } from "@/lib/learning";

export type CompleteLessonResult = { ok: true } | { ok: false; error: string };

/** Tandai satu bab selesai untuk user yang sedang login. */
export async function completeLessonAction(courseId: string, slug: string): Promise<CompleteLessonResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Silakan masuk dulu." };

  try {
    completeLesson(user.id, courseId, slug);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan progres." };
  }

  // Progres tampil di daftar materi, halaman bab, dan dashboard.
  revalidatePath("/", "layout");
  return { ok: true };
}
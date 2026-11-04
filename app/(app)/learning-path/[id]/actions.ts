"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { chaptersDone, getModuleById, MODULE_BASE } from "@/lib/catalog";
import { getLearningData, setCourseProgress } from "@/lib/learning";

export async function completeChapter(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Silakan login terlebih dahulu.");

  const id = String(formData.get("id") ?? "");
  const chapter = Number(formData.get("chapter"));
  const mod = getModuleById(id);

  if (!mod) throw new Error("Materi tidak ditemukan.");
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > mod.lessons) {
    throw new Error("Bab tidak valid.");
  }

  // Bab hanya bisa diselesaikan berurutan.
  const progress = getLearningData(user.id).progressById[id] ?? 0;
  if (chapter > chaptersDone(mod, progress) + 1) {
    throw new Error("Selesaikan bab sebelumnya terlebih dahulu.");
  }

  // Progres tidak pernah turun, jadi menandai bab lama tidak merusak progres.
  setCourseProgress(user.id, id, (chapter / mod.lessons) * 100);

  revalidatePath(`${MODULE_BASE}/${id}`, "layout");
  revalidatePath(MODULE_BASE);

  // Dari halaman belajar: lanjut ke bab berikutnya, atau kembali ke modul kalau sudah bab terakhir.
  if (String(formData.get("next") ?? "") === "continue") {
    redirect(
      chapter < mod.lessons
        ? `${MODULE_BASE}/${id}/${chapter + 1}`
        : `${MODULE_BASE}/${id}`,
    );
  }
}
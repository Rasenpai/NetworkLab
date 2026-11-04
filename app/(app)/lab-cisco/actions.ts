"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createCanvas, deleteCanvas, listCanvases, saveCanvas } from "@/lib/cisco-canvas";

export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function withUserData<T>(fn: (userId: number) => T): Promise<DataResult<T>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Silakan masuk lagi." };
  try {
    return { ok: true, data: fn(user.id) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Terjadi kesalahan." };
  }
}

/** Buat canvas baru (kosong). Klien lalu pindah ke /lab-cisco?c=<id>. */
export async function createCanvasAction(name?: string): Promise<DataResult<{ id: string }>> {
  const res = await withUserData((uid) => ({ id: createCanvas(uid, name).id }));
  if (res.ok) revalidatePath("/lab-cisco");
  return res;
}

/** Simpan nama + isi canvas. Isi divalidasi ulang di server. */
export async function saveCanvasAction(
  id: string,
  name: string,
  topology: unknown,
): Promise<DataResult<{ updatedAt: number }>> {
  const res = await withUserData((uid) => ({ updatedAt: saveCanvas(uid, String(id), name, topology) }));
  if (res.ok) revalidatePath("/lab-cisco");
  return res;
}

/**
 * Hapus canvas. Mengembalikan id canvas yang harus dibuka berikutnya:
 * yang terbaru dari sisa canvas, atau canvas kosong baru kalau sudah habis.
 */
export async function deleteCanvasAction(id: string): Promise<DataResult<{ nextId: string }>> {
  const res = await withUserData((uid) => {
    deleteCanvas(uid, String(id));
    const rest = listCanvases(uid);
    return { nextId: rest[0]?.id ?? createCanvas(uid).id };
  });
  if (res.ok) revalidatePath("/lab-cisco");
  return res;
}
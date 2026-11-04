"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  recordTroubleshootSolve,
  type TroubleshootInput,
  type TroubleshootSaved,
} from "@/lib/troubleshoot";

export type TroubleshootActionResult =
  | { ok: true; data: TroubleshootSaved }
  | { ok: false; error: string };

/** Dipanggil saat user menjawab benar. Skor dihitung ulang di server lalu disimpan per user. */
export async function saveTroubleshootAction(
  input: TroubleshootInput,
): Promise<TroubleshootActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sesi berakhir. Masuk lagi supaya skor tersimpan." };
  try {
    const data = recordTroubleshootSolve(user.id, {
      scenarioId: String(input.scenarioId),
      seconds: Number(input.seconds),
      commands: Number(input.commands),
      wrong: Number(input.wrong),
    });
    // Segarkan dashboard dan Shell (streak, level).
    revalidatePath("/", "layout");
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gagal menyimpan." };
  }
}
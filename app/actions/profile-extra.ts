"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { updateProfileAction, type ProfileState } from "@/app/actions/profile";
import { parseProfileExtras, saveProfileExtras } from "@/lib/profile-extra";

export async function saveProfileAction(
  prev: ProfileState,
  fd: FormData,
): Promise<ProfileState> {
  // Validasi dulu sebelum ada yang disimpan, supaya input salah tidak menyimpan sebagian.
  const parsed = parseProfileExtras(fd);
  if ("error" in parsed) return { error: parsed.error };

  // Nama + avatar tetap diproses action lama.
  const result = await updateProfileAction(prev, fd);
  if (result.error) return result;

  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan login ulang." };

  saveProfileExtras(user.id, parsed.data);
  revalidatePath("/profile");
  return result;
}
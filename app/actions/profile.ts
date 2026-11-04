"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export type ProfileState = {
  ok?: boolean;
  error?: string;
  message?: string;
};

const MAX_AVATAR_BYTES = 512 * 1024; // gambar sudah di-resize 256x256 di browser, jadi jauh di bawah ini

/** Cek tipe gambar dari isi file (magic bytes), bukan dari nama/tipe yang dikirim browser. */
function sniffImageMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 4 && buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
}

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Sesi berakhir. Silakan masuk lagi." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Nama minimal 2 karakter." };
  if (name.length > 50) return { error: "Nama maksimal 50 karakter." };

  const file = formData.get("avatar");
  const removeAvatar = formData.get("remove_avatar") === "1";

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_AVATAR_BYTES) return { error: "Ukuran foto terlalu besar (maks 512 KB)." };
    const buf = Buffer.from(await file.arrayBuffer());
    const mime = sniffImageMime(buf);
    if (!mime) return { error: "Format foto tidak didukung. Gunakan JPG, PNG, atau WebP." };

    db.prepare("UPDATE users SET name = ?, avatar = ?, avatar_mime = ?, avatar_updated = ? WHERE id = ?").run(
      name,
      buf,
      mime,
      Date.now(),
      user.id,
    );
  } else if (removeAvatar) {
    db.prepare("UPDATE users SET name = ?, avatar = NULL, avatar_mime = NULL, avatar_updated = NULL WHERE id = ?").run(
      name,
      user.id,
    );
  } else {
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, user.id);
  }

  // Segarkan nama/avatar di Shell, dashboard, dan halaman lain.
  revalidatePath("/", "layout");
  return { ok: true, message: "Profil berhasil diperbarui." };
}
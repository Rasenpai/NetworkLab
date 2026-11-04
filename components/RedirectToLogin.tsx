"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Dipakai saat sesi tidak valid (misalnya cookie kedaluwarsa).
 * Sengaja pakai redirect sisi client, bukan redirect() di server component:
 * redirect() yang dilempar saat render prefetch/validasi "instant" Next 16
 * membuat validasi gagal dan diulang terus (loading tanpa henti).
 * Pengamanan utamanya tetap proxy.ts untuk request tanpa cookie.
 */
export default function RedirectToLogin() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted">
      Mengalihkan ke halaman masuk…
    </div>
  );
}

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

/**
 * Bagian landing page yang bergantung pada status login.
 * Dipakai di dalam <Suspense> supaya sisa halaman tetap bisa diprerender.
 */

export async function HeaderActions() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <Link
        href="/dashboard"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Dashboard
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-fg/5"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Daftar
      </Link>
    </>
  );
}

export async function HeroActions() {
  const user = await getCurrentUser();
  return (
    <>
      <Link
        href={user ? "/dashboard" : "/register"}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        {user ? "Buka Dashboard" : "Mulai Belajar Gratis"}
        <ArrowRight className="size-4" />
      </Link>
      {!user && (
        <Link
          href="/login"
          className="rounded-lg border border-fg/15 px-6 py-3 text-sm font-semibold hover:bg-fg/5"
        >
          Saya sudah punya akun
        </Link>
      )}
    </>
  );
}

export async function BottomAction() {
  const user = await getCurrentUser();
  return (
    <Link
      href={user ? "/dashboard" : "/register"}
      className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90"
    >
      {user ? "Buka Dashboard" : "Mulai Belajar Gratis"}
      <ArrowRight className="size-4" />
    </Link>
  );
}

/** Fallback statis selagi status login dicek (sama dengan tampilan untuk tamu). */
export function HeaderFallback() {
  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-fg/5"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        Daftar
      </Link>
    </>
  );
}

export function CtaFallback({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/register"
      className={`inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white hover:opacity-90 ${className}`}
    >
      Mulai Belajar Gratis
      <ArrowRight className="size-4" />
    </Link>
  );
}

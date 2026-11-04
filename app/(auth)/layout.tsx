import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Network } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

// User yang sudah login tidak perlu melihat form login/daftar lagi.
// Membaca cookie harus di dalam <Suspense>, jadi dipisah ke komponen sendiri.
async function RedirectIfLoggedIn({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/dashboard");
  return <>{children}</>;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-lg font-semibold"
      >
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-white">
          <Network className="size-5" />
        </span>
        NetworkLab
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-fg/10 bg-fg/[0.03] p-6 shadow-sm sm:p-8">
        <Suspense fallback={<div className="h-64" />}>
          <RedirectIfLoggedIn>{children}</RedirectIfLoggedIn>
        </Suspense>
      </div>
      <Link href="/" className="mt-6 text-sm text-muted hover:text-fg">
        ← Kembali ke beranda
      </Link>
    </main>
  );
}

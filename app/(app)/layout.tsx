import { Suspense } from "react";
import Shell from "@/components/Shell";
import RedirectToLogin from "@/components/RedirectToLogin";
import { UserProvider } from "@/components/UserProvider";
import { getCurrentUser } from "@/lib/auth";
import { getLearningData } from "@/lib/learning";

// Semua halaman di dalam folder (app) hanya bisa diakses setelah login.
// Cek sesi membaca cookie (data per-request), jadi harus di dalam <Suspense>.
async function Guard({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <RedirectToLogin />;

  // Hasilnya di-cache per request (React cache), jadi dashboard tidak query dua kali.
  const { streak, level, levelPercent } = getLearningData(user.id);

  return (
    // Data user dibagikan ke komponen client (UserMenu, streak, level di Shell) lewat context.
    <UserProvider
      user={{
        name: user.name,
        email: user.email,
        avatarVersion: user.avatar_updated,
        streak,
        level,
        levelPercent,
      }}
    >
      <Shell>{children}</Shell>
    </UserProvider>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-muted">
          Memuat…
        </div>
      }
    >
      <Guard>{children}</Guard>
    </Suspense>
  );
}

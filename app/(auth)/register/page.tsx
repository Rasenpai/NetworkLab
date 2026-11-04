import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Daftar",
  robots: { index: false, follow: true },
};

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Buat akun baru</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Gratis. Mulai belajar jaringan komputer dalam hitungan menit.
      </p>
      <AuthForm mode="register" />
    </>
  );
}

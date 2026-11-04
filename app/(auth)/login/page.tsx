import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Masuk",
  // Halaman form tidak perlu muncul di hasil pencarian.
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <>
      <h1 className="text-xl font-semibold">Masuk ke NetworkLab</h1>
      <p className="mb-6 mt-1 text-sm text-muted">
        Lanjutkan belajar MikroTik dan Cisco dari terakhir kamu berhenti.
      </p>
      <AuthForm mode="login" />
    </>
  );
}

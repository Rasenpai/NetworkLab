import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Logo from "@/components/Logo";

const lines: { prompt?: boolean; text: string; tone?: "error" }[] = [
  { prompt: true, text: "/ping halaman-ini count=3" },
  { text: "  SEQ HOST            STATUS", tone: "error" },
  { text: "    0 halaman-ini     host unreachable", tone: "error" },
  { text: "    1 halaman-ini     host unreachable", tone: "error" },
  { text: "    2 halaman-ini     host unreachable", tone: "error" },
  { text: "    sent=3 received=0 packet-loss=100%", tone: "error" },
];

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <Link
        href="/"
        aria-label="NetworkLab, beranda"
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <Logo />
      </Link>

      <div className="mt-12 w-full max-w-md text-center">
        <p className="font-mono text-sm tracking-[0.14em] text-accent">
          ERROR 404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
          Halaman tidak ditemukan
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          Alamat yang kamu tuju tidak ada atau sudah dipindahkan. Periksa lagi
          URL-nya, atau kembali ke jalur yang benar.
        </p>
      </div>

      <figure
        aria-label="Ilustrasi ping ke halaman yang tidak ditemukan"
        className="mt-10 w-full max-w-md overflow-hidden rounded-xl border border-line bg-card shadow-2xl shadow-black/40"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-muted">
          <span>lab-r1 · RouterOS</span>
          <span>404</span>
        </div>
        <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7] text-fg/90">
          <code>
            {lines.map((l, i) => (
              <span key={i} className="block whitespace-pre">
                {l.prompt ? (
                  <>
                    <span className="text-muted">{"[admin@r1] > "}</span>
                    {l.text}
                  </>
                ) : (
                  <span
                    className={
                      l.tone === "error" ? "text-red-400" : "text-muted"
                    }
                  >
                    {l.text}
                  </span>
                )}
              </span>
            ))}
          </code>
        </pre>
      </figure>

      <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Kembali ke beranda
        </Link>
        <Link
          href="/dashboard"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-medium outline-none transition-colors hover:border-accent/50 focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <LayoutDashboard className="size-4" aria-hidden />
          Ke dashboard
        </Link>
      </div>
    </main>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Logo from "@/components/Logo";
import {
  BottomAction,
  CtaFallback,
  HeaderActions,
  HeaderFallback,
  HeroActions,
} from "@/components/LandingActions";

// Dihitung di server dan di-cache, jadi tidak membuat halaman jadi dinamis.
async function Year() {
  "use cache";
  return <>{new Date().getFullYear()}</>;
}

const features = [
  {
    title: "Materi terstruktur",
    text: "Kurikulum bertahap dari dasar jaringan sampai konfigurasi lanjutan, disusun mengikuti jalur sertifikasi.",
  },
  {
    title: "Lab praktik",
    text: "Latihan konfigurasi langkah demi langkah supaya kamu tidak hanya hafal teori, tapi benar-benar bisa mengerjakan.",
  },
  {
    title: "Quiz dan evaluasi",
    text: "Uji pemahamanmu setelah tiap materi dan lihat bagian mana yang masih perlu diulang.",
  },
  {
    title: "Portofolio",
    text: "Dokumentasikan hasil lab dan proyekmu sebagai bukti kemampuan untuk karier di bidang jaringan.",
  },
  {
    title: "Pantau progres",
    text: "Dashboard pribadi menampilkan waktu belajar, skor quiz, dan materi yang sedang kamu kerjakan.",
  },
  {
    title: "Dua vendor, satu tempat",
    text: "Belajar MikroTik dan Cisco berdampingan, lalu bandingkan cara kerja keduanya.",
  },
];

const tracks = [
  {
    name: "MikroTik",
    lead: "RouterOS yang fleksibel dan banyak dipakai ISP lokal.",
    points: [
      "RouterOS dan Winbox",
      "Firewall, NAT, dan Queue",
      "Routing, VPN, dan Hotspot",
    ],
    prompt: "[admin@r1] > ",
    code: ["/ip address add address=192.168.10.1/24 interface=ether2"],
  },
  {
    name: "Cisco",
    lead: "IOS sebagai standar industri dan dasar sertifikasi CCNA.",
    points: [
      "Switching, VLAN, dan STP",
      "Routing OSPF dan EIGRP",
      "ACL, NAT, dan keamanan dasar",
    ],
    prompt: "",
    code: [
      "R1(config)# interface g0/0",
      "R1(config-if)# ip address 192.168.10.1 255.255.255.0",
      "R1(config-if)# no shutdown",
    ],
  },
];

const steps = [
  {
    n: "01",
    title: "Buat akun",
    text: "Daftar gratis dengan email, tanpa kartu kredit.",
  },
  {
    n: "02",
    title: "Pilih jalur belajar",
    text: "Mulai dari MikroTik, Cisco, atau keduanya.",
  },
  {
    n: "03",
    title: "Belajar, praktik, evaluasi",
    text: "Ikuti materi, kerjakan lab, lalu uji dengan quiz.",
  },
];

const labLines: { prompt?: boolean; text: string }[] = [
  {
    prompt: true,
    text: "/ip address add address=10.0.0.1/24 interface=ether2",
  },
  { prompt: true, text: "/ip firewall nat add chain=srcnat action=masquerade" },
  { prompt: true, text: "/ping 8.8.8.8 count=3" },
  { text: "  SEQ HOST          SIZE TTL TIME" },
  { text: "    0 8.8.8.8         56 117 12ms" },
  { text: "    1 8.8.8.8         56 117 11ms" },
  { text: "    2 8.8.8.8         56 117 12ms" },
  { text: "    sent=3 received=3 packet-loss=0%" },
];

const labTasks = [
  "Alamat IP LAN terpasang",
  "NAT masquerade aktif",
  "Ping ke internet berhasil",
];

/** Ilustrasi sesi lab: terminal RouterOS dan daftar tugas yang diperiksa. */
function LabPreview() {
  return (
    <figure
      aria-label="Contoh sesi lab konfigurasi MikroTik"
      className="overflow-hidden rounded-xl border border-line bg-card shadow-2xl shadow-black/40"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-xs text-muted">
        <span>lab-r1 · RouterOS</span>
        <span>Tugas 3 / 3</span>
      </div>

      <pre className="overflow-x-auto px-4 py-4 font-mono text-[12px] leading-[1.7] text-fg/90">
        <code>
          {labLines.map((l, i) => (
            <span key={i} className="block whitespace-pre">
              {l.prompt ? (
                <>
                  <span className="text-muted">{"[admin@r1] > "}</span>
                  {l.text}
                </>
              ) : (
                <span className="text-muted">{l.text}</span>
              )}
            </span>
          ))}
        </code>
      </pre>

      <ul className="divide-y divide-line border-t border-line text-sm">
        {labTasks.map((t) => (
          <li key={t} className="flex items-center gap-3 px-4 py-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <Check className="size-3" strokeWidth={3} aria-hidden />
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            aria-label="NetworkLab, beranda"
            className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <Logo />
          </Link>
          <nav
            aria-label="Bagian halaman"
            className="hidden items-center gap-7 text-sm text-muted md:flex"
          >
            <a href="#fitur" className="transition-colors hover:text-fg">
              Fitur
            </a>
            <a href="#jalur" className="transition-colors hover:text-fg">
              Jalur Belajar
            </a>
            <a href="#cara-kerja" className="transition-colors hover:text-fg">
              Cara Kerja
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Suspense fallback={<HeaderFallback />}>
              <HeaderActions />
            </Suspense>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.14em] text-muted">
              <span aria-hidden className="size-1.5 bg-accent" />
              Platform belajar jaringan komputer
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[56px]">
              Belajar MikroTik dan Cisco dengan{" "}
              <span className="text-accent">praktik langsung</span>.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Materi terstruktur, lab praktik, dan quiz dalam satu tempat.
              Belajar sesuai ritmemu, pantau progresmu, dan bangun portofolio
              yang siap dipakai melamar kerja.
            </p>
            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Suspense fallback={<CtaFallback />}>
                <HeroActions />
              </Suspense>
            </div>
            <p className="mt-4 text-sm text-muted">
              Gratis, tanpa kartu kredit.
            </p>
          </div>

          <LabPreview />
        </section>

        {/* Fitur */}
        <section id="fitur" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Semua yang kamu butuhkan untuk belajar
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">
                Dari teori sampai praktik, dirancang supaya belajar jaringan
                terasa jelas dan terarah.
              </p>
            </div>
            <ul className="divide-y divide-line border-y border-line">
              {features.map((f, i) => (
                <li
                  key={f.title}
                  className="grid grid-cols-[2.5rem_1fr] gap-x-4 py-6"
                >
                  <span className="pt-0.5 font-mono text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-medium">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {f.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Jalur belajar */}
        <section id="jalur" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                Pilih jalur belajarmu
              </h2>
              <p className="mt-4 leading-relaxed text-muted">
                Ambil satu, atau jalani keduanya. Tugas yang sama, dikerjakan
                dengan cara yang berbeda di tiap vendor.
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {tracks.map((t) => (
                <article
                  key={t.name}
                  className="flex flex-col rounded-xl border border-line bg-card p-6"
                >
                  <h3 className="text-xl font-semibold tracking-tight">
                    {t.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted">{t.lead}</p>

                  <ul className="mt-5 space-y-2.5 text-sm">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-baseline gap-3">
                        <span
                          aria-hidden
                          className="font-mono text-xs text-accent"
                        >
                          /
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>

                  <pre
                    aria-label={`Contoh perintah ${t.name}`}
                    className="mt-6 overflow-x-auto rounded-lg border border-line bg-bg px-4 py-3 font-mono text-[12px] leading-[1.7] text-fg/90"
                  >
                    <code>
                      {t.code.map((c) => (
                        <span key={c} className="block whitespace-pre">
                          {t.prompt && (
                            <span className="text-muted">{t.prompt}</span>
                          )}
                          {c}
                        </span>
                      ))}
                    </code>
                  </pre>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
              Mulai dalam 3 langkah
            </h2>
            <ol className="mt-10 grid gap-x-8 gap-y-8 md:grid-cols-3">
              {steps.map((s) => (
                <li key={s.n} className="border-t border-fg/20 pt-5">
                  <span className="font-mono text-sm text-accent">{s.n}</span>
                  <h3 className="mt-3 font-medium">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {s.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="rounded-xl border border-line bg-card px-6 py-12 text-center sm:px-12 sm:py-14">
            <h2 className="text-3xl font-semibold tracking-[-0.025em]">
              Siap mulai belajar?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">
              Buat akun gratis dan buka dashboard belajarmu sekarang.
            </p>
            <Suspense fallback={<CtaFallback className="mt-7" />}>
              <BottomAction />
            </Suspense>
          </div>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © <Year /> NetworkLab
          </p>
          <p>Platform belajar jaringan komputer.</p>
        </div>
      </footer>
    </div>
  );
}

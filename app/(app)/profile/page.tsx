import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import { connection } from "next/server";
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui";
import EditProfileModal from "@/components/EditProfileModal";
import SkillIcon from "@/components/SkillIcon";
import SocialIcon from "@/components/SocialIcon";
import UserAvatar from "@/components/UserAvatar";
import VerifyEmail from "@/components/VerifyEmail";
import { getCurrentUser } from "@/lib/auth";
import { getVerificationStatus } from "@/lib/email-verification";
import { getProfileExtras } from "@/lib/profile-extra";
import { SKILL_GROUPS } from "@/lib/skills";
import { SOCIAL_PLATFORMS } from "@/lib/socials";
import AccountActions from "@/components/AccountActions";
import AdminBadge from "@/components/AdminBadge";
import { isAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Profil" };

// Font khusus bio: serif italic ala kutipan.
const quoteFont = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  display: "swap",
});

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  // Cooldown kirim ulang memakai Date.now(), jadi halaman harus dirender saat request.
  await connection();

  // Layout (app) sudah menjamin user login.
  const user = await getCurrentUser();
  if (!user) return null;

  const { verified } = await searchParams;
  const { bio, skills, socials } = getProfileExtras(user.id);
  const { verifiedAt, retryAfter } = getVerificationStatus(user.id);
  const admin = isAdmin(user.email, verifiedAt);

  // created_at disimpan SQLite sebagai UTC "YYYY-MM-DD HH:MM:SS".
  const joined = new Date(
    user.created_at.replace(" ", "T") + "Z",
  ).toLocaleDateString("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  });

  const groups = SKILL_GROUPS.map((g) => ({
    ...g,
    skills: g.skills.filter((s) => skills.includes(s.id)),
  })).filter((g) => g.skills.length > 0);

  const links = SOCIAL_PLATFORMS.filter((p) => socials[p.id]);

  return (
    <div className="mx-auto grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[320px_1fr]">
      {/* Hasil klik link verifikasi */}
      {verified === "1" && (
        <p
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-sm text-emerald-400 lg:col-span-2"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          Email kamu berhasil diverifikasi.
        </p>
      )}
      {verified === "error" && (
        <p
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-400 lg:col-span-2"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden />
          Link verifikasi tidak valid atau sudah kedaluwarsa. Kirim ulang dari
          profil.
        </p>
      )}

      {/* Kiri: identitas & kontak (menempel saat scroll di layar lebar) */}
      <Card className="relative overflow-hidden p-0 lg:sticky lg:top-6">
        {/* Cahaya lembut di atas kartu, memudar ke transparan (tanpa tepi keras) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/20 to-transparent"
        />

        <div className="relative px-6 pb-6 pt-8">
          {/* Avatar dengan border gradient bersih */}
          <div className="m-0.5 w-fit rounded-full ring-1 ring-accent/60 ring-offset-2 ring-offset-transparent [&>*]:rounded-full">
            <UserAvatar
              name={user.name}
              version={user.avatar_updated}
              className="size-24 text-3xl"
            />
          </div>

          <h1 className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-xl font-semibold tracking-tight">
            {user.name}
            {admin && <AdminBadge />}
          </h1>
          <p className="mt-0.5 break-all text-sm text-muted">{user.email}</p>
          <VerifyEmail verifiedAt={verifiedAt} retryAfter={retryAfter} />

          <div className="mt-5 [&>button]:w-full [&>button]:justify-center">
            <EditProfileModal
              name={user.name}
              email={user.email}
              avatarVersion={user.avatar_updated}
              bio={bio}
              skills={skills}
              socials={socials}
            />
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
              Sosial media
            </p>
            {links.length > 0 ? (
              <ul className="-mx-2 space-y-0.5">
                {links.map((p) => (
                  <li key={p.id}>
                    <a
                      href={socials[p.id]}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm outline-none transition-colors hover:bg-fg/5 focus-visible:bg-fg/5 focus-visible:ring-2 focus-visible:ring-accent/60"
                    >
                      <SocialIcon id={p.id} className="size-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium leading-tight">
                          {p.label}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {socials[p.id].replace(/^https:\/\/(www\.)?/, "")}
                        </span>
                      </span>
                      <ArrowUpRight
                        className="size-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        aria-hidden
                      />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">
                Belum ada link. Tambahkan lewat tombol Edit profil.
              </p>
            )}
          </div>
          {/* Ringkasan singkat */}
          <p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
            <CalendarDays className="size-4 shrink-0" aria-hidden />
            <span>
              Bergabung sejak{" "}
              <span className="font-medium text-fg/90">{joined}</span>
            </span>
          </p>

          <AccountActions email={user.email} />
        </div>
      </Card>

      {/* Kanan: bio & skill */}
      <div className="space-y-6">
        <Card className="relative overflow-hidden p-6 sm:p-8">
          <span
            aria-hidden
            className={`${quoteFont.className} pointer-events-none absolute -top-1 right-5 select-none text-7xl leading-none text-accent/15`}
          >
            ”
          </span>
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
            Tentang
          </h2>
          {bio ? (
            <blockquote
              className={`${quoteFont.className} relative mt-3 max-w-prose whitespace-pre-line break-words border-l-2 border-accent/50 pl-4 text-[17px] italic leading-relaxed text-fg/85 sm:text-lg`}
            >
              {bio}
            </blockquote>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Belum ada bio. Ceritakan singkat siapa kamu dan apa yang sedang
              dipelajari lewat tombol Edit profil.
            </p>
          )}
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold sm:text-lg">Skill</h2>
            {skills.length > 0 && (
              <span className="text-xs text-muted">{skills.length} skill</span>
            )}
          </div>

          {groups.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              Belum ada skill. Tambahkan lewat tombol Edit profil supaya
              profilmu lebih lengkap.
            </p>
          ) : (
            <div className="mt-5 divide-y divide-line">
              {groups.map((g) => (
                <section
                  key={g.id}
                  aria-label={g.title}
                  className="grid gap-3 py-5 first:pt-0 last:pb-0 sm:grid-cols-[130px_1fr] sm:gap-6"
                >
                  <p className="pt-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                    {g.title}
                    <span className="ml-1.5 normal-case tracking-normal text-muted/70">
                      {g.skills.length}
                    </span>
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {g.skills.map((s) => (
                      <li
                        key={s.id}
                        className="inline-flex items-center gap-2 rounded-lg border border-line bg-fg/5 px-3 py-1.5 text-sm transition-colors hover:border-accent/40 hover:bg-accent/10"
                      >
                        <SkillIcon id={s.id} />
                        {s.label}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

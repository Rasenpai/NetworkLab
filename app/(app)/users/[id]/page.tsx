import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Newsreader } from "next/font/google";
import { connection } from "next/server";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui";
import AdminBadge from "@/components/AdminBadge";
import PersonAvatar from "@/components/PersonAvatar";
import SkillIcon from "@/components/SkillIcon";
import SocialIcon from "@/components/SocialIcon";
import { getCurrentUser } from "@/lib/auth";
import { getPublicProfile } from "@/lib/chat";
import { SKILL_GROUPS } from "@/lib/skills";
import { SOCIAL_PLATFORMS } from "@/lib/socials";

export const metadata: Metadata = { title: "Profil user" };

const quoteFont = Newsreader({
  subsets: ["latin"],
  style: ["italic"],
  display: "swap",
});

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const me = await getCurrentUser();
  if (!me) return null;

  const uid = Number((await params).id);
  if (!Number.isInteger(uid) || uid < 1) notFound();
  if (uid === me.id) redirect("/profile");

  const u = getPublicProfile(uid);
  if (!u) notFound();

  // created_at disimpan SQLite sebagai UTC "YYYY-MM-DD HH:MM:SS".
  const joined = new Date(
    u.createdAt.replace(" ", "T") + "Z",
  ).toLocaleDateString("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  });

  const groups = SKILL_GROUPS.map((g) => ({
    ...g,
    skills: g.skills.filter((s) => u.skills.includes(s.id)),
  })).filter((g) => g.skills.length > 0);

  const links = SOCIAL_PLATFORMS.filter((p) => u.socials[p.id]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg text-sm text-muted outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Semua user
      </Link>

      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
        {/* Kiri: identitas */}
        <Card className="relative overflow-hidden p-0 lg:sticky lg:top-24">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-accent/20 to-transparent"
          />
          <div className="relative px-6 pb-6 pt-8">
            <div className="m-0.5 w-fit rounded-full ring-1 ring-accent/60 ring-offset-2 ring-offset-transparent">
              <PersonAvatar
                id={u.id}
                name={u.name}
                version={u.avatarVersion}
                className="size-24 text-3xl"
              />
            </div>

            <h1 className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-xl font-semibold tracking-tight">
              {u.name}
              {u.admin && <AdminBadge />}
            </h1>

            {u.verified && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <BadgeCheck className="size-3.5" aria-hidden />
                Terverifikasi
              </p>
            )}

            <Link
              href={`/users/${u.id}/chat`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <MessageCircle className="size-4" aria-hidden />
              Kirim pesan
            </Link>

            <div className="mt-6 border-t border-line pt-5">
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                Sosial media
              </p>
              {links.length > 0 ? (
                <ul className="-mx-2 space-y-0.5">
                  {links.map((p) => (
                    <li key={p.id}>
                      <a
                        href={u.socials[p.id]}
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
                            {u.socials[p.id].replace(/^https:\/\/(www\.)?/, "")}
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
                <p className="text-sm text-muted">Belum ada link.</p>
              )}
            </div>
            <p className="mt-6 flex items-center gap-2 border-t border-line pt-5 text-sm text-muted">
              <CalendarDays className="size-4 shrink-0" aria-hidden />
              <span>
                Bergabung sejak{" "}
                <span className="font-medium text-fg/90">{joined}</span>
              </span>
            </p>
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
            {u.bio ? (
              <blockquote
                className={`${quoteFont.className} relative mt-3 max-w-prose whitespace-pre-line break-words border-l-2 border-accent/50 pl-4 text-[17px] italic leading-relaxed text-fg/85 sm:text-lg`}
              >
                {u.bio}
              </blockquote>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {u.name} belum menulis bio.
              </p>
            )}
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold sm:text-lg">Skill</h2>
              {u.skills.length > 0 && (
                <span className="text-xs text-muted">
                  {u.skills.length} skill
                </span>
              )}
            </div>

            {groups.length === 0 ? (
              <p className="mt-4 text-sm text-muted">
                {u.name} belum menambahkan skill.
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
                          className="inline-flex items-center gap-2 rounded-lg border border-line bg-fg/5 px-3 py-1.5 text-sm"
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
    </div>
  );
}

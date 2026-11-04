import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { MessageCircle, Search, UserRound } from "lucide-react";
import { Card } from "@/components/ui";
import AdminBadge from "@/components/AdminBadge";
import PersonAvatar from "@/components/PersonAvatar";
import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/chat";
import { formatShort } from "@/lib/chat-format";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Waktu pesan terakhir dibandingkan dengan "sekarang", jadi dirender saat request.
  await connection();

  const me = await getCurrentUser();
  if (!me) return null;

  const { q = "" } = await searchParams;
  const query = q.trim().slice(0, 50);
  const users = listUsers(me.id, query);
  const now = Date.now();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Users
        </h1>
        <p className="mt-1.5 text-sm text-muted sm:text-base">
          Lihat profil anggota NetworkLab dan kirim pesan langsung.
        </p>
      </header>

      <form action="/users" role="search" className="mb-4">
        <label htmlFor="user-search" className="sr-only">
          Cari user
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            id="user-search"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={50}
            placeholder="Cari nama…"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60 focus-visible:ring-2 focus-visible:ring-accent/40"
          />
        </div>
      </form>

      <p className="mb-3 text-xs text-muted" aria-live="polite">
        {query
          ? `${users.length} hasil untuk “${query}”`
          : `${users.length} user`}
        {query && (
          <>
            {" · "}
            <Link href="/users" className="text-accent hover:underline">
              Hapus pencarian
            </Link>
          </>
        )}
      </p>

      {users.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="font-medium">
            {query ? "Tidak ada user dengan nama itu." : "Belum ada user lain."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {query
              ? "Coba kata lain atau periksa ejaannya."
              : "Ajak temanmu bergabung supaya bisa saling chat."}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-line overflow-hidden">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5"
            >
              <Link
                href={`/users/${u.id}`}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60 sm:gap-4"
              >
                <PersonAvatar
                  id={u.id}
                  name={u.name}
                  version={u.avatarVersion}
                  className="size-12 text-base"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="truncate font-medium group-hover:text-accent">
                      {u.name}
                    </span>
                    {u.admin && <AdminBadge />}
                  </span>
                  <span
                    className={`mt-0.5 block truncate text-sm ${
                      u.unread > 0 ? "font-medium text-fg" : "text-muted"
                    }`}
                  >
                    {u.lastBody
                      ? `${u.lastMine ? "Kamu: " : ""}${u.lastBody.replace(/\s+/g, " ")}`
                      : "Belum ada pesan"}
                  </span>
                </span>
                {u.lastAt && (
                  <span className="hidden shrink-0 self-start pt-1 text-xs tabular-nums text-muted sm:block">
                    {formatShort(u.lastAt, now)}
                  </span>
                )}
              </Link>

              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/users/${u.id}`}
                  aria-label={`Lihat profil ${u.name}`}
                  className="inline-flex size-10 items-center justify-center rounded-lg border border-line text-muted outline-none transition-colors hover:bg-fg/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm sm:font-medium"
                >
                  <UserRound className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Profil</span>
                </Link>
                <Link
                  href={`/users/${u.id}/chat`}
                  aria-label={
                    u.unread > 0
                      ? `Chat dengan ${u.name}, ${u.unread} pesan belum dibaca`
                      : `Chat dengan ${u.name}`
                  }
                  className="relative inline-flex size-10 items-center justify-center rounded-lg bg-accent text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/60 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm sm:font-medium"
                >
                  <MessageCircle className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Chat</span>
                  {u.unread > 0 && (
                    <span
                      aria-hidden
                      className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full border-2 border-card bg-red-500 px-1 text-[11px] font-semibold leading-4 text-white"
                    >
                      {u.unread > 99 ? "99+" : u.unread}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

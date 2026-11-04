"use client";

import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Activity,
  BookMarked,
  Calculator,
  ClipboardCheck,
  FileCode2,
  Download,
  Flame,
  FolderKanban,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Route,
  Search,
  ServerCog,
  Terminal,
  User,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import UserMenu from "@/components/UserMenu";
import { useUser } from "@/components/UserProvider";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };
type Entry = NavItem & { group: string };

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Belajar",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/learning-path", label: "Learning Path", icon: Route },
      { href: "/roadmap", label: "Roadmap", icon: MapIcon },
    ],
  },
  {
    label: "Praktik",
    items: [
      {
        href: "/latihan-konfigurasi",
        label: "Latihan Konfigurasi",
        icon: ServerCog,
      },
      { href: "/troubleshooting", label: "Troubleshooting", icon: Wrench },
      { href: "/noc-simulasi", label: "NOC Simulasi", icon: Activity },
      { href: "/quiz", label: "Quiz & Exam", icon: ClipboardCheck },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/commands", label: "Command Library", icon: Terminal },
      {
        href: "/subnet-calculator",
        label: "Subnet Calculator",
        icon: Calculator,
      },
      { href: "/cheatsheet", label: "Cheatsheet", icon: BookMarked },
      { href: "/config-generator", label: "Config Generator", icon: FileCode2 },
      { href: "/resources", label: "Resources", icon: Download },
    ],
  },
  {
    label: "Akun",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/portfolio", label: "My Portfolio", icon: FolderKanban },
    ],
  },
];

const NAV: Entry[] = NAV_GROUPS.flatMap((g) =>
  g.items.map((i) => ({ ...i, group: g.label })),
);

// Halaman yang tidak ada di sidebar, tapi tetap punya judul di topbar dan bisa dicari.
const EXTRA: Entry[] = [
  { href: "/profile", label: "Profil", icon: User, group: "Akun" },
];

const SEARCHABLE: Entry[] = [...NAV, ...EXTRA];

function isActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ───────────── Hooks ───────────── */

/** Kunci scroll halaman selagi drawer terbuka. */
function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

const noopSubscribe = () => () => {};

/** Aman untuk SSR: server selalu "false", client membaca platform setelah hydrate. */
function useIsMac() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/i.test(navigator.userAgent),
    () => false,
  );
}

/* ───────────── Logo ───────────── */

// Font khusus nama brand, supaya beda dari teks menu.
const brandFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/** Tiga node yang saling terhubung (topologi mesh) di kotak aksen. */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="11" className="fill-accent" />
      {/* sisi luar mesh, dibuat samar */}
      <path
        d="M20 9.5 31 28.5H9L20 9.5Z"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* jalur dari node pusat ke tiap node luar */}
      <path
        d="M20 22V9.5M20 22 9 28.5M20 22l11 6.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="3.2" fill="white" />
      <circle cx="20" cy="9.5" r="2.4" fill="white" />
      <circle cx="9" cy="28.5" r="2.4" fill="white" />
      <circle cx="31" cy="28.5" r="2.4" fill="white" />
    </svg>
  );
}

/* ───────────── Sidebar ───────────── */

function SidebarContent({
  pathname,
  onNavigate,
  onClose,
  closeRef,
}: {
  pathname: string;
  onNavigate?: () => void;
  onClose?: () => void;
  closeRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative flex h-[72px] shrink-0 items-center justify-between border-b border-line px-5">
        {/* Cahaya lembut di belakang logo, memudar ke kanan */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent/10 to-transparent"
        />
        <Link
          href="/dashboard"
          onClick={onNavigate}
          aria-label="NetworkLab, ke dashboard"
          className="relative flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <LogoMark className="size-10 shrink-0" />
          <span className="flex flex-col leading-none">
            <span
              className={`${brandFont.className} text-[21px] font-bold tracking-[-0.03em]`}
            >
              Network<span className="text-accent">Lab</span>
            </span>
            <span className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted/80">
              Learn · Build · Fix
            </span>
          </span>
        </Link>
        {onClose && (
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="rounded-lg p-2.5 text-muted outline-none hover:bg-white/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav
        aria-label="Menu utama"
        className="flex-1 overflow-y-auto px-3 pb-6 pt-2 [scrollbar-width:thin]"
      >
        {NAV_GROUPS.map((group, i) => (
          <div
            key={group.label}
            role="group"
            aria-label={group.label}
            className={i > 0 ? "mt-5" : ""}
          >
            <p
              aria-hidden
              className="px-3 pb-2 text-xs font-medium uppercase tracking-wider text-muted/70"
            >
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href, pathname);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/60 ${
                      active
                        ? "bg-accent/15 text-white ring-1 ring-accent/30"
                        : "text-muted hover:bg-white/5 hover:text-fg"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute -left-3 inset-y-2 w-1 rounded-r-full bg-accent"
                      />
                    )}
                    <Icon
                      aria-hidden
                      className={`size-[18px] ${active ? "text-accent" : "group-hover:text-accent"}`}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

/* ───────────── Command palette (Ctrl/⌘ + K) ───────────── */

function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCHABLE;
    return SEARCHABLE.filter(
      (e) =>
        e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q),
    );
  }, [query]);

  const active = results.length ? Math.min(cursor, results.length - 1) : -1;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function go(entry: Entry) {
    router.push(entry.href);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((active + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((active - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[active]);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Tutup pencarian"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cari halaman"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-card shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search aria-hidden className="size-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 ? `palette-opt-${active}` : undefined
            }
            placeholder="Cari halaman…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted/60"
          />
          <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-sans text-[11px] text-muted sm:block">
            Esc
          </kbd>
        </div>

        {results.length ? (
          <ul
            id="palette-list"
            ref={listRef}
            role="listbox"
            aria-label="Halaman"
            className="max-h-72 overflow-y-auto p-2"
          >
            {results.map((e, i) => {
              const Icon = e.icon;
              return (
                <li
                  key={e.href}
                  id={`palette-opt-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setCursor(i)}
                  onClick={() => go(e)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    i === active ? "bg-accent/15 text-white" : "text-muted"
                  }`}
                >
                  <Icon
                    aria-hidden
                    className={`size-[18px] shrink-0 ${i === active ? "text-accent" : ""}`}
                  />
                  <span className="flex-1 truncate">{e.label}</span>
                  {isActive(e.href, pathname) ? (
                    <span className="text-xs text-accent">Sedang dibuka</span>
                  ) : (
                    <span className="text-xs text-muted/70">{e.group}</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-muted">
            Tidak ada halaman bernama “{query.trim()}”. Coba kata lain, misalnya
            “subnet” atau “quiz”.
          </p>
        )}

        <div className="hidden items-center gap-4 border-t border-line px-4 py-2.5 text-[11px] text-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">
              ↑
            </kbd>
            <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">
              ↓
            </kbd>
            pilih
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-line px-1.5 py-0.5 font-sans">
              Enter
            </kbd>
            buka
          </span>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Shell ───────────── */

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { streak } = useUser();
  const isMac = useIsMac();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const searchBtnRef = useRef<HTMLButtonElement>(null);

  useScrollLock(open);

  const current = SEARCHABLE.find((e) => isActive(e.href, pathname));
  const title = current?.label ?? "NetworkLab";

  // Fokus dikembalikan setelah `inert` dilepas (frame berikutnya).
  const refocus = (ref: React.RefObject<HTMLButtonElement | null>) =>
    requestAnimationFrame(() => ref.current?.focus());

  function closeDrawer() {
    setOpen(false);
    refocus(menuBtnRef);
  }

  function closePalette() {
    setPaletteOpen(false);
    refocus(searchBtnRef);
  }

  // Ctrl/⌘ + K membuka atau menutup pencarian dari mana saja.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(false);
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Drawer: fokus ke tombol tutup, Esc menutup.
  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        requestAnimationFrame(() => menuBtnRef.current?.focus());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Layar melebar ke desktop saat drawer terbuka: tutup supaya scroll tidak terkunci.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        inert={open || paletteOpen || undefined}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Lewati ke konten
      </a>

      {/* Sidebar desktop */}
      <aside
        inert={paletteOpen || undefined}
        className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-card lg:block"
      >
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Sidebar mobile (drawer). Tetap ter-mount supaya bisa dianimasikan.
          Muncul seketika (agar fokus bisa dipindah), baru disembunyikan setelah animasi keluar. */}
      <div
        className={`fixed inset-0 z-50 transition-[visibility] duration-0 lg:hidden ${
          open ? "visible" : "invisible delay-300"
        }`}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Tutup menu"
          onClick={closeDrawer}
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-line bg-card shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            pathname={pathname}
            onNavigate={() => setOpen(false)}
            onClose={closeDrawer}
            closeRef={closeBtnRef}
          />
        </div>
      </div>

      <div inert={open || paletteOpen || undefined} className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button
              ref={menuBtnRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Buka menu"
              aria-expanded={open}
              className="-ml-2 rounded-lg p-2.5 text-muted outline-none hover:bg-white/5 hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="flex min-w-0 items-baseline gap-2">
              {current && (
                <>
                  <span className="hidden text-sm text-muted sm:inline">
                    {current.group}
                  </span>
                  <span aria-hidden className="hidden text-muted/40 sm:inline">
                    /
                  </span>
                </>
              )}
              <h2 className="truncate text-base font-semibold sm:text-lg">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              ref={searchBtnRef}
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Cari halaman"
              aria-keyshortcuts="Control+K Meta+K"
              className="inline-flex size-10 items-center justify-center gap-2 rounded-xl border border-line bg-card text-muted outline-none transition-colors hover:text-fg focus-visible:ring-2 focus-visible:ring-accent/60 md:h-9 md:w-56 md:justify-start md:px-3"
            >
              <Search aria-hidden className="size-4" />
              <span className="hidden flex-1 text-left text-sm md:inline">
                Cari halaman…
              </span>
              <kbd className="hidden rounded border border-line px-1.5 py-0.5 font-sans text-[11px] md:inline">
                {isMac ? "⌘K" : "Ctrl K"}
              </kbd>
            </button>

            <div className="flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1.5 text-sm">
              <Flame
                aria-hidden
                className={`size-4 ${streak > 0 ? "text-orange-400" : "text-muted"}`}
              />
              <span className="font-medium tabular-nums">{streak}</span>
              <span className="hidden sm:inline">
                <span className="font-medium">hari</span>{" "}
                <span className="text-muted">streak</span>
              </span>
              <span className="sr-only sm:hidden">hari streak</span>
            </div>
            <UserMenu />
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </main>
      </div>

      {paletteOpen && <CommandPalette onClose={closePalette} />}
    </div>
  );
}

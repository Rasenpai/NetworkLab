import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Clock, Server } from "lucide-react";
import { labs, type Lab, type Vendor } from "@/lib/data";
import { findLabSpec } from "@/lib/lab/labs";
import {
  getMyLabProgress,
  type LabProgress,
  type LabStatus,
} from "@/lib/lab/status";
import {
  Badge,
  Card,
  LevelBadge,
  PageHeader,
  SectionTitle,
  VendorBadge,
} from "@/components/ui";

export const metadata: Metadata = { title: "Virtual Lab" };

const statusStyle: Record<LabStatus, string> = {
  "Belum dimulai": "border-line bg-white/5 text-muted",
  Berjalan: "border-accent/30 bg-accent/15 text-purple-300",
  Selesai: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
};

type ProgressMap = Record<string, LabProgress>;

function LabCard({ lab, progress }: { lab: Lab; progress: ProgressMap }) {
  const spec = findLabSpec(lab);

  // Status berasal dari database user, bukan dari data statis di lib/data.ts.
  const p: LabProgress | null = spec
    ? (progress[spec.id] ?? {
        status: "Belum dimulai",
        passed: 0,
        total: spec.tasks.length,
      })
    : null;
  const status: LabStatus = p?.status ?? "Belum dimulai";

  const card = (
    <Card
      className={`flex w-full flex-col p-5 transition-colors ${
        spec ? "hover:border-accent/40" : "opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <VendorBadge vendor={lab.vendor} />
        <LevelBadge level={lab.level} />
        <span className="ml-auto" />
        <Badge className={statusStyle[status]}>{status}</Badge>
      </div>
      <h4 className="mt-3 font-semibold leading-snug">{lab.title}</h4>
      <p className="mt-1.5 text-sm text-muted">{lab.description}</p>

      {p && p.total > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Tugas</span>
            <span>
              {p.passed}/{p.total} selesai
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className={`h-full rounded-full transition-all ${
                p.status === "Selesai" ? "bg-emerald-400" : "bg-accent"
              }`}
              style={{ width: `${(p.passed / p.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center gap-4 pt-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Server className="size-3.5" /> {lab.devices} perangkat
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {lab.minutes} mnt
        </span>
        <span className={`ml-auto font-medium ${spec ? "text-accent" : ""}`}>
          {spec
            ? status === "Selesai"
              ? "Buka lagi"
              : status === "Berjalan"
                ? "Lanjutkan"
                : "Buka lab"
            : "Segera hadir"}
        </span>
      </div>
    </Card>
  );

  if (!spec) return card;
  return (
    <Link
      href={`/latihan-konfigurasi/${spec.id}`}
      className="flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
    >
      {card}
    </Link>
  );
}

const SECTIONS: { kind: Lab["kind"]; hint: string }[] = [
  { kind: "Simulasi", hint: "Latihan konfigurasi langkah demi langkah" },
  {
    kind: "Studi Kasus",
    hint: "Skenario jaringan nyata dengan kebutuhan bisnis",
  },
];

const VENDOR_TABS: { vendor: Vendor; param: string }[] = [
  { vendor: "MikroTik", param: "mikrotik" },
  { vendor: "Cisco", param: "cisco" },
];

type SearchParams = Promise<{ vendor?: string | string[] }>;

function VendorTabs({ active }: { active: Vendor }) {
  return (
    <div
      role="tablist"
      aria-label="Pilih vendor"
      className="mb-6 inline-flex gap-1 rounded-xl border border-line bg-card p-1"
    >
      {VENDOR_TABS.map(({ vendor, param }) => {
        const isActive = vendor === active;
        const count = labs.filter((l) => l.vendor === vendor).length;
        return (
          <Link
            key={vendor}
            role="tab"
            aria-selected={isActive}
            href={`?vendor=${param}`}
            scroll={false}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
              isActive
                ? "bg-accent/15 text-purple-300"
                : "text-muted hover:text-foreground"
            }`}
          >
            {vendor}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs ${
                isActive ? "bg-accent/20" : "bg-white/5"
              }`}
            >
              {count}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Bagian yang membaca data user (cookie) dan searchParams, jadi dibungkus Suspense di bawah. */
async function LabSections({ searchParams }: { searchParams: SearchParams }) {
  const [{ vendor: vendorParam }, progress] = await Promise.all([
    searchParams,
    getMyLabProgress(),
  ]);

  const raw = Array.isArray(vendorParam) ? vendorParam[0] : vendorParam;
  const vendor: Vendor = raw?.toLowerCase() === "cisco" ? "Cisco" : "MikroTik";
  const vendorLabs = labs.filter((l) => l.vendor === vendor);

  return (
    <>
      <VendorTabs active={vendor} />
      <div className="space-y-8" role="tabpanel">
        {SECTIONS.map(({ kind, hint }) => {
          const list = vendorLabs.filter((l) => l.kind === kind);
          if (list.length === 0) return null;
          return (
            <section key={kind}>
              <SectionTitle title={`${kind} (${list.length})`} hint={hint} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((l) => (
                  <LabCard key={l.id} lab={l} progress={progress} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function LabSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-line bg-card"
        />
      ))}
    </div>
  );
}

export default function VirtualLabPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader
        title="Virtual Lab"
        description="Daftar simulasi dan studi kasus untuk mempraktikkan konfigurasi MikroTik dan Cisco tanpa perangkat fisik."
      />
      <Suspense fallback={<LabSkeleton />}>
        <LabSections searchParams={searchParams} />
      </Suspense>
    </>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { Calendar, Check, FolderKanban, Minus, Server } from "lucide-react";
import { projects, type Project } from "@/lib/data";
import { getMyPortfolioItems } from "@/lib/portfolio";
import {
  Badge,
  Card,
  PageHeader,
  StatCard,
  VendorBadge,
} from "@/components/ui";

export const metadata: Metadata = { title: "My Portfolio" };

type Entry = Project & {
  fromLab?: boolean;
  topology?: string;
  config?: string;
};

function DocChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs ${
        ok ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-muted"
      }`}
    >
      {ok ? <Check className="size-3" /> : <Minus className="size-3" />}
      {label}
    </span>
  );
}

function Snippet({ title, text }: { title: string; text: string }) {
  return (
    <details className="rounded-lg border border-line bg-bg/60">
      <summary className="cursor-pointer px-3 py-2 text-xs text-muted hover:text-fg">
        {title}
      </summary>
      <pre className="max-h-72 overflow-auto whitespace-pre border-t border-line px-3 py-2 font-mono text-xs leading-relaxed">
        {text}
      </pre>
    </details>
  );
}

function ProjectCard({ project }: { project: Entry }) {
  const done = project.status === "Selesai";
  return (
    <Card className="flex flex-col p-5 transition-colors hover:border-accent/40">
      <div className="flex flex-wrap items-center gap-2">
        <VendorBadge vendor={project.vendor} />
        {project.fromLab && <Badge>Dari lab</Badge>}
        <span className="ml-auto" />
        <Badge
          className={
            done
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-amber-400/20 bg-amber-400/10 text-amber-300"
          }
        >
          {project.status}
        </Badge>
      </div>
      <h4 className="mt-3 font-semibold leading-snug">{project.title}</h4>
      <p className="mt-1.5 text-sm text-muted">{project.summary}</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <Server className="size-3.5" /> {project.setup}
        </span>
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" /> {project.date}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tags.map((t) => (
          <Badge key={t}>{t}</Badge>
        ))}
      </div>

      {(project.topology || project.config) && (
        <div className="mt-4 space-y-2">
          {project.topology && (
            <Snippet title="Lihat topologi" text={project.topology} />
          )}
          {project.config && (
            <Snippet title="Lihat konfigurasi" text={project.config} />
          )}
        </div>
      )}

      <div className="mt-4 border-t border-line pt-4">
        <p className="mb-2 text-xs text-muted">Dokumentasi</p>
        <div className="flex flex-wrap gap-2">
          <DocChip label="Topologi" ok={project.docs.topology} />
          <DocChip label="Konfigurasi" ok={project.docs.config} />
          <DocChip label="Pengujian" ok={project.docs.test} />
        </div>
      </div>
    </Card>
  );
}

async function PortfolioContent() {
  const mine = await getMyPortfolioItems();
  const fromLabs: Entry[] = mine.map((m) => ({
    id: `lab-${m.labId}`,
    title: m.title,
    vendor: m.vendor,
    status: "Selesai",
    date: m.date,
    summary: m.summary,
    setup: m.setup,
    tags: m.tags,
    docs: { topology: true, config: true, test: true },
    fromLab: true,
    topology: m.topology,
    config: m.config,
  }));
  const all: Entry[] = [...fromLabs, ...projects];

  const finished = all.filter((p) => p.status === "Selesai").length;
  const mikrotik = all.filter((p) => p.vendor === "MikroTik").length;
  const cisco = all.length - mikrotik;

  return (
    <>
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={FolderKanban}
          label="Total Project"
          value={`${all.length}`}
          hint={`${finished} selesai`}
        />
        <StatCard
          icon={Server}
          label="MikroTik"
          value={`${mikrotik}`}
          hint="project"
        />
        <StatCard
          icon={Server}
          label="Cisco"
          value={`${cisco}`}
          hint="project"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {all.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </>
  );
}

export default function PortfolioPage() {
  return (
    <>
      <PageHeader
        title="My Portfolio"
        description="Dokumentasi project jaringan yang sudah dan sedang kamu kerjakan: topologi, konfigurasi, dan hasil pengujian."
      />
      <Suspense
        fallback={<p className="text-sm text-muted">Memuat portofolio…</p>}
      >
        <PortfolioContent />
      </Suspense>
    </>
  );
}

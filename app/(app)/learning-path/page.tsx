import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  BookOpen,
  ChevronRight,
  CircleCheck,
  Clock,
  Layers,
} from "lucide-react";
import { catalog, moduleHref, type CatalogModule } from "@/lib/catalog";
import {
  avgProgress,
  courses as baseCourses,
  formatDuration,
  LEVELS,
  levelInfo,
} from "@/lib/data";
import { getMyLearning } from "@/lib/learning";
import {
  learningTracks,
  type PathStage,
  type PathTrack,
  type PathVendor,
} from "@/lib/learning-path";
import {
  Badge,
  Card,
  LevelBadge,
  PageHeader,
  ProgressBar,
  ProgressRing,
  StatCard,
  VendorBadge,
} from "@/components/ui";

export const metadata: Metadata = { title: "Learning Path" };

type Item = CatalogModule & { progress: number };

type SearchParams = Promise<{ jalur?: string }>;

function VendorTag({ vendor }: { vendor: PathVendor }) {
  return vendor === "Umum" ? (
    <Badge>Umum</Badge>
  ) : (
    <VendorBadge vendor={vendor} />
  );
}

function ModuleRow({ item }: { item: Item }) {
  const action =
    item.progress === 100
      ? "Ulangi"
      : item.progress > 0
        ? "Lanjutkan"
        : "Mulai";
  return (
    <li>
      <Link
        href={moduleHref(item.id)}
        className="group flex flex-col gap-3 rounded-xl border border-line bg-bg/50 p-3.5 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {item.progress === 100 ? (
            <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          ) : (
            <span
              className={`mt-0.5 size-5 shrink-0 rounded-full border-2 ${
                item.progress > 0 ? "border-accent" : "border-line"
              }`}
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">
              {item.description}
            </p>
            <p className="mt-1 text-xs text-muted">
              {item.lessons} bab · {formatDuration(item.minutes)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:w-80">
          <VendorTag vendor={item.vendor} />
          <ProgressBar value={item.progress} className="flex-1" />
          <span className="w-9 text-right text-xs text-muted">
            {item.progress}%
          </span>
          <span className="flex items-center gap-0.5 text-xs font-medium text-accent">
            {action}
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}

function Tabs({ active }: { active: string }) {
  const tabs = [
    ...learningTracks.map((t) => ({ id: t.id as string, label: t.title })),
    { id: "level", label: "Per Level" },
  ];
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <Link
          key={t.id}
          href={`?jalur=${t.id}`}
          aria-current={active === t.id ? "page" : undefined}
          className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
            active === t.id
              ? "border-accent bg-accent text-white"
              : "border-line bg-card text-muted hover:border-accent/40 hover:text-fg"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

function StageCard({
  stage,
  index,
  items,
}: {
  stage: PathStage;
  index: number;
  items: Item[];
}) {
  const minutes = items.reduce((s, c) => s + c.minutes, 0);
  const done = items.filter((c) => c.progress === 100).length;
  const progress = avgProgress(items);
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-lg font-semibold text-accent">
            {index + 1}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{stage.title}</h3>
              <LevelBadge level={stage.level} />
            </div>
            <p className="mt-1 text-sm text-muted">{stage.goal}</p>
            <p className="mt-1 text-xs text-muted">
              {items.length} materi · {formatDuration(minutes)} · {done} selesai
            </p>
          </div>
        </div>
        <div className="w-full sm:w-44">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">Progres tahap</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <ProgressBar value={progress} />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-line bg-bg/50 p-3.5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Setelah tahap ini kamu bisa
        </p>
        <p className="mt-1 text-sm">{stage.outcome}</p>
        {stage.certs && stage.certs.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Sertifikasi terkait:</span>
            {stage.certs.map((c) => (
              <Badge key={c}>{c}</Badge>
            ))}
          </div>
        )}
      </div>

      <ol className="mt-4 space-y-2">
        {items.map((item) => (
          <ModuleRow key={item.id} item={item} />
        ))}
      </ol>
    </Card>
  );
}

function TrackView({
  track,
  resolve,
}: {
  track: PathTrack;
  resolve: (ids: string[]) => Item[];
}) {
  const flat = track.stages.flatMap((stage) =>
    resolve(stage.items).map((item) => ({ stage, item })),
  );
  const all = flat.map((x) => x.item);
  const minutes = all.reduce((s, c) => s + c.minutes, 0);
  const overall = avgProgress(all);
  const certs = [...new Set(track.stages.flatMap((s) => s.certs ?? []))];
  const next = flat.find((x) => x.item.progress < 100);

  return (
    <>
      <Card className="mb-6 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProgressRing value={overall} size={104} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              {track.role}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{track.title}</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted">
              {track.description}
            </p>
            {next ? (
              <Link
                href={moduleHref(next.item.id)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent bg-accent px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {next.item.progress > 0 ? "Lanjutkan" : "Mulai"}:{" "}
                {next.item.title}
                <ChevronRight className="size-4" />
              </Link>
            ) : (
              <p className="mt-3 text-sm text-emerald-300">
                Semua materi di jalur ini sudah selesai.
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Layers}
          label="Tahap"
          value={`${track.stages.length}`}
        />
        <StatCard icon={BookOpen} label="Materi" value={`${all.length}`} />
        <StatCard
          icon={Clock}
          label="Total durasi"
          value={formatDuration(minutes)}
        />
        <StatCard
          icon={Award}
          label="Sertifikasi terkait"
          value={`${certs.length}`}
          hint={certs.slice(0, 3).join(" · ")}
        />
      </div>

      <div className="space-y-6">
        {track.stages.map((stage, idx) => (
          <StageCard
            key={stage.id}
            stage={stage}
            index={idx}
            items={resolve(stage.items)}
          />
        ))}
      </div>
    </>
  );
}

export default async function LearningPathPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Progres tiap materi diambil dari data milik user yang sedang login.
  const data = await getMyLearning();
  if (!data) return null;

  const { jalur } = await searchParams;
  const active =
    jalur === "level" || learningTracks.some((t) => t.id === jalur)
      ? (jalur as string)
      : learningTracks[0].id;

  // Progres semua modul (materi lama + modul Learning Path) dari database.
  const withProgress = (m: CatalogModule): Item => ({
    ...m,
    progress: data.progressById[m.id] ?? 0,
  });
  const items = new Map(catalog.map((m) => [m.id, withProgress(m)]));
  const resolve = (ids: string[]) =>
    ids.map((id) => items.get(id)).filter((x): x is Item => Boolean(x));

  const track = learningTracks.find((t) => t.id === active);
  const levelCourseIds = new Set(baseCourses.map((c) => String(c.id)));

  return (
    <>
      <PageHeader
        title="Learning Path"
        description="Jalur belajar terstruktur untuk Network Engineer dan NOC, dari dasar sampai mahir, dengan materi MikroTik dan Cisco."
      />

      <Tabs active={active} />

      {track ? (
        <TrackView track={track} resolve={resolve} />
      ) : (
        <div className="space-y-6">
          {LEVELS.map((level, idx) => {
            const list = [...items.values()].filter(
              (c) => c.level === level && levelCourseIds.has(c.id),
            );
            const minutes = list.reduce((s, c) => s + c.minutes, 0);
            return (
              <Card key={level} className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-lg font-semibold text-accent">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{level}</h3>
                        <LevelBadge level={level} />
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {levelInfo[level]}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {list.length} materi · {formatDuration(minutes)}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-44">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="text-muted">Progres level</span>
                      <span className="font-medium">{avgProgress(list)}%</span>
                    </div>
                    <ProgressBar value={avgProgress(list)} />
                  </div>
                </div>

                <ol className="mt-5 space-y-2">
                  {list.map((c) => (
                    <ModuleRow key={c.id} item={c} />
                  ))}
                </ol>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

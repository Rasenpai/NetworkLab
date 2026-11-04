import type { LucideIcon } from "lucide-react";
import { BookOpen, Clock } from "lucide-react";
import {
  formatDuration,
  type Course,
  type Level,
  type Vendor,
} from "@/lib/data";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 lg:mb-8">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">
        {description}
      </p>
    </div>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-card ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
      {hint && <span className="text-xs text-muted sm:text-sm">{hint}</span>}
    </div>
  );
}

export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`h-1.5 overflow-hidden rounded-full bg-line ${className}`}
    >
      <div
        className="h-full rounded-full bg-accent transition-all"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function ProgressRing({
  value,
  size = 120,
}: {
  value: number;
  size?: number;
}) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#2a2133"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#9b59b6"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold">{value}%</span>
      </div>
    </div>
  );
}

const levelStyle: Record<Level, string> = {
  Beginner: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  Intermediate: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  Advanced: "border-rose-400/20 bg-rose-400/10 text-rose-300",
};

const vendorStyle: Record<Vendor, string> = {
  MikroTik: "border-accent/30 bg-accent/15 text-purple-300",
  Cisco: "border-sky-400/20 bg-sky-400/10 text-sky-300",
};

const badgeBase =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function Badge({
  children,
  className = "border-line bg-white/5 text-muted",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={`${badgeBase} ${className}`}>{children}</span>;
}

export function LevelBadge({ level }: { level: Level }) {
  return <Badge className={levelStyle[level]}>{level}</Badge>;
}

export function VendorBadge({ vendor }: { vendor: Vendor }) {
  return <Badge className={vendorStyle[vendor]}>{vendor}</Badge>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export function CourseCard({
  course,
  footer,
}: {
  course: Course;
  footer?: React.ReactNode;
}) {
  const status =
    course.progress === 100
      ? "Selesai"
      : course.progress > 0
        ? "Sedang dipelajari"
        : "Belum dimulai";
  return (
    <Card className="flex flex-col p-5 transition-colors hover:border-accent/40">
      <div className="flex flex-wrap items-center gap-2">
        <VendorBadge vendor={course.vendor} />
        <LevelBadge level={course.level} />
      </div>
      <h4 className="mt-3 font-semibold leading-snug">{course.title}</h4>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted">
        {course.description}
      </p>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <BookOpen className="size-3.5" /> {course.lessons} bab
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" /> {formatDuration(course.minutes)}
        </span>
      </div>
      <div className="mt-auto pt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span
            className={
              course.progress === 100 ? "text-emerald-300" : "text-muted"
            }
          >
            {status}
          </span>
          <span className="font-medium">{course.progress}%</span>
        </div>
        <ProgressBar value={course.progress} />
      </div>
      {footer && <div className="mt-4 border-t border-line pt-4">{footer}</div>}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Check, Copy, Download, Plus, Trash2 } from "lucide-react";

/* ───────────── IP helpers ───────────── */

export const isIp = (s: string) =>
  /^(\d{1,3}\.){3}\d{1,3}$/.test(s) && s.split(".").every((n) => +n <= 255);

export const ipToInt = (ip: string) =>
  ip.split(".").reduce((a, o) => a * 256 + Number(o), 0);

export const intToIp = (n: number) =>
  [24, 16, 8, 0].map((s) => (n >>> s) & 255).join(".");

export function parseCidr(v: string) {
  const parts = v.trim().split("/");
  if (parts.length !== 2) return null;
  const [ip, p] = parts;
  const len = Number(p);
  if (!ip || !p || !isIp(ip) || !Number.isInteger(len)) return null;
  if (len < 0 || len > 32) return null;
  const mask = len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
  const network = (ipToInt(ip) & mask) >>> 0;
  const wildcard = ~mask >>> 0;
  return {
    ip,
    len,
    mask: intToIp(mask),
    wildcard: intToIp(wildcard),
    network: intToIp(network),
    broadcast: intToIp((network | wildcard) >>> 0),
  };
}

export type Cidr = NonNullable<ReturnType<typeof parseCidr>>;

/* ───────────── UI bits ───────────── */

export const input =
  "w-full rounded-lg border border-line bg-bg/60 px-3 py-2 text-sm text-fg placeholder:text-muted/50 outline-none transition-colors focus:border-accent/60";

export function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line bg-card p-5">
      <h3 className="text-sm font-semibold">{title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Check2({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-accent"
      />
      {label}
    </label>
  );
}

export function AddBtn({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:text-fg"
    >
      <Plus className="size-3.5" />
      {label}
    </button>
  );
}

export function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Hapus"
      className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-red-400"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

/* ───────────── Panel hasil (dipakai Cisco & MikroTik) ───────────── */

export function OutputPanel({
  text,
  issues,
  filename,
  ext,
}: {
  text: string;
  issues: string[];
  filename: string;
  ext: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard bisa diblokir; abaikan */
    }
  }

  function download() {
    const blob = new Blob([text + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-sm font-semibold">Hasil konfigurasi</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={download}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:text-fg"
            >
              <Download className="size-3.5" />.{ext}
            </button>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
            >
              {copied ? (
                <Check className="size-3.5" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copied ? "Tersalin" : "Copy"}
            </button>
          </div>
        </div>

        {issues.length > 0 && (
          <ul className="space-y-1 border-b border-line bg-amber-500/5 px-4 py-3 text-xs text-amber-300">
            {issues.map((m, i) => (
              <li key={i}>• {m}</li>
            ))}
          </ul>
        )}

        <pre className="max-h-[65vh] overflow-auto p-4 font-mono text-[13px] leading-relaxed text-fg">
          {text}
        </pre>
      </div>
    </div>
  );
}

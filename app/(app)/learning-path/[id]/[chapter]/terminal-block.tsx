"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Blok kode bergaya terminal untuk perintah shell (lang: bash, sh, shell, console).
 *
 * Aturan penulisan di materi:
 *   perintah biasa            -> ditampilkan dengan prompt "$" dan diwarnai
 *   perintah  # komentar      -> komentar di belakang perintah diredupkan
 *   # komentar satu baris     -> catatan, tanpa prompt
 *   > hasil keluaran          -> output perintah, tanpa prompt, warna polos
 *   (baris kosong)            -> spasi antar kelompok perintah
 */

type Line =
  | { kind: "blank" }
  | { kind: "comment"; text: string }
  | { kind: "out"; text: string }
  | { kind: "cmd"; cmd: string; comment?: string };

/** Pisahkan "perintah  # komentar", abaikan # di dalam tanda kutip. */
function splitComment(line: string): { cmd: string; comment?: string } {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return { cmd: line.slice(0, i), comment: line.slice(i) };
    }
  }
  return { cmd: line };
}

function parse(code: string): Line[] {
  return code
    .replace(/\r\n/g, "\n")
    .replace(/\n+$/, "")
    .split("\n")
    .map((raw): Line => {
      if (raw.trim() === "") return { kind: "blank" };
      if (raw === ">" || raw.startsWith("> ")) {
        return { kind: "out", text: raw.slice(2) };
      }
      if (raw.trimStart().startsWith("#")) {
        return { kind: "comment", text: raw.trimStart() };
      }
      return { kind: "cmd", ...splitComment(raw) };
    });
}

const TOKEN = /("[^"]*"|'[^']*'|\s+|\|\||&&|>>|[|;>]|[^\s|;&>"']+|.)/g;

function Highlight({ cmd }: { cmd: string }) {
  const parts = cmd.match(TOKEN) ?? [cmd];
  let expectCmd = true;

  return (
    <>
      {parts.map((tok, i) => {
        if (/^\s+$/.test(tok)) return <span key={i}>{tok}</span>;

        if (tok === "|" || tok === "||" || tok === "&&" || tok === ";") {
          expectCmd = true;
          return (
            <span key={i} className="text-fuchsia-300">
              {tok}
            </span>
          );
        }
        if (tok === ">" || tok === ">>") {
          return (
            <span key={i} className="text-fuchsia-300">
              {tok}
            </span>
          );
        }

        let cls = "text-zinc-100";
        if (expectCmd) {
          cls = "font-semibold text-sky-300";
          if (tok !== "sudo") expectCmd = false;
        } else if (tok.startsWith("-")) {
          cls = "text-amber-300";
        } else if (/^["']/.test(tok)) {
          cls = "text-emerald-300";
        } else if (tok.includes("/") || tok.startsWith("~")) {
          cls = "text-cyan-200";
        }
        return (
          <span key={i} className={cls}>
            {tok}
          </span>
        );
      })}
    </>
  );
}

const Gutter = ({ children }: { children?: React.ReactNode }) => (
  <span className="w-4 shrink-0 select-none text-emerald-400" aria-hidden>
    {children}
  </span>
);

export function TerminalBlock({
  code,
  title,
}: {
  code: string;
  title?: string;
}) {
  const lines = parse(code);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // Yang disalin hanya perintahnya: tanpa prompt, output, dan komentar.
  async function copy() {
    const text = lines
      .flatMap((l) =>
        l.kind === "cmd" ? [l.cmd.trimEnd()] : l.kind === "blank" ? [""] : [],
      )
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard bisa diblokir; abaikan */
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-[#0b0910] shadow-sm">
      <div className="flex items-center gap-3 border-b border-white/5 bg-white/[0.03] px-4 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-red-400/80" />
          <span className="size-2.5 rounded-full bg-amber-300/80" />
          <span className="size-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span className="flex-1 truncate text-center font-mono text-[11px] text-zinc-500">
          {title ?? "bash"}
        </span>
        <button
          type="button"
          onClick={copy}
          aria-label="Salin perintah"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-500 transition-colors hover:bg-white/5 hover:text-zinc-200"
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-400" /> Tersalin
            </>
          ) : (
            <>
              <Copy className="size-3.5" /> Salin
            </>
          )}
        </button>
      </div>

      <div className="overflow-x-auto p-4 font-mono text-[13px] leading-6">
        <div className="min-w-max">
          {lines.map((l, i) => {
            switch (l.kind) {
              case "blank":
                return <div key={i} className="h-3" />;

              case "comment":
                return (
                  <div key={i} className="flex">
                    <Gutter />
                    <span className="whitespace-pre italic text-zinc-500">
                      {l.text}
                    </span>
                  </div>
                );

              case "out":
                return (
                  <div key={i} className="flex">
                    <Gutter />
                    <span className="whitespace-pre text-zinc-300">
                      {l.text}
                    </span>
                  </div>
                );

              case "cmd":
                return (
                  <div key={i} className="flex">
                    <Gutter>$</Gutter>
                    <span className="whitespace-pre">
                      <Highlight cmd={l.cmd} />
                      {l.comment && (
                        <span className="italic text-zinc-500">
                          {l.comment}
                        </span>
                      )}
                    </span>
                  </div>
                );
            }
          })}
        </div>
      </div>
    </div>
  );
}

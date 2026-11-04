import { CircleCheck, Lightbulb, TriangleAlert } from "lucide-react";
import type { Block } from "@/lib/materials";
import { ChapterImage } from "./chapter-image";
import { ChapterVideo } from "./chapter-video";
import { TerminalBlock } from "./terminal-block";

const TERMINAL_LANGS = new Set(["bash", "sh", "shell", "zsh", "console"]);

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case "p":
      return <p className="text-sm leading-7">{block.x}</p>;

    case "h":
      return <h3 className="pt-2 text-base font-semibold">{block.x}</h3>;

    case "ul":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-7 marker:text-muted">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-7 marker:text-muted">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      );

    case "code":
      // Perintah shell tampil seperti terminal; teks lain (konfigurasi, template) tetap blok biasa.
      if (block.lang && TERMINAL_LANGS.has(block.lang.toLowerCase())) {
        return <TerminalBlock code={block.x} />;
      }
      return (
        <div className="overflow-hidden rounded-xl border border-line bg-bg/70">
          {block.lang && (
            <div className="border-b border-line px-4 py-1.5 text-[11px] uppercase tracking-wide text-muted">
              {block.lang}
            </div>
          )}
          <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
            <code>{block.x}</code>
          </pre>
        </div>
      );

    case "table":
      return (
        <figure className="space-y-2">
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
              <thead className="bg-bg/70 text-xs text-muted">
                <tr>
                  {block.head.map((h, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="whitespace-nowrap px-4 py-2.5 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {block.rows.map((row, i) => (
                  <tr key={i} className="align-top even:bg-bg/40">
                    {row.map((cell, j) =>
                      j === 0 ? (
                        <th
                          key={j}
                          scope="row"
                          className="px-4 py-2.5 text-left font-medium leading-6"
                        >
                          {cell}
                        </th>
                      ) : (
                        <td key={j} className="px-4 py-2.5 leading-6">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && (
            <figcaption className="text-xs leading-5 text-muted">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "img":
      return (
        <ChapterImage
          src={block.src}
          alt={block.alt}
          caption={block.caption}
          href={block.href}
          credit={block.credit}
          fallback={block.fallback}
        />
      );

    case "video":
      return (
        <ChapterVideo
          id={block.id}
          title={block.title}
          channel={block.channel}
          query={block.query}
          start={block.start}
        />
      );

    case "tip":
      return (
        <div className="flex gap-3 rounded-xl border border-accent/40 bg-accent/5 p-4 text-sm leading-7">
          <Lightbulb className="mt-1 size-4 shrink-0 text-accent" />
          <p>{block.x}</p>
        </div>
      );

    case "warn":
      return (
        <div className="flex gap-3 rounded-xl border border-amber-400/30 bg-amber-400/5 p-4 text-sm leading-7 text-amber-200">
          <TriangleAlert className="mt-1 size-4 shrink-0" />
          <p>{block.x}</p>
        </div>
      );

    case "check":
      return (
        <div className="rounded-xl border border-line bg-bg/50 p-4">
          <p className="mb-2 text-sm font-semibold">Cek pemahaman</p>
          <ul className="space-y-2">
            {block.items.map((item, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-6">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-muted" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      );
  }
}

export function ChapterBody({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => (
        <BlockView
          key={`${i}-${block.t === "video" ? (block.id ?? block.title) : block.t}`}
          block={block}
        />
      ))}
    </div>
  );
}

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "@/components/CopyButton";

/**
 * Render isi materi (Markdown).
 *  - Blok ``` tampil sebagai terminal dengan tombol Salin.
 *  - Gambar ![alt](url "caption") tampil sebagai figure; title dipakai sebagai caption sumber.
 * Warna memakai currentColor (border-current/10) + aksen violet agar mengikuti tema aplikasi.
 */

type HastNode = {
  tagName?: string;
  value?: string;
  properties?: { className?: string[] };
  children?: HastNode[];
};

const textOf = (n?: HastNode): string =>
  n ? (n.value ?? "") + (n.children ?? []).map(textOf).join("") : "";

export default function LessonMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: (p) => (
          <h2
            className="mt-9 mb-3 text-lg font-semibold tracking-tight sm:mt-10 sm:text-xl"
            {...p}
          />
        ),
        h3: (p) => <h3 className="mt-7 mb-2 text-lg font-semibold" {...p} />,
        p: ({ node, ...p }) => {
          // Gambar sendirian di paragraf: lepas <p> supaya <figure> tidak bersarang di dalamnya.
          const only = (node as unknown as HastNode | undefined)?.children;
          if (only?.length === 1 && only[0].tagName === "img")
            return <>{p.children}</>;
          return <p className="my-4 leading-7 opacity-90" {...p} />;
        },
        ul: (p) => (
          <ul
            className="my-4 list-disc space-y-1.5 pl-6 marker:text-violet-400"
            {...p}
          />
        ),
        ol: (p) => (
          <ol
            className="my-4 list-decimal space-y-1.5 pl-6 marker:text-violet-400"
            {...p}
          />
        ),
        strong: (p) => <strong className="font-semibold" {...p} />,
        a: (p) => (
          <a
            className="text-violet-400 underline decoration-violet-400/40 underline-offset-2 hover:decoration-violet-400"
            target="_blank"
            rel="noreferrer"
            {...p}
          />
        ),
        blockquote: (p) => (
          <blockquote
            className="my-5 rounded-r-xl border-l-4 border-violet-500 bg-violet-500/10 px-4 py-3 [&>p]:my-0"
            {...p}
          />
        ),
        table: (p) => (
          <div className="my-5 overflow-x-auto rounded-xl border border-current/10">
            <table className="w-full border-collapse text-sm" {...p} />
          </div>
        ),
        thead: (p) => <thead className="bg-violet-500/10" {...p} />,
        th: (p) => (
          <th
            className="px-3 py-2 text-left font-medium whitespace-nowrap sm:px-4 sm:py-2.5"
            {...p}
          />
        ),
        td: (p) => (
          <td
            className="border-t border-current/10 px-3 py-2 align-top sm:px-4 sm:py-2.5"
            {...p}
          />
        ),
        hr: () => <hr className="my-8 border-current/10" />,
        img: ({ src, alt, title }) => (
          <figure className="my-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={typeof src === "string" ? src : undefined}
              alt={alt ?? ""}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="mx-auto max-h-72 w-auto sm:max-h-[28rem] max-w-full rounded-xl border border-current/10 bg-white/5 p-1"
            />
            {title && (
              <figcaption className="mt-2 text-center text-xs opacity-60">
                {title}
              </figcaption>
            )}
          </figure>
        ),
        pre: ({ node, children }) => {
          const code = (node as unknown as HastNode | undefined)?.children?.[0];
          const text = textOf(code).replace(/\n$/, "");
          const lang =
            code?.properties?.className
              ?.find((c) => c.startsWith("language-"))
              ?.slice(9) ?? "";
          const label = lang === "routeros" ? "RouterOS" : lang || "terminal";
          return (
            <div className="my-5 overflow-hidden rounded-xl border border-current/10 bg-black/40">
              <div className="flex items-center justify-between border-b border-current/10 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-violet-500/70" />
                  <span className="size-2.5 rounded-full bg-violet-400/40" />
                  <span className="size-2.5 rounded-full bg-violet-300/20" />
                  <span className="ml-2 text-xs opacity-60">{label}</span>
                </div>
                <CopyButton text={text} />
              </div>
              <pre className="overflow-x-auto p-3 font-mono text-[13px] leading-relaxed text-violet-100 sm:p-4 sm:text-sm">
                {children}
              </pre>
            </div>
          );
        },
        code: ({ className, children, ...p }) =>
          className ? (
            <code className={className} {...p}>
              {children}
            </code>
          ) : (
            <code
              className="rounded-md bg-violet-500/15 px-1.5 py-0.5 font-mono text-[0.88em] text-violet-300 [overflow-wrap:anywhere]"
              {...p}
            >
              {children}
            </code>
          ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

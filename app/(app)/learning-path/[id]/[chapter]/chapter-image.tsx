"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  caption?: string;
  href?: string;
  credit?: string;
  fallback?: string;
};

export function ChapterImage({
  src,
  alt,
  caption,
  href,
  credit,
  fallback,
}: Props) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Gambar bisa gagal sebelum React terpasang, jadi cek ulang saat mount.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <figure className="space-y-2">
      {failed ? (
        fallback ? (
          <pre className="overflow-x-auto rounded-xl border border-line bg-bg/70 p-4 font-mono text-xs leading-relaxed">
            {fallback}
          </pre>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 p-4 text-sm text-muted">
            <ImageOff className="size-5 shrink-0" />
            <span>
              Gambar tidak dapat dimuat.
              {href && (
                <>
                  {" "}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-fg"
                  >
                    Buka sumbernya
                  </a>
                  .
                </>
              )}
            </span>
          </div>
        )
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-white p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref}
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setFailed(true)}
            className="mx-auto h-auto max-h-[28rem] w-auto max-w-full"
          />
        </div>
      )}
      {(caption || credit) && (
        <figcaption className="text-xs leading-5 text-muted">
          {caption}
          {credit && (
            <>
              {caption ? " · " : ""}Sumber:{" "}
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-fg"
                >
                  {credit}
                </a>
              ) : (
                credit
              )}
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}

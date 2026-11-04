"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ExternalLink, Play, Search } from "lucide-react";

type Props = {
  id?: string;
  title: string;
  channel?: string;
  query?: string;
  start?: number;
};

const YT_ID = /^[\w-]{11}$/;

/**
 * Pembungkus: `key` memuat path halaman + id video, jadi setiap bab dan setiap
 * video selalu mendapat instance baru (state `playing` tidak terbawa antar bab).
 */
export function ChapterVideo(props: Props) {
  const pathname = usePathname();
  return (
    <VideoPlayer key={`${pathname}:${props.id ?? props.title}`} {...props} />
  );
}

function VideoPlayer({ id, title, channel, query, start }: Props) {
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const frameEl = useRef<HTMLIFrameElement | null>(null);

  /**
   * Hentikan video secara paksa saat komponen dilepas ATAU disembunyikan.
   *
   * Kalau Next/React menyimpan halaman lama di cache (disembunyikan, bukan dilepas),
   * iframe tetap hidup dan suaranya terus jalan. Mengganti src ke about:blank
   * mematikan pemutar YouTube di dalamnya, apa pun mekanismenya.
   * Saat halaman ditampilkan lagi, state kembali ke thumbnail (tidak auto-play ulang).
   */
  useEffect(() => {
    setPlaying(false);
    return () => {
      if (frameEl.current) frameEl.current.src = "about:blank";
      setPlaying(false);
    };
  }, []);

  // Tanpa ID yang valid: tampilkan kartu pencarian YouTube.
  if (!id || !YT_ID.test(id)) {
    const q = encodeURIComponent(query ?? title);
    return (
      <a
        href={`https://www.youtube.com/results?search_query=${q}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-line bg-bg/50 p-4 text-sm transition-colors hover:border-accent/50"
      >
        <Search className="size-5 shrink-0 text-muted" />
        <span className="min-w-0 flex-1">
          <span className="block font-medium">{title}</span>
          <span className="block text-xs text-muted">
            Cari video penjelasan di YouTube
          </span>
        </span>
        <ExternalLink className="size-4 shrink-0 text-muted" />
      </a>
    );
  }

  const watchUrl = `https://www.youtube.com/watch?v=${id}${start ? `&t=${start}s` : ""}`;
  const embedUrl =
    `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1` +
    (start ? `&start=${start}` : "");

  return (
    <figure className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black">
        {playing ? (
          <iframe
            ref={(el) => {
              // Simpan elemen walau nanti ref dilepas, supaya cleanup masih bisa mematikannya.
              if (el) frameEl.current = el;
            }}
            src={embedUrl}
            title={title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Putar video: ${title}`}
            className="group absolute inset-0 flex items-center justify-center"
          >
            {!thumbFailed && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setThumbFailed(true)}
                className="absolute inset-0 size-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
            )}
            <span className="relative flex size-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform group-hover:scale-105">
              <Play className="size-6 translate-x-0.5" fill="currentColor" />
            </span>
          </button>
        )}
      </div>
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs leading-5 text-muted">
        <span>
          {title}
          {channel ? ` · ${channel}` : ""}
        </span>
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-fg"
        >
          Buka di YouTube <ExternalLink className="size-3" />
        </a>
      </figcaption>
    </figure>
  );
}

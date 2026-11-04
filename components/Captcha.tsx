"use client";

import { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";

const inputCls =
  "w-full rounded-lg border border-fg/15 bg-fg/5 py-2.5 pl-10 pr-3.5 text-center font-mono text-base uppercase tracking-[0.35em] outline-none transition-colors placeholder:font-sans placeholder:text-sm placeholder:normal-case placeholder:tracking-normal placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-accent/30 autofill:shadow-[inset_0_0_0_1000px_var(--color-card)] autofill:[-webkit-text-fill-color:var(--color-fg)]";

export default function Captcha({ refreshKey = 0 }: { refreshKey?: number }) {
  const [tick, setTick] = useState(0);
  const [token, setToken] = useState("");
  const [src, setSrc] = useState("");
  const [failed, setFailed] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");

  const reqKey = `${tick}:${refreshKey}`;
  const loading = loadedKey !== reqKey;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/captcha", { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("captcha");
        return r.json() as Promise<{ svg: string; token: string }>;
      })
      .then((d) => {
        if (cancelled) return;
        setToken(d.token);
        setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(d.svg)}`);
        setFailed(false);
        setLoadedKey(reqKey);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoadedKey(reqKey);
      });
    return () => {
      cancelled = true;
    };
  }, [reqKey]);

  return (
    <div>
      <label htmlFor="captcha" className="mb-1.5 block text-sm font-medium">
        Verifikasi
      </label>

      <div className="mb-2 flex items-stretch gap-2">
        <div className="relative aspect-[180/56] flex-1 overflow-hidden rounded-lg border border-fg/15 bg-fg/5">
          {src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Gambar captcha"
              draggable={false}
              className={`absolute inset-0 size-full select-none object-fill transition-opacity ${
                loading ? "opacity-40" : "opacity-100"
              }`}
            />
          )}
          {!src && (
            <span className="absolute inset-0 flex items-center justify-center text-xs text-muted">
              {failed ? "Gagal memuat captcha" : "Memuat…"}
            </span>
          )}
          {failed && src && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white">
              Gagal memuat captcha
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          disabled={loading}
          aria-label="Ganti captcha"
          title="Ganti captcha"
          className="flex w-12 shrink-0 items-center justify-center rounded-lg border border-fg/15 text-muted transition-colors hover:border-accent/50 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:cursor-wait"
        >
          <RefreshCw
            className={`size-4 ${loading ? "animate-spin" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      <input type="hidden" name="captchaToken" value={token} />
      <div className="relative">
        <ShieldCheck
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <input
          id="captcha"
          name="captcha"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={5}
          required
          placeholder="Ketik 5 karakter di atas"
          className={inputCls}
        />
      </div>
    </div>
  );
}

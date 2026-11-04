"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch {
      /* clipboard tidak tersedia, abaikan */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Salin perintah"
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs opacity-60 transition hover:bg-current/10 hover:opacity-100"
    >
      {ok ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span className="hidden sm:inline">{ok ? "Tersalin" : "Salin"}</span>
    </button>
  );
}

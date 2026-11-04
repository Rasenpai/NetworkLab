"use client";

import { useState } from "react";
import { CiscoRouterViewerLazy, HapLiteViewerLazy, PcViewerLazy } from "./lazy";

const TABS = [
  { id: "hap", label: "MikroTik hAP lite", View: HapLiteViewerLazy },
  { id: "cisco", label: "Cisco ISR 2911", View: CiscoRouterViewerLazy },
  { id: "pc", label: "PC Desktop", View: PcViewerLazy },
] as const;

/** Galeri 3D untuk halaman /virtual-lab/perangkat-3d (mode demo, tanpa kabel). */
export default function DeviceShowcase() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("hap");
  const { View } = TABS.find((t) => t.id === tab)!;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              tab === t.id
                ? "border-accent/40 bg-accent/15 text-fg"
                : "border-line text-muted hover:text-fg"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <View key={tab} />
    </div>
  );
}

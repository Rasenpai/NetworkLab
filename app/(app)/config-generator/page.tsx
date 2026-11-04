"use client";

import { useState } from "react";
import CiscoGenerator from "./cisco";
import MikrotikGenerator from "./mikrotik";

const TABS = [
  { id: "cisco", label: "Cisco" },
  { id: "mikrotik", label: "MikroTik" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ConfigGeneratorPage() {
  const [tab, setTab] = useState<TabId>("cisco");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Config Generator
        </h1>
        <p className="mt-1 text-sm text-muted">
          Pilih vendor, isi form, lalu salin script konfigurasinya.
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Vendor perangkat"
        className="inline-flex gap-1 rounded-xl border border-line bg-card p-1"
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={active}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-accent/15 text-white ring-1 ring-accent/40"
                  : "text-muted hover:text-fg"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Kedua panel tetap ter-mount supaya isi form tidak hilang saat pindah tab */}
      <div
        role="tabpanel"
        id="panel-cisco"
        aria-labelledby="tab-cisco"
        hidden={tab !== "cisco"}
      >
        <CiscoGenerator />
      </div>
      <div
        role="tabpanel"
        id="panel-mikrotik"
        aria-labelledby="tab-mikrotik"
        hidden={tab !== "mikrotik"}
      >
        <MikrotikGenerator />
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Search } from "lucide-react";
import { commands, type Vendor } from "@/lib/data";
import { Badge, Card, VendorBadge } from "@/components/ui";

export default function CommandLibrary() {
  const [vendor, setVendor] = useState<Vendor | "Semua">("Semua");
  const [category, setCategory] = useState<string>("Semua");
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const q = query.trim().toLowerCase();

  // Kategori sesuai vendor yang dipilih, urut sesuai kemunculan di data.
  const categories = useMemo(() => {
    const list: string[] = [];
    for (const c of commands) {
      if (vendor !== "Semua" && c.vendor !== vendor) continue;
      if (!list.includes(c.category)) list.push(c.category);
    }
    return ["Semua", ...list];
  }, [vendor]);

  const visible = commands.filter(
    (c) =>
      (vendor === "Semua" || c.vendor === vendor) &&
      (category === "Semua" || c.category === category) &&
      (!q ||
        c.title.toLowerCase().includes(q) ||
        c.command.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.note?.toLowerCase().includes(q) ?? false)),
  );

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((cur) => (cur === id ? null : cur)), 1500);
    } catch {
      // clipboard tidak tersedia, abaikan
    }
  }

  function changeVendor(v: Vendor | "Semua") {
    setVendor(v);
    setCategory("Semua");
  }

  const tabs: (Vendor | "Semua")[] = ["Semua", "MikroTik", "Cisco"];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => changeVendor(t)}
              aria-pressed={vendor === t}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                vendor === t
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-card text-muted hover:border-accent/40 hover:text-fg"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="relative block sm:w-72">
          <span className="sr-only">Cari command</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari command, misalnya vlan"
            className="w-full rounded-xl border border-line bg-card py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted/60 focus:border-accent"
          />
        </label>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              category === c
                ? "border-accent bg-accent/15 text-fg"
                : "border-line bg-card text-muted hover:border-accent/40 hover:text-fg"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        {visible.length} command ditemukan
      </p>

      {visible.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted">
          Tidak ada command yang cocok dengan pencarian.
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visible.map((c) => (
            <Card key={c.id} className="flex flex-col p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <VendorBadge vendor={c.vendor} />
                <Badge>{c.category}</Badge>
              </div>
              <h4 className="mt-3 font-semibold">{c.title}</h4>
              <div className="relative mt-3">
                <pre className="overflow-x-auto rounded-xl border border-line bg-bg p-3 pr-12 font-mono text-[13px] leading-relaxed text-purple-200">
                  {c.command}
                </pre>
                <button
                  type="button"
                  onClick={() => copy(c.id, c.command)}
                  aria-label={`Salin command ${c.title}`}
                  className="absolute right-2 top-2 rounded-lg border border-line bg-card p-1.5 text-muted transition-colors hover:text-fg"
                >
                  {copied === c.id ? (
                    <Check className="size-4 text-emerald-400" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
              {c.note && <p className="mt-2.5 text-xs text-muted">{c.note}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

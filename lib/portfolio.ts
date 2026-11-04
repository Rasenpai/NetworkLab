import "server-only";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Vendor } from "@/lib/data";

export type PortfolioItem = {
  labId: string;
  title: string;
  vendor: Vendor;
  summary: string;
  setup: string;
  tags: string[];
  topology: string;
  config: string;
  /** "Nov 2026" (WIB) */
  date: string;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function fmt(ms: number) {
  const d = new Date(ms + 7 * 60 * 60 * 1000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Project portofolio hasil lab milik user yang sedang login. */
export async function getMyPortfolioItems(): Promise<PortfolioItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const rows = db
    .prepare(
      `SELECT lab_id, title, vendor, summary, setup, tags, topology, config, updated_at
         FROM portfolio_items WHERE user_id = ? ORDER BY updated_at DESC`,
    )
    .all(user.id) as {
    lab_id: string;
    title: string;
    vendor: Vendor;
    summary: string;
    setup: string;
    tags: string;
    topology: string;
    config: string;
    updated_at: number;
  }[];

  return rows.map((r) => {
    let tags: string[] = [];
    try {
      tags = JSON.parse(r.tags) as string[];
    } catch {
      /* tags rusak: kosongkan */
    }
    return {
      labId: r.lab_id,
      title: r.title,
      vendor: r.vendor,
      summary: r.summary,
      setup: r.setup,
      tags,
      topology: r.topology,
      config: r.config,
      date: fmt(r.updated_at),
    };
  });
}
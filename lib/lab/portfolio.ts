"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { findLabSpec } from "@/lib/lab/labs";
import { recordActivity } from "@/lib/learning";
import type { LabSpec } from "@/lib/lab/types";

const MAX_CONFIG = 60_000;

type Result = { ok: boolean; message: string };

function topologyText(spec: LabSpec): string {
  const label = (id: string) => spec.devices.find((d) => d.id === id)?.label ?? id;
  return spec.links
    .map((l) => `${label(l.a[0])} [${l.a[1]}]  <-->  [${l.b[1]}] ${label(l.b[0])}`)
    .join("\n");
}

function setupText(spec: LabSpec): string {
  const routers = spec.devices.filter(
    (d) => (d.kind === "mikrotik" || d.kind === "cisco") && d.role !== "switch",
  ).length;
  const switches = spec.devices.filter((d) => d.role === "switch").length;
  const pcs = spec.devices.filter((d) => d.kind === "pc").length;
  const cloud = spec.devices.some((d) => d.kind === "cloud");
  return [
    routers ? `${routers} Router` : "",
    switches ? `${switches} Switch` : "",
    pcs ? `${pcs} PC` : "",
    cloud ? "1 ISP" : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

function tagsFor(spec: LabSpec): string[] {
  const types = new Set(spec.tasks.flatMap((t) => t.checks.map((c) => c.type)));
  const tags: string[] = [];
  if ([...types].some((t) => t.startsWith("ospf"))) tags.push("OSPF");
  if (types.has("vlan") || types.has("access-port") || types.has("trunk-port"))
    tags.push("VLAN");
  if ([...types].some((t) => t.startsWith("wg-"))) tags.push("WireGuard", "VPN");
  if (types.has("dhcp-server") || types.has("has-lease")) tags.push("DHCP");
  if (types.has("route") || types.has("no-route")) tags.push("Routing");
  if (types.has("dns")) tags.push("DNS");
  if (types.has("nat-masq")) tags.push("NAT");
  if (types.has("no-ping")) tags.push("Firewall");
  tags.push("Lab");
  return tags.slice(0, 4);
}

/**
 * Simpan lab yang sudah tuntas sebagai project portofolio. Topologi dibuat dari spec,
 * konfigurasi dikirim klien (snapshot terminal saat ini), pengujian = semua tugas lolos.
 * Memanggil ulang memperbarui entri yang sama.
 */
export async function saveLabToPortfolio(labId: string, config: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Masuk dulu untuk menyimpan ke portofolio." };
  if (typeof labId !== "string" || typeof config !== "string")
    return { ok: false, message: "Data tidak valid." };
  const spec = findLabSpec({ id: labId });
  if (!spec) return { ok: false, message: "Lab tidak ditemukan." };

  const row = db
    .prepare("SELECT completed FROM lab_state WHERE user_id = ? AND lab_id = ?")
    .get(user.id, labId) as { completed: number } | undefined;
  if (!row?.completed)
    return {
      ok: false,
      message: "Selesaikan semua tugas dulu (klik Periksa jawaban), lalu coba lagi.",
    };

  const now = Date.now();
  const existed = db
    .prepare("SELECT 1 FROM portfolio_items WHERE user_id = ? AND lab_id = ?")
    .get(user.id, labId);

  db.prepare(
    `INSERT INTO portfolio_items
       (user_id, lab_id, title, vendor, summary, setup, tags, topology, config, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, lab_id) DO UPDATE SET
       title = excluded.title,
       vendor = excluded.vendor,
       summary = excluded.summary,
       setup = excluded.setup,
       tags = excluded.tags,
       topology = excluded.topology,
       config = excluded.config,
       updated_at = excluded.updated_at`,
  ).run(
    user.id,
    labId,
    spec.title,
    spec.vendor,
    spec.description,
    setupText(spec),
    JSON.stringify(tagsFor(spec)),
    topologyText(spec),
    config.slice(0, MAX_CONFIG),
    now,
    now,
  );

  if (!existed)
    recordActivity(user.id, "portfolio", `Menambah project ${spec.title} ke portofolio`.slice(0, 120), 0);

  return {
    ok: true,
    message: existed ? "Project di portofolio diperbarui." : "Tersimpan ke portofolio.",
  };
}
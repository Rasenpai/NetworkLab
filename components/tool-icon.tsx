"use client";

import { useState } from "react";
import { Network } from "lucide-react";

// Urutan penting: keyword pertama yang cocok dipakai.
const ICONS: [keyword: string, slug: string][] = [
  ["cisco", "cisco"],
  ["packet tracer", "cisco"],
  ["mikrotik", "mikrotik"],
  ["routeros", "mikrotik"],
  ["winbox", "mikrotik"],
  ["the dude", "mikrotik"],
  ["capsman", "mikrotik"],
  ["netwatch", "mikrotik"],
  ["juniper", "junipernetworks"],
  ["wireshark", "wireshark"],
  ["zabbix", "zabbix"],
  ["grafana", "grafana"],
  ["nagios", "nagios"],
  ["wireguard", "wireguard"],
  ["python", "python"],
  ["netmiko", "python"],
  ["ansible", "ansible"],
  ["git", "git"],
  ["bash", "gnubash"],
  ["linux", "linux"],
  ["ubuntu", "ubuntu"],
  ["debian", "debian"],
  ["telegram", "telegram"],
  ["jira", "jira"],
  ["servicenow", "servicenow"],
  ["draw.io", "diagramsdotnet"],
  ["ssh", "openssh"],
  ["putty", "openssh"],
];

function findSlug(name: string): string | null {
  const n = name.toLowerCase();
  return ICONS.find(([keyword]) => n.includes(keyword))?.[1] ?? null;
}

export function ToolIcon({ name }: { name: string }) {
  const slug = findSlug(name);
  const [failed, setFailed] = useState(false);

  if (!slug || failed) {
    return (
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
        <Network className="size-3" />
      </span>
    );
  }

  return (
    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-white p-[3px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://cdn.simpleicons.org/${slug}`}
        alt=""
        width={14}
        height={14}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-contain"
      />
    </span>
  );
}

export function ToolChip({
  name,
  core = false,
}: {
  name: string;
  core?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-2.5 text-xs font-medium whitespace-nowrap ${
        core
          ? "border-accent/30 bg-accent/15 text-purple-300"
          : "border-line bg-white/5 text-muted"
      }`}
    >
      <ToolIcon name={name} />
      {name}
    </span>
  );
}

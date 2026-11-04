import { BadgeCheck } from "lucide-react";

export default function AdminBadge() {
  return (
    <span
      title="Admin NetworkLab (terverifikasi)"
      className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent"
    >
      <BadgeCheck className="size-3.5" />
      Admin
    </span>
  );
}

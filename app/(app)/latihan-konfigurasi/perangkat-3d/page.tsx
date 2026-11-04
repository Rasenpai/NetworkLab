import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DeviceShowcase from "@/components/device3d/Showcase";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Perangkat 3D" };

export default function Device3DPage() {
  return (
    <>
      <Link
        href="/latihan-konfigurasi"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar lab
      </Link>
      <PageHeader
        title="Perangkat 3D"
        description="Kenali bagian fisik router MikroTik, router Cisco, dan PC: putar, zoom, lalu klik port untuk melihat fungsinya."
      />
      <DeviceShowcase />
    </>
  );
}

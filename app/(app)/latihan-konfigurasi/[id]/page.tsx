import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import LabRunner from "@/components/lab/LabRunner";
import { PageHeader } from "@/components/ui";
import { findLabSpec } from "@/lib/lab/labs";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const spec = findLabSpec({ id });
  return { title: spec ? spec.title : "Virtual Lab" };
}

export default async function LabPage({ params }: Props) {
  const { id } = await params;
  const spec = findLabSpec({ id });
  if (!spec) notFound();

  return (
    <>
      <Link
        href="/latihan-konfigurasi"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Kembali ke daftar lab
      </Link>
      <PageHeader title={spec.title} description={spec.description} />
      <LabRunner spec={spec} />
    </>
  );
}
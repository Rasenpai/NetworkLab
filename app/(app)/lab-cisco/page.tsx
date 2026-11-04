import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { createCanvas, getCanvas, listCanvases } from "@/lib/cisco-canvas";
import { CanvasWorkspace } from "./canvas-workspace";

export const metadata = { title: "Virtual Lab Cisco" };

type Props = { searchParams: Promise<{ c?: string }> };

async function Workspace({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { c } = await searchParams;
  const list = listCanvases(user.id);

  // Pilih canvas: yang diminta di URL, kalau tidak ada yang terbaru, kalau belum punya buat baru.
  const current =
    (c ? getCanvas(user.id, c) : null) ??
    (list[0] ? getCanvas(user.id, list[0].id) : null) ??
    createCanvas(user.id);

  // Rapikan URL (juga mencegah refresh membuat canvas baru terus).
  if (current.id !== c) redirect(`/lab-cisco?c=${current.id}`);

  return <CanvasWorkspace key={current.id} canvas={current} canvases={list} />;
}

export default function LabCiscoPage(props: Props) {
  return (
    <Suspense fallback={<div className="h-full animate-pulse" />}>
      <Workspace {...props} />
    </Suspense>
  );
}

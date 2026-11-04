"use client";

import dynamic from "next/dynamic";

/* Three.js hanya butuh browser. Tiap perangkat dimuat lewat dynamic import
   dengan SSR dimatikan, sehingga tidak ada hydration error dan bundel 3D
   tidak ikut terunduh di halaman lain. Next.js mewajibkan opsi dynamic()
   ditulis inline sebagai object literal, jadi tidak boleh dipindah ke variabel. */

function ViewerSkeleton() {
  return (
    <div className="h-[340px] animate-pulse rounded-2xl border border-line bg-card sm:h-[440px] lg:h-[560px]" />
  );
}

export const HapLiteViewerLazy = dynamic(
  () => import("./mikrotik-hap-lite").then((m) => m.HapLiteViewer),
  { ssr: false, loading: () => <ViewerSkeleton /> },
);

export const CiscoRouterViewerLazy = dynamic(
  () => import("./cisco-router").then((m) => m.CiscoRouterViewer),
  { ssr: false, loading: () => <ViewerSkeleton /> },
);

export const PcViewerLazy = dynamic(
  () => import("./pc-tower").then((m) => m.PcViewer),
  { ssr: false, loading: () => <ViewerSkeleton /> },
);

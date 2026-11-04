import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui";
import TroubleshootView from "@/components/troubleshoot-view";
import { getMyTroubleshootResults } from "@/lib/troubleshoot";

export const metadata: Metadata = { title: "Troubleshooting Challenge" };

/** Membaca data user (cookie), jadi dibungkus Suspense di bawah. */
async function TroubleshootContent() {
  const initialResults = await getMyTroubleshootResults();
  return <TroubleshootView initialResults={initialResults} />;
}

function TroubleshootSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-24 animate-pulse rounded-2xl border border-line bg-card" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-2xl border border-line bg-card"
          />
        ))}
      </div>
    </div>
  );
}

export default function TroubleshootingPage() {
  return (
    <>
      <PageHeader
        title="Troubleshooting Challenge"
        description="Jaringan yang rusak menunggu diperbaiki. Jalankan command diagnosa, temukan akar masalahnya, dan kejar skor tertinggi dengan waktu tercepat."
      />
      <Suspense fallback={<TroubleshootSkeleton />}>
        <TroubleshootContent />
      </Suspense>
    </>
  );
}

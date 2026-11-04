import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { NocDashboard } from "./noc-dashboard";

export const metadata: Metadata = { title: "NOC Simulasi" };

export default function NocSimulasiPage() {
  return (
    <>
      <PageHeader
        title="NOC Simulasi"
        description="Pantau jaringan dummy seperti di NOC sungguhan. Pada tahap ini semua perangkat masih normal; insiden acak menyusul di tahap berikutnya."
      />
      <NocDashboard />
    </>
  );
}

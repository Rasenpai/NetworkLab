import type { Metadata } from "next";
import CommandLibrary from "@/components/CommandLibrary";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Command Library" };

export default function CommandsPage() {
  return (
    <>
      <PageHeader
        title="Command Library"
        description="Referensi cepat command MikroTik RouterOS dan Cisco IOS. Cari, filter, lalu salin."
      />
      <CommandLibrary />
    </>
  );
}

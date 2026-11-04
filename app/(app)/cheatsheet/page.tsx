import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import CheatsheetView from "@/components/cheatsheet-view";

export const metadata: Metadata = { title: "Cheatsheet & Glosarium" };

export default function CheatsheetPage() {
  return (
    <>
      <PageHeader
        title="Cheatsheet & Glosarium"
        description="Referensi cepat untuk port dan protokol, model OSI, kelas IP, tabel subnet, dan kamus istilah jaringan."
      />
      <CheatsheetView />
    </>
  );
}

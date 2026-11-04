import type { Metadata } from "next";
import Academy from "@/components/Academy";

export const metadata: Metadata = { title: "MikroTik Academy" };

export default function MikroTikPage() {
  return (
    <Academy
      vendor="MikroTik"
      basePath="/mikrotik"
      description="Katalog materi RouterOS: dari konfigurasi dasar Winbox sampai routing dinamis, VPN, dan high availability."
    />
  );
}

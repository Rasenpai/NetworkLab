import type { Metadata } from "next";
import Academy from "@/components/Academy";

export const metadata: Metadata = { title: "Cisco Academy" };

export default function CiscoPage() {
  return (
    <Academy
      vendor="Cisco"
      description="Katalog materi Cisco IOS: konsep jaringan, switching, routing, sampai keamanan dan konektivitas WAN."
    />
  );
}

import type { Metadata } from "next";
import type { ComponentType } from "react";
import {
  ArrowUpRight,
  Boxes,
  Cloud,
  Download,
  Monitor,
  Network,
  ScanSearch,
  Server,
  Terminal,
  FolderSync,
  Router,
} from "lucide-react";
import { SiCisco, SiMikrotik, SiWireshark } from "react-icons/si";
import { Card } from "@/components/ui";

export const metadata: Metadata = { title: "Resources" };

type Platform = "Windows" | "Linux" | "macOS" | "Web";

type Resource = {
  name: string;
  desc: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  platforms: Platform[];
  note?: string;
  direct?: boolean;
};

type Category = { id: string; title: string; hint: string; items: Resource[] };

const CATEGORIES: Category[] = [
  {
    id: "vendor",
    title: "MikroTik & Cisco",
    hint: "Router dan simulator utama untuk latihan.",
    items: [
      {
        name: "MikroTik CHR",
        desc: "RouterOS versi virtual (Cloud Hosted Router). Siap dijalankan di VirtualBox, VMware, atau GNS3.",
        href: "https://mikrotik.com/download",
        icon: SiMikrotik,
        platforms: ["Windows", "Linux", "macOS"],
        note: "Pilih bagian Cloud Hosted Router. Lisensi gratis dibatasi 1 Mbps per interface.",
      },
      {
        name: "WinBox",
        desc: "Aplikasi GUI resmi untuk mengonfigurasi RouterOS.",
        href: "https://mikrotik.com/download",
        icon: SiMikrotik,
        platforms: ["Windows", "Linux", "macOS"],
      },
      {
        name: "RouterOS Archive",
        desc: "Arsip semua versi RouterOS dan CHR, berguna kalau butuh versi lama yang spesifik.",
        href: "https://mikrotik.com/download/archive",
        icon: Router,
        platforms: ["Windows", "Linux", "macOS"],
      },
      {
        name: "RouterOS 7.24.6 (ARM64)",
        desc: "Paket RouterOS 7.24.6 untuk perangkat ARM64. Klik langsung mengunduh file .npk.",
        href: "https://download.mikrotik.com/routeros/7.24.6/routeros-7.24.6-arm64.npk",
        icon: Download,
        direct: true,
        platforms: ["Windows", "Linux", "macOS"],
        note: "Unduhan langsung (.npk). Dipakai untuk upgrade/instal perangkat ARM64, bukan untuk CHR x86.",
      },
      {
        name: "MikroTik CHR 7.24.6 (raw image)",
        desc: "Image CHR versi 7.24.6 dalam format raw (.img.zip). Klik langsung mengunduh file.",
        href: "https://download.mikrotik.com/routeros/7.24.6/chr-7.24.6.img.zip",
        icon: Download,
        direct: true,
        platforms: ["Windows", "Linux", "macOS"],
        note: "Konversi ke VDI/VMDK dengan qemu-img kalau dipakai di VirtualBox atau VMware.",
      },
      {
        name: "Cisco Packet Tracer",
        desc: "Simulator jaringan Cisco untuk membuat topologi dan latihan konfigurasi IOS.",
        href: "https://www.netacad.com/courses/packet-tracer",
        icon: SiCisco,
        platforms: ["Windows", "Linux", "macOS"],
        note: "Perlu akun Cisco Networking Academy (gratis).",
      },
    ],
  },
  {
    id: "simulator",
    title: "Simulator & emulator",
    hint: "Untuk topologi besar dan perangkat dari banyak vendor.",
    items: [
      {
        name: "GNS3",
        desc: "Emulator jaringan yang menjalankan image perangkat sungguhan, termasuk CHR.",
        href: "https://www.gns3.com/software/download",
        icon: Network,
        platforms: ["Windows", "Linux", "macOS"],
        note: "Image Cisco IOS harus kamu sediakan sendiri (berlisensi).",
      },
      {
        name: "EVE-NG Community",
        desc: "Lab jaringan berbasis browser. Dijalankan sebagai VM.",
        href: "https://www.eve-ng.net/index.php/download/",
        icon: Cloud,
        platforms: ["Web"],
      },
    ],
  },
  {
    id: "virtual",
    title: "Virtualisasi",
    hint: "Untuk menjalankan CHR, Linux server, dan EVE-NG.",
    items: [
      {
        name: "VirtualBox",
        desc: "Hypervisor gratis dan open source. Pilihan paling mudah untuk menjalankan CHR.",
        href: "https://www.virtualbox.org/wiki/Downloads",
        icon: Boxes,
        platforms: ["Windows", "Linux", "macOS"],
      },
      {
        name: "VMware Workstation",
        desc: "Hypervisor desktop dengan performa jaringan virtual yang bagus.",
        href: "https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion",
        icon: Server,
        platforms: ["Windows", "Linux"],
        note: "Gratis untuk penggunaan pribadi, perlu akun Broadcom.",
      },
    ],
  },
  {
    id: "tools",
    title: "Tools jaringan",
    hint: "Analisis paket, pemindaian, dan transfer file.",
    items: [
      {
        name: "Wireshark",
        desc: "Analisis paket untuk memeriksa lalu lintas dan men-debug masalah jaringan.",
        href: "https://www.wireshark.org/download.html",
        icon: SiWireshark,
        platforms: ["Windows", "Linux", "macOS"],
      },
      {
        name: "Angry IP Scanner",
        desc: "Pemindai IP dan port yang ringan dan lintas platform.",
        href: "https://angryip.org/download/",
        icon: ScanSearch,
        platforms: ["Windows", "Linux", "macOS"],
      },
      {
        name: "WinSCP",
        desc: "Transfer file lewat SFTP/SCP, berguna untuk mengambil backup dari router atau server.",
        href: "https://winscp.net/eng/download.php",
        icon: FolderSync,
        platforms: ["Windows"],
      },
    ],
  },
  {
    id: "terminal",
    title: "Terminal & remote access",
    hint: "Untuk SSH, telnet, dan console ke perangkat.",
    items: [
      {
        name: "PuTTY",
        desc: "Klien SSH, telnet, dan serial yang klasik dan ringan.",
        href: "https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html",
        icon: Terminal,
        platforms: ["Windows", "Linux"],
      },
      {
        name: "MobaXterm",
        desc: "Terminal dengan banyak tab, SFTP bawaan, dan X server.",
        href: "https://mobaxterm.mobatek.net/download.html",
        icon: Monitor,
        platforms: ["Windows"],
      },
      {
        name: "Tabby",
        desc: "Terminal modern dengan dukungan SSH dan serial.",
        href: "https://tabby.sh",
        icon: Terminal,
        platforms: ["Windows", "Linux", "macOS"],
      },
    ],
  },
];

const TOTAL = CATEGORIES.reduce((n, c) => n + c.items.length, 0);

export default function ResourcesPage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Resources
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted sm:text-base">
          {TOTAL} software untuk belajar dan praktik jaringan. Semua link
          mengarah ke situs resmi pembuatnya, jadi selalu dapat versi terbaru.
        </p>
      </header>

      <div className="space-y-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2
                id={`cat-${cat.id}`}
                className="text-base font-semibold sm:text-lg"
              >
                {cat.title}
              </h2>
              <p className="text-xs text-muted sm:text-sm">{cat.hint}</p>
            </div>

            <Card className="divide-y divide-line overflow-hidden">
              {cat.items.map((r) => {
                const Icon = r.icon;
                return (
                  <a
                    key={r.name}
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 px-5 py-4 outline-none transition-colors hover:bg-fg/5 focus-visible:bg-fg/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                  >
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-fg/5 text-fg/80">
                      <Icon className="size-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h3 className="font-medium">{r.name}</h3>
                        <span className="text-xs text-muted">
                          {r.platforms.join(" · ")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted">{r.desc}</p>
                      {r.note && (
                        <p className="mt-1.5 text-xs text-amber-400/90">
                          {r.note}
                        </p>
                      )}
                    </div>

                    <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted transition-colors group-hover:text-accent">
                      <span className="hidden sm:inline">
                        {r.direct ? "Unduh" : "Buka"}
                      </span>
                      {r.direct ? (
                        <Download className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </span>
                  </a>
                );
              })}
            </Card>
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-muted">
        Image Cisco IOS/IOU tidak disediakan karena berlisensi. Dapatkan dari
        akun Cisco kamu sendiri. Pastikan unduh hanya dari link resmi di atas.
      </p>
    </div>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const SITE_URL = process.env.APP_URL ?? "http://localhost:3000";
const SITE_NAME = "NetworkLab";
const DESCRIPTION =
  "Platform belajar jaringan komputer: MikroTik dan Cisco dengan materi terstruktur, lab praktik, quiz, dan portofolio. Gratis, tanpa kartu kredit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "NetworkLab · Belajar MikroTik dan Cisco dengan Praktik Langsung",
    template: "%s · NetworkLab",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "belajar jaringan komputer",
    "belajar MikroTik",
    "belajar Cisco",
    "kursus MikroTik",
    "CCNA",
    "RouterOS",
    "lab jaringan online",
    "latihan konfigurasi router",
    "quiz jaringan",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  // "./" = canonical relatif terhadap halaman yang sedang dibuka (bukan selalu beranda).
  alternates: { canonical: "./" },
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE_NAME,
    url: "./",
    title: "NetworkLab · Belajar MikroTik dan Cisco dengan Praktik Langsung",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "NetworkLab · Belajar MikroTik dan Cisco dengan Praktik Langsung",
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
  // Opsional: isi GOOGLE_SITE_VERIFICATION di .env untuk Google Search Console.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f0b14",
  colorScheme: "dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DESCRIPTION,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: "id-ID",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

// Shell (sidebar/topbar) dipindah ke app/(app)/layout.tsx
// supaya landing page dan halaman login tidak ikut memakai layout dashboard.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            // Escape "<" supaya string di dalam JSON tidak bisa menutup tag script.
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}

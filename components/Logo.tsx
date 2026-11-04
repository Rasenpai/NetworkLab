import { Space_Grotesk } from "next/font/google";

// Font khusus nama brand, supaya beda dari teks lain.
const brandFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

/** Tiga node yang saling terhubung (topologi mesh) di kotak aksen. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 40 40" className={className} fill="none">
      <rect width="40" height="40" rx="11" className="fill-accent" />
      <path
        d="M20 9.5 31 28.5H9L20 9.5Z"
        stroke="white"
        strokeOpacity="0.4"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M20 22V9.5M20 22 9 28.5M20 22l11 6.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="20" cy="22" r="3.2" fill="white" />
      <circle cx="20" cy="9.5" r="2.4" fill="white" />
      <circle cx="9" cy="28.5" r="2.4" fill="white" />
      <circle cx="31" cy="28.5" r="2.4" fill="white" />
    </svg>
  );
}

/** Logo + nama. Dibungkus <Link> oleh pemanggil. */
export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark className="size-8 shrink-0" />
      <span
        className={`${brandFont.className} text-[19px] font-bold tracking-[-0.03em]`}
      >
        Network<span className="text-accent">Lab</span>
      </span>
    </span>
  );
}

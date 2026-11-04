import type { DeviceType } from "@/lib/cisco-canvas";

export const DEVICE_LABEL: Record<DeviceType, string> = {
  pc: "PC",
  laptop: "Laptop",
  server: "Server",
  phone: "Phone",
  tablet: "Tablet",
  printer: "Printer",
  sw: "Switch",
  rt: "Router",
};

/** Urutan di palet: perangkat ujung dulu, lalu perangkat jaringan. */
export const END_DEVICES: DeviceType[] = [
  "pc",
  "laptop",
  "server",
  "phone",
  "tablet",
  "printer",
];
export const NET_DEVICES: DeviceType[] = ["sw", "rt"];

/** Perangkat ujung (host): punya IP sendiri + default gateway. Switch dan router tidak. */
export const isHost = (t: DeviceType) => t !== "sw" && t !== "rt";

const port = { fill: "#0b0f14", stroke: "#b8c0cc", strokeWidth: 0.6 } as const;
const edge = { stroke: "#7b8593", strokeWidth: 0.6 } as const;

/** Taruh di dalam <svg>. Device dipakai lewat <use href="#cc-ic-{tipe}" />. */
export function DeviceDefs() {
  return (
    <defs>
      <linearGradient id="cc-scr" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7cc4ff" />
        <stop offset="1" stopColor="#1f5fae" />
      </linearGradient>
      <linearGradient id="cc-glare" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".38" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="cc-metal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#eef1f5" />
        <stop offset="1" stopColor="#aab3bf" />
      </linearGradient>
      <linearGradient id="cc-dark" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4a5463" />
        <stop offset="1" stopColor="#222a35" />
      </linearGradient>
      <linearGradient id="cc-swb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8393aa" />
        <stop offset="1" stopColor="#3b4657" />
      </linearGradient>
      <linearGradient id="cc-rtb" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5b86b8" />
        <stop offset="1" stopColor="#233a58" />
      </linearGradient>
      <pattern
        id="cc-pt"
        x="-34"
        y="-9"
        width="8.5"
        height="9"
        patternUnits="userSpaceOnUse"
      >
        <rect x="1" y="1" width="6" height="6.5" rx="1" {...port} />
        <rect x="2" y="5.2" width="4" height="1.2" fill="#d4b24c" />
      </pattern>

      {/* PC desktop: monitor datar + tower */}
      <g id="cc-ic-pc">
        <rect
          x="-44"
          y="-28"
          width="58"
          height="42"
          rx="3"
          fill="url(#cc-dark)"
          stroke="#161b22"
        />
        <rect
          x="-40"
          y="-24"
          width="50"
          height="34"
          rx="1"
          fill="url(#cc-scr)"
        />
        <path d="M-40 -24H-8L-26 10H-40Z" fill="url(#cc-glare)" />
        <circle cx="-15" cy="12" r="1" fill="#3ec87c" />
        <path d="M-22 14h14l2 8h-18z" fill="url(#cc-metal)" {...edge} />
        <rect
          x="-34"
          y="22"
          width="38"
          height="4"
          rx="2"
          fill="url(#cc-metal)"
          {...edge}
        />
        <rect
          x="22"
          y="-28"
          width="22"
          height="54"
          rx="3"
          fill="url(#cc-metal)"
          {...edge}
        />
        <rect x="26" y="-23" width="14" height="4" rx="1" fill="#8a94a3" />
        <rect x="26" y="-16" width="14" height="4" rx="1" fill="#8a94a3" />
        <circle
          cx="33"
          cy="-2"
          r="3"
          fill="none"
          stroke="#7b8593"
          strokeWidth="1.2"
        />
        <circle cx="33" cy="-2" r="1" fill="#3ec87c" />
        <path
          d="M26 14h14M26 17h14M26 20h14"
          stroke="#9aa4b1"
          strokeWidth="1"
        />
      </g>

      {/* Laptop */}
      <g id="cc-ic-laptop">
        <path
          d="M-30 -26H30a3 3 0 0 1 3 3V8H-33V-23a3 3 0 0 1 3-3z"
          fill="url(#cc-dark)"
          stroke="#161b22"
        />
        <rect
          x="-29"
          y="-22"
          width="58"
          height="26"
          rx="1"
          fill="url(#cc-scr)"
        />
        <path d="M-29 -22H0L-18 4H-29Z" fill="url(#cc-glare)" />
        <path
          d="M-33 8H33L42 22a2 2 0 0 1-2 2H-40a2 2 0 0 1-2-2Z"
          fill="url(#cc-metal)"
          {...edge}
        />
        <rect x="-33" y="8" width="66" height="1.6" fill="#7b8593" />
        <path
          d="M-26 12H26M-28 15H28M-30 18H30"
          stroke="#8a94a3"
          strokeWidth="1.6"
          strokeDasharray="3 1.5"
        />
        <rect
          x="-7"
          y="19.5"
          width="14"
          height="3"
          rx="1"
          fill="#aab3bf"
          {...edge}
        />
      </g>

      {/* Server tower */}
      <g id="cc-ic-server">
        <rect
          x="-22"
          y="-30"
          width="44"
          height="58"
          rx="3"
          fill="url(#cc-dark)"
          stroke="#161b22"
        />
        <rect
          x="-17"
          y="-25"
          width="34"
          height="12"
          rx="1.5"
          fill="#2b3340"
          stroke="#6f7886"
          strokeWidth=".7"
        />
        <rect
          x="-17"
          y="-10"
          width="34"
          height="12"
          rx="1.5"
          fill="#2b3340"
          stroke="#6f7886"
          strokeWidth=".7"
        />
        <rect
          x="-17"
          y="5"
          width="34"
          height="12"
          rx="1.5"
          fill="#2b3340"
          stroke="#6f7886"
          strokeWidth=".7"
        />
        <circle cx="-12" cy="-19" r="1.6" fill="#3ec87c" />
        <circle cx="-12" cy="-4" r="1.6" fill="#3ec87c" />
        <circle cx="-12" cy="11" r="1.6" fill="#f0b429" />
        <path
          d="M-5 -21H12M-5 -17H12M-5 -6H12M-5 -2H12M-5 9H12M-5 13H12"
          stroke="#6f7886"
          strokeWidth="1.4"
        />
        <circle
          cx="0"
          cy="23"
          r="2.6"
          fill="none"
          stroke="#9aa4b1"
          strokeWidth="1.1"
        />
        <circle cx="0" cy="23" r="0.9" fill="#3ec87c" />
      </g>

      {/* Smartphone */}
      <g id="cc-ic-phone">
        <rect
          x="-14"
          y="-30"
          width="28"
          height="58"
          rx="5"
          fill="url(#cc-dark)"
          stroke="#11161d"
        />
        <rect
          x="-11"
          y="-25"
          width="22"
          height="46"
          rx="2"
          fill="url(#cc-scr)"
        />
        <path d="M-11 -25H4L-11 -6Z" fill="url(#cc-glare)" />
        <rect x="-4" y="-28" width="8" height="1.5" rx=".75" fill="#0b0f14" />
        <rect x="-5" y="24" width="10" height="1.5" rx=".75" fill="#8a94a3" />
        <g fill="#fff" fillOpacity=".6">
          <rect x="-8.5" y="-20" width="4.5" height="4.5" rx="1.2" />
          <rect x="-2.25" y="-20" width="4.5" height="4.5" rx="1.2" />
          <rect x="4" y="-20" width="4.5" height="4.5" rx="1.2" />
          <rect x="-8.5" y="-13" width="4.5" height="4.5" rx="1.2" />
          <rect x="-2.25" y="-13" width="4.5" height="4.5" rx="1.2" />
          <rect x="4" y="-13" width="4.5" height="4.5" rx="1.2" />
        </g>
      </g>

      {/* Tablet (landscape) */}
      <g id="cc-ic-tablet">
        <rect
          x="-34"
          y="-22"
          width="68"
          height="46"
          rx="5"
          fill="url(#cc-dark)"
          stroke="#11161d"
        />
        <rect
          x="-30"
          y="-18"
          width="60"
          height="38"
          rx="2"
          fill="url(#cc-scr)"
        />
        <path d="M-30 -18H-2L-24 20H-30Z" fill="url(#cc-glare)" />
        <circle cx="-32" cy="1" r="1" fill="#0b0f14" />
        <g fill="#fff" fillOpacity=".6">
          <rect x="-24" y="-12" width="8" height="8" rx="2" />
          <rect x="-12" y="-12" width="8" height="8" rx="2" />
          <rect x="0" y="-12" width="8" height="8" rx="2" />
          <rect x="12" y="-12" width="8" height="8" rx="2" />
        </g>
      </g>

      {/* Printer */}
      <g id="cc-ic-printer">
        <rect
          x="-18"
          y="-28"
          width="36"
          height="26"
          fill="#f4f6f9"
          stroke="#aab3bf"
          strokeWidth=".7"
        />
        <path
          d="M-12 -22H12M-12 -17H12M-12 -12H6"
          stroke="#c3cad4"
          strokeWidth="1.2"
        />
        <rect
          x="-22"
          y="14"
          width="44"
          height="14"
          fill="#fff"
          stroke="#aab3bf"
          strokeWidth=".7"
        />
        <path d="M-16 20H16M-16 24H8" stroke="#c3cad4" strokeWidth="1.2" />
        <rect
          x="-36"
          y="-6"
          width="72"
          height="26"
          rx="4"
          fill="url(#cc-metal)"
          {...edge}
        />
        <rect x="-26" y="2" width="52" height="4" rx="2" fill="#2b3340" />
        <rect x="14" y="11" width="8" height="4" rx="1" fill="#8a94a3" />
        <circle cx="29" cy="13" r="1.8" fill="#3ec87c" />
      </g>

      {/* Switch (mirip Catalyst: 2 baris port + 2 uplink) */}
      <g id="cc-ic-sw">
        <rect
          x="-46"
          y="-15"
          width="92"
          height="30"
          rx="3"
          fill="url(#cc-swb)"
          stroke="#242c38"
        />
        <rect
          x="-46"
          y="-15"
          width="92"
          height="3"
          rx="1.5"
          fill="#fff"
          fillOpacity=".12"
        />
        <rect x="-46" y="15" width="92" height="3" rx="1" fill="#242c38" />
        <rect x="-34" y="-9" width="59.5" height="18" fill="url(#cc-pt)" />
        <rect x="31" y="-8" width="11" height="6" rx="1" {...port} />
        <rect x="31" y="2" width="11" height="6" rx="1" {...port} />
        <circle cx="-41" cy="-6" r="1.8" fill="#3ec87c" />
        <circle cx="-41" cy="0" r="1.8" fill="#3ec87c" />
        <circle cx="-41" cy="6" r="1.8" fill="#f0b429" />
      </g>

      {/* Router (mirip ISR: kuping rack, ventilasi, port Gi + console) */}
      <g id="cc-ic-rt">
        <rect x="-49" y="-14" width="3" height="28" rx="1" fill="#1a2b40" />
        <rect x="46" y="-14" width="3" height="28" rx="1" fill="#1a2b40" />
        <rect
          x="-46"
          y="-19"
          width="92"
          height="38"
          rx="4"
          fill="url(#cc-rtb)"
          stroke="#1a2b40"
        />
        <rect
          x="-46"
          y="-19"
          width="92"
          height="3"
          rx="1.5"
          fill="#fff"
          fillOpacity=".12"
        />
        <rect x="-46" y="19" width="92" height="3" rx="1" fill="#1a2b40" />
        <path
          d="M-36 -13H8M-36 -9H8M-36 -5H8"
          stroke="#1a2b40"
          strokeWidth="1.6"
        />
        <circle cx="22" cy="-10" r="2" fill="#3ec87c" />
        <circle cx="29" cy="-10" r="2" fill="#3ec87c" />
        <circle cx="36" cy="-10" r="2" fill="#f0b429" />
        <rect x="-38" y="3" width="11" height="8" rx="1" {...port} />
        <rect x="-23" y="3" width="11" height="8" rx="1" {...port} />
        <rect x="-8" y="3" width="11" height="8" rx="1" {...port} />
        <rect x="-36" y="8.5" width="7" height="1.2" fill="#d4b24c" />
        <rect x="-21" y="8.5" width="7" height="1.2" fill="#d4b24c" />
        <rect x="-6" y="8.5" width="7" height="1.2" fill="#d4b24c" />
        <rect x="26" y="4" width="10" height="6" rx="1" fill="#1d6fb8" />
        <circle
          cx="40"
          cy="7"
          r="2.2"
          fill="#0b0f14"
          stroke="#b8c0cc"
          strokeWidth=".6"
        />
      </g>
    </defs>
  );
}

/** Ikon kecil untuk tombol palet. Butuh <DeviceDefs /> sudah dirender di halaman (ada di canvas). */
export function DeviceThumb({
  type,
  className,
}: {
  type: DeviceType;
  className?: string;
}) {
  return (
    <svg viewBox="-50 -32 100 64" className={className} aria-hidden>
      <use href={`#cc-ic-${type}`} />
    </svg>
  );
}

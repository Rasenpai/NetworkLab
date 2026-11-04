import { ImageResponse } from "next/og";

export const alt =
  "NetworkLab, belajar MikroTik dan Cisco dengan praktik langsung";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const WHITE_WORDS = ["Belajar", "MikroTik", "dan", "Cisco", "dengan"];
const ACCENT_WORDS = ["praktik", "langsung."];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#0f0b14",
        color: "#f3eef7",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#9b59b6",
          }}
        />
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
          NetworkLab
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 20,
            fontSize: 76,
            fontWeight: 700,
            lineHeight: 1.08,
            letterSpacing: -2,
          }}
        >
          {WHITE_WORDS.map((w) => (
            <span key={w}>{w}</span>
          ))}
          {ACCENT_WORDS.map((w) => (
            <span key={w} style={{ color: "#9b59b6" }}>
              {w}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 32,
            color: "#9a8fa8",
          }}
        >
          Materi terstruktur, lab praktik, dan quiz dalam satu tempat.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "20px 28px",
          borderRadius: 16,
          border: "2px solid #2a2133",
          background: "#18121f",
          fontSize: 28,
          color: "#9a8fa8",
        }}
      >
        <span>[admin@r1] &gt;&nbsp;</span>
        <span style={{ color: "#f3eef7" }}>/ping 8.8.8.8 count=3</span>
      </div>
    </div>,
    size,
  );
}

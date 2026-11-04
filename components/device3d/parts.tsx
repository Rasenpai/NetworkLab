"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  MathUtils,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
} from "three";
import type { LedInfo, ModelProps, Vec3 } from "./types";

/* Bagian 3D yang dipakai ulang oleh semua model perangkat (MikroTik, Cisco, PC). */

/* ───────── label ─────────
   Label memakai sprite bertekstur canvas, bukan <Html> dari drei.
   <Html> membuat React root sendiri; saat kabel dicabut/dipasang atau hover
   berganti, root itu di-unmount di tengah render dan memicu error
   "Attempted to synchronously unmount a root while React was already rendering". */

export interface LabelSegment {
  t: string;
  /** Warna teks CSS. Default putih kebiruan. */
  c?: string;
}

function drawLabel(segments: LabelSegment[], dot?: string) {
  const S = 2; // resolusi canvas = 2x ukuran CSS
  const font = `600 ${12 * S}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const gap = 4 * S;
  const widths = segments.map((s) => measure.measureText(s.t).width);
  const padX = 9 * S;
  const h = 26 * S;
  const dotW = dot ? 14 * S : 0;
  const w = Math.ceil(
    padX * 2 +
      dotW +
      widths.reduce((a, b) => a + b, 0) +
      gap * (segments.length - 1),
  );

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  g.font = font;
  g.textBaseline = "middle";

  const r = 7 * S;
  g.beginPath();
  g.moveTo(r, 1);
  g.arcTo(w - 1, 1, w - 1, h - 1, r);
  g.arcTo(w - 1, h - 1, 1, h - 1, r);
  g.arcTo(1, h - 1, 1, 1, r);
  g.arcTo(1, 1, w - 1, 1, r);
  g.closePath();
  g.fillStyle = "rgba(18, 14, 26, 0.92)";
  g.fill();
  g.lineWidth = S;
  g.strokeStyle = "rgba(255, 255, 255, 0.18)";
  g.stroke();

  let x = padX;
  if (dot) {
    g.fillStyle = dot;
    g.beginPath();
    g.arc(x + 4 * S, h / 2, 4 * S, 0, Math.PI * 2);
    g.fill();
    x += dotW;
  }
  segments.forEach((s, i) => {
    g.fillStyle = s.c ?? "#f4f1fa";
    g.fillText(s.t, x, h / 2 + S * 0.5);
    x += widths[i] + gap;
  });

  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, w, h };
}

/** Label teks yang selalu menghadap kamera. Tidak menghalangi klik. */
export function Label3D({
  segments,
  dot,
  position,
}: {
  segments: LabelSegment[];
  dot?: string;
  position: Vec3;
}) {
  const key = segments.map((s) => `${s.t}|${s.c ?? ""}`).join("¦");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const label = useMemo(() => drawLabel(segments, dot), [key, dot]);
  useEffect(() => () => label.tex.dispose(), [label]);
  const k = 0.0072;
  return (
    <sprite
      position={position}
      scale={[label.w * k, label.h * k, 1]}
      renderOrder={20}
      raycast={() => null}
    >
      <spriteMaterial
        map={label.tex}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

/* ───────── komponen interaktif ───────── */

interface InteractiveProps {
  id: string;
  ctx: ModelProps;
  /** Pusat permukaan komponen. Sumbu +z menghadap keluar dari panel. */
  position: Vec3;
  /** Ukuran kotak area klik [lebar, tinggi, kedalaman]. */
  hit: Vec3;
  /** Seberapa jauh komponen "timbul" saat hover/terpilih. */
  lift?: number;
  /** Dijalankan pada klik tunggal (mis. saklar daya). */
  onActivate?: () => void;
  /** Dijalankan pada klik dua kali (mis. cabut/pasang kabel di port). */
  onDouble?: () => void;
  children: ReactNode;
}

/**
 * Membungkus komponen agar bisa di-hover dan diklik.
 * Hover: komponen sedikit maju dan menyala dengan warna aksen.
 * Terpilih: cincin aksen berdenyut. Drag untuk memutar kamera tidak dianggap klik.
 */
export function Interactive({
  id,
  ctx,
  position,
  hit,
  lift = 0.05,
  onActivate,
  onDouble,
  children,
}: InteractiveProps) {
  const inner = useRef<Group>(null);
  const glow = useRef<Mesh>(null);
  const selected = ctx.selectedId === id;
  const hovered = ctx.hoveredId === id;
  const name = ctx.parts.find((p) => p.id === id)?.name ?? id;

  useFrame(({ clock }, delta) => {
    const k = 1 - Math.exp(-delta * 14);
    const g = inner.current;
    if (g)
      g.position.z += ((hovered || selected ? lift : 0) - g.position.z) * k;

    const mesh = glow.current;
    if (!mesh) return;
    const mat = mesh.material as MeshBasicMaterial;
    const target = selected
      ? 0.6 + 0.25 * Math.sin(clock.elapsedTime * 4)
      : hovered
        ? 0.45
        : 0;
    mat.opacity += (target - mat.opacity) * k;
    mesh.visible = mat.opacity > 0.01;
  });

  return (
    <group position={position}>
      <group ref={inner}>
        <mesh ref={glow} position={[0, 0, -0.03]} visible={false}>
          <boxGeometry args={[hit[0] + 0.12, hit[1] + 0.12, 0.05]} />
          <meshBasicMaterial
            color={ctx.accent}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
        {children}
      </group>

      {/* Area klik tak terlihat */}
      <mesh
        position={[0, 0, hit[2] / 2]}
        onPointerOver={(e) => {
          e.stopPropagation();
          ctx.onHover(id, true);
        }}
        onPointerOut={() => ctx.onHover(id, false)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.delta > 5) return; // kamera sedang diseret
          ctx.onSelect(id);
          onActivate?.();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (e.delta > 5) return;
          onDouble?.();
        }}
      >
        <boxGeometry args={hit} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {hovered && (
        <Label3D
          segments={[{ t: name }]}
          position={[0, hit[1] / 2 + 0.3, hit[2]]}
        />
      )}
    </group>
  );
}

/* ───────── soket dan saklar ───────── */

/** Soket RJ-45 (menghadap +z). `shell` mengganti warna logam (mis. biru untuk console). */
export function RjPort({
  width = 0.7,
  height = 0.56,
  shell = "#aeb3bc",
}: {
  width?: number;
  height?: number;
  shell?: string;
}) {
  const pins = useMemo(() => Array.from({ length: 8 }, (_, i) => i), []);
  return (
    <group>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial color={shell} metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.01, 0.082]}>
        <boxGeometry args={[width - 0.12, height - 0.14, 0.01]} />
        <meshStandardMaterial color="#050506" roughness={0.9} />
      </mesh>
      <mesh position={[0, height / 2 - 0.1, 0.083]}>
        <boxGeometry args={[0.2, 0.1, 0.01]} />
        <meshStandardMaterial color="#050506" roughness={0.9} />
      </mesh>
      {pins.map((i) => (
        <mesh key={i} position={[(i - 3.5) * 0.058, -height / 2 + 0.13, 0.09]}>
          <boxGeometry args={[0.028, 0.1, 0.012]} />
          <meshStandardMaterial
            color="#d4af37"
            metalness={1}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/** Saklar rocker I/O (menghadap +z). Miring ke bawah saat mati, ke atas saat hidup. */
export function Rocker({
  on,
  size = [0.3, 0.44],
}: {
  on: boolean;
  size?: [number, number];
}) {
  const sw = useRef<Group>(null);
  useFrame((_, delta) => {
    const g = sw.current;
    if (!g) return;
    const target = on ? -0.32 : 0.32;
    g.rotation.x += (target - g.rotation.x) * (1 - Math.exp(-delta * 14));
  });
  return (
    <group>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[size[0] + 0.1, size[1] + 0.1, 0.06]} />
        <meshStandardMaterial color="#141417" roughness={0.7} />
      </mesh>
      <group ref={sw} position={[0, 0, 0.08]}>
        <mesh>
          <boxGeometry args={[size[0], size[1], 0.1]} />
          <meshStandardMaterial color="#2b2e35" roughness={0.45} />
        </mesh>
        <mesh position={[0, size[1] * 0.27, 0.053]}>
          <boxGeometry args={[size[0] * 0.28, 0.035, 0.01]} />
          <meshStandardMaterial
            color={on ? "#22c55e" : "#5b5f69"}
            emissive={on ? "#22c55e" : "#000000"}
            emissiveIntensity={on ? 2 : 0}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}

/** Lubang soket listrik C13/C14 (menghadap +z). */
export function AcInlet({ width = 0.62, height = 0.42 }) {
  return (
    <group>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width, height, 0.08]} />
        <meshStandardMaterial
          color="#aeb3bc"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.082]}>
        <boxGeometry args={[width - 0.1, height - 0.1, 0.01]} />
        <meshStandardMaterial color="#050506" roughness={0.9} />
      </mesh>
      {[-0.17, 0, 0.17].map((x, i) => (
        <mesh key={i} position={[x, i === 1 ? 0.06 : -0.04, 0.09]}>
          <boxGeometry args={[0.05, 0.12, 0.012]} />
          <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* ───────── kabel ───────── */

const ease = (x: number) => x * x * (3 - 2 * x);

/** Titik kontrol kabel. tv=1: tertancap di port; tv=0: tergeletak di lantai di depan port. */
function cablePoints(
  spread: number,
  drop: number,
  length: number,
  tv: number,
): Vector3[] {
  const e = ease(tv);
  const lift = Math.sin(Math.PI * tv) * 0.4; // konektor terangkat saat dicabut/dipasang
  const lx = spread * 0.35;
  const plugged: Vec3[] = [
    [0, 0, 0.04],
    [0, 0, 0.62],
    [spread * 0.15, drop * 0.15, 1.2],
    [spread * 0.5, drop * 0.75, 2.0],
    [spread, drop, 3.0],
    [spread * 1.1, drop, length],
  ];
  const loose: Vec3[] = [
    [lx, drop + 0.17, 1.0],
    [lx, drop + 0.17, 1.6],
    [spread * 0.55, drop + 0.03, 2.2],
    [spread * 0.8, drop, 2.7],
    [spread, drop, 3.1],
    [spread * 1.1, drop, length],
  ];
  return plugged.map(
    (p, i) =>
      new Vector3(
        MathUtils.lerp(loose[i][0], p[0], e),
        MathUtils.lerp(loose[i][1], p[1], e) + (i < 2 ? lift : 0),
        MathUtils.lerp(loose[i][2], p[2], e),
      ),
  );
}

interface CableProps {
  /** id port tempat kabel tertancap; klik/hover kabel = klik/hover port. */
  id: string;
  ctx: ModelProps;
  /** Pusat muka port (+z keluar dari panel), sama dengan <Interactive>. */
  position: Vec3;
  color: string;
  /** Teks tujuan yang tampil di ujung kabel. */
  label: string;
  /** false = tampilkan penanda "mati" pada label. */
  up?: boolean;
  /** false = kabel dicabut: konektor tergeletak di lantai. Default true. */
  plugged?: boolean;
  /** Dijalankan saat kabel diklik dua kali. */
  onToggle?: () => void;
  /** Geser sisi X di ujung kabel supaya kabel tidak bertumpuk. */
  spread: number;
  /** Panjang kabel ke depan dari panel. */
  length: number;
  /** Ukuran konektor [lebar, tinggi]. Default konektor RJ-45. */
  plug?: [number, number];
  /** Ketinggian permukaan tempat kabel berbaring, relatif ke dunia. */
  floorY?: number;
}

/** Kabel dengan konektor di port, melengkung ke lantai, dan label tujuan di ujungnya.
 *  Saat `plugged` berubah, konektor tercabut/tertancap dengan animasi. */
export function Cable({
  id,
  ctx,
  position,
  color,
  label,
  up,
  plugged = true,
  onToggle,
  spread,
  length,
  plug = [0.4, 0.32],
  floorY = -0.62,
}: CableProps) {
  const drop = floorY - position[1];
  const tube = useRef<Mesh>(null);
  const head = useRef<Group>(null);
  const progress = useRef(plugged ? 1 : 0);
  const Z = useMemo(() => new Vector3(0, 0, 1), []);

  const apply = useMemo(
    () => (tv: number) => {
      const curve = new CatmullRomCurve3(
        cablePoints(spread, drop, length, tv),
        false,
        "centripetal",
      );
      const mesh = tube.current;
      if (mesh) {
        mesh.geometry.dispose();
        mesh.geometry = new TubeGeometry(curve, 72, 0.055, 10, false);
      }
      const g = head.current;
      if (g) {
        g.position.copy(curve.getPoint(0));
        g.quaternion.setFromUnitVectors(Z, curve.getTangent(0).normalize());
      }
    },
    [spread, drop, length, Z],
  );

  useLayoutEffect(() => {
    apply(progress.current);
  }, [apply]);

  useEffect(() => {
    const mesh = tube.current;
    return () => mesh?.geometry.dispose();
  }, []);

  useFrame((_, delta) => {
    const goal = plugged ? 1 : 0;
    const cur = progress.current;
    if (cur === goal) return;
    const step = delta * 2.4;
    progress.current =
      cur < goal ? Math.min(goal, cur + step) : Math.max(goal, cur - step);
    apply(progress.current);
  });

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      ctx.onHover(id, true);
    },
    onPointerOut: () => ctx.onHover(id, false),
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > 5) return; // kamera sedang diseret
      ctx.onSelect(id);
    },
    onDoubleClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > 5) return;
      onToggle?.();
    },
  };

  const [pw, ph] = plug;
  const end: Vec3 = [spread * 1.1, drop, length];
  const status: { t: string; c: string }[] = !plugged
    ? [{ t: "· dicabut", c: "#fca5a5" }]
    : up === false
      ? [{ t: "· mati", c: "#fcd34d" }]
      : [];

  return (
    <group position={position}>
      {/* Konektor: badan bening + boot berwarna kabel */}
      <group ref={head}>
        <mesh position={[0, 0, 0.18]} {...handlers}>
          <boxGeometry args={[pw, ph, 0.36]} />
          <meshPhysicalMaterial
            color="#e6eaf0"
            roughness={0.25}
            clearcoat={0.6}
          />
        </mesh>
        <mesh position={[0, 0, 0.46]} {...handlers}>
          <boxGeometry args={[pw * 0.78, ph * 0.8, 0.28]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      </group>

      {/* Badan kabel (geometri dibangun ulang saat animasi) */}
      <mesh ref={tube} {...handlers}>
        <meshStandardMaterial color={color} roughness={0.55} />
      </mesh>

      {/* Ujung kabel menuju perangkat lain */}
      <mesh position={[end[0], end[1] + 0.02, end[2] + 0.12]}>
        <boxGeometry args={[pw * 0.7, ph * 0.7, 0.26]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <Label3D
        segments={[{ t: label }, ...status]}
        dot={color}
        position={[end[0], end[1] + 0.36, end[2]]}
      />
    </group>
  );
}

/** LED port menyala hanya bila perangkat hidup, kabel tertancap, dan link aktif.
 *  Tanpa data kabel (mode demo), LED mengikuti status daya saja. */
export function portLinkOn(ctx: ModelProps, portId?: string): boolean {
  if (!ctx.powered) return false;
  if (!portId || !ctx.cables) return true;
  return ctx.cables.some((c) => c.portId === portId && c.plugged && c.up);
}

/* ───────── LED ───────── */

function hash(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h += text.charCodeAt(i) * (i + 1);
  return h * 0.37;
}

/** LED di permukaan atas (menghadap +y). Pola nyala mengikuti `led.mode`. */
export function StatusLed({
  led,
  position,
  radius = 0.09,
  active = true,
}: {
  led: LedInfo;
  position: Vec3;
  radius?: number;
  /** false = LED padam (mis. perangkat mati, port tanpa kabel, atau link mati). */
  active?: boolean;
}) {
  const cap = useRef<Mesh>(null);
  const halo = useRef<Mesh>(null);
  const phase = useMemo(() => hash(led.id), [led.id]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    let a = 1;
    if (led.mode === "pulse") a = 0.55 + 0.45 * Math.sin(t * 2.2);
    else if (led.mode === "blink")
      a = Math.sin(t * 7.1) + Math.sin(t * 3.3) > -0.6 ? 1 : 0.15;

    if (!active) a = 0;

    if (cap.current)
      (cap.current.material as MeshStandardMaterial).emissiveIntensity = active
        ? 0.3 + a * 2.4
        : 0.03;
    if (halo.current)
      (halo.current.material as MeshBasicMaterial).opacity = 0.5 * a;
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.004, 0]}>
        <cylinderGeometry args={[radius * 1.45, radius * 1.45, 0.012, 24]} />
        <meshStandardMaterial color="#2a2b31" roughness={0.6} />
      </mesh>
      <mesh ref={cap} position={[0, 0.016, 0]}>
        <cylinderGeometry args={[radius, radius, 0.02, 24]} />
        <meshStandardMaterial
          color={led.color}
          emissive={led.color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={halo} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 3.4, 32]} />
        <meshBasicMaterial
          color={led.color}
          transparent
          opacity={0.4}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

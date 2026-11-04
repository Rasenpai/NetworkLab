"use client";

import { RoundedBox } from "@react-three/drei";
import DeviceViewer from "./DeviceViewer";
import {
  AcInlet,
  Cable,
  Interactive,
  portLinkOn,
  RjPort,
  Rocker,
  StatusLed,
} from "./parts";
import type {
  DeviceDefinition,
  DeviceViewerProps,
  LedInfo,
  ModelProps,
  PartInfo,
} from "./types";

/* Model prosedural router Cisco ISR 2911 (model referensi untuk lab Cisco).
   Panel port menghadap +z. Id port = nama interface di simulator. */

const W = 7.0;
const H = 1.5;
const D = 4.0;
const FRONT = D / 2;
const TOP = H / 2;
const GROUND_Y = -0.82;
const FLOOR_Y = GROUND_Y + 0.06;

const GE_IDS = [
  "GigabitEthernet0/0",
  "GigabitEthernet0/1",
  "GigabitEthernet0/2",
];
const GE_X = [-2.6, -1.85, -1.1];
const CONSOLE_X = 0.1;
const AUX_X = 0.75;
const USB_X = 1.65;
const INLET_X = 2.55;
const SWITCH_X = 3.12;
const PORT_Y = -0.05;

const CABLE_COLORS = ["#38bdf8", "#f472b6", "#a3e635"];

const GE_FACTS = [
  { label: "Kecepatan", value: "10/100/1000 Mbps" },
  { label: "Konektor", value: "RJ-45" },
  { label: "Mode", value: "Port router (layer 3)" },
];

const parts: PartInfo[] = [
  {
    id: GE_IDS[0],
    name: "Gi0/0",
    kind: "ethernet",
    summary: "GigabitEthernet0/0",
    description:
      "Port router pertama. Di IOS semua interface mati (administratively down) sampai Anda menjalankan no shutdown. LED port baru menyala bila interface aktif dan kabel terhubung ke perangkat yang juga hidup.",
    facts: GE_FACTS,
  },
  {
    id: GE_IDS[1],
    name: "Gi0/1",
    kind: "ethernet",
    summary: "GigabitEthernet0/1",
    description:
      "Port router kedua. Pada lab ini biasanya dipakai untuk LAN atau menghubungkan ke router lain. Beri IP dengan ip address lalu aktifkan dengan no shutdown.",
    facts: GE_FACTS,
  },
  {
    id: GE_IDS[2],
    name: "Gi0/2",
    kind: "ethernet",
    summary: "GigabitEthernet0/2",
    description:
      "Port router ketiga. ISR 2911 punya tiga port GigabitEthernet onboard. Tidak semua lab memakai port ini.",
    facts: GE_FACTS,
  },
  {
    id: "console",
    name: "Console",
    kind: "console",
    summary: "Akses CLI",
    description:
      "Port RJ-45 berwarna biru untuk konfigurasi lewat kabel rollover dan program terminal. Dipakai saat router baru yang belum punya IP. Pada simulator ini, terminal di bawah model mewakili sesi console.",
    facts: [
      { label: "Kecepatan", value: "9600 baud" },
      { label: "Kabel", value: "Rollover" },
    ],
  },
  {
    id: "aux",
    name: "AUX",
    kind: "console",
    summary: "Auxiliary",
    description:
      "Port cadangan untuk akses CLI lewat modem. Sekarang jarang dipakai.",
  },
  {
    id: "usb",
    name: "USB ×2",
    kind: "usb",
    summary: "USB 2.0",
    description:
      "Dua port USB 2.0 untuk flash drive atau token keamanan. Bisa dipakai menyalin image IOS dan file konfigurasi.",
  },
  {
    id: "power",
    name: "Soket AC",
    kind: "power",
    summary: "Input daya",
    description:
      "Soket C13 untuk kabel daya AC 100–240 V. Cabut kabelnya dan router kehilangan daya seketika, sama seperti mematikan saklar.",
    facts: [
      { label: "Tegangan", value: "100–240 V AC" },
      { label: "Frekuensi", value: "50/60 Hz" },
    ],
  },
  {
    id: "power-switch",
    name: "Saklar daya",
    kind: "switch",
    summary: "I / O",
    description:
      "Saklar rocker I/O. Klik sekali di model untuk menyalakan atau mematikan router. Saat mati, terminal tidak bisa dipakai dan link ke perangkat lain putus.",
  },
];

const leds: LedInfo[] = [
  {
    id: "led-pwr",
    name: "PWR",
    color: "#22c55e",
    mode: "solid",
    meaning: "hijau menyala terus: router mendapat daya.",
  },
  {
    id: "led-sys",
    name: "SYS",
    color: "#22c55e",
    mode: "pulse",
    meaning: "hijau berdenyut: IOS berjalan normal.",
  },
  {
    id: "led-ge",
    name: "Gi0/0–Gi0/2",
    color: "#22c55e",
    mode: "blink",
    meaning:
      "hijau: link aktif, berkedip saat ada trafik. Padam bila interface shutdown, kabel dicabut, atau perangkat seberang mati.",
  },
];

const ledAt: { led: LedInfo; x: number; n: string; port?: string }[] = [
  { led: leds[2], x: GE_X[0], n: "led-ge-0", port: GE_IDS[0] },
  { led: leds[2], x: GE_X[1], n: "led-ge-1", port: GE_IDS[1] },
  { led: leds[2], x: GE_X[2], n: "led-ge-2", port: GE_IDS[2] },
  { led: leds[0], x: CONSOLE_X, n: "led-pwr" },
  { led: leds[1], x: AUX_X, n: "led-sys" },
];

function UsbA({ x }: { x: number }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.4, 0.2, 0.08]} />
        <meshStandardMaterial
          color="#aeb3bc"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.082]}>
        <boxGeometry args={[0.32, 0.11, 0.01]} />
        <meshStandardMaterial color="#050506" roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.025, 0.09]}>
        <boxGeometry args={[0.26, 0.03, 0.012]} />
        <meshStandardMaterial color="#e5e7eb" roughness={0.6} />
      </mesh>
    </group>
  );
}

function CiscoModel(ctx: ModelProps) {
  const face = FRONT;
  return (
    <group>
      {/* Bodi */}
      <RoundedBox args={[W, H, D]} radius={0.1} smoothness={4}>
        <meshPhysicalMaterial
          color="#c9ced6"
          roughness={0.42}
          clearcoat={0.5}
          clearcoatRoughness={0.35}
        />
      </RoundedBox>
      <RoundedBox
        args={[W - 0.6, 0.05, D - 0.7]}
        radius={0.02}
        smoothness={2}
        position={[0, TOP + 0.015, -0.1]}
      >
        <meshStandardMaterial color="#d8dce3" roughness={0.5} />
      </RoundedBox>

      {/* Ventilasi atas */}
      {[-1.15, -0.85, -0.55].map((z) =>
        Array.from({ length: 13 }, (_, i) => (
          <mesh key={`${z}-${i}`} position={[-2.4 + i * 0.4, TOP + 0.043, z]}>
            <boxGeometry args={[0.28, 0.01, 0.07]} />
            <meshStandardMaterial color="#7b808a" roughness={0.8} />
          </mesh>
        )),
      )}

      {/* Pelat panel port + garis biru */}
      <RoundedBox
        args={[W - 0.35, H - 0.28, 0.05]}
        radius={0.03}
        smoothness={2}
        position={[0, -0.02, face]}
      >
        <meshStandardMaterial color="#1c2535" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, TOP - 0.2, face + 0.03]}>
        <boxGeometry args={[W - 0.35, 0.04, 0.012]} />
        <meshStandardMaterial
          color="#049fd9"
          emissive="#049fd9"
          emissiveIntensity={ctx.powered ? 0.9 : 0.05}
          toneMapped={false}
        />
      </mesh>

      {/* Telinga rak */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (W / 2 + 0.11), 0, face - 0.04]}>
          <mesh>
            <boxGeometry args={[0.22, H * 0.92, 0.08]} />
            <meshStandardMaterial
              color="#aab0ba"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {[-0.4, 0.4].map((y) => (
            <mesh
              key={y}
              position={[0, y, 0.045]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <cylinderGeometry args={[0.045, 0.045, 0.01, 16]} />
              <meshStandardMaterial color="#09090b" />
            </mesh>
          ))}
        </group>
      ))}

      {/* Kaki */}
      {[
        [-3.0, -1.6],
        [3.0, -1.6],
        [-3.0, 1.6],
        [3.0, 1.6],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -TOP - 0.03, z]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 20]} />
          <meshStandardMaterial color="#26262b" roughness={0.9} />
        </mesh>
      ))}

      {/* Port GigabitEthernet: klik dua kali = cabut/pasang kabel */}
      {GE_IDS.map((id, i) => (
        <Interactive
          key={id}
          id={id}
          ctx={ctx}
          position={[GE_X[i], PORT_Y, face]}
          hit={[0.8, 0.66, 0.2]}
          onDouble={() => ctx.onToggleCable(id)}
        >
          <RjPort />
        </Interactive>
      ))}

      {/* Console (biru) dan AUX */}
      <Interactive
        id="console"
        ctx={ctx}
        position={[CONSOLE_X, PORT_Y, face]}
        hit={[0.65, 0.6, 0.2]}
      >
        <RjPort width={0.58} height={0.5} shell="#3b82c4" />
      </Interactive>
      <Interactive
        id="aux"
        ctx={ctx}
        position={[AUX_X, PORT_Y, face]}
        hit={[0.65, 0.6, 0.2]}
      >
        <RjPort width={0.58} height={0.5} shell="#33363d" />
      </Interactive>

      {/* USB ×2 */}
      <Interactive
        id="usb"
        ctx={ctx}
        position={[USB_X, PORT_Y, face]}
        hit={[1.0, 0.36, 0.2]}
      >
        <UsbA x={-0.25} />
        <UsbA x={0.25} />
      </Interactive>

      {/* Soket AC: klik dua kali = cabut/pasang kabel daya */}
      <Interactive
        id="power"
        ctx={ctx}
        position={[INLET_X, PORT_Y, face]}
        hit={[0.7, 0.5, 0.2]}
        onDouble={ctx.onTogglePower}
      >
        <AcInlet />
      </Interactive>

      {/* Saklar I/O: klik sekali = hidup/mati */}
      <Interactive
        id="power-switch"
        ctx={ctx}
        position={[SWITCH_X, PORT_Y, face]}
        hit={[0.5, 0.62, 0.2]}
        lift={0.02}
        onActivate={ctx.onTogglePower}
      >
        <Rocker on={ctx.powered} />
      </Interactive>

      {/* Kabel daya */}
      <Cable
        id="power"
        ctx={ctx}
        position={[INLET_X, PORT_Y, face]}
        color="#18181b"
        label="Kabel daya AC"
        plugged={ctx.powered}
        onToggle={ctx.onTogglePower}
        spread={1.2}
        length={3.8}
        plug={[0.52, 0.34]}
        floorY={FLOOR_Y}
      />

      {/* Kabel data mengikuti topologi lab */}
      {ctx.cables?.map((c) => {
        const i = GE_IDS.indexOf(c.portId);
        if (i < 0) return null;
        return (
          <Cable
            key={c.portId}
            id={c.portId}
            ctx={ctx}
            position={[GE_X[i], PORT_Y, face]}
            color={CABLE_COLORS[i]}
            label={c.label}
            up={c.up && ctx.powered}
            plugged={c.plugged}
            onToggle={() => ctx.onToggleCable(c.portId)}
            spread={GE_X[i] * 0.9}
            length={3.4 + (i % 2) * 1.0}
            floorY={FLOOR_Y}
          />
        );
      })}

      {/* LED di permukaan atas */}
      {ledAt.map(({ led, x, n, port }) => (
        <StatusLed
          key={n}
          led={{ ...led, id: n }}
          position={[x, TOP + 0.04, face - 0.5]}
          active={port ? portLinkOn(ctx, port) : ctx.powered}
        />
      ))}
    </group>
  );
}

export const ciscoRouter: DeviceDefinition = {
  vendor: "Cisco",
  model: "ISR 2911 (model referensi)",
  description:
    "Router modular kelas cabang dengan tiga port GigabitEthernet onboard, console, AUX, dan USB. Dipakai sebagai model 3D untuk semua router Cisco di lab. Klik port atau pilih dari daftar untuk melihat fungsinya.",
  specs: [
    { label: "Port router", value: "3 × GigabitEthernet" },
    { label: "Console", value: "RJ-45 + USB mini-B" },
    { label: "USB", value: "2 × USB 2.0" },
    { label: "Daya", value: "100–240 V AC" },
    { label: "Sistem", value: "Cisco IOS" },
  ],
  parts,
  leds,
  groundY: GROUND_Y,
  camera: {
    position: [0, 5.0, 10.0],
    target: [0, 0, 0.3],
    minDistance: 5,
    maxDistance: 22,
  },
  Model: CiscoModel,
};

export function CiscoRouterViewer(props: DeviceViewerProps) {
  return <DeviceViewer device={ciscoRouter} {...props} />;
}

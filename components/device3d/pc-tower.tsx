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

/* Model prosedural PC desktop (casing tower) dilihat dari BELAKANG: port LAN, soket
   listrik, dan saklar PSU ada di panel belakang yang menghadap kamera (+z).
   Tombol power ada di bagian atas casing. */

const W = 2.6;
const H = 4.2;
const D = 4.0;
const BACK = D / 2;
const TOP = H / 2;
const GROUND_Y = -H / 2 - 0.1;
const FLOOR_Y = GROUND_Y + 0.06;

const ETH = { x: 0.45, y: 1.2 };
const INLET = { x: -0.7, y: -1.18 };
const PSU_SWITCH = { x: -0.7, y: -1.66 };
const BTN = { x: 0, z: 1.15 };

const parts: PartInfo[] = [
  {
    id: "eth0",
    name: "LAN (eth0)",
    kind: "ethernet",
    summary: "Network card",
    description:
      "Port Ethernet bawaan motherboard. Sambungkan ke switch atau router dengan kabel UTP. IP diatur lewat terminal PC: ip <alamat>/<prefix> <gateway>, atau dhcp untuk meminta IP otomatis.",
    facts: [
      { label: "Kecepatan", value: "10/100/1000 Mbps" },
      { label: "Konektor", value: "RJ-45" },
    ],
  },
  {
    id: "power",
    name: "Soket AC",
    kind: "power",
    summary: "Input daya PSU",
    description:
      "Soket C14 untuk kabel daya dari stopkontak. Mencabut kabel ini memutus listrik PC seketika, jadi PC mati dan link LAN-nya putus.",
    facts: [{ label: "Tegangan", value: "100–240 V AC" }],
  },
  {
    id: "psu-switch",
    name: "Saklar PSU",
    kind: "switch",
    summary: "I / O",
    description:
      "Saklar utama pada power supply. Klik sekali untuk menyalakan atau mematikan PC. Pada PC sungguhan, saklar ini harus I (hidup) agar tombol power depan bekerja.",
  },
  {
    id: "power-btn",
    name: "Tombol power",
    kind: "switch",
    summary: "Power button",
    description:
      "Tombol di bagian atas casing. Klik sekali untuk menyalakan atau mematikan PC. Saat mati, terminal PC tidak bisa dipakai.",
  },
];

const leds: LedInfo[] = [
  {
    id: "led-pwr",
    name: "PWR",
    color: "#22c55e",
    mode: "solid",
    meaning: "hijau menyala terus: PC hidup.",
  },
  {
    id: "led-hdd",
    name: "HDD",
    color: "#f59e0b",
    mode: "blink",
    meaning: "kuning berkedip: aktivitas disk saat PC hidup.",
  },
  {
    id: "led-nic",
    name: "NIC",
    color: "#22c55e",
    mode: "blink",
    meaning:
      "hijau di samping port LAN: link aktif, berkedip saat ada trafik. Padam bila kabel dicabut atau perangkat seberang mati.",
  },
];

/** LED menghadap +z (panel belakang): putar grup 90° sekeliling sumbu x. */
function RearLed({
  led,
  x,
  y,
  active,
}: {
  led: LedInfo;
  x: number;
  y: number;
  active: boolean;
}) {
  return (
    <group position={[x, y, BACK + 0.05]} rotation={[Math.PI / 2, 0, 0]}>
      <StatusLed led={led} position={[0, 0, 0]} radius={0.05} active={active} />
    </group>
  );
}

function Jack({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <group position={[x, y, BACK + 0.06]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.09, 0.09, 0.04, 20]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.021, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.01, 16]} />
        <meshStandardMaterial color="#050506" />
      </mesh>
    </group>
  );
}

function UsbDecor({ x, y, blue }: { x: number; y: number; blue?: boolean }) {
  return (
    <group position={[x, y, BACK + 0.05]}>
      <mesh>
        <boxGeometry args={[0.32, 0.18, 0.05]} />
        <meshStandardMaterial
          color="#aeb3bc"
          metalness={0.85}
          roughness={0.3}
        />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.24, 0.07, 0.01]} />
        <meshStandardMaterial color={blue ? "#2563eb" : "#050506"} />
      </mesh>
    </group>
  );
}

function PcModel(ctx: ModelProps) {
  const z = BACK;
  return (
    <group>
      {/* Casing */}
      <RoundedBox args={[W, H, D]} radius={0.08} smoothness={4}>
        <meshPhysicalMaterial
          color="#2a2c33"
          roughness={0.45}
          metalness={0.45}
          clearcoat={0.3}
        />
      </RoundedBox>
      {/* Panel samping kaca */}
      <mesh position={[W / 2 + 0.006, 0, -0.1]}>
        <boxGeometry args={[0.02, H - 0.5, D - 0.9]} />
        <meshPhysicalMaterial
          color="#0d1016"
          roughness={0.1}
          metalness={0.2}
          clearcoat={1}
        />
      </mesh>
      {/* Kisi udara atas */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} position={[-0.9 + i * 0.225, TOP + 0.004, -0.5]}>
          <boxGeometry args={[0.1, 0.012, 1.2]} />
          <meshStandardMaterial color="#14151a" roughness={0.8} />
        </mesh>
      ))}
      {/* Kaki */}
      {[
        [-1.0, -1.5],
        [1.0, -1.5],
        [-1.0, 1.5],
        [1.0, 1.5],
      ].map(([x, zz]) => (
        <mesh key={`${x}${zz}`} position={[x, -H / 2 - 0.04, zz]}>
          <cylinderGeometry args={[0.14, 0.14, 0.08, 20]} />
          <meshStandardMaterial color="#111114" roughness={0.9} />
        </mesh>
      ))}

      {/* Panel belakang */}
      <mesh position={[0, 0, z + 0.005]}>
        <boxGeometry args={[W - 0.12, H - 0.12, 0.03]} />
        <meshStandardMaterial color="#1a1b20" roughness={0.6} />
      </mesh>

      {/* I/O shield motherboard */}
      <mesh position={[0, 1.45, z + 0.03]}>
        <boxGeometry args={[2.3, 1.0, 0.03]} />
        <meshStandardMaterial color="#b8bdc6" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-0.85, -0.5, -0.15, 0.2].map((x, i) => (
        <UsbDecor key={x} x={x} y={1.72} blue={i >= 2} />
      ))}
      <group position={[0.85, 1.72, z + 0.05]}>
        <mesh>
          <boxGeometry args={[0.5, 0.18, 0.05]} />
          <meshStandardMaterial
            color="#aeb3bc"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.4, 0.08, 0.01]} />
          <meshStandardMaterial color="#050506" />
        </mesh>
      </group>
      <Jack x={-0.9} y={1.2} color="#4ade80" />
      <Jack x={-0.62} y={1.2} color="#f472b6" />
      <Jack x={-0.34} y={1.2} color="#60a5fa" />

      {/* LAN: klik dua kali = cabut/pasang kabel */}
      <Interactive
        id="eth0"
        ctx={ctx}
        position={[ETH.x, ETH.y, z + 0.04]}
        hit={[0.8, 0.66, 0.2]}
        onDouble={() => ctx.onToggleCable("eth0")}
      >
        <RjPort />
      </Interactive>
      <RearLed
        led={{ ...leds[2], id: "led-nic-link" }}
        x={ETH.x + 0.55}
        y={ETH.y + 0.12}
        active={portLinkOn(ctx, "eth0")}
      />
      <RearLed
        led={{ ...leds[1], id: "led-nic-act", color: "#f59e0b" }}
        x={ETH.x + 0.55}
        y={ETH.y - 0.08}
        active={portLinkOn(ctx, "eth0")}
      />

      {/* Slot ekspansi */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[0, 0.55 - i * 0.2, z + 0.03]}>
          <boxGeometry args={[2.3, 0.15, 0.03]} />
          <meshStandardMaterial
            color={i % 2 ? "#7f858f" : "#8a8f99"}
            metalness={0.7}
            roughness={0.45}
          />
        </mesh>
      ))}

      {/* Power supply */}
      <mesh position={[0, -1.35, z + 0.03]}>
        <boxGeometry args={[2.3, 1.15, 0.03]} />
        <meshStandardMaterial color="#121317" roughness={0.6} />
      </mesh>
      <group position={[0.55, -1.35, z + 0.05]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.02, 40]} />
          <meshStandardMaterial color="#050506" roughness={0.9} />
        </mesh>
        {[0.14, 0.28, 0.42].map((r) => (
          <mesh key={r} position={[0, 0, 0.012]}>
            <torusGeometry args={[r, 0.013, 8, 40]} />
            <meshStandardMaterial
              color="#6b7079"
              metalness={0.8}
              roughness={0.4}
            />
          </mesh>
        ))}
        {[0, Math.PI / 2].map((a) => (
          <mesh key={a} position={[0, 0, 0.012]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.92, 0.02, 0.012]} />
            <meshStandardMaterial
              color="#6b7079"
              metalness={0.8}
              roughness={0.4}
            />
          </mesh>
        ))}
      </group>

      {/* Soket AC: klik dua kali = cabut/pasang kabel daya */}
      <Interactive
        id="power"
        ctx={ctx}
        position={[INLET.x, INLET.y, z + 0.05]}
        hit={[0.7, 0.5, 0.2]}
        onDouble={ctx.onTogglePower}
      >
        <AcInlet />
      </Interactive>

      {/* Saklar PSU: klik sekali = hidup/mati */}
      <Interactive
        id="psu-switch"
        ctx={ctx}
        position={[PSU_SWITCH.x, PSU_SWITCH.y, z + 0.05]}
        hit={[0.5, 0.6, 0.2]}
        lift={0.02}
        onActivate={ctx.onTogglePower}
      >
        <Rocker on={ctx.powered} />
      </Interactive>

      {/* Tombol power di atas casing (grup diputar agar +z menghadap ke atas) */}
      <group position={[BTN.x, TOP, BTN.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <Interactive
          id="power-btn"
          ctx={ctx}
          position={[0, 0, 0]}
          hit={[0.55, 0.55, 0.2]}
          lift={0.03}
          onActivate={ctx.onTogglePower}
        >
          <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, 28]} />
            <meshStandardMaterial
              color="#3a3d45"
              metalness={0.8}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <torusGeometry args={[0.22, 0.022, 10, 36]} />
            <meshStandardMaterial
              color={ctx.powered ? "#22c55e" : "#4b4f58"}
              emissive={ctx.powered ? "#22c55e" : "#000000"}
              emissiveIntensity={ctx.powered ? 2 : 0}
              toneMapped={false}
            />
          </mesh>
        </Interactive>
      </group>

      {/* Kabel daya dan kabel LAN */}
      <Cable
        id="power"
        ctx={ctx}
        position={[INLET.x, INLET.y, z + 0.05]}
        color="#18181b"
        label="Kabel daya AC"
        plugged={ctx.powered}
        onToggle={ctx.onTogglePower}
        spread={-0.5}
        length={3.8}
        plug={[0.52, 0.34]}
        floorY={FLOOR_Y}
      />
      {ctx.cables?.map((c) =>
        c.portId === "eth0" ? (
          <Cable
            key={c.portId}
            id={c.portId}
            ctx={ctx}
            position={[ETH.x, ETH.y, z + 0.04]}
            color="#38bdf8"
            label={c.label}
            up={c.up && ctx.powered}
            plugged={c.plugged}
            onToggle={() => ctx.onToggleCable(c.portId)}
            spread={0.9}
            length={3.6}
            floorY={FLOOR_Y}
          />
        ) : null,
      )}

      {/* LED di atas casing */}
      <StatusLed
        led={{ ...leds[0], id: "led-pwr" }}
        position={[-0.5, TOP + 0.003, BTN.z]}
        radius={0.06}
        active={ctx.powered}
      />
      <StatusLed
        led={{ ...leds[1], id: "led-hdd" }}
        position={[-0.8, TOP + 0.003, BTN.z]}
        radius={0.06}
        active={ctx.powered}
      />
    </group>
  );
}

export const pcTower: DeviceDefinition = {
  vendor: "Komputer",
  model: "PC Desktop (tampak belakang)",
  description:
    "PC desktop dilihat dari belakang. Port LAN, soket listrik, dan saklar PSU ada di panel belakang. Putar model untuk melihat sisi lain. Klik port atau pilih dari daftar untuk melihat fungsinya.",
  specs: [
    { label: "Jaringan", value: "1 × Gigabit Ethernet" },
    { label: "Daya", value: "100–240 V AC" },
    { label: "Tombol power", value: "Atas casing" },
    { label: "Konfigurasi IP", value: "Terminal PC" },
  ],
  parts,
  leds,
  groundY: GROUND_Y,
  camera: {
    position: [3.4, 3.6, 10.8],
    target: [0, -0.1, 0.4],
    minDistance: 5,
    maxDistance: 22,
  },
  Model: PcModel,
};

export function PcViewer(props: DeviceViewerProps) {
  return <DeviceViewer device={pcTower} {...props} />;
}

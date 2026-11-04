"use client";

import { RoundedBox } from "@react-three/drei";
import DeviceViewer from "./DeviceViewer";
import { Cable, Interactive, portLinkOn, RjPort, StatusLed } from "./parts";
import type {
  DeviceDefinition,
  DeviceViewerProps,
  LedInfo,
  ModelProps,
  PartInfo,
} from "./types";

/* Model prosedural MikroTik hAP lite (RB941-2nD). Tanpa file model eksternal.
   Satuan dalam unit three.js, bukan milimeter. */

const W = 5.4; // lebar
const H = 1.1; // tinggi
const D = 3.4; // kedalaman
const FRONT = D / 2;
const TOP = H / 2;
const GROUND_Y = -0.68;
const FLOOR_Y = GROUND_Y + 0.06;

const ETH_X = [-2.0, -1.25, -0.5, 0.25];
const USB_X = 1.15;
const RESET_X = 1.9;

const ETH_IDS = ["ether1", "ether2", "ether3", "ether4"];
/** Satu warna tetap per port, agar kabel mudah dibedakan. */
const CABLE_COLORS = ["#38bdf8", "#f472b6", "#a3e635", "#fbbf24"];

const ETH_FACTS = [
  { label: "Kecepatan", value: "10/100 Mbps" },
  { label: "Konektor", value: "RJ-45" },
];

const parts: PartInfo[] = [
  {
    id: "ether1",
    name: "ether1",
    kind: "ethernet",
    summary: "WAN / Internet",
    description:
      "Port untuk koneksi ke modem atau ISP. Pada konfigurasi default RouterOS, ether1 berperan sebagai WAN: menjalankan DHCP client untuk mengambil IP dari ISP, dan trafik LAN keluar lewat NAT (masquerade).",
    facts: ETH_FACTS,
  },
  {
    id: "ether2",
    name: "ether2",
    kind: "ethernet",
    summary: "LAN",
    description:
      "Port LAN pertama. Pada konfigurasi default, ether2 satu bridge dengan ether3, ether4, dan wlan1, dengan IP router 192.168.88.1/24. Biasa dipakai untuk menyambungkan laptop saat konfigurasi awal lewat Winbox atau WebFig.",
    facts: ETH_FACTS,
  },
  {
    id: "ether3",
    name: "ether3",
    kind: "ethernet",
    summary: "LAN",
    description:
      "Port LAN untuk perangkat klien seperti PC, printer, atau access point. Mendapat IP dari DHCP server router pada konfigurasi default.",
    facts: ETH_FACTS,
  },
  {
    id: "ether4",
    name: "ether4",
    kind: "ethernet",
    summary: "LAN",
    description:
      "Port LAN keempat dengan fungsi yang sama seperti ether2 dan ether3. Bisa dikeluarkan dari bridge bila ingin dipakai sebagai segmen jaringan tersendiri.",
    facts: ETH_FACTS,
  },
  {
    id: "power",
    name: "Micro USB",
    kind: "power",
    summary: "Input daya",
    description:
      "Input daya 5 V DC lewat adaptor micro USB. hAP lite tidak punya tombol power dan tidak mendukung PoE: mencabut adaptor berarti router mati, memasangnya kembali berarti router menyala.",
    facts: [
      { label: "Tegangan", value: "5 V DC" },
      { label: "PoE", value: "Tidak ada" },
    ],
  },
  {
    id: "reset",
    name: "Reset",
    kind: "button",
    summary: "Tombol reset",
    description:
      "Tekan dengan benda kecil seperti jepit kertas. Tahan tombol saat perangkat dinyalakan sampai LED berkedip untuk mengembalikan konfigurasi RouterOS ke default.",
  },
];

const leds: LedInfo[] = [
  {
    id: "led-pwr",
    name: "PWR",
    color: "#22c55e",
    mode: "solid",
    meaning: "hijau menyala terus: perangkat mendapat daya.",
  },
  {
    id: "led-eth",
    name: "ETH1–ETH4",
    color: "#f59e0b",
    mode: "blink",
    meaning:
      "kuning: link aktif, berkedip saat ada trafik. Padam bila kabel dicabut atau link mati.",
  },
  {
    id: "led-wlan",
    name: "WLAN",
    color: "#38bdf8",
    mode: "pulse",
    meaning: "biru berdenyut: Wi-Fi 2.4 GHz aktif.",
  },
];

const ledAt: { led: LedInfo; x: number; n: string; port?: string }[] = [
  { led: leds[1], x: ETH_X[0], n: "led-eth-1", port: "ether1" },
  { led: leds[1], x: ETH_X[1], n: "led-eth-2", port: "ether2" },
  { led: leds[1], x: ETH_X[2], n: "led-eth-3", port: "ether3" },
  { led: leds[1], x: ETH_X[3], n: "led-eth-4", port: "ether4" },
  { led: leds[0], x: USB_X, n: "led-pwr" },
  { led: leds[2], x: RESET_X, n: "led-wlan" },
];

function Antenna({ x }: { x: number }) {
  return (
    <group position={[x, TOP + 0.04, -D / 2 + 0.3]} rotation={[-0.18, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.1, 0.1, 0.3, 20]} />
        <meshStandardMaterial color="#dcdce2" roughness={0.4} />
      </mesh>
      <RoundedBox
        args={[0.3, 1.6, 0.1]}
        radius={0.045}
        smoothness={3}
        position={[0, 0.85, 0]}
      >
        <meshPhysicalMaterial
          color="#f4f4f6"
          roughness={0.35}
          clearcoat={0.5}
        />
      </RoundedBox>
    </group>
  );
}

function HapLiteModel(ctx: ModelProps) {
  return (
    <group>
      {/* Bodi */}
      <RoundedBox args={[W, H, D]} radius={0.16} smoothness={4}>
        <meshPhysicalMaterial
          color="#f3f3f5"
          roughness={0.38}
          clearcoat={0.6}
          clearcoatRoughness={0.3}
        />
      </RoundedBox>
      <RoundedBox
        args={[W - 0.5, 0.05, D - 0.55]}
        radius={0.02}
        smoothness={2}
        position={[0, TOP + 0.015, 0]}
      >
        <meshStandardMaterial color="#e8e8ee" roughness={0.5} />
      </RoundedBox>

      {/* Ventilasi */}
      {[-0.95, -0.7].map((z) =>
        Array.from({ length: 9 }, (_, i) => (
          <mesh key={`${z}-${i}`} position={[-1.6 + i * 0.4, TOP + 0.043, z]}>
            <boxGeometry args={[0.26, 0.01, 0.07]} />
            <meshStandardMaterial color="#8f9099" roughness={0.8} />
          </mesh>
        )),
      )}

      {/* Antena */}
      <Antenna x={-2.0} />
      <Antenna x={2.0} />

      {/* Kaki karet */}
      {[
        [-2.2, -1.3],
        [2.2, -1.3],
        [-2.2, 1.3],
        [2.2, 1.3],
      ].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -TOP - 0.03, z]}>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 20]} />
          <meshStandardMaterial color="#26262b" roughness={0.9} />
        </mesh>
      ))}

      {/* Port Ethernet: klik dua kali = cabut/pasang kabel */}
      {ETH_X.map((x, i) => (
        <Interactive
          key={i}
          id={ETH_IDS[i]}
          ctx={ctx}
          position={[x, -0.02, FRONT - 0.01]}
          hit={[0.8, 0.66, 0.2]}
          onDouble={() => ctx.onToggleCable(ETH_IDS[i])}
        >
          <RjPort />
        </Interactive>
      ))}

      {/* Micro USB (daya): klik dua kali = cabut/pasang adaptor */}
      <Interactive
        id="power"
        ctx={ctx}
        position={[USB_X, -0.02, FRONT - 0.01]}
        hit={[0.52, 0.28, 0.2]}
        onDouble={ctx.onTogglePower}
      >
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.42, 0.16, 0.08]} />
          <meshStandardMaterial
            color="#aeb3bc"
            metalness={0.85}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, 0, 0.082]}>
          <boxGeometry args={[0.34, 0.09, 0.01]} />
          <meshStandardMaterial color="#050506" roughness={0.9} />
        </mesh>
      </Interactive>

      {/* Tombol reset */}
      <Interactive
        id="reset"
        ctx={ctx}
        position={[RESET_X, -0.02, FRONT - 0.01]}
        hit={[0.3, 0.3, 0.2]}
        lift={0.03}
      >
        <mesh position={[0, 0, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.04, 20]} />
          <meshStandardMaterial color="#050506" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <torusGeometry args={[0.085, 0.014, 10, 28]} />
          <meshStandardMaterial
            color="#c9ccd3"
            metalness={0.7}
            roughness={0.35}
          />
        </mesh>
      </Interactive>

      {/* Kabel daya: tercabut = router mati */}
      <Cable
        id="power"
        ctx={ctx}
        position={[USB_X, -0.02, FRONT - 0.01]}
        color="#52525b"
        label="Adaptor 5 V"
        plugged={ctx.powered}
        onToggle={ctx.onTogglePower}
        spread={1.8}
        length={3.6}
        plug={[0.3, 0.12]}
        floorY={FLOOR_Y}
      />

      {/* Kabel data mengikuti topologi lab */}
      {ctx.cables?.map((c) => {
        const i = ETH_IDS.indexOf(c.portId);
        if (i < 0) return null; // port tidak ada di model ini
        return (
          <Cable
            key={c.portId}
            id={c.portId}
            ctx={ctx}
            position={[ETH_X[i], -0.02, FRONT - 0.01]}
            color={CABLE_COLORS[i]}
            label={c.label}
            up={c.up && ctx.powered}
            plugged={c.plugged}
            onToggle={() => ctx.onToggleCable(c.portId)}
            spread={ETH_X[i] * 1.2}
            length={3.4 + (i % 2) * 1.0}
            floorY={FLOOR_Y}
          />
        );
      })}

      {/* LED: padam bila router mati; LED port hanya menyala bila kabel tertancap dan link aktif */}
      {ledAt.map(({ led, x, n, port }) => (
        <StatusLed
          key={n}
          led={{ ...led, id: n }}
          position={[x, TOP + 0.04, FRONT - 0.5]}
          active={port ? portLinkOn(ctx, port) : ctx.powered}
        />
      ))}
    </group>
  );
}

export const hapLite: DeviceDefinition = {
  vendor: "MikroTik",
  model: "hAP lite RB941-2nD",
  description:
    "Router Wi-Fi 2.4 GHz kelas pemula dengan 4 port Fast Ethernet. Sering dipakai untuk belajar RouterOS karena murah dan memakai RouterOS lengkap. Klik port pada model atau pilih dari daftar untuk melihat fungsinya.",
  specs: [
    { label: "CPU", value: "650 MHz" },
    { label: "RAM", value: "32 MB" },
    { label: "Ethernet", value: "4 × 10/100 Mbps" },
    { label: "Wi-Fi", value: "2.4 GHz 802.11b/g/n" },
    { label: "Daya", value: "5 V micro USB" },
    { label: "RouterOS", value: "Level 4" },
  ],
  parts,
  leds,
  groundY: GROUND_Y,
  camera: {
    position: [0, 4.2, 7.0],
    target: [0, 0.2, 0.2],
    minDistance: 4,
    maxDistance: 18,
  },
  Model: HapLiteModel,
};

export function HapLiteViewer(props: DeviceViewerProps) {
  return <DeviceViewer device={hapLite} {...props} />;
}

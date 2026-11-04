import type { ComponentType } from "react";

export type Vec3 = [number, number, number];

/** Jenis komponen fisik yang bisa diklik pada model. */
export type PartKind =
  | "ethernet"
  | "power"
  | "switch"
  | "button"
  | "console"
  | "usb";

export interface PartInfo {
  /** Harus sama dengan id yang dipakai pada <Interactive> di model 3D.
   *  Untuk port jaringan, pakai nama interface di simulator (mis. "ether1"). */
  id: string;
  name: string;
  kind: PartKind;
  /** Satu kalimat singkat untuk chip dan ringkasan. */
  summary: string;
  description: string;
  facts?: { label: string; value: string }[];
}

export type LedMode = "solid" | "pulse" | "blink";

export interface LedInfo {
  id: string;
  name: string;
  /** Warna CSS heksadesimal. */
  color: string;
  mode: LedMode;
  meaning: string;
}

/** Satu kabel data pada sebuah port, sesuai topologi lab. */
export interface CableInfo {
  /** Nama interface di perangkat ini, mis. "ether2" atau "GigabitEthernet0/0" */
  portId: string;
  /** Tujuan kabel, mis. "R2 · Gi0/0" */
  label: string;
  /** Link aktif (kedua perangkat hidup, kedua ujung tertancap, tidak di-shutdown). */
  up: boolean;
  /** Ujung kabel di perangkat ini tertancap di port. false = sedang dicabut. */
  plugged: boolean;
}

/** Kontrol fisik yang dikirim dari luar (Lab Runner). Tanpa ini viewer jalan sebagai demo. */
export interface ViewerControls {
  /** Perangkat hidup? Default: hidup (demo menyimpan state sendiri). */
  powered?: boolean;
  onTogglePower?: () => void;
  /** Cabut/pasang kabel di port tertentu. */
  onToggleCable?: (portId: string) => void;
}

export interface DeviceViewerProps extends ViewerControls {
  /** Kabel data. Tanpa prop ini viewer tampil sebagai demo. */
  cables?: CableInfo[];
  layout?: "split" | "stacked";
}

/** Props yang diberikan DeviceViewer ke komponen model 3D. */
export interface ModelProps {
  /** undefined = mode demo (tanpa kabel data). */
  cables?: CableInfo[];
  powered: boolean;
  onTogglePower: () => void;
  onToggleCable: (portId: string) => void;
  selectedId: string | null;
  hoveredId: string | null;
  /** Warna aksen tema website (sudah dalam format rgb). */
  accent: string;
  parts: PartInfo[];
  leds: LedInfo[];
  onSelect: (id: string | null) => void;
  onHover: (id: string, hovered: boolean) => void;
}

/** Definisi satu perangkat. */
export interface DeviceDefinition {
  vendor: string;
  model: string;
  description: string;
  specs: { label: string; value: string }[];
  parts: PartInfo[];
  leds: LedInfo[];
  /** Tinggi lantai (y) untuk bayangan. Default -0.68. */
  groundY?: number;
  camera: {
    position: Vec3;
    target: Vec3;
    minDistance: number;
    maxDistance: number;
  };
  Model: ComponentType<ModelProps>;
}
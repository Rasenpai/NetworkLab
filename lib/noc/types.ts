export type DeviceType = "internet" | "router" | "firewall" | "switch" | "ap" | "server";
export type Status = "up" | "warning" | "critical" | "down";

export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  ip: string;
  role: string;
  /** Posisi di peta (viewBox 750 x 520). */
  x: number;
  y: number;
};

export type Link = {
  id: string;
  a: string;
  b: string;
  /** Kapasitas link (Mbps). */
  mbps: number;
  /** Utilisasi normal saat jam sibuk (0-1). */
  peak: number;
};

export type DeviceSample = {
  status: Status;
  /** null untuk node ISP (tidak punya CPU/RAM/suhu yang dipantau). */
  cpu: number | null;
  ram: number | null;
  temp: number | null;
  latency: number;
  loss: number;
};

export type LinkSample = {
  status: Status;
  util: number; // 0-1
  inMbps: number;
  outMbps: number;
};

export type Snapshot = {
  t: number;
  devices: Record<string, DeviceSample>;
  links: Record<string, LinkSample>;
};

export type NocEvent = {
  id: number;
  t: number;
  level: "info" | "warning" | "critical" | "recovered";
  text: string;
};

/** [warning, critical]. Dipakai untuk menentukan status dari nilai metrik. */
export const THRESHOLDS = {
  cpu: [80, 95],
  ram: [85, 95],
  temp: [70, 80],
  latency: [80, 200],
  loss: [1, 5],
  util: [70, 90],
} as const;
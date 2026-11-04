"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Cable,
  Crosshair,
  Eraser,
  FilePlus2,
  Loader2,
  MousePointer2,
  Moon,
  Save,
  Sun,
  Trash2,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  CanvasDevice,
  CanvasFull,
  CanvasSummary,
  DeviceType,
  IfaceCfg,
  Topology,
} from "@/lib/cisco-canvas";
import {
  CABLE_LABEL,
  PORTS,
  autoCable,
  cableFits,
  kindsCompatible,
  linkUp,
  portDef,
  shortPort,
  type CableType,
} from "@/lib/cisco-ports";
import {
  createCanvasAction,
  deleteCanvasAction,
  saveCanvasAction,
} from "./actions";
import {
  DEVICE_LABEL,
  DeviceDefs,
  DeviceThumb,
  END_DEVICES,
  NET_DEVICES,
  isHost,
} from "./device-icons";
import { DevicePanel } from "./device-panel";

type Tool = "select" | "cable" | "delete";
type Theme = "dark" | "light";
type CableChoice = CableType | "auto";
type End = { id: number; port: string };

// Harus sama dengan lib/cisco-canvas.ts (file itu server-only, jadi nilainya tidak bisa diimpor).
const CANVAS_W = 3000;
const CANVAS_H = 2000;
const MAX_DEVICES = 60;
const MAX_LINKS = 150;
const THEME_KEY = "cisco-canvas-theme";

const THEME = {
  dark: {
    bg: "#0f0b18",
    dot: "rgba(255,255,255,.07)",
    cable: "#8b95a5",
    label: "#e5e7eb",
    sub: "#8b95a5",
    selFill: "rgba(139,92,246,.12)",
    ui: "border-white/10 bg-[#171225]/95 text-zinc-200 shadow-lg backdrop-blur",
    btn: "text-zinc-300 hover:bg-white/10",
    btnOn: "bg-violet-500/25 text-violet-200",
    input: "border-white/10 bg-black/25 text-zinc-100",
    mu: "text-zinc-400",
    sep: "bg-white/10",
  },
  light: {
    bg: "#f6f7fb",
    dot: "rgba(15,23,42,.10)",
    cable: "#64748b",
    label: "#1e293b",
    sub: "#64748b",
    selFill: "rgba(139,92,246,.10)",
    ui: "border-zinc-300 bg-white/95 text-zinc-800 shadow-lg backdrop-blur",
    btn: "text-zinc-600 hover:bg-zinc-100",
    btnOn: "bg-violet-100 text-violet-700",
    input: "border-zinc-300 bg-white text-zinc-900",
    mu: "text-zinc-500",
    sep: "bg-zinc-200",
  },
} as const;

/** Gaya garis tiap jenis kabel (mirip Packet Tracer: cross putus-putus, console biru, serial oranye). */
const CABLE_STYLE: Record<
  CableType,
  { color?: string; dash?: string; w: number }
> = {
  straight: { w: 2.2 },
  cross: { dash: "7 4", w: 2.2 },
  console: { color: "#38bdf8", dash: "2 4", w: 2.4 },
  serial: { color: "#f59e0b", dash: "10 3 2 3", w: 2.4 },
};

const CABLE_OPTS: { key: CableChoice; label: string }[] = [
  { key: "auto", label: "Otomatis" },
  { key: "straight", label: CABLE_LABEL.straight },
  { key: "cross", label: CABLE_LABEL.cross },
  { key: "console", label: CABLE_LABEL.console },
  { key: "serial", label: CABLE_LABEL.serial },
];

const HINT: Record<Exclude<Tool, "cable">, string> = {
  select:
    "Klik device untuk memilih, geser untuk memindah. Drag area kosong untuk menggeser tampilan.",
  delete: "Klik device atau kabel untuk menghapusnya.",
};

export function CanvasWorkspace({
  canvas,
  canvases,
}: {
  canvas: CanvasFull;
  canvases: CanvasSummary[];
}) {
  const router = useRouter();
  const [name, setName] = useState(canvas.name);
  const [topo, setTopo] = useState<Topology>(canvas.topology);
  const [tool, setTool] = useState<Tool>("select");
  const [cable, setCable] = useState<CableChoice>("auto");
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState<End | null>(null); // ujung kabel pertama (device + port)
  const [picker, setPicker] = useState<number | null>(null); // device yang daftar port-nya sedang dibuka
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [hoverLink, setHoverLink] = useState<number | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dirty, setDirty] = useState(false);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [busy, start] = useTransition();

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: number;
    dx: number;
    dy: number;
    moved: boolean;
  } | null>(null);
  const panDrag = useRef<{
    sx: number;
    sy: number;
    ox: number;
    oy: number;
  } | null>(null);
  const T = THEME[theme];

  /* ---------- Tema (hanya area canvas, disimpan di browser) ---------- */

  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_KEY);
      if (t === "light" || t === "dark") setTheme(t);
    } catch {
      /* localStorage diblokir: pakai default */
    }
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* abaikan */
    }
  };

  /* ---------- Ubah topologi ---------- */

  const edit = (fn: (t: Topology) => Topology) => {
    setTopo(fn);
    setDirty(true);
    setMsg(null);
  };

  const addDevice = (t: DeviceType) => {
    if (topo.devices.length >= MAX_DEVICES)
      return setMsg(`Maksimal ${MAX_DEVICES} perangkat per canvas.`);
    const id = topo.nextId;
    const r = svgRef.current?.getBoundingClientRect();
    // Taruh di sekitar tengah area yang sedang terlihat, bergeser sedikit tiap device baru.
    const n = topo.devices.length;
    const cx = (r ? r.width / 2 : 400) - pan.x + ((n % 5) - 2) * 70;
    const cy =
      (r ? r.height / 2 : 250) - pan.y + (Math.floor(n / 5) % 3) * 70 - 70;
    edit((p) => {
      const used = new Set(p.devices.map((d) => d.name));
      let k = p.devices.filter((d) => d.t === t).length + 1;
      while (used.has(`${DEVICE_LABEL[t]}${k}`)) k++;
      const dev: CanvasDevice = {
        id,
        t,
        x: Math.max(0, Math.min(CANVAS_W, Math.round(cx))),
        y: Math.max(0, Math.min(CANVAS_H, Math.round(cy))),
        name: `${DEVICE_LABEL[t]}${k}`,
        ip: "",
        p: 24,
        gw: "",
        ifs: {},
      };
      return { ...p, nextId: id + 1, devices: [...p.devices, dev] };
    });
    setSelected(id);
  };

  /** Hapus kabel tertentu sekaligus konfigurasi interface router yang memakainya. */
  const dropLinks = (p: Topology, gone: Set<number>): Topology => ({
    ...p,
    links: p.links.filter((l) => !gone.has(l.id)),
    devices: p.devices.map((d) => {
      if (d.t !== "rt") return d;
      const ifs = Object.fromEntries(
        Object.entries(d.ifs).filter(([k]) => !gone.has(Number(k))),
      );
      return { ...d, ifs };
    }),
  });

  const removeLink = (id: number) => edit((p) => dropLinks(p, new Set([id])));

  const removeDevice = (id: number) => {
    edit((p) => {
      const gone = new Set(
        p.links.filter((l) => l.a === id || l.b === id).map((l) => l.id),
      );
      const q = dropLinks(p, gone);
      return { ...q, devices: q.devices.filter((d) => d.id !== id) };
    });
    setSelected((s) => (s === id ? null : s));
    setPending((s) => (s?.id === id ? null : s));
    setPicker((s) => (s === id ? null : s));
  };

  const portInUse = (id: number, port: string) =>
    topo.links.some(
      (l) => (l.a === id && l.ap === port) || (l.b === id && l.bp === port),
    );

  const connect = (a: End, b: End) => {
    if (topo.links.length >= MAX_LINKS)
      return setMsg(`Maksimal ${MAX_LINKS} kabel per canvas.`);
    const A = topo.devices.find((d) => d.id === a.id);
    const B = topo.devices.find((d) => d.id === b.id);
    if (!A || !B || A.id === B.id) return;
    const ka = portDef(A.t, a.port)?.kind;
    const kb = portDef(B.t, b.port)?.kind;
    if (!ka || !kb || !kindsCompatible(ka, kb))
      return setMsg("Dua port itu tidak bisa dihubungkan.");
    if (portInUse(a.id, a.port) || portInUse(b.id, b.port))
      return setMsg("Port itu sudah dipakai kabel lain.");
    const type: CableType =
      cable === "auto" ? autoCable(A.t, ka, B.t, kb) : cable;
    if (!cableFits(type, ka) || !cableFits(type, kb))
      return setMsg("Jenis kabel tidak cocok dengan port itu.");

    const id = topo.nextId;
    edit((p) => ({
      ...p,
      nextId: id + 1,
      links: [
        ...p.links,
        { id, a: a.id, ap: a.port, b: b.id, bp: b.port, c: type },
      ],
    }));
    // Seperti Packet Tracer: salah kabel tetap terpasang, tapi link mati (titik merah).
    if (!linkUp(type, A.t, B.t))
      setMsg(
        `Kabel ${CABLE_LABEL[type]} salah untuk ${DEVICE_LABEL[A.t]} ↔ ${DEVICE_LABEL[B.t]}: link mati (titik merah).`,
      );
  };

  const choosePort = (id: number, port: string) => {
    if (!pending) {
      setPending({ id, port });
    } else {
      connect(pending, { id, port });
      setPending(null);
      setCursor(null);
    }
    setPicker(null);
  };

  const updateDevice = (id: number, patch: Partial<CanvasDevice>) =>
    edit((p) => ({
      ...p,
      devices: p.devices.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));

  const updateIface = (id: number, linkId: number, cfg: IfaceCfg) =>
    edit((p) => ({
      ...p,
      devices: p.devices.map((d) =>
        d.id === id ? { ...d, ifs: { ...d.ifs, [String(linkId)]: cfg } } : d,
      ),
    }));

  /* ---------- Pointer ---------- */

  /** Koordinat pointer di ruang canvas (piksel, sudah memperhitungkan geseran tampilan). */
  const toCanvas = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - pan.x, y: e.clientY - r.top - pan.y };
  };

  const onDevice = (e: React.PointerEvent, d: CanvasDevice) => {
    e.stopPropagation();
    if (tool === "delete") return removeDevice(d.id);
    if (tool === "cable") {
      if (pending?.id === d.id) {
        // Klik device asal sekali lagi = batalkan.
        setPending(null);
        setCursor(null);
        setPicker(null);
      } else {
        setPicker(d.id); // buka daftar port, kabel dipasang setelah port dipilih
      }
      return;
    }
    setSelected(d.id);
    const p = toCanvas(e);
    drag.current = { id: d.id, dx: d.x - p.x, dy: d.y - p.y, moved: false };
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onBackground = (e: React.PointerEvent<SVGSVGElement>) => {
    setSelected(null);
    setPending(null);
    setPicker(null);
    setCursor(null);
    if (tool !== "select") return;
    panDrag.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onMove = (e: React.PointerEvent) => {
    const pd = panDrag.current;
    if (pd) {
      setPan({ x: pd.ox + e.clientX - pd.sx, y: pd.oy + e.clientY - pd.sy });
      return;
    }
    if (pending && tool === "cable") setCursor(toCanvas(e));
    const g = drag.current;
    if (!g) return;
    const p = toCanvas(e);
    const x = Math.max(0, Math.min(CANVAS_W, p.x + g.dx));
    const y = Math.max(0, Math.min(CANVAS_H, p.y + g.dy));
    if (!g.moved) {
      g.moved = true;
      setDirty(true);
    }
    setTopo((t) => ({
      ...t,
      devices: t.devices.map((d) => (d.id === g.id ? { ...d, x, y } : d)),
    }));
  };

  const endDrag = () => {
    drag.current = null;
    panDrag.current = null;
  };

  /* ---------- Simpan, canvas baru, hapus, pindah ---------- */

  const save = () =>
    start(async () => {
      const res = await saveCanvasAction(canvas.id, name, topo);
      if (!res.ok) return setMsg(res.error);
      setDirty(false);
      setMsg(null);
      setSavedLabel(
        new Date(res.data.updatedAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    });

  const confirmLeave = () =>
    !dirty ||
    window.confirm(
      "Ada perubahan yang belum disimpan. Lanjutkan tanpa menyimpan?",
    );

  const openCanvas = (id: string) => {
    if (id !== canvas.id && confirmLeave()) router.push(`/lab-cisco?c=${id}`);
  };

  const newCanvas = () => {
    if (!confirmLeave()) return;
    start(async () => {
      const res = await createCanvasAction();
      if (res.ok) router.push(`/lab-cisco?c=${res.data.id}`);
      else setMsg(res.error);
    });
  };

  const removeCanvas = () => {
    if (
      !window.confirm(
        `Hapus "${canvas.name}"? Tindakan ini tidak bisa dibatalkan.`,
      )
    )
      return;
    start(async () => {
      const res = await deleteCanvasAction(canvas.id);
      if (res.ok) {
        setDirty(false);
        router.push(`/lab-cisco?c=${res.data.nextId}`);
      } else setMsg(res.error);
    });
  };

  // Ctrl/Cmd+S memakai ref supaya handler selalu memanggil save() dengan state terbaru.
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveRef.current();
      }
      if (e.key === "Escape") {
        setPicker(null);
        setPending(null);
        setCursor(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Peringatan saat menutup atau me-refresh tab dengan perubahan yang belum disimpan.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ---------- Render ---------- */

  const byId = new Map(topo.devices.map((d) => [d.id, d]));
  const selDev = selected !== null ? (byId.get(selected) ?? null) : null;
  const panned = pan.x !== 0 || pan.y !== 0;
  const pickerDev = picker !== null ? (byId.get(picker) ?? null) : null;
  const pendDev = pending ? (byId.get(pending.id) ?? null) : null;

  const pickTool = (t: Tool) => {
    setTool(t);
    setPending(null);
    setPicker(null);
    setCursor(null);
  };

  const hint =
    tool === "cable"
      ? pending && pendDev
        ? `Dari ${pendDev.name} (${shortPort(pending.port)}): klik device tujuan, lalu pilih port-nya. Esc untuk batal.`
        : "Pilih jenis kabel, klik device pertama dan pilih port, lalu klik device kedua dan pilih port-nya."
      : HINT[tool];

  const paletteBtn = (
    Icon: LucideIcon,
    label: string,
    on: boolean,
    onClick: () => void,
  ) => (
    <button
      key={label}
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex w-14 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] transition ${on ? T.btnOn : T.btn}`}
    >
      <Icon className="size-5" />
      {label}
    </button>
  );

  const deviceBtn = (t: DeviceType) => (
    <button
      key={t}
      title={DEVICE_LABEL[t]}
      aria-label={DEVICE_LABEL[t]}
      onClick={() => addDevice(t)}
      className={`flex w-14 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] transition ${T.btn}`}
    >
      <DeviceThumb type={t} className="h-7 w-11" />
      {DEVICE_LABEL[t]}
    </button>
  );

  const topBtn = (
    Icon: LucideIcon,
    label: string,
    onClick: () => void,
    opts?: { on?: boolean; disabled?: boolean; spin?: boolean },
  ) => (
    <button
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={opts?.disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm transition disabled:opacity-50 ${opts?.on ? T.btnOn : T.btn}`}
    >
      <Icon className={`size-4 ${opts?.spin ? "animate-spin" : ""}`} />
      <span className="hidden xl:inline">{label}</span>
    </button>
  );

  /** Daftar port milik device yang diklik (mirip dialog "pilih interface" di Packet Tracer). */
  const portPicker = () => {
    if (!pickerDev) return null;
    const r = svgRef.current?.getBoundingClientRect();
    const W = r?.width ?? 900;
    const H = r?.height ?? 600;
    const left = Math.max(8, Math.min(pickerDev.x + pan.x + 58, W - 236));
    const top = Math.max(8, Math.min(pickerDev.y + pan.y - 30, H - 300));
    const pendKind =
      pendDev && pending ? portDef(pendDev.t, pending.port)?.kind : undefined;

    return (
      <div
        className={`absolute z-20 w-56 rounded-xl border p-1.5 ${T.ui}`}
        style={{ left, top }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <p className="px-2 pb-1 pt-0.5 text-xs font-medium">
          {pickerDev.name}
          <span className={`ml-1.5 font-normal ${T.mu}`}>
            {pending ? "port tujuan" : "port asal"}
          </span>
        </p>
        <div className="max-h-64 overflow-y-auto">
          {PORTS[pickerDev.t].map((p) => {
            const link = topo.links.find(
              (l) =>
                (l.a === pickerDev.id && l.ap === p.name) ||
                (l.b === pickerDev.id && l.bp === p.name),
            );
            const peer = link
              ? byId.get(link.a === pickerDev.id ? link.b : link.a)
              : null;
            const kindOk = pendKind ? kindsCompatible(pendKind, p.kind) : true;
            const cableOk = cable === "auto" || cableFits(cable, p.kind);
            const off = !!link || !kindOk || !cableOk;
            return (
              <button
                key={p.name}
                disabled={off}
                title={
                  link
                    ? "Port sedang dipakai"
                    : !kindOk
                      ? "Tidak cocok dengan port di ujung satunya"
                      : !cableOk
                        ? "Tidak cocok dengan jenis kabel yang dipilih"
                        : p.name
                }
                onClick={() => choosePort(pickerDev.id, p.name)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition disabled:opacity-40 ${off ? "" : "hover:bg-violet-500/20"}`}
              >
                <span
                  className={`size-2 shrink-0 rounded-full ${link ? "bg-red-400" : "bg-emerald-400"}`}
                />
                <span className="truncate">{p.name}</span>
                {peer && (
                  <span className={`ml-auto shrink-0 ${T.mu}`}>
                    → {peer.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    // Menempel ke seluruh area konten. Sesuaikan top-[62px] (tinggi header) dan lg:left-64 (lebar sidebar)
    // dengan layout (app) kalau ada celah atau tumpang tindih.
    <div
      className="fixed inset-x-0 bottom-0 top-[62px] z-10 overflow-hidden lg:left-64"
      style={{ backgroundColor: T.bg, colorScheme: theme }}
    >
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full touch-none"
        style={{
          backgroundImage: `radial-gradient(${T.dot} 1px, transparent 1px)`,
          backgroundSize: "22px 22px",
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
        onPointerDown={onBackground}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <DeviceDefs />
        <g transform={`translate(${pan.x},${pan.y})`}>
          {topo.links.map((l) => {
            const a = byId.get(l.a);
            const b = byId.get(l.b);
            if (!a || !b) return null;
            const st = CABLE_STYLE[l.c];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            // Titik status diletakkan tepat di luar tepi ikon (ikon sekitar 96x60).
            const edgeDist = Math.min(
              48 / (Math.abs(ux) || 1e-6),
              30 / (Math.abs(uy) || 1e-6),
            );
            const off = Math.min(edgeDist + 7, len * 0.4);
            const pa = { x: a.x + ux * off, y: a.y + uy * off };
            const pb = { x: b.x - ux * off, y: b.y - uy * off };
            const up = linkUp(l.c, a.t, b.t);
            const showLbl =
              hoverLink === l.id || selected === l.a || selected === l.b;
            const dot = up ? "#34d399" : "#ef4444";
            const lbl = (p: { x: number; y: number }, text: string) => (
              <text
                x={p.x - uy * 13}
                y={p.y + ux * 13 + 3}
                textAnchor="middle"
                fontSize={9.5}
                fill={T.sub}
                stroke={T.bg}
                strokeWidth={3}
                paintOrder="stroke"
                pointerEvents="none"
              >
                {text}
              </text>
            );
            return (
              <g
                key={l.id}
                onPointerEnter={() => setHoverLink(l.id)}
                onPointerLeave={() => setHoverLink(null)}
                onPointerDown={(e) => {
                  if (tool !== "delete") return;
                  e.stopPropagation();
                  removeLink(l.id);
                }}
                style={{ cursor: tool === "delete" ? "pointer" : "default" }}
              >
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="transparent"
                  strokeWidth={12}
                />
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={st.color ?? T.cable}
                  strokeWidth={st.w}
                  strokeDasharray={st.dash}
                />
                {l.c !== "console" && (
                  <>
                    <circle
                      cx={pa.x}
                      cy={pa.y}
                      r={4}
                      fill={dot}
                      stroke={T.bg}
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={pb.x}
                      cy={pb.y}
                      r={4}
                      fill={dot}
                      stroke={T.bg}
                      strokeWidth={1.5}
                    />
                  </>
                )}
                {showLbl && (
                  <>
                    {lbl(pa, shortPort(l.ap))}
                    {lbl(pb, shortPort(l.bp))}
                  </>
                )}
              </g>
            );
          })}

          {/* Kabel sementara dari device asal ke kursor */}
          {tool === "cable" && pendDev && cursor && (
            <line
              x1={pendDev.x}
              y1={pendDev.y}
              x2={cursor.x}
              y2={cursor.y}
              stroke="#34d399"
              strokeWidth={2}
              strokeDasharray="5 4"
              pointerEvents="none"
            />
          )}

          {topo.devices.map((d) => {
            const sel = selected === d.id;
            const pend = pending?.id === d.id;
            return (
              <g
                key={d.id}
                transform={`translate(${d.x},${d.y})`}
                onPointerDown={(e) => onDevice(e, d)}
                style={{ cursor: tool === "select" ? "grab" : "pointer" }}
              >
                <rect
                  x={-52}
                  y={-34}
                  width={104}
                  height={98}
                  rx={10}
                  fill={sel ? T.selFill : "transparent"}
                  stroke={sel ? "#8b5cf6" : pend ? "#34d399" : "transparent"}
                  strokeWidth={2}
                  strokeDasharray={pend ? "5 3" : undefined}
                />
                <use href={`#cc-ic-${d.t}`} />
                <text
                  y={43}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill={T.label}
                >
                  {d.name}
                </text>
                {isHost(d.t) && d.ip && (
                  <text y={56} textAnchor="middle" fontSize={10.5} fill={T.sub}>
                    {d.ip}/{d.p}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Kiri atas: canvas aktif */}
      <div
        className={`absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 rounded-xl border p-1.5 ${T.ui}`}
      >
        <select
          value={canvas.id}
          onChange={(e) => openCanvas(e.target.value)}
          className={`max-w-40 rounded-lg border px-2 py-1.5 text-sm ${T.input}`}
          aria-label="Pilih canvas"
        >
          {canvases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={name}
          maxLength={40}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
          className={`w-44 rounded-lg border px-2.5 py-1.5 text-sm font-medium ${T.input}`}
          aria-label="Nama canvas"
        />
        <span className={`pr-1.5 text-xs ${dirty ? "text-amber-500" : T.mu}`}>
          {dirty
            ? "Belum disimpan"
            : savedLabel
              ? `Tersimpan ${savedLabel}`
              : "Tersimpan"}
        </span>
      </div>

      {/* Kanan atas: aksi */}
      <div
        className={`absolute right-3 top-3 flex items-center gap-0.5 rounded-xl border p-1.5 ${T.ui}`}
      >
        {topBtn(FilePlus2, "Canvas baru", newCanvas, { disabled: busy })}
        {topBtn(Trash2, "Hapus canvas", removeCanvas, { disabled: busy })}
        {topBtn(busy ? Loader2 : Save, "Simpan", save, {
          on: dirty,
          disabled: busy || !dirty,
          spin: busy,
        })}
        <span className={`mx-1 h-5 w-px ${T.sep}`} />
        {topBtn(
          theme === "dark" ? Sun : Moon,
          theme === "dark" ? "Terang" : "Gelap",
          toggleTheme,
        )}
      </div>

      {/* Kiri tengah: palet device (2 kolom, bisa di-scroll) dan tool */}
      <div
        className={`absolute left-3 top-1/2 grid max-h-[calc(100%-9rem)] -translate-y-1/2 grid-cols-2 gap-0.5 overflow-y-auto rounded-xl border p-1.5 ${T.ui}`}
      >
        {[...END_DEVICES, ...NET_DEVICES].map(deviceBtn)}
        <span className={`col-span-2 my-1 h-px ${T.sep}`} />
        {paletteBtn(MousePointer2, "Pilih", tool === "select", () =>
          pickTool("select"),
        )}
        {paletteBtn(Cable, "Kabel", tool === "cable", () => pickTool("cable"))}
        {paletteBtn(Eraser, "Hapus", tool === "delete", () =>
          pickTool("delete"),
        )}
      </div>

      {/* Di samping palet: pilihan jenis kabel (saat tool Kabel aktif) */}
      {tool === "cable" && (
        <div
          className={`absolute left-40 top-1/2 flex w-44 -translate-y-1/2 flex-col gap-0.5 rounded-xl border p-1.5 ${T.ui}`}
        >
          <p
            className={`px-2 pb-1 pt-0.5 text-[10px] font-medium uppercase tracking-wide ${T.mu}`}
          >
            Jenis kabel
          </p>
          {CABLE_OPTS.map((o) => (
            <button
              key={o.key}
              onClick={() => {
                setCable(o.key);
                setPicker(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition ${cable === o.key ? T.btnOn : T.btn}`}
            >
              {o.key === "auto" ? (
                <Zap className="size-4 shrink-0" />
              ) : (
                <svg width="28" height="8" className="shrink-0" aria-hidden>
                  <line
                    x1="1"
                    y1="4"
                    x2="27"
                    y2="4"
                    stroke={CABLE_STYLE[o.key].color ?? "currentColor"}
                    strokeWidth={2}
                    strokeDasharray={CABLE_STYLE[o.key].dash}
                  />
                </svg>
              )}
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Daftar port device yang diklik */}
      {tool === "cable" && portPicker()}

      {/* Kanan: panel konfigurasi, hanya saat ada device terpilih */}
      {selDev && (
        <div className="absolute right-3 top-16 max-h-[calc(100%-6rem)] w-72 overflow-y-auto rounded-xl shadow-xl">
          <DevicePanel
            device={selDev}
            topo={topo}
            theme={theme}
            onUpdate={updateDevice}
            onIface={updateIface}
          />
        </div>
      )}

      {/* Kiri bawah: petunjuk / pesan */}
      <div
        className={`absolute bottom-3 left-3 max-w-[calc(100%-6rem)] rounded-lg border px-3 py-1.5 text-xs ${T.ui}`}
      >
        {msg ? (
          <span className="text-red-500">{msg}</span>
        ) : (
          <span className={T.mu}>{hint}</span>
        )}
      </div>

      {/* Kanan bawah: kembalikan tampilan */}
      {panned && (
        <button
          onClick={() => setPan({ x: 0, y: 0 })}
          className={`absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${T.ui} ${T.btn}`}
        >
          <Crosshair className="size-3.5" /> Reset tampilan
        </button>
      )}
    </div>
  );
}

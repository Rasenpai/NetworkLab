"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useCursor,
} from "@react-three/drei";
import { Spherical, Vector3 } from "three";
import { Plug, Power, RotateCcw, Unplug } from "lucide-react";
import type { DeviceDefinition, DeviceViewerProps } from "./types";

const FALLBACK_ACCENT = "rgb(155, 93, 229)";

/** Ubah warna CSS apa pun (hex, oklch, ...) menjadi rgb() yang dimengerti three.js. */
function toRgb(value: string): string | null {
  try {
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx || !value) return null;
    ctx.fillStyle = "#000";
    ctx.fillStyle = value;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return null;
  }
}

/** Ambil warna aksen dari tema website agar highlight 3D selaras. */
function useAccent() {
  const [accent, setAccent] = useState(FALLBACK_ACCENT);
  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    const raw =
      css.getPropertyValue("--color-accent").trim() ||
      css.getPropertyValue("--accent").trim();
    const rgb = toRgb(raw);
    if (rgb) setAccent(rgb);
  }, []);
  return accent;
}

type GlState = "checking" | "ok" | "unsupported" | "lost";

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") ||
      canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/* ───────── kamera ───────── */

function Rig({
  cfg,
  resetKey,
}: {
  cfg: DeviceDefinition["camera"];
  resetKey: number;
}) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const goal = useRef<{ pos: Vector3; target: Vector3 } | null>(null);
  const placed = useRef(false);

  // Layar sempit butuh kamera lebih jauh agar model tidak terpotong.
  const aspect = size.width / Math.max(size.height, 1);
  const scale = aspect >= 1.3 ? 1 : aspect >= 1 ? 1.25 : 1.7;

  useLayoutEffect(() => {
    const c = controls.current;
    if (!c) return;
    const target = new Vector3(...cfg.target);
    const pos = new Vector3(...cfg.position)
      .sub(target)
      .multiplyScalar(scale)
      .add(target);

    if (!placed.current) {
      placed.current = true;
      camera.position.copy(pos);
      c.target.copy(target);
      c.update();
    } else {
      goal.current = { pos, target };
    }
  }, [cfg, scale, resetKey, camera]);

  useFrame((_, delta) => {
    const g = goal.current;
    const c = controls.current;
    if (!g || !c) return;

    // Interpolasi pada koordinat bola supaya kamera mengorbit, bukan menembus model.
    const k = 1 - Math.exp(-delta * 6);
    const cur = new Spherical().setFromVector3(
      camera.position.clone().sub(c.target),
    );
    const dst = new Spherical().setFromVector3(g.pos.clone().sub(g.target));
    let dTheta = dst.theta - cur.theta;
    dTheta =
      ((((dTheta + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
      Math.PI;

    cur.radius += (dst.radius - cur.radius) * k;
    cur.phi += (dst.phi - cur.phi) * k;
    cur.theta += dTheta * k;
    cur.makeSafe();
    c.target.lerp(g.target, k);
    camera.position.setFromSpherical(cur).add(c.target);
    c.update();

    if (
      Math.abs(dTheta) < 0.002 &&
      Math.abs(dst.phi - cur.phi) < 0.002 &&
      Math.abs(dst.radius - cur.radius) < 0.01 &&
      c.target.distanceTo(g.target) < 0.01
    ) {
      goal.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.8}
      zoomSpeed={0.8}
      minDistance={cfg.minDistance}
      maxDistance={cfg.maxDistance}
      onStart={() => {
        goal.current = null; // pengguna mengambil alih kamera
      }}
    />
  );
}

/* ───────── viewer ───────── */

export default function DeviceViewer({
  device,
  cables,
  layout = "split",
  powered: poweredProp,
  onTogglePower,
  onToggleCable,
}: DeviceViewerProps & {
  device: DeviceDefinition;
}) {
  const { Model, parts, leds, camera } = device;
  const stacked = layout === "stacked";
  const cableOf = (id: string) => cables?.find((c) => c.portId === id);
  const hiddenCables = cables?.filter(
    (c) => !parts.some((p) => p.id === c.portId),
  );
  const accent = useAccent();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [canvasKey, setCanvasKey] = useState(0);
  const [gl, setGl] = useState<GlState>("checking");

  // Tanpa kontrol dari luar (mode demo), daya disimpan di sini.
  const [demoPower, setDemoPower] = useState(true);
  const powered = poweredProp ?? demoPower;
  const togglePower = useCallback(() => {
    if (onTogglePower) onTogglePower();
    else setDemoPower((p) => !p);
  }, [onTogglePower]);
  const toggleCable = useCallback(
    (portId: string) => onToggleCable?.(portId),
    [onToggleCable],
  );

  useCursor(hoveredId !== null);

  useEffect(() => {
    setGl(detectWebGL() ? "ok" : "unsupported");
  }, []);

  const onHover = useCallback((id: string, hovered: boolean) => {
    setHoveredId((prev) => (hovered ? id : prev === id ? null : prev));
  }, []);

  const selected = parts.find((p) => p.id === selectedId) ?? null;
  const modelProps = useMemo(
    () => ({
      cables,
      powered,
      onTogglePower: togglePower,
      onToggleCable: toggleCable,
      selectedId,
      hoveredId,
      accent,
      parts,
      leds,
      onSelect: setSelectedId,
      onHover,
    }),
    [
      cables,
      powered,
      togglePower,
      toggleCable,
      selectedId,
      hoveredId,
      accent,
      parts,
      leds,
      onHover,
    ],
  );

  const actionBtn =
    "mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-fg transition hover:border-accent/40 hover:bg-accent/10";

  return (
    <div
      className={
        stacked ? "grid gap-3" : "grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]"
      }
    >
      {/* Kanvas 3D */}
      <section
        className="relative overflow-hidden rounded-2xl border border-line bg-card"
        style={{
          backgroundImage: `radial-gradient(60% 55% at 50% 55%, color-mix(in srgb, ${accent} 14%, transparent), transparent 70%)`,
        }}
      >
        <div
          className={`touch-none ${
            stacked
              ? "h-[360px] sm:h-[440px]"
              : "h-[340px] sm:h-[440px] lg:h-[560px]"
          }`}
          role="img"
          aria-label={`Model 3D ${device.vendor} ${device.model}`}
        >
          {gl === "ok" && (
            <Canvas
              key={canvasKey}
              dpr={[1, 2]}
              camera={{
                fov: 35,
                near: 0.1,
                far: 100,
                position: camera.position,
              }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              }}
              onCreated={({ gl: renderer }) => {
                renderer.domElement.addEventListener(
                  "webglcontextlost",
                  (e) => {
                    e.preventDefault();
                    setGl("lost");
                  },
                );
              }}
              onPointerMissed={() => setSelectedId(null)}
            >
              <ambientLight intensity={0.35} />
              <directionalLight position={[4, 6, 5]} intensity={1.6} />
              <directionalLight
                position={[-5, 3, -4]}
                intensity={0.6}
                color="#b9a8ff"
              />
              <Suspense fallback={null}>
                <Environment resolution={256}>
                  <Lightformer
                    form="rect"
                    intensity={2.2}
                    position={[0, 5, 3]}
                    scale={[10, 5, 1]}
                  />
                  <Lightformer
                    form="rect"
                    intensity={1.2}
                    position={[-6, 2, 2]}
                    scale={[4, 4, 1]}
                  />
                  <Lightformer
                    form="rect"
                    intensity={1.2}
                    position={[6, 2, -2]}
                    scale={[4, 4, 1]}
                  />
                </Environment>
              </Suspense>
              <Model {...modelProps} />
              <ContactShadows
                position={[0, device.groundY ?? -0.68, 0]}
                opacity={0.55}
                scale={14}
                blur={2.6}
                far={2.5}
              />
              <Rig cfg={camera} resetKey={resetKey} />
            </Canvas>
          )}
          {(gl === "unsupported" || gl === "lost") && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted">
                {gl === "lost"
                  ? "Tampilan 3D terhenti karena GPU kehilangan konteks grafis."
                  : "Browser ini tidak mendukung WebGL, jadi model 3D tidak bisa ditampilkan."}
              </p>
              {gl === "lost" && (
                <button
                  type="button"
                  onClick={() => {
                    setCanvasKey((k) => k + 1);
                    setGl("ok");
                  }}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                >
                  Muat ulang tampilan 3D
                </button>
              )}
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div>
            <p className="text-xs text-muted">{device.vendor}</p>
            <h3 className="font-semibold leading-tight">{device.model}</h3>
          </div>
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={togglePower}
              aria-pressed={powered}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm backdrop-blur transition ${
                powered
                  ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
                  : "border-red-400/40 bg-red-400/10 text-red-300 hover:bg-red-400/20"
              }`}
            >
              <Power className="size-4" />
              {powered ? "Hidup" : "Mati"}
            </button>
            <button
              type="button"
              onClick={() => setResetKey((k) => k + 1)}
              className="flex items-center gap-1.5 rounded-lg border border-line bg-card/80 px-3 py-1.5 text-sm text-muted backdrop-blur transition hover:text-fg"
            >
              <RotateCcw className="size-4" />
              Reset Camera
            </button>
          </div>
        </div>
        <p className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-xs text-muted">
          Seret untuk memutar · Scroll atau cubit untuk zoom · Klik port untuk
          detail
          {cables ? " · Klik dua kali kabel untuk cabut/pasang" : ""}
        </p>
      </section>

      {/* Panel informasi */}
      <aside
        className={
          stacked
            ? "grid gap-3 sm:grid-cols-2"
            : "space-y-3 lg:sticky lg:top-20 lg:self-start"
        }
      >
        <div className="rounded-2xl border border-line bg-card p-4">
          <h3 className="text-sm font-semibold">Port dan komponen</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {parts.map((p) => {
              const c = cableOf(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={selectedId === p.id}
                  onClick={() =>
                    setSelectedId(selectedId === p.id ? null : p.id)
                  }
                  onPointerEnter={() => onHover(p.id, true)}
                  onPointerLeave={() => onHover(p.id, false)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-colors ${
                    selectedId === p.id
                      ? "border-accent/40 bg-accent/15 text-fg"
                      : "border-line text-muted hover:text-fg"
                  }`}
                >
                  {cables && p.kind === "ethernet" && (
                    <span
                      aria-hidden
                      className={`size-1.5 rounded-full ${
                        c
                          ? !c.plugged
                            ? "bg-red-400"
                            : c.up && powered
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          : "bg-white/15"
                      }`}
                    />
                  )}
                  {p.name}
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-line pt-4" aria-live="polite">
            {selected ? (
              <>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{selected.name}</h4>
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
                    {selected.summary}
                  </span>
                </div>

                {cables && selected.kind === "ethernet" && (
                  <>
                    <p className="mt-2 rounded-lg border border-line bg-bg px-3 py-2 text-xs">
                      {cableOf(selected.id) ? (
                        <>
                          <span className="text-muted">
                            {cableOf(selected.id)!.plugged
                              ? "Terhubung ke "
                              : "Kabel ke "}
                          </span>
                          <span className="font-medium text-fg">
                            {cableOf(selected.id)!.label}
                          </span>
                          <span
                            className={
                              !cableOf(selected.id)!.plugged
                                ? "text-red-300"
                                : cableOf(selected.id)!.up
                                  ? "text-emerald-300"
                                  : "text-amber-300"
                            }
                          >
                            {" "}
                            ·{" "}
                            {!cableOf(selected.id)!.plugged
                              ? "dicabut"
                              : cableOf(selected.id)!.up
                                ? "link aktif"
                                : "link mati"}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">
                          Belum ada kabel di port ini.
                        </span>
                      )}
                    </p>
                    {cableOf(selected.id) && (
                      <button
                        type="button"
                        onClick={() => toggleCable(selected.id)}
                        className={actionBtn}
                      >
                        {cableOf(selected.id)!.plugged ? (
                          <>
                            <Unplug className="size-3.5" /> Cabut kabel
                          </>
                        ) : (
                          <>
                            <Plug className="size-3.5" /> Pasang kabel
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}

                {(selected.kind === "power" || selected.kind === "switch") && (
                  <>
                    <p className="mt-2 rounded-lg border border-line bg-bg px-3 py-2 text-xs">
                      <span className="text-muted">Status: </span>
                      <span
                        className={
                          powered ? "text-emerald-300" : "text-red-300"
                        }
                      >
                        {powered ? "perangkat hidup" : "perangkat mati"}
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={togglePower}
                      className={actionBtn}
                    >
                      <Power className="size-3.5" />
                      {powered ? "Matikan perangkat" : "Nyalakan perangkat"}
                    </button>
                  </>
                )}

                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {selected.description}
                </p>
                {selected.facts && (
                  <dl className="mt-3 space-y-1.5 text-xs">
                    {selected.facts.map((f) => (
                      <div key={f.label} className="flex justify-between gap-3">
                        <dt className="text-muted">{f.label}</dt>
                        <dd className="text-right text-fg">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </>
            ) : (
              <>
                {cables ? (
                  <>
                    <h4 className="text-xs font-medium text-fg">Kabel data</h4>
                    {cables.length === 0 ? (
                      <p className="mt-1.5 text-xs text-muted">
                        Belum ada kabel data pada perangkat ini.
                      </p>
                    ) : (
                      <ul className="mt-1.5 space-y-1 text-xs">
                        {cables.map((c) => (
                          <li
                            key={c.portId}
                            className="flex justify-between gap-3"
                          >
                            <span className="text-muted">{c.portId}</span>
                            <span className="text-right text-fg">
                              {c.label}
                              {!c.plugged ? (
                                <span className="text-red-300"> · dicabut</span>
                              ) : (
                                !c.up && (
                                  <span className="text-amber-300">
                                    {" "}
                                    · mati
                                  </span>
                                )
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {hiddenCables && hiddenCables.length > 0 && (
                      <p className="mt-1.5 text-xs text-muted">
                        Tidak tergambar di model:{" "}
                        {hiddenCables.map((c) => c.portId).join(", ")}.
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      Klik port atau kabel di model untuk detail dan tombol
                      cabut/pasang.
                    </p>
                  </>
                ) : (
                  <p className="text-sm leading-relaxed text-muted">
                    {device.description}
                  </p>
                )}
                <dl className="mt-3 space-y-1.5 text-xs">
                  {device.specs.map((s) => (
                    <div key={s.label} className="flex justify-between gap-3">
                      <dt className="text-muted">{s.label}</dt>
                      <dd className="text-right text-fg">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-card p-4">
          <h3 className="text-sm font-semibold">Indikator LED</h3>
          <ul className="mt-3 space-y-2.5">
            {leds.map((l) => (
              <li key={l.id} className="flex items-start gap-3 text-xs">
                <span
                  className="mt-0.5 size-3 shrink-0 rounded-full"
                  style={{
                    backgroundColor: l.color,
                    boxShadow: `0 0 8px ${l.color}`,
                  }}
                />
                <span className="min-w-0">
                  <span className="font-medium text-fg">{l.name}</span>
                  <span className="text-muted"> — {l.meaning}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

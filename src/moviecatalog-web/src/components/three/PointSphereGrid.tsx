import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useSettings } from "../../lib/settings";
import { SPHERE_DENSITY_OPACITY, HALO_PRESETS, type ScenePoint } from "./scenePoint";

interface PointSphereGridProps {
  points: ScenePoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Altezza in px del contenitore (deve combaciare con quella del pannello che lo ospita). */
  height?: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex: string) {
  const parsed = hex.replace("#", "");
  const value = parseInt(parsed.length === 3 ? parsed.split("").map((c) => c + c).join("") : parsed, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

/** Gradiente radiale CSS (punto luce in alto a sinistra, colore pieno, bordo più scuro) per far apparire
 * ogni nodo come una sferetta lucida invece di un cerchio piatto — versione CSS della stessa idea usata
 * dalla texture canvas in PointCloudScene, qui senza WebGL. */
function orbGradient(color: string) {
  const { r, g, b } = hexToRgb(color);
  const light = `rgba(${Math.min(255, r + 100)}, ${Math.min(255, g + 100)}, ${Math.min(255, b + 100)}, 1)`;
  const mid = `rgba(${r}, ${g}, ${b}, 1)`;
  const dark = `rgba(${Math.round(r * 0.35)}, ${Math.round(g * 0.35)}, ${Math.round(b * 0.35)}, 0.92)`;
  return `radial-gradient(circle at 34% 30%, rgba(255,255,255,0.95) 0%, ${light} 16%, ${mid} 55%, ${dark} 100%)`;
}

/** Stessa logica di computeNearestNeighborEdges (PointCloudScene): collega ogni nodo al suo vicino più
 * prossimo reale sulle coordinate 3D grezze. Qui però servono le coppie di id, non le posizioni: le
 * coordinate a schermo cambiano ad ogni frame in base alla rotazione corrente e vanno rilette da una mappa
 * calcolata al momento del render, non catturate una volta sola. */
function nearestNeighborIdPairs(points: ScenePoint[]): [number, number][] {
  const pairs: [number, number][] = [];
  const seen = new Set<string>();

  for (let i = 0; i < points.length; i++) {
    let nearestIndex = -1;
    let nearestDistSq = Infinity;
    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const [ax, ay, az] = points[i].position;
      const [bx, by, bz] = points[j].position;
      const distSq = (ax - bx) ** 2 + (ay - by) ** 2 + (az - bz) ** 2;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearestIndex = j;
      }
    }
    if (nearestIndex >= 0) {
      const key = [points[i].id, points[nearestIndex].id].sort((a, b) => a - b).join("-");
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push([points[i].id, points[nearestIndex].id]);
      }
    }
  }
  return pairs;
}

/**
 * Sfera 3D di "nodi memoria" in puro CSS (stessa tecnica del componente sphere-image-gallery: trascina per
 * ruotare con inerzia, auto-rotazione quando inattiva, nessun setPointerCapture per non bloccare il click
 * nativo) — ma al posto delle immagini disegna i punti determinati dagli embedding già calcolati nel DB
 * (le stesse coordinate PCA della vista orbitale WebGL), con un aspetto a nodi luminosi e linee di
 * collegamento ispirato al mockup "memoria semantica 3D".
 */
export function PointSphereGrid({ points, selectedId, onSelect, height = 560 }: PointSphereGridProps) {
  const { settings } = useSettings();
  const rotation = useRef({ x: -18, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  // Distingue un trascinamento da un click: sotto la soglia il tap seleziona il nodo, sopra ruota la sfera
  // e il click viene soppresso (vedi skill "sphere-image-gallery" — niente setPointerCapture qui).
  const dragDistance = useRef(0);
  const suppressClick = useRef(false);
  const [, setTick] = useState(0);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const radius = height * 0.4;
  const orbOpacity = SPHERE_DENSITY_OPACITY[settings.sphereDensity];
  const halo = HALO_PRESETS[settings.haloIntensity];
  const autoRotate = settings.animationsEnabled;

  // Le posizioni arrivano dalla proiezione PCA reale (stessa fonte della vista orbitale) e non hanno un
  // raggio fisso: le normalizziamo qui solo per riempire bene il contenitore, senza alterarne la struttura
  // relativa (fattore di scala uniforme).
  const factor = useMemo(() => {
    const maxMagnitude = points.reduce((max, p) => Math.max(max, Math.hypot(...p.position)), 0);
    return maxMagnitude > 0 ? radius / maxMagnitude : 1;
  }, [points, radius]);

  const edgeIdPairs = useMemo(() => nearestNeighborIdPairs(points), [points]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!dragging.current) {
        if (autoRotate) {
          rotation.current.y += 0.12;
        }
        if (Math.abs(velocity.current.x) > 0.001 || Math.abs(velocity.current.y) > 0.001) {
          rotation.current.x += velocity.current.x;
          rotation.current.y += velocity.current.y;
          velocity.current.x *= 0.94;
          velocity.current.y *= 0.94;
        }
      }
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    dragDistance.current = 0;
    suppressClick.current = false;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    dragDistance.current += Math.abs(dx) + Math.abs(dy);
    if (dragDistance.current > 6) suppressClick.current = true;

    const vy = clamp(dx * 0.28, -6, 6);
    const vx = clamp(-dy * 0.28, -6, 6);
    rotation.current.x += vx;
    rotation.current.y += vy;
    velocity.current = { x: vx * 0.6, y: vy * 0.6 };
  }

  function handlePointerUp() {
    dragging.current = false;
  }

  const radX = (rotation.current.x * Math.PI) / 180;
  const radY = (rotation.current.y * Math.PI) / 180;
  const cosX = Math.cos(radX);
  const sinX = Math.sin(radX);
  const cosY = Math.cos(radY);
  const sinY = Math.sin(radY);

  const projectedById = new Map<number, { x: number; y: number; z: number; depth: number }>();
  const projected = points.map((point) => {
    const [px, py, pz] = point.position;
    const x = px * factor;
    const y = py * factor;
    const z = pz * factor;
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    const x2 = x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;
    const depth = clamp((z2 + radius) / (2 * radius), 0, 1);
    const entry = { x: x2, y: y1, z: z2, depth };
    projectedById.set(point.id, entry);
    return { point, ...entry };
  });

  // Algoritmo del pittore: disegna dal retro verso il fronte così i nodi vicini coprono correttamente quelli lontani.
  projected.sort((a, b) => a.z - b.z);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "var(--radius-md)",
        background: "radial-gradient(circle at 50% 42%, rgba(0, 90, 140, 0.28), rgba(1, 15, 31, 1) 68%)",
        touchAction: "none",
        cursor: dragging.current ? "grabbing" : "grab",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Anello che suggerisce il confine della sfera — puramente decorativo. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: radius * 2,
          height: radius * 2,
          marginLeft: -radius,
          marginTop: -radius,
          borderRadius: "50%",
          border: "1px solid rgba(0, 210, 255, 0.12)",
          pointerEvents: "none",
        }}
      />

      {edgeIdPairs.map(([fromId, toId]) => {
        const from = projectedById.get(fromId);
        const to = projectedById.get(toId);
        if (!from || !to) return null;
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const avgDepth = (from.depth + to.depth) / 2;
        return (
          <div
            key={`${fromId}-${toId}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: length,
              height: 1,
              transform: `translate3d(${from.x}px, ${from.y}px, 0) rotate(${angle}deg)`,
              transformOrigin: "0 0",
              background: "#00d2ff",
              opacity: 0.08 + avgDepth * 0.22,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {projected.map(({ point, x, y, depth }) => {
        const isSelected = point.id === selectedId;
        const isHovered = point.id === hoveredId;
        const active = isSelected || isHovered;
        const rgb = hexToRgb(point.color);
        const baseSize = 14 + point.size * 26;
        const scale = 0.6 + depth * 0.75;
        const size = baseSize * scale * (active ? 1.15 : 1);

        return (
          <div
            key={point.id}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate3d(${x}px, ${y}px, 0)`,
              zIndex: Math.round(depth * 1000),
            }}
          >
            <div
              onMouseEnter={() => setHoveredId(point.id)}
              onMouseLeave={() => setHoveredId((current) => (current === point.id ? null : current))}
              onClick={() => {
                if (suppressClick.current) return;
                onSelect(point.id);
              }}
              title={point.label}
              className="sphere-node"
              style={{
                position: "absolute",
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                borderRadius: "50%",
                background: orbGradient(point.color),
                opacity: (0.45 + depth * 0.55) * orbOpacity,
                boxShadow: active
                  ? `0 0 ${16 * halo.scale}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${halo.opacity})`
                  : `0 0 ${4 + size * 0.25}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35), 0 2px 6px rgba(0,0,0,0.4)`,
                cursor: "pointer",
                transition: "box-shadow 0.2s ease",
              }}
            />

            {active && (
              <div
                style={{
                  position: "absolute",
                  left: size / 2 + 6,
                  top: -size / 2 - 4,
                  background: "rgba(5, 20, 36, 0.92)",
                  border: `1px solid ${point.color}66`,
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 12,
                  color: "#d4e4fa",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                }}
              >
                <div style={{ fontWeight: 600 }}>{point.label}</div>
                {point.subtitle && <div style={{ color: "#a9b7c6", fontSize: 11, marginTop: 1 }}>{point.subtitle}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

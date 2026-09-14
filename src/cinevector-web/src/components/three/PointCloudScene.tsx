import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useSettings } from "../../lib/settings";
import { SPHERE_DENSITY_OPACITY, HALO_PRESETS, type ScenePoint } from "./scenePoint";

export type { ScenePoint } from "./scenePoint";

interface PointCloudSceneProps {
  points: ScenePoint[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const orbTextureCache = new Map<string, THREE.CanvasTexture>();

function hexToRgb(hex: string) {
  const parsed = hex.replace("#", "");
  const value = parseInt(parsed.length === 3 ? parsed.split("").map((c) => c + c).join("") : parsed, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function rgba(rgb: { r: number; g: number; b: number }, factor: number, alpha: number) {
  return `rgba(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)}, ${alpha})`;
}

/** Texture a gradiente radiale (evidenza chiara in alto a sinistra, colore pieno, bordo più scuro che sfuma)
 * per far apparire ogni punto come una sfera lucida invece di un cerchio piatto — una per colore, riusata. */
function getOrbTexture(color: string): THREE.CanvasTexture {
  const cached = orbTextureCache.get(color);
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const rgb = hexToRgb(color);

  const gradient = ctx.createRadialGradient(
    size * 0.35,
    size * 0.32,
    size * 0.02,
    size * 0.5,
    size * 0.5,
    size * 0.52,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.16, rgba(rgb, 1.15, 1));
  gradient.addColorStop(0.45, rgba(rgb, 0.95, 1));
  gradient.addColorStop(0.78, rgba(rgb, 0.55, 1));
  gradient.addColorStop(1, rgba(rgb, 0.25, 0));

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  orbTextureCache.set(color, texture);
  return texture;
}

/** Collega ogni sfera al suo vicino più prossimo reale (distanza euclidea sulle coordinate 3D già calcolate
 * dalla PCA) — non un grafo inventato: la linea indica la relazione di prossimità semantica più diretta che
 * abbiamo per quel punto. Le coppie reciproche vengono deduplicate per non disegnare la stessa linea due volte. */
export function computeNearestNeighborEdges(points: ScenePoint[]): [ScenePoint["position"], ScenePoint["position"]][] {
  const edges: [ScenePoint["position"], ScenePoint["position"]][] = [];
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
        edges.push([points[i].position, points[nearestIndex].position]);
      }
    }
  }

  return edges;
}

function PointNode({
  point,
  isSelected,
  onSelect,
}: {
  point: ScenePoint;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) {
  const { settings } = useSettings();
  const [hovered, setHovered] = useState(false);
  const haloRef = useRef<THREE.Sprite>(null);
  const haloMaterialRef = useRef<THREE.SpriteMaterial>(null);
  const orbRef = useRef<THREE.Sprite>(null);
  const orbTexture = useMemo(() => getOrbTexture(point.color), [point.color]);
  const haloTexture = useMemo(() => getOrbTexture(point.color), [point.color]);

  const active = hovered || isSelected;
  const baseScale = point.size * 2.6;
  const orbOpacity = SPHERE_DENSITY_OPACITY[settings.sphereDensity];
  const halo = HALO_PRESETS[settings.haloIntensity];

  // Alone luminoso: uno sprite più grande della stessa texture, additivo e senza depth-write, la cui
  // opacità/scala vengono interpolate ogni frame verso il target — bagliore morbido invece di uno scatto
  // on/off, con un lieve "respiro" (pulse) quando è sotto il mouse. Il pallino stesso cresce leggermente.
  // Intensità e dimensione dell'alone sono regolabili da Settings (sottile/normale/intenso).
  useFrame((state, delta) => {
    const targetOpacity = active ? halo.opacity : 0;
    const pulse = hovered ? 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.06 : 1;
    const targetHaloScale = baseScale * (active ? halo.scale : 1) * pulse;
    const targetOrbScale = baseScale * (active ? 1.18 : 1);

    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = THREE.MathUtils.damp(haloMaterialRef.current.opacity, targetOpacity, 6, delta);
    }
    if (haloRef.current) {
      const next = THREE.MathUtils.damp(haloRef.current.scale.x, targetHaloScale, 6, delta);
      haloRef.current.scale.set(next, next, 1);
    }
    if (orbRef.current) {
      const next = THREE.MathUtils.damp(orbRef.current.scale.x, targetOrbScale, 8, delta);
      orbRef.current.scale.set(next, next, 1);
    }
  });

  return (
    <group position={point.position}>
      <sprite ref={haloRef} scale={[baseScale, baseScale, 1]}>
        <spriteMaterial
          ref={haloMaterialRef}
          map={haloTexture}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <sprite
        ref={orbRef}
        scale={[baseScale, baseScale, 1]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(point.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <spriteMaterial map={orbTexture} transparent depthWrite={false} opacity={orbOpacity} />
      </sprite>

      {active && (
        <Html distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            style={{
              background: "rgba(5, 20, 36, 0.9)",
              border: "1px solid rgba(0, 210, 255, 0.4)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 12,
              color: "#d4e4fa",
              whiteSpace: "nowrap",
              transform: "translate(12px, -12px)",
            }}
          >
            <div style={{ fontWeight: 600 }}>{point.label}</div>
            {point.subtitle && (
              <div style={{ color: "#a9b7c6", fontSize: 11, marginTop: 1 }}>{point.subtitle}</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function PointCloudScene({ points, selectedId, onSelect }: PointCloudSceneProps) {
  const edges = useMemo(() => computeNearestNeighborEdges(points), [points]);

  return (
    <Canvas camera={{ position: [0, 0, 14], fov: 50 }}>
      <color attach="background" args={["#010f1f"]} />

      {edges.map(([from, to], index) => (
        <Line
          key={index}
          points={[from, to]}
          color="#00d2ff"
          transparent
          opacity={0.18}
          lineWidth={1}
          depthWrite={false}
        />
      ))}

      {points.map((point) => (
        <PointNode key={point.id} point={point} isSelected={point.id === selectedId} onSelect={onSelect} />
      ))}

      <OrbitControls enableDamping dampingFactor={0.08} rotateSpeed={0.5} />
    </Canvas>
  );
}

import * as THREE from "three";

export const SPHERE_RADIUS = 1.6;

/** Distribuzione uniforme di punti su una sfera unitaria (spirale di Fibonacci / golden angle) —
 * stessa formula usata in src/documents/ImageSphere_AI_Memory_Explorer.md. */
export function fibonacciSpherePoint(index: number, total: number): [number, number, number] {
  if (total <= 1) return [0, 1, 0];
  const offset = 2 / total;
  const y = index * offset - 1 + offset / 2;
  const r = Math.sqrt(Math.max(0, 1 - y * y));
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const theta = index * goldenAngle;
  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;
  return [x, y, z];
}

/** Texture radiale generata una tantum su canvas 2D offscreen, cacheata a livello di modulo:
 * riproduce il "glow" soft (shadowBlur) dei nodi del mockup Canvas2D usando uno sprite additivo. */
let glowTextureCache: THREE.Texture | null = null;
export function getGlowTexture(): THREE.Texture {
  if (glowTextureCache) return glowTextureCache;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.55)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  glowTextureCache = texture;
  return texture;
}

/** Texture ad anello (per l'anello radar pulsante su hover/selezione). */
let ringTextureCache: THREE.Texture | null = null;
export function getRingTexture(): THREE.Texture {
  if (ringTextureCache) return ringTextureCache;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
  ctx.stroke();
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  ringTextureCache = texture;
  return texture;
}

/** Punto di controllo per una curva di Bezier quadratica tra due nodi sulla sfera, spinto
 * radialmente verso l'esterno per ottenere l'arco curvo visto nel mockup. */
export function makeArcCurve(a: THREE.Vector3, b: THREE.Vector3, radius: number): THREE.QuadraticBezierCurve3 {
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const control = mid.lengthSq() > 0 ? mid.clone().normalize().multiplyScalar(radius * 1.18) : mid;
  return new THREE.QuadraticBezierCurve3(a, control, b);
}

export function hexToRgbTuple(hex: string): [number, number, number] {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

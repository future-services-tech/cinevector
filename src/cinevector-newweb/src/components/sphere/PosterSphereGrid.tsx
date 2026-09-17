import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface PosterSphereImage {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
}

export interface PosterSphereGridProps {
  images: PosterSphereImage[];
  onSelect?: (image: PosterSphereImage) => void;
  containerSize?: number;
  sphereRadius?: number;
  dragSensitivity?: number;
  momentumDecay?: number;
  maxRotationSpeed?: number;
  baseImageScale?: number;
  hoverScale?: number;
  perspective?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
}

const DEFAULTS = {
  containerSize: 560,
  sphereRadius: 190,
  dragSensitivity: 0.8,
  momentumDecay: 0.94,
  maxRotationSpeed: 6,
  baseImageScale: 0.22,
  hoverScale: 1.3,
  perspective: 1000,
  autoRotate: true,
  autoRotateSpeed: 0.2,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Distribuisce N punti sulla superficie di una sfera in modo uniforme (spirale di Fibonacci) — evita
 * l'affollamento ai poli tipico di una griglia lat/long regolare. */
function fibonacciSpherePoints(count: number, radius: number) {
  const points: { x: number; y: number; z: number }[] = [];
  if (count <= 0) return points;

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(count - 1, 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    points.push({ x: x * radius, y: y * radius, z: z * radius });
  }
  return points;
}

/** Sfera 3D di poster in puro CSS (transform 3D + prospettiva, nessuna libreria WebGL): trascina per ruotare
 * (con inerzia allo rilascio), ruota da sola quando inattiva, ingrandisce al passaggio del mouse, notifica
 * il click su un poster al chiamante. Porting 1:1 di cinevector-web/src/components/SphereImageGrid.tsx,
 * con i token CSS (--radius-md, --border-hairline-strong, --glow-primary) sostituiti dai valori concreti
 * del tema neon di questo progetto, che non li definisce. */
export function PosterSphereGrid({ images, onSelect, ...overrides }: PosterSphereGridProps) {
  const config = { ...DEFAULTS, ...overrides };
  const rotation = useRef({ x: -12, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  // Distingue un trascinamento da un semplice click: sotto la soglia il tap apre il film, sopra ruota la sfera
  // e il click viene soppresso — altrimenti ogni rilascio dopo una rotazione aprirebbe anche la card.
  const dragDistance = useRef(0);
  const suppressClick = useRef(false);
  const pointsRef = useRef(fibonacciSpherePoints(images.length, config.sphereRadius));
  const [, setTick] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    pointsRef.current = fibonacciSpherePoints(images.length, config.sphereRadius);
  }, [images.length, config.sphereRadius]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!dragging.current) {
        if (config.autoRotate) {
          rotation.current.y += config.autoRotateSpeed;
        }
        if (Math.abs(velocity.current.x) > 0.001 || Math.abs(velocity.current.y) > 0.001) {
          rotation.current.x += velocity.current.x;
          rotation.current.y += velocity.current.y;
          velocity.current.x *= config.momentumDecay;
          velocity.current.y *= config.momentumDecay;
        }
      }
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [config.autoRotate, config.autoRotateSpeed, config.momentumDecay]);

  function handlePointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    dragging.current = true;
    dragDistance.current = 0;
    suppressClick.current = false;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    // Niente setPointerCapture qui: catturare il puntatore sul contenitore intero impedisce al click nativo
    // di raggiungere il poster sotto il cursore — senza capture il drag funziona lo stesso finché il
    // puntatore resta sopra il contenitore.
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    dragDistance.current += Math.abs(dx) + Math.abs(dy);
    if (dragDistance.current > 6) {
      suppressClick.current = true;
    }

    const vy = clamp(dx * config.dragSensitivity * 0.3, -config.maxRotationSpeed, config.maxRotationSpeed);
    const vx = clamp(-dy * config.dragSensitivity * 0.3, -config.maxRotationSpeed, config.maxRotationSpeed);
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

  const projected = images.map((image, index) => {
    const p = pointsRef.current[index] ?? { x: 0, y: 0, z: 0 };
    const y1 = p.y * cosX - p.z * sinX;
    const z1 = p.y * sinX + p.z * cosX;
    const x2 = p.x * cosY + z1 * sinY;
    const z2 = -p.x * sinY + z1 * cosY;
    return { image, x: x2, y: y1, z: z2 };
  });

  projected.sort((a, b) => a.z - b.z);

  const posterWidth = config.sphereRadius * 2 * config.baseImageScale;
  const posterHeight = posterWidth * 1.5;

  return (
    <div
      style={{
        position: "relative",
        width: config.containerSize,
        height: config.containerSize,
        maxWidth: "100%",
        margin: "0 auto",
        perspective: config.perspective,
        touchAction: "none",
        cursor: dragging.current ? "grabbing" : "grab",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {projected.map(({ image, x, y, z }) => {
        const depth = (z + config.sphereRadius) / (2 * config.sphereRadius); // 0 (retro) .. 1 (fronte)
        const scale = 0.55 + depth * 0.65;
        const isHovered = hoveredId === image.id;

        return (
          <div
            key={image.id}
            onMouseEnter={() => setHoveredId(image.id)}
            onMouseLeave={() => setHoveredId((current) => (current === image.id ? null : current))}
            onClick={() => {
              if (suppressClick.current) return;
              onSelect?.(image);
            }}
            title={image.title}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: posterWidth,
              height: posterHeight,
              marginLeft: -posterWidth / 2,
              marginTop: -posterHeight / 2,
              transform: `translate3d(${x}px, ${y}px, ${z}px) scale(${isHovered ? scale * config.hoverScale : scale})`,
              opacity: 0.35 + depth * 0.65,
              zIndex: Math.round(z + config.sphereRadius),
              borderRadius: 10,
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: isHovered ? "0 0 22px rgba(0, 242, 254, 0.5)" : "0 4px 14px rgba(0,0,0,0.45)",
              transition: "box-shadow 0.2s ease",
              willChange: "transform",
            }}
          >
            <img
              src={image.src}
              alt={image.alt}
              draggable={false}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", pointerEvents: "none" }}
            />
          </div>
        );
      })}
    </div>
  );
}

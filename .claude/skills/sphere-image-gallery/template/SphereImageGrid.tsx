/**
 * Sphere image gallery — CSS 3D, no WebGL/three.js.
 *
 * Copy this file into the target project's components folder and adjust:
 *  - the `var(--token, fallback)` CSS values to the host app's design tokens
 *    (fallbacks are provided so it works unmodified with no design system).
 *  - the poster aspect ratio (currently 2:3, `posterHeight = posterWidth * 1.5`)
 *    if the images aren't poster-shaped.
 *
 * See SKILL.md in this same skill folder for the design rationale and, in
 * particular, why `setPointerCapture` must NOT be used here.
 */
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface ImageData {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
}

export interface SphereImageGridProps {
  images: ImageData[];
  onSelect?: (image: ImageData) => void;
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

/** Distributes N points evenly on a sphere's surface (Fibonacci/golden-angle spiral) — avoids the
 * pole-crowding a regular lat/long grid produces. */
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

export function SphereImageGrid({ images, onSelect, ...overrides }: SphereImageGridProps) {
  const config = { ...DEFAULTS, ...overrides };
  const rotation = useRef({ x: -12, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  // Distinguishes a drag from a plain tap: below the threshold the tap fires onSelect, above it the
  // sphere just rotates and the click is suppressed — otherwise every drag-release would also select
  // whatever image happens to be under the cursor at release time.
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
    // Deliberately NOT calling e.currentTarget.setPointerCapture here — see SKILL.md.
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

  // Painter's algorithm: draw far-to-near so nearer images correctly overlap farther ones.
  projected.sort((a, b) => a.z - b.z);

  const posterWidth = config.sphereRadius * 2 * config.baseImageScale;
  const posterHeight = posterWidth * 1.5; // adjust for non-poster aspect ratios

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
        const depth = (z + config.sphereRadius) / (2 * config.sphereRadius); // 0 (back) .. 1 (front)
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
            className="sphere-poster"
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
              borderRadius: "var(--radius-md, 8px)",
              overflow: "hidden",
              cursor: "pointer",
              border: "1px solid var(--border-hairline-strong, rgba(255,255,255,0.14))",
              boxShadow: isHovered
                ? "0 0 22px var(--glow-primary, rgba(0,150,255,0.5))"
                : "0 4px 14px rgba(0,0,0,0.45)",
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

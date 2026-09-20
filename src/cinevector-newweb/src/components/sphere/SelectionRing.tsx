import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getRingTexture, SPHERE_RADIUS } from "../../lib/three-helpers";
import type { MovieNode } from "../../types/movie";

const CYCLE_SECONDS = 2.2;

/** Anello radar pulsante sul nodo selezionato — replica il keyframe CSS `ringRadar` del mockup
 * (scala 0.85→1.6, opacità 0.8→0, loop continuo), qui animato via useFrame invece che CSS. */
export function SelectionRing({ node }: { node: MovieNode | null }) {
  const texture = useMemo(() => getRingTexture(), []);
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const clockRef = useRef(0);

  useFrame((_, delta) => {
    if (!node || !materialRef.current || !spriteRef.current) return;
    clockRef.current = (clockRef.current + delta) % CYCLE_SECONDS;
    const t = clockRef.current / CYCLE_SECONDS;
    const scale = 0.34 + t * (0.64 - 0.34);
    spriteRef.current.scale.set(scale, scale, scale);
    materialRef.current.opacity = 0.8 * (1 - t);
  });

  if (!node) return null;
  const position = node.position.map((v) => v * SPHERE_RADIUS) as [number, number, number];

  return (
    <sprite ref={spriteRef} position={position}>
      <spriteMaterial ref={materialRef} map={texture} color={node.color} transparent depthWrite={false} />
    </sprite>
  );
}

import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MovieLink, MovieNode } from "../../types/movie";
import { getGlowTexture, makeArcCurve, SPHERE_RADIUS } from "../../lib/three-helpers";

interface SemanticLinksProps {
  links: MovieLink[];
  nodeById: Map<string, MovieNode>;
}

const MAX_PACKETS = 14;

/** Archi curvi tra nodi (Bezier quadratica, punto di controllo spinto radialmente verso l'esterno)
 * + un pool limitato di "pacchetti energia" che scorrono lungo le curve — replica l'effetto del
 * mockup Canvas2D senza disegnare un packet per ogni singolo arco visibile. */
export function SemanticLinks({ links, nodeById }: SemanticLinksProps) {
  const glowTexture = useMemo(() => getGlowTexture(), []);

  const curves = useMemo(() => {
    return links
      .map((link) => {
        const source = nodeById.get(link.source);
        const target = nodeById.get(link.target);
        if (!source || !target) return null;
        const a = new THREE.Vector3(...source.position).multiplyScalar(SPHERE_RADIUS);
        const b = new THREE.Vector3(...target.position).multiplyScalar(SPHERE_RADIUS);
        const curve = makeArcCurve(a, b, SPHERE_RADIUS);
        return { link, curve, points: curve.getPoints(24) };
      })
      .filter((v): v is { link: MovieLink; curve: THREE.QuadraticBezierCurve3; points: THREE.Vector3[] } => v !== null);
  }, [links, nodeById]);

  const packetRefs = useRef<(THREE.Sprite | null)[]>([]);
  const packetCurves = useMemo(() => curves.slice(0, MAX_PACKETS).map((c) => c.curve), [curves]);
  const packetOffsets = useMemo(() => packetCurves.map((_, i) => (i / Math.max(packetCurves.length, 1)) % 1), [packetCurves]);
  const clockRef = useRef(0);

  useFrame((_, delta) => {
    clockRef.current += delta;
    packetCurves.forEach((curve, i) => {
      const sprite = packetRefs.current[i];
      if (!sprite) return;
      const t = (clockRef.current * 0.18 + packetOffsets[i]) % 1;
      const point = curve.getPointAt(t);
      sprite.position.copy(point);
    });
  });

  return (
    <group>
      {curves.map(({ link, points }) => {
        const opacity = 0.08 + Math.max(0, link.affinity - 50) / 120;
        return <Line key={`${link.source}-${link.target}`} points={points} color="#4facfe" transparent opacity={opacity} lineWidth={1} />;
      })}
      {packetCurves.map((_, i) => (
        <sprite key={i} ref={(el) => { packetRefs.current[i] = el; }} scale={[0.05, 0.05, 0.05]}>
          <spriteMaterial map={glowTexture} color="#00f2fe" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  );
}

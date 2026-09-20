import { useMemo } from "react";
import * as THREE from "three";
import { mulberry32 } from "../../data/seedRandom";
import { getGlowTexture, SPHERE_RADIUS } from "../../lib/three-helpers";

const PARTICLE_COUNT = 95;
const PALETTE = ["#00f2fe", "#4facfe", "#c084fc", "#fbbf24", "#34d399", "#38bdf8"];

/** 95 particelle di sfondo procedurali (seed-based, non film reali) — nuvola decorativa come nel mockup. */
export function BackgroundParticles() {
  const geometry = useMemo(() => {
    const rng = mulberry32(0xb1a2c0de);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const radius = SPHERE_RADIUS * (1.3 + rng() * 1.6);
      const theta = rng() * Math.PI * 2;
      const phi = Math.acos(2 * rng() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const color = new THREE.Color(PALETTE[Math.floor(rng() * PALETTE.length)]);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geo;
  }, []);

  const texture = useMemo(() => getGlowTexture(), []);

  return (
    <points geometry={geometry}>
      <pointsMaterial map={texture} vertexColors size={0.05} sizeAttenuation transparent opacity={0.35} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

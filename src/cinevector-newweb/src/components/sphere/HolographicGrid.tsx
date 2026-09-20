import { Line } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";
import { SPHERE_RADIUS } from "../../lib/three-helpers";

const GRID_RADIUS = SPHERE_RADIUS * 1.015;
const LATITUDE_DEGREES = [-75, -50, -25, 0, 25, 50, 75];
const MERIDIAN_COUNT = 10;
const SEGMENTS = 64;

function circleAtLatitude(latDeg: number): THREE.Vector3[] {
  const lat = (latDeg * Math.PI) / 180;
  const y = GRID_RADIUS * Math.sin(lat);
  const r = GRID_RADIUS * Math.cos(lat);
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = (i / SEGMENTS) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r));
  }
  return points;
}

function meridianAtRotation(rotY: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = (i / SEGMENTS) * Math.PI * 2;
    const x = Math.sin(t) * Math.cos(rotY) * GRID_RADIUS;
    const y = Math.cos(t) * GRID_RADIUS;
    const z = Math.sin(t) * Math.sin(rotY) * GRID_RADIUS;
    points.push(new THREE.Vector3(x, y, z));
  }
  return points;
}

/** Griglia olografica: 7 paralleli (l'equatore in evidenza) + 10 meridiani, stessi colori/opacità
 * del mockup Canvas2D (dashboard_sfere3d/code.html). */
export function HolographicGrid() {
  const parallels = useMemo(() => LATITUDE_DEGREES.map((deg) => ({ deg, points: circleAtLatitude(deg) })), []);
  const meridians = useMemo(
    () => Array.from({ length: MERIDIAN_COUNT }, (_, i) => meridianAtRotation((i * Math.PI) / MERIDIAN_COUNT)),
    [],
  );

  return (
    <group>
      {parallels.map(({ deg, points }) => (
        <Line
          key={deg}
          points={points}
          color={deg === 0 ? "#00f2fe" : "#4facfe"}
          transparent
          opacity={deg === 0 ? 0.28 : 0.12}
          lineWidth={1}
        />
      ))}
      {meridians.map((points, i) => (
        <Line key={i} points={points} color="#a855f7" transparent opacity={0.12} lineWidth={1} />
      ))}
    </group>
  );
}

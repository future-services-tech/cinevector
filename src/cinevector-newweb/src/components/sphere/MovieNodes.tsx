import { useMemo } from "react";
import * as THREE from "three";
import { getGlowTexture, SPHERE_RADIUS } from "../../lib/three-helpers";
import { useSettings, type AppSettings } from "../../state/SettingsContext";
import type { MovieNode } from "../../types/movie";

interface MovieNodesProps {
  movies: MovieNode[];
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

const DENSITY_PRESETS: Record<AppSettings["sphereDensity"], { regularOpacity: number; regularSize: number; heroOpacity: number; heroSize: number }> = {
  leggera: { regularOpacity: 0.6, regularSize: 0.05, heroOpacity: 0.85, heroSize: 0.1 },
  media: { regularOpacity: 0.9, regularSize: 0.07, heroOpacity: 1, heroSize: 0.13 },
  piena: { regularOpacity: 1, regularSize: 0.09, heroOpacity: 1, heroSize: 0.16 },
};

function buildGeometry(list: MovieNode[]): THREE.BufferGeometry {
  const positions = new Float32Array(list.length * 3);
  const colors = new Float32Array(list.length * 3);
  list.forEach((movie, i) => {
    positions[i * 3] = movie.position[0] * SPHERE_RADIUS;
    positions[i * 3 + 1] = movie.position[1] * SPHERE_RADIUS;
    positions[i * 3 + 2] = movie.position[2] * SPHERE_RADIUS;
    const color = new THREE.Color(movie.color);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

/** I nodi film come due nuvole di punti (hero più grandi/prominenti, gli altri più piccoli) —
 * un singolo BufferGeometry per gruppo, non un componente React per film, per restare performante. */
export function MovieNodes({ movies, onHover, onSelect }: MovieNodesProps) {
  const { settings } = useSettings();
  const density = DENSITY_PRESETS[settings.sphereDensity];
  const heroList = useMemo(() => movies.filter((m) => m.isKey), [movies]);
  const regularList = useMemo(() => movies.filter((m) => !m.isKey), [movies]);

  const heroGeometry = useMemo(() => buildGeometry(heroList), [heroList]);
  const regularGeometry = useMemo(() => buildGeometry(regularList), [regularList]);
  const glowTexture = useMemo(() => getGlowTexture(), []);

  return (
    <group>
      <points
        geometry={regularGeometry}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.index !== undefined && regularList[e.index]) onHover(regularList[e.index].id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.index !== undefined && regularList[e.index]) onSelect(regularList[e.index].id);
        }}
      >
        <pointsMaterial
          map={glowTexture}
          vertexColors
          transparent
          opacity={density.regularOpacity}
          size={density.regularSize}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <points
        geometry={heroGeometry}
        onPointerMove={(e) => {
          e.stopPropagation();
          if (e.index !== undefined && heroList[e.index]) onHover(heroList[e.index].id);
        }}
        onPointerOut={() => onHover(null)}
        onClick={(e) => {
          e.stopPropagation();
          if (e.index !== undefined && heroList[e.index]) onSelect(heroList[e.index].id);
        }}
      >
        <pointsMaterial
          map={glowTexture}
          vertexColors
          transparent
          opacity={density.heroOpacity}
          size={density.heroSize}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

import { useMemo } from "react";
import * as THREE from "three";
import { getGlowTexture, SPHERE_RADIUS } from "../../lib/three-helpers";
import { useSettings, type AppSettings } from "../../state/SettingsContext";
import type { MovieNode } from "../../types/movie";

const HALO_PRESETS: Record<AppSettings["haloIntensity"], { hoveredScale: number; hoveredOpacity: number; selectedScale: number; selectedOpacity: number }> = {
  sottile: { hoveredScale: 0.24, hoveredOpacity: 0.5, selectedScale: 0.3, selectedOpacity: 0.7 },
  normale: { hoveredScale: 0.34, hoveredOpacity: 0.85, selectedScale: 0.42, selectedOpacity: 1 },
  intenso: { hoveredScale: 0.44, hoveredOpacity: 1, selectedScale: 0.56, selectedOpacity: 1 },
};

/** Sprite di glow additivo per il nodo in hover e per quello selezionato (max 2 istanze contemporanee,
 * non per tutti i nodi) — replica il "shadowBlur" del mockup Canvas2D. */
export function NodeGlowSprites({ hovered, selected }: { hovered: MovieNode | null; selected: MovieNode | null }) {
  const { settings } = useSettings();
  const halo = HALO_PRESETS[settings.haloIntensity];
  const texture = useMemo(() => getGlowTexture(), []);

  return (
    <group>
      {hovered && hovered.id !== selected?.id && (
        <sprite
          position={hovered.position.map((v) => v * SPHERE_RADIUS) as [number, number, number]}
          scale={[halo.hoveredScale, halo.hoveredScale, halo.hoveredScale]}
        >
          <spriteMaterial map={texture} color={hovered.color} transparent opacity={halo.hoveredOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
      {selected && (
        <sprite
          position={selected.position.map((v) => v * SPHERE_RADIUS) as [number, number, number]}
          scale={[halo.selectedScale, halo.selectedScale, halo.selectedScale]}
        >
          <spriteMaterial map={texture} color={selected.color} transparent opacity={halo.selectedOpacity} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
    </group>
  );
}

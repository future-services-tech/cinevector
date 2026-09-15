import { useMemo } from "react";
import * as THREE from "three";
import type { MovieNode } from "../../types/movie";
import { getClusterConfig } from "../../data/clustersConfig";
import { getGlowTexture, SPHERE_RADIUS } from "../../lib/three-helpers";

/** Sprite di glow additivo per il nodo in hover e per quello selezionato (max 2 istanze contemporanee,
 * non per tutti i 1000 nodi) — replica il "shadowBlur" del mockup Canvas2D. */
export function NodeGlowSprites({ hovered, selected }: { hovered: MovieNode | null; selected: MovieNode | null }) {
  const texture = useMemo(() => getGlowTexture(), []);

  return (
    <group>
      {hovered && hovered.id !== selected?.id && (
        <sprite position={hovered.position.map((v) => v * SPHERE_RADIUS) as [number, number, number]} scale={[0.34, 0.34, 0.34]}>
          <spriteMaterial map={texture} color={getClusterConfig(hovered.clusterId).color} transparent opacity={0.85} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
      {selected && (
        <sprite position={selected.position.map((v) => v * SPHERE_RADIUS) as [number, number, number]} scale={[0.42, 0.42, 0.42]}>
          <spriteMaterial map={texture} color={getClusterConfig(selected.clusterId).color} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      )}
    </group>
  );
}

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getMovieById, links, movies } from "../../data";
import { useFilters } from "../../state/FilterContext";
import { useSelection } from "../../state/SelectionContext";
import { setCameraCoords } from "../../lib/cameraCoordsStore";
import { BackgroundParticles } from "./BackgroundParticles";
import { HolographicGrid } from "./HolographicGrid";
import { MovieNodes } from "./MovieNodes";
import { NodeGlowSprites } from "./NodeGlowSprites";
import { NodeTooltip } from "./NodeTooltip";
import { SelectionRing } from "./SelectionRing";
import { SemanticLinks } from "./SemanticLinks";

function CameraCoordsReporter() {
  const { camera } = useThree();
  useFrame(() => {
    const dir = camera.position.clone().normalize();
    setCameraCoords({ x: Math.round(dir.x * 100) / 100, y: Math.round(dir.y * 100) / 100, z: Math.round(dir.z * 100) / 100 });
  });
  return null;
}

export function SphereScene() {
  const { activeClusterIds, similarityThreshold, yearRange } = useFilters();
  const { selectedId, hoveredId, select, hover } = useSelection();

  const filteredMovies = useMemo(
    () =>
      movies.filter(
        (m) => activeClusterIds.has(m.clusterId) && m.year >= yearRange[0] && m.year <= yearRange[1],
      ),
    [activeClusterIds, yearRange],
  );

  const visibleIds = useMemo(() => new Set(filteredMovies.map((m) => m.id)), [filteredMovies]);
  const nodeById = useMemo(() => new Map(filteredMovies.map((m) => [m.id, m])), [filteredMovies]);

  const selectedNode = selectedId ? (getMovieById(selectedId) ?? null) : null;
  const hoveredNode = hoveredId ? (getMovieById(hoveredId) ?? null) : null;

  // Con ~1000 nodi, disegnare TUTTI gli archi che superano la soglia crea un groviglio illeggibile
  // (migliaia di curve sovrapposte) invece dell'effetto "pochi archi eleganti" del mockup. Mostra quindi
  // solo i collegamenti del nodo selezionato/in hover, più un piccolo campione ambientale (i più forti
  // in assoluto) quando nulla è selezionato — stesso principio della "modalità esplosa" della spec di
  // riferimento (i collegamenti hanno senso soprattutto nel contesto di un nodo attivo).
  const focusId = selectedId ?? hoveredId;
  const filteredLinks = useMemo(() => {
    const passingThreshold = links.filter(
      (l) => l.affinity >= similarityThreshold && visibleIds.has(l.source) && visibleIds.has(l.target),
    );
    if (focusId) {
      return passingThreshold.filter((l) => l.source === focusId || l.target === focusId);
    }
    return [...passingThreshold].sort((a, b) => b.affinity - a.affinity).slice(0, 18);
  }, [similarityThreshold, visibleIds, focusId]);

  const groupRef = useRef<THREE.Group>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!selectedNode) return;
    const [x, y, z] = selectedNode.position;
    const phi = Math.asin(THREE.MathUtils.clamp(y, -1, 1));
    const theta = Math.atan2(z, x);
    targetRotation.current = { x: phi, y: -theta + Math.PI / 2 };
  }, [selectedNode]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotation.current.x, 0.05);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotation.current.y, 0.05);
  });

  return (
    <>
      <CameraCoordsReporter />
      <group ref={groupRef}>
        <HolographicGrid />
        <BackgroundParticles />
        <SemanticLinks links={filteredLinks} nodeById={nodeById} />
        <MovieNodes movies={filteredMovies} onHover={hover} onSelect={select} />
        <NodeGlowSprites hovered={hoveredNode} selected={selectedNode} />
        <SelectionRing node={selectedNode ?? hoveredNode} />
        <NodeTooltip node={hoveredNode} />
      </group>
    </>
  );
}

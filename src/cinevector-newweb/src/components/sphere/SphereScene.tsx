import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimilarMovies } from "../../hooks/useSimilarMovies";
import { setCameraCoords } from "../../lib/cameraCoordsStore";
import { useFilters } from "../../state/FilterContext";
import { useMovieData } from "../../state/MovieDataContext";
import { useSelection } from "../../state/SelectionContext";
import type { MovieLink } from "../../types/movie";
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
  const { movies, getMovieById } = useMovieData();
  const { activeClusterIds, yearRange } = useFilters();
  const { selectedId, hoveredId, select, hover } = useSelection();

  const filteredMovies = useMemo(
    () => movies.filter((m) => activeClusterIds.has(m.clusterId) && m.year >= yearRange[0] && m.year <= yearRange[1]),
    [movies, activeClusterIds, yearRange],
  );

  const visibleIds = useMemo(() => new Set(filteredMovies.map((m) => m.id)), [filteredMovies]);
  const nodeById = useMemo(() => new Map(filteredMovies.map((m) => [m.id, m])), [filteredMovies]);

  // Il nodo selezionato/in hover resta visibile nel pannello destro anche se un filtro successivo lo
  // esclude dalla sfera: per questo si legge dal set completo (getMovieById), non da quello filtrato.
  const selectedNode = selectedId ? (getMovieById(selectedId) ?? null) : null;
  const hoveredNode = hoveredId ? (getMovieById(hoveredId) ?? null) : null;

  // Gli archi semantici, a differenza del mock, non sono un grafo precalcolato: arrivano on-demand da
  // GET /api/movies/{id}/similar solo per il nodo attivo (nessun campione "ambientale" quando nulla è
  // selezionato — il backend non offre un grafo completo pronto per 1000+ nodi).
  const focusId = selectedId ?? hoveredId;
  const { data: similarData } = useSimilarMovies(focusId);
  const filteredLinks = useMemo<MovieLink[]>(() => {
    if (!focusId || !similarData) return [];
    return similarData.results
      .filter((r) => visibleIds.has(String(r.id)))
      .map((r) => ({ source: focusId, target: String(r.id), affinity: Math.round((r.similarity ?? r.relevance ?? 0) * 100) }));
  }, [focusId, similarData, visibleIds]);

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

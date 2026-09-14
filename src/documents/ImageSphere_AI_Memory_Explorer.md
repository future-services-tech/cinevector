# Image-Sphere --- AI Memory Explorer

## Obiettivo

Costruire un componente React denominato `ImageSphere` per visualizzare
la memoria semantica salvata in un Vector Database.

Ogni punto della sfera rappresenta una memoria reale. I punti sono
colorati per cluster, collegati in base alla similarità semantica e
selezionabili con il mouse.

Il componente deve essere integrabile in una dashboard React esistente e
ricevere i dati dal backend .NET tramite props.

------------------------------------------------------------------------

## 1. Prompt completo per l'AI coding agent

### Ruolo

Sei un Senior Frontend Engineer specializzato in React, TypeScript,
WebGL, Three.js e visualizzazioni di dati semantici provenienti da
Vector Database.

Devi sviluppare un componente React denominato `ImageSphere`, destinato
a essere integrato in una dashboard di AI Memory Explorer.

Il componente visualizza una memoria semantica aziendale come una sfera
3D di punti, dove ogni punto corrisponde a una memoria salvata nel
Vector DB. I punti sono raggruppati in cluster semantici e collegati in
base alla similarità dei loro embedding.

Non realizzare una semplice animazione 3D: costruisci un vero
visualizzatore interattivo di dati.

### Obiettivo visivo

Ricostruisci fedelmente la sfera mostrata nella dashboard di
riferimento:

-   Sfera 3D centrale, grande e dominante.
-   Sfondo trasparente o molto scuro.
-   Sfera composta da centinaia o migliaia di punti luminosi.
-   Distribuzione iniziale dei punti sulla superficie tramite Fibonacci
    Sphere Distribution.
-   Cluster riconoscibili attraverso colori distinti.
-   Punti di dimensione diversa in base alla rilevanza o importanza
    della memoria.
-   Collegamenti sottili tra punti semanticamente vicini.
-   Bagliori sui punti più importanti.
-   Griglia sferica e atmosfera discreta.
-   Rendering moderno e adatto a un prodotto enterprise AI.
-   Nessun effetto che renda difficile distinguere i punti reali.

### Stack tecnologico

Utilizza:

-   React 18+ o React 19.
-   TypeScript strict.
-   Three.js.
-   `@react-three/fiber`.
-   `@react-three/drei`.
-   Zustand oppure stato React locale.
-   CSS Modules o Tailwind CSS per i controlli esterni.

Non utilizzare immagini statiche per rappresentare la sfera. La sfera
deve essere renderizzata realmente in WebGL.

------------------------------------------------------------------------

## 2. Modello dati TypeScript

``` ts
export interface MemoryNode {
  id: string;
  title: string;
  content?: string;
  embedding?: number[];
  clusterId: string;
  clusterName: string;
  category?: string;
  tags?: string[];
  relevance?: number;
  importance?: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryCluster {
  id: string;
  name: string;
  color: string;
  count: number;
  centroid?: number[];
  description?: string;
}

export interface MemoryLink {
  source: string;
  target: string;
  similarity: number;
}

export interface ImageSphereProps {
  memories: MemoryNode[];
  clusters: MemoryCluster[];
  links?: MemoryLink[];
  proximity?: number;
  selectedMemoryId?: string | null;
  onMemorySelect?: (memory: MemoryNode | null) => void;
  onClusterSelect?: (cluster: MemoryCluster) => void;
  onSearch?: (query: string) => void;
  maxVisibleNodes?: number;
  enableAutoRotate?: boolean;
  className?: string;
}
```

Non inventare dati del database. Se i dati non sono disponibili,
utilizza un piccolo dataset demo chiaramente separato dal componente
reale.

------------------------------------------------------------------------

## 3. Distribuzione dei punti sulla sfera

Implementa una funzione Fibonacci Sphere Distribution.

La distribuzione deve:

1.  Ricevere il numero di punti.
2.  Calcolare un punto sulla superficie della sfera per ogni memoria.
3.  Utilizzare la costante aurea.
4.  Restituire coordinate 3D normalizzate.
5.  Applicare un raggio configurabile.
6.  Evitare una distribuzione casuale che produca ammassi artificiali.

Formula di riferimento:

``` ts
const phi = Math.PI * (3 - Math.sqrt(5));

const y = 1 - (i / (count - 1)) * 2;
const radius = Math.sqrt(1 - y * y);
const theta = phi * i;

const x = Math.cos(theta) * radius;
const z = Math.sin(theta) * radius;
```

La posizione iniziale deve essere deterministica.

------------------------------------------------------------------------

## 4. Rappresentazione dei cluster

Ogni memoria appartiene a un cluster semantico.

Esempi:

-   Tennis.
-   Marketing.
-   Progetti.
-   Lavoro.
-   Tecnologia.
-   Sport & Health.
-   Documenti.
-   Personale.

Esempio di palette:

``` ts
const clusterColors = {
  tennis: "#A3FF3F",
  marketing: "#A855F7",
  progetti: "#2196FF",
  lavoro: "#FFAA32",
  tecnologia: "#00D9FF",
  sport: "#FF4F83",
};
```

Non utilizzare colori casuali per i nodi appartenenti allo stesso
cluster.

Visualizza:

-   Nome del cluster.
-   Numero di memorie.
-   Colore.
-   Eventuale centroide.
-   Similarità media.
-   Cluster selezionato.

------------------------------------------------------------------------

## 5. Modalità di visualizzazione

### Modalità Sphere

Visualizza tutte le memorie sulla superficie della sfera.

### Modalità Cluster

Raggruppa visivamente i punti in aree riconoscibili per cluster.

I cluster devono essere ottenuti dai dati semantici del backend, non da
colori assegnati casualmente.

Se sono disponibili i centroidi degli embedding, usali per posizionare i
gruppi sulla sfera.

### Modalità Exploded

Quando l'utente clicca su un punto:

1.  Seleziona la memoria.
2.  Evidenzia il punto selezionato.
3.  Identifica i punti correlati.
4.  Mostra i collegamenti verso i vicini.
5.  Allontana visivamente i punti correlati dal punto centrale.
6.  Mostra le memorie vicine secondo la soglia di prossimità.
7.  Mantieni la possibilità di ruotare la sfera.
8.  Permetti di tornare alla modalità normale.

Il punto selezionato deve diventare il centro visivo dell'esplorazione.

------------------------------------------------------------------------

## 6. Funzione di prossimità semantica

Implementa un controllo configurabile da `0.0` a `1.0`.

Esempi:

-   Prossimità `0.9`: mostra solo memorie molto simili.
-   Prossimità `0.7`: mostra memorie semanticamente vicine.
-   Prossimità `0.5`: mostra anche memorie più lontane ma correlate.
-   Prossimità `0.0`: mostra tutte le memorie disponibili.

La prossimità deve filtrare i collegamenti semantici, non semplicemente
la distanza geometrica sulla sfera.

Se il backend fornisce `similarity`:

``` ts
const visibleLinks = links.filter(
  link => link.similarity >= proximity
);
```

Se il backend non fornisce i link, il componente deve poter utilizzare
un adapter esterno per calcolarli.

Non calcolare tutte le similarità tra migliaia di embedding nel browser.

### Nota importante

La similarità semantica e la distanza geometrica sono due concetti
distinti:

-   Similarità semantica: quanto due memorie sono simili.
-   Distanza geometrica: quanto due punti sono vicini visivamente.

La posizione sulla sfera non deve essere usata automaticamente come
sostituto della similarità degli embedding.

------------------------------------------------------------------------

## 7. Interazione mouse

Implementa:

-   Drag orizzontale: rotazione della sfera.
-   Drag verticale: rotazione verticale.
-   Momentum dopo il rilascio.
-   Auto-rotazione configurabile.
-   Scroll: zoom.
-   Click su un punto: selezione.
-   Double click: apertura dettagli della memoria.
-   Click su spazio vuoto: deselezione.
-   Hover: tooltip con titolo, cluster e similarità.
-   Supporto touch per dispositivi mobili.

Quando un punto è selezionato, il tooltip deve rimanere visibile fino
alla selezione di un altro punto o alla chiusura.

------------------------------------------------------------------------

## 8. Aspetto della sfera

Crea una sfera con:

-   Raggio di default `4`.
-   Punti luminosi con dimensione variabile.
-   Materiali emissivi o shader leggeri.
-   Atmosfera esterna discreta.
-   Linee di collegamento sottili.
-   Colori cluster coerenti.
-   Illuminazione ambientale minima.
-   Nessuna ombra pesante.
-   Nessun effetto che renda il rendering poco leggibile.

La sfera deve ricordare una rete semantica viva, non una semplice
pallina con particelle.

------------------------------------------------------------------------

## 9. Performance

Il componente deve supportare migliaia di memorie.

Requisiti:

-   Usare `BufferGeometry` o `Points`.
-   Evitare un Mesh distinto per ogni memoria.
-   Limitare il numero di linee renderizzate.
-   Non ricalcolare tutte le posizioni durante ogni frame.
-   Memoizzare i dati derivati.
-   Aggiornare i nodi solo quando cambiano dati, soglia o selezione.
-   Gestire `maxVisibleNodes`.
-   Supportare una modalità semplificata per dispositivi meno potenti.

Per dataset grandi:

-   Il backend restituisce i nodi più rilevanti.
-   Il frontend visualizza un subset.
-   La ricerca aggiorna il dataset o filtra il risultato.
-   Il componente non deve scaricare milioni di embedding.

------------------------------------------------------------------------

## 10. Integrazione con la dashboard

Il componente deve essere indipendente dal layout della dashboard.

Non creare un nuovo header, sidebar o dashboard completa.

Esporta:

``` tsx
export default ImageSphere;
```

Utilizzo previsto:

``` tsx
<ImageSphere
  memories={memories}
  clusters={clusters}
  links={links}
  proximity={0.9}
  selectedMemoryId={selectedMemoryId}
  onMemorySelect={setSelectedMemory}
  onClusterSelect={setSelectedCluster}
  onSearch={handleSearch}
/>
```

La dashboard esterna deve poter gestire:

-   Barra di ricerca.
-   Slider di prossimità.
-   Lista risultati.
-   Dettaglio memoria.
-   Cluster selezionato.
-   Modalità di visualizzazione.
-   Stato del database.
-   Caricamento e paginazione.

------------------------------------------------------------------------

## 11. Output richiesto all'AI coding agent

Genera:

1.  `ImageSphere.tsx`.
2.  `ImageSphere.types.ts`.
3.  `ImageSphere.utils.ts`.
4.  Eventuali componenti `MemoryNode`, `ClusterLabel`, `MemoryTooltip`.
5.  Esempio di integrazione nella dashboard.
6.  Dataset demo.
7.  Istruzioni di installazione.
8.  Test per la distribuzione Fibonacci.
9.  Test per il filtro di prossimità.
10. Test per la selezione dei punti.

Il codice deve essere completo, eseguibile e tipizzato.

Non limitarti a creare una mockup grafica. Il componente deve essere
pronto a ricevere dati reali da un Vector Database tramite API.

------------------------------------------------------------------------

# 12. Architettura del componente

``` text
AI Memory Explorer Dashboard
│
├── Ricerca semantica
├── Slider prossimità
├── Lista risultati
├── Dettaglio memoria
│
└── ImageSphere
    ├── Three.js / WebGL
    ├── MemoryNode[]
    ├── MemoryCluster[]
    ├── MemoryLink[]
    ├── Fibonacci Sphere Distribution
    ├── Cluster Layout
    ├── Semantic Links
    ├── Selection / Exploded Mode
    └── OrbitControls
            │
            ▼
       .NET API
            │
            ▼
       Vector Database
            ├── Embeddings
            ├── Cluster
            ├── Centroidi
            ├── Similarità cosine
            └── Ricerca semantica
```

------------------------------------------------------------------------

# 13. Installazione

Nel progetto React:

``` bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

------------------------------------------------------------------------

# 14. Componente React ImageSphere.tsx

> Nota: il seguente codice è una base funzionale da integrare e
> rifinire. Per un uso enterprise è consigliato separare tipi, utility,
> scena 3D, tooltip e pannello dettagli in file distinti.

``` tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Canvas,
  useFrame,
} from "@react-three/fiber";

import {
  Html,
  Line,
  OrbitControls,
  PerspectiveCamera,
  Points,
  PointMaterial,
} from "@react-three/drei";

import * as THREE from "three";

// --------------------------------------------------
// Types
// --------------------------------------------------

export interface MemoryNode {
  id: string;
  title: string;
  content?: string;
  clusterId: string;
  clusterName: string;
  category?: string;
  tags?: string[];
  relevance?: number;
  importance?: number;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryCluster {
  id: string;
  name: string;
  color: string;
  count: number;
  centroid?: number[];
  description?: string;
}

export interface MemoryLink {
  source: string;
  target: string;
  similarity: number;
}

export interface ImageSphereProps {
  memories: MemoryNode[];
  clusters: MemoryCluster[];
  links?: MemoryLink[];
  proximity?: number;
  selectedMemoryId?: string | null;
  onMemorySelect?: (memory: MemoryNode | null) => void;
  onClusterSelect?: (cluster: MemoryCluster) => void;
  onSearch?: (query: string) => void;
  maxVisibleNodes?: number;
  enableAutoRotate?: boolean;
  className?: string;
}

// --------------------------------------------------
// Constants
// --------------------------------------------------

const DEFAULT_RADIUS = 4;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

const FALLBACK_COLORS = [
  "#A3FF3F",
  "#A855F7",
  "#2196FF",
  "#FFAA32",
  "#00D9FF",
  "#FF4F83",
  "#8B9BB4",
];

// --------------------------------------------------
// Utilities
// --------------------------------------------------

function fibonacciPoint(
  index: number,
  count: number,
  radius: number
): THREE.Vector3 {
  if (count <= 1) {
    return new THREE.Vector3(0, radius, 0);
  }

  const y = 1 - (index / (count - 1)) * 2;

  const ringRadius = Math.sqrt(
    Math.max(0, 1 - y * y)
  );

  const theta = GOLDEN_ANGLE * index;

  return new THREE.Vector3(
    Math.cos(theta) * ringRadius * radius,
    y * radius,
    Math.sin(theta) * ringRadius * radius
  );
}

function colorToNumber(color: string): THREE.Color {
  return new THREE.Color(color);
}

function getClusterColor(
  cluster: MemoryCluster | undefined,
  index: number
): string {
  return cluster?.color ??
    FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function getImportance(memory: MemoryNode): number {
  return Math.max(
    0.1,
    Math.min(
      1,
      memory.importance ??
        memory.relevance ??
        0.5
    )
  );
}

// --------------------------------------------------
// Internal view model
// --------------------------------------------------

interface PositionedMemory extends MemoryNode {
  position: THREE.Vector3;
  color: string;
  size: number;
  index: number;
}

// --------------------------------------------------
// Cluster placement
// --------------------------------------------------

function createClusterDirections(
  clusters: MemoryCluster[]
): Map<string, THREE.Vector3> {
  const result = new Map<string, THREE.Vector3>();

  clusters.forEach((cluster, index) => {
    if (cluster.centroid?.length === 3) {
      const direction = new THREE.Vector3(
        cluster.centroid[0],
        cluster.centroid[1],
        cluster.centroid[2]
      ).normalize();

      result.set(cluster.id, direction);
      return;
    }

    const direction = fibonacciPoint(
      index,
      Math.max(clusters.length, 1),
      1
    ).normalize();

    result.set(cluster.id, direction);
  });

  return result;
}

// --------------------------------------------------
// Memory points
// --------------------------------------------------

interface MemoryPointsProps {
  nodes: PositionedMemory[];
  selectedId: string | null;
  exploded: boolean;
  relatedIds: Set<string>;
  onSelect: (memory: MemoryNode) => void;
}

function MemoryPoints({
  nodes,
  selectedId,
  exploded,
  relatedIds,
  onSelect,
}: MemoryPointsProps) {
  const positions = useMemo(() => {
    const array = new Float32Array(nodes.length * 3);

    nodes.forEach((node, index) => {
      let position = node.position.clone();

      if (exploded && selectedId) {
        if (node.id === selectedId) {
          position = new THREE.Vector3(0, 0, 0);
        } else if (relatedIds.has(node.id)) {
          position = position
            .normalize()
            .multiplyScalar(5.5);
        } else {
          position = position
            .normalize()
            .multiplyScalar(4.5);
        }
      }

      array[index * 3] = position.x;
      array[index * 3 + 1] = position.y;
      array[index * 3 + 2] = position.z;
    });

    return array;
  }, [nodes, exploded, selectedId, relatedIds]);

  const colors = useMemo(() => {
    const array = new Float32Array(nodes.length * 3);

    nodes.forEach((node, index) => {
      const color = colorToNumber(node.color);

      array[index * 3] = color.r;
      array[index * 3 + 1] = color.g;
      array[index * 3 + 2] = color.b;
    });

    return array;
  }, [nodes]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();

    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    geo.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    return geo;
  }, [positions, colors]);

  useEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  return (
    <Points
      geometry={geometry}
      onPointerDown={(event) => {
        event.stopPropagation();

        const index = event.index;

        if (
          index !== undefined &&
          nodes[index]
        ) {
          onSelect(nodes[index]);
        }
      }}
    >
      <PointMaterial
        vertexColors
        transparent
        opacity={0.95}
        size={0.08}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

// --------------------------------------------------
// Selected memory
// --------------------------------------------------

interface SelectedMemoryProps {
  node: PositionedMemory;
}

function SelectedMemory({ node }: SelectedMemoryProps) {
  return (
    <group position={[0, 0, 0]}>
      <mesh>
        <sphereGeometry args={[0.20, 24, 24]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={1}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      <Html
        center
        distanceFactor={8}
        style={{
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            background: "#061529",
            border: `1px solid ${node.color}`,
            borderRadius: 8,
            padding: "8px 12px",
            color: "#ffffff",
            fontSize: 13,
            boxShadow: `0 0 24px ${node.color}55`,
          }}
        >
          <strong>{node.title}</strong>
          <div style={{ color: node.color }}>
            {node.clusterName}
          </div>
        </div>
      </Html>
    </group>
  );
}

// --------------------------------------------------
// Semantic links
// --------------------------------------------------

interface SemanticLinksProps {
  nodes: PositionedMemory[];
  links: MemoryLink[];
  proximity: number;
  selectedId: string | null;
  exploded: boolean;
}

function SemanticLinks({
  nodes,
  links,
  proximity,
  selectedId,
  exploded,
}: SemanticLinksProps) {
  const nodeMap = useMemo(() => {
    return new Map(
      nodes.map((node) => [node.id, node])
    );
  }, [nodes]);

  const visibleLinks = useMemo(() => {
    return links.filter((link) => {
      if (link.similarity < proximity) {
        return false;
      }

      if (exploded && selectedId) {
        return (
          link.source === selectedId ||
          link.target === selectedId
        );
      }

      return true;
    });
  }, [links, proximity, selectedId, exploded]);

  return (
    <group>
      {visibleLinks.map((link, index) => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);

        if (!source || !target) {
          return null;
        }

        const opacity = Math.max(
          0.04,
          (link.similarity - proximity + 0.1) * 0.5
        );

        return (
          <Line
            key={`${link.source}-${link.target}-${index}`}
            points={[
              source.position,
              target.position,
            ]}
            color="#4EA8FF"
            transparent
            opacity={opacity}
            lineWidth={0.5}
          />
        );
      })}
    </group>
  );
}

// --------------------------------------------------
// Sphere scene
// --------------------------------------------------

interface SphereSceneProps {
  nodes: PositionedMemory[];
  links: MemoryLink[];
  proximity: number;
  selectedId: string | null;
  exploded: boolean;
  enableAutoRotate: boolean;
  onSelect: (memory: MemoryNode) => void;
}

function SphereScene({
  nodes,
  links,
  proximity,
  selectedId,
  exploded,
  enableAutoRotate,
  onSelect,
}: SphereSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  const relatedIds = useMemo(() => {
    const ids = new Set<string>();

    if (!selectedId) {
      return ids;
    }

    links.forEach((link) => {
      if (
        link.similarity >= proximity &&
        link.source === selectedId
      ) {
        ids.add(link.target);
      }

      if (
        link.similarity >= proximity &&
        link.target === selectedId
      ) {
        ids.add(link.source);
      }
    });

    return ids;
  }, [links, proximity, selectedId]);

  useFrame((_, delta) => {
    if (
      enableAutoRotate &&
      groupRef.current
    ) {
      groupRef.current.rotation.y += delta * 0.08;
    }
  });

  const selectedNode = nodes.find(
    (node) => node.id === selectedId
  );

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[4.02, 32, 32]} />
        <meshBasicMaterial
          color="#12365D"
          wireframe
          transparent
          opacity={0.08}
        />
      </mesh>

      <mesh>
        <sphereGeometry args={[4.08, 32, 32]} />
        <meshBasicMaterial
          color="#0B203C"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      <SemanticLinks
        nodes={nodes}
        links={links}
        proximity={proximity}
        selectedId={selectedId}
        exploded={exploded}
      />

      <MemoryPoints
        nodes={nodes}
        selectedId={selectedId}
        exploded={exploded}
        relatedIds={relatedIds}
        onSelect={onSelect}
      />

      {selectedNode && exploded && (
        <SelectedMemory node={selectedNode} />
      )}
    </group>
  );
}

// --------------------------------------------------
// Main component
// --------------------------------------------------

export default function ImageSphere({
  memories,
  clusters,
  links = [],
  proximity = 0.9,
  selectedMemoryId = null,
  onMemorySelect,
  onClusterSelect,
  onSearch,
  maxVisibleNodes = 2000,
  enableAutoRotate = true,
  className,
}: ImageSphereProps) {
  const [internalSelectedId, setInternalSelectedId] =
    useState<string | null>(selectedMemoryId);

  const [search, setSearch] = useState("");
  const [threshold, setThreshold] =
    useState(proximity);

  const [mode, setMode] = useState<
    "sphere" | "cluster" | "exploded"
  >("sphere");

  const [autoRotate, setAutoRotate] =
    useState(enableAutoRotate);

  useEffect(() => {
    setInternalSelectedId(selectedMemoryId);
  }, [selectedMemoryId]);

  const selectedId =
    selectedMemoryId ?? internalSelectedId;

  const clusterMap = useMemo(() => {
    return new Map(
      clusters.map((cluster) => [cluster.id, cluster])
    );
  }, [clusters]);

  const clusterDirections = useMemo(
    () => createClusterDirections(clusters),
    [clusters]
  );

  const filteredMemories = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = query
      ? memories.filter((memory) => {
          const haystack = [
            memory.title,
            memory.content ?? "",
            memory.clusterName,
            memory.category ?? "",
            ...(memory.tags ?? []),
          ]
            .join(" ")
            .toLowerCase();

          return haystack.includes(query);
        })
      : memories;

    return filtered.slice(0, maxVisibleNodes);
  }, [memories, search, maxVisibleNodes]);

  const positionedNodes = useMemo(() => {
    const result: PositionedMemory[] = [];

    const clusterCounters = new Map<string, number>();

    filteredMemories.forEach((memory, index) => {
      const cluster = clusterMap.get(memory.clusterId);

      const clusterIndex = clusters.findIndex(
        (item) => item.id === memory.clusterId
      );

      const color = getClusterColor(
        cluster,
        clusterIndex < 0 ? 0 : clusterIndex
      );

      const direction =
        clusterDirections.get(memory.clusterId) ??
        new THREE.Vector3(0, 1, 0);

      const countInCluster =
        filteredMemories.filter(
          (item) => item.clusterId === memory.clusterId
        ).length;

      const localIndex =
        clusterCounters.get(memory.clusterId) ?? 0;

      clusterCounters.set(
        memory.clusterId,
        localIndex + 1
      );

      const base = fibonacciPoint(
        index,
        filteredMemories.length,
        DEFAULT_RADIUS
      );

      let position = base;

      if (mode === "cluster") {
        const local = fibonacciPoint(
          localIndex,
          Math.max(countInCluster, 1),
          0.9
        );

        const quaternion =
          new THREE.Quaternion().setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction
          );

        position = local
          .applyQuaternion(quaternion)
          .add(direction.clone().multiplyScalar(3.0));
      }

      result.push({
        ...memory,
        position,
        color,
        size: 0.04 + getImportance(memory) * 0.12,
        index,
      });
    });

    return result;
  }, [
    filteredMemories,
    clusterMap,
    clusters,
    clusterDirections,
    mode,
  ]);

  const handleSelect = useCallback(
    (memory: MemoryNode) => {
      setInternalSelectedId(memory.id);

      onMemorySelect?.(memory);

      if (mode !== "exploded") {
        setMode("exploded");
      }
    },
    [mode, onMemorySelect]
  );

  const handleClear = useCallback(() => {
    setInternalSelectedId(null);
    setMode("sphere");
    onMemorySelect?.(null);
  }, [onMemorySelect]);

  const selectedMemory = memories.find(
    (memory) => memory.id === selectedId
  );

  const selectedCluster = selectedMemory
    ? clusterMap.get(selectedMemory.clusterId)
    : undefined;

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 560,
        position: "relative",
        background: "#020B18",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            flex: "1 1 220px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#0A1B30",
            border: "1px solid #1B3857",
            borderRadius: 10,
            padding: "10px 12px",
          }}
        >
          <span style={{ color: "#83B9FF" }}>
            ⌕
          </span>

          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              onSearch?.(event.target.value);
            }}
            placeholder="Cerca nella memoria..."
            style={{
              width: "100%",
              background: "transparent",
              border: 0,
              outline: 0,
              color: "#FFFFFF",
              fontSize: 14,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 10,
            background: "#0A1B30",
            border: "1px solid #1B3857",
          }}
        >
          {(["sphere", "cluster", "exploded"] as const).map(
            (item) => (
              <button
                key={item}
                onClick={() => setMode(item)}
                style={{
                  border: 0,
                  borderRadius: 7,
                  padding: "8px 12px",
                  background:
                    mode === item
                      ? "#1677FF"
                      : "transparent",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                {item === "sphere"
                  ? "Sfera"
                  : item === "cluster"
                  ? "Cluster"
                  : "Esplosa"}
              </button>
            )
          )}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 88,
          left: 16,
          zIndex: 10,
          background: "#0A1B30",
          border: "1px solid #1B3857",
          borderRadius: 10,
          padding: 12,
          width: 210,
        }}
      >
        <div
          style={{
            color: "#FFFFFF",
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          Prossimità semantica
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={threshold}
          onChange={(event) =>
            setThreshold(Number(event.target.value))
          }
          style={{ width: "100%" }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#91A7C0",
            fontSize: 12,
          }}
        >
          <span>0.0</span>
          <strong style={{ color: "#A3FF3F" }}>
            {threshold.toFixed(2)}
          </strong>
          <span>1.0</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 88,
          right: 16,
          zIndex: 10,
          display: "flex",
          gap: 8,
        }}
      >
        <button
          onClick={() => setAutoRotate((value) => !value)}
          style={{
            background: "#0A1B30",
            border: "1px solid #1B3857",
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {autoRotate ? "⏸ Auto" : "▶ Auto"}
        </button>

        <button
          onClick={handleClear}
          style={{
            background: "#0A1B30",
            border: "1px solid #1B3857",
            color: "#FFFFFF",
            borderRadius: 8,
            padding: "8px 10px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          Reset
        </button>
      </div>

      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
        }}
        onPointerMissed={handleClear}
      >
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 10]}
          fov={45}
        />

        <ambientLight intensity={0.25} />

        <SphereScene
          nodes={positionedNodes}
          links={links}
          proximity={threshold}
          selectedId={selectedId}
          exploded={mode === "exploded"}
          enableAutoRotate={autoRotate}
          onSelect={handleSelect}
        />

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={5}
          maxDistance={18}
          rotateSpeed={0.65}
          zoomSpeed={0.7}
          dampingFactor={0.08}
          enableDamping
        />
      </Canvas>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          zIndex: 10,
          color: "#8DA8C4",
          fontSize: 12,
          pointerEvents: "none",
        }}
      >
        <span>
          🖱 Trascina per ruotare · Scroll per zoom
        </span>

        <span>
          {filteredMemories.length.toLocaleString()} punti
        </span>
      </div>

      {selectedMemory && mode === "exploded" && (
        <div
          style={{
            position: "absolute",
            bottom: 52,
            right: 16,
            width: 260,
            maxWidth: "calc(100% - 32px)",
            background: "#081A2D",
            border: `1px solid ${
              selectedCluster?.color ?? "#1B3857"
            }`,
            borderRadius: 12,
            padding: 16,
            color: "#FFFFFF",
            zIndex: 10,
          }}
        >
          <div
            style={{
              color: selectedCluster?.color ?? "#A3FF3F",
              fontSize: 11,
              marginBottom: 6,
            }}
          >
            {selectedMemory.clusterName}
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            {selectedMemory.title}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#9DB3CB",
              lineHeight: 1.5,
              maxHeight: 90,
              overflow: "hidden",
            }}
          >
            {selectedMemory.content}
          </div>

          <button
            onClick={() => {
              if (selectedCluster) {
                onClusterSelect?.(selectedCluster);
              }
            }}
            style={{
              marginTop: 12,
              background: "#1677FF",
              border: 0,
              borderRadius: 8,
              color: "#FFFFFF",
              padding: "9px 12px",
              cursor: "pointer",
              width: "100%",
              fontSize: 12,
            }}
          >
            Esplora cluster
          </button>
        </div>
      )}
    </div>
  );
}
```

------------------------------------------------------------------------

# 15. Integrazione nella dashboard

``` tsx
import ImageSphere from "./components/ImageSphere";

export default function MemoryDashboard() {
  return (
    <div style={{ height: "calc(100vh - 80px)" }}>
      <ImageSphere
        memories={memories}
        clusters={clusters}
        links={links}
        proximity={0.9}
        onMemorySelect={(memory) => {
          console.log("Memoria selezionata:", memory);
        }}
        onClusterSelect={(cluster) => {
          console.log("Cluster:", cluster);
        }}
        onSearch={(query) => {
          console.log("Ricerca:", query);
        }}
      />
    </div>
  );
}
```

------------------------------------------------------------------------

# 16. Dataset demo

``` ts
const clusters = [
  {
    id: "tennis",
    name: "Tennis",
    color: "#A3FF3F",
    count: 142,
  },
  {
    id: "marketing",
    name: "Marketing",
    color: "#A855F7",
    count: 96,
  },
  {
    id: "progetti",
    name: "Progetti",
    color: "#2196FF",
    count: 118,
  },
  {
    id: "lavoro",
    name: "Lavoro",
    color: "#FFAA32",
    count: 134,
  },
];
```

``` ts
const memories = [
  {
    id: "memory-001",
    title: "ClayFly Tennis Drone",
    content: "Progetto di navigazione immersiva...",
    clusterId: "tennis",
    clusterName: "Tennis",
    relevance: 0.96,
    tags: ["tennis", "drone", "react"],
  },
  {
    id: "memory-002",
    title: "Strategia Marketing Tennis",
    content: "Piano marketing per il progetto...",
    clusterId: "marketing",
    clusterName: "Marketing",
    relevance: 0.87,
    tags: ["marketing", "sport"],
  },
];
```

------------------------------------------------------------------------

# 17. Contratto API consigliato

Il backend .NET dovrebbe restituire almeno:

``` json
{
  "memories": [
    {
      "id": "memory-001",
      "title": "ClayFly Tennis Drone",
      "clusterId": "tennis",
      "clusterName": "Tennis",
      "relevance": 0.96
    }
  ],
  "clusters": [
    {
      "id": "tennis",
      "name": "Tennis",
      "color": "#A3FF3F",
      "count": 142
    }
  ],
  "links": [
    {
      "source": "memory-001",
      "target": "memory-002",
      "similarity": 0.92
    }
  ]
}
```

------------------------------------------------------------------------

# 18. Flusso di ricerca semantica

``` mermaid
flowchart TD
    A["Utente cerca: tennis marketing progetto"] --> B["React Dashboard"]
    B --> C[".NET API /api/memories/search"]
    C --> D["Embedding della query"]
    D --> E["Vector DB similarity search"]
    E --> F["Recupero memorie e cluster"]
    F --> G["Calcolo o recupero MemoryLinks"]
    G --> H["ImageSphere aggiornata"]
    H --> I["Click su memoria"]
    I --> J["Dettaglio + memorie vicine"]
```

------------------------------------------------------------------------

# 19. Miglioramenti consigliati per la versione enterprise

## Posizione semantica dei cluster

La distribuzione Fibonacci garantisce una buona distribuzione sulla
sfera, ma non garantisce che i cluster rappresentino realmente la
struttura degli embedding.

Per una visualizzazione semanticamente più accurata:

1.  Calcolare gli embedding nel backend.
2.  Calcolare i centroidi dei cluster.
3.  Ridurre gli embedding in 3D con UMAP o algoritmo equivalente.
4.  Normalizzare le coordinate sulla sfera.
5.  Usare le coordinate come posizione dei nodi.

In questo modo, memorie semanticamente vicine saranno anche vicine
visivamente.

## Esplosione del punto

La versione enterprise dovrebbe:

-   Mantenere i punti non correlati sullo sfondo.
-   Evidenziare solo i vicini sopra la soglia.
-   Disegnare linee con intensità proporzionale alla similarità.
-   Visualizzare un pannello laterale ordinato per similarità.
-   Mostrare eventuali percorsi semantici tra più memorie.
-   Permettere il ritorno alla vista globale.

## Soglia e Top-K

È consigliabile supportare entrambe le modalità:

  Modalità            Comportamento
  ------------------- -----------------------------------------
  Soglia similarità   Mostra i link con `similarity >= 0.9`
  Top-K vicini        Mostra i 10, 20 o 50 vicini più simili
  Cluster             Mostra tutte le memorie di un cluster
  Esplosione          Mostra il nodo e i suoi vicini filtrati

La modalità Top-K è importante perché una soglia fissa può restituire
troppe memorie oppure nessuna, in base alla distribuzione degli
embedding.

------------------------------------------------------------------------

# 20. Note tecniche

Il codice utilizza `Points` e `BufferGeometry` per ridurre il costo di
rendering rispetto alla creazione di un mesh per ogni memoria.

Per un uso enterprise con migliaia o decine di migliaia di punti è
consigliato:

-   Usare `InstancedMesh` o shader custom.
-   Limitare i collegamenti.
-   Usare un sistema di picking dedicato.
-   Calcolare UMAP e similarità nel backend.
-   Restituire soltanto i nodi rilevanti.
-   Separare il rendering dai pannelli HTML.
-   Implementare un sistema di caricamento progressivo.
-   Aggiungere test di performance.
-   Gestire WebGL fallback e dispositivi mobili.

## Distinzione fondamentale

La sfera è una rappresentazione visuale dei dati. La similarità
semantica deve provenire dagli embedding o dai link calcolati dal Vector
DB.

La posizione geometrica non deve essere considerata automaticamente come
una misura di similarità.

------------------------------------------------------------------------

# 21. Roadmap suggerita

### V1 --- Prototipo

-   Sfera 3D.
-   Punti colorati per cluster.
-   Rotazione e zoom.
-   Selezione memoria.
-   Slider prossimità.
-   Ricerca locale.

### V2 --- Collegamento al backend

-   API .NET.
-   Vector DB.
-   Ricerca semantica.
-   Link reali tra memorie.
-   Pannello dettagli.
-   Cluster dinamici.

### V3 --- Visualizzazione semantica avanzata

-   UMAP 3D.
-   Centroidi reali.
-   Top-K vicini.
-   Animazione di esplosione.
-   Selezione multipla.
-   Percorsi semantici.
-   Filtri per ambito, tag, data e tipo di contenuto.

### V4 --- Enterprise

-   Web Worker.
-   Rendering ottimizzato.
-   Paginazione e streaming.
-   Caching.
-   Telemetria.
-   Accessibilità.
-   WebGL fallback.
-   Test automatici.
-   Controllo autorizzazioni per memoria e cluster.

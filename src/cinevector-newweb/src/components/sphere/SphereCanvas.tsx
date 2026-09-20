import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { useSelection } from "../../state/SelectionContext";
import { registerOrbitControls } from "../../lib/orbitControlsRegistry";
import { SphereScene } from "./SphereScene";

export function SphereCanvas() {
  const { autoRotate, select } = useSelection();
  // La libreria drei tipizza il ref dei controlli in modo verboso e version-specific: `any` locale qui
  // evita di importare un tipo interno di three-stdlib solo per un .reset()/.update() chiamati via registry.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    return () => registerOrbitControls(null);
  }, []);

  return (
    <div id="canvas-container" className="relative h-full w-full" data-purpose="threejs-canvas">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        raycaster={{ params: { Points: { threshold: 0.06 }, Line: { threshold: 0.02 } } } as never}
        onPointerMissed={() => select(null)}
      >
        <color attach="background" args={["#03050a"]} />
        <ambientLight intensity={0.6} />
        <Suspense fallback={null}>
          <SphereScene />
        </Suspense>
        <OrbitControls
          ref={(instance) => {
            controlsRef.current = instance;
            registerOrbitControls(instance);
          }}
          enablePan={false}
          enableZoom
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
          enableDamping
          dampingFactor={0.08}
          minDistance={2.4}
          maxDistance={9}
        />
      </Canvas>
    </div>
  );
}

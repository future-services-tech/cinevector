import { Pause, Play, RotateCcw } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getCameraCoords, subscribeCameraCoords } from "../../lib/cameraCoordsStore";
import { resetOrbitControls } from "../../lib/orbitControlsRegistry";
import { useSelection, type ViewMode } from "../../state/SelectionContext";

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: "cluster", label: "Cluster" },
  { id: "network", label: "Rete" },
  { id: "sphere", label: "Sfera" },
];

export function SphereControlsBar() {
  const coords = useSyncExternalStore(subscribeCameraCoords, getCameraCoords);
  const { viewMode, setViewMode, autoRotate, toggleAutoRotate } = useSelection();

  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 flex flex-wrap items-center justify-between gap-3">
      <div className="glass-card pointer-events-auto flex items-center gap-4 rounded-lg px-3.5 py-2">
        <div>
          <div className="text-[10px] font-bold text-white">Cinesphere Semantica 3D</div>
          <div className="text-[10px] text-slate-500">Proiezione | Cosine Similarity</div>
        </div>
        <div className="hidden items-center gap-2 font-mono text-[10px] text-slate-400 sm:flex">
          <span>
            X: <span className="text-cyan-300">{coords.x.toFixed(2)}</span>
          </span>
          <span>
            Y: <span className="text-cyan-300">{coords.y.toFixed(2)}</span>
          </span>
          <span>
            Z: <span className="text-cyan-300">{coords.z.toFixed(2)}</span>
          </span>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2">
        <div className="glass-card flex gap-1 rounded-lg p-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                viewMode === mode.id ? "bg-cyan-500 text-slate-950" : "text-slate-300 hover:text-cyan-200"
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <button onClick={resetOrbitControls} title="Reset camera" className="glass-card rounded-lg p-2 text-slate-300 hover:text-cyan-200">
          <RotateCcw size={15} />
        </button>
        <button onClick={toggleAutoRotate} title="Pausa/riprendi rotazione" className={`glass-card rounded-lg p-2 ${autoRotate ? "text-cyan-300" : "text-slate-400"}`}>
          {autoRotate ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>
    </div>
  );
}

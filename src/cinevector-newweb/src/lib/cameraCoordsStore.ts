/** Piccolo store esterno (no context, no libreria) per portare le coordinate XYZ della camera dal Canvas
 * r3f alla barra controlli 2D sovrapposta, che vive fuori dall'albero del Canvas. */
export interface CameraCoords {
  x: number;
  y: number;
  z: number;
}

let current: CameraCoords = { x: 0, y: 0, z: 1 };
const listeners = new Set<() => void>();

export function setCameraCoords(next: CameraCoords) {
  current = next;
  listeners.forEach((listener) => listener());
}

export function subscribeCameraCoords(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCameraCoords(): CameraCoords {
  return current;
}

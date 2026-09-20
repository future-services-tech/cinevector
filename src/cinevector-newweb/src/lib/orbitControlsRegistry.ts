/** Riferimento condiviso ai controlli orbitali, per poterli richiamare (reset camera) dalla barra 2D
 * fuori dal Canvas senza dover far passare un ref attraverso il confine React/r3f. */
interface ResettableControls {
  reset: () => void;
}

let instance: ResettableControls | null = null;

export function registerOrbitControls(controls: ResettableControls | null) {
  instance = controls;
}

export function resetOrbitControls() {
  instance?.reset();
}

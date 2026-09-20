import { useEffect, useRef } from "react";

/** Hook classico "Dan Abramov useInterval": esegue callback ogni delayMs finché delay non è null,
 * usato dai player trailer/soundtrack per far avanzare stato reale (progress bar, visualizzatore). */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}

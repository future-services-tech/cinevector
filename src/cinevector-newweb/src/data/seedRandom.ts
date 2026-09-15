/** PRNG deterministico (mulberry32): con lo stesso seed produce sempre la stessa sequenza.
 * Fondamentale per il generatore di dati mock — nessun Math.random() qui, altrimenti i film,
 * le loro posizioni e i collegamenti cambierebbero a ogni reload e romperebbero i deep-link /movie/:id. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = () => number;

export function randFloat(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

export function randInt(rng: Rng, min: number, max: number): number {
  return Math.floor(randFloat(rng, min, max + 1));
}

export function pick<T>(rng: Rng, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function pickN<T>(rng: Rng, arr: readonly T[], n: number): T[] {
  const pool = [...arr];
  const result: T[] = [];
  const count = Math.min(n, pool.length);
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result;
}

/** Distribuzione gaussiana approssimata (somma di 3 uniformi) per rating più plausibili
 * (concentrati intorno alla media) invece di una distribuzione piatta 0-10. */
export function randGaussian(rng: Rng, mean: number, spread: number): number {
  const sum = rng() + rng() + rng();
  return mean + (sum / 3 - 0.5) * 2 * spread;
}

/** Hash deterministico di una stringa -> intero a 32 bit, usato per derivare un seed
 * per-film (es. il dettaglio on-demand di un film non-hero resta sempre lo stesso). */
export function hashStringToSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

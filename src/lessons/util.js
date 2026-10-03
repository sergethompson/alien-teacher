import { isCorner } from '../board.js';

export const randInt = (rng, lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export function shuffle(rng, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const sample = (rng, arr, n) => shuffle(rng, arr).slice(0, n);

// All cells in a rectangle (inclusive), never the corner status lights.
export function cellsIn(x0, x1, y0, y1) {
  const cells = [];
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) if (!isCorner(x, y)) cells.push([x, y]);
  }
  return cells;
}

export const same = (a, b) => a[0] === b[0] && a[1] === b[1];
export const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0);

// The whole toy, as the alien sees it: 100 dots that can glow, and presses coming back.
// No DOM here, so the same lessons can run in tests or be ported to hardware.

export const SIZE = 10;

// The four corners are the alien's "antennae": status lights, never lesson content.
export const CORNERS = [
  [0, 0],
  [SIZE - 1, 0],
  [SIZE - 1, SIZE - 1],
  [0, SIZE - 1],
];

export const isCorner = (x, y) => (x === 0 || x === SIZE - 1) && (y === 0 || y === SIZE - 1);
export const inBounds = (x, y) => x >= 0 && y >= 0 && x < SIZE && y < SIZE;
export const idx = (x, y) => y * SIZE + x;

export class Board {
  constructor({ speed = 1 } = {}) {
    this.speed = speed;
    // Lesson content.
    this.base = new Array(SIZE * SIZE).fill(null);
    // Short-lived effects (ripples, hints, status lights) drawn on top of the content.
    this.overlay = new Map();
    this.changeListeners = new Set();
    this.pressListeners = new Set();
    // Cells the child is expected to press right now (for hints, tests and debugging).
    this.expect = [];
  }

  set(x, y, color, level = 1) {
    if (!inBounds(x, y)) return;
    this.base[idx(x, y)] = color ? { color, level } : null;
    this._changed();
  }

  off(x, y) {
    this.set(x, y, null);
  }

  get(x, y) {
    return inBounds(x, y) ? this.base[idx(x, y)] : null;
  }

  clear() {
    this.base.fill(null);
    this._changed();
  }

  setOverlay(x, y, color, level = 1) {
    if (!inBounds(x, y)) return;
    this.overlay.set(idx(x, y), { color, level });
    this._changed();
  }

  clearOverlay(x, y) {
    if (this.overlay.delete(idx(x, y))) this._changed();
  }

  clearOverlays() {
    this.overlay.clear();
    this._changed();
  }

  // What the dot at (x, y) actually shows.
  view(x, y) {
    const i = idx(x, y);
    return this.overlay.get(i) ?? this.base[i];
  }

  onChange(fn) {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }

  _changed() {
    for (const fn of this.changeListeners) fn();
  }

  onPress(fn) {
    this.pressListeners.add(fn);
    return () => this.pressListeners.delete(fn);
  }

  // Input from the renderer (or hardware, or a test).
  press(x, y) {
    if (!inBounds(x, y)) return;
    for (const fn of [...this.pressListeners]) fn(x, y);
  }

  // Resolves with the next press, or null after `timeout` ms.
  nextPress({ timeout = Infinity, ignoreCorners = true } = {}) {
    return new Promise((resolve) => {
      let timer;
      const unsub = this.onPress((x, y) => {
        if (ignoreCorners && isCorner(x, y)) return;
        unsub();
        clearTimeout(timer);
        resolve({ x, y });
      });
      if (Number.isFinite(timeout)) {
        timer = setTimeout(() => {
          unsub();
          resolve(null);
        }, timeout / this.speed);
      }
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms / this.speed));
  }
}

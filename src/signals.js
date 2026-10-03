// The alien's vocabulary. Every lesson speaks only through these signals, so the child
// learns one small, consistent "language" of light.
import { CORNERS, SIZE, isCorner } from './board.js';
import { C, PALETTE } from './colors.js';

// Thrown when the child is mashing buttons; the teacher switches to calm free play.
export class Frustrated extends Error {}

const allCells = () => {
  const cells = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) cells.push([x, y]);
  return cells;
};

export function statusOff(board) {
  for (const [x, y] of CORNERS) board.clearOverlay(x, y);
}

// "Watch me": the antennae light blue one by one, then stay dim blue while the alien demonstrates.
export async function watchMe(board) {
  for (const [x, y] of CORNERS) {
    board.setOverlay(x, y, C.blue, 1);
    await board.sleep(110);
  }
  await board.sleep(250);
  for (const [x, y] of CORNERS) board.setOverlay(x, y, C.blue, 0.35);
}

// "Your turn": the antennae breathe soft white until stopped.
export function yourTurn(board) {
  let t = 0;
  const tick = () => {
    const level = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t));
    for (const [x, y] of CORNERS) board.setOverlay(x, y, C.white, level);
    t += 0.3;
  };
  tick();
  const id = setInterval(tick, 80);
  return () => {
    clearInterval(id);
    statusOff(board);
  };
}

// "Yes!": a green ripple spreading from the pressed dot.
export async function yes(board, x, y) {
  let ring = [];
  for (let r = 0; r <= 3; r++) {
    for (const [cx, cy] of ring) board.clearOverlay(cx, cy);
    ring = allCells().filter(
      ([cx, cy]) => !isCorner(cx, cy) && Math.round(Math.hypot(cx - x, cy - y)) === r,
    );
    for (const [cx, cy] of ring) board.setOverlay(cx, cy, C.green, 1 - r * 0.22);
    await board.sleep(75);
  }
  for (const [cx, cy] of ring) board.clearOverlay(cx, cy);
}

// "Not quite": the pressed dot dims amber twice. Never red, never harsh.
export async function notQuite(board, x, y) {
  for (const level of [0.6, 0.2, 0.6]) {
    board.setOverlay(x, y, C.amber, level);
    await board.sleep(170);
  }
  board.clearOverlay(x, y);
}

// A quick flash of one dot, used as a light "yes" inside sequences.
export async function flash(board, x, y, color = C.white, ms = 280) {
  board.setOverlay(x, y, color, 1);
  await board.sleep(ms);
  board.clearOverlay(x, y);
}

// A dot pops: white flash, then the lesson turns it off.
export async function pop(board, x, y) {
  await flash(board, x, y, C.white, 110);
}

// Hint: the right dots shimmer. `strength` (0..1) grows the longer the child needs help.
export function startHint(board, cells, strength = 0.4) {
  let t = 0;
  const targets = cells.filter(([x, y]) => !isCorner(x, y));
  const tick = () => {
    const k = 0.5 + 0.5 * Math.sin(t);
    t += 0.45;
    for (const [x, y] of targets) {
      const v = board.get(x, y);
      const hi = v ? 1 : strength;
      board.setOverlay(x, y, v?.color ?? C.white, 0.08 + (hi - 0.08) * k);
    }
  };
  tick();
  const id = setInterval(tick, 70);
  return {
    stop() {
      clearInterval(id);
      for (const [x, y] of targets) board.clearOverlay(x, y);
    },
  };
}

// "Done!": fireworks over the whole board.
export async function celebrate(board, rng = Math.random) {
  for (let burst = 0; burst < 3; burst++) {
    const cx = 2 + Math.floor(rng() * 6);
    const cy = 2 + Math.floor(rng() * 6);
    const color = PALETTE[Math.floor(rng() * PALETTE.length)];
    for (let r = 0; r <= 3; r++) {
      board.clearOverlays();
      for (const [x, y] of allCells()) {
        if (Math.round(Math.hypot(x - cx, y - cy)) === r) board.setOverlay(x, y, color, 1 - r * 0.2);
      }
      await board.sleep(70);
    }
    board.clearOverlays();
    await board.sleep(60);
  }
}

// The alien's face, shown between lessons. Moods: happy, curious, kind, calm, sleepy.
const FACES = {
  happy: {
    eyes: [[2, 2], [3, 2], [2, 3], [3, 3], [6, 2], [7, 2], [6, 3], [7, 3]],
    mouth: [[2, 6], [7, 6], [3, 7], [4, 7], [5, 7], [6, 7]],
  },
  curious: {
    eyes: [[2, 2], [3, 2], [2, 3], [3, 3], [6, 1], [7, 1], [6, 2], [7, 2], [6, 3], [7, 3]],
    mouth: [[4, 6], [5, 6], [4, 7], [5, 7]],
  },
  kind: {
    eyes: [[2, 3], [3, 2], [6, 2], [7, 3]],
    mouth: [[3, 6], [6, 6], [4, 7], [5, 7]],
  },
  calm: {
    eyes: [[2, 3], [3, 3], [6, 3], [7, 3]],
    mouth: [[3, 6], [6, 6], [4, 7], [5, 7]],
  },
  sleepy: {
    eyes: [[2, 3], [3, 3], [6, 3], [7, 3]],
    mouth: [[4, 7], [5, 7]],
  },
};

export function face(board, mood = 'happy') {
  const f = FACES[mood] ?? FACES.happy;
  const color = mood === 'calm' || mood === 'sleepy' ? C.calm : C.alien;
  board.clear();
  for (const [x, y] of f.eyes) board.set(x, y, color, mood === 'sleepy' ? 0.35 : 1);
  for (const [x, y] of f.mouth) board.set(x, y, color, mood === 'sleepy' ? 0.3 : 0.8);
}

export async function blink(board, mood = 'happy') {
  const f = FACES[mood] ?? FACES.happy;
  const saved = f.eyes.map(([x, y]) => [x, y, board.get(x, y)]);
  for (const [x, y] of f.eyes) board.off(x, y);
  await board.sleep(140);
  for (const [x, y, v] of saved) board.set(x, y, v?.color, v?.level);
}

// How well an answer went, from 1 (first try, no help) down to 0.
export function quality({ wrong, hinted }) {
  if (wrong === 0) return hinted ? 0.6 : 1;
  if (wrong === 1) return 0.4;
  return 0;
}

// Wait for the child to press a right dot.
//  check(x, y) → true (right), false (wrong), or null (ignore this press).
//  hint() → the dots to shimmer when the child needs help.
// Errorless: hints grow with hesitation and mistakes, and the turn always ends on a right press.
export async function awaitAnswer(board, { check, hint = () => [], hintDelay = 5000, onCorrect } = {}) {
  let wrong = 0;
  let hintLevel = 0;
  let hinter = null;
  const presses = [];
  const unsubMash = board.onPress(() => presses.push(Date.now()));
  const stopTurn = yourTurn(board);
  const showHint = () => {
    hinter?.stop();
    hinter = startHint(board, hint(), [0, 0.35, 0.6, 1][hintLevel]);
  };

  try {
    for (;;) {
      board.expect = hint();
      const p = await board.nextPress({ timeout: hintDelay });
      if (!p) {
        hintLevel = Math.min(hintLevel + 1, 3);
        showHint();
        continue;
      }
      const result = check(p.x, p.y);
      if (result === null || result === undefined) continue;
      if (result) {
        hinter?.stop();
        hinter = null;
        stopTurn();
        board.expect = [];
        if (onCorrect) await onCorrect(p.x, p.y);
        else await yes(board, p.x, p.y);
        return { ...p, wrong, hinted: hintLevel > 0 };
      }
      wrong++;
      const now = Date.now();
      if (presses.filter((t) => now - t < 2500).length >= 6) throw new Frustrated();
      await notQuite(board, p.x, p.y);
      hintLevel = Math.max(hintLevel, wrong >= 2 ? 3 : 1);
      showHint();
    }
  } finally {
    hinter?.stop();
    stopTurn();
    unsubMash();
    board.expect = [];
  }
}

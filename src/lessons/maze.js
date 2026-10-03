// Maze: walk the white dot to the green goal by pressing the dot next to it.
import { SIZE, idx, inBounds, isCorner } from '../board.js';
import { C } from '../colors.js';
import { awaitAnswer, flash, statusOff, watchMe, yes } from '../signals.js';
import { cellsIn, pick, randInt, same } from './util.js';

const LEVELS = [
  null,
  { walls: 0, sameRow: true },
  { walls: 0, min: 4, max: 6 },
  { walls: 0.15, min: 5, max: 8 },
  { walls: 0.25, min: 7, max: 11 },
  { walls: 0.32, min: 9, max: 16 },
];

const STEPS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const open = (walls, x, y) => inBounds(x, y) && !isCorner(x, y) && !walls.has(idx(x, y));

// Shortest path from start to goal (excluding start), or null if unreachable.
export function bfs(walls, start, goal) {
  const prev = new Map([[idx(...start), null]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (same(cur, goal)) {
      const path = [];
      for (let c = cur; !same(c, start); c = prev.get(idx(...c))) path.unshift(c);
      return path;
    }
    for (const [dx, dy] of STEPS) {
      const n = [cur[0] + dx, cur[1] + dy];
      if (open(walls, ...n) && !prev.has(idx(...n))) {
        prev.set(idx(...n), cur);
        queue.push(n);
      }
    }
  }
  return null;
}

export function makeMaze(rng, level) {
  const L = LEVELS[level];
  if (L.sameRow) {
    const y = randInt(rng, 2, 7);
    const x = randInt(rng, 1, 5);
    return { walls: new Set(), start: [x, y], goal: [x + 3, y], dist: 3 };
  }
  for (let attempt = 0; attempt < 500; attempt++) {
    const walls = new Set();
    for (const [x, y] of cellsIn(0, SIZE - 1, 0, SIZE - 1)) if (rng() < L.walls) walls.add(idx(x, y));
    const free = cellsIn(0, SIZE - 1, 0, SIZE - 1).filter(([x, y]) => !walls.has(idx(x, y)));
    const start = pick(rng, free);
    const goal = pick(rng, free);
    const path = bfs(walls, start, goal);
    if (path && path.length >= L.min && path.length <= L.max) return { walls, start, goal, dist: path.length };
  }
  return { walls: new Set(), start: [2, 4], goal: [6, 5], dist: 5 };
}

export default {
  id: 'maze',
  name: 'Maze walk',
  skill: 'Directions & planning',
  maxLevel: 5,
  async run({ board, rng }, level) {
    const { walls, start, goal } = makeMaze(rng, level);

    board.clear();
    await watchMe(board);
    for (const i of walls) board.set(i % SIZE, Math.floor(i / SIZE), C.blue, 0.3);
    board.set(goal[0], goal[1], C.green);
    board.set(start[0], start[1], C.white);
    if (level <= 2) {
      // Show which dots count as "next to" the walker.
      const near = STEPS.map(([dx, dy]) => [start[0] + dx, start[1] + dy]).filter((c) => open(walls, ...c));
      for (let i = 0; i < 2; i++) await Promise.all(near.map(([x, y]) => flash(board, x, y, C.white, 250)));
    }
    statusOff(board);

    let pos = start;
    let wrong = 0;
    let hinted = false;
    while (!same(pos, goal)) {
      const path = bfs(walls, pos, goal);
      const r = await awaitAnswer(board, {
        check: (x, y) => {
          if (same([x, y], pos)) return null;
          return Math.abs(x - pos[0]) + Math.abs(y - pos[1]) === 1 && open(walls, x, y);
        },
        hint: () => [path[0]],
        hintDelay: 6000,
        onCorrect: async (x, y) => {
          board.off(pos[0], pos[1]);
          pos = [x, y];
          board.set(x, y, C.white);
          await board.sleep(60);
        },
      });
      wrong += r.wrong;
      hinted ||= r.hinted;
    }
    await yes(board, goal[0], goal[1]);
    return { score: wrong === 0 && !hinted ? 1 : wrong <= 2 ? 0.6 : 0.3 };
  },
};

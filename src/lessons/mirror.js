// Mirror: the alien draws on the left half, the child completes the right half. Symmetry.
import { SIZE } from '../board.js';
import { C, PALETTE } from '../colors.js';
import { awaitAnswer, quality, statusOff, watchMe } from '../signals.js';
import { avg, cellsIn, sample, shuffle } from './util.js';

export const mirrorOf = (x, y) => [SIZE - 1 - x, y];

export function makeMirrorShape(rng, level) {
  const count = Math.min(level, 6);
  // Early levels keep dots close to the fold, so the mirror spot is easy to find.
  const minX = level === 1 ? 3 : level === 2 ? 2 : 1;
  const cells = sample(rng, cellsIn(minX, 4, 1, 8), count);
  const colors = shuffle(rng, PALETTE);
  return cells.map(([x, y], i) => ({ x, y, color: colors[i % colors.length] }));
}

export default {
  id: 'mirror',
  name: 'Mirror',
  skill: 'Symmetry & space',
  maxLevel: 6,
  async run({ board, rng }, level) {
    const shape = makeMirrorShape(rng, level);

    board.clear();
    await watchMe(board);
    if (level === 1) {
      // Show, then do: one worked example of a dot and its reflection.
      const [mx, my] = mirrorOf(3, 4);
      board.set(3, 4, C.cyan);
      await board.sleep(500);
      board.set(mx, my, C.cyan);
      await board.sleep(800);
      board.clear();
      await board.sleep(300);
    }
    for (const { x, y, color } of shape) {
      board.set(x, y, color);
      await board.sleep(250);
    }
    statusOff(board);

    const remaining = shape.map((c) => ({ ...c, target: mirrorOf(c.x, c.y) }));
    const isTarget = (x, y) => remaining.findIndex((c) => c.target[0] === x && c.target[1] === y);
    const scores = [];
    while (remaining.length) {
      const r = await awaitAnswer(board, {
        check: (x, y) => (board.get(x, y) ? null : isTarget(x, y) >= 0),
        hint: () => [remaining[0].target],
      });
      const [done] = remaining.splice(isTarget(r.x, r.y), 1);
      board.set(r.x, r.y, done.color);
      scores.push(quality(r));
    }
    await board.sleep(400);
    return { score: avg(scores) };
  },
};

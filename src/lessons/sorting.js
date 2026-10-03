// Color sorting: the alien shows a color sample, the child finds every dot of that color.
import { DISTINCT, PALETTE } from '../colors.js';
import { awaitAnswer, pop, quality, statusOff, watchMe } from '../signals.js';
import { avg, cellsIn, sample } from './util.js';

export function makeSort(rng, level) {
  const pool = level <= 3 ? DISTINCT : PALETTE; // later levels include near-neighbors like orange/yellow
  const nColors = Math.min(level + 1, 5);
  const colors = sample(rng, pool, nColors);
  const target = colors[0];
  const nTargets = Math.min(2 + level, 7);
  const perOther = Math.min(1 + level, 4);
  const cells = sample(rng, cellsIn(0, 9, 2, 9), nTargets + perOther * (nColors - 1));
  const dots = cells.map(([x, y], i) => ({
    x,
    y,
    color: i < nTargets ? target : colors[1 + Math.floor((i - nTargets) / perOther)],
  }));
  return { target, dots };
}

export default {
  id: 'sorting',
  name: 'Find the color',
  skill: 'Sorting & classifying',
  maxLevel: 6,
  async run({ board, rng }, level) {
    const { target, dots } = makeSort(rng, level);

    board.clear();
    await watchMe(board);
    // The sample sits at the top center and pulses: "this one".
    for (let i = 0; i < 3; i++) {
      board.set(4, 0, target);
      board.set(5, 0, target);
      await board.sleep(220);
      board.set(4, 0, target, 0.3);
      board.set(5, 0, target, 0.3);
      await board.sleep(180);
    }
    board.set(4, 0, target);
    board.set(5, 0, target);
    for (const { x, y, color } of dots) {
      board.set(x, y, color);
      await board.sleep(40);
    }
    statusOff(board);

    const remaining = dots.filter((d) => d.color === target);
    const find = (x, y) => remaining.findIndex((d) => d.x === x && d.y === y);
    const scores = [];
    while (remaining.length) {
      const r = await awaitAnswer(board, {
        // Empty dots and the sample are ignored; only a dot of another color is a miss.
        check: (x, y) => (y === 0 || !board.get(x, y) ? null : find(x, y) >= 0),
        hint: () => [[remaining[0].x, remaining[0].y]],
        hintDelay: 6000,
        onCorrect: (x, y) => pop(board, x, y),
      });
      remaining.splice(find(r.x, r.y), 1);
      board.off(r.x, r.y);
      scores.push(quality(r));
    }
    await board.sleep(300);
    return { score: avg(scores) };
  },
};

// Copy me: the alien lights a sequence, the child repeats it. Memory and attention.
import { PALETTE } from '../colors.js';
import { awaitAnswer, flash, quality, statusOff, watchMe } from '../signals.js';
import { avg, cellsIn, sample, shuffle } from './util.js';

export function makeSequence(rng, len) {
  const cells = sample(rng, cellsIn(1, 8, 1, 8), len);
  const colors = shuffle(rng, PALETTE);
  return cells.map(([x, y], i) => ({ x, y, color: colors[i % colors.length] }));
}

export default {
  id: 'copy',
  name: 'Copy me',
  skill: 'Memory & attention',
  maxLevel: 8,
  async run({ board, rng }, level) {
    const seq = makeSequence(rng, level + 1);
    const showMs = Math.max(350, 750 - level * 50);

    board.clear();
    await watchMe(board);
    for (const step of seq) {
      board.set(step.x, step.y, step.color);
      await board.sleep(showMs);
      board.off(step.x, step.y);
      await board.sleep(180);
    }
    statusOff(board);

    const scores = [];
    for (const step of seq) {
      const r = await awaitAnswer(board, {
        check: (x, y) => x === step.x && y === step.y,
        hint: () => [[step.x, step.y]],
        onCorrect: () => flash(board, step.x, step.y, step.color),
      });
      scores.push(quality(r));
    }
    return { score: avg(scores) };
  },
};

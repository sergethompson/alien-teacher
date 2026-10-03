// Adding and taking away on the number line.
import { C } from '../colors.js';
import { awaitAnswer, quality, statusOff, watchMe } from '../signals.js';
import { LINE_ROW, drawNumberLine } from './counting.js';
import { randInt } from './util.js';

export function makeProblem(rng, level) {
  const op = level === 4 ? '-' : level >= 5 ? (rng() < 0.5 ? '+' : '-') : '+';
  if (op === '+') {
    const max = level === 1 ? 5 : level === 2 ? 7 : 10;
    const sum = randInt(rng, 2, max);
    const a = randInt(rng, 1, sum - 1);
    return { op, a, b: sum - a, answer: sum };
  }
  const a = randInt(rng, 2, 10);
  const b = randInt(rng, 1, a - 1);
  return { op, a, b, answer: a - b };
}

export default {
  id: 'adding',
  name: 'Adding & taking away',
  skill: 'Addition & subtraction',
  maxLevel: 5,
  async run({ board, rng }, level) {
    const { op, a, b, answer } = makeProblem(rng, level);

    board.clear();
    await watchMe(board);
    drawNumberLine(board);
    for (let i = 0; i < a; i++) {
      board.set(i, 2, C.yellow);
      await board.sleep(220);
    }
    await board.sleep(450);

    if (op === '+') {
      // Early levels continue the same row ("count on"); later the two groups sit apart.
      const continued = level <= 2;
      for (let j = 0; j < b; j++) {
        board.set(continued ? a + j : j, continued ? 2 : 4, C.cyan);
        await board.sleep(220);
      }
    } else {
      // Take away: the last b dots fly off the top.
      for (let x = a - 1; x >= a - b; x--) {
        board.set(x, 2, C.yellow, 0.4);
        await board.sleep(150);
        board.off(x, 2);
        board.set(x, 1, C.yellow, 0.25);
        await board.sleep(150);
        board.off(x, 1);
      }
    }
    statusOff(board);

    const r = await awaitAnswer(board, {
      check: (x, y) => (y === LINE_ROW ? x === answer - 1 : null),
      hint: () => [[answer - 1, LINE_ROW]],
    });

    // Replay the answer on the line: yellow for the first group, cyan for what was added.
    const firstPart = op === '+' ? a : answer;
    for (let x = 0; x < answer; x++) {
      board.set(x, LINE_ROW, x < firstPart ? C.yellow : C.cyan);
      await board.sleep(180);
    }
    await board.sleep(600);
    return { score: quality(r) };
  },
};

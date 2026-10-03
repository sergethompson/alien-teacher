// Counting: a cluster of dots appears, the child presses that number on the number line.
import { C, PALETTE } from '../colors.js';
import { awaitAnswer, quality, statusOff, watchMe } from '../signals.js';
import { cellsIn, pick, randInt, sample } from './util.js';

export const LINE_ROW = 7;

// Dice faces on a 3×3 lattice; easy to recognize at a glance (subitizing).
const DICE = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]],
};

const LEVELS = [
  null,
  { max: 3, flash: 0, dice: true },
  { max: 5, flash: 0, dice: true },
  { max: 7, flash: 0 },
  { max: 10, flash: 0 },
  { max: 6, flash: 1500 }, // seen only briefly: recognize without counting one by one
  { max: 10, flash: 2200 },
];

export function makeCount(rng, level) {
  const L = LEVELS[level];
  const n = randInt(rng, 1, L.max);
  let cells;
  if (L.dice && n <= 6) {
    const ox = randInt(rng, 1, 4);
    cells = DICE[n].map(([dx, dy]) => [ox + dx * 2, 1 + dy * 2]);
  } else {
    cells = sample(rng, cellsIn(1, 8, 1, 5), n);
  }
  return { n, cells, flash: L.flash };
}

export function drawNumberLine(board) {
  // Dim dots 1–10; the 5th and 10th glow a little brighter to help count by fives.
  for (let x = 0; x < 10; x++) board.set(x, LINE_ROW, C.white, x === 4 || x === 9 ? 0.28 : 0.13);
}

export default {
  id: 'counting',
  name: 'Counting',
  skill: 'Number sense 1–10',
  maxLevel: 6,
  async run({ board, rng }, level) {
    const { n, cells, flash } = makeCount(rng, level);
    const color = pick(rng, PALETTE);

    board.clear();
    await watchMe(board);
    for (const [x, y] of cells) {
      board.set(x, y, color);
      await board.sleep(120);
    }
    drawNumberLine(board);
    statusOff(board);
    if (flash) {
      await board.sleep(flash);
      for (const [x, y] of cells) board.off(x, y);
    }

    const r = await awaitAnswer(board, {
      // Touching the cluster dots is fine (counting with a finger); only the line is an answer.
      check: (x, y) => (y === LINE_ROW ? x === n - 1 : null),
      hint: () => [[n - 1, LINE_ROW]],
    });

    // One-to-one correspondence: each dot in the cluster pairs with one dot on the line.
    for (const [x, y] of cells) board.set(x, y, color, 0.25);
    for (let i = 0; i < n; i++) {
      board.set(cells[i][0], cells[i][1], color);
      board.set(i, LINE_ROW, color);
      await board.sleep(260);
    }
    await board.sleep(500);
    return { score: quality(r) };
  },
};

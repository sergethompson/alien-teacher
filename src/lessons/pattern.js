// What comes next: a repeating color pattern with a gap; the child picks the missing color.
import { C, DISTINCT, PALETTE } from '../colors.js';
import { awaitAnswer, quality, startHint, statusOff, watchMe, yes } from '../signals.js';
import { pick, sample, shuffle } from './util.js';

export const PATTERN_ROW = 3;
export const CHOICE_ROW = 6;

const TEMPLATES = {
  1: ['AB'],
  2: ['AB', 'AAB', 'ABB'],
  3: ['ABC', 'AABB', 'ABB'],
  4: ['ABC', 'AABC', 'ABCD', 'AABB'],
  5: ['ABCD', 'AABBC', 'ABAC', 'ABBC'],
};
const CHOICE_COUNT = [0, 2, 3, 3, 4, 4];

export function choiceXs(k) {
  const start = Math.floor((10 - (2 * k - 1)) / 2);
  return Array.from({ length: k }, (_, i) => start + i * 2);
}

export function makePattern(rng, level) {
  const tpl = pick(rng, TEMPLATES[level]);
  const letters = [...new Set(tpl)];
  const colors = sample(rng, level <= 2 ? DISTINCT : PALETTE, letters.length + 2);
  const colorOf = Object.fromEntries(letters.map((l, i) => [l, colors[i]]));
  const shownLen = tpl.length <= 3 ? 6 : 7;
  const seq = Array.from({ length: shownLen + 1 }, (_, i) => colorOf[tpl[i % tpl.length]]);
  const answer = seq[shownLen];
  const k = CHOICE_COUNT[level];
  const others = [...letters.map((l) => colorOf[l]).filter((c) => c !== answer), ...colors.slice(letters.length)];
  const choices = shuffle(rng, [answer, ...others.slice(0, k - 1)]);
  return { shown: seq.slice(0, shownLen), answer, choices };
}

export default {
  id: 'pattern',
  name: 'What comes next',
  skill: 'Patterns & prediction',
  maxLevel: 5,
  async run({ board, rng }, level) {
    const { shown, answer, choices } = makePattern(rng, level);
    const xs = choiceXs(choices.length);
    const q = [1 + shown.length, PATTERN_ROW];

    board.clear();
    await watchMe(board);
    for (let i = 0; i < shown.length; i++) {
      board.set(1 + i, PATTERN_ROW, shown[i]);
      await board.sleep(260);
    }
    board.set(q[0], q[1], C.white, 0.2);
    choices.forEach((c, i) => board.set(xs[i], CHOICE_ROW, c));
    statusOff(board);

    // The gap blinks: "something goes here".
    const gap = startHint(board, [q], 0.5);
    let r;
    try {
      r = await awaitAnswer(board, {
        check: (x, y) => {
          const i = y === CHOICE_ROW ? xs.indexOf(x) : -1;
          return i < 0 ? null : choices[i] === answer;
        },
        hint: () => [[xs[choices.indexOf(answer)], CHOICE_ROW]],
        onCorrect: async () => {
          gap.stop();
          board.set(q[0], q[1], answer);
          await yes(board, q[0], q[1]);
        },
      });
    } finally {
      gap.stop();
    }
    await board.sleep(500);
    return { score: quality(r) };
  },
};

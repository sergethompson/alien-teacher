// Play every lesson end to end with a simulated child, on a fast clock.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LESSONS } from '../src/lessons/index.js';
import { Frustrated, awaitAnswer } from '../src/signals.js';
import { fastBoard, seeded, simulateChild } from './helpers.js';

const teaching = LESSONS.filter((l) => !l.isBreak);

for (const lesson of teaching) {
  test(`${lesson.id}: a child who knows the answers finishes every level`, async () => {
    for (let level = 1; level <= lesson.maxLevel; level++) {
      const board = fastBoard();
      const stop = simulateChild(board);
      const { score } = await lesson.run({ board, rng: seeded(level) }, level);
      stop();
      assert.ok(score > 0 && score <= 1, `${lesson.id} L${level} score ${score}`);
      assert.equal(board.overlay.size, 0, 'effects left on the board');
    }
  });
}

test('a wrong press costs points but the turn still ends on the right answer', async () => {
  const board = fastBoard();
  // Press the dot just left/right of the target once, then the target.
  const stop = simulateChild(board, { mistakes: 1, wrongCell: ([x, y]) => [x === 1 ? 2 : 1, y === 0 ? 1 : y] });
  const lesson = LESSONS.find((l) => l.id === 'counting');
  const { score } = await lesson.run({ board, rng: seeded(5) }, 3);
  stop();
  assert.ok(score < 1);
});

test('button-mashing is detected as frustration', async () => {
  const board = fastBoard();
  const turn = awaitAnswer(board, { check: (x, y) => x === 5 && y === 5, hint: () => [[5, 5]] });
  const mash = async () => {
    for (let i = 0; i < 10; i++) {
      board.press(1 + (i % 3), 2);
      await new Promise((r) => setTimeout(r, 1));
    }
  };
  await Promise.all([assert.rejects(turn, Frustrated), mash()]);
});

test('rain free play ends by itself when the child walks away', async () => {
  const board = fastBoard();
  const rain = LESSONS.find((l) => l.isBreak);
  const { score } = await rain.run({ board, rng: seeded() }, 1, { duration: 3000, idleLimit: 2000 });
  assert.equal(score, 1);
  assert.equal(board.overlay.size, 0);
});

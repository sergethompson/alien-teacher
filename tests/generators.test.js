import assert from 'node:assert/strict';
import { test } from 'node:test';
import { idx, isCorner } from '../src/board.js';
import { makeProblem } from '../src/lessons/adding.js';
import { makeSequence } from '../src/lessons/copy.js';
import { makeCount } from '../src/lessons/counting.js';
import { bfs, makeMaze } from '../src/lessons/maze.js';
import { makeMirrorShape, mirrorOf } from '../src/lessons/mirror.js';
import { choiceXs, makePattern } from '../src/lessons/pattern.js';
import { createRain } from '../src/lessons/rain.js';
import { makeSort } from '../src/lessons/sorting.js';
import { seeded } from './helpers.js';

const SEEDS = Array.from({ length: 60 }, (_, i) => i + 1);
const noCorners = (cells) => cells.every(([x, y]) => !isCorner(x, y));
const unique = (cells) => new Set(cells.map((c) => c.join(','))).size === cells.length;

test('copy sequences are unique, off the corners, and the right length', () => {
  for (const s of SEEDS) {
    const seq = makeSequence(seeded(s), 9);
    const cells = seq.map((c) => [c.x, c.y]);
    assert.equal(seq.length, 9);
    assert.ok(unique(cells) && noCorners(cells));
  }
});

test('mirror shapes stay on the left half and reflect onto the right', () => {
  for (const s of SEEDS) {
    for (let level = 1; level <= 6; level++) {
      for (const { x, y } of makeMirrorShape(seeded(s), level)) {
        assert.ok(x <= 4);
        const [mx, my] = mirrorOf(x, y);
        assert.ok(mx >= 5 && my === y && !isCorner(mx, my));
      }
    }
  }
});

test('counting clusters have exactly n distinct dots above the number line', () => {
  for (const s of SEEDS) {
    for (let level = 1; level <= 6; level++) {
      const { n, cells } = makeCount(seeded(s), level);
      assert.equal(cells.length, n);
      assert.ok(n >= 1 && n <= 10 && unique(cells) && noCorners(cells));
      assert.ok(cells.every(([, y]) => y >= 1 && y <= 5));
    }
  }
});

test('adding problems always land on the 1–10 number line', () => {
  for (const s of SEEDS) {
    for (let level = 1; level <= 5; level++) {
      const p = makeProblem(seeded(s), level);
      assert.equal(p.answer, p.op === '+' ? p.a + p.b : p.a - p.b);
      assert.ok(p.answer >= 1 && p.answer <= 10 && p.a >= 1 && p.b >= 1);
      if (level === 4) assert.equal(p.op, '-');
      if (level <= 3) assert.equal(p.op, '+');
    }
  }
});

test('sorting boards have the right number of target dots, no overlaps', () => {
  for (const s of SEEDS) {
    for (let level = 1; level <= 6; level++) {
      const { target, dots } = makeSort(seeded(s), level);
      const cells = dots.map((d) => [d.x, d.y]);
      assert.equal(dots.filter((d) => d.color === target).length, Math.min(2 + level, 7));
      assert.ok(unique(cells) && noCorners(cells) && cells.every(([, y]) => y >= 2));
    }
  }
});

test('patterns: the answer is among the choices, exactly once, and fits the row', () => {
  for (const s of SEEDS) {
    for (let level = 1; level <= 5; level++) {
      const { shown, answer, choices } = makePattern(seeded(s), level);
      assert.equal(choices.filter((c) => c === answer).length, 1);
      assert.equal(new Set(choices).size, choices.length);
      assert.ok(1 + shown.length <= 8);
      assert.ok(choiceXs(choices.length).every((x) => x >= 0 && x <= 9));
    }
  }
});

test('mazes are always solvable within the level distance', () => {
  for (const s of SEEDS) {
    for (let level = 1; level <= 5; level++) {
      const { walls, start, goal, dist } = makeMaze(seeded(s), level);
      const path = bfs(walls, start, goal);
      assert.ok(path, `unsolvable maze seed ${s} level ${level}`);
      assert.equal(path.length, dist);
      assert.ok(!walls.has(idx(...start)) && !walls.has(idx(...goal)));
      assert.ok(noCorners([start, goal, ...path]));
    }
  }
});

test('rain drops fall and pile up without overlapping', () => {
  const rain = createRain(seeded());
  for (let i = 0; i < 12; i++) rain.press(4, 0);
  for (let i = 0; i < 12; i++) {
    rain.press(4, 0);
    for (let k = 0; k < 12; k++) rain.step();
  }
  assert.equal(rain.drops.length, 0);
  assert.ok(rain.sand.size >= 12);
  assert.ok(rain.sand.has(idx(4, 9)));
  for (const i of rain.sand.keys()) assert.ok(!isCorner(i % 10, Math.floor(i / 10)));
});

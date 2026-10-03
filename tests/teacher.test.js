import assert from 'node:assert/strict';
import { test } from 'node:test';
import { LESSONS } from '../src/lessons/index.js';
import { Teacher } from '../src/teacher.js';
import { seeded } from './helpers.js';

const lesson = (id) => LESSONS.find((l) => l.id === id);

test('two strong rounds level a skill up', () => {
  const t = new Teacher(LESSONS, {}, { rng: seeded() });
  assert.equal(t.record('copy', 1), 0);
  assert.equal(t.record('copy', 1), 1);
  assert.equal(t.levelOf('copy'), 2);
});

test('repeated misses level a skill down, never below 1', () => {
  const t = new Teacher(LESSONS, { copy: { level: 3, ema: 0.7, attemptsAtLevel: 0, plays: 5 } }, { rng: seeded() });
  t.record('copy', 0);
  assert.equal(t.record('copy', 0), -1);
  assert.equal(t.levelOf('copy'), 2);

  const fresh = new Teacher(LESSONS, {}, { rng: seeded() });
  for (let i = 0; i < 5; i++) fresh.record('copy', 0);
  assert.equal(fresh.levelOf('copy'), 1);
});

test('a mixed record around 80% holds the level steady', () => {
  const t = new Teacher(LESSONS, {}, { rng: seeded() });
  const scores = [1, 0.4, 1, 0.6, 0.4, 1, 0.6, 0.4];
  for (const s of scores) t.record('counting', s);
  assert.equal(t.levelOf('counting'), 1);
});

test('levels stop at the lesson max', () => {
  const t = new Teacher(LESSONS, {}, { rng: seeded() });
  for (let i = 0; i < 40; i++) t.record('adding', 1);
  assert.equal(t.levelOf('adding'), lesson('adding').maxLevel);
});

test('pick spreads lessons out and schedules a break every few lessons', () => {
  const t = new Teacher(LESSONS, {}, { rng: seeded(3), breakEvery: 4 });
  const picks = [];
  for (let i = 0; i < 30; i++) {
    const l = t.pick();
    picks.push(l.id);
    t.record(l.id, 1);
  }
  for (let i = 0; i + 4 < picks.length; i++) {
    assert.ok(picks.slice(i, i + 5).includes('rain'), `no break in ${picks.slice(i, i + 5)}`);
  }
  const backToBack = picks.filter((id, i) => id !== 'rain' && id === picks[i - 1]).length;
  assert.ok(backToBack <= 2, `too many repeats: ${picks}`);
  assert.ok(new Set(picks).size >= 6, `not enough variety: ${picks}`);
});

test('frustration counts as a miss and resets the break timer', () => {
  const t = new Teacher(LESSONS, {}, { rng: seeded() });
  t.recordFrustration('maze');
  assert.ok(t.stats('maze').ema < 0.5);
  assert.equal(t.history.at(-1), 'rain');
  assert.notEqual(t.pick().id, 'rain');
});

// The adaptive brain. It tracks how each skill is going and picks what to teach next,
// aiming for the sweet spot where the child succeeds about 80% of the time.

const LEVEL_UP = 0.85;
const LEVEL_DOWN = 0.45;
const START_EMA = 0.7;

export class Teacher {
  constructor(lessons, progress = {}, { rng = Math.random, breakEvery = 4 } = {}) {
    this.lessons = lessons;
    this.progress = progress; // lesson id → { level, ema, attemptsAtLevel, plays }
    this.rng = rng;
    this.breakEvery = breakEvery;
    this.history = []; // lesson ids played this session
  }

  stats(id) {
    this.progress[id] ??= { level: 1, ema: START_EMA, attemptsAtLevel: 0, plays: 0 };
    return this.progress[id];
  }

  levelOf(id) {
    return this.stats(id).level;
  }

  pick() {
    const breakLesson = this.lessons.find((l) => l.isBreak);
    const lastBreak = this.history.findLastIndex((id) => id === breakLesson?.id);
    if (breakLesson && this.history.length - 1 - lastBreak >= this.breakEvery) return breakLesson;

    const choices = this.lessons.filter((l) => !l.isBreak);
    const weights = choices.map((l) => {
      const s = this.stats(l.id);
      let w = 1 / (1 + this.history.filter((id) => id === l.id).length); // spread lessons out
      if (this.history.at(-1) === l.id) w *= 0.15; // rarely the same lesson twice in a row
      if (this.history.at(-2) === l.id) w *= 0.5;
      if (s.plays === 0) w *= 1.5; // curiosity: try new things
      if (s.ema < LEVEL_DOWN) w *= 0.6; // revisit hard things, but don't hammer them
      return w;
    });
    let r = this.rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < choices.length; i++) {
      r -= weights[i];
      if (r <= 0) return choices[i];
    }
    return choices.at(-1);
  }

  // score: 0..1 from the lesson. Returns +1 / -1 / 0 for a level change.
  record(id, score) {
    this.history.push(id);
    const lesson = this.lessons.find((l) => l.id === id);
    if (!lesson || lesson.isBreak) return 0;

    const s = this.stats(id);
    s.plays++;
    s.attemptsAtLevel++;
    s.ema = s.ema * 0.6 + score * 0.4;
    if (s.ema >= LEVEL_UP && s.attemptsAtLevel >= 2 && s.level < lesson.maxLevel) {
      Object.assign(s, { level: s.level + 1, ema: START_EMA, attemptsAtLevel: 0 });
      return 1;
    }
    if (s.ema < LEVEL_DOWN && s.attemptsAtLevel >= 2 && s.level > 1) {
      Object.assign(s, { level: s.level - 1, ema: START_EMA, attemptsAtLevel: 0 });
      return -1;
    }
    return 0;
  }

  // Button-mashing means it got too hard or too long: count it as a miss and take a break next.
  recordFrustration(id) {
    this.record(id, 0);
    const breakLesson = this.lessons.find((l) => l.isBreak);
    if (breakLesson) this.history.push(breakLesson.id);
  }
}

# Alien Teacher

A toy inspired by a 10×10 light-up button board. An "alien" teacher can talk to a child
**only** through dots of light, and the child can answer **only** by pressing them. No words,
no sound, no screen.

This is a browser simulator of the toy: open it on a tablet or phone and hand it over.
The teacher is adaptive and fully offline. It picks lessons, adjusts difficulty to keep the
child succeeding about 80% of the time, gives hints before frustration sets in, and goes
to sleep at the end of a session.

## Run it

```sh
npm start            # serves the folder on http://localhost:8000
```

No build step and no dependencies: any static file server works.

- Touch the alien's face to start.
- **Grown-up panel:** tap the four corner dots clockwise from top-left within 5 seconds (or
  press Shift+P). It shows progress per skill and sets the session length.
- URL options for demos: `?lesson=maze&level=3` forces a lesson, `?speed=3` runs faster,
  `?seed=7` makes it repeatable.

## Test

```sh
npm test             # Node 20+
```

Unit tests cover the adaptive engine and every puzzle generator (for example, every maze is
solvable). Each lesson is also played end to end by a simulated child.

## How it teaches

See [docs/TEACHING.md](docs/TEACHING.md) for the light vocabulary, the teaching principles,
the eight lessons in this version, a dozen more lesson ideas, and notes on building a physical
version.

## Layout

```
index.html, style.css   the toy and the hidden grown-up panel
src/board.js            the 10×10 board model (no DOM: portable to hardware)
src/signals.js          the alien's vocabulary: watch me, your turn, yes, not quite, hint…
src/teacher.js          adaptive lesson picking and leveling
src/lessons/            one module per lesson
src/dom.js              renders the board as glowing domes
src/main.js             the session loop
tests/                  node:test suites
```

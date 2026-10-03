# How the alien teaches

The alien has no words, no voice and no screen. It has 100 dots that glow and a child's
finger pressing them. Everything below is built from just four things: **which** dots light,
**what color**, **how bright**, and **how they move**.

## The vocabulary

The child learns this small "language" the same way they learn the rules of a game: by
seeing it the same way, every time.

| Meaning | Light signal |
|---|---|
| **Watch me** | The four corner dots (the alien's antennae) light **blue**, one after another, and stay dim blue while the alien demonstrates. |
| **Your turn** | The antennae **breathe soft white** until the child presses. |
| **Yes!** | A **green ripple** spreads out from the pressed dot. |
| **Not quite** | The pressed dot blinks **soft amber** twice. Never red, never harsh. |
| **Hint** | The right dot **shimmers**, and brighter the longer the child hesitates or the more tries it takes. |
| **Pick one** | Only the candidate dots are lit; everything else is dark. |
| **Done!** | **Fireworks** burst across the board. |
| **Mood** | A two-eyes-and-a-mouth face between lessons: happy, curious, kind ("that's okay"), calm, sleepy. |

The corners are reserved for status, so lesson content never uses them. That keeps the
"whose turn is it?" signal readable no matter what is on the board.

## Teaching principles built into the engine

- **Show → do together → do alone.** New ideas start with a demonstration (the mirror lesson
  shows a worked example at level 1; the maze flashes which dots count as "next to").
- **Errorless learning.** Hints appear *before* frustration: after 5–6 seconds of hesitation,
  after a first mistake, and strongly after a second. Every turn ends with the child pressing
  the right dot, so they always finish on a success.
- **The 80% sweet spot.** Each lesson tracks a moving average of how it's going. Two strong
  rounds move up a level, two rough ones move down. A child succeeding about 80% of the
  time stays where they are.
- **Spaced variety.** The teacher rarely repeats a lesson back to back, favors lessons not yet
  played, and revisits hard ones without hammering them.
- **Breaks and calm-down.** Every few lessons comes free play ("Light rain"). If the child
  starts mashing buttons (6+ presses in 2.5 s), the alien shows a calm face and switches to
  free play. It is treated as "this got too hard", not as misbehavior.
- **Short sessions.** After the set session length (default 15 minutes) the alien gets sleepy
  and goes to sleep until a grown-up wakes it.
- **Private by default.** All progress stays on the device.

## Lessons in this version

| Lesson | Skill | How it works | Levels |
|---|---|---|---|
| Copy me | Memory & attention | The alien lights a sequence of colored dots; the child repeats it in order. | 2 → 9 dots, shown faster |
| Counting | Number sense 1–10 | A cluster of dots appears; the child presses that number on a dim 10-dot number line (5 and 10 glow brighter). Afterwards each dot pairs off with one on the line (one-to-one correspondence). | dice patterns up to 3 → scattered up to 10 → flashed briefly (subitizing) |
| Find the color | Sorting & classifying | A color sample pulses at the top; the child pops every dot of that color. Pressing empty space is ignored. | 2 → 5 colors, then look-alike colors |
| What comes next | Patterns & prediction | A row like 🟥🟦🟥🟦🟥🟦⬜ with a blinking gap; the child picks the missing color from 2–4 choices. | AB → AAB/ABB → ABC/AABB → ABCD… |
| Mirror | Symmetry & space | The alien draws on the left half; the child presses the mirror spots on the right. | 1 dot near the fold → 6 dots anywhere |
| Maze walk | Directions & planning | Walk a white dot to the green goal by pressing the dot next to it; dim blue dots are walls. | straight line → open field → denser walls |
| Adding & taking away | Addition & subtraction | Yellow dots, then cyan dots join (or some fly away); the child presses the total on the number line. | sums to 5 (counting on) → sums to 10 (two groups) → take away → mixed |
| Light rain | Cause & effect (free play) | Every press drops a light that falls and piles up like sand. No wrong answers. | — |

## More ways to teach with this board

The 10×10 grid is also a **hundred chart**, so it is a natural base-10 tool. Ideas for future
lessons, all still using only dots and light:

1. **Hundred chart and place value.** Full rows are tens and leftover dots are ones. "Find 47."
2. **Multiplication arrays.** The alien lights a 3×4 rectangle; the child finds 12 on the chart. Also area.
3. **Shapes and letters.** The alien traces a letter or shape in a dot font; the child traces it in order. Pre-writing without sound.
4. **Guess the alien's rule.** A hidden rule (only edges, only even columns…) decides which presses glow green; the child experiments to discover it. This is the scientific method.
5. **Turn-taking games.** Tic-tac-toe, Connect-4, dots-and-boxes: strategy, patience, fair play.
6. **Rhythm.** The alien pulses a beat and the child taps along: timing and self-regulation.
7. **Feelings.** The alien's face shows an emotion; the child picks the matching face from 2–3 choices.
8. **Teach the alien.** The child draws freely; the alien answers by completing the symmetry, animating the drawing, or copying it back.
9. **Odd one out.** A board of similar dots with one different (color, brightness, or blinking speed).
10. **Bigger or smaller.** Two clusters; press the one with more. Comparison before numbers.
11. **Light physics.** A beam travels across the board and bounces off mirrors the child places.
12. **Fractions.** Light half a row, a quarter of the board, one in every three dots.

## Porting to real hardware

Lessons only ever talk to `src/board.js` (set/get dots, wait for presses, sleep) and
`src/signals.js` (the vocabulary). A physical version needs a 10×10 grid of RGB LEDs under
domes (e.g. WS2812B), a 10×10 button matrix, and a microcontroller that reimplements those
two modules. The colors in `src/colors.js` are plain RGB so they carry over directly.

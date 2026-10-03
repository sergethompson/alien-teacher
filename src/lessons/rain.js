// Light rain: free play. Every press drops a light that falls and piles up like sand.
// No wrong answers: cause and effect, and a calm break between lessons.
import { SIZE, idx, inBounds, isCorner } from '../board.js';
import { PALETTE } from '../colors.js';
import { statusOff, watchMe, yourTurn } from '../signals.js';
import { randInt } from './util.js';

const TICK = 90;

export function createRain(rng) {
  const sand = new Map(); // idx → color
  const drops = [];
  let colorI = 0;

  const taken = (x, y, self) =>
    !inBounds(x, y) || isCorner(x, y) || sand.has(idx(x, y)) || drops.some((d) => d !== self && d.x === x && d.y === y);

  return {
    sand,
    drops,
    // A press on empty space drops a light; a press on the pile repaints that grain.
    press(x, y) {
      const color = PALETTE[colorI++ % PALETTE.length];
      if (sand.has(idx(x, y))) sand.set(idx(x, y), color);
      else if (!taken(x, y)) drops.push({ x, y, color });
    },
    step() {
      for (const d of [...drops]) {
        if (!taken(d.x, d.y + 1, d)) {
          d.y++;
          continue;
        }
        const dirs = rng() < 0.5 ? [-1, 1] : [1, -1];
        const dx = dirs.find((dx) => !taken(d.x + dx, d.y + 1, d) && !taken(d.x + dx, d.y, d));
        if (dx !== undefined) {
          d.x += dx;
          d.y++;
        } else {
          sand.set(idx(d.x, d.y), d.color);
          drops.splice(drops.indexOf(d), 1);
        }
      }
    },
    full: () => [...sand.keys()].some((i) => Math.floor(i / SIZE) <= 1),
  };
}

export default {
  id: 'rain',
  name: 'Light rain',
  skill: 'Cause & effect (free play)',
  maxLevel: 1,
  isBreak: true,
  async run({ board, rng }, level, { duration = 35000, idleLimit = 12000 } = {}) {
    const rain = createRain(rng);
    let elapsed = 0;
    let lastPress = 0;
    const unsub = board.onPress((x, y) => {
      lastPress = elapsed;
      rain.press(x, y);
    });

    board.clear();
    await watchMe(board);
    for (let i = 0; i < 3; i++) rain.press(randInt(rng, 1, 8), 0);
    statusOff(board);
    const stopTurn = yourTurn(board);

    try {
      for (;;) {
        rain.step();
        board.clear();
        for (const [i, color] of rain.sand) board.set(i % SIZE, Math.floor(i / SIZE), color, 0.55);
        for (const d of rain.drops) board.set(d.x, d.y, d.color);
        await board.sleep(TICK);
        elapsed += TICK;

        const settled = rain.drops.length === 0;
        if (rain.full()) break;
        if (settled && elapsed > duration) break;
        if (settled && elapsed > 8000 && elapsed - lastPress > idleLimit) break;
      }
    } finally {
      unsub();
      stopTurn();
    }

    // Drain away, bottom row first.
    for (let y = SIZE - 1; y >= 0; y--) {
      for (let x = 0; x < SIZE; x++) board.off(x, y);
      await board.sleep(70);
    }
    return { score: 1 };
  },
};

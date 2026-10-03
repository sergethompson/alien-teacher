import { Board } from '../src/board.js';
import { mulberry32 } from '../src/rng.js';

export const fastBoard = () => new Board({ speed: 1000 });
export const seeded = (seed = 1) => mulberry32(seed);

// A pretend child: whenever the alien is waiting for an answer, press the first expected dot.
// With `mistakes`, it first presses a wrong dot that many times per turn.
export function simulateChild(board, { mistakes = 0, wrongCell = null } = {}) {
  let running = true;
  let wrongLeft = mistakes;
  let lastExpect = null;
  const tick = () => {
    if (!running) return;
    const target = board.expect[0];
    if (target) {
      const key = target.join(',');
      if (key !== lastExpect) {
        lastExpect = key;
        wrongLeft = mistakes;
      }
      if (wrongLeft > 0 && wrongCell) {
        wrongLeft--;
        board.press(...wrongCell(target));
      } else {
        board.press(...target);
      }
    }
    setTimeout(tick, 2);
  };
  tick();
  return () => (running = false);
}

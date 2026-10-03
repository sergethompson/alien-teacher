// Draws the board as 100 glowing domes and turns taps into presses.
import { SIZE } from './board.js';
import { mix } from './colors.js';

export class DomRenderer {
  constructor(board, el) {
    this.board = board;
    this.cells = [];
    this.pending = false;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const b = document.createElement('button');
        b.className = 'dot';
        b.type = 'button';
        b.setAttribute('aria-label', `dot ${x + 1}, ${y + 1}`);
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          b.classList.add('pressed');
          board.press(x, y);
        });
        const release = () => b.classList.remove('pressed');
        b.addEventListener('pointerup', release);
        b.addEventListener('pointerleave', release);
        b.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            board.press(x, y);
          }
        });
        el.appendChild(b);
        this.cells.push(b);
      }
    }
    board.onChange(() => this.schedule());
    this.draw();
  }

  schedule() {
    if (this.pending) return;
    this.pending = true;
    requestAnimationFrame(() => {
      this.pending = false;
      this.draw();
    });
  }

  draw() {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const v = this.board.view(x, y);
        const el = this.cells[y * SIZE + x];
        const level = v ? v.level : 0;
        el.style.setProperty('--c', (v ? mix(v.color, level) : mix([0, 0, 0], 0)).join(','));
        el.style.setProperty('--glow', v ? v.color.join(',') : '0,0,0');
        el.style.setProperty('--l', level.toFixed(3));
        el.classList.toggle('lit', level > 0.02);
      }
    }
  }
}

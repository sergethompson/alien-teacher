// Hidden grown-up panel: tap the corners top-left → top-right → bottom-right → bottom-left
// within 5 seconds (or press Shift+P). The only place the toy ever shows words.

const SEQUENCE = [
  [0, 0],
  [9, 0],
  [9, 9],
  [0, 9],
];

export function setupParent({ board, getTeacher, lessons, settings, onChange, onWake, onReset }) {
  const dlg = document.getElementById('parent');
  const body = dlg.querySelector('tbody');
  const minutes = dlg.querySelector('#session-minutes');

  let step = 0;
  let started = 0;
  board.onPress((x, y) => {
    const now = Date.now();
    if (step > 0 && now - started > 5000) step = 0;
    const [ex, ey] = SEQUENCE[step];
    if (x === ex && y === ey) {
      if (step === 0) started = now;
      if (++step === SEQUENCE.length) {
        step = 0;
        open();
      }
    } else {
      step = x === 0 && y === 0 ? 1 : 0;
      if (step) started = now;
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'P' && e.shiftKey && !dlg.open) open();
  });

  function render() {
    const teacher = getTeacher();
    body.replaceChildren(
      ...lessons.map((l) => {
        const s = teacher.stats(l.id);
        const tr = document.createElement('tr');
        const cells = l.isBreak
          ? [l.name, l.skill, '—', '—', s.plays || teacher.history.filter((id) => id === l.id).length]
          : [l.name, l.skill, `${s.level} / ${l.maxLevel}`, `${Math.round(s.ema * 100)}%`, s.plays];
        for (const text of cells) {
          const td = document.createElement('td');
          td.textContent = text;
          tr.appendChild(td);
        }
        return tr;
      }),
    );
    minutes.value = settings.sessionMinutes;
  }

  function open() {
    render();
    dlg.showModal();
  }

  minutes.addEventListener('change', () => {
    const v = Math.max(5, Math.min(60, Number(minutes.value) || 15));
    settings.sessionMinutes = v;
    minutes.value = v;
    onChange();
  });
  dlg.querySelector('#wake').addEventListener('click', () => {
    onWake();
    dlg.close();
  });
  // Two taps to erase, confirmed in the panel itself (some embeds block confirm()).
  const reset = dlg.querySelector('#reset');
  const resetLabel = reset.textContent;
  let armed = null;
  const disarm = () => {
    clearTimeout(armed);
    armed = null;
    reset.textContent = resetLabel;
  };
  reset.addEventListener('click', () => {
    if (!armed) {
      reset.textContent = 'Tap again to erase';
      armed = setTimeout(disarm, 4000);
      return;
    }
    disarm();
    onReset();
    render();
    reset.textContent = 'Progress erased';
    setTimeout(() => (reset.textContent = resetLabel), 2000);
  });
  dlg.addEventListener('close', disarm);
  dlg.querySelector('#close').addEventListener('click', () => dlg.close());
}

import { Board } from './board.js';
import { DomRenderer } from './dom.js';
import { LESSONS } from './lessons/index.js';
import { setupParent } from './parent.js';
import { mulberry32 } from './rng.js';
import { Frustrated, blink, celebrate, face, statusOff, yourTurn } from './signals.js';
import { load, save } from './storage.js';
import { Teacher } from './teacher.js';

// URL options for demos and testing: ?speed=4  ?seed=7  ?lesson=maze  ?level=3
const params = new URLSearchParams(location.search);
const speed = Number(params.get('speed')) || 1;
const seed = params.get('seed');
const forced = LESSONS.find((l) => l.id === params.get('lesson'));
const forcedLevel = Number(params.get('level')) || 0;

const rng = seed ? mulberry32(Number(seed)) : Math.random;
const board = new Board({ speed });
new DomRenderer(board, document.getElementById('grid'));

const data = load();
const settings = { sessionMinutes: 15, ...data.settings };
let teacher = new Teacher(LESSONS, data.progress ?? {}, { rng });
let sessionStart = Date.now();
const persist = () => save({ progress: teacher.progress, settings });

setupParent({
  board,
  getTeacher: () => teacher,
  lessons: LESSONS,
  settings,
  onChange: persist,
  onWake: () => (sessionStart = Date.now()),
  onReset: () => {
    teacher = new Teacher(LESSONS, {}, { rng });
    persist();
  },
});

const ctx = { board, rng };
const status = { lesson: null, phase: 'greeting' };
window.alien = { board, status, get teacher() { return teacher; } };

// Hello: the alien appears, blinks, and waits for the first touch.
async function greet() {
  face(board, 'happy');
  const stop = yourTurn(board);
  for (;;) {
    const p = await board.nextPress({ timeout: 2500 });
    if (p) break;
    await blink(board, 'happy');
  }
  stop();
}

// Session over: the alien gets sleepy and stays asleep until a grown-up wakes it.
async function sleepUntilWoken() {
  status.phase = 'sleeping';
  while (Date.now() - sessionStart > settings.sessionMinutes * 60000) {
    face(board, 'sleepy');
    await board.nextPress({ timeout: 3000 });
  }
}

async function calmDown() {
  status.phase = 'calm';
  statusOff(board);
  board.clearOverlays();
  face(board, 'calm');
  await board.sleep(2500);
  status.lesson = 'rain';
  await LESSONS.find((l) => l.isBreak).run(ctx, 1);
}

async function loop() {
  await greet();
  sessionStart = Date.now();
  for (;;) {
    if (Date.now() - sessionStart > settings.sessionMinutes * 60000) {
      await sleepUntilWoken();
      await greet();
    }
    const lesson = forced ?? teacher.pick();
    const level = forced && forcedLevel ? Math.min(forcedLevel, lesson.maxLevel) : teacher.levelOf(lesson.id);
    status.lesson = lesson.id;
    status.phase = 'lesson';

    let score;
    try {
      ({ score } = await lesson.run(ctx, level));
    } catch (e) {
      if (!(e instanceof Frustrated)) throw e;
      teacher.recordFrustration(lesson.id);
      persist();
      await calmDown();
      continue;
    }
    teacher.record(lesson.id, score);
    persist();

    status.phase = 'feedback';
    board.clearOverlays();
    if (lesson.isBreak) {
      face(board, 'happy');
      await board.sleep(900);
    } else if (score >= 0.6) {
      await celebrate(board, rng);
      face(board, 'happy');
      await board.sleep(900);
    } else {
      face(board, 'kind');
      await board.sleep(1400);
    }
    face(board, 'curious');
    await board.sleep(700);
  }
}

loop();

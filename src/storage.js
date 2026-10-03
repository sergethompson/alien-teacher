// Progress stays on this device only.
const KEY = 'alien-teacher-v1';

export function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage blocked (private window etc.): the toy still works, it just forgets.
  }
}

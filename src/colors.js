// Every color the alien can "say". RGB triples so the hardware port can reuse them.
export const C = {
  red: [255, 59, 59],
  orange: [255, 140, 26],
  yellow: [255, 214, 10],
  green: [46, 232, 107],
  cyan: [25, 211, 255],
  blue: [61, 107, 255],
  purple: [166, 77, 255],
  pink: [255, 79, 184],
  white: [255, 255, 255],
  amber: [255, 176, 32],
  alien: [124, 255, 107],
  calm: [90, 150, 255],
};

export const PALETTE = [C.red, C.orange, C.yellow, C.green, C.cyan, C.blue, C.purple, C.pink];

// Colors that are easy to tell apart, for younger levels.
export const DISTINCT = [C.red, C.yellow, C.green, C.blue, C.purple];

// An unlit dome.
export const OFF = [52, 55, 64];

export function mix(color, level) {
  const l = Math.max(0, Math.min(1, level));
  return OFF.map((o, i) => Math.round(o + (color[i] - o) * l));
}

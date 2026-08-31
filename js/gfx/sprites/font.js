// 5x7 pixel font. Rendered as a single spritesheet; PixelText picks frames by
// character so the same art drives the HUD clock and the big ending titles.
const GLYPHS = {
  A: ['.www.', 'w...w', 'w...w', 'wwwww', 'w...w', 'w...w', 'w...w'],
  B: ['wwww.', 'w...w', 'w...w', 'wwww.', 'w...w', 'w...w', 'wwww.'],
  C: ['.wwww', 'w....', 'w....', 'w....', 'w....', 'w....', '.wwww'],
  D: ['wwww.', 'w...w', 'w...w', 'w...w', 'w...w', 'w...w', 'wwww.'],
  E: ['wwwww', 'w....', 'w....', 'wwww.', 'w....', 'w....', 'wwwww'],
  F: ['wwwww', 'w....', 'w....', 'wwww.', 'w....', 'w....', 'w....'],
  G: ['.wwww', 'w....', 'w....', 'w.www', 'w...w', 'w...w', '.wwww'],
  H: ['w...w', 'w...w', 'w...w', 'wwwww', 'w...w', 'w...w', 'w...w'],
  I: ['wwwww', '..w..', '..w..', '..w..', '..w..', '..w..', 'wwwww'],
  J: ['..www', '...w.', '...w.', '...w.', '...w.', 'w..w.', '.ww..'],
  K: ['w...w', 'w..w.', 'w.w..', 'ww...', 'w.w..', 'w..w.', 'w...w'],
  L: ['w....', 'w....', 'w....', 'w....', 'w....', 'w....', 'wwwww'],
  M: ['w...w', 'ww.ww', 'w.w.w', 'w.w.w', 'w...w', 'w...w', 'w...w'],
  N: ['w...w', 'ww..w', 'w.w.w', 'w.w.w', 'w..ww', 'w...w', 'w...w'],
  O: ['.www.', 'w...w', 'w...w', 'w...w', 'w...w', 'w...w', '.www.'],
  P: ['wwww.', 'w...w', 'w...w', 'wwww.', 'w....', 'w....', 'w....'],
  Q: ['.www.', 'w...w', 'w...w', 'w...w', 'w.w.w', 'w..w.', '.ww.w'],
  R: ['wwww.', 'w...w', 'w...w', 'wwww.', 'w.w..', 'w..w.', 'w...w'],
  S: ['.wwww', 'w....', 'w....', '.www.', '....w', '....w', 'wwww.'],
  T: ['wwwww', '..w..', '..w..', '..w..', '..w..', '..w..', '..w..'],
  U: ['w...w', 'w...w', 'w...w', 'w...w', 'w...w', 'w...w', '.www.'],
  V: ['w...w', 'w...w', 'w...w', 'w...w', 'w...w', '.w.w.', '..w..'],
  W: ['w...w', 'w...w', 'w...w', 'w.w.w', 'w.w.w', 'ww.ww', 'w...w'],
  X: ['w...w', 'w...w', '.w.w.', '..w..', '.w.w.', 'w...w', 'w...w'],
  Y: ['w...w', 'w...w', '.w.w.', '..w..', '..w..', '..w..', '..w..'],
  Z: ['wwwww', '....w', '...w.', '..w..', '.w...', 'w....', 'wwwww'],
  0: ['.www.', 'w...w', 'w..ww', 'w.w.w', 'ww..w', 'w...w', '.www.'],
  1: ['..w..', '.ww..', '..w..', '..w..', '..w..', '..w..', '.www.'],
  2: ['.www.', 'w...w', '....w', '...w.', '..w..', '.w...', 'wwwww'],
  3: ['wwwww', '...w.', '..w..', '...w.', '....w', 'w...w', '.www.'],
  4: ['...w.', '..ww.', '.w.w.', 'w..w.', 'wwwww', '...w.', '...w.'],
  5: ['wwwww', 'w....', 'wwww.', '....w', '....w', 'w...w', '.www.'],
  6: ['..ww.', '.w...', 'w....', 'wwww.', 'w...w', 'w...w', '.www.'],
  7: ['wwwww', '....w', '...w.', '..w..', '.w...', '.w...', '.w...'],
  8: ['.www.', 'w...w', 'w...w', '.www.', 'w...w', 'w...w', '.www.'],
  9: ['.www.', 'w...w', 'w...w', '.wwww', '....w', '...w.', '.ww..'],
  ':': ['.....', '..w..', '..w..', '.....', '..w..', '..w..', '.....'],
  '!': ['..w..', '..w..', '..w..', '..w..', '..w..', '.....', '..w..'],
  '?': ['.www.', 'w...w', '....w', '..ww.', '..w..', '.....', '..w..'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '..w..'],
  ',': ['.....', '.....', '.....', '.....', '.....', '..w..', '.w...'],
  '-': ['.....', '.....', '.....', '.www.', '.....', '.....', '.....'],
  '/': ['....w', '...w.', '...w.', '..w..', '.w...', '.w...', 'w....'],
  '<': ['...w.', '..w..', '.w...', 'w....', '.w...', '..w..', '...w.'],
  '>': ['.w...', '..w..', '...w.', '....w', '...w.', '..w..', '.w...'],
  "'": ['..w..', '..w..', '.....', '.....', '.....', '.....', '.....'],
  '(': ['...w.', '..w..', '..w..', '..w..', '..w..', '..w..', '...w.'],
  ')': ['.w...', '..w..', '..w..', '..w..', '..w..', '..w..', '.w...'],
  // A heart, for the end of the book. There is no character for one, so it
  // hangs off '~' — an emoji here would render as a blank, since anything
  // outside this table falls back to a space.
  '~': ['ww.ww', 'wwwww', 'wwwww', 'wwwww', '.www.', '..w..', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

export const FONT_CHARS = Object.keys(GLYPHS);
export const FONT_FRAMES = FONT_CHARS.map((c) => GLYPHS[c]);
export const FONT_INDEX = Object.fromEntries(FONT_CHARS.map((c, i) => [c, i]));
export const GLYPH_W = 5;
export const GLYPH_H = 7;

// A real bold, thickened in the glyph grid rather than by drawing the text
// twice at an offset. Faking it on screen needs a fractional scale to stay
// small, and a fractional scale on a pixel font just turns to mush — this
// stays on the pixel grid, so it renders crisp at scale 1.
function embolden(rows) {
  return rows.map((row) => {
    const src = `${row}.`;
    let out = '';
    for (let x = 0; x < src.length; x++) {
      out += src[x] === 'w' || (x > 0 && src[x - 1] === 'w') ? 'w' : '.';
    }
    return out;
  });
}

function upscale2x(rows) {
  const out = [];
  rows.forEach((row) => {
    let wide = '';
    for (const ch of row) wide += ch + ch;
    out.push(wide, wide);
  });
  return out;
}

// Semi-bold, not bold. Thickening the 5x7 grid directly turns a 1-pixel stroke
// into a 2-pixel one — that is double the weight and reads as bulky. Doubling
// the grid first makes the stroke 2 pixels, so the same thickening step lands
// on 3: heavier than regular, well short of bold.
export const FONT_FRAMES_SEMI = FONT_FRAMES.map((frame) => embolden(upscale2x(frame)));
export const GLYPH_W_SEMI = GLYPH_W * 2 + 1;
export const GLYPH_H_SEMI = GLYPH_H * 2;

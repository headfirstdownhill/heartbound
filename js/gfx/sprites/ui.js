// Touch controls are drawn as pixel grids too, so they sit in the same visual
// world as the game rather than looking like web UI pasted on top.
function circleGrid(size, opts = {}) {
  const { fill = null, edge = 'w', inner = null, innerRadius = 0 } = opts;
  const c = (size - 1) / 2;
  const r = size / 2;
  const rows = [];
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d > r - 0.5) row += '.';
      else if (d > r - 2.5) row += edge;
      else if (inner && d < innerRadius) row += inner;
      else row += fill ?? '.';
    }
    rows.push(row);
  }
  return rows;
}

export function stickBase(size = 36) {
  return circleGrid(size, { edge: 'w', fill: null });
}

export function stickKnob(size = 18) {
  return circleGrid(size, { edge: 'w', fill: 'W' });
}

export function attackButton(size = 32) {
  const rows = circleGrid(size, { edge: 'w', fill: 'W' }).map((r) => r.split(''));
  // Stamp a blade in the middle so the button reads as "swing" at a glance.
  const blade = [
    '....m....',
    '...mmm...',
    '...mMm...',
    '...mMm...',
    '...mMm...',
    '...mMm...',
    '...mMm...',
    '...mMm...',
    '.kkkkkkk.',
    '....n....',
    '....n....',
    '....n....',
    '...kkk...',
  ];
  const ox = Math.floor((size - blade[0].length) / 2);
  const oy = Math.floor((size - blade.length) / 2);
  blade.forEach((line, y) =>
    line.split('').forEach((ch, x) => {
      if (ch !== '.') rows[oy + y][ox + x] = ch;
    }),
  );
  return rows.map((r) => r.join(''));
}

// The HUD's pause control, built on the same disc as the attack button so the
// two read as one set of controls rather than a game button and a web icon.
export function pauseIcon(size = 16) {
  const rows = circleGrid(size, { edge: 'w', fill: 'W' }).map((r) => r.split(''));
  const barW = 3;
  const barH = 8;
  const gap = 2;
  const x0 = Math.round((size - (barW * 2 + gap)) / 2);
  const y0 = Math.round((size - barH) / 2);
  for (let y = y0; y < y0 + barH; y++) {
    for (let i = 0; i < barW; i++) {
      rows[y][x0 + i] = 'o';
      rows[y][x0 + barW + gap + i] = 'o';
    }
  }
  return rows.map((r) => r.join(''));
}

export function heartOutline() {
  return [
    '..oo...oo..',
    '.oOOo.oOOo.',
    'oOOOOOOOOOo',
    'oOOOOOOOOOo',
    'oOOOOOOOOOo',
    '.oOOOOOOOo.',
    '..oOOOOOo..',
    '...oOOOo...',
    '....oOo....',
    '.....o.....',
  ];
}

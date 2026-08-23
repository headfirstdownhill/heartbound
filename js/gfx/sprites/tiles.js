// Tiles are generated rather than hand-authored so every row stays exactly
// square. A tiny deterministic LCG keeps the speckle pattern stable between runs.
//
// These are the only art in the game that is on screen every single frame, so
// they carry more tones than anything else: a floor built from two colours reads
// as noise, and four or five reads as ground.
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Stable 2D value hash, so scattered decor looks random but never re-rolls
// between frames or runs. Plain modulo on x/y just produces stripes.
export function hash2(x, y) {
  let h = (Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const SIZE = 16;

function blank(fill) {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => fill));
}

function done(grid) {
  return grid.map((r) => r.join(''));
}

// Scatter n cells of `ch`, optionally only where the cell already matches.
function scatter(grid, rand, ch, n, onlyOver = null) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(rand() * SIZE);
    const y = Math.floor(rand() * SIZE);
    if (onlyOver && grid[y][x] !== onlyOver) continue;
    grid[y][x] = ch;
  }
}

// Soft round patch. Used for the clumps that break up flat grass and for the
// leaf masses in a hedge — both look wrong as rectangles.
function blot(grid, cx, cy, r, ch) {
  for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(SIZE - 1, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(SIZE - 1, Math.ceil(cx + r)); x++) {
      const dx = x - cx;
      const dy = (y - cy) * 1.35; // squashed, so patches read as seen from above
      if (dx * dx + dy * dy <= r * r) grid[y][x] = ch;
    }
  }
}

// Grass: a few darker clumps, sunlit blade tips standing up out of them, and a
// sparse scatter of deep shadow so the mat has some depth to it.
export function grassTile(seed = 7) {
  const rand = lcg(seed);
  const grid = blank('f');

  for (let i = 0; i < 3; i++) {
    blot(grid, rand() * SIZE, rand() * SIZE, 2 + rand() * 2.2, 'F');
  }
  scatter(grid, rand, 'F', 14);

  // Blades: two-cell vertical runs, brighter at the tip.
  for (let i = 0; i < 13; i++) {
    const x = Math.floor(rand() * SIZE);
    const y = Math.floor(rand() * (SIZE - 2)) + 1;
    grid[y][x] = '4';
    if (rand() < 0.55) grid[y - 1][x] = '4';
  }
  scatter(grid, rand, '5', 7, 'F');
  scatter(grid, rand, '5', 4, 'f');
  return done(grid);
}

// One flagstone per tile: dark mortar along the top and left, a lit bevel just
// inside it, shade along the bottom and right, and a cracked, speckled face.
export function floorTile(seed = 11) {
  const rand = lcg(seed);
  const grid = blank('t');

  scatter(grid, rand, 'T', 20);
  scatter(grid, rand, '0', 8);

  for (let i = 0; i < SIZE; i++) {
    grid[0][i] = '9';
    grid[i][0] = '9';
    grid[1][i] = grid[1][i] === '9' ? '9' : '6';
    grid[i][1] = grid[i][1] === '9' ? '9' : '6';
    grid[SIZE - 1][i] = 'T';
    grid[i][SIZE - 1] = 'T';
  }

  // One crack per stone, walked from a random edge cell inward, so no two
  // stones break the same way.
  let cx = 2 + Math.floor(rand() * (SIZE - 4));
  let cy = 2 + Math.floor(rand() * (SIZE - 4));
  const steps = 4 + Math.floor(rand() * 5);
  for (let i = 0; i < steps; i++) {
    if (cx < 2 || cy < 2 || cx > SIZE - 3 || cy > SIZE - 3) break;
    grid[cy][cx] = '7';
    cx += rand() < 0.5 ? 1 : rand() < 0.5 ? -1 : 0;
    cy += rand() < 0.6 ? 1 : 0;
  }
  return done(grid);
}

// Beaten earth: no stones, no mortar, just packed dirt with grit in it.
export function pathTile(seed = 23) {
  const rand = lcg(seed);
  const grid = blank('T');
  for (let i = 0; i < 3; i++) blot(grid, rand() * SIZE, rand() * SIZE, 1.6 + rand() * 2, 't');
  scatter(grid, rand, 't', 18);
  scatter(grid, rand, '0', 12);
  scatter(grid, rand, '7', 5);
  return done(grid);
}

// Stone brickwork with a purple cap along the top. Courses are offset so the
// vertical seams do not line up into a column when the tile repeats.
export function wallTile(seed = 3) {
  const rand = lcg(seed);
  const grid = blank('u');

  scatter(grid, rand, 'U', 16);
  scatter(grid, rand, '8', 12);

  // Two brick courses, seams at rows 2 and 9.
  const courses = [
    { top: 2, bottom: 8, offset: 0 },
    { top: 9, bottom: 15, offset: 8 },
  ];
  courses.forEach(({ top, bottom, offset }) => {
    for (let x = 0; x < SIZE; x++) {
      grid[top][x] = '9';
      // Lit top edge of each brick, immediately under its mortar line.
      if (top + 1 <= bottom) grid[top + 1][x] = '8';
      // Shaded bottom edge.
      if (bottom >= 0) grid[bottom][x] = 'U';
    }
    for (let y = top; y <= bottom; y++) {
      grid[y][(offset + SIZE) % SIZE] = '9';
    }
  });

  // The cap: two rows of trim with a highlight along the very top.
  for (let x = 0; x < SIZE; x++) {
    grid[0][x] = '8';
    grid[1][x] = 'c';
  }
  scatter(grid, rand, '9', 6, 'U');
  return done(grid);
}

// Dense leaf noise with no straight edges, so tiled hedges read as one mass of
// foliage rather than a grid of blocks.
export function hedgeTile(seed = 31) {
  const rand = lcg(seed);
  const grid = blank('i');

  for (let i = 0; i < 5; i++) blot(grid, rand() * SIZE, rand() * SIZE, 1.8 + rand() * 2.4, 'I');
  scatter(grid, rand, 'I', 26);

  // Leaves catching the light, in little clusters rather than evenly spread.
  for (let i = 0; i < 9; i++) {
    const x = Math.floor(rand() * SIZE);
    const y = Math.floor(rand() * SIZE);
    grid[y][x] = 'L';
    if (rand() < 0.5 && x + 1 < SIZE) grid[y][x + 1] = 'L';
    if (rand() < 0.4 && y + 1 < SIZE) grid[y + 1][x] = 'L';
  }
  scatter(grid, rand, '5', 10, 'I');
  return done(grid);
}

// A wall bracket with a lit head. Drawn as a grid rather than as a glow because
// the glow itself is a particle effect layered over it.
export function torchBracket() {
  return [
    '..oo..',
    '.oyyo.',
    '.oyyo.',
    '..oo..',
    '..nn..',
    '..nn..',
    '.onno.',
    '..oo..',
  ];
}

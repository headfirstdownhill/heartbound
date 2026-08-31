import { shiftDown } from '../PixelArt.js';
import { BLOB_TINTS } from '../Palette.js';
import { hash2 } from './tiles.js';

// Props that only exist in the "I love you Jory" run: the key he hands over,
// the chest it opens, the book inside, and the four power-up bubbles.

// 16x10. Ornate bow, long shaft, two teeth.
export const KEY = [
  '..yyyy..........',
  '.yYYYYy.........',
  'yYY..YYy........',
  'yY....Yy........',
  'yYY..YYyyyyyyyy.',
  '.yYYYYyYYYYYYYy.',
  '..yyyy......y.y.',
  '............y.y.',
  '............yyy.',
  '................',
];

// 22x16 chest, shut. Gold bands over a dark timber body, keyhole dead centre.
export const CHEST_CLOSED = [
  '......................',
  '....oooooooooooooo....',
  '...oyyyyyyyyyyyyyyo...',
  '..oyYYYYYYYYYYYYYYYo..',
  '..oyYYyyyyyyyyyyYYYo..',
  '..oooooooooooooooooo..',
  '..onnnnnnnnnnnnnnnno..',
  '..onnnnnnnyynnnnnnno..',
  '..onnnnnnnyynnnnnnno..',
  '..oyyyyyyyyyyyyyyyyo..',
  '..oyYYYYYYYoYYYYYYYo..',
  '..onnnnnnnnonnnnnnno..',
  '..onnnnnnnnnnnnnnnno..',
  '..oNNNNNNNNNNNNNNNNo..',
  '..oooooooooooooooooo..',
  '......................',
];

// Lid thrown back, light pouring out of the box.
export const CHEST_OPEN = [
  '..oyYYYYYYYYYYYYYYYo..',
  '..oyyyyyyyyyyyyyyyyo..',
  '...oooooooooooooooo...',
  '......................',
  '..oowwwwwwwwwwwwwwoo..',
  '..owwwwwwwwwwwwwwwwo..',
  '..oyyyyyyyyyyyyyyyyo..',
  '..oyYYYYYYYYYYYYYYYo..',
  '..onnnnnnnnnnnnnnnno..',
  '..onnnnnnnnnnnnnnnno..',
  '..oyyyyyyyyyyyyyyyyo..',
  '..oyYYYYYYYoYYYYYYYo..',
  '..onnnnnnnnonnnnnnno..',
  '..oNNNNNNNNNNNNNNNNo..',
  '..oooooooooooooooooo..',
  '......................',
];

// 16x16, closed, seen face on. The first pass was a near-square cover with a
// cream band under it, which reads as a box with a lid: nothing said which way
// it opens. What makes it a book is depth on two sides at once — a dark spine
// running down the left, and a block of page edges down the right and along the
// bottom, so the cover clearly sits on top of a stack of paper. The banding on
// the spine and the striations in the page block are what sell it at this size.
//
// Square on purpose, matching the ring: the two sit in identical panels on the
// reward screen, and a taller book stood on its own drop shadow instead of
// above it.
export const BOOK = [
  'oooooooooooooooo',
  'oDDddddddddddQwo',
  'oDDdwwwwwwwwdQwo',
  'oDodwrrwwrrwdQWo',
  'oDDdwrrrrrrwdQwo',
  'oDDdwrrrrrrwdQwo',
  'oDDdwwrrrrwwdQwo',
  'oDodwwwrrwwwdQWo',
  'oDDdwwwwwwwwdQwo',
  'oDDddddddddddQwo',
  'oDoddddddddddQWo',
  'oDDddddddddddQwo',
  'oDoddddddddddQWo',
  'oDDDDDDDDDDDDQwo',
  'oDDQQQQQQQQQQQQo',
  'oooooooooooooooo',
];

// The second book, in purple. Only the boards change: 'd' and 'D' are the cover
// and its shade, and they happen to be the dress colours, so overriding the two
// of them repaints the binding and leaves the cream page edges, the white
// plaque and the red heart exactly as they are. Tinting the sprite instead
// would have dragged all four down together — a tint can only darken, and the
// pink is lighter than the purple in two channels.
export const BOOK_PURPLE = {
  d: '#8e5bc4', // cover
  D: '#5f3690', // cover shade
};

// The other thing in the chest. A brilliant-cut garnet over a gold band. The
// facets step down through four tones so the stone has depth rather than
// reading as a flat red lozenge, there is a glint on the table so it catches
// the light, and the band is hollow so the silhouette says "ring" before any of
// the detail lands.
export const RING = [
  '.....oooooo.....',
  '....ommwwwwo....',
  '...omwAAAAwwo...',
  '..owAAAAAAAAwo..',
  '..oWAAAAAAAAWo..',
  '...oWAAaaAAWo...',
  '....oWAaaAWo....',
  '.....oWaaWo.....',
  '......oWWo......',
  '....oooyyooo....',
  '..ooyyyyyyyyoo..',
  '.oyyYo....oYyyo.',
  '.oyYo......oYyo.',
  '.oyYo......oYyo.',
  '..oyYo....oYyo..',
  '...ooyyyyyyoo...',
];

// The stone's colours, as overrides on that grid. What separates a garnet from
// a ruby is how dark it gets rather than how red it is, so the ramp runs from a
// lit table down to a pavilion that is nearly black. Only the gem's characters
// are remapped — the band is 'y'/'Y' and stays gold, which is what a red stone
// wants to sit in.
export const RING_GARNET = {
  m: '#ffd7dd', // glint on the table
  w: '#df5a6d', // table
  A: '#b02038', // crown facets
  W: '#7a1228', // shaded edge
  a: '#4a0a18', // pavilion, seen through the table
};

// ---- power-up bubbles ------------------------------------------------------
// The first pass was a hollow white ring with a glyph floating in the middle,
// which is the one thing in this game that did not look like it belonged in it:
// no dark outline, no fill, no shading, and all four identical apart from the
// glyph. These are glass orbs instead — outlined like every other sprite, lit
// down the top left, deepening toward the bottom right, with a specular arc on
// the glass in front of whatever is suspended inside.
//
// The body is 'g'/'G'/'l', the same overridable trio the blob tiers use, so
// each power-up gets its own colour of glass out of one grid (see BUBBLE_GLASS).
const BUBBLE_SIZE = 16;
// Icons are kept inside this radius and the glint outside it, so the highlight
// can never take a bite out of a glyph.
const BUBBLE_ICON_R = 5.4;

function bubbleShell(icon) {
  const c = (BUBBLE_SIZE - 1) / 2;
  const r = BUBBLE_SIZE / 2;
  const rows = [];

  for (let y = 0; y < BUBBLE_SIZE; y++) {
    const row = [];
    for (let x = 0; x < BUBBLE_SIZE; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      if (d > r) row.push('.');
      else if (d > r - 1) row.push('o');
      // Rim: lit where the light is, dark round the back.
      else if (d > r - 2) row.push(dx + dy < 0 ? 'l' : 'G');
      // Body, shading off along the same diagonal.
      else row.push(dx + dy > 3.5 ? 'G' : 'g');
    }
    rows.push(row);
  }

  const ox = Math.floor((BUBBLE_SIZE - icon[0].length) / 2);
  const oy = Math.floor((BUBBLE_SIZE - icon.length) / 2);
  icon.forEach((line, y) =>
    line.split('').forEach((ch, x) => {
      if (ch !== '.') rows[oy + y][ox + x] = ch;
    }),
  );

  // Specular last, so it sits on the glass in front of the icon. An arc up the
  // top-left rather than a couple of loose pixels — that is what makes it read
  // as a sphere rather than a disc.
  for (let y = 0; y < BUBBLE_SIZE; y++) {
    for (let x = 0; x < BUBBLE_SIZE; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      if (d <= BUBBLE_ICON_R || d > r - 0.9) continue;
      const a = (Math.atan2(dy, dx) * 180) / Math.PI;
      const off = Math.abs(((a + 135 + 540) % 360) - 180);
      if (off > 26) continue;
      rows[y][x] = off < 13 ? 'w' : 'W';
    }
  }

  return rows.map((row) => row.join(''));
}

// The radiation sign: a hub with three blades at 120 degrees. Generated because
// by hand at this size the three blades never come out the same weight, and an
// uneven trefoil stops reading as the symbol at a glance.
function trefoilIcon(size = 12, ink = 'o') {
  const c = (size - 1) / 2;
  const HUB = 1.8;
  const INNER = 2.9;
  const OUTER = 5.2;
  const HALF_ARC = 30;
  const AXES = [-90, 30, 150]; // up, lower right, lower left

  const rows = [];
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      const d = Math.hypot(dx, dy);
      if (d <= HUB) {
        row += ink;
      } else if (d < INNER || d > OUTER) {
        row += '.';
      } else {
        const a = (Math.atan2(dy, dx) * 180) / Math.PI;
        const on = AXES.some((axis) => Math.abs(((a - axis + 540) % 360) - 180) <= HALF_ARC);
        row += on ? ink : '.';
      }
    }
    rows.push(row);
  }
  return rows;
}

// A heart: restores every point of health at once.
export const BUBBLE_HEAL = bubbleShell([
  '.rr...rr.',
  'rwrrrrrrr',
  'rrrrrrrrr',
  'rrrrrrrrr',
  '.RRRRRRR.',
  '..RRRRR..',
  '...RRR...',
  '....R....',
]);

// A shield: twenty seconds of not being hurt.
export const BUBBLE_SHIELD = bubbleShell([
  '.mmmmmmm.',
  'mmmmmmmmm',
  'mMMMMMMMm',
  'mMMMMMMMm',
  '.MMMMMMM.',
  '..MMMMM..',
  '...MMM...',
  '....M....',
]);

// A small blob in her allies' blue, so the bubble says which side the things it
// gives you are on. 'a'/'A'/'Z' are the pond blues, re-pointed at the ally tint.
export const BUBBLE_ALLY = bubbleShell([
  '..aaaaa..',
  '.aAAaaaa.',
  'aAAaaaaaa',
  'aoaaaaaoa',
  'aaaaaaaaa',
  'aZZZZZZZa',
  '.ZZZZZZZ.',
]);

// The rare one that clears the field. A dark trefoil on gold glass, which is
// the radiation sign as it actually is, drawn in this game's palette.
export const BUBBLE_NUKE = bubbleShell(trefoilIcon());

// One grid, four colours of glass. Each orb's body reads differently at a
// glance, so the glyph is confirming what the colour already said rather than
// carrying the whole job on its own.
export const BUBBLE_GLASS = {
  // Deep wine, so the bright pink heart sits well clear of it.
  bubble_heal: { g: '#7a2038', G: '#44101f', l: '#c2425f' },
  // Steel blue under the silver shield.
  bubble_shield: { g: '#2f4f80', G: '#182c4c', l: '#6a97cf' },
  // Violet, so the ally inside is the only blue thing on the bubble.
  bubble_ally: {
    g: '#3b2f63',
    G: '#221a3d',
    l: '#6b5aa8',
    a: BLOB_TINTS.ally.g,
    A: BLOB_TINTS.ally.l,
    Z: BLOB_TINTS.ally.G,
  },
  // Hazard gold. Dark on gold is what makes it the radiation sign and not a
  // generic starburst.
  bubble_nuke: { g: '#f2c14e', G: '#a8781c', l: '#ffe08a' },
};

// ---------------------------------------------------------------------------
// The meadow she is sent off from: roses, a pond, otters and three cats.
// ---------------------------------------------------------------------------

// Her flowers. Same silhouette in both colours so a scattered field reads as
// one kind of thing in two shades.
export const ROSE_RED = [
  '..CCC..',
  '.CECEC.',
  'CCEECCC',
  'CCECECC',
  '.CCCCC.',
  '..CCC..',
  '...V...',
  '.V.V.V.',
  '...V...',
];

export const ROSE_WHITE = [
  '..www..',
  '.wWwWw.',
  'wwWWwww',
  'wwWwWww',
  '.wwwww.',
  '..www..',
  '...V...',
  '.V.V.V.',
  '...V...',
];

// Two looks for the meadow's animals, kept side by side so either can be put
// back by changing one word. 'classic' is the original pair; 'plush' is the
// rounder redraw — cats sitting with the tail swept out, otters chibi with a
// pale muzzle.
//
// **To go back, change one word:** CRITTER_STYLE = 'classic'.
const CRITTER_STYLE = 'classic';

// Fur is 'g'/'G' so the three cats are palette overrides of one grid, the same
// trick the blob tiers use. Eyes stay gold so they read on white and on black.
// 12x14 cat, facing the viewer: pointed ears, gold eyes, pink nose, tail
// flicked out to one side. Gold eyes read on a white coat and on a black one,
// which the side-on version did not.
const CAT_A = [
  '.o........o.',
  '.oo......oo.',
  '.ogo....ogo.',
  '.oggggggggo.',
  '.oggggggggo.',
  '.ogkggggkgo.',
  '.ogggrrgggo.',
  '.oggggggggo.',
  '..oggggggo..',
  '..oggggggo.o',
  '..oggggggooo',
  '..oGGGGGGo..',
  '..oo.oo.oo..',
  '............',
];

const CAT_B = [
  '.o........o.',
  '.oo......oo.',
  '.ogo....ogo.',
  '.oggggggggo.',
  '.oggggggggo.',
  '.ogkggggkgo.',
  '.ogggrrgggo.',
  '.oggggggggo.',
  '..oggggggo..',
  '..oggggggoo.',
  '..oggggggo.o',
  '..oGGGGGGo..',
  '..oo.oo..oo.',
  '............',
];


// The redraw: sitting rather than standing square-on, which is the pose in the
// reference art. 17x15 — wider than the old grid because the tail now lies out
// to the left along the ground instead of being tucked beside the body. Eyes
// stay gold, not the reference's dark dots: on the black coat dark eyes vanish
// into the silhouette entirely, which is what the gold was there to solve.
const CAT_SIT_A = [
  '.....o.......o...',
  '....ogo.....ogo..',
  '....oggggggggggo.',
  '...oggggggggggggo',
  '...oggkggggggkggo',
  '...oggggggggggggo',
  '...oggggrrggggggo',
  '...oggggggggggggo',
  '....oggggggggggo.',
  '.....oggggggggo..',
  '....oggggggggggo.',
  '...oggggggggggggo',
  '...oggggggggggggo',
  '..oGgggggggggggo.',
  'ooGGgggggggggggo.',
  '.ooo..oGGooGGo...',
];

// Second frame is the tail dropping and the head settling a pixel — a cat
// sitting still is not motionless, but it is not walking either.
const CAT_SIT_B = [
  '.....o.......o...',
  '....ogo.....ogo..',
  '....oggggggggggo.',
  '...oggggggggggggo',
  '...oggkggggggkggo',
  '...oggggggggggggo',
  '...oggggrrggggggo',
  '...oggggggggggggo',
  '....oggggggggggo.',
  '.....oggggggggo..',
  '....oggggggggggo.',
  '...oggggggggggggo',
  '...oggggggggggggo',
  '...oGggggggggggo.',
  '.ooGGgggggggggggo',
  '..ooo.oGGooGGo...',
];

export const CAT_WALK = CRITTER_STYLE === 'plush' ? [CAT_SIT_A, CAT_SIT_B] : [CAT_A, CAT_B];

export const CAT_COATS = {
  cat_white: { g: '#ffffff', G: '#d5d5e0' },
  cat_toast: { g: '#c98a4b', G: '#96622f' },
  cat_black: { g: '#3a3540', G: '#241f2e' },
};

// 18x18 otter. The parts that make one read as an otter rather than a brown
// lump are the whiskers poking past the cheeks, the open mouth with a tongue,
// and ears set low on the sides instead of up on top.
// Head-heavy and narrow through the body. The previous pass was as wide at the
// belly as at the head with a full-width cream front, which reads as a panda —
// the cream is now a slim bib with brown arms framing it.
const OTTER_A = [
  '....oo......oo....',
  '...oKKo....oKKo...',
  '...oKKooooooKKo...',
  '...oKKKKKKKKKKo...',
  '..oKKKKKKKKKKKKo..',
  '..oKKeeKKKKeeKKo..',
  'o.oKKeeKKKKeeKKo.o',
  '..oKKKQQooQQKKKo..',
  'o.oKKKQrrrrQKKKo.o',
  '..oKKKQQrrQQKKKo..',
  '..oKKKKQQQQKKKKo..',
  '...oKKKKKKKKKKo...',
  '...oKKKKKKKKKKo...',
  '...oKKQQQQQQKKo...',
  '...oKKQQQQQQKKo...',
  '...oKKQQQQQQKKo...',
  '....oKKQQQQKKo....',
  '....oXXo..oXXo....',
];

// One continuous run of hedge rather than separate clumps. Overlapping outlined
// blobs read as a pile of rubble; a single mass with a gently scalloped top and
// leaf speckle reads as a hedge. Only the top edge is outlined — the sides and
// base are where it meets its neighbours and the ground.
export function hedgeBand(w, h = 22, seed = 3) {
  const grid = Array.from({ length: h }, () => Array.from({ length: w }, () => '.'));

  // Two slow waves and one fast one: an uneven but calm skyline, no spikes.
  const topAt = (x) =>
    Math.round(
      4 +
        Math.sin(x * 0.09 + seed) * 1.9 +
        Math.sin(x * 0.21 + seed * 2.3) * 1.2 +
        Math.sin(x * 0.53 + seed) * 0.55,
    );

  for (let x = 0; x < w; x++) {
    const top = Math.max(0, topAt(x));
    for (let y = top; y < h; y++) {
      const depth = y - top;
      if (y >= h - 4) grid[y][x] = 'I'; // grounded in shadow
      else if (depth === 0) grid[y][x] = 'o'; // thin lit-side outline on top
      else if (depth < 3 && hash2(x * 3 + seed, y) < 0.5) grid[y][x] = 'L';
      else if (hash2(x * 5, y * 7 + seed) < 0.12) grid[y][x] = 'I';
      else if (hash2(x * 11, y * 3 + seed) < 0.14) grid[y][x] = 'L';
      else grid[y][x] = 'i';
    }
  }

  return grid.map((row) => row.join(''));
}

// ---- what they brought with them ------------------------------------------
// Sized so they sit right next to a 32px seated character: no prop is taller
// than about two thirds of a person.

// Woven hamper with a handle and a cloth folded over the rim. Replaces the old
// loaf-shaped basket, which read as a log parked beside her.
export const PICNIC_BASKET = [
  '.....oooo.....',
  '...oonnnnoo...',
  '..on......no..',
  '..on......no..',
  '.oooooooooooo.',
  'oQQQQQQQQQQQQo',
  'onNnNnNnNnNnNo',
  'oNnNnNnNnNnNno',
  'onNnNnNnNnNnNo',
  'oNnNnNnNnNnNno',
  '.oNNNNNNNNNNo.',
  '..oooooooooo..',
];

// Two sponge layers, jam between, pink frosting, one cherry.
export const CAKE = [
  '.....rr.....',
  '..oooooooo..',
  '.oddddddddo.',
  '.oDDDDDDDDo.',
  '.oQQQQQQQQo.',
  '.oddddddddo.',
  '.oQQQQQQQQo.',
  '.oQQQQQQQQo.',
  '.oooooooooo.',
];

// Seen side-on, stacked. The first attempt was a cream triangle with the
// filling buried inside it, which at this size read as a rice ball — bread has
// to be its own colour with the filling banded between, and the lettuce has to
// poke out past the bread for the shape to say "sandwich".
// Sized to the cake's body (10x8 drawn, 20x16 on screen) so the two sit
// together without one looming over the other.
export const SANDWICH = [
  '..oooooo..',
  '.oSSSSSSo.',
  '.osssssso.',
  'oVVVVVVVVo',
  '.orrrrrro.',
  '.osssssso.',
  '.oSSSSSSo.',
  '..oooooo..',
];

// Centrepiece: two cut roses in a glass jar. Her flowers, on the table.
export const ROSE_JAR = [
  '..CC..CC..',
  '.CCCC.CCCC',
  '.CECC.CCEC',
  '..CC..CC..',
  '...V..V...',
  '...V..V...',
  '....VV....',
  '..oooooo..',
  '.oAAAAAAo.',
  '.oAAAAAAo.',
  '.oaaaaaao.',
  '.oaaaaaao.',
  '..oooooo..',
];

export const CUP = [
  '.oooo.',
  '.orro.',
  '.orro.',
  '.oQQo.',
  '.oQQo.',
  '..oo..',
  '.oooo.',
];

// Reeds at the water's edge.
export const REEDS = [
  '...L....',
  '..LV....',
  '..L.V...',
  '.LV.V...',
  '.L..V.L.',
  '.L..V.L.',
  '.L..VVL.',
  '.L..VVL.',
  '.LV.VV..',
  '..VVVV..',
  '..VVVV..',
  '...VV...',
];

// Lily pads, plain and in bloom.
export const LILYPAD = [
  '...LLLL...',
  '.LLVVVVLL.',
  'LLVVVVVL..',
  'LLVVVVV...',
  '.LLVVVVLL.',
  '...LLLL...',
];

export const LILYPAD_BLOOM = [
  '...LLLL...',
  '.LLVddVLL.',
  'LLVdrdVL..',
  'LLVVddV...',
  '.LLVVVLL..',
  '...LLLL...',
];

// The redraw, from the reference: rounder and top-heavy, with the pale muzzle
// as a proper oval around the nose and mouth rather than the old thin bib, and
// the paws brought together at the front. Same 18x18 box, so nothing that
// positions an otter has to move. Whiskers still poke past the cheeks — at this
// size they are most of what separates an otter from a bear.
const OTTER_PLUSH = [
  '.....oooooooo.....',
  '...ooKKKKKKKKoo...',
  '..oKKKKKKKKKKKKo..',
  '.oKKKKKKKKKKKKKKo.',
  '.oKKKKKKKKKKKKKKo.',
  '.oKKeeKKKKKKeeKKo.',
  '.oKKeeKKKKKKeeKKo.',
  '.oKKKKKKKKKKKKKKo.',
  'o.oKKKQQQQQQKKKo.o',
  'o.oKKQQQeeQQQKKo.o',
  '.oKKKQQQrrQQQKKKo.',
  '.oKKKKQQQQQQKKKKo.',
  '..oKKKKKKKKKKKKo..',
  '...oKKKKKKKKKKo...',
  '...oKKQQQQQQKKo...',
  '...oKKQQQQQQKKo...',
  '...oKKKQQQQKKKo...',
  '....oXXXooXXXo....',
];

export const OTTER_SWIM =
  CRITTER_STYLE === 'plush'
    ? [OTTER_PLUSH, shiftDown(OTTER_PLUSH, 1)]
    : [OTTER_A, shiftDown(OTTER_A, 1)];

// Rasterised ellipse, so the pond has hard pixel edges like everything else
// rather than the smooth curve a Graphics circle would give.
export function pondGrid(w = 46, h = 26) {
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const d = ((x - cx) / (w / 2)) ** 2 + ((y - cy) / (h / 2)) ** 2;
      if (d > 1) row += '.';
      else if (d > 0.84) row += 'Z';
      else row += hash2(x * 3, y * 5) < 0.07 ? 'A' : 'a';
    }
    rows.push(row);
  }
  return rows;
}

// His little grin, popped above his head like the shock emote in the other
// intro so the beat is a face rather than a line of text.
export const SMILEY = [
  '..yyyyy..',
  '.yyyyyyy.',
  'yyoyyyoyy',
  'yyyyyyyyy',
  'yyyyyyyyy',
  'yoyyyyyoy',
  'yyoooooyy',
  '.yyyyyyy.',
  '..yyyyy..',
];

// Ring drawn around her while a shield is up. Hollow so she stays readable.
export function shieldRing(size = 26) {
  const c = (size - 1) / 2;
  const r = size / 2;
  const rows = [];
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      row += d > r - 0.5 || d < r - 2.5 ? '.' : 'm';
    }
    rows.push(row);
  }
  return rows;
}

// A stray space is a transparent hole that PixelArt's row-length check cannot
// catch, so fail loudly at boot instead. This lives at the very bottom because
// the flat bundle shares one scope and reaching a `const` early is a TDZ error.
[
  ...CAT_A,
  ...CAT_SIT_A,
  ...CAT_SIT_B,
  ...CAT_B,
  ...RING,
  ...OTTER_A,
  ...OTTER_PLUSH,
  ...ROSE_RED,
  ...ROSE_WHITE,
  ...SMILEY,
  ...REEDS,
  ...LILYPAD,
  ...LILYPAD_BLOOM,
  ...PICNIC_BASKET,
  ...CAKE,
  ...SANDWICH,
  ...CUP,
  ...ROSE_JAR,
].forEach((row) => {
  if (row.includes(' ')) throw new Error(`[jory] sprite row contains a space: "${row}"`);
});

export const HEART = [
  '..rr...rr..',
  '.rwrr.rrrr.',
  'rwrrrrrrrrr',
  'rrrrrrrrrrr',
  'rrrrrrrrrrr',
  '.RRRRRRRRR.',
  '..RRRRRRR..',
  '...RRRRR...',
  '....RRR....',
  '.....R.....',
];

// Blade points up; the sprite is rotated in-engine to match the swing direction.
export const SWORD = [
  '..mm..',
  '.mmmm.',
  '.mMmm.',
  '.mMmm.',
  '.mMmm.',
  '.mMmm.',
  '.mMmm.',
  '.mMmm.',
  '.mMmm.',
  'kkkkkk',
  'kkkkkk',
  '..nn..',
  '..nn..',
  '..nN..',
  '..nn..',
  '.kkkk.',
];

// Crescent that arcs across the front of a swing.
export const SLASH = [
  '.....wwww.....',
  '..wwwwwwwwww..',
  '.wwww....wwww.',
  '.WW........WW.',
  '.W..........W.',
];

export const DOOR_LOCKED = [
  'oooooooooooooooo',
  'oYYYYYYYYYYYYYYo',
  'oYyyyyyyyyyyyyYo',
  'oYyooooooooooyYo',
  'oYyoUUUUUUUUoyYo',
  'oYyoUUUUUUUUoyYo',
  'oYyoUUUkkUUUoyYo',
  'oYyoUUkkkkUUoyYo',
  'oYyoUUkkkkUUoyYo',
  'oYyoUUUkkUUUoyYo',
  'oYyoUUUUUUUUoyYo',
  'oYyoUUUUUUUUoyYo',
  'oYyooooooooooyYo',
  'oYyyyyyyyyyyyyYo',
  'oYYYYYYYYYYYYYYo',
  'oooooooooooooooo',
];

export const DOOR_OPEN = [
  'oooooooooooooooo',
  'oyyyyyyyyyyyyyyo',
  'oykkkkkkkkkkkkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykzzzzzzzzzzkyo',
  'oykkkkkkkkkkkkyo',
  'oyyyyyyyyyyyyyyo',
  'oooooooooooooooo',
];

// Picnic blanket: a checked prop, generated so the weave stays square.
export function makeBlanket(w = 32, h = 24, check = 4) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (edge) row += 'o';
      else row += (Math.floor(x / check) + Math.floor(y / check)) % 2 ? 'Q' : 'q';
    }
    rows.push(row);
  }
  return rows;
}

export const FLOWER = [
  '..w.w..',
  '.wywyw.',
  '.wyyyw.',
  '..wyw..',
  '...F...',
  '...F...',
  '..FFF..',
];

export const BUSH = [
  '....oooooo....',
  '..ooFFFFFFoo..',
  '.oFFffFFFFFFo.',
  'oFFffFFFFFFFFo',
  'oFFFFFFFFFFFFo',
  'oFFFFFFFFFFFFo',
  '.oFFFFFFFFFFo.',
  '..oFFFFFFFFo..',
  '...oooooooo...',
];

export const BASKET = [
  '..oooooooooo..',
  '.onnnnnnnnnno.',
  'onNnNnNnNnNnNo',
  'onnnnnnnnnnnno',
  'oNnNnNnNnNnNno',
  'onnnnnnnnnnnno',
  'onNnNnNnNnNnNo',
  '.onnnnnnnnnno.',
  '..oooooooooo..',
];

// Little "!" bubble for the girl's reaction beat — a beat of shock, not narration.
export const SHOCK = [
  '..oooooooo..',
  '.owwwwwwwwo.',
  'owwwwoowwwwo',
  'owwwwoowwwwo',
  'owwwwoowwwwo',
  'owwwwwwwwwwo',
  'owwwwoowwwwo',
  '.owwwwwwwwo.',
  '..oooooo....',
  '...oo.......',
];

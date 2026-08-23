import { recolor, shiftDown } from '../PixelArt.js';

// One 14x12 blob body, re-tinted per tier via palette overrides rather than
// re-authored. 'g'/'G'/'l' are the swappable body colours.
export const BLOB_IDLE = [
  [
    '....oooooo....',
    '..ooggggggoo..',
    '.oggllllggggo.',
    'ogglllllgggggo',
    'oggggggggggggo',
    'oggeggggggeggo',
    'oggeggggggeggo',
    'oggggggggggggo',
    'oggggwwwwggggo',
    'oGGGGGGGGGGGGo',
    '.oGGGGGGGGGGo.',
    '..oooooooooo..',
  ],
  [
    '..............',
    '....oooooo....',
    '..ooggggggoo..',
    '.oggllllggggo.',
    'ogglllllgggggo',
    'oggeggggggeggo',
    'oggeggggggeggo',
    'oggggggggggggo',
    'oggggwwwwggggo',
    'oGGGGGGGGGGGGo',
    'oGGGGGGGGGGGGo',
    '.oooooooooooo.',
  ],
];

// Angry squint used while chasing, so the player can read aggro at a glance.
export const BLOB_CHASE = BLOB_IDLE.map((f) =>
  f.map((row) => row.replace('oggeggggggeggo', 'oggeeggggeeggo')),
);

export const BLOB_HIT = [recolor(BLOB_IDLE[0], { g: 'w', G: 'W', l: 'w', e: 'o' })];

export const BLOB_DEATH = [
  [
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '...oooooooo...',
    '..oggggggggo..',
    '.oggggggggggo.',
    '.oGGGGGGGGGGo.',
    '..oooooooooo..',
    '..............',
  ],
  [
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '....oooooo....',
    '...oGGGGGGo...',
    '....oooooo....',
    '..............',
  ],
  [
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..............',
    '..G........G..',
    '.....G..G.....',
    '..............',
  ],
];

// 24x20 boss. Bigger, meaner eyes, permanent scowl.
export const BOSS_IDLE = [
  [
    '........oooooooo........',
    '.....ooogggggggooo......',
    '...oogggllllllgggggoo...',
    '..ogggllllllllggggggo...',
    '.oggglllllllllgggggggo..',
    '.oggggggggggggggggggggo.',
    'oggggggggggggggggggggggo',
    'oggggeeggggggggggeeggggo',
    'oggggeeggggggggggeeggggo',
    'oggggggggggggggggggggggo',
    'oggggggwwwwwwwwwwggggggo',
    'ogggggggwwwwwwwwgggggggo',
    'oggggggggggggggggggggggo',
    'oGGGGGGGGGGGGGGGGGGGGGGo',
    'oGGGGGGGGGGGGGGGGGGGGGGo',
    '.oGGGGGGGGGGGGGGGGGGGGo.',
    '.oGGGGGGGGGGGGGGGGGGGGo.',
    '..oGGGGGGGGGGGGGGGGGGo..',
    '...ooGGGGGGGGGGGGGGoo...',
    '...oooooooooooooooooo...',
  ],
];

BOSS_IDLE.push([
  '........................',
  '........oooooooo........',
  '.....ooogggggggooo......',
  '...oogggllllllgggggoo...',
  '..ogggllllllllggggggo...',
  '.oggglllllllllgggggggo..',
  'oggggggggggggggggggggggo',
  'oggggeeggggggggggeeggggo',
  'oggggeeggggggggggeeggggo',
  'oggggggggggggggggggggggo',
  'oggggggwwwwwwwwwwggggggo',
  'ogggggggwwwwwwwwgggggggo',
  'oggggggggggggggggggggggo',
  'oGGGGGGGGGGGGGGGGGGGGGGo',
  'oGGGGGGGGGGGGGGGGGGGGGGo',
  'oGGGGGGGGGGGGGGGGGGGGGGo',
  '.oGGGGGGGGGGGGGGGGGGGGo.',
  '..oGGGGGGGGGGGGGGGGGGo..',
  '...ooGGGGGGGGGGGGGGoo...',
  '...oooooooooooooooooo...',
]);

// Eyes screwed shut, mouth thrown wide: the tell before it charges.
const BOSS_EYES_OPEN = 'oggggeeggggggggggeeggggo';
const BOSS_EYES_SHUT = 'oggggggggggggggggggggggo';
export const BOSS_WINDUP = [
  BOSS_IDLE[0].map((row) =>
    row
      .replace(BOSS_EYES_OPEN, BOSS_EYES_SHUT)
      .replace('oggggggwwwwwwwwwwggggggo', 'oggggwwwwwwwwwwwwwwggggo')
      .replace('ogggggggwwwwwwwwgggggggo', 'oggggwwwwwwwwwwwwwwggggo'),
  ),
];

export const BOSS_HIT = [recolor(BOSS_IDLE[0], { g: 'w', G: 'W', l: 'w', e: 'o' })];

export const BOSS_DEATH = [
  BOSS_IDLE[1],
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '.....oooooooooooooo.....',
    '...ooggggggggggggggoo...',
    '..oggggggggggggggggggo..',
    '..oggggeeggggggeeggggo..',
    '..oggggggggggggggggggo..',
    '..ogggggwwwwwwwwgggggo..',
    '..oGGGGGGGGGGGGGGGGGGo..',
    '..oGGGGGGGGGGGGGGGGGGo..',
    '...oGGGGGGGGGGGGGGGGo...',
    '....oooooooooooooooo....',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........oooooooo........',
    '.....oooGGGGGGGGooo.....',
    '....oGGGGGGGGGGGGGGo....',
    '....oGGGGGGGGGGGGGGo....',
    '.....oooGGGGGGGGooo.....',
    '........oooooooo........',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
  [
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '.....G...........G......',
    '.........G...G..........',
    '...G..................G.',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
    '........................',
  ],
];

// 28x24 final boss for the "I love you Jory" run. Crowned, a good head taller
// than the level 3 boss, and with lit eyes ('r') rather than the flat dark ones
// so it reads as a different creature and not a recoloured repeat.
export const FINAL_IDLE = [
  [
    '........y....y.....y........',
    '.......yyy..yyy...yyy.......',
    '......yyyyyyyyyyyyyyyy......',
    '......YYYYYYYYYYYYYYYY......',
    '.......oooooooooooooo.......',
    '.....oooggggggggggggooo.....',
    '...oogggglllllllllggggggoo..',
    '..ogggglllllllllllggggggggo.',
    '.oggggglllllllllllgggggggggo',
    'oggggggggggggggggggggggggggo',
    'oggggrrggggggggggggrrggggggo',
    'oggggrrggggggggggggrrggggggo',
    'oggggggggggggggggggggggggggo',
    'oggggggwwwwwwwwwwwwwwggggggo',
    'ogggggggwwwwwwwwwwwwgggggggo',
    'oggggggggggggggggggggggggggo',
    'oGGGGGGGGGGGGGGGGGGGGGGGGGGo',
    'oGGGGGGGGGGGGGGGGGGGGGGGGGGo',
    'oGGGGGGGGGGGGGGGGGGGGGGGGGGo',
    '.oGGGGGGGGGGGGGGGGGGGGGGGGo.',
    '.oGGGGGGGGGGGGGGGGGGGGGGGGo.',
    '..oGGGGGGGGGGGGGGGGGGGGGGo..',
    '...ooGGGGGGGGGGGGGGGGGGoo...',
    '....oooooooooooooooooooo....',
  ],
];

FINAL_IDLE.push(shiftDown(FINAL_IDLE[0], 1));

const FINAL_EYES_OPEN = 'oggggrrggggggggggggrrggggggo';
const FINAL_EYES_SHUT = 'oggggggggggggggggggggggggggo';

// Eyes screwed shut, jaw thrown wide — the charge tell, same grammar as the
// level 3 boss so anyone who has fought that one can read this one.
export const FINAL_WINDUP = [
  FINAL_IDLE[0].map((row) =>
    row
      .replace(FINAL_EYES_OPEN, FINAL_EYES_SHUT)
      .replace('oggggggwwwwwwwwwwwwwwggggggo', 'oggggwwwwwwwwwwwwwwwwwwggggo')
      .replace('ogggggggwwwwwwwwwwwwgggggggo', 'oggggwwwwwwwwwwwwwwwwwwggggo'),
  ),
];

// Eyes blanked white: the separate tell for the slam, which hits in a ring
// rather than in a line.
export const FINAL_SLAM = [
  FINAL_IDLE[0].map((row) => row.replace(FINAL_EYES_OPEN, 'oggggwwggggggggggggwwggggggo')),
];

export const FINAL_HIT = [recolor(FINAL_IDLE[0], { g: 'w', G: 'W', l: 'w', r: 'o' })];

export const FINAL_DEATH = [
  FINAL_IDLE[1],
  FINAL_IDLE[0].map((row) => row.replace(FINAL_EYES_OPEN, FINAL_EYES_SHUT)),
  [
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '......oooooooooooooooo......',
    '....ooggggggggggggggggoo....',
    '...oggggggggggggggggggggo...',
    '...oggggrrgggggggggrrgggo...',
    '...oggggggggggggggggggggo...',
    '...ogggggwwwwwwwwwwwwgggo...',
    '...oGGGGGGGGGGGGGGGGGGGGo...',
    '...oGGGGGGGGGGGGGGGGGGGGo...',
    '....ooGGGGGGGGGGGGGGGGoo....',
    '......oooooooooooooooo......',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
  ],
  [
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '..........oooooooo..........',
    '........ooggggggggoo........',
    '.......oggggggggggggo.......',
    '.......oggggggggggggo.......',
    '.......oGGGGGGGGGGGGo.......',
    '........ooGGGGGGGGoo........',
    '..........oooooooo..........',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
  ],
  [
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '..........l......l..........',
    '.......l...........l........',
    '............................',
    '.....l..................l...',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
    '............................',
  ],
];

// All character art is 16x16 grids. Side-facing art is drawn facing right and
// flipped in-engine for left. Walk cycles reuse the idle torso and only swap the
// two leg rows, which keeps the amount of hand-authored art manageable.

export const GIRL_HEAD_DOWN = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhsssshho...',
  '...ohsessesho...',
  '...ohssssssho...',
  '...ohssssssho...',
  '...oHssssssHo...',
];

export const GIRL_HEAD_UP = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...oHHHHHHHHo...',
];

export const GIRL_HEAD_SIDE = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhsssso...',
  '...ohhhhsesso...',
  '...ohhhhsssso...',
  '...ohhhssssso...',
  '...oHHsssssso...',
];

// Bodies carry no hair at all. Long styles paint their fall into the empty
// margin around this silhouette (see the spill masks in lookData), which keeps
// the hair from ever cutting into the dress or the arms.
export const GIRL_BODY_FRONT = [
  '...oddddddddo...',
  '..osddddddddso..',
  '..osddddddddso..',
  '..oddddddddddo..',
  '.oddddddddddddo.',
  '.oDDDDDDDDDDDDo.',
];

export const GIRL_BODY_SIDE = [
  '...odddddddddo..',
  '..osddddddddsso.',
  '..osddddddddsso.',
  '..oddddddddddo..',
  '.oddddddddddddo.',
  '.oDDDDDDDDDDDDo.',
];

export const LEGS_FRONT_IDLE = ['.....ss..ss.....', '....vvv..vvv....'];
export const LEGS_FRONT_A = ['....sss..ss.....', '...vvv....vv....'];
export const LEGS_FRONT_B = ['.....ss..sss....', '....vv....vvv...'];

export const LEGS_SIDE_IDLE = ['......ssss......', '.....vvvvv......'];
export const LEGS_SIDE_A = ['.....sss.ss.....', '....vvv...vv....'];
export const LEGS_SIDE_B = ['.....ss.sss.....', '....vv...vvv....'];

export const build = (head, body, legs) => [...head, ...body, ...legs];

export const walkCycle = (head, body, a, b, idle) => [
  build(head, body, a),
  build(head, body, idle),
  build(head, body, b),
  build(head, body, idle),
];

export const GIRL = {
  down: {
    idle: [build(GIRL_HEAD_DOWN, GIRL_BODY_FRONT, LEGS_FRONT_IDLE)],
    walk: walkCycle(GIRL_HEAD_DOWN, GIRL_BODY_FRONT, LEGS_FRONT_A, LEGS_FRONT_B, LEGS_FRONT_IDLE),
  },
  up: {
    idle: [build(GIRL_HEAD_UP, GIRL_BODY_FRONT, LEGS_FRONT_IDLE)],
    walk: walkCycle(GIRL_HEAD_UP, GIRL_BODY_FRONT, LEGS_FRONT_A, LEGS_FRONT_B, LEGS_FRONT_IDLE),
  },
  side: {
    idle: [build(GIRL_HEAD_SIDE, GIRL_BODY_SIDE, LEGS_SIDE_IDLE)],
    walk: walkCycle(GIRL_HEAD_SIDE, GIRL_BODY_SIDE, LEGS_SIDE_A, LEGS_SIDE_B, LEGS_SIDE_IDLE),
  },
  // Story-scene poses are drawn slimmer than the gameplay walk sprites — a
  // seated figure at the gameplay torso width reads as a blob.
  sit: [
    ...GIRL_HEAD_DOWN,
    '..h.oddddddo.h..',
    '..hsoddddddosh..',
    '...soddddddos...',
    '...oddddddddo...',
    '...oDDDDDDDDo...',
    '...osssssssso...',
    '...osssssssso...',
    '....vvv..vvv....',
  ],
  cheer: [
    '.....oooooo.....',
    '....ohhhhhho....',
    '...ohhhhhhhho...',
    '...ohhsssshho...',
    '...ohsessesho...',
    '...ohssssssho...',
    's..ohssssssho..s',
    'so.oHssssssHo.os',
    '.so.oddddddo.os.',
    '..h.oddddddo.h..',
    '....oddddddo....',
    '...oddddddddo...',
    '...oDDDDDDDDo...',
    '....oDDDDDDo....',
    '....ss....ss....',
    '....vv....vv....',
  ],
};

const BOY_HEAD_DOWN = [
  '.....oooooo.....',
  '....ojjjjjjo....',
  '...ojjjjjjjjo...',
  '...ojjssssjjo...',
  '...ossessesso...',
  '...osssssssso...',
  '....osssssso....',
  '....oSssssSo....',
];

const BOY_HEAD_SHUT = [
  '.....oooooo.....',
  '....ojjjjjjo....',
  '...ojjjjjjjjo...',
  '...ojjssssjjo...',
  '...osxxssxxso...',
  '...osssssssso...',
  '....osssssso....',
  '....oSssssSo....',
];

const BOY_HEAD_SIDE = [
  '.....oooooo.....',
  '....ojjjjjjo....',
  '...ojjjjjjjjo...',
  '...ojjjjsssso...',
  '...ojjjjsesso...',
  '...ojjjssssso...',
  '....ojjsssso....',
  '....oJJsssso....',
];

const BOY_BODY_FRONT = [
  '..obbbbbbbbbbo..',
  '.osbbbbbbbbbbso.',
  '.osbbbbbbbbbbso.',
  '..oBBBBBBBBBBo..',
  '..oppppppppppo..',
  '..opppp..ppppo..',
];

const BOY_LEGS_IDLE = ['...ppp....ppp...', '..vvvv....vvvv..'];
const BOY_LEGS_A = ['..pppp....ppp...', '.vvvv.....vvvv..'];
const BOY_LEGS_B = ['...ppp....pppp..', '..vvvv.....vvvv.'];

export const BOY = {
  down: {
    idle: [build(BOY_HEAD_DOWN, BOY_BODY_FRONT, BOY_LEGS_IDLE)],
    walk: walkCycle(BOY_HEAD_DOWN, BOY_BODY_FRONT, BOY_LEGS_A, BOY_LEGS_B, BOY_LEGS_IDLE),
  },
  side: {
    idle: [build(BOY_HEAD_SIDE, BOY_BODY_FRONT, BOY_LEGS_IDLE)],
  },
  sit: [
    ...BOY_HEAD_DOWN,
    '....obbbbbbo....',
    '...sobbbbbbos...',
    '...sobbbbbbos...',
    '....oBBBBBBo....',
    '...oppppppppo...',
    '...osssssssso...',
    '...osssssssso...',
    '....vvv..vvv....',
  ],
  // Eyes shut, arms limp. Rotated flat in-engine once he goes down.
  limp: [
    ...BOY_HEAD_SHUT,
    '....obbbbbbo....',
    '..s.obbbbbbo.s..',
    '...sobbbbbbos...',
    '....oBBBBBBo....',
    '....oppppppo....',
    '....opp..ppo....',
    '.....pp..pp.....',
    '.....vv..vv.....',
  ],
  cheer: [
    ...BOY_HEAD_DOWN.slice(0, 6),
    's...osssssso...s',
    'so..oSssssSo..os',
    '.so.obbbbbbo.os.',
    '....obbbbbbo....',
    '....obbbbbbo....',
    '....oBBBBBBo....',
    '....oppppppo....',
    '....opp..ppo....',
    '.....pp..pp.....',
    '.....vv..vv.....',
  ],
};

// Easy mode's companion. It reuses the boy's own head so the player reads it as
// him and not as a generic spirit; the body trails off into a scalloped tail
// instead of legs. Drawn in plain whites and tinted cold in-engine.
const GHOST_TAIL_A = '.OwOwwOwwOwwOwO.';
const GHOST_TAIL_B = '.OwwOwwOwwOwwwO.';

const GHOST_BODY = [
  '..OwwwwwwwwwwO..',
  '.OwwwwwwwwwwwwO.',
  '.OwwWwwwwwwWwwO.',
  '.OwwwwwwwwwwwwO.',
  '.OwwwwwwwwwwwwO.',
  '.OwwWwwwwwwwWwO.',
  '.OwwwwwwwwwwwwO.',
];

export const GHOST = {
  float: [
    [...BOY_HEAD_DOWN, ...GHOST_BODY, GHOST_TAIL_A],
    [...BOY_HEAD_DOWN, ...GHOST_BODY, GHOST_TAIL_B],
  ],
};

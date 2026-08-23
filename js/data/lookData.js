import {
  GIRL_HEAD_DOWN,
  GIRL_HEAD_UP,
  GIRL_HEAD_SIDE,
  GIRL_BODY_FRONT,
  GIRL_BODY_SIDE,
  LEGS_FRONT_IDLE,
  LEGS_FRONT_A,
  LEGS_FRONT_B,
  LEGS_SIDE_IDLE,
  LEGS_SIDE_A,
  LEGS_SIDE_B,
} from '../gfx/sprites/characters.js';

// Everything the player can pick. Colours are palette overrides on the existing
// grids — the same trick the blob tiers use — so only the shapes need new art.

// ---- hair -----------------------------------------------------------------

// Long needs its own heads for one reason: on the plain head the hair on top
// sits INSIDE the head outline while the hair down the sides sits OUTSIDE it,
// so the outline runs between them and they never join. Two masses that do not
// connect to the hair on her head read as two ponytails, no matter how wide
// they are. Row 2 here is a full-width bridge — the hair crosses the outline
// once, at the crown, and everything below hangs off it as one curtain.
// The head's own side outline is dropped on these rows and filled with hair
// instead. That dark vertical pixel was splitting the outer fall from the hair
// framing her face, which is what still read as a separate tail either side.
// Two pixels down each side of the face, with the crown stepping out a pixel
// per row (6, 8, 8, 10) so the corners stay rounded rather than square.
const LONG_DOWN = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '....hhhhhhhh....',
  '...hhhsssshhh...',
  '...hhsesseshh...',
  '...hhsssssshh...',
  '...hhsssssshh...',
  '...hHssssssHh...',
];

const LONG_UP = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hHHHHHHHHh...',
];

const LONG_SIDE = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '....hhhhhhhh....',
  '...hhhhhsssso...',
  '...hhhhhsesso...',
  '...hhhhhsssso...',
  '...hhhhssssso...',
  '...hHHsssssso...',
];

// The fall picks up exactly where the head's side hair leaves off, so the
// curtain runs unbroken from the crown to the tip. Painted only into
// transparent pixels, so the dress and arms stay intact.
const LONG_SPILL_FRONT = [
  '.hh..........hh.',
  '.hh..........hh.',
  'hhh..........hhh',
  '.hh..........hh.',
  '..H..........H..',
];

const LONG_SPILL_SIDE = [
  '.hh.............',
  '.hh.............',
  'hhh.............',
  '.hh.............',
  '..H.............',
];

// Bob: hair sits on top of the head only, so the face is wider and it does not
// spill onto the shoulders.
const BOB_DOWN = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ossessesso...',
  '...osssssssso...',
  '...osssssssso...',
  '...oSssssssSo...',
];

const BOB_UP = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...osssssssso...',
  '...oSssssssSo...',
];

const BOB_SIDE = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhsssso...',
  '...ohhsssesso...',
  '...osssssssso...',
  '...osssssssso...',
  '...oSssssssso...',
];

// Ponytail: bob-length at the front with a tail gathered out to one side.
const TAIL_DOWN = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho.h.',
  '...ohhhhhhhhohh.',
  '...ossessessohh.',
  '...osssssssso.h.',
  '...osssssssso...',
  '...oSssssssSo...',
];

const TAIL_UP = [
  '.....oooooo.....',
  '....ohhhhhho....',
  '...ohhhhhhhho.h.',
  '...ohhhhhhhhohh.',
  '...ohhhhhhhhohh.',
  '...ohhhhhhhho.h.',
  '...ohhhhhhhho...',
  '...oHHHHHHHHo...',
];

const TAIL_SIDE = [
  '.....oooooo.....',
  '..h.ohhhhhho....',
  '.hh.ohhhhhhho...',
  '.hh.ohhhsssso...',
  '.hh.ohhsssesso..',
  '..h.osssssssso..',
  '...osssssssso...',
  '...oSssssssso...',
];

// Buns: two knots on top, short at the back.
const BUNS_DOWN = [
  '..hh.oooooo.hh..',
  '..hhohhhhhhohh..',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ossessesso...',
  '...osssssssso...',
  '...osssssssso...',
  '...oSssssssSo...',
];

const BUNS_UP = [
  '..hh.oooooo.hh..',
  '..hhohhhhhhohh..',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...ohhhhhhhho...',
  '...osssssssso...',
  '...oSssssssSo...',
];

const BUNS_SIDE = [
  '..hh.oooooo.....',
  '..hhohhhhhho....',
  '...ohhhhhhhho...',
  '...ohhhhsssso...',
  '...ohhsssesso...',
  '...osssssssso...',
  '...osssssssso...',
  '...oSssssssso...',
];

// Only the long style declares a spill; the shorter cuts end at the jaw.
export const HAIR_STYLES = [
  {
    id: 'long',
    name: 'LONG',
    heads: { down: LONG_DOWN, up: LONG_UP, side: LONG_SIDE },
    spillFront: LONG_SPILL_FRONT,
    spillSide: LONG_SPILL_SIDE,
  },
  { id: 'bob', name: 'BOB', heads: { down: BOB_DOWN, up: BOB_UP, side: BOB_SIDE } },
  {
    id: 'tail',
    name: 'PONYTAIL',
    heads: { down: TAIL_DOWN, up: TAIL_UP, side: TAIL_SIDE },
  },
  {
    id: 'buns',
    name: 'BUNS',
    heads: { down: BUNS_DOWN, up: BUNS_UP, side: BUNS_SIDE },
  },
];

// ---- outfits --------------------------------------------------------------

const hem = (body, rows) => [...body.slice(0, 4), ...rows];

// Straight hem with shorts underneath.
const TUNIC_FRONT = hem(GIRL_BODY_FRONT, ['..oddddddddddo..', '..oDDDDDDDDDDo..']);
const TUNIC_SIDE = hem(GIRL_BODY_SIDE, ['..oddddddddddo..', '..oDDDDDDDDDDo..']);
const TUNIC_LEGS_FRONT = {
  idle: ['....pss..ssp....', '....vvv..vvv....'],
  a: ['...psss..ssp....', '...vvv....vv....'],
  b: ['....pss..sssp...', '....vv....vvv...'],
};
const TUNIC_LEGS_SIDE = {
  idle: ['.....pssssp.....', '.....vvvvv......'],
  a: ['....psss.ssp....', '....vvv...vv....'],
  b: ['....pss.sssp....', '....vv...vvv....'],
};

// Floor-length: the hem replaces the legs entirely and sways as she walks.
const GOWN_FRONT = hem(GIRL_BODY_FRONT, ['.oddddddddddddo.', 'oddddddddddddddo']);
const GOWN_SIDE = hem(GIRL_BODY_SIDE, ['.oddddddddddddo.', 'oddddddddddddddo']);
const GOWN_LEGS = {
  idle: ['oDDDDDDDDDDDDDDo', '.oooooooooooooo.'],
  a: ['oDDDDDDDDDDDDDDo', 'ooooooooooooooo.'],
  b: ['oDDDDDDDDDDDDDDo', '.ooooooooooooooo'],
};

// Off-shoulder crop top over baggy denim. The top follows the outfit colour
// like every other garment (pick WINE for the reference look); the jeans stay
// denim blue whatever is chosen, since that is the point of the preset.
// Bare shoulders on the first row and a bare midriff at the waist are what
// make the neckline read as off-shoulder at this size.
// Full-length top: only the shoulders are bare, which is what carries the
// off-shoulder neckline. Hips are held to the same width as the torso — the
// first pass flared them to the dress's skirt width, which with wide legs
// below gave her no waist at all.
// Sleeves run down the first two rows and her hands come out at the cuff on
// the third — the first pass made the whole arm sleeve-coloured and left her
// with no hands at all.
const DENIM_FRONT = [
  '...osssssssso...',
  '..oDddddddddDo..',
  '..oDddddddddDo..',
  '..osddddddddso..',
  '..o1111111111o..',
  '..o1111111111o..',
];

const DENIM_SIDE = [
  '...ossssssssso..',
  '..oDddddddddDDo.',
  '..oDddddddddDDo.',
  '..osddddddddsso.',
  '..o1111111111o..',
  '..o1111111111o..',
];

// Loose but not enormous, and tapering in from the hips so she keeps a shape.
// The hem is the darker denim, breaking over the shoe.
const DENIM_LEGS = {
  idle: ['....111..111....', '....222..222....'],
  a: ['...111..111.....', '...222..222.....'],
  b: ['.....111..111...', '.....222..222...'],
};

export const OUTFITS = [
  {
    id: 'dress',
    name: 'DRESS',
    front: GIRL_BODY_FRONT,
    side: GIRL_BODY_SIDE,
    legsFront: { idle: LEGS_FRONT_IDLE, a: LEGS_FRONT_A, b: LEGS_FRONT_B },
    legsSide: { idle: LEGS_SIDE_IDLE, a: LEGS_SIDE_A, b: LEGS_SIDE_B },
  },
  {
    id: 'tunic',
    name: 'TUNIC',
    front: TUNIC_FRONT,
    side: TUNIC_SIDE,
    legsFront: TUNIC_LEGS_FRONT,
    legsSide: TUNIC_LEGS_SIDE,
  },
  {
    id: 'gown',
    name: 'GOWN',
    front: GOWN_FRONT,
    side: GOWN_SIDE,
    legsFront: GOWN_LEGS,
    legsSide: GOWN_LEGS,
  },
  {
    id: 'denim',
    // Short enough to sit between the arrows; the font has no '+' either.
    name: 'DENIM',
    front: DENIM_FRONT,
    side: DENIM_SIDE,
    legsFront: DENIM_LEGS,
    legsSide: DENIM_LEGS,
  },
];

// ---- colours --------------------------------------------------------------

export const HAIR_COLORS = [
  { name: 'BROWN', h: '#7b4a24', H: '#5d3418' },
  { name: 'BLACK', h: '#3a3038', H: '#242028' },
  { name: 'BLONDE', h: '#e8c268', H: '#b8933c' },
  { name: 'GINGER', h: '#d1663a', H: '#a04424' },
  { name: 'CHERRY', h: '#e8557f', H: '#b83a5e' },
  { name: 'SILVER', h: '#d8d8e2', H: '#a8a8b8' },
  { name: 'MINT', h: '#7ed9c0', H: '#4f9c8a' },
  { name: 'VIOLET', h: '#a87ed9', H: '#7a4fac' },
];

export const SKIN_TONES = [
  { name: 'FAIR', s: '#f8ddc0', S: '#dfba96' },
  { name: 'LIGHT', s: '#f6cba0', S: '#d9a377' },
  { name: 'WARM', s: '#e0a878', S: '#b8814f' },
  { name: 'TAN', s: '#b87d4e', S: '#8e5a31' },
  { name: 'DEEP', s: '#8a5a35', S: '#603a1f' },
  { name: 'RICH', s: '#5e3b22', S: '#3f2614' },
];

export const EYE_COLORS = [
  { name: 'DARK', e: '#241f2e' },
  // Hazel is the green-gold one, amber the copper one — at the first pass they
  // were both mid-brown and read as the same swatch twice.
  { name: 'HAZEL', e: '#7d7038' },
  { name: 'BLUE', e: '#3a6ea8' },
  { name: 'GREEN', e: '#3f8f4a' },
  { name: 'AMBER', e: '#c2701a' },
  { name: 'VIOLET', e: '#7a4fac' },
  { name: 'TEAL', e: '#2f8f8a' },
];

export const OUTFIT_COLORS = [
  { name: 'ROSE', d: '#e8557f', D: '#b83a5e' },
  { name: 'SKY', d: '#4a7ec7', D: '#2f5590' },
  { name: 'LEAF', d: '#6cc94a', D: '#40892c' },
  { name: 'GOLD', d: '#f0b429', D: '#b07d10' },
  { name: 'PLUM', d: '#b06bd9', D: '#7a3fac' },
  { name: 'EMBER', d: '#e05a4a', D: '#9c3226' },
  // Deep red, to match the off-shoulder top the denim outfit is based on.
  { name: 'WINE', d: '#b02a3f', D: '#7a172a' },
  { name: 'CREAM', d: '#e8e2d0', D: '#b8b0a0' },
  { name: 'COAL', d: '#3a3548', D: '#242030' },
];

export const DEFAULT_LOOK = {
  hair: 0,
  hairColor: 0,
  skin: 1,
  eyes: 0,
  outfit: 0,
  outfitColor: 0,
};

// Palette overrides for the current selection, ready to hand to makeSheet.
export function lookOverrides(look) {
  const hair = HAIR_COLORS[look.hairColor] ?? HAIR_COLORS[0];
  const skin = SKIN_TONES[look.skin] ?? SKIN_TONES[1];
  const eyes = EYE_COLORS[look.eyes] ?? EYE_COLORS[0];
  const outfit = OUTFIT_COLORS[look.outfitColor] ?? OUTFIT_COLORS[0];
  return {
    h: hair.h,
    H: hair.H,
    s: skin.s,
    S: skin.S,
    e: eyes.e,
    d: outfit.d,
    D: outfit.D,
  };
}

import { BLOB_STATS } from './levelData.js';

// One open arena, four pillars for cover, and a clear centre — the chest lands
// there at the end, so nothing may ever be built on it.
export const JORY_ARENA = [
  '###########',
  '#.........#',
  '#..#...#..#',
  '#.........#',
  '#.........#',
  '#.........#',
  '#.#.....#.#',
  '#.........#',
  '#.........#',
  '#.........#',
  '#.........#',
  '#.#.....#.#',
  '#.........#',
  '#.........#',
  '#.........#',
  '#..#...#..#',
  '#....P....#',
  '###########',
];

// Blobs in this run hit harder and take more killing than the ones in the
// story mode. Applied as a multiplier so the tiers stay in the same order.
const JORY_MUL = { hp: 1.45, speed: 1.12, damage: 1 };

export function joryStats(tier) {
  const base = BLOB_STATS[tier];
  return {
    ...base,
    hp: Math.round(base.hp * JORY_MUL.hp),
    speed: Math.round(base.speed * JORY_MUL.speed),
    damage: base.damage * JORY_MUL.damage,
    // They have to cross an open arena to reach her, so they commit from
    // anywhere on the map rather than idling until she wanders close.
    aggro: 9999,
  };
}

// Five waves. Counts and mix both climb; the last one is deliberately the
// longest so the boss arrives when she is already worn down.
export const WAVES = [
  { easy: 6 },
  { easy: 5, medium: 4 },
  { easy: 4, medium: 5, hard: 2 },
  { medium: 6, hard: 5 },
  { medium: 6, hard: 7 },
];

// Tiles blobs walk in from. All on the rim, away from where she starts.
export const SPAWN_TILES = [
  { col: 1, row: 1 }, { col: 5, row: 1 }, { col: 9, row: 1 },
  { col: 1, row: 4 }, { col: 9, row: 4 },
  { col: 1, row: 8 }, { col: 9, row: 8 },
  { col: 1, row: 12 }, { col: 9, row: 12 },
  { col: 2, row: 14 }, { col: 8, row: 14 },
];

export const FINAL_BOSS_STATS = {
  hp: 360,
  speed: 66,
  damage: 2,
  aggro: 9999,
  hitW: 70,
  hitH: 48,
  dodge: 0,
};

// One bubble every 11 seconds, gone again 6 seconds later. Nuke is the rare
// one; the other three are equally likely.
export const POWERUP_INTERVAL_MS = 11000;
export const POWERUP_LIFETIME_MS = 6000;
export const SHIELD_MS = 20000;
export const ALLY_MS = 20000;
export const ALLY_COUNT = 4;

// `label` is optional. The ally pickup deliberately has none: three blue blobs
// appearing around her says it better than a line of text does, and the hint
// only got in the way of watching them arrive.
export const POWERUPS = [
  { key: 'heal', texture: 'bubble_heal', weight: 30, label: 'FULL HEALTH' },
  { key: 'shield', texture: 'bubble_shield', weight: 30, label: 'SHIELDED' },
  { key: 'ally', texture: 'bubble_ally', weight: 30 },
  { key: 'nuke', texture: 'bubble_nuke', weight: 8, label: 'WIPED OUT' },
];

export function rollPowerUp() {
  const total = POWERUPS.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const p of POWERUPS) {
    roll -= p.weight;
    if (roll <= 0) return p;
  }
  return POWERUPS[0];
}

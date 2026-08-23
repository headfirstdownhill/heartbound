// Rooms are 11x18 character maps and each one is a single screen — no scrolling,
// so the player can always see every blob they still have to kill.
//   #  wall        .  floor       D  exit door
//   P  player start   S  sword    Y  the boy (return run only)
//   1/2/3 blob spawns by tier     B  boss
export const LEVELS = {
  1: {
    theme: 'garden',
    next: 'Level2',
    grid: [
      '#####D#####',
      '#.........#',
      '#.........#',
      '#..#...#..#',
      '#..#...#..#',
      '#.........#',
      '#....1....#',
      '#.........#',
      '#..1...1..#',
      '#.........#',
      '#.##...##.#',
      '#.........#',
      '#....S....#',
      '#.........#',
      '#.........#',
      '#....P....#',
      '#.........#',
      '###########',
    ],
  },

  2: {
    theme: 'dungeon',
    next: 'Level3',
    grid: [
      '#####D#####',
      '#.........#',
      '#..2...2..#',
      '#.........#',
      '#.###.###.#',
      '#...#.#...#',
      '#.........#',
      '#....1....#',
      '#.........#',
      '#.#.....#.#',
      '#.#.....#.#',
      '#.........#',
      '#..1...1..#',
      '#.........#',
      '#...###...#',
      '#.........#',
      '#....P....#',
      '###########',
    ],
  },

  3: {
    theme: 'dungeon',
    next: 'Return',
    boss: true,
    grid: [
      '#####D#####',
      '#.........#',
      '#....B....#',
      '#.........#',
      '#.........#',
      '#..#####..#',
      '#.........#',
      '#..3...3..#',
      '#.........#',
      '#.##...##.#',
      '#.........#',
      '#..2.2.2..#',
      '#.........#',
      '#.........#',
      '#...###...#',
      '#.........#',
      '#....P....#',
      '###########',
    ],
  },

  return: {
    theme: 'garden',
    grid: [
      '###########',
      '#....Y....#',
      '#.........#',
      '#..##.##..#',
      '#.........#',
      '#....#....#',
      '#.........#',
      '#..1...1..#',
      '#.........#',
      '#.##...##.#',
      '#.........#',
      '#.........#',
      '#...#.#...#',
      '#.........#',
      '#.........#',
      '#.........#',
      '#....P....#',
      '###########',
    ],
  },
};

// `hitW`/`hitH` size the body you have to actually connect with. Green and
// orange are small and quick so they take real aim; red and the boss are the
// slow, meaty ones and are left alone.
//
// Speeds are about 15% off an earlier pass, which played too fast to get away
// from. Worth knowing why it felt worse than the numbers looked: `dodge` adds
// a sideways weave on top of the chase, so a tier actually closes at roughly
// `speed * sqrt(1 + dodge^2)` — the orange tier was really moving at 125
// against the player's 155, which is not enough of a gap to break away in.
// The boss is untouched; its speed only drives an idle drift, and the charge
// it threatens with is timed separately in BossBlob.
export const BLOB_STATS = {
  easy: { hp: 26, speed: 66, damage: 1, aggro: 130, hitW: 15, hitH: 11, dodge: 0.55 },
  medium: { hp: 42, speed: 83, damage: 1, aggro: 165, hitW: 14, hitH: 10, dodge: 0.8 },
  hard: { hp: 52, speed: 77, damage: 2, aggro: 175, hitW: 20, hitH: 14, dodge: 0 },
  boss: { hp: 150, speed: 58, damage: 2, aggro: 999, hitW: 58, hitH: 40, dodge: 0 },
};

export const TIER_BY_CHAR = { 1: 'easy', 2: 'medium', 3: 'hard' };

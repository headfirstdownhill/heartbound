// Every sprite in the game is authored as rows of characters; this maps each
// character to a colour. '.' is transparent. Per-texture overrides let one grid
// be re-coloured (blob tiers, hit flashes) without duplicating the art.
export const PALETTE = {
  '.': null,

  o: '#241f2e', // outline
  O: '#3a3450', // soft outline / shadow

  s: '#f6cba0', // skin
  S: '#d9a377', // skin shade
  e: '#241f2e', // eye
  x: '#8a6a4a', // closed / lifeless eye

  h: '#7b4a24', // girl hair
  H: '#5d3418', // girl hair shade
  j: '#3d2a17', // boy hair
  J: '#2a1c0f', // boy hair shade

  d: '#e8557f', // dress
  D: '#b83a5e', // dress shade
  b: '#4a7ec7', // boy shirt
  B: '#2f5590', // boy shirt shade
  p: '#3c3a52', // trousers
  P: '#2a2839', // trousers shade
  v: '#5a3a1e', // shoes — deliberately not the outline colour so feet read on dark floors

  m: '#dfe5ef', // blade
  M: '#9aa3b5', // blade shade
  n: '#8a5a2b', // hilt
  N: '#5d3a19', // hilt shade
  k: '#f2c14e', // gold guard

  r: '#ff4d6d', // heart
  R: '#c22a4c', // heart shade
  w: '#ffffff',
  W: '#c9c9d6',

  g: '#7ed957', // blob body   (overridden per tier)
  G: '#4f9c36', // blob shade  (overridden per tier)
  l: '#a9f27f', // blob highlight (overridden per tier)

  f: '#468c42', // grass
  F: '#33682f', // grass dark
  i: '#2b6b2e', // hedge
  I: '#1c4620', // hedge shadow
  L: '#59a84f', // hedge highlight
  t: '#6f5540', // dungeon floor
  T: '#57402f', // dungeon floor dark
  u: '#4a3856', // dungeon wall
  U: '#2f2338', // dungeon wall dark
  c: '#8f6bb0', // wall trim

  q: '#c6553f', // picnic blanket red
  Q: '#f0e4cf', // picnic blanket cream

  y: '#f2c14e', // gold / door
  Y: '#b8892a', // gold shade
  z: '#1b1622', // doorway void

  a: '#3f86c4', // pond water
  A: '#79b8e6', // pond ripple
  Z: '#27587f', // pond edge
  C: '#e03050', // red rose
  E: '#a81e3a', // red rose shade
  V: '#3a7a34', // stem / leaf
  K: '#8b6244', // otter fur
  X: '#5f4229', // otter fur shade

  // Washed denim. Digits because every letter in the palette is already spoken
  // for; sprite grids never contain numerals, so they were free.
  1: '#7f9dc4', // denim
  2: '#5b7ba3', // denim shade
  3: '#a3bcd8', // denim highlight

  // Extra tile tones. The floors are the one thing on screen at every moment of
  // the game, and two shades apiece was never enough to make them read as
  // ground rather than as noise — these give each surface a proper range.
  4: '#63b354', // grass highlight — sunlit blade tips
  5: '#24522a', // grass deep shadow
  6: '#8a6b52', // flagstone lit bevel
  7: '#3d2c20', // flagstone deep crack
  8: '#5f4a6e', // stone brick lit face
  9: '#1d1526', // stone deep shadow / mortar
  0: '#6b5a3a', // dry earth fleck
};

export function withOverrides(overrides) {
  return overrides ? { ...PALETTE, ...overrides } : PALETTE;
}

// Blob tiers just remap the three body colours.
export const BLOB_TINTS = {
  easy: { g: '#7ed957', G: '#4f9c36', l: '#b6f78e' },
  medium: { g: '#f0b429', G: '#b07d10', l: '#ffd970' },
  hard: { g: '#e05a4a', G: '#9c3226', l: '#ff9080' },
  boss: { g: '#b03a6a', G: '#6e1f42', l: '#e86a9a' },
  // Near-black crimson, so the final boss reads as a silhouette with lit eyes.
  final: { g: '#5c1030', G: '#33061a', l: '#9c2050' },
  // Her allies. Not a tier anything spawns from — it exists so the summoned
  // blobs get real blue art instead of a tint over a green one. Blue is the one
  // hue the horde never uses, so "blue means it is on your side" holds at a
  // glance even in a crowded room.
  ally: { g: '#4aa8ee', G: '#2668a8', l: '#9adcff' },
};

import { PALETTE, withOverrides } from './Palette.js';
import { PX } from '../core/Constants.js';

// Sprite grids are hand-authored strings; a miscounted row would silently skew
// the whole sheet, so fail loudly instead.
function validate(rows, key) {
  const w = rows[0].length;
  rows.forEach((row, i) => {
    if (row.length !== w) {
      throw new Error(`[PixelArt] "${key}" row ${i} is ${row.length} chars, expected ${w}`);
    }
  });
}

function drawGrid(ctx, rows, map, pixelSize, offsetX) {
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const color = map[row[x]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(offsetX + x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
}

function freshCanvas(scene, key, w, h) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.createCanvas(key, w, h);
}

// One grid -> one texture.
export function makeTexture(scene, key, rows, opts = {}) {
  const { pixelSize = PX, overrides = null } = opts;
  validate(rows, key);
  const map = withOverrides(overrides);
  const w = rows[0].length * pixelSize;
  const h = rows.length * pixelSize;
  const tex = freshCanvas(scene, key, w, h);
  drawGrid(tex.getContext(), rows, map, pixelSize, 0);
  tex.refresh();
  return tex;
}

// Many equally-sized grids -> one horizontally tiled sheet with numbered frames,
// which is what Phaser's animation manager expects.
export function makeSheet(scene, key, frames, opts = {}) {
  const { pixelSize = PX, overrides = null } = opts;
  frames.forEach((rows, i) => validate(rows, `${key}[${i}]`));
  const map = withOverrides(overrides);
  const fw = frames[0][0].length * pixelSize;
  const fh = frames[0].length * pixelSize;
  const tex = freshCanvas(scene, key, fw * frames.length, fh);
  const ctx = tex.getContext();
  frames.forEach((rows, i) => drawGrid(ctx, rows, map, pixelSize, i * fw));
  frames.forEach((_, i) => tex.add(i, 0, i * fw, 0, fw, fh));
  tex.refresh();
  return tex;
}

export function makeAnim(scene, key, textureKey, frameCount, opts = {}) {
  const { frameRate = 8, repeat = -1 } = opts;
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: scene.anims.generateFrameNumbers(textureKey, { start: 0, end: frameCount - 1 }),
    frameRate,
    repeat,
  });
}

// Convenience: build the sheet and register its animation in one call.
export function makeAnimatedSprite(scene, key, frames, opts = {}) {
  makeSheet(scene, key, frames, opts);
  makeAnim(scene, key, key, frames.length, opts);
}

export function mirror(rows) {
  return rows.map((r) => r.split('').reverse().join(''));
}

// Shift a grid's contents vertically, padding with transparency. Used to make
// bob/hop frames without re-authoring the whole sprite.
export function shiftUp(rows, amount = 1) {
  const blank = '.'.repeat(rows[0].length);
  return rows.slice(amount).concat(Array.from({ length: amount }, () => blank));
}

export function shiftDown(rows, amount = 1) {
  const blank = '.'.repeat(rows[0].length);
  return Array.from({ length: amount }, () => blank).concat(rows.slice(0, rows.length - amount));
}

// Recolour whole regions of a grid, e.g. flashing a blob white when it is hit.
export function recolor(rows, mapping) {
  return rows.map((row) => row.split('').map((c) => mapping[c] ?? c).join(''));
}

export function pad(rows, top = 0, bottom = 0) {
  const blank = '.'.repeat(rows[0].length);
  return [
    ...Array.from({ length: top }, () => blank),
    ...rows,
    ...Array.from({ length: bottom }, () => blank),
  ];
}

// Rotate a grid 90 degrees clockwise — used for the fainted, lying-down boy.
export function rotateCW(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const out = [];
  for (let x = 0; x < w; x++) {
    let line = '';
    for (let y = h - 1; y >= 0; y--) line += rows[y][x];
    out.push(line);
  }
  return out;
}

export function solidTexture(scene, key, w, h, color) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
  return tex;
}

export { PALETTE };

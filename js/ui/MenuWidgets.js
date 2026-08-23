import { GAME_W, GAME_H, TILE } from '../core/Constants.js';
import { PixelText } from '../gfx/PixelText.js';
import { hash2 } from '../gfx/sprites/tiles.js';
import { audio } from '../systems/AudioManager.js';
import { installFx } from '../systems/Fx.js';
import { applyPostFX } from '../gfx/PostFX.js';

// Chunky arcade buttons: a thick dark outline with notched corners, a coloured
// body, a lit top-left bevel and a shaded bottom-right one. Drawn rather than
// spritesheeted so a button can be any size and any colour.
const BTN_OUTLINE = 0x0a2a3d;
const BTN_BODY = 0xffc20e;
const BTN_DEAD_BODY = 0x6c6a72;
const BTN_DEAD_TEXT = 0x36343d;
const KEY_BODY = 0xd8cfba;

// The one button that is for a person rather than a difficulty.
const GRAND_FRAME = 0xffc20e;
const GRAND_LABEL = 0xfff2c4;
const GRAND_SHADOW = 0x4a0f2e;
const GRAND_GLOW = 0xff8fc0;
const GRAND_SPARK = 0xfff6d0;

const NOTCH = 4; // corner squares left empty, which is what rounds the corners
const EDGE = 4; // outline thickness
const BEVEL = 4; // lit/shaded inner band

function shade(hex, factor) {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((hex >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((hex & 255) * factor));
  return (r << 16) | (g << 8) | b;
}

// Two overlapping rectangles make a plus shape, and a plus shape is a rectangle
// with its four corner squares missing — the pixel-art rounded corner.
function plus(g, left, top, w, h, notch) {
  g.fillRect(left + notch, top, w - notch * 2, h);
  g.fillRect(left, top + notch, w, h - notch * 2);
}

export function drawChunkyPanel(g, cx, cy, w, h, body, opts = {}) {
  const {
    pressed = false,
    hover = false,
    edge = EDGE,
    notch = NOTCH,
    bevel = BEVEL,
    frame = null,
    frameWidth = 3,
  } = opts;
  const left = Math.round(cx - w / 2);
  const top = Math.round(cy - h / 2);
  const tone = hover ? shade(body, 1.12) : body;

  g.clear();

  g.fillStyle(BTN_OUTLINE, 1);
  plus(g, left, top, w, h, notch);

  let inX = left + edge;
  let inY = top + edge;
  let inW = w - edge * 2;
  let inH = h - edge * 2;

  // Optional band between the outline and the face — the gold frame.
  if (frame !== null) {
    g.fillStyle(frame, 1);
    plus(g, inX, inY, inW, inH, notch);
    inX += frameWidth;
    inY += frameWidth;
    inW -= frameWidth * 2;
    inH -= frameWidth * 2;
  }

  g.fillStyle(tone, 1);
  plus(g, inX, inY, inW, inH, notch);

  // Pressed swaps which edges are lit, so the face reads as pushed in.
  const lit = pressed ? shade(tone, 0.72) : shade(tone, 1.3);
  const dim = pressed ? shade(tone, 1.3) : shade(tone, 0.72);

  g.fillStyle(lit, 1);
  g.fillRect(inX + notch, inY, inW - notch * 2, bevel);
  g.fillRect(inX, inY + notch, bevel, inH - notch * 2);

  g.fillStyle(dim, 1);
  g.fillRect(inX + notch, inY + inH - bevel, inW - notch * 2, bevel);
  g.fillRect(inX + inW - bevel, inY + notch, bevel, inH - notch * 2);
}

// The front-end screens share the game's meadow so the menus feel like the same
// world rather than a separate web page bolted on the front. It also carries the
// weather and the post-process grade, so every menu screen gets the same look
// from one call rather than four screens each remembering to ask.
const MEADOW_TILES = ['tile_grass', 'tile_grass2', 'tile_grass3', 'tile_grass4'];

export function meadowBackdrop(scene, veilAlpha = 0.68, opts = {}) {
  const { petals = true, rays = true, preset = 'menu' } = opts;
  if (!scene.fx) installFx(scene);

  const rt = scene.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0, 0).setDepth(-100);
  for (let y = 0; y < GAME_H; y += TILE) {
    for (let x = 0; x < GAME_W; x += TILE) {
      const roll = hash2(x, y);
      rt.draw(MEADOW_TILES[(x / TILE + y / TILE + Math.floor(roll * 4)) % MEADOW_TILES.length], x, y);
      if (roll < 0.14) rt.draw('flower', x + 3 + roll * 110, y + 4 + hash2(y, x) * 20);
    }
  }
  scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0b14, veilAlpha).setOrigin(0, 0).setDepth(-90);

  // Behind the interface, in front of the veil: the drifting layer has to be
  // lit by the scene rather than dimmed along with the ground under it.
  scene.fx.ambient('meadow', { x: 0, y: 0, width: GAME_W, height: GAME_H }, -80);
  if (petals) scene.fx.ambient('petals', { x: 0, y: 0, width: GAME_W, height: GAME_H }, 300);
  if (rays) scene.fx.godRays(0, 0, GAME_W, GAME_H, { count: 5, alpha: 0.05, depth: -70 });
  applyPostFX(scene, preset);

  return rt;
}

// `color` is the button's body colour; the label is always the dark outline
// colour, which is what makes the arcade look work.
export class MenuButton {
  constructor(scene, x, y, label, opts = {}) {
    const {
      scale = 3,
      color = BTN_BODY,
      padX = 26,
      padY = 16,
      minWidth = 0,
      depth = 500,
      onPick = null,
      grand = false,
      // Either can be set to null to silence it. The book's page arrows do
      // that for the click, because the turn itself is the sound there and an
      // interface blip on top of it just steps on the paper.
      hoverSound = 'uiHover',
      clickSound = 'uiClick',
    } = opts;

    this.scene = scene;
    this.onPick = onPick;
    this.hoverSound = hoverSound;
    this.clickSound = clickSound;
    this.enabled = true;
    this.pressed = false;
    this.hover = false;
    this.body = color;
    this.cx = x;
    this.cy = y;
    this.grand = grand;
    this.frame = grand ? GRAND_FRAME : null;

    // The grand button carries a cream label over a dark drop shadow instead of
    // the flat dark one, so it reads as lit rather than stamped.
    const labelColor = grand ? GRAND_LABEL : BTN_OUTLINE;
    if (grand) {
      this.shadowText = new PixelText(scene, x + 2, y + 3, label, { scale, color: GRAND_SHADOW });
    }
    this.text = new PixelText(scene, x, y, label, { scale, color: labelColor });
    this.w = Math.round(Math.max(this.text.width + padX * 2, minWidth));
    this.h = Math.round(this.text.height + padY * 2);

    this.gfx = scene.add.graphics().setDepth(depth);
    this.shadowText?.setDepth(depth + 1);
    this.text.setDepth(depth + 2);

    if (grand) this.decorate(depth);

    this.hit = scene.add
      .zone(x, y, this.w, this.h)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    this.hit.on('pointerover', () => {
      if (this.enabled && !this.hover && this.hoverSound) audio.play(this.hoverSound);
      this.setHover(true);
    });
    this.hit.on('pointerout', () => {
      this.setHover(false);
      this.setPressed(false);
    });
    this.hit.on('pointerdown', () => {
      if (this.enabled && this.clickSound) audio.play(this.clickSound);
      this.setPressed(true);
    });
    this.hit.on('pointerup', () => {
      const wasPressed = this.pressed;
      this.setPressed(false);
      if (this.enabled && wasPressed) this.onPick?.();
    });

    this.redraw();
  }

  // Halo, shimmer and sparkles. Only the grand button gets these — it is the
  // one that is meant to be for somebody.
  decorate(depth) {
    const scene = this.scene;
    const { w, h } = this;

    // Layered rounded rects fake a soft halo without needing a blur. It has to
    // be additive: pink at low alpha over the dark meadow just reads as a grey
    // slab, whereas added light reads as glow.
    this.glow = scene.add.graphics().setDepth(depth - 1).setPosition(this.cx, this.cy);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    // Ellipses rather than rects: a stacked rectangle halo shows its outermost
    // straight edge as a band across the screen, an elliptical one falls off.
    for (let i = 6; i >= 1; i--) {
      this.glow.fillStyle(GRAND_GLOW, 0.05);
      this.glow.fillEllipse(0, 0, w + i * 9, h + i * 9);
    }
    scene.tweens.add({
      targets: this.glow,
      scaleX: 1.05,
      scaleY: 1.1,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // A lit band that sweeps across the face every few seconds, clipped to the
    // face so it never spills over the frame.
    const mask = scene.make.graphics();
    mask.fillStyle(0xffffff, 1);
    plus(mask, this.cx - w / 2 + EDGE, this.cy - h / 2 + EDGE, w - EDGE * 2, h - EDGE * 2, NOTCH);

    this.shine = scene.add.graphics().setDepth(depth + 3);
    this.shine.setBlendMode(Phaser.BlendModes.ADD);
    this.shine.fillStyle(0xffffff, 0.22);
    this.shine.fillRect(-11, -h, 22, h * 2);
    this.shine.setPosition(this.cx - w / 2 - 30, this.cy).setAngle(16);
    this.shine.setMask(mask.createGeometryMask());
    scene.tweens.add({
      targets: this.shine,
      x: this.cx + w / 2 + 30,
      duration: 1300,
      ease: 'Sine.inOut',
      repeat: -1,
      repeatDelay: 2400,
    });

    // Twinkles around the rim, each on its own clock.
    this.sparkles = [
      [-w / 2 - 6, -h / 2 - 4],
      [w / 2 + 6, -h / 2 - 2],
      [-w / 2 + 24, h / 2 + 8],
      [w / 2 - 30, h / 2 + 6],
      [-w / 2 - 10, h / 2 - 10],
      [w / 2 + 10, -h / 2 + 12],
    ].map(([ox, oy], i) => {
      const s = scene.add.graphics().setDepth(depth + 4);
      s.setBlendMode(Phaser.BlendModes.ADD);
      s.fillStyle(GRAND_SPARK, 1);
      // Four-point twinkle: long thin cross with a brighter core.
      s.fillRect(-1, -6, 2, 12);
      s.fillRect(-6, -1, 12, 2);
      s.fillRect(-2, -2, 4, 4);
      s.setPosition(this.cx + ox, this.cy + oy).setAlpha(0);
      scene.tweens.add({
        targets: s,
        alpha: { from: 0, to: 1 },
        scaleX: { from: 0.3, to: 1 },
        scaleY: { from: 0.3, to: 1 },
        duration: 620,
        yoyo: true,
        repeat: -1,
        delay: i * 430,
        repeatDelay: 1500,
        ease: 'Quad.out',
      });
      return s;
    });
  }

  redraw() {
    drawChunkyPanel(this.gfx, this.cx, this.cy, this.w, this.h, this.enabled ? this.body : BTN_DEAD_BODY, {
      pressed: this.pressed,
      hover: this.hover && this.enabled,
      frame: this.enabled ? this.frame : null,
    });
    if (!this.grand) this.text.setTint(this.enabled ? BTN_OUTLINE : BTN_DEAD_TEXT);
    // Shove the label into the face while held.
    const drop = this.pressed ? 2 : 0;
    this.text.setPosition(this.cx, this.cy + drop);
    this.shadowText?.setPosition(this.cx + 2, this.cy + 3 + drop);
  }

  setHover(on) {
    if (this.hover === on) return;
    this.hover = on;
    this.redraw();
  }

  setPressed(on) {
    if (this.pressed === on) return;
    this.pressed = on && this.enabled;
    this.redraw();
  }

  setEnabled(on) {
    this.enabled = on;
    this.pressed = false;
    this.redraw();
  }

  setAlpha(a) {
    this.gfx.setAlpha(a);
    this.text.setAlpha(a);
    this.shadowText?.setAlpha(a);
    this.glow?.setAlpha(a);
    this.shine?.setAlpha(a);
    this.sparkles?.forEach((s) => s.setAlpha(a));
    return this;
  }

  // A button owns half a dozen loose objects, so a screen that swaps out its
  // contents without leaving a dead hit zone behind needs this.
  destroy() {
    this.gfx.destroy();
    this.text.destroy();
    this.hit.destroy();
    this.shadowText?.destroy();
    this.glow?.destroy();
    this.shine?.destroy();
    this.sparkles?.forEach((s) => s.destroy());
  }
}

// Sound on/off. Drawn rather than spritesheeted because it is two states of one
// shape and the difference between them is a single stroke.
export class SoundToggle {
  constructor(scene, x, y, opts = {}) {
    const { depth = 900, size = 24 } = opts;
    this.scene = scene;
    this.cx = x;
    this.cy = y;
    this.size = size;

    this.gfx = scene.add.graphics().setDepth(depth).setAlpha(0.7);
    this.hit = scene.add
      .zone(x, y, size + 16, size + 16)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    this.hit.on('pointerover', () => this.gfx.setAlpha(1));
    this.hit.on('pointerout', () => this.gfx.setAlpha(0.7));
    this.hit.on('pointerup', () => {
      audio.toggleMute();
      this.redraw();
      // Only audible when turning it back on, which is the confirmation the
      // player actually needs.
      audio.play('uiClick');
    });

    this.redraw();
  }

  redraw() {
    const g = this.gfx;
    const s = this.size;
    const x = this.cx;
    const y = this.cy;
    g.clear();
    g.fillStyle(0xfff2c4, 1);
    // Speaker: a small box with a triangular cone off the right of it.
    g.fillRect(x - s * 0.42, y - s * 0.18, s * 0.26, s * 0.36);
    g.beginPath();
    g.moveTo(x - s * 0.16, y - s * 0.18);
    g.lineTo(x + s * 0.08, y - s * 0.42);
    g.lineTo(x + s * 0.08, y + s * 0.42);
    g.lineTo(x - s * 0.16, y + s * 0.18);
    g.closePath();
    g.fillPath();

    if (audio.muted) {
      // A cross through it, in the warning colour.
      g.lineStyle(3, 0xff4d6d, 1);
      g.beginPath();
      g.moveTo(x + s * 0.2, y - s * 0.28);
      g.lineTo(x + s * 0.56, y + s * 0.28);
      g.moveTo(x + s * 0.56, y - s * 0.28);
      g.lineTo(x + s * 0.2, y + s * 0.28);
      g.strokePath();
      return;
    }

    // Two arcs of sound coming out of it.
    g.lineStyle(3, 0xfff2c4, 1);
    [0.26, 0.46].forEach((r, i) => {
      g.beginPath();
      g.arc(x + s * 0.1, y, s * (0.3 + r), -0.9, 0.9);
      g.strokePath();
      void i;
    });
  }

  setDepth(d) {
    this.gfx.setDepth(d);
    this.hit.setDepth(d);
    return this;
  }

  destroy() {
    this.gfx.destroy();
    this.hit.destroy();
  }
}

// Small square key for the name-entry keypad, in the same style but muted —
// thirty-odd bright yellow caps would shout down the rest of the screen.
export class KeyCap {
  constructor(scene, x, y, label, onPick, size = 40) {
    this.scene = scene;
    this.label = label;
    this.cx = x;
    this.cy = y;
    this.size = size;
    this.pressed = false;
    this.hover = false;

    this.gfx = scene.add.graphics().setDepth(500);
    this.text = new PixelText(scene, x, y, label, { scale: 2, color: BTN_OUTLINE });
    this.text.setDepth(501);

    this.hit = scene.add
      .zone(x, y, size, size)
      .setDepth(500)
      .setInteractive({ useHandCursor: true });

    this.hit.on('pointerover', () => {
      this.hover = true;
      this.redraw();
    });
    this.hit.on('pointerout', () => {
      this.hover = false;
      this.pressed = false;
      this.redraw();
    });
    this.hit.on('pointerdown', () => {
      this.pressed = true;
      this.redraw();
    });
    this.hit.on('pointerup', () => {
      const was = this.pressed;
      this.pressed = false;
      this.redraw();
      if (was) {
        audio.play('key');
        onPick(label);
      }
    });

    this.redraw();
  }

  redraw() {
    drawChunkyPanel(this.gfx, this.cx, this.cy, this.size, this.size, KEY_BODY, {
      pressed: this.pressed,
      hover: this.hover,
      edge: 3,
      notch: 3,
      bevel: 3,
    });
    this.text.setPosition(this.cx, this.cy + (this.pressed ? 2 : 0));
  }
}

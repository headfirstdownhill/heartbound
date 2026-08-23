import { FONT_INDEX, GLYPH_W, GLYPH_H, GLYPH_W_SEMI, GLYPH_H_SEMI } from './sprites/font.js';

export const FONT_KEY = 'font';
export const FONT_KEY_SEMI = 'font_semi';
export const FONT_PX = 2; // pixel size the regular font sheet was generated at
export const FONT_PX_SEMI = 1; // the semi-bold grid is already double scale

// Each weight carries its own metrics, because the semi-bold sheet is drawn on
// a doubled grid at half the pixel size — the two end up nearly the same size
// on screen, which is the point.
const WEIGHTS = {
  regular: { key: FONT_KEY, gw: GLYPH_W, gh: GLYPH_H, px: FONT_PX, gap: 1 },
  semibold: { key: FONT_KEY_SEMI, gw: GLYPH_W_SEMI, gh: GLYPH_H_SEMI, px: FONT_PX_SEMI, gap: 2 },
};

// A run of glyph Images kept in a Container, so text can be tinted, scaled and
// tweened as one object and re-set cheaply (the HUD clock rewrites every second).
export class PixelText {
  constructor(scene, x, y, text, opts = {}) {
    const { scale = 1, color = 0xffffff, align = 'center', maxWidth = null, bold = false } = opts;
    const weight = WEIGHTS[bold ? 'semibold' : 'regular'];
    const { spacing = weight.gap } = opts;
    this.scene = scene;
    this.scale = scale;
    this.bold = bold;
    this.fontKey = weight.key;
    this.fontPx = weight.px;
    // Long strings shrink to fit rather than running off a phone screen.
    this.maxWidth = maxWidth ?? scene.scale.width - 20;
    this.spacing = spacing;
    this.align = align;
    this.color = color;
    this.glyphW = weight.gw * weight.px;
    this.glyphH = weight.gh * weight.px;
    this.container = scene.add.container(x, y);
    this.pool = [];
    this.setText(text);
  }

  setText(text) {
    const chars = String(text).toUpperCase().split('');
    while (this.pool.length < chars.length) {
      const img = this.scene.add.image(0, 0, this.fontKey, 0).setOrigin(0, 0.5);
      this.container.add(img);
      this.pool.push(img);
    }
    const unit = this.glyphW + this.spacing * this.fontPx;
    const rawWidth = chars.length * unit - this.spacing * this.fontPx;
    const scale = Math.min(this.scale, rawWidth > 0 ? this.maxWidth / rawWidth : this.scale);
    const step = unit * scale;
    const width = rawWidth * scale;
    const startX = this.align === 'center' ? -width / 2 : this.align === 'right' ? -width : 0;

    this.pool.forEach((img, i) => {
      if (i >= chars.length) {
        img.setVisible(false);
        return;
      }
      const frame = FONT_INDEX[chars[i]] ?? FONT_INDEX[' '];
      img.setVisible(true).setFrame(frame).setScale(scale).setTint(this.color);
      img.x = startX + i * step;
      img.y = 0;
    });
    this.width = width;
    this.height = this.glyphH * scale;
    return this;
  }

  setTint(color) {
    this.color = color;
    this.pool.forEach((img) => img.setTint(color));
    return this;
  }

  setPosition(x, y) {
    this.container.setPosition(x, y);
    return this;
  }

  setDepth(d) {
    this.container.setDepth(d);
    return this;
  }

  setAlpha(a) {
    this.container.setAlpha(a);
    return this;
  }

  destroy() {
    this.container.destroy();
  }
}

import { PixelText } from '../gfx/PixelText.js';
import { audio } from '../systems/AudioManager.js';

// A compact pixel speech bubble that types its line out. Sized once from the
// wrapped text and then filled in, so the box never grows mid-sentence.
const INK = 0x241f2e;
const PAPER = 0xf6f2e8;
// Two steps each way rather than one hard band, so the face rolls off instead
// of stepping straight from white to paper.
const PAPER_LIT = [0xffffff, 0xfbf8f1];
const PAPER_DIM = [0xe7e0d1, 0xcfc7b4];
// The drop shadow is two-tone for the same reason.
const DROP_NEAR = 0x8ea6d2;
const DROP_FAR = 0xb9c9e9;
const SB_NOTCH = 4; // corner squares left out, which rounds the corners
const SB_EDGE = 3; // outline thickness
const SB_BEVEL = 2;
const PAD_X = 8;
const PAD_Y = 7;
const LINE_H = 15;
// Whole number on purpose. A fractional scale resamples the glyphs unevenly
// and the text goes soft, which is exactly what it did at 0.85.
const TEXT_SCALE = 1;

export const MS_PER_CHAR = 45;
export const BUBBLE_HOLD_MS = 1000;

// Greedy word wrap. Long words are left alone rather than broken.
export function wrapText(text, maxChars) {
  const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}

export function speechDuration(text, maxChars) {
  return wrapText(text, maxChars).join('').length * MS_PER_CHAR;
}

function sbPlus(g, left, top, w, h, notch) {
  g.fillRect(left + notch, top, w - notch * 2, h);
  g.fillRect(left, top + notch, w, h - notch * 2);
}

export class SpeechBubble {
  // `tailX`/`tailY` is the point the tail reaches toward — the speaker's head.
  constructor(scene, cx, cy, text, opts = {}) {
    const { maxChars = 24, depth = 1500, tailX = cx, tailY = cy + 40, voicePitch = 1 } = opts;

    this.scene = scene;
    this.lines = wrapText(text, maxChars);
    this.depth = depth;
    this.voicePitch = voicePitch;

    // The bold font sheet at scale 1: whole pixels, so it stays sharp.
    this.texts = this.lines.map(
      (line) =>
        new PixelText(scene, 0, 0, line, {
          scale: TEXT_SCALE,
          color: INK,
          align: 'left',
          maxWidth: 9999,
          bold: true,
        }),
    );
    const textW = Math.max(...this.texts.map((t) => t.width));
    this.w = Math.round(textW + PAD_X * 2);
    this.h = Math.round(this.lines.length * LINE_H + PAD_Y * 2);
    this.cx = cx;
    this.cy = cy;

    this.gfx = scene.add.graphics().setDepth(depth);
    this.draw(tailX, tailY);

    const left = cx - this.w / 2 + PAD_X;
    const top = cy - this.h / 2 + PAD_Y + 6;
    this.texts.forEach((t, i) => {
      t.setDepth(depth + 2);
      t.setPosition(left, top + i * LINE_H);
      t.setText('');
    });

    this.container = [this.gfx, ...this.texts.map((t) => t.container)];
    this.setAlpha(0);
    scene.tweens.add({ targets: this.container, alpha: 1, duration: 160 });
  }

  draw(tailX, tailY) {
    const g = this.gfx;
    const left = Math.round(this.cx - this.w / 2);
    const top = Math.round(this.cy - this.h / 2);

    // Shadow first, offset down-right, in two steps.
    g.fillStyle(DROP_FAR, 1);
    sbPlus(g, left + 5, top + 5, this.w, this.h, SB_NOTCH);
    g.fillStyle(DROP_NEAR, 1);
    sbPlus(g, left + 3, top + 3, this.w, this.h, SB_NOTCH);

    g.fillStyle(INK, 1);
    sbPlus(g, left, top, this.w, this.h, SB_NOTCH);

    const inX = left + SB_EDGE;
    const inY = top + SB_EDGE;
    const inW = this.w - SB_EDGE * 2;
    const inH = this.h - SB_EDGE * 2;

    g.fillStyle(PAPER, 1);
    sbPlus(g, inX, inY, inW, inH, SB_NOTCH);

    // Lit along the top-left, shaded along the bottom-right, so the face reads
    // as a raised panel rather than a flat cut-out. Each side is graded over
    // two one-pixel steps.
    PAPER_LIT.forEach((tone, i) => {
      g.fillStyle(tone, 1);
      g.fillRect(inX + SB_NOTCH, inY + i, inW - SB_NOTCH * 2, 1);
      g.fillRect(inX + i, inY + SB_NOTCH, 1, inH - SB_NOTCH * 2);
    });

    PAPER_DIM.forEach((tone, i) => {
      g.fillStyle(tone, 1);
      g.fillRect(inX + SB_NOTCH, inY + inH - 1 - i, inW - SB_NOTCH * 2, 1);
      g.fillRect(inX + inW - 1 - i, inY + SB_NOTCH, 1, inH - SB_NOTCH * 2);
    });

    // Stepped tail, drawn toward the speaker and always from the bubble's
    // bottom edge — every speaker in this scene sits below their bubble.
    const dir = tailX < this.cx ? -1 : 1;
    const baseX = Math.round(this.cx + dir * Math.min(this.w / 2 - 22, 34));
    const baseY = top + this.h;
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const stepW = 14 - i * 4;
      const x = baseX + dir * i * 4;
      g.fillStyle(INK, 1);
      g.fillRect(x - stepW / 2, baseY - SB_EDGE + i * 4, stepW, 4 + SB_EDGE);
      g.fillStyle(PAPER, 1);
      g.fillRect(x - stepW / 2 + SB_EDGE, baseY - SB_EDGE + i * 4, stepW - SB_EDGE * 2, 4);
    }
    void tailY;
  }

  // Reveals the text one character at a time, line by line.
  type(onDone) {
    let line = 0;
    let chars = 0;
    this.typer = this.scene.time.addEvent({
      delay: MS_PER_CHAR,
      loop: true,
      callback: () => {
        if (line >= this.lines.length) {
          this.typer.remove();
          onDone?.();
          return;
        }
        chars += 1;
        this.texts[line].setText(this.lines[line].slice(0, chars));
        // Every other character, not every one: at 45ms a blip per letter is a
        // machine gun. The pitch is set per speaker so the two of them sound
        // like two different people talking.
        if (chars % 2 === 0) audio.play('blip', { pitch: this.voicePitch ?? 1 });
        if (chars >= this.lines[line].length) {
          line += 1;
          chars = 0;
        }
      },
    });
    return this;
  }

  // Skip straight to the finished line, for when the player taps through.
  reveal() {
    this.typer?.remove();
    this.texts.forEach((t, i) => t.setText(this.lines[i]));
  }

  setAlpha(a) {
    this.gfx.setAlpha(a);
    this.texts.forEach((t) => t.setAlpha(a));
  }

  hide(onDone) {
    this.typer?.remove();
    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        this.destroy();
        onDone?.();
      },
    });
  }

  destroy() {
    this.typer?.remove();
    this.gfx.destroy();
    this.texts.forEach((t) => t.destroy());
  }
}

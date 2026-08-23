import { PixelText } from '../gfx/PixelText.js';
import { audio, PLAYLIST, trackTitle } from '../systems/AudioManager.js';
import { drawChunkyPanel } from './MenuWidgets.js';

// A note button that drops a list of songs under it. Built for the garden,
// where picking the music is the whole point of the mode rather than a setting.
const PICK_PANEL = 0x1d2b3a;
const PICK_ROW_HOT = 0x2b4054;
const PICK_LABEL = 0xfff2c4;
const PICK_LABEL_DIM = 0x8fa3b5;
const PICK_ACCENT = 0xffc20e;

const PICK_ROW_H = 34;
const PICK_PANEL_W = 280;
const PICK_WRAP_CHARS = 20;

// Titles are long enough to need two lines at a readable size, and wrapping
// beats either shrinking them to mush or scrolling every row.
function pickWrapTitle(text, maxChars) {
  if (text.length <= maxChars) return [text];
  const lines = [''];
  text.split(' ').forEach((word) => {
    const cur = lines[lines.length - 1];
    const next = cur ? `${cur} ${word}` : word;
    if (!cur || next.length <= maxChars) lines[lines.length - 1] = next;
    else lines.push(word);
  });
  return lines;
}

export class MusicPicker {
  constructor(scene, x, y, opts = {}) {
    const { depth = 2000 } = opts;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.depth = depth;
    this.open = false;
    this.rows = [];

    this.btnW = 44;
    this.btnH = 30;

    this.btn = scene.add.graphics().setDepth(depth);
    this.note = scene.add.graphics().setDepth(depth + 1);
    this.btnHit = scene.add
      .zone(x, y, this.btnW + 8, this.btnH + 8)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });

    this.btnHit.on('pointerover', () => {
      this.hover = true;
      this.redrawButton();
      audio.play('uiHover');
    });
    this.btnHit.on('pointerout', () => {
      this.hover = false;
      this.redrawButton();
    });
    this.btnHit.on('pointerup', () => this.toggle());

    this.redrawButton();
  }

  get isOpen() {
    return this.open;
  }

  toggle() {
    audio.play('uiClick');
    if (this.open) this.close();
    else this.show();
  }

  redrawButton() {
    drawChunkyPanel(this.btn, this.x, this.y, this.btnW, this.btnH, PICK_PANEL, {
      edge: 3,
      notch: 3,
      bevel: 2,
      hover: this.hover,
      pressed: this.open,
    });

    // Two-note glyph, drawn rather than spritesheeted like the rest of the
    // interface icons.
    const g = this.note;
    const x = this.x;
    const y = this.y + (this.open ? 1 : 0);
    g.clear();
    g.fillStyle(PICK_ACCENT, 1);
    g.fillRect(x - 7, y - 8, 2, 12); // left stem
    g.fillRect(x + 5, y - 8, 2, 12); // right stem
    g.fillRect(x - 7, y - 8, 14, 2); // beam
    g.fillRect(x - 11, y + 2, 6, 4); // left head
    g.fillRect(x + 1, y + 2, 6, 4); // right head
  }

  show() {
    if (this.open) return;
    this.open = true;

    const rows = PLAYLIST.length;
    const h = rows * PICK_ROW_H + 12;
    const right = this.x + this.btnW / 2;
    const left = right - PICK_PANEL_W;
    const top = this.y + this.btnH / 2 + 6;
    const cx = (left + right) / 2;
    const cy = top + h / 2;

    this.panel = this.scene.add.graphics().setDepth(this.depth + 3);
    drawChunkyPanel(this.panel, cx, cy, PICK_PANEL_W, h, PICK_PANEL, {
      edge: 3,
      notch: 3,
      bevel: 2,
    });

    this.rows = PLAYLIST.map((name, i) => {
      const rowY = top + 6 + i * PICK_ROW_H + PICK_ROW_H / 2;
      const playing = audio.fileName === name;

      const highlight = this.scene.add.graphics().setDepth(this.depth + 4);
      const lines = pickWrapTitle(trackTitle(name), PICK_WRAP_CHARS);
      const texts = lines.map((line, li) => {
        const ly = rowY + (li - (lines.length - 1) / 2) * 13;
        const t = new PixelText(this.scene, left + 24, ly, line, {
          scale: 1,
          color: playing ? PICK_LABEL : PICK_LABEL_DIM,
          align: 'left',
          maxWidth: PICK_PANEL_W - 40,
        });
        t.setDepth(this.depth + 5);
        return t;
      });

      // A filled dot marks whichever song is actually coming out of the
      // speakers, so the list doubles as the now-playing display.
      const dot = this.scene.add.graphics().setDepth(this.depth + 5);
      dot.fillStyle(playing ? PICK_ACCENT : PICK_LABEL_DIM, playing ? 1 : 0.45);
      dot.fillRect(left + 12, rowY - 3, 6, 6);

      const hit = this.scene.add
        .zone(cx, rowY, PICK_PANEL_W - 12, PICK_ROW_H - 2)
        .setDepth(this.depth + 6)
        .setInteractive({ useHandCursor: true });

      const paint = (on) => {
        highlight.clear();
        if (!on) return;
        highlight.fillStyle(PICK_ROW_HOT, 1);
        highlight.fillRect(left + 6, rowY - PICK_ROW_H / 2 + 2, PICK_PANEL_W - 12, PICK_ROW_H - 4);
      };

      hit.on('pointerover', () => {
        paint(true);
        audio.play('uiHover');
      });
      hit.on('pointerout', () => paint(false));
      hit.on('pointerup', () => this.pick(name));

      return { highlight, texts, dot, hit };
    });
  }

  pick(name) {
    audio.play('uiConfirm');
    audio.music(name, { fade: 700 });
    // Remembered the same way the title screen's strip remembers it, so the
    // choice carries between the two.
    audio.menuTrack = name;
    audio.savePrefs();
    this.close();
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.panel?.destroy();
    this.panel = null;
    this.rows.forEach((r) => {
      r.highlight.destroy();
      r.texts.forEach((t) => t.destroy());
      r.dot.destroy();
      r.hit.destroy();
    });
    this.rows = [];
    this.redrawButton();
  }

  destroy() {
    this.close();
    this.btn.destroy();
    this.note.destroy();
    this.btnHit.destroy();
  }
}

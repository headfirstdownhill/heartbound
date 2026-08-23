import { audio } from '../systems/AudioManager.js';

// Speaker plus a track. The speaker is a mute toggle in its own right, so this
// one control covers both "quieter" and "off" — which matters in the garden,
// where there is no other way to shut the game up.
const TRACK_BG = 0x1d2b3a;
const TRACK_FILL = 0xffc20e;
const TRACK_MUTED = 0x6c6a72;
const ICON = 0xfff2c4;
const OUTLINE = 0x0a2a3d;

export class VolumeSlider {
  constructor(scene, x, y, opts = {}) {
    const { width = 104, depth = 2000 } = opts;
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.w = width;

    this.icon = scene.add.graphics().setDepth(depth + 1);
    this.bar = scene.add.graphics().setDepth(depth);

    // The speaker sits left of the track; the track runs from `left` to `right`.
    this.iconX = x + 10;
    this.left = x + 26;
    this.right = x + width;

    this.iconHit = scene.add
      .zone(this.iconX, y, 26, 26)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true });
    this.iconHit.on('pointerup', () => {
      audio.toggleMute();
      audio.play('uiClick');
      this.redraw();
    });

    // The whole track is grabbable, and a tap anywhere on it jumps there —
    // hunting for a small knob with a thumb is miserable.
    this.barHit = scene.add
      .zone((this.left + this.right) / 2, y, this.right - this.left + 16, 30)
      .setDepth(depth + 2)
      .setInteractive({ useHandCursor: true, draggable: true });

    const set = (pointer) => {
      const v = (pointer.worldX - this.left) / (this.right - this.left);
      // Touching the slider is a clear statement that sound is wanted.
      if (audio.muted) audio.setMuted(false);
      audio.setVolume(v);
      this.redraw();
    };
    this.barHit.on('pointerdown', (p) => set(p));
    this.barHit.on('drag', (p) => set(p));

    this.redraw();
  }

  redraw() {
    const v = audio.muted ? 0 : audio.volume;
    const g = this.bar;
    const y = this.y;
    const span = this.right - this.left;
    const fill = this.left + span * v;

    g.clear();
    // Track: a thin dark bed with the filled part drawn over it.
    g.fillStyle(OUTLINE, 1);
    g.fillRect(this.left - 2, y - 5, span + 4, 10);
    g.fillStyle(TRACK_BG, 1);
    g.fillRect(this.left, y - 3, span, 6);
    g.fillStyle(audio.muted ? TRACK_MUTED : TRACK_FILL, 1);
    g.fillRect(this.left, y - 3, Math.max(0, fill - this.left), 6);
    // Knob.
    g.fillStyle(OUTLINE, 1);
    g.fillRect(fill - 4, y - 9, 8, 18);
    g.fillStyle(audio.muted ? TRACK_MUTED : ICON, 1);
    g.fillRect(fill - 2, y - 7, 4, 14);

    this.drawIcon();
  }

  // Same speaker shape the title screen uses, drawn small.
  drawIcon() {
    const g = this.icon;
    const x = this.iconX;
    const y = this.y;
    const s = 20;
    g.clear();
    g.fillStyle(audio.muted ? TRACK_MUTED : ICON, 1);
    g.fillRect(x - s * 0.42, y - s * 0.18, s * 0.26, s * 0.36);
    g.beginPath();
    g.moveTo(x - s * 0.16, y - s * 0.18);
    g.lineTo(x + s * 0.08, y - s * 0.42);
    g.lineTo(x + s * 0.08, y + s * 0.42);
    g.lineTo(x - s * 0.16, y + s * 0.18);
    g.closePath();
    g.fillPath();

    if (audio.muted) {
      g.lineStyle(2, 0xff4d6d, 1);
      g.beginPath();
      g.moveTo(x + s * 0.2, y - s * 0.26);
      g.lineTo(x + s * 0.5, y + s * 0.26);
      g.moveTo(x + s * 0.5, y - s * 0.26);
      g.lineTo(x + s * 0.2, y + s * 0.26);
      g.strokePath();
    }
  }

  destroy() {
    this.icon.destroy();
    this.bar.destroy();
    this.iconHit.destroy();
    this.barHit.destroy();
  }
}

import { PixelText } from '../gfx/PixelText.js';
import { audio, PLAYLIST, trackTitle } from '../systems/AudioManager.js';
import { drawChunkyPanel } from './MenuWidgets.js';

// A thin now-playing strip for the title screen. It is a display first and a
// control second: the song name is the whole point, and the two arrows are
// small enough that nobody hunting for PLAY will hit one by accident.
//
// Titles are drawn at scale 1 and never shrunk to fit. Letting PixelText scale
// a long name down lands on a fractional pixel size, which on a sheet this
// small turns to mush — so anything too wide for the window scrolls instead,
// which is what a real player of this size does anyway.
const MINI_PANEL = 0x1d2b3a;
const MINI_LABEL = 0xfff2c4;
const MINI_LABEL_IDLE = 0x8fa3b5; // before the first tap, when nothing can play yet
const MINI_ARROW = 0xffc20e;
const MINI_ARROW_HOT = 0xfff2c4;

const TITLE_SCALE = 1;
const SCROLL_MS_PER_PX = 22;
const SCROLL_HOLD = 1400;

export class MiniPlayer {
  constructor(scene, x, y, opts = {}) {
    const { width = 372, height = 30, depth = 900 } = opts;
    this.scene = scene;
    this.cx = x;
    this.cy = y;
    this.w = width;
    this.h = height;

    this.index = Math.max(0, PLAYLIST.indexOf(audio.menuTrack));

    this.gfx = scene.add.graphics().setDepth(depth);
    drawChunkyPanel(this.gfx, x, y, width, height, MINI_PANEL, {
      edge: 3,
      notch: 3,
      bevel: 2,
    });

    const left = x - width / 2;
    const right = x + width / 2;

    // The note doubles as the playing light: lit while sound is actually
    // coming out, dim while the browser is still waiting for a gesture.
    this.noteX = left + 42;
    this.note = scene.add.graphics().setDepth(depth + 1);

    this.prev = this.arrow(left + 20, y, '<', -1, depth);
    this.next = this.arrow(right - 20, y, '>', 1, depth);

    // Everything between the note and the right arrow belongs to the title.
    this.winL = this.noteX + 12;
    this.winR = right - 38;
    this.winW = this.winR - this.winL;
    this.winX = (this.winL + this.winR) / 2;

    this.window = scene.add.container(this.winX, y).setDepth(depth + 2);
    const shape = scene.make.graphics();
    shape.fillStyle(0xffffff, 1);
    shape.fillRect(this.winL, y - height / 2, this.winW, height);
    this.window.setMask(shape.createGeometryMask());
    this.maskShape = shape;

    this.title = new PixelText(scene, 0, 0, '', {
      scale: TITLE_SCALE,
      color: MINI_LABEL,
      align: 'left',
      maxWidth: 99999, // never shrink; overflow scrolls instead
    });
    // Re-parent the text into the masked window so it clips at the edges.
    this.window.add(this.title.container);

    this.setTitle(trackTitle(this.currentName()));

    // Cheaper than a per-frame update, and the state it watches only changes
    // when the browser decides to let audio through.
    this.watch = scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => this.refreshState(),
    });
    this.refreshState();

    // The mask shape is not on the display list, so scene shutdown does not
    // take it with everything else. Coming back to the title screen after an
    // ending would otherwise strand one of these every time.
    scene.events.once('shutdown', () => this.destroy());
  }

  currentName() {
    return PLAYLIST[this.index];
  }

  // Short names sit still and centred; long ones track back and forth so the
  // whole title is readable without ever being squashed.
  setTitle(text) {
    this.scroll?.remove();
    this.scroll = null;
    this.title.setText(text);

    const overflow = this.title.width - this.winW;
    if (overflow <= 0) {
      this.title.container.x = -this.title.width / 2;
      return;
    }

    this.title.container.x = -this.winW / 2;
    this.scroll = this.scene.tweens.add({
      targets: this.title.container,
      x: -this.winW / 2 - overflow,
      duration: Math.round(overflow * SCROLL_MS_PER_PX),
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      hold: SCROLL_HOLD,
      repeatDelay: SCROLL_HOLD,
    });
  }

  arrow(x, y, glyph, dir, depth) {
    const scene = this.scene;
    const text = new PixelText(scene, x, y, glyph, { scale: 2, color: MINI_ARROW });
    text.setDepth(depth + 3);

    const hit = scene.add
      .zone(x, y, 34, this.h)
      .setDepth(depth + 3)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      text.setTint(MINI_ARROW_HOT);
      audio.play('uiHover');
    });
    hit.on('pointerout', () => text.setTint(MINI_ARROW));
    hit.on('pointerdown', () => text.setPosition(x, y + 2));
    hit.on('pointerup', () => {
      text.setPosition(x, y);
      this.step(dir);
    });

    return { text, hit };
  }

  // Wraps in both directions, so with two songs either arrow is a toggle.
  step(dir) {
    this.index = (this.index + dir + PLAYLIST.length) % PLAYLIST.length;
    const name = this.currentName();
    audio.menuTrack = name;
    audio.savePrefs();
    audio.play('uiClick');
    audio.music(name, { fade: 600 });
    this.setTitle(trackTitle(name));
    this.refreshState();
  }

  // Lit note and a bright label once the track is genuinely running; muted
  // colours while it is still queued behind the browser's autoplay gate.
  refreshState() {
    const live = !!audio.el && !audio.el.paused && !audio.muted;
    this.title.setTint(live ? MINI_LABEL : MINI_LABEL_IDLE);

    const g = this.note;
    const x = this.noteX;
    const y = this.cy;
    g.clear();
    g.fillStyle(live ? MINI_ARROW : MINI_LABEL_IDLE, 1);
    g.fillRect(x + 3, y - 8, 2, 10); // stem
    g.fillRect(x + 5, y - 8, 4, 2); // flag
    g.fillRect(x - 2, y + 1, 6, 4); // head
  }

  // Safe to call twice: the shutdown hook fires after the display list has
  // already taken most of this with it.
  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.scroll?.remove();
    this.watch?.remove();
    this.gfx.destroy();
    this.note.destroy();
    this.window.destroy(); // takes the title container with it
    this.maskShape.destroy();
    this.prev.text.destroy();
    this.prev.hit.destroy();
    this.next.text.destroy();
    this.next.hit.destroy();
  }
}

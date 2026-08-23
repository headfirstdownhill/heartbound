import { GAME_W } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { audio } from '../systems/AudioManager.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton, drawChunkyPanel, meadowBackdrop } from '../ui/MenuWidgets.js';
import { buildGirlTextures } from '../gfx/GirlBuilder.js';
import {
  HAIR_STYLES,
  OUTFITS,
  HAIR_COLORS,
  SKIN_TONES,
  EYE_COLORS,
  OUTFIT_COLORS,
} from '../data/lookData.js';

// One column for labels, one for controls, and a band behind each row — the
// first pass left labels floating over the row above and everything ran together.
const CZ_ROW_LABEL_X = 22;
const CZ_ROW_TOP = 292;
const CZ_ROW_STEP = 72;
// Controls sit right of the longest label ("OUTFIT COLOUR", which ends at
// x=176) — at the old centre its first swatch sat on top of the text.
const CZ_CONTROL_CX = 312;
// Sized so the longest row (nine outfit colours) still clears the labels.
const CZ_SWATCH = 24;
const CZ_SWATCH_GAP = 4;

function toInt(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

// Pick-a-colour square. Selected reads as pressed-in with a gold rim.
class Swatch {
  constructor(scene, x, y, color, onPick) {
    this.scene = scene;
    this.cx = x;
    this.cy = y;
    this.color = color;
    this.selected = false;
    this.gfx = scene.add.graphics().setDepth(500);
    this.ring = scene.add.graphics().setDepth(499);
    scene.add
      .zone(x, y, CZ_SWATCH + 2, CZ_SWATCH + 2)
      .setDepth(500)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => audio.play('uiHover'))
      .on('pointerup', () => {
        audio.play('uiClick');
        onPick();
      });
    this.redraw();
  }

  setSelected(on) {
    this.selected = on;
    this.redraw();
  }

  redraw() {
    this.ring.clear();
    if (this.selected) {
      this.ring.fillStyle(0xffe08a, 1);
      this.ring.fillRect(this.cx - CZ_SWATCH / 2 - 3, this.cy - CZ_SWATCH / 2 - 3, CZ_SWATCH + 6, CZ_SWATCH + 6);
    }
    drawChunkyPanel(this.gfx, this.cx, this.cy, CZ_SWATCH, CZ_SWATCH, this.color, {
      pressed: this.selected,
      edge: 3,
      notch: 3,
      bevel: 3,
    });
  }
}

// Her look, picked before the run. Always a girl — this is a gift for one.
export class CustomizeScene extends Phaser.Scene {
  constructor() {
    super('Customize');
  }

  create() {
    this.leaving = false;
    meadowBackdrop(this, 0.78);
    const cx = GAME_W / 2;

    const title = new PixelText(this, cx, 40, 'MAKE HER YOURS!', { scale: 3, color: 0xff8fc0 });
    title.setDepth(600);

    this.buildPreview(cx);

    this.rows = [];
    let y = CZ_ROW_TOP;
    const next = () => {
      const at = y;
      y += CZ_ROW_STEP;
      return at;
    };
    this.presetRow(next(), 'HAIR', HAIR_STYLES, 'hair');
    this.swatchRow(next(), 'HAIR COLOUR', HAIR_COLORS, 'hairColor', (c) => toInt(c.h));
    this.swatchRow(next(), 'SKIN', SKIN_TONES, 'skin', (c) => toInt(c.s));
    this.swatchRow(next(), 'EYES', EYE_COLORS, 'eyes', (c) => toInt(c.e));
    this.presetRow(next(), 'OUTFIT', OUTFITS, 'outfit');
    this.swatchRow(next(), 'OUTFIT COLOUR', OUTFIT_COLORS, 'outfitColor', (c) => toInt(c.d));

    new MenuButton(this, cx - 96, 754, 'BACK', {
      scale: 2,
      padX: 18,
      minWidth: 160,
      onPick: () => this.scene.start('Menu'),
    });
    new MenuButton(this, cx + 96, 754, 'CONFIRM', {
      scale: 2,
      padX: 18,
      color: 0x7ed957,
      minWidth: 160,
      onPick: () => this.confirm(),
    });

    this.refresh();
    this.cameras.main.fadeIn(320, 0, 0, 0);
  }

  // She stands on a lit disc and walks on the spot, so every change is visible
  // on the sprite that actually goes into the game.
  buildPreview(cx) {
    const panel = this.add.graphics().setDepth(400);
    drawChunkyPanel(panel, cx, 158, 196, 158, 0x1b1622, {});
    this.add.ellipse(cx, 214, 96, 22, 0x8f6bb0, 0.45).setDepth(401);

    // Scale 4 rather than 5: at 5 a 32px sprite nearly filled the panel edge
    // to edge with no air around her.
    this.preview = this.add.sprite(cx, 152, 'girl_walk_down').setDepth(402).setScale(4);
    this.preview.play('girl_walk_down');

    this.tweens.add({
      targets: this.preview,
      y: 148,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  // Shared row furniture: a banded background and a left-hand label, so every
  // row lines up on the same two columns.
  rowChrome(y, label) {
    const text = new PixelText(this, CZ_ROW_LABEL_X, y, label, {
      scale: 1,
      color: 0xffe08a,
      align: 'left',
    });
    text.setDepth(600);
  }

  // A named preset with arrows either side.
  presetRow(y, label, list, key) {
    this.rowChrome(y, label);

    const value = new PixelText(this, CZ_CONTROL_CX, y, '', { scale: 2, color: 0xffffff });
    value.setDepth(600);

    const step = (dir) => {
      const look = GameState.look;
      look[key] = (look[key] + dir + list.length) % list.length;
      this.refresh();
    };
    const arrow = { scale: 2, padX: 10, padY: 6 };
    new MenuButton(this, CZ_CONTROL_CX - 128, y, '<', { ...arrow, onPick: () => step(-1) });
    new MenuButton(this, CZ_CONTROL_CX + 128, y, '>', { ...arrow, onPick: () => step(1) });

    this.rows.push({ kind: 'preset', key, list, value });
  }

  // A run of colour squares, centred on the same column as the presets.
  swatchRow(y, label, list, key, colorOf) {
    this.rowChrome(y, label);

    const span = list.length * CZ_SWATCH + (list.length - 1) * CZ_SWATCH_GAP;
    const startX = CZ_CONTROL_CX - span / 2 + CZ_SWATCH / 2;

    const swatches = list.map((entry, i) =>
      new Swatch(this, startX + i * (CZ_SWATCH + CZ_SWATCH_GAP), y, colorOf(entry), () => {
        GameState.look[key] = i;
        this.refresh();
      }),
    );

    this.rows.push({ kind: 'swatch', key, swatches });
  }

  // Rebuild her textures, then re-point the preview at them: replacing a
  // texture leaves any sprite already using it holding a stale frame.
  refresh() {
    buildGirlTextures(this, GameState.look);

    this.preview.anims.stop();
    this.preview.setTexture('girl_walk_down', 0);
    this.preview.play('girl_walk_down');

    this.rows.forEach((row) => {
      const chosen = GameState.look[row.key];
      if (row.kind === 'preset') row.value.setText(row.list[chosen].name);
      else row.swatches.forEach((s, i) => s.setSelected(i === chosen));
    });
  }

  confirm() {
    if (this.leaving) return;
    this.leaving = true;
    audio.play('uiConfirm');
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Name'));
  }
}

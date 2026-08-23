import { GAME_W } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton, KeyCap, meadowBackdrop } from '../ui/MenuWidgets.js';
import { audio } from '../systems/AudioManager.js';

const MAX_NAME = 8;
// Laid out like the keyboard she already knows rather than A to Z: nobody hunts
// for a letter alphabetically, they reach for where it lives on a phone. Rows
// are centred rather than staggered, which is what on-screen keyboards do.
const ROWS = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const KEY_STEP = 44;
const ROW_Y = 384;
const ROW_STEP = 52;

// An on-screen keypad rather than a DOM input: the game is a fullscreen canvas
// with its own font, and a browser text box floating over it looks pasted on.
// The physical keyboard still works for desktop players.
export class NameScene extends Phaser.Scene {
  constructor() {
    super('Name');
  }

  create() {
    this.leaving = false;
    meadowBackdrop(this, 0.72);
    const cx = GAME_W / 2;
    this.name = GameState.playerName ?? '';

    const title = new PixelText(this, cx, 130, 'WHAT IS YOUR NAME', { scale: 2, color: 0xffe08a });
    title.setDepth(600);

    this.nameText = new PixelText(this, cx, 225, this.name, { scale: 4, color: 0xffffff });
    this.nameText.setDepth(600);

    this.placeholder = new PixelText(this, cx, 225, 'ENTER A NAME', { scale: 2, color: 0x6a6480 });
    this.placeholder.setDepth(600);

    this.caret = this.add.rectangle(cx, 250, 22, 4, 0xff4d6d).setDepth(601);
    this.tweens.add({ targets: this.caret, alpha: 0.15, duration: 480, yoyo: true, repeat: -1 });

    this.buildKeypad();

    this.okButton = new MenuButton(this, 388, 636, 'OK', {
      scale: 2,
      padX: 18,
      onPick: () => this.confirm(),
    });
    new MenuButton(this, 268, 636, 'DEL', { scale: 2, padX: 18, onPick: () => this.backspace() });
    new MenuButton(this, 116, 636, 'SPACE', { scale: 2, padX: 18, onPick: () => this.push(' ') });

    new MenuButton(this, cx, 726, 'BACK', {
      scale: 2,
      padX: 18,
      onPick: () => this.scene.start('Customize'),
    });

    this.input.keyboard.on('keydown', (e) => this.onKey(e));

    this.refresh();
    this.cameras.main.fadeIn(320, 0, 0, 0);
  }

  buildKeypad() {
    ROWS.forEach((row, r) => {
      const startX = GAME_W / 2 - ((row.length - 1) * KEY_STEP) / 2;
      row.split('').forEach((ch, i) => {
        new KeyCap(this, startX + i * KEY_STEP, ROW_Y + r * ROW_STEP, ch, (c) => this.push(c));
      });
    });
  }

  onKey(e) {
    if (e.key === 'Backspace') {
      this.backspace();
      return;
    }
    if (e.key === 'Enter') {
      this.confirm();
      return;
    }
    if (e.key === ' ') {
      this.push(' ');
      return;
    }
    if (/^[a-z0-9]$/i.test(e.key)) this.push(e.key.toUpperCase());
  }

  push(ch) {
    if (this.name.length >= MAX_NAME) return;
    audio.play('key');
    // A leading space would read as an empty name on the ending screens.
    if (ch === ' ' && this.name.length === 0) return;
    this.name += ch;
    this.refresh();
  }

  backspace() {
    if (!this.name.length) return;
    audio.play('uiBack');
    this.name = this.name.slice(0, -1);
    this.refresh();
  }

  refresh() {
    const trimmed = this.name.trim();
    this.nameText.setText(this.name);
    this.placeholder.setAlpha(this.name.length ? 0 : 1);
    this.caret.setPosition(GAME_W / 2 + this.nameText.width / 2 + 12, 250);
    this.caret.setVisible(this.name.length < MAX_NAME);
    this.okButton.setEnabled(trimmed.length > 0);
  }

  confirm() {
    const trimmed = this.name.trim();
    if (!trimmed.length || this.leaving) return;
    this.leaving = true;
    audio.play('uiConfirm');
    GameState.playerName = trimmed;
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Difficulty'));
  }
}

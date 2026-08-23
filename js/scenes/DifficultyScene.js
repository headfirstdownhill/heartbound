import { GAME_W } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton, meadowBackdrop } from '../ui/MenuWidgets.js';
import { audio } from '../systems/AudioManager.js';

// Hard is the game as it has always played. Easy adds the boy's ghost and
// changes nothing else, so the two modes stay directly comparable.
export class DifficultyScene extends Phaser.Scene {
  constructor() {
    super('Difficulty');
  }

  create() {
    this.leaving = false;
    meadowBackdrop(this, 0.72);
    const cx = GAME_W / 2;

    // Greeting and heart are separate runs of text so the "<3" can be pink
    // while the rest stays gold; PixelText tints a whole string at once.
    const greet = new PixelText(this, 0, 118, `GOOD LUCK ${GameState.playerName} `, {
      scale: 2,
      color: 0xffe08a,
    });
    const heart = new PixelText(this, 0, 118, '<3', { scale: 2, color: 0xff4d6d });
    const span = greet.width + heart.width;
    greet.setPosition(cx - span / 2 + greet.width / 2, 118).setDepth(600);
    heart.setPosition(cx - span / 2 + greet.width + heart.width / 2, 118).setDepth(600);

    const title = new PixelText(this, cx, 188, 'CHOOSE YOUR RUN', { scale: 3, color: 0xffffff });
    title.setDepth(600);

    // Tharuk is the boy — a fixed character name, not the player's.
    this.buildOption(cx, 300, 'EASY', 0x7ed957, ["THARUK'S GHOST FIGHTS", 'ALONGSIDE YOU'], 'easy');
    this.buildOption(cx, 470, 'HARD', 0xff4d6d, ['NO GHOST.'], 'hard');
    // Deliberately unexplained, and deliberately the loudest thing on screen.
    new MenuButton(this, cx, 645, 'I LOVE YOU JORY!', {
      scale: 2,
      color: 0xe0559a,
      // Padding kept tight so the extra character does not push the button
      // out to the screen edges.
      padX: 20,
      minWidth: 396,
      padY: 24,
      grand: true,
      onPick: () => this.pick('jory'),
    });

    this.cameras.main.fadeIn(320, 0, 0, 0);
  }

  buildOption(x, y, label, color, lines, value, scale = 4, minWidth = 300) {
    new MenuButton(this, x, y, label, {
      scale,
      color,
      minWidth,
      onPick: () => this.pick(value),
    });
    lines.forEach((line, i) => {
      const t = new PixelText(this, x, y + 56 + i * 20, line, { scale: 1, color: 0x9a94b0 });
      t.setDepth(600);
    });
  }

  pick(value) {
    if (this.leaving) return;
    this.leaving = true;
    audio.play('uiConfirm');
    // Her run gets its own send-off, and the music turns over to the meadow
    // before the screen has finished fading.
    if (value === 'jory') {
      this.fx.star(GAME_W / 2, 400, { tint: 0xff8fb0, scale: 1.6 });
      this.fx.sparkleTrail(GAME_W / 2, 400, 0xff8fb0, 24);
      audio.play('heartGet');
    }
    GameState.difficulty = value;
    // The Jory run tells a different story, so it has its own opening.
    const next = value === 'jory' ? 'JoryIntro' : 'Intro';
    this.cameras.main.fadeOut(320, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(next));
  }
}

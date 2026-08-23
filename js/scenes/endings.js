import { GAME_W, GAME_H, TILE } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { runTimer } from '../core/Timer.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton } from '../ui/MenuWidgets.js';
import { installFx } from '../systems/Fx.js';
import { applyPostFX } from '../gfx/PostFX.js';
import { audio } from '../systems/AudioManager.js';

function meadow(scene, keyA = 'tile_grass', keyB = 'tile_grass2') {
  const rt = scene.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0, 0).setDepth(-100);
  for (let y = 0; y < GAME_H; y += TILE) {
    for (let x = 0; x < GAME_W; x += TILE) {
      rt.draw((x / TILE + y / TILE) % 2 ? keyA : keyB, x, y);
    }
  }
  return rt;
}

// Replaying keeps the name and difficulty you chose; only "MAIN MENU" takes you
// back out to change them. Both appear after a beat so the ending gets to land.
function endingButtons(scene, label) {
  const replay = () => {
    audio.play('uiConfirm');
    GameState.reset();
    runTimer.start();
    scene.scene.start('Level1');
    scene.scene.launch('HUD');
  };

  scene.time.delayedCall(1200, () => {
    const again = new MenuButton(scene, GAME_W / 2, 670, label, {
      scale: 3,
      minWidth: 300,
      onPick: replay,
    });
    const menu = new MenuButton(scene, GAME_W / 2, 750, 'MAIN MENU', {
      scale: 2,
      minWidth: 300,
      onPick: () => {
        audio.play('uiBack');
        scene.scene.start('Menu');
      },
    });

    [again, menu].forEach((b, i) => {
      scene.tweens.add({
        targets: [b.gfx, b.text.container],
        alpha: { from: 0, to: 1 },
        duration: 400,
        delay: i * 140,
      });
    });

    scene.input.keyboard.once('keydown-SPACE', replay);
    scene.input.keyboard.once('keydown-ENTER', replay);
  });
}

export class WinScene extends Phaser.Scene {
  constructor() {
    super('Win');
  }

  create() {
    installFx(this);
    meadow(this);
    const cx = GAME_W / 2;
    const cy = 540;

    // Everything the losing screen does not get: light, motion, colour.
    this.fx.ambient('meadow', { x: 0, y: 0, width: GAME_W, height: GAME_H }, 300);
    this.fx.ambient('petals', { x: 0, y: 0, width: GAME_W, height: GAME_H }, 700);
    this.fx.godRays(0, 0, GAME_W, GAME_H, { count: 5, alpha: 0.06, depth: 400 });
    applyPostFX(this, 'win');
    audio.music('victory');

    this.add.image(cx, cy + 40, 'blanket').setDepth(1).setScale(1.7);
    this.add.image(cx + 82, cy + 44, 'basket').setDepth(cy + 44).setScale(1.6);

    const boy = this.add.image(cx - 58, cy, 'boy_cheer').setDepth(cy).setScale(2);
    const girl = this.add.image(cx + 58, cy, 'girl_cheer').setDepth(cy).setScale(2);

    // They both hop, out of phase, so it reads as two people not one animation.
    [boy, girl].forEach((s, i) => {
      this.tweens.add({
        targets: s,
        y: s.y - 22,
        duration: 340,
        yoyo: true,
        repeat: -1,
        delay: i * 170,
        ease: 'Quad.out',
      });
    });

    this.time.delayedCall(600, () => this.showTitle());

    const left = runTimer.format();
    this.time.delayedCall(1900, () => {
      const t = new PixelText(this, cx, 330, `WITH ${left} TO SPARE`, { scale: 2, color: 0xfff2c4 });
      t.setDepth(600).setAlpha(0);
      this.tweens.add({ targets: t.container, alpha: 1, duration: 500 });

      const who = new PixelText(this, cx, 378, `${GameState.playerName} - ${GameState.difficulty} RUN`, {
        scale: 2,
        color: 0xc9a7d6,
      });
      who.setDepth(600).setAlpha(0);
      this.tweens.add({ targets: who.container, alpha: 1, duration: 500, delay: 250 });
    });

    endingButtons(this, 'PLAY AGAIN');
  }

  // Two lines: "I LOVE YOU" on one line at this size would run off a phone screen.
  showTitle() {
    const cx = GAME_W / 2;
    const pop = (obj, to, delay) => {
      obj.setScale(0);
      this.tweens.add({ targets: obj, scale: to, duration: 550, delay, ease: 'Back.out' });
    };

    const line1 = new PixelText(this, cx, 150, 'I LOVE', { scale: 4, color: 0xff4d6d });
    line1.setDepth(600);
    pop(line1.container, 1, 0);

    const line2 = new PixelText(this, cx - 52, 225, 'YOU', { scale: 4, color: 0xff4d6d });
    line2.setDepth(600);
    pop(line2.container, 1, 180);

    const big = this.add.image(cx + 118, 222, 'heart').setDepth(600);
    pop(big, 2, 340);
    const bigGlow = this.add
      .image(cx + 118, 222, 'fx_glow')
      .setTint(0xff4d6d)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(595)
      .setScale(1.2);
    this.tweens.add({
      targets: bigGlow,
      scale: 1.8,
      alpha: 0.85,
      duration: 550,
      yoyo: true,
      repeat: -1,
      delay: 900,
      ease: 'Sine.inOut',
    });

    // A shower of light off the title, then a slow drip of sparks off the heart
    // for as long as the screen is up.
    this.time.delayedCall(340, () => {
      this.fx.star(cx + 118, 222, { tint: 0xffffff, scale: 2 });
      this.fx.sparkleTrail(cx, 190, 0xff8fb0, 30);
      this.fx.ring(cx, 190, { tint: 0xff8fb0, to: 5, duration: 1100, depth: 590 });
      audio.play('win');
    });
    this.time.addEvent({
      delay: 620,
      loop: true,
      callback: () => this.fx.sparkleTrail(cx + 118, 222, 0xff8fb0, 1),
    });
    this.tweens.add({
      targets: big,
      scale: 2.35,
      duration: 550,
      yoyo: true,
      repeat: -1,
      delay: 900,
      ease: 'Sine.inOut',
    });

    [line1, line2].forEach((t, i) =>
      this.tweens.add({
        targets: t.container,
        angle: { from: -2.5, to: 2.5 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        delay: 700 + i * 120,
        ease: 'Sine.inOut',
      }),
    );

    this.cameras.main.flash(500, 255, 200, 220);
  }
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create() {
    installFx(this);
    meadow(this);
    this.cameras.main.setBackgroundColor('#1a1622');
    const cx = GAME_W / 2;
    const cy = 520;

    // Desaturated, heavily vignetted, and the only moving thing is dust.
    applyPostFX(this, 'lose');
    audio.music('sorrow');
    audio.play('lose');
    this.fx.ambient('dungeon', { x: 0, y: 0, width: GAME_W, height: GAME_H }, 300);

    this.add.image(cx, cy + 30, 'blanket').setDepth(1).setScale(1.7).setTint(0x6a6a7a);
    this.add
      .image(cx - 20, cy, 'boy_limp')
      .setAngle(-90)
      .setDepth(cy)
      .setScale(2)
      .setTint(0x7a7a8c);

    const girl = this.add
      .image(cx + 70, cy + 8, 'girl_idle_down')
      .setDepth(cy + 1)
      .setScale(2)
      .setTint(0x9a9aa8);
    this.tweens.add({ targets: girl, y: girl.y + 3, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Drain the colour out of the meadow: she got there, just not in time.
    const veil = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0b14, 0.55).setOrigin(0, 0).setDepth(400);
    this.tweens.add({ targets: veil, fillAlpha: 0.72, duration: 2500 });

    const title = new PixelText(this, cx, 170, 'OUT OF', { scale: 4, color: 0x9c3a58 });
    title.setDepth(600).setAlpha(0);
    this.tweens.add({ targets: title.container, alpha: 1, duration: 900 });

    const title2 = new PixelText(this, cx, 240, 'TIME', { scale: 4, color: 0x9c3a58 });
    title2.setDepth(600).setAlpha(0);
    this.tweens.add({ targets: title2.container, alpha: 1, duration: 900, delay: 300 });

    const sub = new PixelText(this, cx, 310, 'SHE WAS TOO LATE', { scale: 2, color: 0x7a7590 });
    sub.setDepth(600).setAlpha(0);
    this.tweens.add({ targets: sub.container, alpha: 1, duration: 900, delay: 900 });

    const broken = this.add.image(cx, 375, 'heart_empty').setDepth(600).setScale(2.4).setAlpha(0);
    this.tweens.add({ targets: broken, alpha: 1, duration: 900, delay: 1200 });

    const who = new PixelText(this, cx, 440, `NOT THIS TIME ${GameState.playerName}`, {
      scale: 2,
      color: 0x7a7590,
    });
    who.setDepth(600).setAlpha(0);
    this.tweens.add({ targets: who.container, alpha: 1, duration: 900, delay: 1500 });

    endingButtons(this, 'TRY AGAIN');
  }
}

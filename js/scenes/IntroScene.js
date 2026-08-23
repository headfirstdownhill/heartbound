import { GAME_W, GAME_H, TILE } from '../core/Constants.js';
import { CutsceneDirector } from '../systems/CutsceneDirector.js';
import { GameState } from '../core/GameState.js';
import { runTimer } from '../core/Timer.js';
import { PixelText } from '../gfx/PixelText.js';
import { hash2 } from '../gfx/sprites/tiles.js';
import { installFx } from '../systems/Fx.js';
import { applyPostFX, gradePostFX } from '../gfx/PostFX.js';
import { audio } from '../systems/AudioManager.js';

const ZOOM = 1.5;
const FOCUS_X = 240;
const FOCUS_Y = 420;
// What the zoomed camera can actually see, so blobs can start off-screen.
const VIEW_W = GAME_W / ZOOM;
const VIEW_H = GAME_H / ZOOM;
const VIEW = {
  left: FOCUS_X - VIEW_W / 2,
  right: FOCUS_X + VIEW_W / 2,
  top: FOCUS_Y - VIEW_H / 2,
  bottom: FOCUS_Y + VIEW_H / 2,
};

// The opening is told entirely in sprites, tweens and camera work: picnic,
// swarm, theft, collapse, chase, fade. No narration.
export class IntroScene extends Phaser.Scene {
  constructor() {
    super('Intro');
  }

  create() {
    this.done = false;
    this.cameras.main.setZoom(ZOOM).centerOn(FOCUS_X, FOCUS_Y);
    installFx(this);
    this.buildMeadow();

    this.blanket = this.add.image(FOCUS_X, FOCUS_Y + 12, 'blanket').setDepth(1).setScale(0.95);
    this.basket = this.add.image(FOCUS_X + 62, FOCUS_Y + 24, 'basket').setDepth(FOCUS_Y + 24);

    this.boy = this.add.image(FOCUS_X - 34, FOCUS_Y, 'boy_sit').setDepth(FOCUS_Y);
    this.girl = this.add.image(FOCUS_X + 34, FOCUS_Y, 'girl_sit').setDepth(FOCUS_Y);

    this.heart = this.add
      .image(this.boy.x, this.boy.y - 2, 'heart')
      .setDepth(FOCUS_Y + 30)
      .setVisible(false);

    this.shock = this.add
      .image(this.girl.x + 18, this.girl.y - 32, 'shock')
      .setDepth(FOCUS_Y + 40)
      .setVisible(false);

    this.blobs = [];

    this.skipHint = new PixelText(this, FOCUS_X, VIEW.bottom - 26, 'TAP TO SKIP', {
      scale: 1,
      color: 0xffffff,
    });
    this.skipHint.setAlpha(0.55).setDepth(2000);

    this.input.once('pointerdown', () => this.finish());
    this.input.keyboard.once('keydown-SPACE', () => this.finish());
    this.input.keyboard.once('keydown-ENTER', () => this.finish());

    // Starts as the same warm meadow the title screen is, and is dragged
    // toward the dungeon grade over the course of the theft.
    this.fx.ambient('meadow', {
      x: VIEW.left,
      y: VIEW.top,
      width: VIEW.right - VIEW.left,
      height: VIEW.bottom - VIEW.top,
    });
    this.fx.godRays(VIEW.left, VIEW.top, VIEW.right - VIEW.left, VIEW.bottom - VIEW.top, {
      count: 3,
      alpha: 0.06,
    });
    applyPostFX(this, 'meadow');
    // Silent by design — a custom track goes here.
    audio.stopMusic(600);

    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.runScript();
  }

  buildMeadow() {
    const rt = this.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0, 0).setDepth(-100);
    for (let y = 0; y < GAME_H; y += TILE) {
      for (let x = 0; x < GAME_W; x += TILE) {
        rt.draw((x / TILE + y / TILE) % 2 ? 'tile_grass' : 'tile_grass2', x, y);
        const roll = hash2(x, y);
        if (roll < 0.16) rt.draw('flower', x + 3 + roll * 110, y + 4 + hash2(y, x) * 20);
      }
    }
    // A hedge line across the top, with a gap the blobs escape through.
    for (let x = -20; x < GAME_W + 20; x += 26) {
      const gap = x > 120 && x < 190;
      if (gap) continue;
      this.add.image(x, VIEW.top + 26, 'bush').setDepth(VIEW.top + 26);
      this.add.image(x + 13, VIEW.top + 4, 'bush').setDepth(VIEW.top + 4);
    }
    [
      [VIEW.left + 30, FOCUS_Y + 150],
      [VIEW.right - 34, FOCUS_Y + 110],
      [VIEW.left + 46, FOCUS_Y - 110],
      [VIEW.right - 26, FOCUS_Y - 140],
    ].forEach(([x, y]) => this.add.image(x, y, 'bush').setDepth(y));
  }

  spawnBlobs() {
    // `recoil` is where each one backs off to after the theft — chosen so the
    // floating heart, the fallen boy and the girl all stay unobstructed.
    const plan = [
      {
        from: { x: VIEW.left - 40, y: FOCUS_Y - 60 },
        to: { x: this.boy.x - 24, y: this.boy.y - 4 },
        recoil: { x: this.boy.x - 74, y: this.boy.y + 12 },
        tier: 'easy',
      },
      {
        from: { x: VIEW.right + 40, y: FOCUS_Y - 90 },
        to: { x: this.boy.x + 18, y: this.boy.y - 12 },
        recoil: { x: this.boy.x - 40, y: this.boy.y + 60 },
        tier: 'medium',
      },
      {
        from: { x: VIEW.left - 50, y: VIEW.bottom + 30 },
        to: { x: this.boy.x - 4, y: this.boy.y + 14 },
        recoil: { x: this.boy.x + 20, y: this.boy.y + 64 },
        tier: 'easy',
      },
      {
        from: { x: VIEW.right + 50, y: VIEW.bottom + 40 },
        to: { x: this.boy.x + 6, y: this.boy.y - 24 },
        recoil: { x: this.boy.x - 80, y: this.boy.y - 40 },
        tier: 'hard',
      },
    ];
    this.blobs = plan.map((p) => {
      const s = this.add.image(p.from.x, p.from.y, `blob_${p.tier}_idle`);
      s.setDepth(this.boy.depth + 20);
      s.target = p.to;
      s.recoil = p.recoil;
      return s;
    });
  }

  runScript() {
    const director = new CutsceneDirector(this);
    this.director = director;

    director
      // A quiet beat first, so the interruption lands.
      .wait(900)
      .tweenAsync({
        targets: this.girl,
        y: this.girl.y - 3,
        duration: 700,
        yoyo: true,
        repeat: 2,
        ease: 'Sine.inOut',
      })
      .wait(800)
      .call(() => this.spawnBlobs())
      .call(() => {
        this.cameras.main.shake(400, 0.004);
        audio.play('roar');
        gradePostFX(this, 'boss', 1400);
      })
      // Swarm in from every side and pile onto him.
      .tween(() => ({
        targets: this.blobs,
        x: (t, k, v, i) => this.blobs[i].target.x,
        y: (t, k, v, i) => this.blobs[i].target.y,
        duration: 900,
        ease: 'Quad.in',
      }))
      .call(() => {
        this.blobs.forEach((b, i) => {
          this.tweens.add({
            targets: b,
            y: b.y - 9,
            duration: 150,
            yoyo: true,
            repeat: 3,
            delay: i * 55,
            ease: 'Quad.out',
          });
          // One wet impact per blob, staggered with the pile-on, so the swarm
          // sounds like four things landing rather than one event.
          this.time.delayedCall(i * 55, () => {
            audio.play('squelch', { pitch: 0.9 + i * 0.12 });
            this.fx.gooBurst(b.x, b.y, 0x7ed957, 6);
            this.fx.dust(b.x, b.y + 8, 4, 0x9ec46a);
          });
        });
        this.cameras.main.shake(700, 0.009);
      })
      .wait(900)
      // The heart is torn out.
      .call(() => {
        this.heart.setVisible(true).setPosition(this.boy.x, this.boy.y - 2).setScale(0.6);
        this.cameras.main.flash(200, 255, 120, 150);
        this.fx.ring(this.boy.x, this.boy.y - 2, { tint: 0xff4d6d, to: 2.4, duration: 700, alpha: 1 });
        this.fx.gooBurst(this.boy.x, this.boy.y - 2, 0xff4d6d, 16);
        this.fx.punch(0.016, 300, 0.03);
        audio.duck(0.3, 900);
        audio.play('steal');
      })
      .tween({ targets: this.heart, y: this.heart.y - 52, scale: 1.1, duration: 520, ease: 'Back.out' })
      // Scatter off him first, otherwise the pile hides the collapse entirely.
      .tween(() => ({
        targets: this.blobs,
        x: (t, k, v, i) => this.blobs[i].recoil.x,
        y: (t, k, v, i) => this.blobs[i].recoil.y,
        duration: 320,
        ease: 'Quad.out',
      }))
      .call(() => {
        // He goes limp and falls flat where he sat.
        this.boy.setTexture('boy_limp');
        this.fx.dust(this.boy.x, this.boy.y + 16, 8, 0x9ec46a);
        audio.play('thud');
        this.tweens.add({
          targets: this.boy,
          angle: -90,
          x: this.boy.x - 10,
          y: this.boy.y + 16,
          duration: 420,
          ease: 'Quad.in',
        });
      })
      .wait(520)
      .call(() => {
        this.shock.setVisible(true).setScale(0.4);
        audio.play('hurt');
        this.tweens.add({ targets: this.shock, scale: 1, duration: 240, ease: 'Back.out' });
        this.tweens.add({ targets: this.girl, y: this.girl.y - 10, duration: 160, yoyo: true, repeat: 1 });
      })
      // Hold on him lying there before she moves.
      .wait(900)
      .call(() => {
        this.girl.setTexture('girl_idle_up');
        this.shock.setVisible(false);
      })
      // They bolt for the gap in the hedge, heart in tow.
      .tweenAsync(() => ({
        targets: [...this.blobs, this.heart],
        x: 155,
        y: VIEW.top - 40,
        duration: 1000,
        ease: 'Quad.in',
      }))
      .wait(280)
      .tween({ targets: this.girl, x: 165, y: VIEW.top + 30, duration: 900, ease: 'Quad.in' })
      .call(() => this.cameras.main.fadeOut(700, 0, 0, 0))
      .wait(850)
      .call(() => this.finish());

    director.play();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.director?.stop();
    GameState.reset();
    GameState.seenIntro = true;
    runTimer.start();
    this.scene.start('Level1');
    this.scene.launch('HUD');
  }
}

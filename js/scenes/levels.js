import { BaseLevelScene } from './BaseLevelScene.js';
import { GameState } from '../core/GameState.js';
import { runTimer } from '../core/Timer.js';
import { EV_HEART_TAKEN } from '../core/Constants.js';
import { audio } from '../systems/AudioManager.js';
import { gradePostFX } from '../gfx/PostFX.js';

export class Level1Scene extends BaseLevelScene {
  constructor() {
    super('Level1', 1);
  }

  onCreated() {
    const hud = this.scene.get('HUD');
    if (!GameState.isEasy) {
      hud?.showHint('GRAB THE SWORD', 2600);
      return;
    }
    // Explain the ghost before pointing her at the sword, or it just looks like
    // a bug the first time something else lands a hit.
    hud?.showHint('HIS GHOST CAME WITH YOU', 2400);
    this.time.delayedCall(2900, () => hud?.showHint('GRAB THE SWORD', 2600));
  }
}

export class Level2Scene extends BaseLevelScene {
  constructor() {
    super('Level2', 2);
  }

  onCreated() {
    this.scene.get('HUD')?.showHint('LEVEL 2', 1600);
  }
}

export class Level3Scene extends BaseLevelScene {
  constructor() {
    super('Level3', 3);
  }

  // The one room with something in it worth its own piece of music.
  musicTrack() {
    return 'boss';
  }

  onCreated() {
    // Stale from a previous run this would block the new heart from ever
    // dropping, since onRoomCleared bails when heartDrop is already set.
    this.heartDrop = null;
    this.scene.get('HUD')?.showHint('IT HAS HIS HEART', 2600);
    // Harder corners, hotter bloom and more aberration than the other dungeon
    // rooms, so the room itself reads as the fight.
    gradePostFX(this, 'boss', 1200);
    this.time.delayedCall(700, () => audio.play('roar'));
  }

  // The boss drops the heart where it dies; the exit stays shut until she has it.
  onRoomCleared() {
    if (GameState.heartRecovered || this.heartDrop) return;
    const x = this.boss ? this.boss.x : this.room.spawns.boss.x;
    const y = this.boss ? this.boss.y : this.room.spawns.boss.y;
    this.heartDrop = this.add.image(x, y, 'heart').setDepth(y).setScale(0.4);
    this.tweens.add({ targets: this.heartDrop, scale: 1, duration: 400, ease: 'Back.out' });
    this.tweens.add({
      targets: this.heartDrop,
      y: y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      delay: 400,
      ease: 'Sine.inOut',
    });
    this.scene.get('HUD')?.showHint('TAKE IT BACK');

    // It is the object the entire run is about, so it gets its own light and
    // keeps sparking until she picks it up.
    this.heartGlow = this.add
      .image(x, y, 'fx_glow')
      .setTint(0xff4d6d)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 1)
      .setScale(0.9);
    this.tweens.add({
      targets: this.heartGlow,
      scale: 1.4,
      alpha: 0.8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    if (this.fx.lightRT) this.fx.addLight(this.heartDrop, { size: 260 });
    this.heartSparkle = this.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        if (this.heartDrop) this.fx.sparkleTrail(this.heartDrop.x, this.heartDrop.y, 0xff8fb0, 1);
      },
    });
    audio.play('sparkle');
  }

  onUpdate() {
    if (!this.heartDrop || GameState.heartRecovered) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.heartDrop.x, this.heartDrop.y) < 28) {
      GameState.heartRecovered = true;
      this.game.events.emit(EV_HEART_TAKEN);
      this.fx.star(this.heartDrop.x, this.heartDrop.y, { tint: 0xff8fb0, scale: 1.1 });
      this.fx.sparkleTrail(this.heartDrop.x, this.heartDrop.y, 0xff8fb0, 18);
      this.fx.ring(this.heartDrop.x, this.heartDrop.y, { tint: 0xff4d6d, to: 2.2, duration: 620 });
      this.fx.tint([1, 0.6, 0.72], 0.5, 420);
      this.heartSparkle?.remove();
      this.heartGlow?.destroy();
      this.heartGlow = null;
      this.heartDrop.destroy();
      this.heartDrop = null;
      audio.play('heartGet');
      super.onRoomCleared();
      this.scene.get('HUD')?.showHint('RUN! GET BACK TO HIM');
    }
  }
}

// The final stretch: a short run back to where he fell, with the clock still going.
export class ReturnScene extends BaseLevelScene {
  constructor() {
    super('Return', 'return');
  }

  // Nothing left to fight for, only distance to cover.
  musicTrack() {
    return 'chase';
  }

  onCreated(room) {
    // Left true from a previous run, onUpdate returns early forever and the
    // heart can never be delivered again.
    this.delivered = false;

    this.boy = this.add
      .image(room.spawns.boy.x, room.spawns.boy.y, 'boy_limp')
      .setAngle(-90)
      .setDepth(room.spawns.boy.y);

    this.carried = this.add
      .image(this.player.x, this.player.y - 26, 'heart')
      .setDepth(9999)
      .setScale(0.7);

    this.blanketProp = this.add
      .image(room.spawns.boy.x + 6, room.spawns.boy.y + 10, 'blanket')
      .setDepth(room.spawns.boy.y - 40)
      .setAlpha(0.9);

    // She is carrying the only light in the frame that matters. It trails
    // sparks the whole way back, so the run reads as an errand with a deadline.
    this.carriedGlow = this.add
      .image(this.player.x, this.player.y - 26, 'fx_glow')
      .setTint(0xff4d6d)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(9998)
      .setScale(0.8);
    this.tweens.add({
      targets: this.carriedGlow,
      scale: 1.15,
      alpha: 0.8,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.carryTrail = this.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => {
        if (!this.delivered) this.fx.sparkleTrail(this.carried.x, this.carried.y, 0xff8fb0, 1);
      },
    });

    // He is lying exactly where the intro left him, so mark the spot: a slow
    // pale glow that is visible from anywhere in the room.
    this.boyGlow = this.add
      .image(this.boy.x, this.boy.y, 'fx_glow')
      .setTint(0xbfd8ff)
      .setAlpha(0.24)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.boy.depth - 1)
      .setScale(1.4);
    this.tweens.add({
      targets: this.boyGlow,
      alpha: 0.45,
      scale: 1.8,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.scene.get('HUD')?.showHint('PUT IT BACK', 2600);
  }

  // The door here is the boy himself — no exit to unlock.
  onRoomCleared() {}

  onUpdate() {
    this.carried.setPosition(this.player.x, this.player.y - 26);
    this.carriedGlow?.setPosition(this.player.x, this.player.y - 26);
    if (this.delivered) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.boy.x, this.boy.y) < 30) {
      this.deliverHeart();
    }
  }

  deliverHeart() {
    this.delivered = true;
    this.finished = true;
    runTimer.stop();
    this.player.freeze();
    this.carryTrail?.remove();
    audio.play('heartGet');

    this.tweens.add({
      targets: [this.carried, this.carriedGlow],
      x: this.boy.x,
      y: this.boy.y,
      scale: 1.4,
      duration: 520,
      ease: 'Quad.in',
      onComplete: () => {
        this.cameras.main.flash(400, 255, 160, 190);
        // The moment the whole run has been for: everything goes off at once.
        this.fx.tint([1, 0.75, 0.85], 0.85, 700);
        this.fx.ring(this.boy.x, this.boy.y, { tint: 0xff8fb0, to: 4, duration: 900, alpha: 1 });
        this.fx.star(this.boy.x, this.boy.y, { tint: 0xffffff, scale: 2 });
        this.fx.sparkleTrail(this.boy.x, this.boy.y, 0xff8fb0, 40);
        this.fx.punch(0.01, 400, 0.02);
        audio.duck(0.25, 1200);
        audio.play('win');
        this.carried.destroy();
        this.carriedGlow?.destroy();
        this.time.delayedCall(500, () => {
          this.scene.stop('HUD');
          this.scene.start('Win');
        });
      },
    });
  }
}

import { Blob } from './Blob.js';
import { BLOB_STATS } from '../data/levelData.js';
import { EV_BLOB_DIED } from '../core/Constants.js';
import { audio } from '../systems/AudioManager.js';

const WINDUP_MS = 850;
const LUNGE_MS = 420;
const STUN_MS = 900;
const IDLE_BETWEEN_MS = 1300;
const MINION_INTERVAL_MS = 7000;

// Phase 1 is a readable charge: telegraph, lunge, then a stun window that is the
// player's invitation to hit back. Phase 2 keeps that and adds adds.
export class BossBlob extends Blob {
  constructor(scene, x, y) {
    // The boss's textures are `boss_*`, not `blob_boss_*`; without the prefix
    // the base constructor asks for a texture that was never built.
    super(scene, x, y, 'boss', null, 'boss');
    this.stats = BLOB_STATS.boss;
    this.hp = this.stats.hp;
    this.maxHp = this.stats.hp;
    this.phase = 1;
    this.mode = 'idle';
    this.modeUntil = 0;
    this.nextMinionAt = 0;
    this.lungeVec = { x: 0, y: 0 };
    this.onSpawnMinion = null;

    this.sprite.setTexture('boss_idle');
    this.sprite.body.setSize(58, 40).setOffset(7, 16);
    this.sprite.play('boss_idle');

    // Both bosses drive their own update(), so the base class's body glow would
    // never be moved off the spawn point. They carry a telegraph aura instead,
    // which does the same job better, so drop the inherited one.
    this.glow?.destroy();
    this.glow = null;

    // The stolen heart rides on top of it until the thing dies.
    this.heart = scene.add.image(x, y - 40, 'heart').setDepth(y + 5);
    scene.tweens.add({
      targets: this.heart,
      y: this.heart.y - 6,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // A red glow under it that only comes up during the telegraph. It is the
    // same information the windup animation already carries, said a second way,
    // because that windup is the one thing in the game the player must not miss.
    this.aura = scene.add
      .image(x, y, 'fx_glow')
      .setTint(0xff2a5c)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 2)
      .setScale(1.5);

    // The heart it stole beats visibly, so it stays the thing you are looking at.
    this.heartGlow = scene.add
      .image(x, y - 40, 'fx_glow')
      .setTint(0xff4d6d)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y + 4)
      .setScale(0.6);
    scene.tweens.add({
      targets: this.heartGlow,
      scale: 0.95,
      alpha: 0.85,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  update(time, player) {
    if (this.dying) return;
    const body = this.sprite.body;
    this.heart?.setPosition(this.sprite.x, this.sprite.y - 42).setDepth(this.sprite.y + 5);
    this.heartGlow?.setPosition(this.sprite.x, this.sprite.y - 42).setDepth(this.sprite.y + 4);
    this.aura?.setPosition(this.sprite.x, this.sprite.y + 6).setDepth(this.sprite.y - 2);

    if (this.phase === 1 && this.hp <= this.maxHp * 0.5) {
      this.phase = 2;
      this.nextMinionAt = time + 1200;
      this.scene.cameras.main.flash(220, 120, 20, 60);
      this.scene.fx?.ring(this.x, this.y, { tint: 0xff2a5c, to: 2.4, duration: 620, alpha: 1 });
      this.scene.fx?.smoke(this.x, this.y, 12, 0x6e1f42);
      this.scene.fx?.punch(0.014, 320, 0.02);
      audio.duck(0.3, 900);
      audio.play('roar');
    }

    if (this.phase === 2 && time > this.nextMinionAt && this.mode === 'idle') {
      this.nextMinionAt = time + MINION_INTERVAL_MS;
      this.onSpawnMinion?.(this);
    }

    if (time < this.modeUntil) {
      if (this.mode === 'lunge') {
        body.setVelocity(this.lungeVec.x, this.lungeVec.y);
      } else if (this.mode === 'stun') {
        body.setVelocity(0, 0);
      } else if (this.mode === 'windup') {
        body.setVelocity(0, 0);
      } else {
        // Idle drift toward the player so it never fully disengages.
        const a = Math.atan2(player.y - this.y, player.x - this.x);
        body.setVelocity(Math.cos(a) * this.stats.speed * 0.5, Math.sin(a) * this.stats.speed * 0.5);
      }
      this.sprite.setDepth(this.sprite.y);
      return;
    }

    this.advanceMode(time, player);
    this.sprite.setDepth(this.sprite.y);
  }

  advanceMode(time, player) {
    if (this.mode === 'idle') {
      this.mode = 'windup';
      this.modeUntil = time + WINDUP_MS;
      this.sprite.play('boss_windup');
      this.squash = this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.12,
        scaleY: 0.88,
        duration: WINDUP_MS,
        ease: 'Quad.in',
      });
      // The aura swells for exactly as long as the windup lasts, so it reads as
      // a fuse burning down rather than as decoration.
      this.scene.tweens.add({
        targets: this.aura,
        alpha: 0.75,
        scale: 2.3,
        duration: WINDUP_MS,
        ease: 'Quad.in',
      });
      audio.play('bossTell');
    } else if (this.mode === 'windup') {
      this.mode = 'lunge';
      this.modeUntil = time + LUNGE_MS;
      this.squash?.remove();
      this.sprite.setScale(1);
      this.sprite.play('boss_idle');
      const a = Math.atan2(player.y - this.y, player.x - this.x);
      const speed = this.phase === 2 ? 400 : 330;
      this.lungeVec = { x: Math.cos(a) * speed, y: Math.sin(a) * speed };
      this.scene.tweens.add({ targets: this.aura, alpha: 0, scale: 1.5, duration: 220 });
      this.scene.fx?.dust(this.x, this.y + 14, 8, 0x6e1f42);
      audio.play('bossLunge');
    } else if (this.mode === 'lunge') {
      this.mode = 'stun';
      this.modeUntil = time + STUN_MS;
      this.scene.cameras.main.shake(180, 0.012);
      this.scene.fx?.ring(this.x, this.y + 10, { tint: 0xff8fb0, to: 1.5, duration: 420 });
      this.scene.fx?.dust(this.x, this.y + 14, 10, 0x8a6a4a);
      audio.play('thud');
    } else {
      this.mode = 'idle';
      this.modeUntil = time + (this.phase === 2 ? IDLE_BETWEEN_MS * 0.7 : IDLE_BETWEEN_MS);
    }
  }

  takeDamage(amount, fromX, fromY, time) {
    if (this.dying) return;
    // Hitting it mid-charge should not stop the charge; that is the whole tell.
    const bonus = this.mode === 'stun' ? 1.5 : 1;
    const dealt = amount * bonus;
    this.hp -= dealt;

    const fx = this.scene.fx;
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    fx?.hitSpark(this.x - Math.cos(angle) * 18, this.y - Math.sin(angle) * 18, 0xfff2c4, 9);
    fx?.gooBurst(this.x, this.y, this.tint, 7);
    // Landing a hit in the stun window is worth half again as much, so it is
    // called out: a bigger, brighter number than an ordinary one.
    fx?.damageNumber(this.x, this.y - 24, dealt, bonus > 1 ? 0xffd34d : 0xfff2c4, bonus > 1);
    fx?.punch(bonus > 1 ? 0.008 : 0.004, 110, 0.012);
    audio.play('squelch', { pitch: this.pitch });

    if (this.hp <= 0) {
      this.die();
      return;
    }
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => !this.dying && this.sprite.clearTint());
  }

  die() {
    this.dying = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.enable = false;
    this.sprite.clearTint();
    this.sprite.setScale(1);
    // The carried heart is handed off to the level, which spawns the pickup in
    // this exact spot. Leaving it alive strands a second heart on the floor.
    this.heart?.destroy();
    this.heart = null;
    this.heartGlow?.destroy();
    this.heartGlow = null;
    this.aura?.destroy();
    this.aura = null;
    this.sprite.play('boss_death');
    this.glow?.destroy();
    this.glow = null;
    this.scene.cameras.main.shake(600, 0.02);

    // A staggered chain rather than one burst: a boss coming apart should take
    // long enough that you notice it happening.
    const fx = this.scene.fx;
    fx?.tint([1, 0.5, 0.7], 0.55, 420);
    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 110, () => {
        const ox = Phaser.Math.Between(-26, 26);
        const oy = Phaser.Math.Between(-20, 14);
        fx?.burst(this.x + ox, this.y + oy, { tint: 0xff8fb0, scale: 1.3, duration: 300 });
        fx?.gooBurst(this.x + ox, this.y + oy, this.tint, 10);
        fx?.ring(this.x + ox, this.y + oy, { tint: 0xff4d6d, to: 1, duration: 420 });
      });
    }
    audio.duck(0.25, 1400);
    audio.play('roar');
    this.scene.time.delayedCall(260, () => audio.play('nuke'));

    this.scene.game.events.emit(EV_BLOB_DIED, this);
    this.sprite.once('animationcomplete', () => this.sprite.destroy());
  }

  destroy() {
    this.heart?.destroy();
    this.heartGlow?.destroy();
    this.aura?.destroy();
    this.sprite.destroy();
  }
}

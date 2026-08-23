import { Blob } from './Blob.js';
import { FINAL_BOSS_STATS } from '../data/joryData.js';
import { EV_BLOB_DIED } from '../core/Constants.js';
import { audio } from '../systems/AudioManager.js';

// The thing waiting at the end of wave five. It keeps the level 3 boss's
// readable rhythm — tell, commit, recover — but cycles three different
// commitments instead of one, and the gaps close as its health drops.
const FB_WINDUP_MS = 700;
const FB_LUNGE_MS = 460;
const FB_STUN_MS = 780;
const FB_IDLE_MS = 1150;
const FB_SLAM_WINDUP_MS = 780;
const FB_SLAM_RADIUS = 132;
const FB_SUMMON_COUNT = 4;

export class FinalBoss extends Blob {
  constructor(scene, x, y) {
    super(scene, x, y, 'final', FINAL_BOSS_STATS, 'final');
    this.maxHp = FINAL_BOSS_STATS.hp;
    this.hp = this.maxHp;
    this.phase = 1;
    this.mode = 'idle';
    this.modeUntil = 0;
    this.lungeVec = { x: 0, y: 0 };
    this.attackIndex = 0;
    this.onSpawnMinion = null;
    this.onSlam = null;

    this.sprite.setTexture('final_idle');
    this.sprite.body.setSize(FINAL_BOSS_STATS.hitW, FINAL_BOSS_STATS.hitH).setOffset(7, 22);
    this.sprite.play('final_idle');

    // Both bosses drive their own update(), so the base class's body glow would
    // never be moved off the spawn point. They carry a telegraph aura instead,
    // which does the same job better, so drop the inherited one.
    this.glow?.destroy();
    this.glow = null;

    // The sprite is a near-black silhouette by design, so it needs its own light
    // to exist at all in a lit room — and that light is also the telegraph.
    this.aura = scene.add
      .image(x, y, 'fx_glow')
      .setTint(0x9c2050)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 2)
      .setScale(1.7);
    // Two lit eyes, so the silhouette is looking at you.
    this.eyes = scene.add
      .image(x, y - 14, 'fx_glow')
      .setTint(0xff2a5c)
      .setAlpha(0.65)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y + 2)
      .setScale(0.45);
    scene.tweens.add({
      targets: this.eyes,
      alpha: 0.95,
      scale: 0.55,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  // Speeds up as it loses health rather than changing what it does, so the
  // fight gets harder without becoming unreadable.
  get pace() {
    return this.phase === 3 ? 0.62 : this.phase === 2 ? 0.8 : 1;
  }

  update(time, player) {
    if (this.dying) return;
    const body = this.sprite.body;

    this.aura?.setPosition(this.sprite.x, this.sprite.y + 4).setDepth(this.sprite.y - 2);
    this.eyes?.setPosition(this.sprite.x, this.sprite.y - 14).setDepth(this.sprite.y + 2);

    const ratio = this.hp / this.maxHp;
    const wanted = ratio <= 0.33 ? 3 : ratio <= 0.66 ? 2 : 1;
    if (wanted > this.phase) {
      this.phase = wanted;
      this.scene.cameras.main.flash(240, 150, 20, 80);
      this.scene.cameras.main.shake(260, 0.008);
      this.scene.fx?.ring(this.x, this.y, { tint: 0xff2a5c, to: 3, duration: 700, alpha: 1 });
      this.scene.fx?.smoke(this.x, this.y, 14, 0x33061a);
      // It burns hotter with every phase, so the light it throws grows too.
      this.aura?.setAlpha(0.3 + this.phase * 0.12);
      audio.duck(0.3, 900);
      audio.play('phase');
    }

    if (time < this.modeUntil) {
      if (this.mode === 'lunge') body.setVelocity(this.lungeVec.x, this.lungeVec.y);
      else if (this.mode === 'idle') {
        const a = Math.atan2(player.y - this.y, player.x - this.x);
        body.setVelocity(Math.cos(a) * this.stats.speed * 0.6, Math.sin(a) * this.stats.speed * 0.6);
      } else {
        body.setVelocity(0, 0);
      }
      this.sprite.setDepth(this.sprite.y);
      return;
    }

    this.advanceMode(time, player);
    this.sprite.setDepth(this.sprite.y);
  }

  advanceMode(time, player) {
    switch (this.mode) {
      case 'idle':
        this.beginAttack(time);
        break;

      case 'windup': {
        this.mode = 'lunge';
        this.modeUntil = time + FB_LUNGE_MS * this.pace;
        this.squash?.remove();
        this.sprite.setScale(1);
        this.sprite.play('final_idle');
        const a = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = 330 + (this.phase - 1) * 70;
        this.lungeVec = { x: Math.cos(a) * speed, y: Math.sin(a) * speed };
        this.scene.fx?.dust(this.x, this.y + 16, 9, 0x33061a);
        audio.play('bossLunge');
        break;
      }

      case 'slamwind':
        this.mode = 'stun';
        this.modeUntil = time + FB_STUN_MS * this.pace;
        this.squash?.remove();
        this.sprite.setScale(1);
        this.sprite.play('final_idle');
        this.onSlam?.(this, FB_SLAM_RADIUS);
        audio.play('slam');
        break;

      case 'summon':
        this.mode = 'stun';
        this.modeUntil = time + FB_STUN_MS * this.pace;
        this.sprite.play('final_idle');
        this.onSpawnMinion?.(this, FB_SUMMON_COUNT + (this.phase - 1));
        audio.play('summon');
        break;

      case 'lunge':
        this.mode = 'stun';
        this.modeUntil = time + FB_STUN_MS * this.pace;
        this.scene.cameras.main.shake(200, 0.013);
        this.scene.fx?.ring(this.x, this.y + 10, { tint: 0xff2a5c, to: 1.6, duration: 440 });
        this.scene.fx?.dust(this.x, this.y + 16, 10, 0x8a6a4a);
        audio.play('thud');
        break;

      default:
        this.mode = 'idle';
        this.modeUntil = time + FB_IDLE_MS * this.pace;
    }
  }

  // Charge, ring slam, charge, summon — a fixed rotation, so the fight can be
  // learned. Summoning only starts once it is properly hurt.
  beginAttack(time) {
    const rotation = this.phase === 1 ? ['charge', 'slam'] : ['charge', 'slam', 'charge', 'summon'];
    const pick = rotation[this.attackIndex % rotation.length];
    this.attackIndex += 1;

    // Each of the three has its own colour, so which one is coming is readable
    // from the glow alone before the animation has finished playing.
    const telegraph = {
      slam: 0xff9a2a,
      summon: 0x9a5cff,
      charge: 0xff2a5c,
    }[pick];
    this.aura?.setTint(telegraph);
    this.scene.tweens.add({
      targets: this.aura,
      alpha: 0.85,
      scale: 2.6,
      duration: FB_SLAM_WINDUP_MS * this.pace,
      ease: 'Quad.in',
      yoyo: true,
    });
    audio.play('bossTell');

    if (pick === 'slam') {
      this.mode = 'slamwind';
      this.modeUntil = time + FB_SLAM_WINDUP_MS * this.pace;
      this.sprite.play('final_slam');
      this.squash = this.scene.tweens.add({
        targets: this.sprite,
        scaleX: 0.84,
        scaleY: 1.2,
        duration: FB_SLAM_WINDUP_MS * this.pace,
        ease: 'Quad.in',
      });
      return;
    }

    if (pick === 'summon') {
      this.mode = 'summon';
      this.modeUntil = time + FB_SLAM_WINDUP_MS * this.pace;
      this.sprite.play('final_windup');
      return;
    }

    this.mode = 'windup';
    this.modeUntil = time + FB_WINDUP_MS * this.pace;
    this.sprite.play('final_windup');
    this.squash = this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.14,
      scaleY: 0.86,
      duration: FB_WINDUP_MS * this.pace,
      ease: 'Quad.in',
    });
  }

  takeDamage(amount, fromX, fromY, time) {
    if (this.dying) return;
    // Same deal as the level 3 boss: the recovery window is where the damage
    // is, and hitting it mid-charge does not interrupt the charge.
    const bonus = this.mode === 'stun' ? 1.5 : 1;
    const dealt = amount * bonus;
    this.hp -= dealt;

    const fx = this.scene.fx;
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    fx?.hitSpark(this.x - Math.cos(angle) * 20, this.y - Math.sin(angle) * 20, 0xffd34d, 10);
    fx?.gooBurst(this.x, this.y, 0x9c2050, 8);
    fx?.damageNumber(this.x, this.y - 28, dealt, bonus > 1 ? 0xffd34d : 0xfff2c4, bonus > 1);
    fx?.punch(bonus > 1 ? 0.009 : 0.004, 110, 0.012);
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
    this.squash?.remove();
    this.sprite.play('final_death');
    this.glow?.destroy();
    this.glow = null;
    this.scene.cameras.main.shake(900, 0.022);

    // The light it was made of goes out first, then it comes apart. Eight
    // staggered bursts over a second, because this is the last enemy in the
    // game and it should take its time.
    const fx = this.scene.fx;
    this.scene.tweens.add({ targets: [this.aura, this.eyes], alpha: 0, scale: 0.2, duration: 500 });
    fx?.tint([1, 0.35, 0.55], 0.6, 700);
    for (let i = 0; i < 8; i++) {
      this.scene.time.delayedCall(i * 120, () => {
        const ox = Phaser.Math.Between(-34, 34);
        const oy = Phaser.Math.Between(-26, 18);
        fx?.burst(this.x + ox, this.y + oy, { tint: 0xff6a9a, scale: 1.5, duration: 320 });
        fx?.gooBurst(this.x + ox, this.y + oy, 0x9c2050, 12);
        fx?.ring(this.x + ox, this.y + oy, { tint: 0xff2a5c, to: 1.2, duration: 460 });
        fx?.star(this.x + ox, this.y + oy, { tint: 0xffd34d, scale: 0.7 });
      });
    }
    audio.duck(0.2, 1800);
    audio.play('roar');
    this.scene.time.delayedCall(300, () => audio.play('nuke'));

    this.scene.game.events.emit(EV_BLOB_DIED, this);
    this.sprite.once('animationcomplete', () => this.sprite.destroy());
  }

  destroy() {
    this.aura?.destroy();
    this.eyes?.destroy();
    this.sprite.destroy();
  }
}

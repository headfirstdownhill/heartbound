import { audio } from '../systems/AudioManager.js';

// Easy mode only. The boy's ghost trails the girl and takes swings at whatever
// is closest. It is deliberately a slow, occasional hitter: it should make a
// crowded room survivable, not clear the room for you.
//
// Names are GHOST_-prefixed because the single-file build drops every module
// into one shared scope — a bare ATTACK_COOLDOWN_MS collides with Constants.js.
const GHOST_FOLLOW_LAG = 0.055; // how quickly it closes on its resting spot
const GHOST_CHASE_LAG = 0.085; // faster once it has picked a target
const GHOST_REST_OFFSET = 34; // how far behind the girl it idles
const GHOST_SEEK_RANGE = 165; // how far it will look for something to hit
const GHOST_LEASH = 210; // never strays further than this from the girl
const GHOST_STANDOFF = 22; // hovers beside its target rather than inside it
const GHOST_ATTACK_RANGE = 34;
const GHOST_ATTACK_COOLDOWN_MS = 1300;
const GHOST_DAMAGE = 7;
const GHOST_BOB_PX = 4;

// Intangible on purpose — no physics body, no collisions, no health. It drifts
// through hedges and blobs ignore it entirely.
// `opts` exists so the Jory run's allied blobs can reuse this whole
// follow-and-strike behaviour with a different skin and a lifetime.
export class GhostCompanion {
  constructor(scene, x, y, opts = {}) {
    const {
      texture = 'ghost_float',
      anim = 'ghost_float',
      tint = 0x9fd8ff,
      alpha = 0.62,
      damage = GHOST_DAMAGE,
      cooldown = GHOST_ATTACK_COOLDOWN_MS,
      range = GHOST_ATTACK_RANGE,
      restVec = { x: -GHOST_REST_OFFSET * 0.7, y: -GHOST_REST_OFFSET },
      lifetimeMs = 0,
    } = opts;

    this.scene = scene;
    this.nextAttackAt = 0;
    this.target = null;
    this.damage = damage;
    this.cooldown = cooldown;
    this.range = range;
    this.restVec = restVec;
    this.expiresAt = lifetimeMs ? scene.time.now + lifetimeMs : 0;

    // The drift is tracked here rather than on the sprite: the idle bob is
    // applied at draw time, and a tween owning sprite.y would overwrite every
    // move this class makes.
    this.px = x + restVec.x;
    this.py = y + restVec.y;

    this.sprite = scene.add.sprite(this.px, this.py, texture);
    this.sprite.setAlpha(alpha).setDepth(this.py);
    if (tint !== null) this.sprite.setTint(tint);
    if (anim && scene.anims.exists(anim)) this.sprite.play(anim);

    this.slash = scene.add.image(x, y, 'slash').setTint(tint ?? 0xffffff).setVisible(false);
    this.slash.setScale(0.8);
  }

  get expired() {
    return this.expiresAt > 0 && this.scene.time.now >= this.expiresAt;
  }

  get x() {
    return this.px;
  }

  get y() {
    return this.py;
  }

  update(time, player, blobs) {
    this.target = this.pickTarget(player, blobs);
    const goal = this.goalFor(player);
    const lag = this.target ? GHOST_CHASE_LAG : GHOST_FOLLOW_LAG;

    this.px += (goal.x - this.px) * lag;
    this.py += (goal.y - this.py) * lag;

    // Snap back if it somehow gets dragged past the leash.
    const stray = Phaser.Math.Distance.Between(this.px, this.py, player.x, player.y);
    if (stray > GHOST_LEASH) {
      const a = Math.atan2(this.py - player.y, this.px - player.x);
      this.px = player.x + Math.cos(a) * GHOST_LEASH;
      this.py = player.y + Math.sin(a) * GHOST_LEASH;
    }

    const face = this.target ? this.target.x : player.x;
    this.sprite.setFlipX(face < this.px);
    this.sprite.setPosition(this.px, this.py + Math.sin(time / 420) * GHOST_BOB_PX);
    this.sprite.setDepth(this.py);

    if (
      this.target &&
      time >= this.nextAttackAt &&
      Phaser.Math.Distance.Between(this.px, this.py, this.target.x, this.target.y) < this.range
    ) {
      this.attack(time);
    }
  }

  goalFor(player) {
    if (!this.target) {
      return { x: player.x + this.restVec.x, y: player.y + this.restVec.y };
    }
    // Hold station just off the blob so the two sprites do not sit on top of
    // each other while it works.
    const a = Math.atan2(this.py - this.target.y, this.px - this.target.x);
    return {
      x: this.target.x + Math.cos(a) * GHOST_STANDOFF,
      y: this.target.y + Math.sin(a) * GHOST_STANDOFF - 8,
    };
  }

  // Nearest living blob inside its own search radius, ignoring anything the
  // girl has already run far away from.
  pickTarget(player, blobs) {
    let best = null;
    let bestDist = GHOST_SEEK_RANGE;
    blobs.forEach((blob) => {
      if (blob.dying) return;
      if (Phaser.Math.Distance.Between(blob.x, blob.y, player.x, player.y) > GHOST_LEASH) return;
      const d = Phaser.Math.Distance.Between(blob.x, blob.y, this.px, this.py);
      if (d < bestDist) {
        bestDist = d;
        best = blob;
      }
    });
    return best;
  }

  attack(time) {
    this.nextAttackAt = time + this.cooldown;
    const blob = this.target;
    // Quieter and higher than her sword, so a companion landing a hit is never
    // mistaken for one of the player's own.
    audio.play('swing', { pitch: 1.6 });
    this.scene.fx?.hitSpark(blob.x, blob.y, this.hitTint ?? 0x9fd8ff, 4);

    this.slash
      .setVisible(true)
      .setPosition(blob.x, blob.y)
      .setAlpha(0.85)
      .setScale(0.8)
      .setDepth(blob.y + 2);
    this.scene.tweens.add({
      targets: this.slash,
      alpha: 0,
      scale: 1.2,
      duration: 220,
      onComplete: () => this.slash.setVisible(false),
    });

    blob.takeDamage(this.damage, this.px, this.py, time);
  }

  destroy() {
    this.sprite.destroy();
    this.slash.destroy();
  }
}

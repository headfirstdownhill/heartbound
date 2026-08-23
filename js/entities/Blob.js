import { BLOB_STATS } from '../data/levelData.js';
import { EV_BLOB_DIED } from '../core/Constants.js';
import { BLOB_TINTS } from '../gfx/Palette.js';
import { audio } from '../systems/AudioManager.js';

const CONTACT_COOLDOWN_MS = 900;

// Particles are tinted from the same table the sprites are, so a red blob
// throws red goo without anybody having to keep two lists of colours in sync.
export function tierTint(tier) {
  const hex = BLOB_TINTS[tier]?.g ?? '#7ed957';
  return parseInt(hex.slice(1), 16);
}

// How high a tier's pitch sits. Little green ones squeak, the big red ones
// growl, and the bosses are below all of them.
const TIER_PITCH = { easy: 1.25, medium: 1.05, hard: 0.85, boss: 0.62, final: 0.5, ally: 1.3 };

export class Blob {
  // `stats` overrides the tier defaults, which is how the Jory run makes the
  // same three tiers hit harder without needing new sprites or new tiers.
  // `prefix` names the texture set; the bosses do not follow `blob_<tier>_*`.
  constructor(scene, x, y, tier = 'easy', stats = null, prefix = null) {
    this.scene = scene;
    this.tier = tier;
    this.prefix = prefix ?? `blob_${tier}`;
    this.stats = stats ?? BLOB_STATS[tier];
    this.hp = this.stats.hp;
    this.state = 'wander';
    this.dying = false;
    this.nextWanderAt = 0;
    this.wanderDir = { x: 0, y: 0 };
    this.hitUntil = 0;
    this.nextContactAt = 0;

    this.sprite = scene.physics.add.sprite(x, y, `${this.prefix}_idle`);
    this.sprite.setDepth(y);
    // Without this they wander out through the doorway gap and become unreachable,
    // which would leave the room permanently unclearable.
    this.sprite.setCollideWorldBounds(true);
    // Sprite size varies by tier (bigger pixel scale for the red ones), so the
    // body is placed relative to the actual frame rather than hard-coded.
    const w = this.stats.hitW ?? 20;
    const h = this.stats.hitH ?? 14;
    this.sprite.body
      .setSize(w, h)
      .setOffset((this.sprite.width - w) / 2, this.sprite.height - h - 2);
    this.nextWeaveAt = 0;
    this.weaveSign = 1;
    this.sprite.owner = this;
    this.sprite.play(`${this.prefix}_idle`);

    this.tint = tierTint(tier);
    this.pitch = TIER_PITCH[tier] ?? 1;
    // Offset per blob, so a room full of them does not pulse in unison.
    this.wobblePhase = Math.random() * Math.PI * 2;
    scene.fx?.attachShadow(this.sprite, {
      scaleX: (w / 20) * 0.4,
      scaleY: (w / 20) * 0.32,
      offsetY: h * 0.45,
      alpha: 0.4,
    });

    // They glow faintly in their own colour. Mostly this is because slime that
    // glows looks better than slime that does not, but it is also what keeps a
    // blob findable in an unlit corner of a dungeon without having to raise the
    // light on the whole room and lose the atmosphere.
    this.glow = scene.add
      .image(x, y, 'fx_glow')
      .setTint(this.tint)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 2)
      .setScale((w / 20) * 0.62);
    this.glowScale = (w / 20) * 0.62;
  }

  // Follows the sprite and breathes with the wobble, so the light looks like it
  // is coming off the body rather than sitting behind it.
  updateGlow(time) {
    if (!this.glow) return;
    const pulse = 1 + Math.sin(time * 0.004 + this.wobblePhase) * 0.12;
    this.glow
      .setPosition(this.sprite.x, this.sprite.y + 2)
      .setDepth(this.sprite.y - 2)
      .setScale(this.glowScale * pulse)
      .setAlpha(0.3 * this.sprite.alpha);
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  update(time, player) {
    if (this.dying) return;
    const body = this.sprite.body;

    if (time < this.hitUntil) {
      body.setDrag(600);
      return;
    }
    body.setDrag(0);

    const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

    if (dist < this.stats.aggro) {
      if (this.state !== 'chase') {
        this.state = 'chase';
        this.sprite.play(`${this.prefix}_chase`);
      }
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      let vx = Math.cos(angle) * this.stats.speed;
      let vy = Math.sin(angle) * this.stats.speed;
      // Weave across the approach so they don't walk into the swing in a
      // straight line. Bigger `dodge` values make a tier harder to connect with.
      const dodge = this.stats.dodge ?? 0;
      if (dodge > 0) {
        if (time > this.nextWeaveAt) {
          this.nextWeaveAt = time + Phaser.Math.Between(280, 620);
          this.weaveSign *= -1;
        }
        vx += -Math.sin(angle) * this.stats.speed * dodge * this.weaveSign;
        vy += Math.cos(angle) * this.stats.speed * dodge * this.weaveSign;
      }
      body.setVelocity(vx, vy);
    } else {
      if (this.state !== 'wander') {
        this.state = 'wander';
        this.sprite.play(`${this.prefix}_idle`);
      }
      if (time > this.nextWanderAt) {
        this.nextWanderAt = time + Phaser.Math.Between(900, 2200);
        const a = Math.random() * Math.PI * 2;
        this.wanderDir = Math.random() < 0.3 ? { x: 0, y: 0 } : { x: Math.cos(a), y: Math.sin(a) };
      }
      const slow = this.stats.speed * 0.4;
      body.setVelocity(this.wanderDir.x * slow, this.wanderDir.y * slow);
    }

    this.sprite.setDepth(this.sprite.y);
    this.wobble(time, body);
    this.updateGlow(time);
  }

  // They are made of jelly, so they should move like it: squashed wide at the
  // bottom of the hop, stretched tall at the top, faster while chasing.
  // Skipped while something else is tweening the sprite, or this would fight
  // the pop-in the arena spawns blobs with.
  wobble(time, body) {
    if (this.scene.tweens.isTweening(this.sprite)) return;
    const moving = Math.abs(body.velocity.x) + Math.abs(body.velocity.y) > 12;
    const rate = moving ? 0.014 : 0.005;
    const depth = moving ? 0.09 : 0.035;
    const s = Math.sin(time * rate + this.wobblePhase) * depth;
    this.sprite.setScale(1 - s, 1 + s);
  }

  canTouch(time) {
    return !this.dying && time >= this.nextContactAt;
  }

  registerTouch(time) {
    this.nextContactAt = time + CONTACT_COOLDOWN_MS;
  }

  takeDamage(amount, fromX, fromY, time) {
    if (this.dying) return;
    this.hp -= amount;
    this.showHit(amount, fromX, fromY);
    if (this.hp <= 0) {
      this.die();
      return;
    }
    this.hitUntil = time + 180;
    this.sprite.setScale(1);
    this.sprite.play(`${this.prefix}_hit`);
    this.sprite.once('animationcomplete', () => {
      if (!this.dying) this.sprite.play(`${this.prefix}_chase`);
    });
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    this.sprite.body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
  }

  // Sparks fly back along the line of the blow and goo comes off the far side,
  // so a hit reads as a direction and not just as a flash.
  showHit(amount, fromX, fromY) {
    const fx = this.scene.fx;
    const angle = Math.atan2(this.y - fromY, this.x - fromX);
    const px = this.x - Math.cos(angle) * 8;
    const py = this.y - Math.sin(angle) * 8;
    fx?.hitSpark(px, py, 0xfff2c4, 6);
    fx?.gooBurst(this.x, this.y - 4, this.tint, 5);
    fx?.damageNumber(this.x, this.y - 10, amount, 0xfff2c4);
    fx?.punch(0.004, 90, 0.008);
    audio.play('squelch', { pitch: this.pitch });
  }

  die() {
    this.dying = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.enable = false;
    this.sprite.setScale(1);
    this.sprite.play(`${this.prefix}_death`);
    if (this.glow) {
      this.scene.tweens.add({
        targets: this.glow,
        alpha: 0,
        scale: this.glowScale * 2.4,
        duration: 320,
        onComplete: () => this.glow?.destroy(),
      });
      this.glow = null;
    }

    const fx = this.scene.fx;
    fx?.gooBurst(this.x, this.y - 4, this.tint, 18);
    fx?.ring(this.x, this.y, { tint: this.tint, to: 0.75, duration: 380 });
    fx?.burst(this.x, this.y - 4, { tint: this.tint, scale: 0.9, duration: 260 });
    fx?.splat(this.x, this.y, this.tint);
    audio.play('blobDie', { pitch: this.pitch });

    this.scene.game.events.emit(EV_BLOB_DIED, this);
    this.sprite.once('animationcomplete', () => this.sprite.destroy());
  }

  destroy() {
    this.glow?.destroy();
    this.sprite.destroy();
  }
}

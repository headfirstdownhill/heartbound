import {
  PLAYER_SPEED,
  PLAYER_MAX_HP,
  PLAYER_IFRAME_MS,
  ATTACK_COOLDOWN_MS,
  ATTACK_ACTIVE_MS,
  SWORD_DAMAGE,
  FIST_DAMAGE,
  EV_HEALTH_CHANGED,
} from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { audio } from '../systems/AudioManager.js';

// Where the swing lands, relative to the player, per facing.
const REACH = 26;
const HIT_W = 34;
const HIT_H = 30;
// How far she has to walk between puffs of dust. Tuned by eye against her
// walk cycle so a footfall and a puff land together.
const STEP_DISTANCE = 26;

export class Player {
  constructor(scene, x, y, input) {
    this.scene = scene;
    this.input = input;
    this.facing = 'down';
    this.attackUntil = 0;
    this.nextAttackAt = 0;
    this.invulnUntil = 0;
    // Separate from invulnUntil so the shield power-up cannot be cut short by
    // an ordinary hit, and so it can be shown differently.
    this.shieldUntil = 0;
    this.frozen = false;
    this.alive = true;
    this.hitThisSwing = new Set();

    this.sprite = scene.physics.add.sprite(x, y, 'girl_idle_down');
    this.sprite.setDepth(y);
    this.sprite.body.setSize(18, 12).setOffset(7, 19);
    this.sprite.setCollideWorldBounds(false);
    this.sprite.owner = this;

    // Sword rides alongside her rather than being drawn into every frame.
    this.sword = scene.add.image(x, y, 'sword').setDepth(y + 1).setVisible(GameState.hasSword);
    this.sword.setScale(0.85);

    this.slash = scene.add.image(x, y, 'slash').setDepth(y + 2).setVisible(false);

    // She is the one thing on screen that is always moving, so she is the one
    // that most needs grounding.
    scene.fx?.attachShadow(this.sprite, { scaleX: 0.32, scaleY: 0.3, offsetY: 12 });
    this.stepAccum = 0;
    this.lastX = x;
    this.lastY = y;
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  equipSword() {
    GameState.hasSword = true;
    this.sword.setVisible(true);
    this.scene.fx?.star(this.x, this.y - 10, { tint: 0xfff2c4, scale: 0.85 });
    this.scene.fx?.sparkleTrail(this.x, this.y - 10, 0xfff2c4, 14);
  }

  freeze() {
    this.frozen = true;
    this.sprite.body.setVelocity(0, 0);
    this.playAnim('idle');
  }

  unfreeze() {
    this.frozen = false;
  }

  playAnim(kind) {
    const dir = this.facing === 'left' || this.facing === 'right' ? 'side' : this.facing;
    const key = `girl_${kind}_${dir}`;
    this.sprite.setFlipX(this.facing === 'left');
    if (this.sprite.anims.currentAnim?.key !== key) this.sprite.play(key);
  }

  update(time) {
    if (!this.alive) return;
    const body = this.sprite.body;

    if (this.frozen) {
      body.setVelocity(0, 0);
    } else {
      const v = this.input.getMoveVector();
      const attacking = time < this.attackUntil;
      // Swinging slows her rather than rooting her — mobile input feels dead if
      // the character stops responding mid-tap.
      const speed = attacking ? PLAYER_SPEED * 0.45 : PLAYER_SPEED;
      body.setVelocity(v.x * speed, v.y * speed);

      if ((v.x !== 0 || v.y !== 0) && !attacking) {
        this.facing =
          Math.abs(v.x) > Math.abs(v.y) ? (v.x > 0 ? 'right' : 'left') : v.y > 0 ? 'down' : 'up';
      }
      this.playAnim(v.x !== 0 || v.y !== 0 ? 'walk' : 'idle');

      if (this.input.isAttackPressed() && time >= this.nextAttackAt) this.startAttack(time);
    }

    this.sprite.setDepth(this.sprite.y);
    this.positionSword(time);
    this.trackFootsteps();

    // Flicker through invulnerability so being hit is legible.
    if (time < this.invulnUntil) {
      this.sprite.setAlpha(Math.floor(time / 70) % 2 ? 0.35 : 1);
    } else if (this.sprite.alpha !== 1) {
      this.sprite.setAlpha(1);
    }
  }

  // Distance-based rather than on a timer, so the puffs stay in step with her
  // feet whether she is walking full speed or dragging through a swing.
  trackFootsteps() {
    const moved = Phaser.Math.Distance.Between(this.lastX, this.lastY, this.sprite.x, this.sprite.y);
    this.lastX = this.sprite.x;
    this.lastY = this.sprite.y;
    if (moved < 0.4) {
      this.stepAccum = 0;
      return;
    }
    this.stepAccum += moved;
    if (this.stepAccum < STEP_DISTANCE) return;
    this.stepAccum = 0;
    this.scene.fx?.dust(this.sprite.x, this.sprite.y + 12, 2, this.scene.stepDustTint ?? 0xbfae94);
  }

  positionSword(time) {
    if (!GameState.hasSword) {
      this.sword.setVisible(false);
      return;
    }
    const swinging = time < this.attackUntil;
    const offsets = {
      down: { x: 13, y: 8, a: 160 },
      up: { x: -13, y: 0, a: -30 },
      left: { x: -15, y: 5, a: -75 },
      right: { x: 15, y: 5, a: 75 },
    };
    const o = offsets[this.facing];
    const t = swinging ? 1 - (this.attackUntil - time) / ATTACK_ACTIVE_MS : 0;
    const swing = swinging ? Math.sin(t * Math.PI) * 55 : 0;
    this.sword
      .setVisible(true)
      .setPosition(this.sprite.x + o.x, this.sprite.y + o.y)
      .setAngle(o.a + (this.facing === 'left' ? -swing : swing))
      // Behind her when she has her back to us, in front otherwise.
      .setDepth(this.sprite.y + (this.facing === 'up' ? -1 : 1));
  }

  startAttack(time) {
    this.attackUntil = time + ATTACK_ACTIVE_MS;
    this.nextAttackAt = time + ATTACK_COOLDOWN_MS;
    this.hitThisSwing.clear();

    const box = this.getHitbox();
    this.slash
      .setVisible(true)
      .setPosition(box.centerX, box.centerY)
      .setAngle({ down: 180, up: 0, left: -90, right: 90 }[this.facing])
      .setAlpha(0.9)
      .setScale(1)
      .setDepth(this.sprite.y + 2);
    this.scene.tweens.add({
      targets: this.slash,
      alpha: 0,
      scale: 1.35,
      duration: ATTACK_ACTIVE_MS,
      onComplete: () => this.slash.setVisible(false),
    });

    // A bare fist gets a duller, lower whoosh and no steel-coloured crescent,
    // so picking the sword up is audible as well as visible.
    const armed = GameState.hasSword;
    this.scene.fx?.slashArc(box.centerX, box.centerY, this.facing, armed ? 0xdfe5ef : 0xf6cba0);
    audio.play('swing', { pitch: armed ? 1 : 0.72 });
  }

  getHitbox() {
    const dx = { left: -REACH, right: REACH, up: 0, down: 0 }[this.facing];
    const dy = { up: -REACH, down: REACH, left: 4, right: 4 }[this.facing];
    const vertical = this.facing === 'up' || this.facing === 'down';
    const w = vertical ? HIT_W : HIT_H;
    const h = vertical ? HIT_H : HIT_W;
    return new Phaser.Geom.Rectangle(
      this.sprite.x + dx - w / 2,
      this.sprite.y + dy - h / 2,
      w,
      h,
    );
  }

  isSwinging(time) {
    return time < this.attackUntil;
  }

  get damage() {
    return GameState.hasSword ? SWORD_DAMAGE : FIST_DAMAGE;
  }

  isShielded(time) {
    return time < this.shieldUntil;
  }

  takeDamage(amount, fromX, fromY, time) {
    if (!this.alive || time < this.invulnUntil) return false;
    // Shielded still knocks her back and still flashes, it just costs nothing.
    if (this.isShielded(time)) {
      const away = Math.atan2(this.sprite.y - fromY, this.sprite.x - fromX);
      this.sprite.body.setVelocity(Math.cos(away) * 200, Math.sin(away) * 200);
      this.invulnUntil = time + 220;
      this.scene.fx?.ring(this.x, this.y, { tint: 0x9fd8ff, to: 0.7, duration: 300, flat: false });
      audio.play('shielded');
      return false;
    }
    this.invulnUntil = time + PLAYER_IFRAME_MS;
    GameState.playerHp = Math.max(0, GameState.playerHp - amount);
    this.scene.game.events.emit(EV_HEALTH_CHANGED, GameState.playerHp);

    const angle = Math.atan2(this.sprite.y - fromY, this.sprite.x - fromX);
    this.sprite.body.setVelocity(Math.cos(angle) * 240, Math.sin(angle) * 240);
    this.scene.cameras.main.shake(120, 0.008);

    const fx = this.scene.fx;
    fx?.ring(this.x, this.y, { tint: 0xff4d6d, to: 0.85, duration: 340 });
    fx?.gooBurst(this.x, this.y - 4, 0xff4d6d, 9);
    // A red wash rather than a camera flash: the flash whites out the whole
    // frame, and this reads as being hurt instead of as a lightning strike.
    fx?.tint([1, 0.18, 0.3], 0.4, 260);
    audio.play('hurt');
    return GameState.playerHp <= 0;
  }

  reviveAt(x, y) {
    GameState.playerHp = PLAYER_MAX_HP;
    this.sprite.setPosition(x, y);
    this.sprite.body.setVelocity(0, 0);
    this.invulnUntil = this.scene.time.now + PLAYER_IFRAME_MS * 1.5;
    this.scene.game.events.emit(EV_HEALTH_CHANGED, GameState.playerHp);
  }

  destroy() {
    this.sprite.destroy();
    this.sword.destroy();
    this.slash.destroy();
  }
}

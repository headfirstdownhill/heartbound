import { POWERUP_LIFETIME_MS } from '../data/joryData.js';

// A bubble on the floor. It knows how to appear, hover, warn that it is about
// to go, and vanish; what it actually does is the level's business.
const WARN_AT_MS = 2000;
const PICKUP_RANGE = 30;

export class PowerUp {
  constructor(scene, x, y, def) {
    this.scene = scene;
    this.def = def;
    this.taken = false;
    this.expiresAt = scene.time.now + POWERUP_LIFETIME_MS;

    this.sprite = scene.add.image(x, y, def.texture).setDepth(y).setScale(0);
    scene.tweens.add({ targets: this.sprite, scale: 1, duration: 280, ease: 'Back.out' });
    this.hover = scene.tweens.add({
      targets: this.sprite,
      y: y - 7,
      duration: 780,
      yoyo: true,
      repeat: -1,
      delay: 280,
      ease: 'Sine.inOut',
    });

    // A soft glow underneath so a bubble is findable against busy floor.
    this.glow = scene.add.image(x, y, def.texture).setDepth(y - 1).setAlpha(0.28).setScale(1.5);
    scene.tweens.add({
      targets: this.glow,
      scale: 2,
      alpha: 0,
      duration: 1100,
      repeat: -1,
    });

    // In a room this dark the bubble also has to be its own light source, or it
    // is invisible from more than a couple of tiles away.
    this.halo = scene.add
      .image(x, y, 'fx_glow')
      .setTint(0xffffff)
      .setAlpha(0.4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 2)
      .setScale(0.85);
    scene.tweens.add({
      targets: this.halo,
      scale: 1.25,
      alpha: 0.65,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.light = scene.fx?.addLight(this.sprite, { size: 200 });
    scene.fx?.ring(x, y, { tint: 0xffffff, to: 0.9, duration: 460 });
    scene.fx?.sparkleTrail(x, y, 0xffffff, 8);
    this.sparkleTimer = scene.time.addEvent({
      delay: 520,
      loop: true,
      callback: () => {
        if (!this.taken) scene.fx?.sparkleTrail(this.sprite.x, this.sprite.y, 0xffffff, 1);
      },
    });
  }

  get x() {
    return this.sprite.x;
  }

  get y() {
    return this.sprite.y;
  }

  update(time, player) {
    if (this.taken) return false;

    this.halo?.setPosition(this.sprite.x, this.sprite.y);

    // Flicker through the last couple of seconds.
    if (this.expiresAt - time < WARN_AT_MS) {
      this.sprite.setAlpha(Math.floor(time / 110) % 2 ? 0.35 : 1);
      this.halo?.setAlpha(this.sprite.alpha * 0.5);
    }

    if (Phaser.Math.Distance.Between(player.x, player.y, this.x, this.y) < PICKUP_RANGE) {
      this.taken = true;
      return true;
    }
    return false;
  }

  get lapsed() {
    return !this.taken && this.scene.time.now >= this.expiresAt;
  }

  collect() {
    this.hover?.remove();
    this.sparkleTimer?.remove();
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 26,
      alpha: 0,
      scale: 1.6,
      duration: 300,
      onComplete: () => this.destroy(),
    });
    this.scene.tweens.add({ targets: this.halo, alpha: 0, scale: 2.2, duration: 300 });
    this.glow.destroy();
  }

  destroy() {
    this.hover?.remove();
    this.sparkleTimer?.remove();
    // The lighting pass walks this list every frame, so a collected bubble that
    // left its light behind would keep a hole burning in an empty patch of floor.
    if (this.light && this.scene.fx) {
      const list = this.scene.fx.lights;
      const at = list.indexOf(this.light);
      if (at >= 0) list.splice(at, 1);
    }
    this.sprite.destroy();
    this.glow?.destroy();
    this.halo?.destroy();
  }
}

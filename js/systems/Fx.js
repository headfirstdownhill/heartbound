import { PixelText } from '../gfx/PixelText.js';

// The juice layer. One of these is built per scene and hung on `scene.fx`, so
// anything in the scene can ask for sparks, shockwaves, dust or a camera punch
// without knowing how any of it is made.
//
// Emitters are created once and reused. Phaser will happily let you spawn a new
// ParticleEmitter for every sword swing, and on a phone that is exactly how you
// end up with a garbage-collection stutter in the middle of a fight.

const SHADOW_ALPHA = 0.45;

// Particles that fade in and back out over their life. Phaser's alpha ramp only
// runs start-to-end, so a mote emitted at full alpha pops into existence; this
// drives it from the particle's own age instead.
function breatheAlpha(peak) {
  return { onUpdate: (particle, key, t) => peak * Math.sin(Math.PI * t) };
}

export class SceneFx {
  constructor(scene) {
    this.scene = scene;
    this.pool = {};
    this.shadows = [];
    this.lights = [];
    this.lightRT = null;
    this.lightColor = 0x090612;
    this.lightAlpha = 0.82;
    this.lightOrigin = { x: 0, y: 0 };
    this.nodes = [];
    // Cameras outlive a scene restart, so a zoom cached by a previous run has
    // to be dropped or the first punch of the new one snaps to the old value.
    if (scene.cameras?.main) scene.cameras.main._fxBaseZoom = undefined;
    scene.events.once('shutdown', () => this.destroy());
  }

  // ---- emitter pool -------------------------------------------------------

  emitter(key, texture, config) {
    // A looping scene timer can fire in the same frame the scene is torn down —
    // the title screen's heart sparkle does exactly that on the way out. By
    // then the pool has been emptied, so without this we would ask Phaser for a
    // brand new emitter on a dying scene and it would throw from inside its own
    // renderer. Callers use `?.` so a dead pool is simply a no-op.
    if (this.dead) return null;
    if (this.pool[key]) return this.pool[key];
    const e = this.scene.add.particles(0, 0, texture, { emitting: false, ...config });
    this.pool[key] = e;
    return e;
  }

  // ---- combat -------------------------------------------------------------

  // White-hot sparks off a landed sword hit. Fast, short-lived and additive, so
  // they read as light rather than as debris.
  hitSpark(x, y, tint = 0xfff2c4, count = 7) {
    const e = this.emitter('spark', 'fx_shard', {
      speed: { min: 90, max: 260 },
      lifespan: { min: 140, max: 300 },
      scale: { start: 0.9, end: 0.05 },
      alpha: { start: 1, end: 0 },
      rotate: { min: 0, max: 360 },
      blendMode: 'ADD',
    });
    if (!e) return;
    e.setParticleTint(tint);
    e.setDepth(y + 30);
    e.explode(count, x, y);
    this.burst(x, y, { tint, scale: 0.55, duration: 160, alpha: 0.8 });
  }

  // Wet, heavy, and it falls — the opposite of the sparks, on purpose, so a
  // blob coming apart never looks like metal.
  gooBurst(x, y, tint = 0x7ed957, count = 12) {
    const e = this.emitter('goo', 'fx_dot', {
      speed: { min: 40, max: 190 },
      lifespan: { min: 320, max: 640 },
      scale: { start: 0.7, end: 0.1 },
      alpha: { start: 0.95, end: 0 },
      gravityY: 320,
      angle: { min: 200, max: 340 },
    });
    if (!e) return;
    e.setParticleTint(tint);
    e.setDepth(y + 20);
    e.explode(count, x, y);
  }

  // What a blob leaves behind. Sits under everything and fades on its own.
  splat(x, y, tint = 0x7ed957) {
    const s = this.scene.add
      .image(x, y + 6, 'fx_glow_soft')
      .setDepth(1)
      .setTint(tint)
      .setAlpha(0.5)
      .setScale(0.42, 0.2);
    this.scene.tweens.add({
      targets: s,
      alpha: 0,
      scaleX: 0.55,
      duration: 2600,
      ease: 'Quad.in',
      onComplete: () => s.destroy(),
    });
  }

  // An expanding ring. Every impact in the game gets one; the colour and the
  // speed are what tell them apart. Flat by default, because the game is seen
  // from above and a perfect circle reads as a bubble rather than a shockwave.
  ring(x, y, opts = {}) {
    const {
      tint = 0xffffff,
      from = 0.1,
      to = 1.2,
      duration = 380,
      alpha = 0.9,
      thin = false,
      depth = null,
      flat = true,
    } = opts;
    const r = this.scene.add
      .image(x, y, thin ? 'fx_ring_thin' : 'fx_ring')
      .setTint(tint)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth ?? y + 25);
    r.setScale(from, from * (flat ? 0.45 : 1));
    this.scene.tweens.add({
      targets: r,
      scaleX: to,
      scaleY: to * (flat ? 0.45 : 1),
      alpha: 0,
      duration,
      ease: 'Cubic.out',
      onComplete: () => r.destroy(),
    });
    return r;
  }

  // A brief bloom of light. Used everywhere something appears or dies.
  burst(x, y, opts = {}) {
    const { tint = 0xffffff, scale = 1.2, duration = 320, alpha = 0.9, depth = null } = opts;
    const g = this.scene.add
      .image(x, y, 'fx_glow')
      .setTint(tint)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(depth ?? y + 26)
      .setScale(scale * 0.3);
    this.scene.tweens.add({
      targets: g,
      scale,
      alpha: 0,
      duration,
      ease: 'Quad.out',
      onComplete: () => g.destroy(),
    });
    return g;
  }

  // Pops open, then closes and spins away.
  star(x, y, opts = {}) {
    const { tint = 0xfff6d0, scale = 0.5, duration = 420, angle = 0 } = opts;
    const s = this.scene.add
      .image(x, y, 'fx_star')
      .setTint(tint)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y + 40)
      .setScale(0)
      .setAngle(angle);
    this.scene.tweens.add({
      targets: s,
      scale,
      duration: duration * 0.35,
      ease: 'Back.out',
      onComplete: () => {
        this.scene.tweens.add({
          targets: s,
          scale: 0,
          angle: angle + 90,
          duration: duration * 0.65,
          ease: 'Quad.in',
          onComplete: () => s.destroy(),
        });
      },
    });
    return s;
  }

  sparkleTrail(x, y, tint = 0xfff6d0, count = 4) {
    const e = this.emitter('sparkle', 'fx_dot', {
      speed: { min: 10, max: 60 },
      lifespan: { min: 400, max: 900 },
      scale: { start: 0.35, end: 0 },
      alpha: { start: 1, end: 0 },
      gravityY: -30,
      blendMode: 'ADD',
    });
    if (!e) return;
    e.setParticleTint(tint);
    e.setDepth(y + 35);
    e.explode(count, x, y);
  }

  // Kicked up under her feet and off anything that lands hard.
  dust(x, y, count = 4, tint = 0xbfae94) {
    const e = this.emitter('dust', 'fx_smoke', {
      speed: { min: 12, max: 46 },
      lifespan: { min: 260, max: 520 },
      scale: { start: 0.18, end: 0.42 },
      alpha: { start: 0.4, end: 0 },
      angle: { min: 200, max: 340 },
    });
    if (!e) return;
    e.setParticleTint(tint);
    e.setDepth(y - 1);
    e.explode(count, x, y);
  }

  smoke(x, y, count = 6, tint = 0x4a3a5c) {
    const e = this.emitter('smoke', 'fx_smoke', {
      speed: { min: 20, max: 70 },
      lifespan: { min: 500, max: 1100 },
      scale: { start: 0.3, end: 0.9 },
      alpha: { start: 0.55, end: 0 },
      angle: { min: 240, max: 300 },
    });
    if (!e) return;
    e.setParticleTint(tint);
    e.setDepth(y + 5);
    e.explode(count, x, y);
  }

  // The crescent that follows the sword through its arc.
  slashArc(x, y, facing, tint = 0xffffff) {
    const angles = { down: 90, up: 270, left: 180, right: 0 };
    const a = angles[facing] ?? 90;
    const arc = this.scene.add
      .image(x, y, 'fx_arc')
      .setTint(tint)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y + 30)
      .setAngle(a - 55)
      .setScale(0.34)
      .setAlpha(0.95);
    this.scene.tweens.add({
      targets: arc,
      angle: a + 55,
      scale: 0.62,
      alpha: 0,
      duration: 190,
      ease: 'Quad.out',
      onComplete: () => arc.destroy(),
    });
    return arc;
  }

  // Small, brief and jittered sideways, so a flurry of hits does not stack four
  // identical numbers on one pixel.
  //
  // Drawn twice: a near-black copy one pixel down-right, then the real one over
  // it. Cream numerals on their own vanish against sunlit grass, and a number
  // you cannot read is worse than no number at all.
  damageNumber(x, y, amount, tint = 0xfff2c4, big = false) {
    const scale = big ? 2 : 1;
    const ox = x + Phaser.Math.Between(-7, 7);
    const label = String(Math.round(amount));
    const shadow = new PixelText(this.scene, ox + scale * 2, y - 12 + scale * 2, label, {
      scale,
      color: 0x1a1420,
    });
    const t = new PixelText(this.scene, ox, y - 12, label, { scale, color: tint });
    shadow.setDepth(9499);
    t.setDepth(9500);
    this.scene.tweens.add({
      targets: [t.container, shadow.container],
      y: y - (big ? 44 : 34),
      alpha: 0,
      duration: big ? 800 : 620,
      ease: 'Quad.out',
      onComplete: () => {
        t.destroy();
        shadow.destroy();
      },
    });
    return t;
  }

  // ---- camera -------------------------------------------------------------

  // Shake plus a momentary zoom-in. The zoom is what makes a hit land; shake on
  // its own just makes the screen noisy.
  punch(intensity = 0.006, ms = 140, zoom = 0.012) {
    const cam = this.scene.cameras.main;
    if (!cam) return;
    cam.shake(ms, intensity);
    if (!zoom) return;
    if (cam._fxBaseZoom === undefined) cam._fxBaseZoom = cam.zoom;
    const base = cam._fxBaseZoom;
    this.scene.tweens.killTweensOf(cam);
    cam.zoom = base * (1 + zoom);
    this.scene.tweens.add({ targets: cam, zoom: base, duration: ms * 1.8, ease: 'Quad.out' });
  }

  // Full-frame colour wash through the post pipeline rather than the camera's
  // own flash, so it sits under the vignette instead of over it. Falls back to
  // the camera flash wherever the pipeline is not available.
  tint(color = [1, 1, 1], amount = 0.45, ms = 220) {
    const pipe = this.scene.postFX;
    if (!pipe) {
      this.scene.cameras.main?.flash(ms, color[0] * 255, color[1] * 255, color[2] * 255);
      return;
    }
    pipe.flashColor = color;
    pipe.flashAmount = amount;
    this.scene.tweens.add({ targets: pipe, flashAmount: 0, duration: ms, ease: 'Quad.out' });
  }

  // ---- shadows ------------------------------------------------------------

  // Every sprite that stands on the floor gets one. They are tracked here and
  // updated in one pass rather than by each entity, so nothing has to remember
  // to clean up after itself.
  attachShadow(sprite, opts = {}) {
    const { scaleX = 0.42, scaleY = 0.42, offsetY = 2, alpha = SHADOW_ALPHA } = opts;
    const img = this.scene.add
      .image(sprite.x, sprite.y + offsetY, 'fx_shadow')
      .setAlpha(alpha)
      .setScale(scaleX, scaleY);
    const entry = { img, sprite, offsetY, scaleX, scaleY, alpha };
    this.shadows.push(entry);
    return entry;
  }

  updateShadows() {
    for (let i = this.shadows.length - 1; i >= 0; i--) {
      const s = this.shadows[i];
      const owner = s.sprite;
      if (!owner || !owner.active || !owner.scene) {
        s.img.destroy();
        this.shadows.splice(i, 1);
        continue;
      }
      // Shrinks as its owner stretches upward, which is the only thing selling
      // a hop as a hop rather than a slide.
      const lift = Phaser.Math.Clamp(owner.scaleY || 1, 0.6, 1.4);
      s.img
        .setPosition(owner.x, owner.y + s.offsetY)
        .setDepth(owner.depth - 1)
        .setScale(s.scaleX * (owner.scaleX || 1) * (2 - lift), s.scaleY * (2 - lift))
        .setAlpha(s.alpha * owner.alpha);
    }
  }

  // ---- lighting -----------------------------------------------------------

  // A dark sheet over the floor with holes punched in it, so lit ground keeps
  // its actual colour instead of washing out to grey.
  //
  // The depth is deliberately just above the floor and below everything that
  // stands on it. Laying it over the whole scene is more physically honest and
  // much worse to play: enemies in an unlit corner disappear, and every glow
  // that is meant to sit behind a sprite has to be lifted in front of it to be
  // visible at all. Darkening the ground carries the whole mood on its own.
  enableLighting(x, y, width, height, opts = {}) {
    const { color = 0x090612, alpha = 0.78, depth = -50 } = opts;
    try {
      this.lightRT = this.scene.add
        .renderTexture(x, y, width, height)
        .setOrigin(0, 0)
        .setDepth(depth);
      this.lightColor = color;
      this.lightAlpha = alpha;
      this.lightOrigin = { x, y };
    } catch {
      // A renderer that will not give us a render texture simply plays the room
      // fully lit. That is a worse-looking game, not a broken one.
      this.lightRT = null;
    }
    return this.lightRT;
  }

  // `ref` is anything with live x/y — a sprite, a player, a plain point. There
  // is no way to scale an erase, so the light sizes are the texture sizes.
  addLight(ref, opts = {}) {
    const { size = 256, flicker = false, offsetY = 0 } = opts;
    const light = { ref, size, flicker, offsetY, phase: Math.random() * 100 };
    this.lights.push(light);
    return light;
  }

  updateLighting(time) {
    const rt = this.lightRT;
    if (!rt) return;
    rt.clear();
    rt.fill(this.lightColor, this.lightAlpha);
    for (const l of this.lights) {
      const x = (l.ref.x ?? 0) - this.lightOrigin.x;
      const y = (l.ref.y ?? 0) - this.lightOrigin.y + l.offsetY;
      rt.erase('fx_light', x - 128, y - 128);
      if (l.size > 256) rt.erase('fx_light', x - 128, y - 128);
      // A second punch on a slow wobble. An erase cannot be scaled, so two
      // stacked ones standing in for one guttering flame is the whole trick.
      if (l.flicker) {
        const f =
          0.5 + 0.5 * Math.sin(time * 0.006 + l.phase) + 0.3 * Math.sin(time * 0.017 + l.phase * 2);
        if (f > 0.6) rt.erase('fx_light', x - 128, y - 128);
      }
    }
  }

  // ---- ambience -----------------------------------------------------------

  // Slow drifting motes across the whole room. The single cheapest thing that
  // stops a static pixel-art room looking like a screenshot.
  ambient(kind, bounds, depth = 950) {
    const { x = 0, y = 0, width = 480, height = 800 } = bounds ?? {};
    const area = new Phaser.Geom.Rectangle(x, y, width, height);
    const made = [];

    const spawn = (texture, cfg, d) => {
      const e = this.scene.add.particles(0, 0, texture, cfg);
      e.setDepth(d);
      this.nodes.push(e);
      made.push(e);
      return e;
    };

    if (kind === 'garden' || kind === 'meadow') {
      spawn(
        'fx_dot',
        {
          speedY: { min: -16, max: -4 },
          speedX: { min: -10, max: 10 },
          lifespan: { min: 3200, max: 6000 },
          scale: { start: 0.1, end: 0.04 },
          alpha: breatheAlpha(0.34),
          tint: [0xfff2c4, 0xd9f2a0, 0xffffff],
          blendMode: 'ADD',
          frequency: 900,
          emitZone: { type: 'random', source: area },
        },
        depth,
      );
      spawn(
        'fx_glow',
        {
          speedY: { min: -14, max: 14 },
          speedX: { min: -18, max: 18 },
          lifespan: { min: 2600, max: 5200 },
          scale: { start: 0.075, end: 0.02 },
          alpha: breatheAlpha(0.6),
          tint: [0xd8ff8a, 0xfff6a0],
          blendMode: 'ADD',
          frequency: 1500,
          emitZone: { type: 'random', source: area },
        },
        depth,
      );
      return made;
    }

    if (kind === 'dungeon') {
      spawn(
        'fx_dot',
        {
          speedY: { min: -34, max: -12 },
          speedX: { min: -14, max: 14 },
          lifespan: { min: 1800, max: 3600 },
          scale: { start: 0.12, end: 0.02 },
          alpha: breatheAlpha(0.6),
          tint: [0xff9a4a, 0xffc46b, 0xff6a3a],
          blendMode: 'ADD',
          frequency: 800,
          emitZone: { type: 'random', source: area },
        },
        depth,
      );
      spawn(
        'fx_smoke',
        {
          speedY: { min: 4, max: 14 },
          speedX: { min: -6, max: 6 },
          lifespan: { min: 4000, max: 7000 },
          scale: { start: 0.12, end: 0.3 },
          alpha: breatheAlpha(0.14),
          tint: 0x9f8fc0,
          frequency: 640,
          emitZone: { type: 'random', source: area },
        },
        depth - 1,
      );
      return made;
    }

    if (kind === 'petals') {
      spawn(
        'fx_petal',
        {
          // Seeded across the whole screen rather than only along the top edge.
          // Falling in from above means the first ten seconds of every menu are
          // spent with an empty lower half, and nobody looks at a title screen
          // for ten seconds.
          emitZone: { type: 'random', source: area },
          speedY: { min: 26, max: 58 },
          speedX: { min: -22, max: 22 },
          lifespan: { min: 6000, max: 11000 },
          scale: { start: 0.5, end: 0.4 },
          alpha: breatheAlpha(0.85),
          rotate: { start: 0, end: 360 },
          tint: [0xffb3d1, 0xff8fb8, 0xff7aa8, 0xffd6e6],
          frequency: 700,
        },
        depth,
      );
      return made;
    }

    return made;
  }

  // Tilted bars of light with a slow drift. Sold entirely by the post-process
  // bloom picking them up.
  godRays(x, y, width, height, opts = {}) {
    const { count = 4, tint = 0xfff4c0, alpha = 0.07, depth = 940, angle = 22 } = opts;
    const rays = [];
    for (let i = 0; i < count; i++) {
      const rx = x + (width / (count + 1)) * (i + 1);
      const r = this.scene.add
        .rectangle(rx, y + height / 2, 26 + i * 9, height * 1.9, tint, alpha)
        .setAngle(angle)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(depth);
      this.scene.tweens.add({
        targets: r,
        x: rx + 26,
        alpha: alpha * 0.45,
        duration: 5200 + i * 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      rays.push(r);
      this.nodes.push(r);
    }
    return rays;
  }

  // A guttering torch: a bracket on the wall, a warm glow that breathes, and a
  // thin flame of particles above it. The lighting pass punches its hole
  // separately, so this is only what the torch looks like, not what it lights.
  torch(x, y, opts = {}) {
    const { tint = 0xffa542, scale = 0.75 } = opts;
    // Something physical under the flame, or the light reads as floating.
    const bracket = this.scene.add.image(x, y + 7, 'torch').setDepth(y - 11);
    const glow = this.scene.add
      .image(x, y, 'fx_glow')
      .setTint(tint)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(y - 10)
      .setScale(scale);
    this.scene.tweens.add({
      targets: glow,
      scale: scale * 1.18,
      alpha: 0.68,
      duration: 420 + Math.random() * 260,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    const flame = this.scene.add.particles(x, y - 2, 'fx_dot', {
      speedY: { min: -46, max: -22 },
      speedX: { min: -9, max: 9 },
      lifespan: { min: 420, max: 760 },
      scale: { start: 0.28, end: 0 },
      alpha: { start: 0.85, end: 0 },
      tint: [0xffe08a, 0xffa542, 0xff6a2a],
      blendMode: 'ADD',
      frequency: 90,
    });
    flame.setDepth(y - 9);

    this.nodes.push(bracket, glow, flame);
    return { bracket, glow, flame };
  }

  // ---- per-frame ----------------------------------------------------------

  update(time) {
    this.updateShadows();
    this.updateLighting(time);
  }

  destroy() {
    this.dead = true;
    this.shadows.forEach((s) => s.img.destroy());
    this.shadows = [];
    this.lights = [];
    this.lightRT = null;
    this.nodes = [];
    this.pool = {};
  }
}

// Convenience: build the layer and hang it on the scene.
export function installFx(scene) {
  scene.fx = new SceneFx(scene);
  return scene.fx;
}

// Soft-edged textures — glows, sparks, smoke, light masks.
//
// Everything under gfx/sprites/ is a grid of characters, which is exactly the
// wrong tool for something that has to fade out at its edges. These are drawn
// with canvas gradients instead, and they are the only textures in the game
// that ask for linear filtering: a nearest-neighbour radial glow is a staircase.

function linear(tex) {
  // A glow scaled up under NEAREST filtering shows every step of its gradient.
  tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
  return tex;
}

function fresh(scene, key, w, h) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  return scene.textures.createCanvas(key, w, h);
}

function rgbOf(color) {
  return {
    r: (color >> 16) & 255,
    g: (color >> 8) & 255,
    b: color & 255,
  };
}

// Round falloff. `power` shapes it: 1 is a linear fade, higher values pull the
// light into a tighter core with a longer skirt.
export function radialTexture(scene, key, size, color = 0xffffff, opts = {}) {
  const { power = 2, inner = 0, alpha = 1 } = opts;
  const tex = fresh(scene, key, size, size);
  const ctx = tex.getContext();
  const { r, g, b } = rgbOf(color);
  const mid = size / 2;
  const grad = ctx.createRadialGradient(mid, mid, inner * mid, mid, mid, mid);
  const stops = 12;
  for (let i = 0; i <= stops; i++) {
    const t = i / stops;
    grad.addColorStop(t, `rgba(${r},${g},${b},${alpha * Math.pow(1 - t, power)})`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return linear(tex);
}

// A hollow ring that fades both inwards and outwards — shockwaves and the
// boss's slam telegraph.
export function ringTexture(scene, key, size, color = 0xffffff, opts = {}) {
  const { thickness = 0.16, alpha = 1 } = opts;
  const tex = fresh(scene, key, size, size);
  const ctx = tex.getContext();
  const { r, g, b } = rgbOf(color);
  const mid = size / 2;
  const grad = ctx.createRadialGradient(mid, mid, 0, mid, mid, mid);
  const peak = 1 - thickness;
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(Math.max(0, peak - thickness), `rgba(${r},${g},${b},0)`);
  grad.addColorStop(peak, `rgba(${r},${g},${b},${alpha})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return linear(tex);
}

// Four-point twinkle with a hot core. Drawn rather than gridded so the arms can
// taper, which is the whole difference between a star and a plus sign.
export function starTexture(scene, key, size, color = 0xffffff) {
  const tex = fresh(scene, key, size, size);
  const ctx = tex.getContext();
  const { r, g, b } = rgbOf(color);
  const mid = size / 2;

  const core = ctx.createRadialGradient(mid, mid, 0, mid, mid, size * 0.2);
  core.addColorStop(0, `rgba(255,255,255,1)`);
  core.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = core;
  ctx.fillRect(0, 0, size, size);

  [0, Math.PI / 2].forEach((rot) => {
    ctx.save();
    ctx.translate(mid, mid);
    ctx.rotate(rot);
    const arm = ctx.createLinearGradient(-mid, 0, mid, 0);
    arm.addColorStop(0, `rgba(${r},${g},${b},0)`);
    arm.addColorStop(0.5, `rgba(${r},${g},${b},0.95)`);
    arm.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = arm;
    ctx.beginPath();
    ctx.moveTo(-mid, 0);
    ctx.lineTo(0, -size * 0.055);
    ctx.lineTo(mid, 0);
    ctx.lineTo(0, size * 0.055);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  tex.refresh();
  return linear(tex);
}

// A stubby tapered wedge. Used for the goo that comes off a blob and for the
// sparks off a sword hit, tinted per use.
export function shardTexture(scene, key, w, h, color = 0xffffff) {
  const tex = fresh(scene, key, w, h);
  const ctx = tex.getContext();
  const { r, g, b } = rgbOf(color);
  const grad = ctx.createLinearGradient(0, 0, w, 0);
  grad.addColorStop(0, `rgba(255,255,255,0.95)`);
  grad.addColorStop(0.45, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w * 0.3, 0);
  ctx.lineTo(w, h / 2);
  ctx.lineTo(w * 0.3, h);
  ctx.closePath();
  ctx.fill();
  tex.refresh();
  return linear(tex);
}

// The crescent that trails a sword swing.
export function arcTexture(scene, key, size, color = 0xffffff) {
  const tex = fresh(scene, key, size, size);
  const ctx = tex.getContext();
  const { r, g, b } = rgbOf(color);
  const mid = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(mid, mid, mid * 0.94, -Math.PI * 0.62, Math.PI * 0.62);
  ctx.arc(mid, mid, mid * 0.46, Math.PI * 0.62, -Math.PI * 0.62, true);
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createLinearGradient(mid, 0, mid, size);
  grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
  grad.addColorStop(0.5, `rgba(255,255,255,0.95)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  tex.refresh();
  return linear(tex);
}

// A soft ellipse for the contact shadow every entity now stands on. Nothing in
// the game casts a real shadow; this is just what stops sprites looking like
// stickers laid on the floor.
export function shadowTexture(scene, key, w, h) {
  const tex = fresh(scene, key, w, h);
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grad.addColorStop(0, 'rgba(0,0,0,0.5)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.26)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(1, h / w);
  ctx.translate(-w / 2, -w / 2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, w);
  ctx.restore();
  tex.refresh();
  return linear(tex);
}

// A four-petal flower shape for the petals drifting across the front end.
export function petalTexture(scene, key, size, color) {
  const tex = fresh(scene, key, size, size);
  const ctx = tex.getContext();
  const { r, g, b } = rgbOf(color);
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.scale(1, 0.62);
  const grad = ctx.createRadialGradient(0, -size * 0.15, 0, 0, 0, size / 2);
  grad.addColorStop(0, `rgba(255,255,255,0.95)`);
  grad.addColorStop(0.6, `rgba(${r},${g},${b},0.92)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0.25)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  tex.refresh();
  return linear(tex);
}

// Everything the effects layer needs, built once in Boot.
export function buildFxTextures(scene) {
  radialTexture(scene, 'fx_glow', 128, 0xffffff, { power: 2.2 });
  radialTexture(scene, 'fx_glow_soft', 128, 0xffffff, { power: 1.3 });
  // Deliberately a hard-ish core: this one is multiplied over a dark overlay to
  // cut torchlight out of it, and a lazy falloff there just greys the room.
  radialTexture(scene, 'fx_light', 256, 0xffffff, { power: 1.55, inner: 0.06 });
  radialTexture(scene, 'fx_dot', 32, 0xffffff, { power: 1.8 });
  radialTexture(scene, 'fx_smoke', 64, 0xffffff, { power: 1.15 });
  ringTexture(scene, 'fx_ring', 192, 0xffffff, { thickness: 0.13 });
  ringTexture(scene, 'fx_ring_thin', 192, 0xffffff, { thickness: 0.055 });
  starTexture(scene, 'fx_star', 96, 0xffffff);
  shardTexture(scene, 'fx_shard', 24, 10, 0xffffff);
  arcTexture(scene, 'fx_arc', 128, 0xffffff);
  shadowTexture(scene, 'fx_shadow', 64, 26);
  petalTexture(scene, 'fx_petal', 20, 0xff9ec4);
}

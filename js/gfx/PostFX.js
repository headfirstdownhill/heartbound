// A single full-screen shader pass over the finished frame: bloom on the bright
// parts, a warm/cool grade, edge chromatic aberration, faint scanlines and a
// vignette. It is what turns flat pixel art into something that looks lit.
//
// The class cannot be declared at the top level. The bundled build drops every
// module into one shared scope and runs it immediately, and a canvas-only
// browser has no `PostFXPipeline` to extend — `class X extends undefined` is a
// hard error at load, which would take the whole game down rather than
// gracefully dropping an effect. So it is built inside a function instead.

export const POSTFX_KEY = 'HeartboundPostFX';

const POSTFX_FRAG = `
precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uTime;
uniform float uBloom;
uniform float uVignette;
uniform float uAberration;
uniform float uScanline;
uniform float uSaturation;
uniform float uFlashAmount;
uniform vec3 uFlashColor;

varying vec2 outTexCoord;

void main(void) {
  vec2 uv = outTexCoord;
  vec2 fromCenter = uv - 0.5;
  float dist = length(fromCenter);

  // Aberration is zero in the middle and grows toward the corners, which is
  // where a real lens puts it. Flat aberration across the frame just looks
  // like the art is misregistered.
  // Clamped, or the offset reads run off the edge of the frame and leave a
  // green line down one border and a red one down the other.
  vec2 shift = fromCenter * uAberration * dist;
  vec4 color;
  color.r = texture2D(uMainSampler, clamp(uv + shift, 0.0005, 0.9995)).r;
  color.g = texture2D(uMainSampler, uv).g;
  color.b = texture2D(uMainSampler, clamp(uv - shift, 0.0005, 0.9995)).b;
  color.a = 1.0;

  // Eight taps on a ring, keeping only what was already bright. Cheap enough
  // for a phone and, on art this saturated, indistinguishable from a real
  // separable blur.
  // The threshold matters more than the strength. Too low and every ordinary
  // white pixel in the art blooms — a field of white roses turns into a field
  // of glowing orbs — so it sits high enough that only genuinely lit things
  // (glows, sparks, torches, flashes) get through.
  vec2 texel = 1.0 / uResolution;
  vec3 bloom = vec3(0.0);
  float radius = 3.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) * 0.7853981634;
    vec2 offset = vec2(cos(a), sin(a)) * texel * radius;
    vec3 s1 = texture2D(uMainSampler, uv + offset).rgb;
    vec3 s2 = texture2D(uMainSampler, uv + offset * 2.4).rgb;
    bloom += max(s1 - 0.78, 0.0) + max(s2 - 0.78, 0.0) * 0.6;
  }
  bloom /= 8.0;
  color.rgb += bloom * uBloom;

  // Saturation, pivoted on luminance.
  float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
  color.rgb = mix(vec3(luma), color.rgb, uSaturation);

  // Very faint horizontal banding. Anything stronger reads as a broken screen
  // rather than as a CRT.
  float scan = sin(uv.y * uResolution.y * 1.57079633);
  color.rgb *= 1.0 - uScanline * (0.5 + 0.5 * scan);

  // A slow drift across the frame so the image is never completely static,
  // even on a screen where nothing is moving.
  float drift = 0.995 + 0.005 * sin(uTime * 0.7 + uv.y * 3.0);
  color.rgb *= drift;

  float vig = smoothstep(0.92, 0.30, dist);
  color.rgb *= mix(1.0, vig, uVignette);

  color.rgb = mix(color.rgb, uFlashColor, uFlashAmount);

  gl_FragColor = color;
}
`;

// ---- the grade -------------------------------------------------------------
//
// Three complete looks, kept side by side so any of them can be put back by
// changing one word below. Each is a set of saturation values plus how hard to
// lean on the lens effects, as a multiplier over BASE_PRESETS.
//
//   warm    the original look
//   soft    saturation eased off, everything else untouched
//   softer  saturation a shade under neutral, and the fringing and scanlines
//           pulled well back
//
// **To go back a step, change one word:** GRADE = 'soft' (or 'warm').
//
// `bloom` is 1 in all three on purpose. The glow is the part worth keeping, so
// softening never touches it — if the glow itself ever needs easing, that is a
// separate decision and this is where to make it.
//
// There is no colour-temperature uniform in this shader, so "warmer" is not a
// dial of its own: the warmth is in the art's palette, and saturation decides
// how hard it lands.
const GRADE = 'softer';

const GRADES = {
  warm: {
    saturation: {
      menu: 1.1,
      garden: 1.04,
      dungeon: 1.02,
      boss: 1.06,
      meadow: 1.12,
      book: 1.02,
      win: 1.15,
      lose: 0.72,
    },
    bloom: 1,
    vignette: 1,
    aberration: 1,
    scanline: 1,
  },
  soft: {
    saturation: {
      menu: 1.02,
      garden: 1.0,
      dungeon: 0.99,
      boss: 1.02,
      meadow: 1.03,
      book: 1.0,
      win: 1.05,
      // The losing grade was already drained on purpose; it was never the
      // problem, so it is left almost where it was.
      lose: 0.74,
    },
    bloom: 1,
    vignette: 1,
    aberration: 1,
    scanline: 1,
  },
  softer: {
    saturation: {
      menu: 0.97,
      garden: 0.96,
      dungeon: 0.95,
      boss: 0.97,
      meadow: 0.97,
      book: 0.96,
      win: 0.99,
      lose: 0.72,
    },
    bloom: 1,
    // Corners lightened a little, and the two most obviously "shader" artifacts
    // — the colour fringing at the edges and the scanline banding — cut to
    // roughly half. Those are what read as an effect laid over the art; the
    // bloom is what reads as light in it.
    vignette: 0.85,
    aberration: 0.6,
    scanline: 0.55,
  },
};

// Per-mood presets. Scenes ask for one by name rather than setting five numbers.
const BASE_PRESETS = {
  // The front end can afford to be lush; there is nothing to read quickly.
  menu: { bloom: 2.4, vignette: 0.62, aberration: 0.0035, scanline: 0.05 },
  // Daylight. Barely any vignette, because the room is supposed to feel open.
  garden: { bloom: 1.5, vignette: 0.55, aberration: 0.0022, scanline: 0.045 },
  // Underground: heavier corners, colder, and the bloom does most of the work
  // of selling the torchlight.
  dungeon: { bloom: 2.2, vignette: 0.8, aberration: 0.003, scanline: 0.06 },
  boss: { bloom: 2.6, vignette: 0.88, aberration: 0.0042, scanline: 0.06 },
  meadow: { bloom: 1.9, vignette: 0.62, aberration: 0.0025, scanline: 0.04 },
  // The letter should read cleanly, so almost everything is dialled back.
  book: { bloom: 1.6, vignette: 0.55, aberration: 0.0012, scanline: 0.03 },
  win: { bloom: 2.6, vignette: 0.5, aberration: 0.003, scanline: 0.04 },
  lose: { bloom: 1.4, vignette: 0.9, aberration: 0.0018, scanline: 0.07 },
};

const NO_CHANGE = { bloom: 1, vignette: 1, aberration: 1, scanline: 1 };

export const POSTFX_PRESETS = Object.fromEntries(
  Object.entries(BASE_PRESETS).map(([name, base]) => {
    const grade = GRADES[GRADE];
    // `lose` opts out of the multipliers. Its whole job is to be heavy and
    // drained, and lightening its corners would be softening the wrong thing.
    const m = name === 'lose' ? NO_CHANGE : grade;
    return [
      name,
      {
        bloom: +(base.bloom * m.bloom).toFixed(4),
        vignette: +(base.vignette * m.vignette).toFixed(4),
        aberration: +(base.aberration * m.aberration).toFixed(5),
        scanline: +(base.scanline * m.scanline).toFixed(4),
        saturation: grade.saturation[name],
      },
    ];
  }),
);

export function makePostFXClass() {
  const Base = Phaser.Renderer?.WebGL?.Pipelines?.PostFXPipeline;
  if (!Base) return null;

  return class HeartboundPostFX extends Base {
    constructor(game) {
      super({ game, name: POSTFX_KEY, fragShader: POSTFX_FRAG });
      Object.assign(this, POSTFX_PRESETS.garden);
      this.flashAmount = 0;
      this.flashColor = [1, 1, 1];
    }

    onPreRender() {
      this.set1f('uTime', this.game.loop.time / 1000);
      this.set2f('uResolution', this.renderer.width, this.renderer.height);
      this.set1f('uBloom', this.bloom);
      this.set1f('uVignette', this.vignette);
      this.set1f('uAberration', this.aberration);
      this.set1f('uScanline', this.scanline);
      this.set1f('uSaturation', this.saturation);
      this.set1f('uFlashAmount', this.flashAmount);
      this.set3f('uFlashColor', this.flashColor[0], this.flashColor[1], this.flashColor[2]);
    }
  };
}

// Guarded on both counts: a browser that fell back to canvas has no pipeline to
// attach, and a scene whose camera was never given one must not throw when a
// later call tries to tune it.
export function applyPostFX(scene, preset = 'garden') {
  if (scene.game.renderer?.type !== Phaser.WEBGL) return null;
  const cam = scene.cameras.main;
  if (!cam) return null;
  let pipe = cam.getPostPipeline(POSTFX_KEY);
  if (Array.isArray(pipe)) pipe = pipe[0];
  if (!pipe) {
    cam.setPostPipeline(POSTFX_KEY);
    pipe = cam.getPostPipeline(POSTFX_KEY);
    if (Array.isArray(pipe)) pipe = pipe[0];
  }
  if (pipe) Object.assign(pipe, POSTFX_PRESETS[preset] ?? POSTFX_PRESETS.garden);
  scene.postFX = pipe ?? null;
  return pipe ?? null;
}

// Tween the whole look toward another preset — the level 3 boss waking up, or
// the meadow draining out on the way to the arena.
export function gradePostFX(scene, preset, ms = 800) {
  const pipe = scene.postFX;
  const target = POSTFX_PRESETS[preset];
  if (!pipe || !target) return;
  scene.tweens.add({
    targets: pipe,
    ...target,
    duration: ms,
    ease: 'Sine.inOut',
  });
}

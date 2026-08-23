import { GAME_W, GAME_H, TILE } from '../core/Constants.js';
import { CutsceneDirector } from '../systems/CutsceneDirector.js';
import { GameState } from '../core/GameState.js';
import { audio } from '../systems/AudioManager.js';
import { installFx } from '../systems/Fx.js';
import { applyPostFX } from '../gfx/PostFX.js';
import { PixelText } from '../gfx/PixelText.js';
import { hash2 } from '../gfx/sprites/tiles.js';
import { SpeechBubble, speechDuration, BUBBLE_HOLD_MS } from '../ui/SpeechBubble.js';

const JI_ZOOM = 1.25;
export const JI_FX = 240;
const JI_FY = 430;
const JI_VW = GAME_W / JI_ZOOM;
const JI_VH = GAME_H / JI_ZOOM;
export const JI_VIEW = {
  left: JI_FX - JI_VW / 2,
  right: JI_FX + JI_VW / 2,
  top: JI_FY - JI_VH / 2,
  bottom: JI_FY + JI_VH / 2,
};

// 300ms lean in, 320ms held together, 300ms back — the heart lands on the end
// of it. Shared by the story and the garden.
export const KISS_MS = 920;

// Narrow on purpose: a wide bubble covers half the meadow. Long speeches are
// split into consecutive bubbles rather than one tall one.
const WRAP = 20;
const GATE_X = 240;

// The "I love you Jory" opening. Nothing is stolen here — they talk, he gives
// her a key, and she walks out through the gate under her own steam.
//
// The meadow, the pond, the cats and the kiss are all built here but none of
// them know about the script, so GardenScene subclasses this and swaps the
// story out for a timer. The three hooks it overrides are `setupMode`,
// `buildOverlay` and `begin`.
export class JoryIntroScene extends Phaser.Scene {
  constructor(key = 'JoryIntro') {
    super(key);
  }

  create() {
    this.done = false;
    this.bubble = null;
    this.setupMode();
    this.cameras.main.setZoom(JI_ZOOM).centerOn(JI_FX, JI_FY);

    installFx(this);
    this.buildMeadow();
    this.buildPond();

    this.blanket = this.add.image(JI_FX, JI_FY + 16, 'blanket').setDepth(1).setScale(1.1);

    this.boy = this.add.image(JI_FX - 34, JI_FY, 'boy_sit').setDepth(JI_FY);
    this.girl = this.add.image(JI_FX + 34, JI_FY, 'girl_sit').setDepth(JI_FY);

    this.buildSpread();

    this.buildCats();

    this.key = this.add
      .image(this.boy.x, this.boy.y - 4, 'key')
      .setDepth(JI_FY + 30)
      .setVisible(false);

    this.smiley = this.add
      .image(this.boy.x + 4, this.boy.y - 34, 'smiley')
      .setDepth(JI_FY + 40)
      .setVisible(false);

    this.kiss = this.add
      .image(JI_FX, JI_FY - 26, 'heart')
      .setDepth(JI_FY + 40)
      .setVisible(false)
      .setScale(0.5);

    this.buildOverlay();

    // Petals over the roses, fireflies in the grass, sun through the hedge.
    // Nothing in this scene is a threat, so all of the motion is weather.
    this.fx.ambient('meadow', {
      x: JI_VIEW.left,
      y: JI_VIEW.top,
      width: JI_VIEW.right - JI_VIEW.left,
      height: JI_VIEW.bottom - JI_VIEW.top,
    });
    this.fx.ambient('petals', {
      x: JI_VIEW.left,
      y: JI_VIEW.top,
      width: JI_VIEW.right - JI_VIEW.left,
      height: JI_VIEW.bottom - JI_VIEW.top,
    });
    this.fx.godRays(JI_VIEW.left, JI_VIEW.top, JI_VIEW.right - JI_VIEW.left, JI_VIEW.bottom - JI_VIEW.top, {
      count: 4,
      alpha: 0.075,
    });
    applyPostFX(this, 'meadow');
    // Her song, not a generated one — this is the story, not a level.
    audio.music('flowers');

    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.begin();
  }

  // ---- the three things the garden does differently -----------------------

  // This scene defines the mode, so it sets it rather than trusting whoever
  // started it — the HUD keys its whole layout off this.
  setupMode() {
    GameState.difficulty = 'jory';
  }

  buildOverlay() {
    this.skipHint = new PixelText(this, JI_FX, JI_VIEW.bottom - 24, 'TAP TO SKIP', {
      scale: 1,
      color: 0xffffff,
    });
    this.skipHint.setAlpha(0.55).setDepth(2000);

    this.input.once('pointerdown', () => this.finish());
    this.input.keyboard.once('keydown-SPACE', () => this.finish());
    this.input.keyboard.once('keydown-ENTER', () => this.finish());
  }

  begin() {
    this.runScript();
  }

  // A field of roses rather than the wild flowers of the other opening — red
  // and white mixed, scattered deterministically so it never re-rolls.
  buildMeadow() {
    const rt = this.add.renderTexture(0, 0, GAME_W, GAME_H).setOrigin(0, 0).setDepth(-100);
    for (let y = 0; y < GAME_H; y += TILE) {
      for (let x = 0; x < GAME_W; x += TILE) {
        rt.draw((x / TILE + y / TILE) % 2 ? 'tile_grass' : 'tile_grass2', x, y);
        const roll = hash2(x, y);
        if (roll < 0.24) {
          const white = hash2(y + 11, x + 7) < 0.45;
          rt.draw(white ? 'rose_white' : 'rose_red', x + 2 + roll * 60, y + 3 + hash2(y, x) * 18);
        }
      }
    }

    // One unbroken run of hedge either side of the gate, rather than a line of
    // separate clumps.
    const hedgeY = JI_VIEW.top + 14;
    this.add.image(-20, hedgeY, 'hedge_left').setOrigin(0, 0.5).setDepth(hedgeY);
    this.add.image(GATE_X + 30, hedgeY, 'hedge_right').setOrigin(0, 0.5).setDepth(hedgeY);
    this.gate = this.add.image(GATE_X, JI_VIEW.top + 18, 'door_locked').setDepth(JI_VIEW.top + 18);
    // No scattered bushes out in the field — on open grass they read as stray
    // green blobs rather than shrubs. The roses carry the meadow on their own.
  }

  // Food laid out on the front half of the mat, below where the two of them
  // are sitting. Everything sorts on its own y so it layers with them.
  buildSpread() {
    const spread = [
      { key: 'rose_jar', x: JI_FX + 2, y: JI_FY + 16 },
      { key: 'picnic_basket', x: JI_FX - 44, y: JI_FY + 30 },
      { key: 'cake', x: JI_FX - 10, y: JI_FY + 38 },
      { key: 'sandwich', x: JI_FX + 20, y: JI_FY + 40 },
      { key: 'cup', x: JI_FX + 44, y: JI_FY + 32 },
      { key: 'cup', x: JI_FX - 28, y: JI_FY + 50 },
    ];

    this.spread = spread.map(({ key, x, y }) => this.add.image(x, y, key).setDepth(y));

    // The cake gets a slow bob so the eye lands on it.
    const cake = this.spread[2];
    this.tweens.add({
      targets: cake,
      y: cake.y - 2,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
  }

  // Pond down in the corner with otters turning circles in it.
  buildPond() {
    const px = JI_VIEW.left + 76;
    const py = JI_FY + 186;

    // Otters sort on their live y, which swings above and below the pond's
    // centre as they swim. Water and pads therefore need depths below the
    // lowest y an otter can reach, or an otter at the top of its arc sorts
    // behind a pad and appears to swim through it.
    const WATER_DEPTH = py - 80;
    const PAD_DEPTH = py - 60;

    this.add.image(px, py, 'pond').setDepth(WATER_DEPTH);

    // Pads sit on the water, under the otters, and drift a little.
    [
      [px - 44, py - 16, 'lilypad_bloom'],
      [px + 40, py + 14, 'lilypad'],
      [px + 4, py - 30, 'lilypad'],
      [px - 18, py + 30, 'lilypad_bloom'],
    ].forEach(([x, y, key], i) => {
      const pad = this.add.image(x, y, key).setDepth(PAD_DEPTH);
      this.tweens.add({
        targets: pad,
        x: x + 5,
        y: y + 3,
        duration: 2600 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });

    // Reeds around the rim, in front of and behind the water.
    [
      [px - 74, py - 22],
      [px - 58, py + 30],
      [px + 70, py - 16],
      [px + 52, py + 30],
      [px - 6, py - 46],
      [px + 22, py + 44],
    ].forEach(([x, y], i) => {
      const reed = this.add.image(x, y, 'reeds').setDepth(y + 8);
      // A slow lean, out of phase, so the bank looks like it has a breeze on it.
      this.tweens.add({
        targets: reed,
        angle: i % 2 ? 4 : -4,
        duration: 1800 + i * 260,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
    });

    this.otters = [0, 1, 2].map((i) => {
      const otter = this.add.sprite(px, py, 'otter').setDepth(py);
      otter.play('otter');
      otter.setScale(0.8);
      // Each swims its own slow ellipse inside the water.
      const rx = 52 - i * 13;
      const ry = 22 - i * 5;
      const phase = (i / 3) * Math.PI * 2;
      otter.swim = { px, py, rx, ry, phase: phase + i * 0.7, speed: 0.0009 + i * 0.00016 };
      return otter;
    });
  }

  // Three cats mooching about: white, toasted and black.
  buildCats() {
    const spots = [
      { key: 'cat_white', x: JI_FX + 96, y: JI_FY + 74, range: 54 },
      { key: 'cat_toast', x: JI_FX - 104, y: JI_FY + 40, range: 46 },
      { key: 'cat_black', x: JI_FX + 40, y: JI_FY - 82, range: 62 },
    ];
    this.cats = spots.map((spot, i) => {
      const cat = this.add.sprite(spot.x, spot.y, spot.key).setDepth(spot.y);
      cat.play(spot.key);
      // Pace back and forth, flipping to face the way they are going.
      this.tweens.add({
        targets: cat,
        x: spot.x + spot.range,
        duration: 3200 + i * 700,
        yoyo: true,
        repeat: -1,
        delay: i * 900,
        ease: 'Sine.inOut',
        onYoyo: () => cat.setFlipX(true),
        onRepeat: () => cat.setFlipX(false),
      });
      this.tweens.add({
        targets: cat,
        y: spot.y + 14,
        duration: 2100 + i * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });
      return cat;
    });
  }

  update(time) {
    this.otters?.forEach((o) => {
      const s = o.swim;
      const t = time * s.speed + s.phase;
      const nx = s.px + Math.cos(t) * s.rx;
      o.setFlipX(Math.sin(t) > 0);
      o.setPosition(nx, s.py + Math.sin(t) * s.ry);
      o.setDepth(o.y);
    });
    this.cats?.forEach((c) => c.setDepth(c.y));
  }

  // They lean in, hold, come apart, and the heart rises out of it. Written as
  // one call so the story beat and the garden's timer play the same thing.
  playKiss() {
    const lean = { duration: 300, yoyo: true, hold: 320, ease: 'Quad.out' };
    this.tweens.add({ targets: this.boy, x: this.boy.x + 16, ...lean });
    this.tweens.add({ targets: this.girl, x: this.girl.x - 16, ...lean });

    // The heart lands as they come apart rather than while they are together,
    // which is what reads as "that just happened" instead of a floating prop.
    this.time.delayedCall(KISS_MS, () => {
      this.kiss.setVisible(true).setAlpha(1).setScale(0.3).setPosition(JI_FX, JI_FY - 22);
      this.fx.sparkleTrail(JI_FX, JI_FY - 22, 0xff8fb0, 10);
      audio.play('heartGet');
      this.tweens.add({
        targets: this.kiss,
        scale: 1,
        y: this.kiss.y - 28,
        alpha: 0,
        duration: 950,
        ease: 'Quad.out',
      });
    });
  }

  // ---- dialogue ----------------------------------------------------------

  say(speaker, text) {
    this.bubble?.destroy();
    const above = speaker.y - 96;
    // Nudge the bubble toward the middle so a wide one never leaves the view.
    const cx = Phaser.Math.Clamp(speaker.x + (speaker === this.boy ? 40 : -40), 150, 330);
    this.bubble = new SpeechBubble(this, cx, above, text, {
      maxChars: WRAP,
      tailX: speaker.x,
      tailY: speaker.y,
      // He speaks lower than she does. It is two notes of difference and it is
      // the only thing making the two sides of the conversation distinguishable
      // with the sound on and the screen looked away from.
      voicePitch: speaker === this.boy ? 0.78 : 1.18,
    });
    this.bubble.type();
  }

  hideBubble() {
    this.bubble?.hide();
    this.bubble = null;
  }

  // One exchange: show it, type it, hold, clear.
  beat(director, speaker, text) {
    return director
      .call(() => this.say(speaker, text))
      .wait(speechDuration(text, WRAP) + BUBBLE_HOLD_MS)
      .call(() => this.hideBubble())
      .wait(280);
  }

  runScript() {
    const director = new CutsceneDirector(this);
    this.director = director;

    director.wait(900);

    this.beat(
      director,
      this.boy,
      'You know Jory, I really love you and I love spending my time with you.',
    );
    this.beat(director, this.boy, 'You mean everything to me.');

    this.beat(director, this.girl, 'I love you too Tharuk!');

    // He grins before he says it.
    director
      .call(() => {
        this.smiley.setVisible(true).setScale(0.3);
        this.tweens.add({ targets: this.smiley, scale: 1, duration: 260, ease: 'Back.out' });
        this.tweens.add({
          targets: this.smiley,
          y: this.smiley.y - 5,
          duration: 520,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.inOut',
        });
      })
      .wait(520);

    this.beat(director, this.boy, 'I want to give this to you...');

    // The key comes out and crosses to her.
    director
      .call(() => {
        this.smiley.setVisible(false);
        this.key.setVisible(true).setScale(0.5).setPosition(this.boy.x, this.boy.y - 4);
        this.tweens.add({ targets: this.key, scale: 1.1, duration: 320, ease: 'Back.out' });
        this.cameras.main.flash(180, 250, 220, 140);
        this.fx.star(this.boy.x, this.boy.y - 4, { tint: 0xffe08a, scale: 0.9 });
        this.fx.sparkleTrail(this.boy.x, this.boy.y - 4, 0xffe08a, 12);
        audio.play('sparkle');
      })
      .wait(380)
      .tween({
        targets: this.key,
        x: this.girl.x,
        y: this.girl.y - 12,
        duration: 640,
        ease: 'Sine.inOut',
      })
      .wait(260);

    this.beat(
      director,
      this.boy,
      'Take this Jory! This is for you, go and open the chest once you see it.',
    );
    this.beat(director, this.boy, "You'll know what I'm talking about.");
    this.beat(director, this.boy, 'Good luck, I love you!');

    // The kiss. KISS_MS is what the two lean tweens take, so the wait here
    // matches the old inline version exactly.
    director.call(() => this.playKiss()).wait(KISS_MS + 800)
      // And she goes, key in hand, out through the gate.
      .call(() => {
        this.girl.setTexture('girl_idle_up');
        this.gate.setTexture('door_open');
        this.tweens.add({ targets: this.gate, scale: 1.12, duration: 220, yoyo: true });
        this.fx.ring(this.gate.x, this.gate.y, { tint: 0xffe08a, to: 1.6, duration: 640 });
        audio.play('doorOpen');
      })
      .wait(300)
      .tweenAsync(() => ({
        targets: [this.girl, this.key],
        x: GATE_X,
        y: JI_VIEW.top + 6,
        duration: 1600,
        ease: 'Sine.inOut',
      }))
      .wait(1500)
      .call(() => this.cameras.main.fadeOut(700, 0, 0, 0))
      .wait(800)
      .call(() => this.finish());

    director.play();
  }

  finish() {
    if (this.done) return;
    this.done = true;
    this.director?.stop();
    this.bubble?.destroy();
    GameState.reset();
    GameState.seenIntro = true;
    // She is armed from the start here — there is no sword lying in the arena,
    // and no time to go looking for one.
    GameState.hasSword = true;
    GameState.hasKey = true;
    this.scene.start('JoryLevel');
    this.scene.launch('HUD');
  }
}

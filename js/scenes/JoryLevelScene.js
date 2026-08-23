import { BaseLevelScene } from './BaseLevelScene.js';
import { GameState } from '../core/GameState.js';
import { PLAYER_MAX_HP, EV_HEALTH_CHANGED, EV_WAVE_CHANGED, TILE, ROOM_X, ROOM_Y } from '../core/Constants.js';
import { FinalBoss } from '../entities/FinalBoss.js';
import { AlliedBlob } from '../entities/AlliedBlob.js';
import { PowerUp } from '../entities/PowerUp.js';
import { tileToWorld } from '../systems/RoomBuilder.js';
import {
  JORY_ARENA,
  WAVES,
  SPAWN_TILES,
  joryStats,
  rollPowerUp,
  POWERUP_INTERVAL_MS,
  SHIELD_MS,
  ALLY_COUNT,
} from '../data/joryData.js';
import { audio } from '../systems/AudioManager.js';
import { gradePostFX } from '../gfx/PostFX.js';

const WAVE_GAP_MS = 2200;
const BOSS_GAP_MS = 2600;

// The whole "I love you Jory" run in one room: five waves, then the boss, then
// the chest. No clock and no way to lose — the only exit is through.
export class JoryLevelScene extends BaseLevelScene {
  constructor() {
    super('JoryLevel', 'jory');
  }

  getLevel() {
    return { theme: 'dungeon', grid: JORY_ARENA };
  }

  musicTrack() {
    return 'arena';
  }

  // Waves own the spawning, so the room starts empty.
  spawnEnemies() {}

  // No door in here, and nothing to unlock until the boss is down.
  onRoomCleared() {}

  // No clock to punish her with, so going down just costs her position.
  handlePlayerDown() {
    this.cameras.main.flash(400, 200, 40, 60);
    this.fx.punch(0.02, 380, 0.03);
    this.fx.ring(this.player.x, this.player.y, { tint: 0xff4d6d, to: 3, duration: 700, alpha: 1 });
    audio.play('down');
    this.player.reviveAt(this.room.spawns.player.x, this.room.spawns.player.y);
    this.fx.burst(this.room.spawns.player.x, this.room.spawns.player.y, {
      tint: 0xffffff,
      scale: 1.2,
      duration: 420,
    });
    this.scene.get('HUD')?.showHint('GET UP!');
  }

  loseToTimer() {}

  onCreated() {
    GameState.hasSword = true;
    this.player.equipSword();

    this.wave = 0;
    this.waveActive = false;
    this.bossSpawned = false;
    this.finaleStarted = false;
    this.chestOpened = false;
    this.allies = [];
    this.powerUp = null;
    this.chest = null;

    this.shieldRing = this.add.image(this.player.x, this.player.y, 'shield_ring');
    this.shieldRing.setVisible(false).setDepth(9998).setAlpha(0.75).setTint(0x9fd8ff);

    this.powerTimer = this.time.addEvent({
      delay: POWERUP_INTERVAL_MS,
      loop: true,
      callback: () => this.spawnPowerUp(),
    });

    this.scene.get('HUD')?.showHint('FIVE WAVES. THEN THE CHEST.', 2600);
    this.time.delayedCall(2400, () => this.startWave(1));
  }

  // ---- waves -------------------------------------------------------------

  startWave(n) {
    this.wave = n;
    this.waveActive = true;
    this.game.events.emit(EV_WAVE_CHANGED, n, WAVES.length);
    this.scene.get('HUD')?.showHint(`WAVE ${n}`, 1600);
    this.cameras.main.flash(200, 90, 40, 120);
    this.fx.tint([0.6, 0.25, 0.9], 0.35, 400);
    audio.play('waveStart');

    const plan = WAVES[n - 1];
    const spots = Phaser.Utils.Array.Shuffle([...SPAWN_TILES]);
    let i = 0;

    Object.entries(plan).forEach(([tier, count]) => {
      for (let k = 0; k < count; k++) {
        const spot = spots[i % spots.length];
        i += 1;
        // Jitter within the tile so a stack of six does not spawn on one point.
        const world = tileToWorld(spot.col, spot.row);
        const x = world.x + Phaser.Math.Between(-10, 10);
        const y = world.y + Phaser.Math.Between(-10, 10);
        this.time.delayedCall(k * 130, () => {
          if (this.finished) return;
          const blob = this.addBlob(x, y, tier, joryStats(tier));
          blob.sprite.setScale(0.3);
          this.tweens.add({ targets: blob.sprite, scale: 1, duration: 260, ease: 'Back.out' });
          this.fx.burst(x, y, { tint: blob.tint, scale: 0.9, duration: 300 });
          this.fx.ring(x, y, { tint: blob.tint, to: 0.6, duration: 340 });
          audio.play('spawn');
        });
      }
    });
  }

  // Base spawns straight from level data; here every blob needs the buffed
  // stats, so the override threads them through.
  addBlob(x, y, tier, stats = null) {
    const blob = super.addBlob(x, y, tier, stats ?? joryStats(tier));
    return blob;
  }

  handleBlobDied() {
    if (this.finished) return;
    this.time.delayedCall(0, () => {
      // The boss falling ends the fight outright. Anything still on the floor
      // was summoned by it and dies with it, so the light comes down the moment
      // she kills it rather than after a mop-up.
      if (this.bossSpawned && this.boss?.dying && !this.finaleStarted) {
        // Claimed before killing the rest, because each death re-enters here.
        this.finaleStarted = true;
        this.livingBlobs.forEach((b) => {
          if (b !== this.boss) b.die();
        });
        this.beginFinale();
        return;
      }

      if (this.livingBlobs.length > 0) return;
      this.blobs = this.blobs.filter((b) => !b.dying);

      if (!this.waveActive) return;
      this.waveActive = false;

      if (this.wave >= WAVES.length) {
        this.scene.get('HUD')?.showHint('SOMETHING ELSE IS COMING', 2200);
        this.time.delayedCall(BOSS_GAP_MS, () => this.spawnBoss());
      } else {
        this.time.delayedCall(WAVE_GAP_MS, () => this.startWave(this.wave + 1));
      }
    });
  }

  spawnBoss() {
    if (this.finished || this.bossSpawned) return;
    this.bossSpawned = true;

    const spot = tileToWorld(5, 3);
    this.boss = new FinalBoss(this, spot.x, spot.y);
    this.boss.onSpawnMinion = (b, count) => this.spawnBossMinions(b, count);
    this.boss.onSlam = (b, radius) => this.bossSlam(b, radius);
    this.blobs.push(this.boss);
    this.physics.add.collider(this.boss.sprite, this.room.walls);

    this.boss.sprite.setScale(0.2);
    this.tweens.add({ targets: this.boss.sprite, scale: 1, duration: 520, ease: 'Back.out' });
    this.cameras.main.shake(700, 0.014);
    this.cameras.main.flash(400, 160, 30, 90);

    // The room itself darkens around it — the arena stops being a place to
    // fight in and becomes part of the thing you are fighting.
    gradePostFX(this, 'boss', 1400);
    this.fx.lightAlpha = 0.85;
    this.fx.addLight(this.boss.sprite, { size: 260, flicker: true });
    this.fx.ring(spot.x, spot.y, { tint: 0xff2a5c, to: 4, duration: 900, alpha: 1 });
    this.fx.smoke(spot.x, spot.y, 18, 0x33061a);
    this.fx.tint([1, 0.2, 0.4], 0.6, 700);
    audio.duck(0.2, 1600);
    audio.play('roar');

    this.game.events.emit(EV_WAVE_CHANGED, 'BOSS', WAVES.length);
    this.scene.get('HUD')?.showHint('KILL IT', 2200);
  }

  spawnBossMinions(boss, count) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = boss.x + Math.cos(angle) * 56;
      const y = boss.y + Math.sin(angle) * 56;
      const blob = this.addBlob(x, y, 'medium');
      blob.sprite.setScale(0.3);
      this.tweens.add({ targets: blob.sprite, scale: 1, duration: 280, ease: 'Back.out' });
      this.fx.burst(x, y, { tint: 0x9a5cff, scale: 1, duration: 340 });
      this.fx.ring(x, y, { tint: 0x9a5cff, to: 0.7, duration: 380 });
    }
  }

  // A ring rather than a line: standing still next to it is the mistake.
  bossSlam(boss, radius) {
    this.cameras.main.shake(320, 0.018);
    const ring = this.add.ellipse(boss.x, boss.y + 10, 40, 20, 0xff4d6d, 0);
    ring.setStrokeStyle(4, 0xff4d6d, 0.9).setDepth(boss.y - 1);
    this.tweens.add({
      targets: ring,
      scaleX: (radius * 2) / 40,
      scaleY: (radius * 2) / 40 / 2,
      alpha: 0,
      duration: 420,
      onComplete: () => ring.destroy(),
    });
    // A second, brighter wave over the top of the outline, plus the dust it
    // kicks up, so the reach of the attack is unmissable.
    this.fx.ring(boss.x, boss.y + 10, {
      tint: 0xff9a2a,
      to: (radius * 2) / 192,
      duration: 440,
      alpha: 1,
    });
    this.fx.dust(boss.x, boss.y + 16, 14, 0x8a6a4a);
    this.fx.punch(0.006, 200, 0.014);

    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, boss.x, boss.y + 10);
    if (dist < radius) {
      const dead = this.player.takeDamage(boss.stats.damage, boss.x, boss.y, this.time.now);
      if (dead) this.handlePlayerDown();
    }
  }

  // ---- power-ups ---------------------------------------------------------

  // One at a time, on open floor, and never dropped in her lap.
  spawnPowerUp() {
    if (this.finished || this.finaleStarted || this.powerUp) return;
    const grid = this.level.grid;
    for (let tries = 0; tries < 40; tries++) {
      const col = Phaser.Math.Between(1, grid[0].length - 2);
      const row = Phaser.Math.Between(1, grid.length - 2);
      if (grid[row][col] === '#') continue;
      const world = tileToWorld(col, row);
      if (Phaser.Math.Distance.Between(world.x, world.y, this.player.x, this.player.y) < 90) continue;
      this.powerUp = new PowerUp(this, world.x, world.y, rollPowerUp());
      return;
    }
  }

  applyPowerUp(def, time) {
    const hud = this.scene.get('HUD');
    const px = this.player.x;
    const py = this.player.y;
    audio.play('pickup');

    switch (def.key) {
      case 'heal':
        GameState.playerHp = PLAYER_MAX_HP;
        this.game.events.emit(EV_HEALTH_CHANGED, GameState.playerHp);
        this.cameras.main.flash(260, 255, 120, 150);
        this.fx.ring(px, py, { tint: 0xff8fb0, to: 1.4, duration: 520, flat: false });
        this.fx.sparkleTrail(px, py, 0xff8fb0, 16);
        audio.play('heal');
        break;

      case 'shield':
        this.player.shieldUntil = time + SHIELD_MS;
        this.cameras.main.flash(260, 140, 220, 255);
        this.fx.ring(px, py, { tint: 0x9fd8ff, to: 1.2, duration: 520, flat: false });
        audio.play('shieldUp');
        break;

      case 'ally':
        for (let i = 0; i < ALLY_COUNT; i++) {
          this.allies.push(new AlliedBlob(this, px, py, i, ALLY_COUNT));
          this.fx.burst(px, py, { tint: 0x4aa8ee, scale: 1.1, duration: 380 });
        }
        this.fx.ring(px, py, { tint: 0x4aa8ee, to: 1.6, duration: 560 });
        audio.play('summon');
        break;

      case 'nuke': {
        // The horde only — the boss is the fight, not part of the crowd.
        const doomed = this.livingBlobs.filter((b) => b !== this.boss);
        this.cameras.main.flash(500, 255, 240, 180);
        this.cameras.main.shake(500, 0.02);
        this.fx.tint([1, 0.96, 0.75], 0.95, 900);
        this.fx.ring(px, py, { tint: 0xfff6d0, to: 6, duration: 900, alpha: 1 });
        this.fx.punch(0.02, 500, 0.04);
        audio.duck(0.2, 1400);
        audio.play('nuke');
        doomed.forEach((b) => b.die());
        break;
      }
    }
    if (def.label) hud?.showHint(def.label, 1800);
  }

  // ---- the chest ---------------------------------------------------------

  // Only ever called from handleBlobDied, which owns the finaleStarted claim.
  beginFinale() {
    this.finaleStarted = true;
    this.powerTimer?.remove();
    this.powerUp?.destroy();
    this.powerUp = null;

    // The fight is over, so the arena stops being a boss room: the darkness
    // lifts, the grade warms back up, and the music changes underneath it.
    gradePostFX(this, 'meadow', 1600);
    this.tweens.add({ targets: this.fx, lightAlpha: 0.22, duration: 1800, ease: 'Sine.inOut' });
    audio.music('flowers');

    const mid = tileToWorld(5, 9);
    this.time.delayedCall(900, () => {
      this.cameras.main.flash(700, 255, 250, 220);
      this.fx.addLight(mid, { size: 320 });
      this.fx.ring(mid.x, mid.y, { tint: 0xfff6d0, to: 4, duration: 1200, alpha: 1 });
      audio.play('chest');

      // A column of light dropped onto the middle of the arena.
      const beam = this.add.rectangle(mid.x, mid.y - 300, 96, 640, 0xfff6d0, 0);
      beam.setDepth(mid.y - 2);
      this.tweens.add({ targets: beam, fillAlpha: 0.35, duration: 700 });
      this.tweens.add({
        targets: beam,
        fillAlpha: 0.16,
        duration: 1400,
        delay: 700,
        yoyo: true,
        repeat: -1,
      });

      // Purple aura under it, breathing.
      this.aura = this.add.ellipse(mid.x, mid.y + 12, 112, 52, 0x8f6bb0, 0.55);
      this.aura.setDepth(mid.y - 1);
      this.tweens.add({
        targets: this.aura,
        scaleX: 1.25,
        scaleY: 1.25,
        alpha: 0.28,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.inOut',
      });

      this.chest = this.add.image(mid.x, mid.y, 'chest_closed').setDepth(mid.y).setScale(0);
      this.tweens.add({ targets: this.chest, scale: 1, duration: 620, ease: 'Back.out' });

      // Motes rising out of the beam for as long as it stands there.
      this.chestMotes = this.add.particles(mid.x, mid.y + 10, 'fx_dot', {
        x: { min: -46, max: 46 },
        speedY: { min: -60, max: -20 },
        speedX: { min: -8, max: 8 },
        lifespan: { min: 1400, max: 2600 },
        scale: { start: 0.24, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xfff6d0, 0xffe08a, 0xffffff],
        blendMode: 'ADD',
        frequency: 130,
      });
      this.chestMotes.setDepth(mid.y + 2);

      this.time.delayedCall(700, () => {
        this.scene.get('HUD')?.showHint('USE THE KEY', 3000);
      });
    });
  }

  openChest() {
    this.chestOpened = true;
    this.finished = true;
    // Earned for good. From here the title screen carries an inventory and the
    // book can be read again without fighting through the waves for it.
    GameState.chestOpened = true;
    GameState.saveUnlocks();
    this.player.freeze();
    this.chest.setTexture('chest_open');
    this.cameras.main.flash(600, 255, 245, 210);
    this.fx.tint([1, 0.97, 0.85], 0.8, 900);
    this.fx.ring(this.chest.x, this.chest.y, { tint: 0xfff6d0, to: 5, duration: 1100, alpha: 1 });
    this.fx.star(this.chest.x, this.chest.y - 20, { tint: 0xffffff, scale: 2.2, duration: 900 });
    this.fx.sparkleTrail(this.chest.x, this.chest.y, 0xfff6d0, 40);
    audio.duck(0.2, 1800);
    audio.play('chest');

    // Two things come out, and they part as they rise so neither is hidden
    // behind the other on the way up.
    [
      { key: 'book', dx: -30 },
      { key: 'ring', dx: 30 },
    ].forEach(({ key, dx }, i) => {
      const item = this.add
        .image(this.chest.x, this.chest.y, key)
        .setDepth(this.chest.y + 10)
        .setScale(0.4);
      this.tweens.add({
        targets: item,
        x: this.chest.x + dx,
        y: this.chest.y - 46,
        scale: 1.3,
        duration: 900,
        ease: 'Quad.out',
      });
      // Out of phase, so the pair does not sway as one object.
      this.tweens.add({
        targets: item,
        angle: { from: -4, to: 4 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        delay: 900 + i * 260,
        ease: 'Sine.inOut',
      });
    });

    this.time.delayedCall(2100, () => {
      this.cameras.main.fadeOut(700, 255, 255, 255);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('HUD');
        this.scene.start('Book');
      });
    });
  }

  // ---- per-frame ---------------------------------------------------------

  onUpdate(time) {
    // Shield ring rides along and vanishes with the effect.
    const shielded = this.player.isShielded(time);
    this.shieldRing.setVisible(shielded);
    if (shielded) {
      this.shieldRing
        .setPosition(this.player.x, this.player.y)
        .setDepth(this.player.y + 3)
        .setAlpha(this.player.shieldUntil - time < 3000 && Math.floor(time / 140) % 2 ? 0.25 : 0.75);
    }

    this.allies = this.allies.filter((ally) => {
      if (ally.expired) {
        ally.destroy();
        return false;
      }
      ally.update(time, this.player, this.blobs);
      return true;
    });

    if (this.powerUp) {
      if (this.powerUp.update(time, this.player)) {
        this.powerUp.collect();
        this.applyPowerUp(this.powerUp.def, time);
        this.powerUp = null;
      } else if (this.powerUp.lapsed) {
        this.powerUp.destroy();
        this.powerUp = null;
      }
    }

    if (this.chest && !this.chestOpened) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y) < 34) {
        this.openChest();
      }
    }
  }
}

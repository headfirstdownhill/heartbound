import {
  EV_BLOB_DIED,
  EV_TIMER_EXPIRED,
  DEATH_TIME_PENALTY_MS,
  ROOM_X,
  ROOM_Y,
  GAME_W,
  GAME_H,
  HUD_H,
  TILE,
} from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { runTimer } from '../core/Timer.js';
import { input } from '../core/InputController.js';
import { buildRoom } from '../systems/RoomBuilder.js';
import { Player } from '../entities/Player.js';
import { Blob } from '../entities/Blob.js';
import { BossBlob } from '../entities/BossBlob.js';
import { GhostCompanion } from '../entities/GhostCompanion.js';
import { LEVELS } from '../data/levelData.js';
import { installFx } from '../systems/Fx.js';
import { audio } from '../systems/AudioManager.js';
import { applyPostFX } from '../gfx/PostFX.js';

// What each room looks, sounds and lights like. The dungeon is lit only by its
// torches and by whatever the player is carrying; the garden is open daylight.
const ROOM_MOOD = {
  garden: {
    postFX: 'garden',
    // The one recorded track that plays inside a level.
    music: 'flowers',
    ambient: 'garden',
    dust: 0x9ec46a,
    lighting: null,
    rays: true,
  },
  dungeon: {
    postFX: 'dungeon',
    music: 'dungeon',
    ambient: 'dungeon',
    dust: 0x8a6a4a,
    lighting: { color: 0x0a0716, alpha: 0.78 },
    rays: false,
  },
};

// Every playable room shares this: build tiles, spawn the cast, wire combat,
// unlock the door when the room is clear. Levels differ only by their data.
export class BaseLevelScene extends Phaser.Scene {
  constructor(key, levelKey) {
    super(key);
    this.levelKey = levelKey;
  }

  // Overridable so a scene can supply its own room without having to register
  // it in LEVELS — levelData cannot import the Jory arena back without making
  // the two modules circular, which the flat bundle would resolve to undefined.
  getLevel() {
    return LEVELS[this.levelKey];
  }

  create() {
    const level = this.getLevel();
    this.level = level;
    this.blobs = [];
    this.finished = false;

    // Phaser keeps one instance per scene key for the life of the page, so any
    // field create() does not reassign is inherited by the next run. All of
    // these are set conditionally further down, so they have to be cleared
    // here or a replay starts holding the previous run's objects.
    this.ghost = null;
    this.boss = null;
    this.door = null;
    this.doorBlock = null;
    this.doorOpen = false;
    this.swordPickup = null;

    // Rebind every level: Key objects belong to the scene that made them and go
    // dead when that scene shuts down.
    input.bindKeyboard(this);

    // Before anything that might want to spawn a particle or hang a shadow off
    // itself — which is every entity below.
    installFx(this);
    this.mood = ROOM_MOOD[level.theme] ?? ROOM_MOOD.dungeon;
    this.stepDustTint = this.mood.dust;

    const room = buildRoom(this, level);
    this.room = room;
    this.physics.world.setBounds(ROOM_X, ROOM_Y, room.width, room.height);

    this.player = new Player(this, room.spawns.player.x, room.spawns.player.y, input);
    this.player.sprite.setCollideWorldBounds(true);
    this.physics.add.collider(this.player.sprite, room.walls);

    this.buildDoor(room.spawns.door);
    this.buildSword(room.spawns.sword);
    this.spawnEnemies(room.spawns);

    if (GameState.isEasy) {
      this.ghost = new GhostCompanion(this, this.player.x, this.player.y);
    }

    this.onBlobDied = (blob) => this.handleBlobDied(blob);
    this.game.events.on(EV_BLOB_DIED, this.onBlobDied);
    this.onTimeUp = () => this.loseToTimer();
    this.game.events.on(EV_TIMER_EXPIRED, this.onTimeUp);

    this.events.on('shutdown', () => {
      this.game.events.off(EV_BLOB_DIED, this.onBlobDied);
      this.game.events.off(EV_TIMER_EXPIRED, this.onTimeUp);
    });

    // One room, one screen: zoom so the whole arena fits below the HUD strip and
    // never scrolls, so the player can always see every blob still alive.
    const cam = this.cameras.main;
    const viewH = GAME_H - HUD_H;
    cam.setViewport(0, HUD_H, GAME_W, viewH);
    cam.setZoom(Math.min(GAME_W / room.width, viewH / room.height));
    cam.centerOn(ROOM_X + room.width / 2, ROOM_Y + room.height / 2);
    cam.fadeIn(400, 0, 0, 0);

    this.dressRoom(room);
    applyPostFX(this, this.mood.postFX);
    audio.music(this.musicTrack());

    this.onCreated?.(room);
  }

  // Overridden by level 3 and the arena, which have their own music.
  musicTrack() {
    return this.mood.music;
  }

  // Everything that is atmosphere rather than mechanism: motes in the air,
  // torchlight, the darkness the torches are cutting through, sun through the
  // hedges. None of it is collidable and none of it is ever read back.
  dressRoom(room) {
    const bounds = { x: ROOM_X, y: ROOM_Y, width: room.width, height: room.height };
    this.fx.ambient(this.mood.ambient, bounds);
    if (this.mood.rays) {
      this.fx.godRays(ROOM_X, ROOM_Y, room.width, room.height, { count: 2, alpha: 0.022 });
    }

    if (this.mood.lighting) {
      this.fx.enableLighting(ROOM_X, ROOM_Y, room.width, room.height, this.mood.lighting);
      // She carries the biggest light in the room, which is what makes moving
      // through a dungeon feel like exploring one.
      this.fx.addLight(this.player.sprite, { size: 300, offsetY: -4 });
      room.torches.forEach((t) => {
        this.fx.torch(t.x, t.y, { tint: 0xffa542, scale: 0.7 });
        this.fx.addLight(t, { flicker: true });
      });
    } else {
      room.torches.forEach((t) => this.fx.torch(t.x, t.y, { tint: 0xffd08a, scale: 0.5 }));
    }
  }

  buildDoor(pos) {
    if (!pos) return;
    this.door = this.add.image(pos.x, pos.y, 'door_locked').setDepth(pos.y - 20);
    this.doorOpen = false;
    // Solid while locked, so she cannot stand inside the doorway early.
    this.doorBlock = this.physics.add.staticImage(pos.x, pos.y, null).setVisible(false);
    this.doorBlock.body.setSize(TILE, TILE);
    this.doorBlock.refreshBody();
    this.physics.add.collider(this.player.sprite, this.doorBlock);
  }

  buildSword(pos) {
    if (!pos || GameState.hasSword) return;
    this.swordPickup = this.add.image(pos.x, pos.y, 'sword').setDepth(pos.y);
    this.tweens.add({
      targets: this.swordPickup,
      y: pos.y - 7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // A halo under it and a slow rain of sparks off it. It is the first thing
    // the player has to find, in the first room, with no text telling them where.
    this.swordGlow = this.add
      .image(pos.x, pos.y + 6, 'fx_glow')
      .setTint(0xfff2c4)
      .setAlpha(0.45)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(pos.y - 1)
      .setScale(0.7);
    this.tweens.add({
      targets: this.swordGlow,
      scale: 1.05,
      alpha: 0.7,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.swordSparkle = this.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        if (this.swordPickup) this.fx.sparkleTrail(this.swordPickup.x, this.swordPickup.y, 0xfff2c4, 1);
      },
    });
  }

  spawnEnemies(spawns) {
    spawns.enemies.forEach((e) => this.addBlob(e.x, e.y, e.tier));
    if (spawns.boss) {
      this.boss = new BossBlob(this, spawns.boss.x, spawns.boss.y);
      this.boss.onSpawnMinion = (b) => this.spawnMinion(b);
      this.blobs.push(this.boss);
      this.physics.add.collider(this.boss.sprite, this.room.walls);
      if (this.doorBlock) this.physics.add.collider(this.boss.sprite, this.doorBlock);
    }
  }

  addBlob(x, y, tier, stats = null) {
    const blob = new Blob(this, x, y, tier, stats);
    this.physics.add.collider(blob.sprite, this.room.walls);
    if (this.doorBlock) this.physics.add.collider(blob.sprite, this.doorBlock);
    this.blobs.push(blob);
    return blob;
  }

  spawnMinion(boss) {
    audio.play('summon');
    for (let i = 0; i < 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const x = boss.x + Math.cos(angle) * 42;
      const y = boss.y + Math.sin(angle) * 42;
      const blob = this.addBlob(x, y, 'easy');
      blob.sprite.setScale(0.4);
      this.tweens.add({ targets: blob.sprite, scale: 1, duration: 300, ease: 'Back.out' });
      this.fx.burst(x, y, { tint: 0x7ed957, scale: 0.8, duration: 300 });
      this.fx.ring(x, y, { tint: 0x7ed957, to: 0.55, duration: 320 });
    }
  }

  get livingBlobs() {
    return this.blobs.filter((b) => !b.dying);
  }

  handleBlobDied() {
    if (this.finished) return;
    // Deferred a frame: the boss emits this from inside its own update.
    this.time.delayedCall(0, () => {
      if (this.livingBlobs.length === 0) this.onRoomCleared();
    });
  }

  onRoomCleared() {
    if (this.doorOpen || !this.door) return;
    this.doorOpen = true;
    this.door.setTexture('door_open');
    if (this.doorBlock) this.doorBlock.body.enable = false;
    this.cameras.main.flash(200, 255, 220, 120);
    this.tweens.add({ targets: this.door, scale: 1.15, duration: 200, yoyo: true });
    this.scene.get('HUD')?.showHint('THE WAY IS OPEN');

    // The exit becomes the brightest thing on screen and stays that way, so a
    // player who cleared the room while looking somewhere else still finds it.
    this.fx.ring(this.door.x, this.door.y, { tint: 0xffe08a, to: 2, duration: 700, alpha: 1 });
    this.fx.sparkleTrail(this.door.x, this.door.y, 0xffe08a, 16);
    this.doorGlow = this.add
      .image(this.door.x, this.door.y + 4, 'fx_glow')
      .setTint(0xffe08a)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(this.door.y - 1)
      .setScale(1.1);
    this.tweens.add({
      targets: this.doorGlow,
      alpha: 0.6,
      scale: 1.45,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    if (this.fx.lightRT) this.fx.addLight(this.door, { size: 260 });
    audio.play('doorOpen');
  }

  update(time) {
    if (this.finished) return;
    this.player.update(time);
    this.blobs.forEach((b) => !b.dying && b.update(time, this.player));
    this.ghost?.update(time, this.player, this.blobs);

    this.checkSwordPickup();
    this.checkCombat(time);
    this.checkDoor();
    this.onUpdate?.(time);
    this.fx.update(time);
  }

  checkSwordPickup() {
    if (!this.swordPickup) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.swordPickup.x, this.swordPickup.y) < 26) {
      this.player.equipSword();
      const pickup = this.swordPickup;
      this.tweens.add({
        targets: pickup,
        y: pickup.y - 30,
        alpha: 0,
        duration: 300,
        onComplete: () => pickup.destroy(),
      });
      this.swordPickup = null;
      this.swordSparkle?.remove();
      this.swordSparkle = null;
      this.tweens.add({
        targets: this.swordGlow,
        alpha: 0,
        scale: 2,
        duration: 400,
        onComplete: () => this.swordGlow?.destroy(),
      });
      audio.play('swordGet');
      this.scene.get('HUD')?.showHint(input.isTouch ? 'SWORD! TAP TO SWING' : 'SWORD! SPACE TO SWING');
    }
  }

  // The swing reaches 26px plus half a hitbox, which is far enough to cross a
  // 32px wall tile. Walk the segment between the two and refuse the hit if any
  // wall sits in the way, otherwise blobs pinned on the far side of a hedge are
  // free kills. Sampled at a quarter-tile so a full tile can never be skipped.
  hasLineOfSight(x1, y1, x2, y2) {
    const grid = this.level.grid;
    const dist = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const steps = Math.ceil(dist / (TILE / 4));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const col = Math.floor((x1 + (x2 - x1) * t - ROOM_X) / TILE);
      const row = Math.floor((y1 + (y2 - y1) * t - ROOM_Y) / TILE);
      if (grid[row]?.[col] === '#') return false;
    }
    return true;
  }

  checkCombat(time) {
    const swinging = this.player.isSwinging(time);
    const box = swinging ? this.player.getHitbox() : null;

    this.blobs.forEach((blob) => {
      if (blob.dying) return;

      // Shared by the swing and the contact check below, so neither side of the
      // fight can hurt the other through a wall.
      const clear = this.hasLineOfSight(this.player.x, this.player.y, blob.x, blob.y);

      if (swinging && clear && !this.player.hitThisSwing.has(blob)) {
        // Test the physics body, not the sprite rect, so the per-tier hitbox
        // sizes in blobStats actually change how hard something is to land.
        const body = blob.sprite.body;
        const b = new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
        if (Phaser.Geom.Intersects.RectangleToRectangle(box, b)) {
          this.player.hitThisSwing.add(blob);
          blob.takeDamage(this.player.damage, this.player.x, this.player.y, time);
        }
      }

      const contact = Phaser.Math.Distance.Between(blob.x, blob.y, this.player.x, this.player.y);
      const reach = blob === this.boss ? 46 : 24;
      if (contact < reach && clear && blob.canTouch(time)) {
        blob.registerTouch(time);
        const dead = this.player.takeDamage(blob.stats.damage, blob.x, blob.y, time);
        if (dead) this.handlePlayerDown();
      }
    });
  }

  // Running out of hearts costs time, not the run — the clock is the real threat.
  handlePlayerDown() {
    runTimer.penalize(DEATH_TIME_PENALTY_MS);
    this.cameras.main.flash(400, 200, 40, 60);
    this.fx.punch(0.02, 380, 0.03);
    this.fx.ring(this.player.x, this.player.y, { tint: 0xff4d6d, to: 3, duration: 700, alpha: 1 });
    audio.duck(0.3, 900);
    audio.play('down');
    this.player.reviveAt(this.room.spawns.player.x, this.room.spawns.player.y);
    this.fx.burst(this.room.spawns.player.x, this.room.spawns.player.y, {
      tint: 0xffffff,
      scale: 1.2,
      duration: 420,
    });
    this.scene.get('HUD')?.showHint('-30 SECONDS');
  }

  checkDoor() {
    if (!this.doorOpen || !this.door || this.finished) return;
    if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.door.x, this.door.y) < 26) {
      this.finished = true;
      audio.play('uiConfirm');
      this.fx.burst(this.door.x, this.door.y, { tint: 0xffffff, scale: 2.4, duration: 400 });
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        GameState.currentLevel += 1;
        this.scene.start(this.level.next);
      });
    }
  }

  loseToTimer() {
    if (this.finished) return;
    this.finished = true;
    audio.stopMusic(400);
    this.scene.stop('HUD');
    this.scene.start('GameOver');
  }
}

import { makeTexture, makeSheet, makeAnim, solidTexture } from '../gfx/PixelArt.js';
import { BLOB_TINTS } from '../gfx/Palette.js';
import { BOY, GHOST } from '../gfx/sprites/characters.js';
import { buildGirlTextures } from '../gfx/GirlBuilder.js';
import { GameState } from '../core/GameState.js';
import {
  BLOB_IDLE,
  BLOB_CHASE,
  BLOB_HIT,
  BLOB_DEATH,
  BOSS_IDLE,
  BOSS_WINDUP,
  BOSS_HIT,
  BOSS_DEATH,
  FINAL_IDLE,
  FINAL_WINDUP,
  FINAL_SLAM,
  FINAL_HIT,
  FINAL_DEATH,
} from '../gfx/sprites/blobs.js';
import {
  KEY,
  CHEST_CLOSED,
  CHEST_OPEN,
  BOOK,
  BOOK_PURPLE,
  RING,
  RING_GARNET,
  BUBBLE_HEAL,
  BUBBLE_SHIELD,
  BUBBLE_ALLY,
  BUBBLE_NUKE,
  BUBBLE_GLASS,
  shieldRing,
  ROSE_RED,
  ROSE_WHITE,
  CAT_WALK,
  CAT_COATS,
  OTTER_SWIM,
  SMILEY,
  REEDS,
  LILYPAD,
  LILYPAD_BLOOM,
  PICNIC_BASKET,
  CAKE,
  SANDWICH,
  CUP,
  ROSE_JAR,
  pondGrid,
  hedgeBand,
} from '../gfx/sprites/jory.js';
import {
  HEART,
  SWORD,
  SLASH,
  DOOR_LOCKED,
  DOOR_OPEN,
  BASKET,
  SHOCK,
  FLOWER,
  BUSH,
  makeBlanket,
} from '../gfx/sprites/items.js';
import { grassTile, floorTile, pathTile, wallTile, hedgeTile, torchBracket } from '../gfx/sprites/tiles.js';
import { buildFxTextures } from '../gfx/FxTextures.js';
import { stickBase, stickKnob, attackButton, pauseIcon, heartOutline } from '../gfx/sprites/ui.js';
import { FONT_FRAMES, FONT_FRAMES_SEMI } from '../gfx/sprites/font.js';
import { FONT_KEY, FONT_KEY_SEMI, FONT_PX, FONT_PX_SEMI } from '../gfx/PixelText.js';
import { PX, TILE } from '../core/Constants.js';

const BLOB_PX = { easy: 2, medium: 2, hard: 3, boss: 3, final: 3, ally: 2 };

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    // Before anything reads it: the title screen decides whether to offer the
    // inventory off the back of this.
    GameState.loadUnlocks();

    this.buildCharacters();
    this.buildBlobs();
    this.buildProps();
    this.buildTiles();
    this.buildUI();
    // Glows, sparks, light masks and shadows. Canvas gradients rather than
    // pixel grids, so they live apart from the rest of the art.
    buildFxTextures(this);

    document.getElementById('boot-msg')?.remove();
    this.scene.start('Menu');
  }

  buildCharacters() {
    // Her sprites come from the chosen look; the customiser rebuilds them with
    // the same call whenever a selection changes.
    buildGirlTextures(this, GameState.look);

    makeSheet(this, 'boy_idle_down', BOY.down.idle);
    makeSheet(this, 'boy_walk_down', BOY.down.walk);
    makeAnim(this, 'boy_idle_down', 'boy_idle_down', BOY.down.idle.length, { frameRate: 2 });
    makeAnim(this, 'boy_walk_down', 'boy_walk_down', BOY.down.walk.length, { frameRate: 10 });
    makeTexture(this, 'boy_sit', BOY.sit);
    // Rotated flat in-engine when he collapses, rather than as a second texture.
    makeTexture(this, 'boy_limp', BOY.limp);
    makeTexture(this, 'boy_cheer', BOY.cheer);

    makeSheet(this, 'ghost_float', GHOST.float);
    makeAnim(this, 'ghost_float', 'ghost_float', GHOST.float.length, { frameRate: 3 });
  }

  buildBlobs() {
    Object.entries(BLOB_TINTS).forEach(([tier, overrides]) => {
      const pixelSize = BLOB_PX[tier];
      const opts = { overrides, pixelSize };
      if (tier === 'final') {
        makeSheet(this, 'final_idle', FINAL_IDLE, opts);
        makeSheet(this, 'final_windup', FINAL_WINDUP, opts);
        makeSheet(this, 'final_slam', FINAL_SLAM, opts);
        makeSheet(this, 'final_hit', FINAL_HIT, opts);
        makeSheet(this, 'final_death', FINAL_DEATH, opts);
        makeAnim(this, 'final_idle', 'final_idle', FINAL_IDLE.length, { frameRate: 3 });
        makeAnim(this, 'final_windup', 'final_windup', FINAL_WINDUP.length, { frameRate: 4 });
        makeAnim(this, 'final_slam', 'final_slam', FINAL_SLAM.length, { frameRate: 4 });
        makeAnim(this, 'final_hit', 'final_hit', FINAL_HIT.length, { frameRate: 8, repeat: 0 });
        makeAnim(this, 'final_death', 'final_death', FINAL_DEATH.length, {
          frameRate: 4,
          repeat: 0,
        });
        return;
      }
      if (tier === 'boss') {
        makeSheet(this, 'boss_idle', BOSS_IDLE, opts);
        makeSheet(this, 'boss_windup', BOSS_WINDUP, opts);
        makeSheet(this, 'boss_hit', BOSS_HIT, opts);
        makeSheet(this, 'boss_death', BOSS_DEATH, opts);
        makeAnim(this, 'boss_idle', 'boss_idle', BOSS_IDLE.length, { frameRate: 3 });
        makeAnim(this, 'boss_windup', 'boss_windup', BOSS_WINDUP.length, { frameRate: 4 });
        makeAnim(this, 'boss_hit', 'boss_hit', BOSS_HIT.length, { frameRate: 8, repeat: 0 });
        makeAnim(this, 'boss_death', 'boss_death', BOSS_DEATH.length, { frameRate: 4, repeat: 0 });
        return;
      }
      makeSheet(this, `blob_${tier}_idle`, BLOB_IDLE, opts);
      makeSheet(this, `blob_${tier}_chase`, BLOB_CHASE, opts);
      makeSheet(this, `blob_${tier}_hit`, BLOB_HIT, opts);
      makeSheet(this, `blob_${tier}_death`, BLOB_DEATH, opts);
      makeAnim(this, `blob_${tier}_idle`, `blob_${tier}_idle`, BLOB_IDLE.length, { frameRate: 3 });
      makeAnim(this, `blob_${tier}_chase`, `blob_${tier}_chase`, BLOB_CHASE.length, { frameRate: 7 });
      makeAnim(this, `blob_${tier}_hit`, `blob_${tier}_hit`, BLOB_HIT.length, { frameRate: 10, repeat: 0 });
      makeAnim(this, `blob_${tier}_death`, `blob_${tier}_death`, BLOB_DEATH.length, {
        frameRate: 9,
        repeat: 0,
      });
    });
  }

  buildProps() {
    makeTexture(this, 'heart', HEART, { pixelSize: 3 });
    makeTexture(this, 'heart_small', HEART, { pixelSize: 2 });
    makeTexture(this, 'heart_empty', heartOutline(), { pixelSize: 2 });
    makeTexture(this, 'sword', SWORD, { pixelSize: PX });
    makeTexture(this, 'slash', SLASH, { pixelSize: 3 });
    makeTexture(this, 'door_locked', DOOR_LOCKED, { pixelSize: PX });
    makeTexture(this, 'door_open', DOOR_OPEN, { pixelSize: PX });
    makeTexture(this, 'blanket', makeBlanket(40, 30, 4), { pixelSize: 3 });
    makeTexture(this, 'basket', BASKET, { pixelSize: PX });
    makeTexture(this, 'shock', SHOCK, { pixelSize: PX });
    makeTexture(this, 'flower', FLOWER, { pixelSize: PX });
    makeTexture(this, 'bush', BUSH, { pixelSize: PX });
    makeSheet(this, FONT_KEY, FONT_FRAMES, { pixelSize: FONT_PX });
    makeSheet(this, FONT_KEY_SEMI, FONT_FRAMES_SEMI, { pixelSize: FONT_PX_SEMI });
    solidTexture(this, 'px', 1, 1, '#ffffff');

    // "I love you Jory" props.
    makeTexture(this, 'key', KEY, { pixelSize: PX });
    makeTexture(this, 'chest_closed', CHEST_CLOSED, { pixelSize: PX });
    makeTexture(this, 'chest_open', CHEST_OPEN, { pixelSize: PX });
    makeTexture(this, 'book', BOOK, { pixelSize: PX });
    makeTexture(this, 'book2', BOOK, { pixelSize: PX, overrides: BOOK_PURPLE });
    makeTexture(this, 'ring', RING, { pixelSize: PX, overrides: RING_GARNET });
    // One shell, four colours of glass — the same override trick the blob tiers
    // use, so the four bubbles cost one grid between them.
    [
      ['bubble_heal', BUBBLE_HEAL],
      ['bubble_shield', BUBBLE_SHIELD],
      ['bubble_ally', BUBBLE_ALLY],
      ['bubble_nuke', BUBBLE_NUKE],
    ].forEach(([key, rows]) =>
      makeTexture(this, key, rows, { pixelSize: PX, overrides: BUBBLE_GLASS[key] }),
    );
    makeTexture(this, 'shield_ring', shieldRing(), { pixelSize: 2 });

    // The meadow in the Jory opening.
    makeTexture(this, 'rose_red', ROSE_RED, { pixelSize: PX });
    makeTexture(this, 'rose_white', ROSE_WHITE, { pixelSize: PX });
    makeTexture(this, 'smiley', SMILEY, { pixelSize: PX });
    makeTexture(this, 'pond', pondGrid(58, 32), { pixelSize: 3 });
    makeTexture(this, 'reeds', REEDS, { pixelSize: PX });
    // Two runs of hedge, sized to sit either side of the gate.
    makeTexture(this, 'hedge_left', hedgeBand(110, 22, 3), { pixelSize: PX });
    makeTexture(this, 'hedge_right', hedgeBand(120, 22, 11), { pixelSize: PX });
    makeTexture(this, 'lilypad', LILYPAD, { pixelSize: PX });
    makeTexture(this, 'lilypad_bloom', LILYPAD_BLOOM, { pixelSize: PX });
    makeTexture(this, 'picnic_basket', PICNIC_BASKET, { pixelSize: PX });
    makeTexture(this, 'cake', CAKE, { pixelSize: PX });
    makeTexture(this, 'sandwich', SANDWICH, { pixelSize: PX });
    makeTexture(this, 'cup', CUP, { pixelSize: PX });
    makeTexture(this, 'rose_jar', ROSE_JAR, { pixelSize: PX });

    makeSheet(this, 'otter', OTTER_SWIM, { pixelSize: 2 });
    makeAnim(this, 'otter', 'otter', OTTER_SWIM.length, { frameRate: 3 });

    Object.entries(CAT_COATS).forEach(([key, overrides]) => {
      makeSheet(this, key, CAT_WALK, { pixelSize: 2, overrides });
      makeAnim(this, key, key, CAT_WALK.length, { frameRate: 5 });
    });
  }

  buildTiles() {
    const tilePx = TILE / 16;
    makeTexture(this, 'tile_grass', grassTile(), { pixelSize: tilePx });
    makeTexture(this, 'tile_grass2', grassTile(91), { pixelSize: tilePx });
    makeTexture(this, 'tile_floor', floorTile(), { pixelSize: tilePx });
    makeTexture(this, 'tile_floor2', floorTile(57), { pixelSize: tilePx });
    makeTexture(this, 'tile_path', pathTile(), { pixelSize: tilePx });
    // Four of each, not two: at eleven tiles across, a two-tile checker is a
    // visible chequerboard, and four variants read as a surface.
    makeTexture(this, 'tile_wall', wallTile(), { pixelSize: tilePx });
    makeTexture(this, 'tile_wall2', wallTile(77), { pixelSize: tilePx });
    makeTexture(this, 'tile_hedge', hedgeTile(), { pixelSize: tilePx });
    makeTexture(this, 'tile_hedge2', hedgeTile(64), { pixelSize: tilePx });
    makeTexture(this, 'tile_grass3', grassTile(133), { pixelSize: tilePx });
    makeTexture(this, 'tile_grass4', grassTile(208), { pixelSize: tilePx });
    makeTexture(this, 'tile_floor3', floorTile(103), { pixelSize: tilePx });
    makeTexture(this, 'tile_floor4', floorTile(151), { pixelSize: tilePx });
    makeTexture(this, 'torch', torchBracket(), { pixelSize: PX });
  }

  buildUI() {
    makeTexture(this, 'ui_stick_base', stickBase(), { pixelSize: 3 });
    makeTexture(this, 'ui_stick_knob', stickKnob(), { pixelSize: 3 });
    makeTexture(this, 'ui_attack', attackButton(), { pixelSize: 3 });
    makeTexture(this, 'ui_pause', pauseIcon(), { pixelSize: 2 });
  }
}

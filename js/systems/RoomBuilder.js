import { TILE, ROOM_X, ROOM_Y } from '../core/Constants.js';
import { TIER_BY_CHAR } from '../data/levelData.js';
import { hash2 } from '../gfx/sprites/tiles.js';

const THEMES = {
  garden: {
    floor: ['tile_grass', 'tile_grass2', 'tile_grass3', 'tile_grass4'],
    wall: ['tile_hedge', 'tile_hedge2'],
    decor: 'flower',
    // Hedges are foliage, so their contact shadow is soft and green-black.
    shadow: 0x16240f,
  },
  dungeon: {
    floor: ['tile_floor', 'tile_floor2', 'tile_floor3', 'tile_floor4'],
    wall: ['tile_wall', 'tile_wall2'],
    shadow: 0x0d0916,
    torches: true,
  },
};

export function tileToWorld(col, row) {
  return { x: ROOM_X + col * TILE + TILE / 2, y: ROOM_Y + row * TILE + TILE / 2 };
}

// Stamps the whole room into one RenderTexture (hundreds of individual tile
// GameObjects is a real cost on low-end phones) and returns the static wall
// bodies plus every marker the scene needs to populate itself.
export function buildRoom(scene, level) {
  const theme = THEMES[level.theme] ?? THEMES.dungeon;
  const grid = level.grid;
  const rows = grid.length;
  const cols = grid[0].length;
  const isWall = (r, c) => grid[r]?.[c] === '#';

  const rt = scene.add.renderTexture(ROOM_X, ROOM_Y, cols * TILE, rows * TILE).setOrigin(0, 0);
  rt.setDepth(-100);

  const walls = scene.physics.add.staticGroup();
  const spawns = { enemies: [], player: null, door: null, sword: null, boy: null, boss: null };
  const torches = [];

  // Contact shadows, drawn over the floor but under everything that stands on
  // it. Three stacked bands rather than one, so the wall's shadow falls off
  // instead of ending in a hard line.
  const shade = scene.add.graphics().setDepth(-99);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const ch = grid[row][col];
      const px = col * TILE;
      const py = row * TILE;
      const roll = hash2(col, row);

      if (ch === '#') {
        rt.draw(theme.wall[Math.floor(roll * theme.wall.length) % theme.wall.length], px, py);
        const body = walls.create(ROOM_X + px + TILE / 2, ROOM_Y + py + TILE / 2, null);
        body.setVisible(false);
        body.body.setSize(TILE, TILE);
        body.refreshBody();

        // A torch every few tiles, on wall faces that the player can actually
        // see — a light source buried inside a block of wall is wasted.
        if (theme.torches && !isWall(row + 1, col) && row + 1 < rows && roll > 0.72) {
          torches.push({ x: ROOM_X + px + TILE / 2, y: ROOM_Y + py + TILE / 2 + 4 });
        }
        continue;
      }

      // Deterministic floor variation, no per-frame randomness.
      const variant = theme.floor[(col * 7 + row * 3 + Math.floor(roll * 4)) % theme.floor.length];
      rt.draw(variant, px, py);
      if (theme.decor && roll < 0.14) {
        rt.draw(theme.decor, px + 4 + roll * 100, py + 6 + hash2(row, col) * 18);
      }

      if (isWall(row - 1, col)) {
        const sx = ROOM_X + px;
        const sy = ROOM_Y + py;
        [0.34, 0.2, 0.1].forEach((a, i) => {
          shade.fillStyle(theme.shadow, a);
          shade.fillRect(sx, sy + i * 4, TILE, 4);
        });
      }

      const world = tileToWorld(col, row);
      if (ch === 'P') spawns.player = world;
      else if (ch === 'D') spawns.door = world;
      else if (ch === 'S') spawns.sword = world;
      else if (ch === 'Y') spawns.boy = world;
      else if (ch === 'B') spawns.boss = world;
      else if (TIER_BY_CHAR[ch]) spawns.enemies.push({ tier: TIER_BY_CHAR[ch], ...world });
    }
  }

  return { walls, spawns, torches, theme: level.theme, width: cols * TILE, height: rows * TILE };
}

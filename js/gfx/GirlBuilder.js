import { makeSheet, makeTexture, makeAnim } from './PixelArt.js';
import { GIRL, build, walkCycle } from './sprites/characters.js';
import { HAIR_STYLES, OUTFITS, lookOverrides } from '../data/lookData.js';

// Rebuilds every texture the player character appears in, from the chosen look.
// Called once at boot with the defaults and again on each change in the
// customiser — the texture keys never change, so everything downstream (player,
// intros, endings) picks up the new art with no other wiring.
const DIRS = ['down', 'up', 'side'];

// Paints a hair fall into the transparent margin around the body. Writing only
// into empty pixels means a long style can never eat into the dress or the
// arms, whatever outfit it is combined with.
function applySpill(body, spill) {
  if (!spill) return body;
  return body.map((row, i) => {
    const mask = spill[i];
    if (!mask) return row;
    return row
      .split('')
      .map((ch, x) => (ch === '.' && mask[x] && mask[x] !== '.' ? mask[x] : ch))
      .join('');
  });
}

export function buildGirlTextures(scene, look) {
  const style = HAIR_STYLES[look.hair] ?? HAIR_STYLES[0];
  const outfit = OUTFITS[look.outfit] ?? OUTFITS[0];
  const overrides = lookOverrides(look);

  DIRS.forEach((dir) => {
    const head = style.heads[dir];
    const sideOn = dir === 'side';
    const spill = sideOn ? style.spillSide : style.spillFront;
    const body = applySpill(sideOn ? outfit.side : outfit.front, spill);
    const legs = sideOn ? outfit.legsSide : outfit.legsFront;

    const idleKey = `girl_idle_${dir}`;
    const walkKey = `girl_walk_${dir}`;

    // Animations hold references into the texture, so they have to go before
    // the texture underneath them is replaced.
    scene.anims.remove(idleKey);
    scene.anims.remove(walkKey);

    makeSheet(scene, idleKey, [build(head, body, legs.idle)], { overrides });
    makeSheet(scene, walkKey, walkCycle(head, body, legs.a, legs.b, legs.idle), { overrides });
    makeAnim(scene, idleKey, idleKey, 1, { frameRate: 2 });
    makeAnim(scene, walkKey, walkKey, 4, { frameRate: 10 });
  });

  // Story poses share her colours but are drawn separately.
  makeTexture(scene, 'girl_sit', GIRL.sit, { overrides });
  makeTexture(scene, 'girl_cheer', GIRL.cheer, { overrides });
}

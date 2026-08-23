import { GhostCompanion } from './GhostCompanion.js';
import { ALLY_MS } from '../data/joryData.js';

// The ally power-up's blobs. Same follow-and-strike behaviour as the ghost, so
// they are the ghost with a blob's skin, a spread-out resting spot and a clock
// on them.
//
// They used to be the green tier under a pale tint, which in a room full of
// green tier blobs was not a distinction anyone could make mid-fight. They now
// have their own blue art (BLOB_TINTS.ally) and carry no tint at all, so the
// rule is simply: blue is yours.
//
// 12 every 850ms each, so the four of them run at roughly 56 damage a second
// against the 25 three of them used to manage. That is a real presence in a
// crowd and still under the sword's 12 every 330ms — they help her win the
// room, they do not win it for her. Worth knowing when tuning: they will also
// pick the final boss as a target, and its 360hp is about seven seconds of a
// full set staying in contact with it.
const ALLY_DAMAGE = 12;
const ALLY_COOLDOWN_MS = 850;
// A shade longer than the ghost's 34: at 34 they spent the fight drifting into
// range and back out of it without ever landing the swing they were lined up for.
const ALLY_RANGE = 42;
const ALLY_RADIUS = 40;

export class AlliedBlob extends GhostCompanion {
  constructor(scene, x, y, index = 0, total = 1) {
    // Fan them out around her so a full set does not stack into one blob. At
    // 60 degrees apart four of them span a half circle, which puts one off each
    // shoulder and one to either side rather than all four crowding the front.
    const angle = -Math.PI / 2 + ((index - (total - 1) / 2) * Math.PI) / 3;
    super(scene, x, y, {
      texture: 'blob_ally_idle',
      anim: 'blob_ally_idle',
      tint: null,
      alpha: 0.94,
      damage: ALLY_DAMAGE,
      cooldown: ALLY_COOLDOWN_MS,
      range: ALLY_RANGE,
      lifetimeMs: ALLY_MS,
      restVec: { x: Math.cos(angle) * ALLY_RADIUS, y: Math.sin(angle) * ALLY_RADIUS },
    });

    // The slash follows the tint, and a null tint leaves it white. Point it at
    // the ally blue so their hits read as theirs and not as one of hers.
    this.slash.setTint(0x9adcff);
    this.hitTint = 0x9adcff;

    // Blink out over the last two seconds so their leaving is not a surprise.
    scene.time.delayedCall(Math.max(0, ALLY_MS - 2000), () => {
      if (this.sprite.active) {
        scene.tweens.add({
          targets: this.sprite,
          alpha: 0.25,
          duration: 260,
          yoyo: true,
          repeat: -1,
        });
      }
    });
  }
}

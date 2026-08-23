import { RUN_DURATION_MS } from './Constants.js';

// Wall-clock based on purpose: a Phaser TimerEvent belongs to a scene and would
// be destroyed every time the player walks through a door.
export class GlobalTimer {
  constructor(durationMs = RUN_DURATION_MS) {
    this.durationMs = durationMs;
    this.startTime = null;
    this.penaltyMs = 0;
    this.expired = false;
    this.running = false;
    this.paused = false;
    this.pausedAt = 0;
  }

  start() {
    this.startTime = performance.now();
    this.penaltyMs = 0;
    this.expired = false;
    this.running = true;
    this.paused = false;
  }

  stop() {
    this.running = false;
    this.paused = false;
  }

  penalize(ms) {
    this.penaltyMs += ms;
  }

  // Being wall-clock is what makes this survive walking through a door, and it
  // is also why pausing has to be handled here: the game freezing does nothing
  // to performance.now(), so without this the clock would keep burning while
  // the player is looking at a pause screen.
  pause() {
    if (!this.running || this.paused) return;
    this.paused = true;
    this.pausedAt = performance.now();
  }

  resume() {
    if (!this.paused) return;
    this.paused = false;
    // Hand back the time spent paused by winding the penalty the other way.
    this.penaltyMs -= performance.now() - this.pausedAt;
  }

  getRemainingMs() {
    if (this.startTime === null) return this.durationMs;
    const now = this.paused ? this.pausedAt : performance.now();
    const elapsed = now - this.startTime + this.penaltyMs;
    return Math.max(0, this.durationMs - elapsed);
  }

  // Returns true on the single frame the clock runs out.
  tick() {
    if (!this.running || this.expired) return false;
    if (this.getRemainingMs() <= 0) {
      this.expired = true;
      this.running = false;
      return true;
    }
    return false;
  }

  format() {
    const total = Math.ceil(this.getRemainingMs() / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
}

export const runTimer = new GlobalTimer();

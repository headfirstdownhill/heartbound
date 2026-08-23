// A flat, ordered list of beats. Nesting tween callbacks by hand for a scene
// this long turns unreadable fast; this keeps the intro readable as a script.
export class CutsceneDirector {
  constructor(scene) {
    this.scene = scene;
    this.queue = [];
    this.index = 0;
    this.stopped = false;
  }

  // `config` may be a function returning the config. Pass one whenever the
  // targets do not exist yet at script-build time (anything spawned mid-scene) —
  // an object literal captures the targets array as it is right now.
  tween(config) {
    this.queue.push({ type: 'tween', config });
    return this;
  }

  // Fire a tween but move straight on to the next beat, so things can overlap.
  tweenAsync(config) {
    this.queue.push({ type: 'tweenAsync', config });
    return this;
  }

  wait(ms) {
    this.queue.push({ type: 'wait', ms });
    return this;
  }

  call(fn) {
    this.queue.push({ type: 'call', fn });
    return this;
  }

  play(onComplete) {
    this.onComplete = onComplete;
    this.next();
  }

  stop() {
    this.stopped = true;
  }

  next() {
    if (this.stopped) return;
    if (this.index >= this.queue.length) {
      this.onComplete?.();
      return;
    }
    const step = this.queue[this.index++];
    const resolve = (c) => (typeof c === 'function' ? c() : c);
    switch (step.type) {
      case 'wait':
        this.scene.time.delayedCall(step.ms, () => this.next());
        break;
      case 'call':
        step.fn();
        this.next();
        break;
      case 'tween': {
        const config = resolve(step.config);
        // A tween with no targets fires onComplete immediately and would silently
        // skip the beat, so treat it as a plain wait instead.
        if (!config.targets || config.targets.length === 0) {
          this.scene.time.delayedCall(config.duration ?? 0, () => this.next());
          break;
        }
        this.scene.tweens.add({ ...config, onComplete: () => this.next() });
        break;
      }
      case 'tweenAsync':
        this.scene.tweens.add(resolve(step.config));
        this.next();
        break;
      default:
        this.next();
    }
  }
}

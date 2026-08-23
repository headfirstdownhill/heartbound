export class VirtualJoystick {
  constructor(scene, x, y, radius = 56) {
    this.scene = scene;
    this.origin = { x, y };
    this.radius = radius;
    this.vector = { x: 0, y: 0 };
    this.pointerId = null;

    this.base = scene.add.image(x, y, 'ui_stick_base').setScrollFactor(0).setAlpha(0.35);
    this.knob = scene.add.image(x, y, 'ui_stick_knob').setScrollFactor(0).setAlpha(0.55);
    this.base.setDepth(1000);
    this.knob.setDepth(1001);

    // The whole lower-left quadrant grabs the stick, not just the drawn circle —
    // thumbs rarely land exactly on target.
    this.zone = scene.add
      .zone(0, scene.scale.height - 300, scene.scale.width * 0.62, 300)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setInteractive();

    this.zone.on('pointerdown', (p) => this.onDown(p));
    scene.input.on('pointermove', (p) => this.onMove(p));
    scene.input.on('pointerup', (p) => this.onUp(p));
    scene.input.on('pointerupoutside', (p) => this.onUp(p));
  }

  onDown(pointer) {
    if (this.pointerId !== null) return;
    this.pointerId = pointer.id;
    this.origin = { x: pointer.x, y: pointer.y };
    this.base.setPosition(pointer.x, pointer.y).setAlpha(0.5);
    this.knob.setPosition(pointer.x, pointer.y).setAlpha(0.85);
    this.update(pointer);
  }

  onMove(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.update(pointer);
  }

  onUp(pointer) {
    if (pointer.id !== this.pointerId) return;
    this.pointerId = null;
    this.vector = { x: 0, y: 0 };
    this.knob.setPosition(this.origin.x, this.origin.y).setAlpha(0.55);
    this.base.setAlpha(0.35);
  }

  update(pointer) {
    const dx = pointer.x - this.origin.x;
    const dy = pointer.y - this.origin.y;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, this.radius);
    const angle = Math.atan2(dy, dx);
    this.knob.setPosition(
      this.origin.x + Math.cos(angle) * clamped,
      this.origin.y + Math.sin(angle) * clamped,
    );
    // Small deadzone so resting thumbs don't drift the player.
    if (dist < 10) {
      this.vector = { x: 0, y: 0 };
    } else {
      const mag = clamped / this.radius;
      this.vector = { x: Math.cos(angle) * mag, y: Math.sin(angle) * mag };
    }
  }

  getVector() {
    return this.vector;
  }
}

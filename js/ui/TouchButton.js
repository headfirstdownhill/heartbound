export class TouchButton {
  constructor(scene, x, y, textureKey, radius = 52) {
    this.pressed = false;
    this.image = scene.add
      .image(x, y, textureKey)
      .setScrollFactor(0)
      .setDepth(1000)
      .setAlpha(0.72)
      .setInteractive(new Phaser.Geom.Circle(radius, radius, radius + 16), Phaser.Geom.Circle.Contains);

    this.image.on('pointerdown', () => {
      this.pressed = true;
      this.image.setAlpha(0.95).setScale(0.9);
    });
    const release = () => this.image.setAlpha(0.72).setScale(1);
    this.image.on('pointerup', release);
    this.image.on('pointerout', release);
  }

  // Edge-triggered, matching keyboard JustDown semantics.
  consumePress() {
    if (!this.pressed) return false;
    this.pressed = false;
    return true;
  }
}

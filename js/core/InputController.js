// One interface for both control schemes, so Player never asks how the input
// arrived. Touch UI objects are created by the HUD scene and handed in here.
export class InputController {
  constructor() {
    this.isTouch = InputController.detectTouch();
    this.keys = null;
    this.joystick = null;
    this.attackButton = null;
    this.clickQueued = false;
  }

  static detectTouch() {
    return (
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0)
    );
  }

  bindKeyboard(scene) {
    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up2: Phaser.Input.Keyboard.KeyCodes.UP,
      down2: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack2: Phaser.Input.Keyboard.KeyCodes.J,
    });
  }

  bindDesktopClick(scene) {
    if (this.isTouch) return;
    scene.input.on('pointerdown', () => {
      this.clickQueued = true;
    });
  }

  attachTouchUI(joystick, attackButton) {
    this.joystick = joystick;
    this.attackButton = attackButton;
  }

  detachTouchUI() {
    this.joystick = null;
    this.attackButton = null;
  }

  getMoveVector() {
    if (this.isTouch && this.joystick) return this.joystick.getVector();
    if (!this.keys) return { x: 0, y: 0 };
    const k = this.keys;
    const x = (k.right.isDown || k.right2.isDown ? 1 : 0) - (k.left.isDown || k.left2.isDown ? 1 : 0);
    const y = (k.down.isDown || k.down2.isDown ? 1 : 0) - (k.up.isDown || k.up2.isDown ? 1 : 0);
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }

  isAttackPressed() {
    if (this.attackButton && this.attackButton.consumePress()) return true;
    if (this.clickQueued) {
      this.clickQueued = false;
      return true;
    }
    if (!this.keys) return false;
    return (
      Phaser.Input.Keyboard.JustDown(this.keys.attack) ||
      Phaser.Input.Keyboard.JustDown(this.keys.attack2)
    );
  }

  // Any-input check, used by the title / ending screens.
  isAnyPressed(scene) {
    return scene.input.activePointer.isDown || (this.keys && this.keys.attack.isDown);
  }
}

export const input = new InputController();

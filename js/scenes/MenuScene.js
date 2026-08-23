import { GAME_W, GAME_H } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton, meadowBackdrop, SoundToggle } from '../ui/MenuWidgets.js';
import { MiniPlayer } from '../ui/MiniPlayer.js';
import { audio } from '../systems/AudioManager.js';

// Title screen. Boot lands here now; the intro plays once a difficulty is picked.
export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create() {
    // Scene instances are reused, so this has to be cleared on every entry or
    // coming back from an ending leaves PLAY permanently dead.
    this.leaving = false;

    // The backdrop brings the weather and the grade with it.
    meadowBackdrop(this, 0.66);
    const cx = GAME_W / 2;

    // The title sits in its own pool of light, so the two words read as one
    // object rather than as text laid over a photograph of a field.
    const titleGlow = this.add
      .image(cx, 238, 'fx_glow')
      .setTint(0xff4d6d)
      .setAlpha(0)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(560)
      .setScale(3.4, 1.9);
    this.tweens.add({ targets: titleGlow, alpha: 0.34, duration: 900, delay: 300 });
    this.tweens.add({
      targets: titleGlow,
      scaleX: 3.9,
      alpha: 0.5,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      delay: 1200,
      ease: 'Sine.inOut',
    });

    const line1 = new PixelText(this, cx, 200, 'HEART', { scale: 5, color: 0xff4d6d });
    const line2 = new PixelText(this, cx, 275, 'BOUND', { scale: 5, color: 0xff4d6d });
    [line1, line2].forEach((t, i) => {
      t.setDepth(600);
      t.container.setScale(0);
      this.tweens.add({
        targets: t.container,
        scale: 1,
        duration: 550,
        delay: i * 150,
        ease: 'Back.out',
        onComplete: () => {
          audio.play('uiConfirm');
          this.fx.ring(cx, t.container.y, {
            tint: 0xff8fb0,
            to: 2.6,
            duration: 700,
            depth: 590,
          });
        },
      });
    });

    const heart = this.add.image(cx, 380, 'heart').setDepth(600).setScale(2);
    this.tweens.add({
      targets: heart,
      scale: 2.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    // The heart beats and its light beats with it, half a step behind, which is
    // what makes it look like it is glowing rather than flashing.
    const heartGlow = this.add
      .image(cx, 380, 'fx_glow')
      .setTint(0xff4d6d)
      .setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(595)
      .setScale(1.1);
    this.tweens.add({
      targets: heartGlow,
      scale: 1.6,
      alpha: 0.75,
      duration: 700,
      yoyo: true,
      repeat: -1,
      delay: 90,
      ease: 'Sine.inOut',
    });
    this.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => this.fx.sparkleTrail(cx, 380, 0xff8fb0, 1),
    });

    const tag = new PixelText(this, cx, 455, 'GET HIS HEART BACK', { scale: 2, color: 0xffe08a });
    tag.setDepth(600).setAlpha(0);
    this.tweens.add({ targets: tag.container, alpha: 1, duration: 700, delay: 600 });

    new MenuButton(this, cx, 578, 'PLAY', {
      scale: 4,
      minWidth: 240,
      onPick: () => this.start(),
    });

    // The meadow with nothing asked of you. Green so it reads as somewhere to
    // go rather than another thing to do.
    new MenuButton(this, cx, 664, 'GARDEN', {
      scale: 2,
      minWidth: 240,
      color: 0x7ed957,
      onPick: () => this.openGarden(),
    });

    // Only appears once the chest has actually been opened. A locked button
    // sitting there from the first launch would give away that there is
    // something in the Jory run to find.
    if (GameState.chestOpened) {
      const inv = new MenuButton(this, cx, 738, 'INVENTORY', {
        scale: 2,
        minWidth: 240,
        color: 0xe0559a,
        onPick: () => this.openInventory(),
      });
      inv.setAlpha(0);
      const fade = { a: 0 };
      this.tweens.add({
        targets: fade,
        a: 1,
        duration: 500,
        delay: 700,
        onUpdate: () => inv.setAlpha(fade.a),
        onComplete: () => inv.setAlpha(1),
      });
    }

    // The one place sound can be turned off. It is remembered across sessions,
    // and it is on the title screen rather than buried in the pause menu
    // because a game that starts making noise wants an obvious way to stop.
    new SoundToggle(this, GAME_W - 30, 34);

    // Keyboard players should not have to reach for the mouse.
    this.input.keyboard.once('keydown-SPACE', () => this.start());
    this.input.keyboard.once('keydown-ENTER', () => this.start());

    // The now-playing strip, kept clear of the sound toggle in the corner.
    this.player = new MiniPlayer(this, 208, 34, { width: 372 });

    // Whichever song the player last parked the strip on.
    audio.music(audio.menuTrack);
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  start() {
    if (this.leaving) return;
    this.leaving = true;
    audio.play('uiConfirm');
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Customize'));
  }

  // The meadow on its own, with no story running over the top of it.
  openGarden() {
    if (this.leaving) return;
    this.leaving = true;
    audio.play('uiConfirm');
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Garden'));
  }

  // Same screen the chest opens onto, told it arrived from the menu so it
  // offers a way back instead of a way to play again.
  openInventory() {
    if (this.leaving) return;
    this.leaving = true;
    audio.play('uiConfirm');
    this.cameras.main.fadeOut(280, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () =>
      this.scene.start('Book', { from: 'menu' }),
    );
  }
}

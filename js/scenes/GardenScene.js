import { JoryIntroScene, JI_FX, JI_VIEW } from './JoryIntroScene.js';
import { PixelText } from '../gfx/PixelText.js';
import { audio } from '../systems/AudioManager.js';
import { VolumeSlider } from '../ui/VolumeSlider.js';
import { MusicPicker } from '../ui/MusicPicker.js';

// How often they kiss when nobody is telling a story.
const KISS_EVERY_MS = 30000;
// Long enough after the fade-in that the meadow gets to be the first thing you
// notice, short enough that you do not sit there wondering if anything happens.
const FIRST_KISS_MS = 4000;

// The same meadow as the "I love you Jory" opening with the script taken out:
// the picnic, the pond, the cats, the weather and the two of them, and nothing
// that asks anything of you. Everything on screen is built by JoryIntroScene —
// this only decides what happens once it is standing.
export class GardenScene extends JoryIntroScene {
  constructor() {
    super('Garden');
  }

  // Deliberately does not touch GameState. The Jory opening sets the difficulty
  // because a run follows it; nothing follows this, and a free-roam garden that
  // quietly rewrote the save would be a nasty surprise.
  setupMode() {}

  // Same place the story puts its skip hint, and dimmer — there is no hurry to
  // leave, so it should sit quietly at the bottom of the meadow.
  //
  // The two controls are the only interface the garden has. The camera is
  // zoomed, so "the corners of the screen" are the corners of JI_VIEW rather
  // than of the canvas.
  buildOverlay() {
    this.backHint = new PixelText(this, JI_FX, JI_VIEW.bottom - 24, 'TAP TO GO BACK', {
      scale: 1,
      color: 0xffffff,
    });
    this.backHint.setAlpha(0.45).setDepth(2000);

    this.volumeUI = new VolumeSlider(this, JI_VIEW.left + 12, JI_VIEW.top + 26);
    this.picker = new MusicPicker(this, JI_VIEW.right - 34, JI_VIEW.top + 26);

    // `currentlyOver` is what keeps the controls usable: without it every tap
    // on the slider or the song list would also be a tap on the meadow, and
    // the meadow's job is to leave.
    this.input.on('pointerdown', (pointer, over) => {
      if (over.length) return;
      // An open list eats the first tap outside it, so dismissing the menu
      // never doubles as walking out of the garden.
      if (this.picker?.isOpen) {
        this.picker.close();
        return;
      }
      this.finish();
    });
    this.input.keyboard.once('keydown-ESC', () => this.finish());
    this.input.keyboard.once('keydown-SPACE', () => this.finish());
    this.input.keyboard.once('keydown-ENTER', () => this.finish());
  }

  // One kiss shortly after arriving, then every thirty seconds. The loop is
  // started by the first one rather than run alongside it, so the gap between
  // the first and second is a full interval like every gap after it.
  begin() {
    this.time.delayedCall(FIRST_KISS_MS, () => {
      this.playKiss();
      this.kissLoop = this.time.addEvent({
        delay: KISS_EVERY_MS,
        loop: true,
        callback: () => this.playKiss(),
      });
    });
  }

  // No director and no HUD to shut down here, and nothing to hand off to —
  // this goes back where it came from.
  finish() {
    if (this.done) return;
    this.done = true;
    this.kissLoop?.remove();
    this.picker?.destroy();
    this.volumeUI?.destroy();
    audio.play('uiBack');
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Menu'));
  }
}

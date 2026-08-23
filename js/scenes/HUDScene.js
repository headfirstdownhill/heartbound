import {
  GAME_W,
  GAME_H,
  HUD_H,
  PLAYER_MAX_HP,
  EV_HEALTH_CHANGED,
  EV_TIMER_EXPIRED,
  EV_WAVE_CHANGED,
} from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { runTimer } from '../core/Timer.js';
import { input } from '../core/InputController.js';
import { PixelText } from '../gfx/PixelText.js';
import { VirtualJoystick } from '../ui/VirtualJoystick.js';
import { TouchButton } from '../ui/TouchButton.js';
import { MenuButton, SoundToggle } from '../ui/MenuWidgets.js';
import { audio } from '../systems/AudioManager.js';

// Every scene the pause button can be covering. The HUD only runs alongside one
// of these, and it needs to know which so it can freeze it.
const PLAY_SCENES = ['Level1', 'Level2', 'Level3', 'Return', 'JoryLevel'];

// Runs in parallel with whichever level is active and is never restarted, so the
// countdown cannot be reset by walking through a door.
export class HUDScene extends Phaser.Scene {
  constructor() {
    super('HUD');
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, HUD_H, 0x120f1c, 0.94).setOrigin(0, 0).setDepth(880);
    // Two rules under the bar rather than one: a lit hairline over a soft glow,
    // so the strip reads as a lip the play area sits below.
    this.add.rectangle(0, HUD_H - 2, GAME_W, 2, 0x6b5a8a).setOrigin(0, 0).setDepth(881);
    this.add
      .image(GAME_W / 2, HUD_H, 'fx_glow')
      .setTint(0x8f6bb0)
      .setAlpha(0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(879)
      .setScale(5, 0.4);

    // The Jory run has no clock — the top right carries the wave count instead,
    // and the key he gave her sits beside the hearts.
    this.isJory = GameState.difficulty === 'jory';

    if (this.isJory) {
      this.waveLabel = new PixelText(this, GAME_W - 16, 28, 'WAVE 1', {
        scale: 2,
        color: 0xffe08a,
        align: 'right',
      });
      this.waveLabel.setDepth(900);
      this.onWave = (n, total) => this.setWave(n, total);
      this.game.events.on(EV_WAVE_CHANGED, this.onWave);
      // Beside the hearts, not beside the wave label — the label grows leftwards
      // and would sit on top of it.
      this.keyIcon = this.add.image(124, 28, 'key').setDepth(900).setScale(1.1);
    } else {
      this.clock = new PixelText(this, GAME_W - 16, 28, runTimer.format(), {
        scale: 3,
        color: 0xffffff,
        align: 'right',
      });
      this.clock.setDepth(900);
    }

    // Reset on every launch: the scene instance is reused, so a stale value
    // from the previous run would swallow the first tick of this one.
    this.lastTickSecond = null;

    this.hearts = [];
    for (let i = 0; i < PLAYER_MAX_HP; i++) {
      this.hearts.push(this.add.image(26 + i * 30, 28, 'heart_small').setDepth(900).setScale(1.2));
    }

    // Low enough to clear the doorway at the top of the arena and the thumb
    // controls at the bottom.
    this.hint = new PixelText(this, GAME_W / 2, GAME_H - 208, '', { scale: 2, color: 0xffe08a });
    this.hint.setDepth(900).setAlpha(0);

    if (input.isTouch) {
      this.stick = new VirtualJoystick(this, 88, GAME_H - 110);
      this.attackBtn = new TouchButton(this, GAME_W - 78, GAME_H - 110, 'ui_attack');
      input.attachTouchUI(this.stick, this.attackBtn);
    } else {
      input.bindDesktopClick(this);
    }

    this.buildPauseButton();

    this.game.events.on(EV_HEALTH_CHANGED, this.refreshHearts, this);
    this.refreshHearts(GameState.playerHp);

    // A level scene can create before this one and ask for a hint immediately.
    if (this.pendingHint) {
      this.showHint(this.pendingHint.text, this.pendingHint.ms);
      this.pendingHint = null;
    }

    this.events.on('shutdown', () => {
      this.game.events.off(EV_HEALTH_CHANGED, this.refreshHearts, this);
      if (this.onWave) this.game.events.off(EV_WAVE_CHANGED, this.onWave);
      input.detachTouchUI();
    });
  }

  // Middle of the HUD strip. The hearts own the left and the clock or the wave
  // count owns the right, and this is the one part of the bar that is empty in
  // both modes. It also keeps it out of the play area, where a stray thumb
  // during a fight would find it.
  buildPauseButton() {
    this.paused = false;
    this.pauseView = [];

    this.pauseBtn = this.add
      .image(GAME_W / 2, HUD_H / 2, 'ui_pause')
      .setDepth(900)
      .setAlpha(0.72)
      .setInteractive({ useHandCursor: true });
    this.pauseBtn.on('pointerover', () => this.pauseBtn.setAlpha(1));
    this.pauseBtn.on('pointerout', () => this.pauseBtn.setAlpha(0.72));
    this.pauseBtn.on('pointerup', () => {
      audio.play('uiClick');
      this.pauseGame();
    });

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
  }

  // Only finds a level that is actually running. Once one is paused Phaser no
  // longer reports it as active, which is why pauseGame holds on to it rather
  // than looking it up again on the way out.
  activeLevel() {
    return PLAY_SCENES.map((k) => this.scene.get(k)).find((s) => s && s.scene.isActive());
  }

  togglePause() {
    if (this.paused) this.resumeGame();
    else this.pauseGame();
  }

  pauseGame() {
    const level = this.activeLevel();
    // Nothing to freeze between rooms, and pausing then would strand the HUD
    // over a scene that is about to start anyway.
    if (this.paused || !level) return;
    this.paused = true;
    this.pausedLevel = level;

    runTimer.pause();
    level.scene.pause();
    audio.holdMusic(0.25);
    this.setControlsEnabled(false);
    this.pauseBtn.setVisible(false);

    const cx = GAME_W / 2;
    const keep = (o) => {
      this.pauseView.push(o);
      return o;
    };

    keep(this.add.rectangle(0, 0, GAME_W, GAME_H, 0x0d0b14, 0.8).setOrigin(0, 0).setDepth(1400));
    keep(new PixelText(this, cx, 250, 'PAUSED', { scale: 4, color: 0xffe08a }).setDepth(1401));
    keep(
      new MenuButton(this, cx, 390, 'RESUME', {
        scale: 3,
        minWidth: 300,
        depth: 1402,
        color: 0x7ed957,
        onPick: () => this.resumeGame(),
      }),
    );
    keep(
      new MenuButton(this, cx, 480, 'MAIN MENU', {
        scale: 2,
        minWidth: 300,
        depth: 1402,
        onPick: () => this.quitToMenu(),
      }),
    );
    // Reachable mid-run without quitting out to the title screen for it.
    keep(new SoundToggle(this, cx, 570, { depth: 1402, size: 30 }));
  }

  resumeGame() {
    if (!this.paused) return;
    this.paused = false;

    this.pauseView.forEach((o) => o.destroy());
    this.pauseView = [];
    this.pauseBtn.setVisible(true).setAlpha(0.72);
    this.setControlsEnabled(true);

    runTimer.resume();
    audio.releaseMusic();
    this.pausedLevel?.scene.resume();
    this.pausedLevel = null;
  }

  quitToMenu() {
    this.paused = false;
    this.pauseView.forEach((o) => o.destroy());
    this.pauseView = [];
    runTimer.stop();
    // The level is only paused, so it has to be stopped by hand — starting the
    // menu from here shuts down the HUD but nothing else.
    this.pausedLevel?.scene.stop();
    this.pausedLevel = null;
    this.scene.start('Menu');
  }

  // Left on screen but deaf, so a thumb resting on the stick cannot steer while
  // paused and a tap on the sword cannot queue a swing for the moment play
  // resumes.
  setControlsEnabled(on) {
    if (this.stick) this.stick.zone.input.enabled = on;
    if (this.attackBtn) this.attackBtn.image.input.enabled = on;
  }

  setWave(n, total) {
    if (!this.waveLabel) return;
    this.waveLabel.setText(typeof n === 'number' ? `WAVE ${n}/${total}` : String(n));
    this.waveLabel.setTint(typeof n === 'number' ? 0xffe08a : 0xff4d6d);
  }

  showHint(text, ms = 2200) {
    if (!this.hint) {
      this.pendingHint = { text, ms };
      return;
    }
    this.hint.setText(text).setAlpha(1);
    this.tweens.killTweensOf(this.hint.container);
    // Drops in from slightly above and settles. A hint that simply appears is
    // easy to miss mid-fight; one that moves is not.
    this.hint.container.setScale(1.3);
    this.tweens.add({
      targets: this.hint.container,
      scale: 1,
      duration: 260,
      ease: 'Back.out',
    });
    this.tweens.add({
      targets: this.hint.container,
      alpha: 0,
      delay: ms,
      duration: 500,
    });
  }

  refreshHearts(hp) {
    this.hearts.forEach((h, i) => {
      const wasFull = h.texture.key === 'heart_small';
      const nowFull = i < hp;
      h.setTexture(nowFull ? 'heart_small' : 'heart_empty');
      if (wasFull === nowFull) return;
      // The heart that changed jumps. Losing one snaps out and shrinks back;
      // gaining one pops in. Either way the eye is pulled to which one moved.
      this.tweens.killTweensOf(h);
      h.setScale(nowFull ? 0.5 : 2);
      this.tweens.add({ targets: h, scale: 1.2, duration: 280, ease: 'Back.out' });
    });
  }

  update() {
    // No clock in the Jory run, so nothing to tick and nothing to expire.
    if (this.isJory) return;
    this.clock.setText(runTimer.format());
    const left = runTimer.getRemainingMs();
    // Turn the clock red as the last minute burns down.
    this.clock.setTint(left < 60000 ? (Math.floor(this.time.now / 250) % 2 ? 0xff4d6d : 0xffffff) : 0xffffff);

    // Audible countdown over the last ten seconds, one tick per second. Driven
    // off the clock's own value rather than a timer, so it cannot drift out of
    // step with the number on screen or keep ticking through a pause.
    const secs = Math.ceil(left / 1000);
    if (left > 0 && secs <= 10 && secs !== this.lastTickSecond) {
      this.lastTickSecond = secs;
      audio.play('tick');
      this.clock.container.setScale(1.25);
      this.tweens.add({ targets: this.clock.container, scale: 1, duration: 220, ease: 'Back.out' });
    }

    if (runTimer.tick()) this.game.events.emit(EV_TIMER_EXPIRED);
  }
}

import { GAME_W, GAME_H } from './core/Constants.js';
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CustomizeScene } from './scenes/CustomizeScene.js';
import { NameScene } from './scenes/NameScene.js';
import { DifficultyScene } from './scenes/DifficultyScene.js';
import { IntroScene } from './scenes/IntroScene.js';
import { JoryIntroScene } from './scenes/JoryIntroScene.js';
import { JoryLevelScene } from './scenes/JoryLevelScene.js';
import { GardenScene } from './scenes/GardenScene.js';
import { BookScene } from './scenes/BookScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { Level1Scene, Level2Scene, Level3Scene, ReturnScene } from './scenes/levels.js';
import { WinScene, GameOverScene } from './scenes/endings.js';
import { makePostFXClass, POSTFX_KEY } from './gfx/PostFX.js';
import { audio } from './systems/AudioManager.js';

// Built here rather than at module scope: a browser that fell back to the
// canvas renderer has no pipeline class to extend, and this returns null there
// instead of throwing on the way in.
const PostFXClass = makePostFXClass();

const config = {
  type: Phaser.AUTO,
  parent: 'game-root',
  backgroundColor: '#0d0b14',
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  input: { activePointers: 3 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  scene: [
    BootScene,
    MenuScene,
    CustomizeScene,
    NameScene,
    DifficultyScene,
    IntroScene,
    JoryIntroScene,
    JoryLevelScene,
    GardenScene,
    BookScene,
    Level1Scene,
    Level2Scene,
    Level3Scene,
    ReturnScene,
    WinScene,
    GameOverScene,
    HUDScene,
  ],
};

if (PostFXClass) config.pipeline = { [POSTFX_KEY]: PostFXClass };

window.game = new Phaser.Game(config);
// Alongside `game`, for the same reason: the single-file build has no module
// boundary to reach through, and auditioning a sound or a track from the
// console is how the mix gets tuned. `audio.play('slam')`, `audio.music('boss')`.
window.audio = audio;

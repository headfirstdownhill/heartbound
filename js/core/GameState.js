import { PLAYER_MAX_HP, RUN_DURATION_MS } from './Constants.js';
import { DEFAULT_LOOK } from '../data/lookData.js';

const SAVE_KEY = 'heartbound.unlocks';

// Plain module singleton: one page, one game instance, and every scene needs the
// same handful of facts to survive scene restarts.
export const GameState = {
  hasSword: false,
  heartRecovered: false,
  currentLevel: 1,
  playerHp: PLAYER_MAX_HP,
  seenIntro: false,

  // Chosen once in the menus and kept for the whole session, so "play again"
  // replays the run you picked rather than dumping you back at the title.
  playerName: '',
  difficulty: 'hard',
  hasKey: false,

  // How she looks, chosen in the customiser and kept for the whole session.
  look: { ...DEFAULT_LOOK },

  // The one thing that outlives the session: whether the chest has ever been
  // opened. It is what puts the inventory on the title screen, so it has to
  // survive the tab closing — otherwise she would have to win the book back
  // every time she wanted to read it, which is the whole thing the inventory
  // exists to avoid.
  chestOpened: false,

  loadUnlocks() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      this.chestOpened = !!saved.chestOpened;
      // Carried too, so the inventory can still greet her by name in a session
      // where she has not typed it in.
      if (typeof saved.playerName === 'string') this.playerName = saved.playerName;
    } catch {
      // Storage is refused outright in private windows and on some file://
      // setups. The game plays fine without it; only the inventory is lost, so
      // this must never be allowed to take the boot down with it.
    }
  },

  saveUnlocks() {
    try {
      window.localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ chestOpened: this.chestOpened, playerName: this.playerName }),
      );
    } catch {
      // As above.
    }
  },

  // Deliberately leaves playerName and difficulty alone — this resets a run,
  // not the session.
  reset() {
    this.hasSword = false;
    this.heartRecovered = false;
    this.currentLevel = 1;
    this.playerHp = PLAYER_MAX_HP;
  },

  get isEasy() {
    return this.difficulty === 'easy';
  },
};

export const RUN_TIME = RUN_DURATION_MS;

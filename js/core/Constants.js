export const GAME_W = 480;
export const GAME_H = 800;

export const TILE = 32;
export const ROOM_COLS = 11;
export const ROOM_ROWS = 18;
export const ROOM_X = 0;
export const ROOM_Y = 0;
// Reserved strip at the top of the screen; the play camera starts below it.
export const HUD_H = 56;

export const PX = 2;

export const TILE_FLOOR = 0;
export const TILE_WALL = 1;
export const TILE_GRASS = 2;
export const TILE_PATH = 3;

export const DIR_DOWN = 'down';
export const DIR_UP = 'up';
export const DIR_SIDE = 'side';

export const EV_BLOB_DIED = 'blob-died';
export const EV_TIMER_EXPIRED = 'timer-expired';
export const EV_TIMER_TICK = 'timer-tick';
export const EV_HEALTH_CHANGED = 'health-changed';
export const EV_SWORD_TAKEN = 'sword-taken';
export const EV_HEART_TAKEN = 'heart-taken';
export const EV_WAVE_CHANGED = 'wave-changed';

export const RUN_DURATION_MS = 8 * 60 * 1000;
export const DEATH_TIME_PENALTY_MS = 30 * 1000;

export const PLAYER_SPEED = 155;
export const PLAYER_MAX_HP = 3;
export const PLAYER_IFRAME_MS = 900;
export const ATTACK_COOLDOWN_MS = 330;
export const ATTACK_ACTIVE_MS = 160;
export const SWORD_DAMAGE = 12;
export const FIST_DAMAGE = 3;

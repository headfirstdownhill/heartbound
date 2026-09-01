// Nearly every sound in the game is synthesised at runtime, for the same reason
// there are no image files: the game stays one HTML document you can
// double-click or upload anywhere. The exceptions are the handful of recordings
// in `audio/` next to it — three songs and the page turn.
//
// Three parts. `play()` is a table of one-shot effects built out of oscillators
// and filtered noise, with `FILE_SFX` overriding individual entries where a
// recording sounds better than anything worth synthesising. `music()` runs a
// small step sequencer over the declarative data in `TRACKS`, or hands off to
// `FILE_TRACKS` when the piece asked for is a recording.
//
// Everything recorded plays on plain <audio> elements rather than through the
// graph, because `fetch` and `createMediaElementSource` both need an origin and
// this has to survive file:// on a desktop and file:///android_asset in the apk.
// The cost is that mute and the music ducking are applied to elements by hand.

const AUDIO_SAVE_KEY = 'heartbound.audio';

// Lookahead scheduling. A WebAudio note started from a setInterval callback
// lands wherever the timer happened to fire; a note *scheduled* a tenth of a
// second early lands exactly on the beat regardless of how late the timer was.
const SCHED_TICK_MS = 25;
const SCHED_AHEAD_S = 0.12;

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Chord shapes as semitone offsets from the root.
const CHORD_SHAPES = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dim: [0, 3, 6],
  min9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
};

function chordNotes(chord) {
  const shape = CHORD_SHAPES[chord.type] ?? CHORD_SHAPES.maj;
  return shape.map((s) => chord.root + s);
}

// Melody lines are generated rather than written out, so a four-bar loop does
// not audibly repeat every four bars. Seeded, so a track sounds the same each
// time you hear it — a piece that re-rolled itself on every scene change would
// stop being that room's music.
function seededRandom(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Track data
// ---------------------------------------------------------------------------
//
// `prog` is one chord per bar. `voices` names which instruments play and the
// 16-step patterns they play on: 1 is a hit, 0 is a rest. `melody` turns on the
// generated lead line, picking its notes out of whichever chord is sounding.

const TRACKS = {
  // The dungeon rooms. Minor, sparse, a lot of space between the notes so the
  // room itself does the talking.
  dungeon: {
    bpm: 96,
    seed: 8802,
    gain: 0.8,
    prog: [
      { root: 45, type: 'min' },
      { root: 45, type: 'min' },
      { root: 41, type: 'maj' },
      { root: 43, type: 'min7' },
    ],
    voices: {
      pad: { gain: 0.16, wave: 'sawtooth', attack: 1.1, release: 1.9, cutoff: 620 },
      bass: { gain: 0.26, pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0], octave: -24 },
      hat: { gain: 0.05, pattern: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0] },
      kick: { gain: 0.32, pattern: [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0] },
    },
    melody: { gain: 0.08, octave: 12, density: 0.2, wave: 'triangle' },
  },

  // Level 3, once the thing holding his heart is on screen. Same key as the
  // dungeon so the switch feels like the room turning rather than a new song.
  boss: {
    bpm: 138,
    seed: 3319,
    gain: 0.92,
    prog: [
      { root: 45, type: 'min' },
      { root: 44, type: 'dim' },
      { root: 43, type: 'min' },
      { root: 40, type: 'dom7' },
    ],
    voices: {
      pad: { gain: 0.13, wave: 'sawtooth', attack: 0.5, release: 1.1, cutoff: 900 },
      bass: { gain: 0.3, pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1], octave: -24 },
      arp: { gain: 0.12, pattern: [1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1], octave: 12 },
      hat: { gain: 0.07, pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1] },
      kick: { gain: 0.36, pattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0] },
      snare: { gain: 0.2, pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0] },
    },
    melody: { gain: 0.1, octave: 12, density: 0.42, wave: 'square' },
  },

  // The run back. Everything is won except the distance — pure forward motion.
  chase: {
    bpm: 128,
    seed: 6644,
    gain: 0.85,
    prog: [
      { root: 55, type: 'maj' },
      { root: 57, type: 'min7' },
      { root: 53, type: 'maj' },
      { root: 55, type: 'sus4' },
    ],
    voices: {
      pad: { gain: 0.11, wave: 'triangle', attack: 0.6, release: 1.2 },
      bass: { gain: 0.26, pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], octave: -24 },
      arp: { gain: 0.12, pattern: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0], octave: 12 },
      hat: { gain: 0.07, pattern: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1] },
      kick: { gain: 0.34, pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0] },
    },
    melody: { gain: 0.11, octave: 12, density: 0.4, wave: 'square' },
  },

  // The rose meadow. No percussion at all — nothing is chasing anyone yet.
  meadow: {
    bpm: 68,
    seed: 2211,
    gain: 0.9,
    prog: [
      { root: 52, type: 'maj9' },
      { root: 57, type: 'min7' },
      { root: 50, type: 'maj7' },
      { root: 54, type: 'sus2' },
    ],
    voices: {
      pad: { gain: 0.2, wave: 'triangle', attack: 1.8, release: 2.6 },
      bass: { gain: 0.16, pattern: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], octave: -24 },
      bell: { gain: 0.17, pattern: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0], octave: 12 },
    },
    melody: { gain: 0.13, octave: 12, density: 0.3, wave: 'triangle' },
  },

  // The arena. Same shape as the boss track but wider and meaner.
  arena: {
    bpm: 144,
    seed: 9128,
    gain: 0.95,
    prog: [
      { root: 45, type: 'min' },
      { root: 48, type: 'maj' },
      { root: 43, type: 'min7' },
      { root: 41, type: 'maj' },
    ],
    voices: {
      pad: { gain: 0.14, wave: 'sawtooth', attack: 0.4, release: 1.0, cutoff: 1100 },
      bass: { gain: 0.32, pattern: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], octave: -24 },
      arp: { gain: 0.13, pattern: [1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1], octave: 12 },
      hat: { gain: 0.07, pattern: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
      kick: { gain: 0.36, pattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0] },
      snare: { gain: 0.22, pattern: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0] },
    },
    melody: { gain: 0.11, octave: 12, density: 0.46, wave: 'square' },
  },

  // She made it. Bright, major, and the only track with no minor chord in it.
  victory: {
    bpm: 112,
    seed: 4040,
    gain: 0.95,
    prog: [
      { root: 53, type: 'maj' },
      { root: 60, type: 'maj' },
      { root: 55, type: 'maj' },
      { root: 57, type: 'min7' },
    ],
    voices: {
      pad: { gain: 0.17, wave: 'triangle', attack: 0.5, release: 1.4 },
      bass: { gain: 0.24, pattern: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], octave: -24 },
      bell: { gain: 0.19, pattern: [1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1], octave: 12 },
      kick: { gain: 0.26, pattern: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0] },
    },
    melody: { gain: 0.14, octave: 12, density: 0.44, wave: 'triangle' },
  },

  // She didn't. Very slow, and no pulse of any kind under it.
  sorrow: {
    bpm: 56,
    seed: 7007,
    gain: 0.8,
    prog: [
      { root: 45, type: 'min' },
      { root: 41, type: 'maj7' },
      { root: 43, type: 'min7' },
      { root: 40, type: 'min' },
    ],
    voices: {
      pad: { gain: 0.2, wave: 'triangle', attack: 2.2, release: 3.0 },
      bass: { gain: 0.15, pattern: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], octave: -24 },
    },
    melody: { gain: 0.1, octave: 0, density: 0.18, wave: 'triangle' },
  },
};

// Recorded music, as opposed to the synthesised pieces above. These are real
// files on disk, so they live outside the Web Audio graph on plain <audio>
// elements — `fetch` and `createMediaElementSource` both need an origin, and
// this game is meant to survive being double-clicked off a desktop and being
// loaded from file:///android_asset inside the APK. The cost of that choice is
// that mute, ducking and the pause hold have to be mirrored onto the element
// by hand; `applyFileVolume` is where that happens.
// Where the recordings live, and in what format. Both lines are rewritten by
// `build-web-zip.ps1` when it packages a hosted build, and left alone otherwise
// — so opening `heartbound.html` locally and running inside the apk both read
// the full-quality masters sitting in `audio/`.
//
// AUDIO_BASE can be an absolute URL, which is how the game gets full-quality
// audio onto a host with a small size cap: the files go somewhere without one
// (GitHub Pages), and only the html is uploaded. Cross-origin works with no CORS
// headers because these play on <audio> elements rather than through the Web
// Audio graph — the same choice that keeps file:// working.
const AUDIO_BASE = 'audio/';
const AUDIO_EXT = 'mp3';

const FILE_TRACKS = {
  cornfield: {
    src: `${AUDIO_BASE}a-cornfield.${AUDIO_EXT}`,
    title: 'A CORNFIELD',
    gain: 0.62, // encoded a good deal hotter than the other one
  },
  flowers: {
    src: `${AUDIO_BASE}do-flowers-bloom-where-you-walk.${AUDIO_EXT}`,
    title: 'DO FLOWERS BLOOM WHERE YOU WALK?',
    gain: 0.85,
  },
  loveletter: {
    src: `${AUDIO_BASE}love-letter.${AUDIO_EXT}`,
    title: 'LOVE LETTER',
    gain: 0.68, // encoded hot like the cornfield one
  },
};

// Recorded one-shots. Same reasoning as the tracks above — element playback
// rather than decoded buffers, so it survives file:// — but these are small
// enough to load up front, and each gets a few voices so turning pages quickly
// overlaps instead of cutting itself off. A name here wins over the
// synthesised effect of the same name, which stays as the fallback.
const FILE_SFX = {
  page: { src: `${AUDIO_BASE}book-page-turning-effect.${AUDIO_EXT}`, gain: 0.9, voices: 3 },
};

// The songs offered to the player, in order. Drives both the title screen's
// strip and the garden's dropdown, so a track added here shows up in both. A
// track can still exist in FILE_TRACKS without being on this list — that is how
// a piece stays tied to one scene instead of becoming a choice.
export const PLAYLIST = ['flowers', 'cornfield', 'loveletter'];

export function trackTitle(name) {
  return FILE_TRACKS[name]?.title ?? '';
}

// Music sits at half gain under the master, matching the synth bus so a
// recorded track and a generated one sound like they belong to one mix.
const MUSIC_LEVEL = 0.5;
const MASTER_LEVEL = 0.85;
const SFX_LEVEL = 0.9;

// ---------------------------------------------------------------------------

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    // Master level as a fraction, on top of the mute flag. The garden has a
    // slider for it; everywhere else it just sits where it was left.
    this.volume = 1;
    this.trackName = null;
    this.track = null;
    this.step = 0;
    this.nextNoteTime = 0;
    this.timer = null;
    this.fadeTimer = null;
    this.pendingTrack = null;
    // Recorded-track state. `els` caches one element per track so flipping
    // between songs on the menu resumes instantly instead of re-fetching.
    this.els = {};
    this.el = null;
    this.fileTrack = null;
    this.fileName = null;
    this.fileRamp = null;
    this.duckFactor = 1;
    this.duckHold = null;
    // Which recorded track the mini player is parked on, remembered between
    // sessions the same way the mute flag is.
    this.menuTrack = PLAYLIST[0];
    // Recorded one-shots. Built now rather than on first use: they are small,
    // and the first page turn should not be the one that waits for the fetch.
    this.sfxVoices = {};
    this.sfxTurn = {};
    this.sfxBroken = {};
    this.buildFileSfx();
    this.rng = seededRandom(1);
    this.lastMelodyNote = 0;
    this.loadPrefs();
  }

  loadPrefs() {
    try {
      const raw = window.localStorage.getItem(AUDIO_SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      this.muted = !!saved.muted;
      // A track that has since been renamed or dropped must not strand the
      // player on a song that no longer exists.
      if (PLAYLIST.includes(saved.menuTrack)) this.menuTrack = saved.menuTrack;
      if (typeof saved.volume === 'number') this.volume = Math.max(0, Math.min(1, saved.volume));
    } catch {
      // Storage is refused in private windows. Sound simply defaults to on.
    }
  }

  savePrefs() {
    try {
      window.localStorage.setItem(
        AUDIO_SAVE_KEY,
        JSON.stringify({ muted: this.muted, menuTrack: this.menuTrack, volume: this.volume }),
      );
    } catch {
      // As above.
    }
  }

  // Browsers will not let a page make noise before it has been touched, so the
  // graph is not built until the first real gesture. Every call after the first
  // is a no-op, which is what lets this be wired to every input in the game.
  // The queued track is started on a zero timeout rather than right here, so
  // anything else responding to the same gesture gets to go first. The tap that
  // unlocks audio is very often also the tap on the song list, and starting the
  // remembered track immediately means it plays for a tenth of a second and is
  // then cross-faded out by the song the tap actually chose — two pieces of
  // music briefly on top of each other, which is exactly what it sounds like.
  replayPending() {
    if (!this.pendingTrack) return;
    const name = this.pendingTrack;
    this.pendingTrack = null;
    window.setTimeout(() => {
      // Something started in the meantime; that choice was more deliberate
      // than this one, so leave it alone.
      if (this.fileName || this.trackName || this.pendingTrack) return;
      this.music(name);
    }, 0);
  }

  // Any state that is not 'running' is a stopped clock, and there is more than
  // one of them.
  //
  // 'suspended' is the one every browser starts in before a gesture. Safari has
  // a second, 'interrupted', which it uses when the audio session is taken
  // away — the screen locking, a call, another app, or an <audio> element
  // pausing and handing the session back. Only checking for 'suspended' left
  // that case stuck forever, and because everything except the three
  // recordings is synthesised, stuck means the whole game goes quiet: music and
  // every effect at once. The recordings kept playing, since they are on
  // elements outside this graph, so the sound appeared to come back by itself
  // the moment a scene asked for one.
  //
  // resume() rejects if it is called without a gesture behind it, which is not
  // a failure worth reporting — the next tap calls this again.
  resumeIfNeeded() {
    if (!this.ctx || this.ctx.state === 'running') return;
    // Retrying every scheduler tick would be a resume call every 25ms for as
    // long as the interruption lasts.
    const now = Date.now();
    if (now - (this.lastResumeTry ?? 0) < 500) return;
    this.lastResumeTry = now;
    this.ctx.resume?.().catch(() => {});
  }

  unlock() {
    if (this.ready) {
      this.resumeIfNeeded();
      // A recording whose autoplay was refused earlier gets another go now
      // that there has certainly been a gesture.
      this.replayPending();
      return;
    }
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return;
    try {
      this.ctx = new Ctor();
    } catch {
      return;
    }

    const ctx = this.ctx;
    // A limiter on the end so a nuke landing during a boss phase change cannot
    // clip: a dozen simultaneous voices is a normal moment in this game.
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -10;
    this.limiter.knee.value = 12;
    this.limiter.ratio.value = 8;
    this.limiter.attack.value = 0.004;
    this.limiter.release.value = 0.18;
    this.limiter.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = this.masterTarget();
    this.master.connect(this.limiter);

    // One shared plate rather than a tail per voice, so the whole mix sounds
    // like it is happening in the same room.
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.buildImpulse(1.9, 2.6);
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.5;
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.master);

    this.musicGain = ctx.createGain();
    this.musicGain.gain.value = MUSIC_LEVEL;
    this.musicGain.connect(this.master);

    this.sfxGain = ctx.createGain();
    this.sfxGain.gain.value = SFX_LEVEL;
    this.sfxGain.connect(this.master);

    this.ready = true;
    this.resumeIfNeeded();
    // A track asked for before the first tap is remembered and starts here.
    this.replayPending();
  }

  // Noise burst with an exponential tail: the cheapest convincing reverb there
  // is, and it costs one buffer instead of a downloaded impulse response.
  buildImpulse(seconds, decay) {
    const ctx = this.ctx;
    const rate = ctx.sampleRate;
    const len = Math.max(1, Math.floor(rate * seconds));
    const buf = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  // Mute and the volume fraction fold into one number, so both paths below
  // only ever have to set the master to whatever this says.
  masterTarget() {
    if (this.muted) return 0.0001;
    return Math.max(0.0001, MASTER_LEVEL * this.volume);
  }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    this.savePrefs();
    this.applyFileVolume();
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.masterTarget(), t, 0.05);
  }

  setMuted(on) {
    this.muted = !!on;
    this.savePrefs();
    // Recordings sit outside the graph, so the master gain below does not
    // reach them and they have to be silenced by hand.
    this.applyFileVolume();
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.masterTarget(), t, 0.05);
  }

  toggleMute() {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ---- synthesis primitives ----------------------------------------------

  // One oscillator through its own envelope, optionally filtered and pitch-bent.
  // Everything else in this file is a few of these stacked.
  voice(opts) {
    if (!this.ready || this.muted) return null;
    const {
      freq = 440,
      wave = 'sine',
      dur = 0.2,
      attack = 0.005,
      hold = 0,
      gain = 0.2,
      slideTo = null,
      slideTime = null,
      cutoff = null,
      cutoffTo = null,
      q = 1,
      detune = 0,
      send = 0,
      when = 0,
      bus = null,
      pan = 0,
    } = opts;

    const ctx = this.ctx;
    const t = when || ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, t);
    osc.detune.value = detune;
    if (slideTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + (slideTime ?? dur));
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    if (hold > 0) env.gain.setValueAtTime(Math.max(0.0002, gain), t + attack + hold);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + dur);

    let node = osc;
    if (cutoff !== null) {
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.Q.value = q;
      filt.frequency.setValueAtTime(cutoff, t);
      if (cutoffTo !== null) {
        filt.frequency.exponentialRampToValueAtTime(Math.max(40, cutoffTo), t + attack + hold + dur);
      }
      node.connect(filt);
      node = filt;
    }
    node.connect(env);

    let out = env;
    if (pan !== 0 && ctx.createStereoPanner) {
      const panner = ctx.createStereoPanner();
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      env.connect(panner);
      out = panner;
    }
    out.connect(bus ?? this.sfxGain);
    if (send > 0) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = send;
      out.connect(sendGain);
      sendGain.connect(this.reverb);
    }

    osc.start(t);
    osc.stop(t + attack + hold + dur + 0.05);
    return osc;
  }

  // Filtered noise. Impacts, hits, whooshes and every drum that is not the kick.
  noise(opts) {
    if (!this.ready || this.muted) return null;
    const {
      dur = 0.2,
      gain = 0.2,
      attack = 0.002,
      type = 'bandpass',
      cutoff = 1200,
      cutoffTo = null,
      q = 1,
      send = 0,
      when = 0,
      bus = null,
    } = opts;

    const ctx = this.ctx;
    const t = when || ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * (dur + attack + 0.02)));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filt = ctx.createBiquadFilter();
    filt.type = type;
    filt.Q.value = q;
    filt.frequency.setValueAtTime(cutoff, t);
    if (cutoffTo !== null) {
      filt.frequency.exponentialRampToValueAtTime(Math.max(40, cutoffTo), t + dur);
    }

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + dur);

    src.connect(filt);
    filt.connect(env);
    env.connect(bus ?? this.sfxGain);
    if (send > 0) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = send;
      env.connect(sendGain);
      sendGain.connect(this.reverb);
    }

    src.start(t);
    src.stop(t + attack + dur + 0.05);
    return src;
  }

  // ---- one-shot effects ---------------------------------------------------

  play(name, opts = {}) {
    if (!this.ready || this.muted) return;
    // The sequencer's watchdog only ticks while there is music. A screen with
    // effects and no track — the menus, or a piece that has faded out — would
    // otherwise stay mute until something started singing.
    this.resumeIfNeeded();
    // A recording wins over the synthesised effect of the same name, and the
    // synth stays as the fallback for when the file could not be loaded.
    if (FILE_SFX[name] && this.playFileSfx(name)) return;
    const fn = this.sfx[name];
    if (fn) fn.call(this, opts);
  }

  get sfx() {
    if (!this._sfx) this._sfx = buildSfxTable();
    return this._sfx;
  }

  // Pull the music down under a big moment so the effect has room, then let it
  // back up. Used by the boss phase changes, the nuke and the chest.
  duck(amount = 0.35, ms = 700) {
    // A recording ducks by moving its own volume, since it has no gain node.
    // Down quickly, hold for the whole window, then back up — the same shape
    // the sequencer's gain ramp makes.
    if (this.el) {
      if (this.duckHold) window.clearTimeout(this.duckHold);
      this.duckFactor = amount;
      this.rampFile(this.fileVolume(), 120, () => {
        this.duckHold = window.setTimeout(() => {
          this.duckHold = null;
          this.duckFactor = 1;
          if (this.el) this.rampFile(this.fileVolume(), 400);
        }, ms);
      });
    }
    if (!this.ready || !this.musicGain || !this.track) return;
    const level = MUSIC_LEVEL * (this.track.gain ?? 1);
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(level * amount, t, 0.03);
    g.setTargetAtTime(level, t + ms / 1000, 0.25);
  }

  // Duck with no recovery scheduled, for the pause screen. Silence behind a
  // pause menu reads as a crash, so the music is held down rather than stopped.
  holdMusic(level = 0.25) {
    if (this.el) {
      // A duck recovering underneath would undo the hold a moment later.
      if (this.duckHold) window.clearTimeout(this.duckHold);
      this.duckHold = null;
      this.duckFactor = level;
      this.rampFile(this.fileVolume(), 200);
    }
    if (!this.ready || !this.musicGain || !this.track) return;
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(MUSIC_LEVEL * (this.track.gain ?? 1) * level, t, 0.06);
  }

  releaseMusic() {
    if (this.el) {
      if (this.duckHold) window.clearTimeout(this.duckHold);
      this.duckHold = null;
      this.duckFactor = 1;
      this.rampFile(this.fileVolume(), 300);
    }
    if (!this.ready || !this.musicGain || !this.track) return;
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(MUSIC_LEVEL * (this.track.gain ?? 1), t, 0.12);
  }

  // ---- recorded one-shots -------------------------------------------------

  buildFileSfx() {
    Object.entries(FILE_SFX).forEach(([name, def]) => {
      this.sfxVoices[name] = [];
      this.sfxTurn[name] = 0;
      for (let i = 0; i < (def.voices ?? 2); i++) {
        const el = new window.Audio();
        el.src = encodeURI(def.src);
        el.preload = 'auto';
        // One bad path should cost the recording, not the sound: `play` falls
        // back to the synthesised version of the same name.
        el.addEventListener('error', () => {
          this.sfxBroken[name] = true;
        });
        this.sfxVoices[name].push(el);
      }
    });
  }

  // Round-robin across the pool, preferring a voice that has finished, so
  // turning pages quickly layers instead of restarting one element.
  playFileSfx(name) {
    if (this.sfxBroken[name]) return false;
    const pool = this.sfxVoices[name];
    if (!pool || !pool.length) return false;

    let el = pool.find((v) => v.paused || v.ended);
    if (!el) {
      el = pool[this.sfxTurn[name] % pool.length];
      this.sfxTurn[name] += 1;
    }

    el.volume = Math.max(
      0,
      Math.min(1, SFX_LEVEL * (FILE_SFX[name].gain ?? 1) * MASTER_LEVEL * this.volume),
    );
    try {
      el.currentTime = 0;
    } catch {
      // Seeking before the file has any data throws; it will start at 0 anyway.
    }
    el.play()?.catch(() => {});
    return true;
  }

  // ---- recorded tracks ----------------------------------------------------

  // Elements are made once and kept. Creating one per play would re-fetch a
  // three-megabyte file every time the player flicked between songs.
  element(name) {
    if (this.els[name]) return this.els[name];
    const def = FILE_TRACKS[name];
    if (!def) return null;
    const el = new window.Audio();
    // The filenames have spaces in them, which a bare src attribute will not
    // survive on every host.
    el.src = encodeURI(def.src);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    this.els[name] = el;
    return el;
  }

  // Where the element gets everything the Web Audio graph would have given it
  // for free: master level, the mute flag and whatever duck is in force.
  fileVolume() {
    if (!this.fileTrack) return 0;
    if (this.muted) return 0;
    const v = MUSIC_LEVEL * (this.fileTrack.gain ?? 1) * this.duckFactor * MASTER_LEVEL * this.volume;
    return Math.max(0, Math.min(1, v));
  }

  applyFileVolume() {
    if (this.el) this.el.volume = this.fileVolume();
  }

  // setInterval rather than a Web Audio ramp, because element volume is a plain
  // property with no scheduling of its own.
  rampFile(to, ms, onDone = null) {
    if (!this.el) return;
    if (this.fileRamp) {
      window.clearInterval(this.fileRamp);
      this.fileRamp = null;
    }
    const el = this.el;
    const from = el.volume;
    const steps = Math.max(1, Math.round(ms / SCHED_TICK_MS));
    let i = 0;
    this.fileRamp = window.setInterval(() => {
      i += 1;
      const k = Math.min(1, i / steps);
      el.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) {
        window.clearInterval(this.fileRamp);
        this.fileRamp = null;
        onDone?.();
      }
    }, SCHED_TICK_MS);
  }

  playFile(name, fade) {
    const el = this.element(name);
    if (!el) return;
    this.fileName = name;
    this.fileTrack = FILE_TRACKS[name];
    this.el = el;
    el.currentTime = 0;
    el.volume = 0;
    // Autoplay is refused until the page has been touched. The gesture that
    // unlocks the context unlocks this too, and `unlock` replays the request.
    const started = el.play();
    started?.catch((err) => {
      // Not every rejection means the browser refused us. Pausing an element
      // rejects its own still-pending play() with AbortError, and swapping
      // tracks does exactly that — so treating it as "blocked, try later" would
      // queue the outgoing song and drag it back over the new one at the next
      // tap. That is audible as the same track starting a second time on top of
      // itself, and it gets much easier to hit when the audio is coming from
      // another host and the promise stays pending for longer.
      if (err && err.name === 'AbortError') return;
      // Superseded while the request was in flight; whoever replaced us owns
      // what happens next.
      if (this.fileName !== name) return;
      this.pendingTrack = name;
    });
    this.rampFile(this.fileVolume(), fade);
  }

  stopFile(fade = 700) {
    if (!this.el) return;
    const el = this.el;
    this.el = null;
    this.fileName = null;
    this.fileTrack = null;
    if (this.duckHold) {
      window.clearTimeout(this.duckHold);
      this.duckHold = null;
    }
    this.duckFactor = 1;
    if (this.fileRamp) {
      window.clearInterval(this.fileRamp);
      this.fileRamp = null;
    }
    const from = el.volume;
    const steps = Math.max(1, Math.round(fade / SCHED_TICK_MS));
    let i = 0;
    // Fades on its own handle rather than through `rampFile`, so a new track
    // starting during the fade cannot cancel the old one's exit.
    const h = window.setInterval(() => {
      // There is only one element per track, so selecting the same song again
      // mid-fade hands this very element back as the current one. Carrying on
      // would fight its new volume ramp and then pause the song that is
      // supposed to be playing.
      if (this.el === el) {
        window.clearInterval(h);
        return;
      }
      i += 1;
      el.volume = Math.max(0, from * (1 - i / steps));
      if (i >= steps) {
        window.clearInterval(h);
        el.pause();
      }
    }, SCHED_TICK_MS);
  }

  // ---- the sequencer ------------------------------------------------------

  music(name, opts = {}) {
    const { fade = 900 } = opts;
    if (!this.ready) {
      this.pendingTrack = name;
      return;
    }
    // A scene with no track of its own asks for silence rather than a song.
    if (!name || (!TRACKS[name] && !FILE_TRACKS[name])) {
      this.stopMusic(fade);
      return;
    }
    // Any cross-fade still pending belongs to a track we are replacing.
    if (this.fadeTimer) {
      window.clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }

    // A recorded track already playing is left alone, so walking from the menu
    // into a level on the same song does not restart it. "Already playing" has
    // to mean actually sounding, though: if the element ended up paused — a
    // refused autoplay, or a fade that stopped it just as it was asked for
    // again — then treating it as current would leave the game silent with no
    // way back.
    if (FILE_TRACKS[name]) {
      if (this.fileName === name && this.el && !this.el.paused) return;
      this.stopSynth(fade);
      if (this.el) {
        // Cross-fade one recording into the next.
        this.stopFile(fade / 2);
        this.fadeTimer = window.setTimeout(() => {
          this.fadeTimer = null;
          this.playFile(name, fade / 2);
        }, fade / 2);
        return;
      }
      this.playFile(name, fade);
      return;
    }

    // From here down the request is for a synthesised piece, so any recording
    // has to get out of the way first.
    this.stopFile(fade);
    if (this.trackName === name) return;

    const startNext = () => {
      this.fadeTimer = null;
      this.trackName = name;
      this.track = TRACKS[name];
      this.rng = seededRandom(this.track.seed ?? 1);
      this.lastMelodyNote = 0;
      this.step = 0;
      this.nextNoteTime = this.ctx.currentTime + 0.08;

      const g = this.musicGain.gain;
      const t = this.ctx.currentTime;
      g.cancelScheduledValues(t);
      g.setValueAtTime(0.0001, t);
      g.linearRampToValueAtTime(MUSIC_LEVEL * (this.track.gain ?? 1), t + fade / 1000);

      this.timer = window.setInterval(() => this.schedule(), SCHED_TICK_MS);
    };

    if (this.timer) {
      // Cross-fade: the old piece falls away while the new one is still being
      // set up, so scene changes do not click.
      const t = this.ctx.currentTime;
      const g = this.musicGain.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(g.value, t);
      g.linearRampToValueAtTime(0.0001, t + fade / 2000);
      window.clearInterval(this.timer);
      this.timer = null;
      this.trackName = null;
      this.fadeTimer = window.setTimeout(startNext, fade / 2);
      return;
    }
    startNext();
  }

  // Silences the sequencer without touching any recording. Kept separate so
  // `music` can swap one kind of track for the other cleanly.
  stopSynth(fade = 700) {
    if (!this.ready) return;
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    if (!this.trackName && !this.track) return;
    this.trackName = null;
    this.track = null;
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.0001, t + fade / 1000);
  }

  stopMusic(fade = 700) {
    if (!this.ready) {
      this.pendingTrack = null;
      return;
    }
    // A cross-fade already in flight must not bring its track back after this.
    if (this.fadeTimer) {
      window.clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
    }
    this.stopSynth(fade);
    this.stopFile(fade);
  }

  schedule() {
    if (!this.track || this.muted) return;
    // The sequencer is the one thing already ticking whenever there is music,
    // which makes it the cheapest place to notice the clock has stopped and ask
    // for it back. Without this the game waits for a tap, and the arena is
    // played with a thumb on a joystick that does not always produce one.
    this.resumeIfNeeded();
    const spb = 60 / this.track.bpm / 4; // one sixteenth
    // Read the clock once. Re-reading it inside the loop means a slow call can
    // move the finish line further away every time round.
    const now = this.ctx.currentTime;

    // A hidden tab throttles this timer, and a phone with its screen off stops
    // it altogether, while the audio clock keeps running the whole time. Coming
    // back, `nextNoteTime` can be minutes in the past, and catching up one
    // sixteenth at a time would schedule thousands of notes in a single
    // synchronous call — every one of them timestamped in the past, so they all
    // fire at once. That is the freeze. Past a bar of drift, give up on the
    // missed notes and start again from now.
    if (this.nextNoteTime < now - spb * 16) {
      this.nextNoteTime = now + 0.05;
    }

    // Belt and braces: even inside the window, one call can never run away.
    // Normal load is one or two steps, so this only ever trips on nonsense.
    let guard = 64;
    while (this.nextNoteTime < now + SCHED_AHEAD_S && guard > 0) {
      guard -= 1;
      this.playStep(this.step, this.nextNoteTime, spb);
      this.step = (this.step + 1) % (this.track.prog.length * 16);
      this.nextNoteTime += spb;
    }
  }

  playStep(step, when, spb) {
    const track = this.track;
    const bar = Math.floor(step / 16);
    const s = step % 16;
    const chord = track.prog[bar % track.prog.length];
    const notes = chordNotes(chord);
    const v = track.voices;

    if (v.pad && s === 0) {
      const cfg = v.pad;
      notes.forEach((n, i) => {
        this.voice({
          freq: midiToHz(n),
          wave: cfg.wave ?? 'triangle',
          attack: cfg.attack ?? 1,
          hold: spb * 8,
          dur: cfg.release ?? 1.5,
          gain: (cfg.gain ?? 0.15) / (1 + i * 0.35),
          cutoff: cfg.cutoff ?? null,
          send: 0.5,
          when,
          bus: this.musicGain,
          pan: i % 2 ? 0.25 : -0.25,
        });
      });
    }

    if (v.bass && v.bass.pattern[s]) {
      this.voice({
        freq: midiToHz(chord.root + (v.bass.octave ?? -24)),
        wave: 'triangle',
        attack: 0.008,
        hold: spb * 0.6,
        dur: spb * 1.6,
        gain: v.bass.gain ?? 0.2,
        cutoff: 700,
        send: 0.1,
        when,
        bus: this.musicGain,
      });
    }

    if (v.arp && v.arp.pattern[s]) {
      const n = notes[(s + bar) % notes.length] + (v.arp.octave ?? 12);
      this.voice({
        freq: midiToHz(n),
        wave: 'square',
        attack: 0.004,
        dur: spb * 1.4,
        gain: v.arp.gain ?? 0.1,
        cutoff: 2600,
        cutoffTo: 700,
        send: 0.3,
        when,
        bus: this.musicGain,
        pan: s % 4 === 0 ? -0.2 : 0.2,
      });
    }

    // Two detuned sines with a long decay: close enough to a music box that
    // nobody asks what it is.
    if (v.bell && v.bell.pattern[s]) {
      const n = notes[(s * 2 + bar) % notes.length] + (v.bell.octave ?? 12);
      const f = midiToHz(n);
      this.voice({
        freq: f,
        wave: 'sine',
        attack: 0.003,
        dur: spb * 5,
        gain: v.bell.gain ?? 0.15,
        send: 0.6,
        when,
        bus: this.musicGain,
      });
      this.voice({
        freq: f * 2.01,
        wave: 'sine',
        attack: 0.003,
        dur: spb * 2.2,
        gain: (v.bell.gain ?? 0.15) * 0.4,
        send: 0.6,
        when,
        bus: this.musicGain,
      });
    }

    if (v.kick && v.kick.pattern[s]) {
      this.voice({
        freq: 118,
        slideTo: 42,
        slideTime: 0.1,
        wave: 'sine',
        attack: 0.002,
        dur: 0.22,
        gain: v.kick.gain ?? 0.3,
        when,
        bus: this.musicGain,
      });
    }

    if (v.snare && v.snare.pattern[s]) {
      this.noise({
        dur: 0.16,
        gain: v.snare.gain ?? 0.2,
        type: 'highpass',
        cutoff: 1400,
        send: 0.25,
        when,
        bus: this.musicGain,
      });
      this.voice({
        freq: 190,
        slideTo: 120,
        wave: 'triangle',
        dur: 0.1,
        gain: (v.snare.gain ?? 0.2) * 0.5,
        when,
        bus: this.musicGain,
      });
    }

    if (v.hat && v.hat.pattern[s]) {
      this.noise({
        dur: 0.035,
        gain: v.hat.gain ?? 0.06,
        type: 'highpass',
        cutoff: 7000,
        when,
        bus: this.musicGain,
      });
    }

    // The lead. Eighths only, and it walks by small intervals through whichever
    // chord is sounding, so it never leaps somewhere ugly.
    if (track.melody && s % 2 === 0 && this.rng() < track.melody.density) {
      const pool = notes.concat([notes[0] + 12, notes[1] + 12]);
      let pick = pool[Math.floor(this.rng() * pool.length)];
      if (this.lastMelodyNote && Math.abs(pick - this.lastMelodyNote) > 9) {
        pick = pool.reduce((a, b) =>
          Math.abs(b - this.lastMelodyNote) < Math.abs(a - this.lastMelodyNote) ? b : a,
        );
      }
      this.lastMelodyNote = pick;
      this.voice({
        freq: midiToHz(pick + (track.melody.octave ?? 12)),
        wave: track.melody.wave ?? 'triangle',
        attack: 0.01,
        hold: spb * 0.5,
        dur: spb * 2.2,
        gain: track.melody.gain ?? 0.1,
        cutoff: 3200,
        cutoffTo: 900,
        send: 0.45,
        when,
        bus: this.musicGain,
        pan: 0.15,
      });
    }
  }
}

// Held apart from the class so the table reads as a list of sounds rather than
// a wall of methods. `this` is the engine inside every one of them.
function buildSfxTable() {
  return {
    // --- combat ---
    swing({ pitch = 1 } = {}) {
      this.noise({ dur: 0.13, gain: 0.16, type: 'bandpass', cutoff: 1800 * pitch, cutoffTo: 420, q: 1.2 });
      this.voice({ freq: 620 * pitch, slideTo: 200, wave: 'triangle', dur: 0.1, gain: 0.06 });
    },
    hit() {
      this.noise({ dur: 0.09, gain: 0.3, type: 'lowpass', cutoff: 2400, cutoffTo: 300 });
      this.voice({ freq: 220, slideTo: 90, wave: 'square', dur: 0.09, gain: 0.14, cutoff: 900 });
    },
    // Landing on a blob is wet, not metallic — that is the character of the
    // whole game's feedback.
    squelch({ pitch = 1 } = {}) {
      this.voice({ freq: 380 * pitch, slideTo: 120 * pitch, wave: 'sawtooth', dur: 0.14, gain: 0.13, cutoff: 1100, cutoffTo: 260 });
      this.noise({ dur: 0.1, gain: 0.13, type: 'bandpass', cutoff: 900, cutoffTo: 200, q: 2 });
    },
    blobDie({ pitch = 1 } = {}) {
      this.voice({ freq: 300 * pitch, slideTo: 70, wave: 'sawtooth', dur: 0.3, gain: 0.14, cutoff: 1400, cutoffTo: 180 });
      this.noise({ dur: 0.28, gain: 0.16, type: 'lowpass', cutoff: 1600, cutoffTo: 140, send: 0.2 });
    },
    hurt() {
      this.voice({ freq: 300, slideTo: 150, wave: 'square', dur: 0.24, gain: 0.16, cutoff: 1500, cutoffTo: 400 });
      this.noise({ dur: 0.2, gain: 0.14, type: 'lowpass', cutoff: 900, cutoffTo: 200 });
    },
    shielded() {
      this.voice({ freq: 900, slideTo: 1500, wave: 'sine', dur: 0.18, gain: 0.12, send: 0.5 });
      this.noise({ dur: 0.12, gain: 0.08, type: 'bandpass', cutoff: 3000, q: 4 });
    },
    down() {
      const t = this.ctx.currentTime;
      [0, 0.09, 0.19].forEach((d, i) => {
        this.voice({ freq: 330 - i * 70, slideTo: 90, wave: 'triangle', dur: 0.34, gain: 0.16, send: 0.4, when: t + d });
      });
    },

    // --- bosses ---
    bossTell() {
      this.voice({ freq: 70, slideTo: 130, wave: 'sawtooth', dur: 0.6, gain: 0.16, cutoff: 420, cutoffTo: 900 });
      this.noise({ dur: 0.55, gain: 0.07, type: 'bandpass', cutoff: 300, cutoffTo: 1400, q: 3 });
    },
    bossLunge() {
      this.noise({ dur: 0.3, gain: 0.22, type: 'bandpass', cutoff: 2400, cutoffTo: 250, q: 1.4 });
      this.voice({ freq: 200, slideTo: 60, wave: 'sawtooth', dur: 0.28, gain: 0.14, cutoff: 1200, cutoffTo: 200 });
    },
    slam() {
      this.voice({ freq: 130, slideTo: 34, wave: 'sine', dur: 0.5, gain: 0.32, send: 0.4 });
      this.noise({ dur: 0.42, gain: 0.24, type: 'lowpass', cutoff: 1800, cutoffTo: 90, send: 0.3 });
    },
    roar() {
      const t = this.ctx.currentTime;
      [0, 0.04, 0.08].forEach((d, i) => {
        this.voice({ freq: 96 - i * 14, slideTo: 46, wave: 'sawtooth', dur: 0.85, gain: 0.16, cutoff: 700, cutoffTo: 180, send: 0.5, when: t + d });
      });
      this.noise({ dur: 0.9, gain: 0.14, type: 'lowpass', cutoff: 1100, cutoffTo: 120, send: 0.5, when: t });
    },
    phase() {
      const t = this.ctx.currentTime;
      [0, 0.11, 0.22].forEach((d, i) => {
        this.voice({ freq: 150 + i * 90, wave: 'square', dur: 0.22, gain: 0.13, cutoff: 1400, send: 0.4, when: t + d });
      });
      this.noise({ dur: 0.6, gain: 0.16, type: 'lowpass', cutoff: 2600, cutoffTo: 200, send: 0.4 });
    },
    summon() {
      this.voice({ freq: 180, slideTo: 640, wave: 'sawtooth', dur: 0.42, gain: 0.13, cutoff: 700, cutoffTo: 2600, send: 0.5 });
      this.noise({ dur: 0.36, gain: 0.1, type: 'bandpass', cutoff: 500, cutoffTo: 3200, q: 3 });
    },
    spawn() {
      this.voice({ freq: 500, slideTo: 220, wave: 'triangle', dur: 0.16, gain: 0.1, send: 0.3 });
      this.noise({ dur: 0.12, gain: 0.07, type: 'bandpass', cutoff: 1600, q: 2 });
    },

    // --- pickups and events ---
    pickup() {
      const t = this.ctx.currentTime;
      [784, 1046, 1318].forEach((f, i) => {
        this.voice({ freq: f, wave: 'triangle', attack: 0.004, dur: 0.2, gain: 0.13, send: 0.5, when: t + i * 0.06 });
      });
    },
    swordGet() {
      const t = this.ctx.currentTime;
      [523, 659, 784, 1046].forEach((f, i) => {
        this.voice({ freq: f, wave: 'square', attack: 0.004, dur: 0.26, gain: 0.1, cutoff: 3000, send: 0.5, when: t + i * 0.075 });
      });
      this.noise({ dur: 0.3, gain: 0.08, type: 'highpass', cutoff: 5000, send: 0.4 });
    },
    heartGet() {
      const t = this.ctx.currentTime;
      [659, 784, 988, 1318].forEach((f, i) => {
        this.voice({ freq: f, wave: 'triangle', attack: 0.006, dur: 0.42, gain: 0.13, send: 0.7, when: t + i * 0.1 });
      });
    },
    heal() {
      const t = this.ctx.currentTime;
      [523, 659, 784, 1046, 1318].forEach((f, i) => {
        this.voice({ freq: f, wave: 'sine', attack: 0.01, dur: 0.34, gain: 0.11, send: 0.6, when: t + i * 0.055 });
      });
    },
    shieldUp() {
      this.voice({ freq: 320, slideTo: 1200, wave: 'sine', dur: 0.4, gain: 0.13, send: 0.6 });
      this.voice({ freq: 480, slideTo: 1800, wave: 'triangle', dur: 0.4, gain: 0.07, send: 0.6 });
    },
    nuke() {
      const t = this.ctx.currentTime;
      this.noise({ dur: 1.3, gain: 0.3, type: 'lowpass', cutoff: 6000, cutoffTo: 90, send: 0.6, when: t });
      this.voice({ freq: 260, slideTo: 28, wave: 'sawtooth', dur: 1.1, gain: 0.22, cutoff: 1800, cutoffTo: 80, send: 0.5, when: t });
      this.voice({ freq: 1400, slideTo: 200, wave: 'sine', dur: 0.5, gain: 0.1, send: 0.6, when: t });
    },
    doorOpen() {
      const t = this.ctx.currentTime;
      this.noise({ dur: 0.7, gain: 0.16, type: 'lowpass', cutoff: 700, cutoffTo: 180, send: 0.4, when: t });
      [392, 523, 659].forEach((f, i) => {
        this.voice({ freq: f, wave: 'triangle', dur: 0.5, gain: 0.1, send: 0.6, when: t + i * 0.1 });
      });
    },
    waveStart() {
      const t = this.ctx.currentTime;
      [147, 220, 294].forEach((f, i) => {
        this.voice({ freq: f, wave: 'sawtooth', dur: 0.4, gain: 0.13, cutoff: 900, send: 0.4, when: t + i * 0.09 });
      });
    },
    chest() {
      const t = this.ctx.currentTime;
      [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => {
        this.voice({ freq: f, wave: 'sine', attack: 0.008, dur: 0.7, gain: 0.12, send: 0.8, when: t + i * 0.09 });
      });
      this.noise({ dur: 0.9, gain: 0.09, type: 'highpass', cutoff: 4000, send: 0.7 });
    },
    sparkle() {
      const t = this.ctx.currentTime;
      const base = 1200 + Math.random() * 700;
      [0, 1, 2].forEach((i) => {
        this.voice({ freq: base * (1 + i * 0.32), wave: 'sine', attack: 0.003, dur: 0.16, gain: 0.05, send: 0.7, when: t + i * 0.035 });
      });
    },
    steal() {
      this.voice({ freq: 700, slideTo: 140, wave: 'sawtooth', dur: 0.6, gain: 0.18, cutoff: 2200, cutoffTo: 220, send: 0.5 });
      this.noise({ dur: 0.5, gain: 0.14, type: 'bandpass', cutoff: 1800, cutoffTo: 200, q: 2 });
    },
    thud() {
      this.voice({ freq: 90, slideTo: 40, wave: 'sine', dur: 0.36, gain: 0.24, send: 0.35 });
      this.noise({ dur: 0.24, gain: 0.14, type: 'lowpass', cutoff: 700, cutoffTo: 90 });
    },

    // --- interface ---
    uiHover() {
      this.voice({ freq: 880, wave: 'sine', attack: 0.003, dur: 0.06, gain: 0.045 });
    },
    uiClick() {
      this.voice({ freq: 660, slideTo: 990, wave: 'square', attack: 0.002, dur: 0.09, gain: 0.075, cutoff: 3200 });
    },
    uiConfirm() {
      const t = this.ctx.currentTime;
      [660, 880, 1320].forEach((f, i) => {
        this.voice({ freq: f, wave: 'triangle', attack: 0.003, dur: 0.18, gain: 0.09, send: 0.4, when: t + i * 0.055 });
      });
    },
    uiBack() {
      this.voice({ freq: 520, slideTo: 300, wave: 'square', dur: 0.12, gain: 0.07, cutoff: 2400 });
    },
    key() {
      this.voice({ freq: 1200 + Math.random() * 220, wave: 'square', attack: 0.002, dur: 0.05, gain: 0.05, cutoff: 4000 });
    },
    // The speech bubbles type; this is the per-character blip under them.
    blip({ pitch = 1 } = {}) {
      this.voice({ freq: 620 * pitch, wave: 'square', attack: 0.002, dur: 0.035, gain: 0.035, cutoff: 2600 });
    },
    // A sheet lifting, going over, and settling on the stack. One filtered
    // burst is a snap, and paper does not snap — it needs the movement before
    // the event and the weight after it, so this is four overlapping rustles
    // with a little jitter so consecutive turns are never quite identical.
    page() {
      const t = this.ctx.currentTime;
      const j = 0.9 + Math.random() * 0.2;

      // The lift. Slow to arrive, so the turn begins as movement.
      this.noise({
        dur: 0.26 * j,
        gain: 0.055,
        attack: 0.05,
        type: 'bandpass',
        cutoff: 1800,
        cutoffTo: 3200,
        q: 0.7,
        send: 0.18,
        when: t,
      });

      // The flutter as it goes over: two brighter crackles, close enough
      // together to read as one gesture rather than two taps.
      [0.07, 0.13].forEach((d, i) => {
        this.noise({
          dur: 0.1,
          gain: 0.05 - i * 0.012,
          attack: 0.004,
          type: 'bandpass',
          cutoff: 3600 + Math.random() * 900,
          cutoffTo: 1500,
          q: 1.4,
          send: 0.2,
          when: t + d * j,
        });
      });

      // The settle. Low and short — the page has weight and it lands.
      this.noise({
        dur: 0.16,
        gain: 0.045,
        attack: 0.012,
        type: 'lowpass',
        cutoff: 1100,
        cutoffTo: 380,
        q: 0.8,
        send: 0.25,
        when: t + 0.2 * j,
      });
    },
    tick() {
      this.voice({ freq: 1400, wave: 'square', attack: 0.001, dur: 0.04, gain: 0.06 });
    },

    // --- stingers ---
    win() {
      const t = this.ctx.currentTime;
      [523, 659, 784, 1046].forEach((f, i) => {
        [0, 4, 7].forEach((s) => {
          this.voice({
            freq: f * Math.pow(2, s / 12),
            wave: 'triangle',
            attack: 0.006,
            hold: 0.05,
            dur: 0.6,
            gain: 0.07,
            send: 0.7,
            when: t + i * 0.14,
          });
        });
      });
    },
    lose() {
      const t = this.ctx.currentTime;
      [392, 349, 311, 233].forEach((f, i) => {
        this.voice({ freq: f, wave: 'triangle', attack: 0.02, dur: 0.9, gain: 0.12, send: 0.7, when: t + i * 0.28 });
      });
    },
  };
}

export const audio = new AudioEngine();

// Any first touch anywhere unlocks the graph. Registered once, at module load,
// rather than per-scene, because the first gesture is usually on the title
// screen and the music has to be able to start from it.
if (typeof window !== 'undefined') {
  const unlockAudio = () => audio.unlock();
  // `pointerdown` already covers mouse, touch and pen everywhere this runs, so
  // listening for `mousedown` and `touchstart` as well only meant one tap
  // calling unlock two or three times over.
  ['pointerdown', 'keydown'].forEach((ev) =>
    window.addEventListener(ev, unlockAudio, { passive: true }),
  );
  // Coming back to the tab, or unlocking the phone, is the moment an
  // interrupted context can be revived — and it is not a gesture, so nothing
  // above fires for it.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) audio.resumeIfNeeded();
  });
}

# Heartbound

A pixel-art top-down action game. A boy and girl are having a picnic; blob monsters
swarm him, steal his heart and he collapses. She has **8 minutes** to chase them
through three rooms, kill the boss blob holding the heart, and get it back into him.

Built with Phaser 3. Every sprite is generated in code from pixel grids and
almost every sound is synthesised at runtime — there are no image files anywhere
in this project. The only recorded assets are in `audio/`: three songs and the page
turn used in the letter.

## Playing it / putting it online

**Live at <https://headfirstdownhill.github.io/heartbound/>.**

That is the `index.html` + `js/` version, served by GitHub Pages straight out of
this repo — there is no build step in front of it. Change something under `js/`,
commit, push, and the site is updated a minute later. The `audio/` masters sit
beside it in the repo, so `AUDIO_BASE` needs no rewriting.

The zip and the apk below are still how tiiny.host and Android get fed.

**`heartbound-web.zip` is what you upload.** 2.75 MB, built to fit a free static
host: the game as `index.html` with the `audio/` folder beside it. One upload,
nothing else to do.

```bash
powershell -ExecutionPolicy Bypass -File build.ps1           # if js/ changed
powershell -ExecutionPolicy Bypass -File build-web-audio.ps1 # if audio/ changed
powershell -ExecutionPolicy Bypass -File build-web-zip.ps1
```

**The audio has to travel with the HTML.** That is the one thing to get right:
hosts like tiiny.host treat each upload as the entire site, so uploading the
HTML and then the audio separately leaves you with only one of them, and a game
that runs perfectly in silence. Send them together, in the zip.

The hosted copy ships smaller audio than the local one. `audio/` holds the
full-quality masters, used when you open `heartbound.html` directly and inside
the apk, where nothing is competing for space. `build-web-audio.ps1` re-encodes
those into `audio-web/` at around a fifth of the size — 10.3 MB becomes 2.65 MB
— and the zip packs those instead. One line in `AudioManager.js` (`AUDIO_EXT`)
picks which set a build points at, and `build-web-zip.ps1` rewrites it; the
folder and filenames are identical either way.

That re-encode is mono AAC at ~52 kbps. AAC rather than mp3 because it sounds
considerably better for the same bytes at that rate, and AAC rather than Opus —
better still — because Opus does not play on older Safari and this link gets
opened on phones.

Two details that stop hosts mangling the zip: entry paths use forward slashes
(Windows zip tools write backslashes, which some hosts extract as a file
literally named `audio\thing.mp3` instead of a folder), and no filename contains
a space, so no URL ever needs `%20`.

Keeping the songs out of the HTML at all is deliberate: inlining them as base64
would inflate the file by a third and nothing would draw until the whole thing
had downloaded. As separate files the game starts straight away and the music
arrives a moment later.

The `index.html` + `js/` version is the same game as editable source. It uses ES
modules, so it needs a real web server — opening `index.html` by double-clicking
will not work. GitHub Pages is a real web server, which is why the live link
above serves that version directly; any other host wants the whole folder
zipped.

## Putting it on a phone

`android/heartbound.apk` installs the game on an Android phone. Copy it across,
open it, and allow installing from unknown sources when the phone asks — it is
self-signed, which is the normal state for an app that never went near the Play
Store. Android 7.0 or newer.

The app is the same bundle inside a full screen WebView. Phaser is vendored into
`android/assets/` rather than fetched, so **it works with no internet at all**
and the manifest declares no permissions of any kind. To rebuild after changing
the game — regenerate `heartbound.html` first, then:

```bash
powershell -ExecutionPolicy Bypass -File android\build.ps1
```

That drives the Android SDK tools directly: no Gradle, no Node, no Android
Studio project. See `android/README.md` for what it needs installed.

After editing anything under `js/`, regenerate the single file:

```bash
powershell -ExecutionPolicy Bypass -File build.ps1
```

Two things the bundler asks of you. New files must be added to the `$order` list
in `build.ps1` or they silently will not ship. And because concatenation drops
every module into one shared scope, **no two files may declare the same
top-level name** — a second `const ATTACK_COOLDOWN_MS` anywhere is a syntax
error at load. To check before building:

```bash
grep -rhoE '^(export )?(const|let|var|class|function) [A-Za-z_$][A-Za-z0-9_$]*' js/ | awk '{print $NF}' | sort | uniq -d
```

## Controls

- **Phone:** drag anywhere on the lower-left to move, tap the sword button to swing.
- **Desktop:** WASD or arrow keys to move, Space (or click) to swing.

The game auto-detects touch and only draws the on-screen controls when it needs to.

## Difficulty

Picked once per session on the way in, and kept for every replay until you go
back out to the main menu.

- **Hard** — the game exactly as it has always played. This is the baseline.
- **Easy** — adds the boy's ghost, and changes nothing else. It drifts along
  behind the girl, picks the nearest blob within range and hits it for 7 every
  1.3 seconds, against the sword's 12 every 0.33. It cannot be hurt, blobs
  ignore it, and it floats through walls. It is meant to take the edge off a
  crowded room, not to clear one.
- **I love you Jory** — a separate run with its own opening and its own single
  level. See below.

## The "I love you Jory" run

A different story and a different game. It opens on a rose meadow — red and
white, a pond with otters circling in it, three cats mooching about — where the
two of them talk in typed-out speech bubbles. He hands her a golden key, they
kiss, and she walks out through the gate. The rest is one arena.

- **No clock, and no way to lose.** Running out of hearts just puts her back at
  the entrance. The only exit is through.
- **Five waves**, escalating in size and tier. Every blob in this mode carries
  1.45x health and 1.12x speed, and aggros from anywhere on the map.
- **The final boss** arrives once wave five is clear. It rotates charge, ring
  slam and summon, gains phases at 66% and 33% health, and speeds up rather
  than changing what it does. Killing it kills everything it summoned.
- **Power-ups** surface one at a time, every 11 seconds, and vanish after 6:
  full heal, a 20-second shield, four blue allied blobs for 20 seconds, or —
  rarely — a nuke that clears the horde but never the boss.
- **The chest.** Light drops into the middle of the arena, a gold chest appears
  under a purple aura, and her key opens it. A book and a diamond ring rise out
  of it, and the run ends on a screen showing the two of them as hers, with the
  book offered to read.

Opening the chest is still remembered in `localStorage`, but nothing is gated on
it any more: the title screen carries an **INVENTORY** button from the very
first launch. The books are the point of the thing rather than a prize for
getting through the waves, so the letters can be read without playing at all.

Inside are three panels — **BOOK 1**, **BOOK 2** and the ring. The ring is
there to be had, not pressed; the books open. Tapping one opens its front board,
titled, with the heart on it, and the arrow turns from there into the letter.
Book 1 is pink, book 2 purple, and they are otherwise the same book twice —
same binding, same paper, same page turn — because they came from the same
person. Thirty pages each, all set at one size, with the page turns balanced so
no page is crammed and none is left bare.

The writing is data at the top of `js/scenes/BookScene.js`. `BOOKS` holds the
two of them, each with its title, its pages and its cover colours; `PAGES` and
`SCHOOL_PAGES` are the letters, one string per page. A string marks where a page
starts; if one ever outgrows a sheet the reader carries it on evenly by itself.

The font is uppercase-only and covers `A-Z 0-9 . , ! ? : - / ' ( ) < >` plus
`~`, which draws a heart. Anything outside that set renders as a blank space
rather than erroring, so check new punctuation against the table in
`js/gfx/sprites/font.js`.

Emoji are the exception, and they are real ones drawn by the reader's own
device. They cannot be typed into a page directly — JavaScript measures and
splits a string by UTF-16 unit, so one emoji counts as two characters and both
the wrap and the per-character glyph list drift. Instead a page holds a
one-character stand-in from the `EMOJI` map (`^ @ # % $ & *`), which has no
glyph and so reserves an exact blank, and the real character is drawn into it.
`widenEmoji` gives each one a second slot before wrapping so it has room to be
read at the size of the writing.


## The garden

A third button on the title screen, under PLAY. It opens the same rose meadow
the Jory run starts in — the picnic, the pond and its otters, the three cats,
the petals and the god rays — with the story taken out of it. No speech bubbles,
no key, no gate, nothing asked of you. The two of them sit there, and every
thirty seconds they lean in and kiss, which is the only thing that happens.

It is the Jory opening's own scene: `GardenScene` extends `JoryIntroScene` and
overrides three methods — `setupMode`, `buildOverlay` and `begin` — so the
scenery, the animals and the kiss are defined exactly once. Deliberately touches
no save state, unlike the opening it borrows from, since nothing follows it.

It is also the only screen with its own sound controls, because it is the only
one you sit in: a **volume slider top left** (whose speaker doubles as a mute
toggle) and a **music button top right** that drops down the song list. Picking a
song there is the same choice the title screen's strip makes, so the two stay in
step. Both live at the corners of `JI_VIEW` rather than of the canvas — the
camera is zoomed 1.25x, so the visible world is 384x640, not 480x800.

Tapping the meadow leaves. Taps that land on a control do not count, and an open
song list eats the first tap outside it, so dismissing the menu never doubles as
walking out.

## How a run goes

1. **Main menu → name → difficulty.** The name is entered on an in-game keypad
   (a physical keyboard works too) and shows up on the ending screens.
2. **Intro** — the picnic, the swarm, the theft, the collapse, the chase. All
   sprite-and-camera work, no text. Tap or press Space to skip.
3. **Level 1 (garden)** — pick up the sword, kill three blobs, the door opens.
4. **Level 2 (dungeon)** — more blobs, faster yellow ones.
5. **Level 3 (dungeon)** — red blobs plus the boss, which is carrying the heart.
   It telegraphs a charge, lunges, then is stunned — that stun is your window.
   Below half health it starts spitting out minions.
6. **The run back** — a short garden stretch back to where he fell. Walk into him
   to put the heart back.
7. **Win** with time to spare, or the clock hits zero and you don't. Either
   ending offers a replay (same name and difficulty) or a trip back to the menu.

Losing all three hearts doesn't end the run — it costs you 30 seconds and puts you
back at the room entrance. The timer is the only real fail state.

## Sound

Almost everything is generated. `js/systems/AudioManager.js` builds the effects
out of oscillators and filtered noise through the Web Audio API, for the same
reason the art is drawn in code. The exceptions all live in `audio/`: three songs,
and the page turn in the letter.

Three parts. `audio.play(name)` is a table of one-shot effects — swings, wet
impacts, boss tells, pickups, interface clicks — with `FILE_SFX` overriding
individual entries where a recording beats anything worth synthesising. The page
turn is the one that does: paper is a sound with a shape to it, and the
synthesised version is kept underneath as the fallback if the file ever fails to
load. Recorded effects get a few voices each, so turning pages quickly layers
instead of cutting itself off. `audio.music(track)` takes either
kind of track and works out which is which:

- **Synthesised**, from `TRACKS` near the top of the file — a sixteen-step
  sequencer over declarative data, one chord per bar plus which instruments play
  on which steps. Sparse minor for the dungeons, driving for the two bosses. The
  lead line is generated from a fixed seed, so a four-bar loop does not audibly
  repeat every four bars but still sounds the same every time you hear that room.
  (`meadow` is still defined but nothing calls it now that the Jory story runs on
  a recorded song — it is there if you want it back.)
- **Recorded**, from `FILE_TRACKS` just below it — plain `<audio>` elements
  rather than nodes in the graph, because `fetch` and `createMediaElementSource`
  both need an origin and this game has to survive being double-clicked off a
  desktop and being loaded from `file:///android_asset` inside the apk. The cost
  is that mute, ducking and the pause hold are mirrored onto the element by
  hand; `applyFileVolume` is where that happens.

The recorded songs are `a cornfield`, `love letter`, and Elysia's `do flowers
bloom where you walk?`. Where each one plays:

| Where | Track |
| --- | --- |
| Title screen | whichever the strip at the top is set to |
| Garden free mode | whichever the dropdown is set to |
| Garden levels | `do flowers bloom where you walk?` |
| Jory story — the rose meadow opening and the finale after the arena | `do flowers bloom where you walk?` |
| The letter | `a cornfield` |

The arena fight in the middle of the Jory run keeps its generated `arena` track;
only the story either side of it is her song. The three selectable songs are
`PLAYLIST` in `AudioManager.js`, which drives both the title screen's strip and
the garden's dropdown — adding one there puts it in both — and the choice is
remembered between sessions.

Browsers refuse to make noise before a page has been touched, so neither the
audio graph nor the first song starts until the first tap or keypress anywhere.
Until then the mini player shows its title dimmed. **Sound can be turned off
from the speaker icon on the title screen or from the pause menu**, and that
choice is remembered in `localStorage` alongside the volume, the chosen song and
the chest unlock. The garden carries its own slider and song list, since it is
the one screen with neither a pause menu nor the title screen's controls.

To add a synthesised effect, add an entry to the table at the bottom of
`AudioManager.js` and call it; to have a recording play instead of one, drop the
file in `audio/` and add an entry to `FILE_SFX` under the same name. To add a
generated track, add an entry to `TRACKS`; to add a recorded one, add it to
`FILE_TRACKS`, and put its key in `PLAYLIST` if it should be selectable on the
title screen.

## How it looks

Three systems sit on top of the sprites, and none of them touch how the game
plays:

- **`js/gfx/PostFX.js`** — one full-screen shader pass over the finished frame:
  bloom on the bright parts, chromatic aberration that grows toward the corners,
  faint scanlines, a vignette and a saturation lift. Scenes pick a preset by
  name (`garden`, `dungeon`, `boss`, `meadow`, `lose`…) rather than setting five
  numbers, and `gradePostFX` tweens between them — which is how the room visibly
  turns when the level 3 boss wakes up. The bloom threshold is deliberately
  high: too low and every white pixel in the art blooms, and a field of white
  roses becomes a field of glowing orbs. Canvas-only browsers skip the whole
  thing and lose nothing but polish.

  **The grade is switchable.** `GRADE` near the top of the file picks between
  three complete looks, all kept side by side so any of them can be restored by
  changing one word:

  | `GRADE` | Saturation | Vignette | Fringing | Scanlines |
  | --- | --- | --- | --- | --- |
  | `warm` | the original lift | full | full | full |
  | `soft` | eased to about neutral | full | full | full |
  | `softer` | a shade under neutral | 0.85x | 0.6x | 0.55x |

  Bloom is identical in all three on purpose — the glow is the part worth
  keeping, so softening never touches it. The `lose` preset also opts out of the
  multipliers: its job is to be heavy and drained, and lightening its corners
  would be softening the wrong thing.
- **`js/systems/Fx.js`** — the juice. Hit sparks, goo, shockwave rings, floating
  damage numbers, footstep dust, contact shadows, ambient motes, drifting
  petals, god rays, torches, camera punches. One is built per scene as
  `scene.fx`, and its emitters are pooled rather than spawned per swing.
- **Lighting** — the dungeon rooms and the arena are lit only by their torches
  and by what the player is carrying. A dark sheet is laid over the floor and
  holes are punched in it every frame. It sits *below* the cast on purpose:
  covering everything is more honest and much worse to play, because enemies in
  an unlit corner disappear.

`js/gfx/FxTextures.js` holds the soft-edged textures these need — glows, rings,
sparks, light masks — drawn with canvas gradients, since a radial glow authored
as a grid of characters is a staircase.

## Tuning it

Nearly everything you'd want to change is data, not code:

- `js/data/levelData.js` — the room layouts (drawn as character maps), which blobs
  spawn where, and every enemy's health/speed/damage.
- `js/core/Constants.js` — run length (`RUN_DURATION_MS`), death penalty, player
  speed, health, sword damage, attack timing.
- `js/gfx/Palette.js` — every colour in the game, including the blob tier tints.
- `js/gfx/PostFX.js` — `POSTFX_PRESETS` is the whole look, one line per mood.
- `js/systems/AudioManager.js` — `TRACKS` is the generated music, `FILE_TRACKS`
  the recorded songs, `FILE_SFX` the recorded page turn, and the table at the
  bottom of the file is every synthesised sound effect.
- `js/gfx/sprites/` — the sprites themselves, as grids of characters. Each character
  maps to a palette colour and `.` is transparent, so you can redraw the girl by
  editing text. Rows must stay rectangular; the loader throws if one is miscounted.

## Layout

```
heartbound.html      single-file build — this is the deliverable
index.html           module version entry point (needs a server)
audio/               full-quality masters: three songs and the page turn
audio-web/           the same, re-encoded small for the hosted build
build-web-audio.ps1  regenerates audio-web/ from audio/
build-web-zip.ps1    packages index.html + audio-web/ as heartbound-web.zip
build.ps1            regenerates heartbound.html from js/
js/core/             constants, save state, countdown, input abstraction
js/gfx/              pixel-grid to texture pipeline, palette, pixel font
js/gfx/FxTextures.js gradient-drawn glows, rings, sparks and light masks
js/gfx/PostFX.js     the full-screen shader pass and its per-mood presets
js/gfx/sprites/      all the art, as character grids
js/entities/         player, blobs, bosses, ghost, allies, power-ups
js/systems/          room builder, cutscene sequencer, audio engine, effects
js/scenes/           boot, menu/name/difficulty, intros, garden, levels, HUD, endings
js/ui/               joystick, touch button, menu widgets, mini player, music+volume
js/data/             level layouts, enemy stats, Jory waves and power-up table
```

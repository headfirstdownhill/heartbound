// The rules for turning what you wrote into what the game can draw.
//
// One copy of them, used by tools/add-letter.js and by the drop page in
// tools/drop-server.js. They used to live only in add-letter.js; the moment a
// second thing needed to show a preview, two copies would have drifted and the
// preview would have started quietly lying about what was going to be saved.
//
// Nothing in here touches a file. It takes text and gives back text plus a list
// of everything it changed, and the caller decides what to do about that.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const EMOJI_DATA = path.join(ROOT, 'js', 'data', 'emojiData.js');

// A sheet of paper, in characters. Mirrors BOOK_CHARS_PER_LINE and
// BOOK_TEXT_H / BOOK_LINE_H in js/scenes/BookScene.js.
const LINE_CHARS = 22;
const SHEET_LINES = 20;

// Everything the pixel font has a glyph for. Anything else renders as empty
// space, so it is stripped and reported rather than left to disappear quietly.
const FONT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:-/'()<>~ ";

// Where automatically assigned stand-ins come from: the Private Use Area, which
// no font draws and no keyboard types. 6,400 of them, each a single UTF-16 unit,
// which is what the one-character-per-slot rule needs. Before this, every new
// emoji cost a hand-picked punctuation mark out of a pool that was nearly empty.
const PUA_FIRST = 0xe000;
const PUA_LAST = 0xf8ff;

// ---- the emoji registry ----------------------------------------------------

// Read out of the generated file rather than kept here, so the game and the tool
// cannot disagree about what a stand-in means.
function readRegistry() {
  const src = fs.readFileSync(EMOJI_DATA, 'utf8');
  const block = src.match(/export const EMOJI = \{([\s\S]*?)\n\};/);
  if (!block) {
    throw new Error(
      'Could not read the emoji list in js/data/emojiData.js.\n' +
        'If it has been edited by hand, restoring it from git will fix it.',
    );
  }
  const toStandIn = new Map();
  const standIns = [];
  // Keys are either a quoted character or a \uXXXX escape for the assigned ones.
  for (const m of block[1].matchAll(/'((?:\\u[0-9a-fA-F]{4})|[^'])':\s*'([^']+)'/g)) {
    const key = m[1].startsWith('\\u') ? String.fromCharCode(parseInt(m[1].slice(2), 16)) : m[1];
    toStandIn.set(m[2], key);
    standIns.push(key);
  }
  if (standIns.length === 0) throw new Error('The emoji list in js/data/emojiData.js is empty.');

  const typeable = src.match(/export const TYPEABLE_STAND_INS = '([^']*)';/);
  return {
    toStandIn,
    standIns,
    // Only these can appear in something you typed, so only these need taking
    // out of your writing before the swap.
    typeable: typeable ? typeable[1] : '',
  };
}

// The next Private Use character nobody has taken. Assignments are permanent, so
// this only ever looks for a gap above what is already used.
function nextStandIn(registry) {
  const used = new Set(registry.standIns.map((c) => c.codePointAt(0)));
  for (let code = PUA_FIRST; code <= PUA_LAST; code += 1) {
    if (!used.has(code)) return String.fromCharCode(code);
  }
  throw new Error('Every Private Use character is taken, which should not be possible.');
}

// Writes the registry back out whole, in the order it already had, so an
// assignment never moves and the diff stays to the one line that was added.
function renderRegistry(registry) {
  const lines = [];
  for (const standIn of registry.standIns) {
    const glyph = [...registry.toStandIn].find(([, c]) => c === standIn)?.[0];
    const code = standIn.codePointAt(0);
    const key = code >= PUA_FIRST && code <= PUA_LAST ? `'\\u${code.toString(16)}'` : `'${standIn}'`;
    lines.push(`  ${key}: '${glyph}',`);
  }
  return `${REGISTRY_HEADER}export const EMOJI = {
${lines.join('\n')}
};

${TYPEABLE_NOTE}export const TYPEABLE_STAND_INS = '${registry.typeable}';
`;
}

const REGISTRY_HEADER = `// GENERATED FILE - do not edit it by hand.
//
// Every emoji the game knows, keyed by the stand-in character that sits in the
// page text in its place. Written by tools/add-letter.js, which adds to it on
// its own whenever a letter arrives carrying an emoji that is not here yet.
//
// Why a stand-in at all: the emoji cannot go in the page string itself.
// JavaScript measures and splits a string by UTF-16 unit, so one emoji counts
// as two characters - the line wrap would drift, and the per-character glyph
// list the page is built from would stop lining up with the text. A stand-in
// keeps that one to one: one character in the page, one slot on the paper. None
// of them are in the font table, so each sets a blank of exactly the right
// width, and the real emoji is drawn into it by the device's own emoji font -
// so she gets the faces her phone draws rather than somebody's idea of them in
// five pixels.
//
// Two kinds of key here, and the difference matters.
//
// The first twelve are ordinary keyboard characters, and they are FIXED. The two
// books in js/scenes/BookScene.js are hand-written, and their text contains
// '^' '@' '#' '%' '$' '&' '*' literally. Reassigning those would blank out every
// emoji in both books, so they stay where they are for good.
//
// Everything after them is assigned automatically from the Private Use Area
// (U+E000 up): 6,400 characters that no font draws and no keyboard types, which
// is exactly what a stand-in has to be. Before that, each new emoji cost a
// hand-picked punctuation mark out of a pool that was nearly empty - and that
// pool was the reason a letter could arrive that nobody could add. An emoji
// keeps whatever character it is first given, so these are stable across runs.
`;

const TYPEABLE_NOTE = `// The twelve above, and only those, are characters you could actually type. A
// stand-in that is reachable from a keyboard has to be taken out of your writing
// before the swap, or a '&' you wrote comes out as a wink. Everything assigned
// after this point is unreachable, so it never needs that treatment.
`;

// ---- measuring -------------------------------------------------------------

// Same rule as wrapText in js/ui/SpeechBubble.js: break on whitespace, never
// inside a word.
function wrapLines(text) {
  const words = String(text).toUpperCase().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > LINE_CHARS && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Same rule as widenEmoji in BookScene.js: each stand-in gets a second slot
// before wrapping, so it has room to be read at the size of the writing. Counted
// here too, or the page-fullness numbers would be optimistic.
function widen(text, standIns) {
  const set = new Set(standIns);
  let out = '';
  for (const c of text) out += set.has(c) ? `${c}_` : c;
  return out;
}

const linesFor = (text, standIns) => wrapLines(widen(text, standIns)).length;
const sheetsFor = (text, standIns) => Math.max(1, Math.ceil(linesFor(text, standIns) / SHEET_LINES));

// ---- the date --------------------------------------------------------------

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Checked against a real calendar rather than taken on trust - the weekday and
// the date can disagree and nothing downstream would ever notice.
function checkDate(date) {
  const m = String(date).match(/^([A-Za-z]+)\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) {
    return (
      `the date "${date}" is not in the expected shape.\n` +
      '     It should look exactly like:  Saturday 12/09/2026\n' +
      '     (day name, then day/month/year). Used as written.'
    );
  }
  const [, weekday, d, mo, y] = m;
  const real = new Date(Date.UTC(+y, +mo - 1, +d, 12));
  if (real.getUTCDate() !== +d || real.getUTCMonth() !== +mo - 1) {
    return `there is no such date as ${d}/${mo}/${y}. Used as written.`;
  }
  const actual = WEEKDAYS[real.getUTCDay()];
  if (actual.toLowerCase() !== weekday.toLowerCase()) {
    return (
      `${d}/${mo}/${y} was a ${actual}, not a ${weekday}.\n` +
      `     Change the first line to:  ${actual} ${d}/${mo}/${y}`
    );
  }
  return null;
}

// ---- the conversion --------------------------------------------------------

// Everything done to your words, in order, each one reported so nothing is
// changed behind her back.
//
// `registry` is modified in place when an emoji it has never seen turns up: it
// is given the next free Private Use character and recorded. The caller decides
// whether to save that.
function clean(raw, registry) {
  const notes = [];
  const learned = [];
  let text = raw;

  const count = (re) => (text.match(re) || []).length;

  const curly = count(/[‘’]/g);
  text = text.replace(/[‘’]/g, "'");

  const quotes = count(/["“”]/g);
  text = text.replace(/["“”]/g, "'");

  const dashes = count(/[–—]/g);
  text = text.replace(/[–—]/g, '-');

  const ellipses = count(/…/g);
  text = text.replace(/…/g, '...');

  if (curly) notes.push(`straightened ${curly} curly apostrophe${curly === 1 ? '' : 's'}`);
  if (quotes) notes.push(`turned ${quotes} quote mark${quotes === 1 ? '' : 's'} into apostrophes`);
  if (dashes) notes.push(`shortened ${dashes} long dash${dashes === 1 ? '' : 'es'}`);
  if (ellipses) notes.push(`spelled out ${ellipses} ellipsis${ellipses === 1 ? '' : 'es'}`);

  // Literal stand-in characters, dealt with BEFORE the swap so a '&' you typed is
  // never mistaken for one this put there. '&' has an obvious reading; the rest
  // do not, so they go, loudly. Only the twelve keyboard ones can occur at all.
  const ampersands = count(/&/g);
  if (ampersands && registry.typeable.includes('&')) {
    text = text.replace(/\s*&\s*/g, ' and ');
    notes.push(`wrote out ${ampersands} "&" as "and" (& is reserved for an emoji)`);
  }

  const literals = {};
  for (const c of registry.typeable) {
    if (c === '&') continue;
    const n = text.split(c).length - 1;
    if (n) {
      literals[c] = n;
      text = text.split(c).join('');
    }
  }

  // The swap, and the check for anything the font cannot draw, one whole emoji
  // at a time.
  //
  // Whole matters. Plenty of emoji are several glued together with invisible
  // joiners - the couple kissing is a woman, a heart, a kiss and a man. Walking
  // the text character by character takes the heart out of the middle of that
  // one and leaves the rest behind as separate unknowns, which is both wrong and
  // impossible to act on. Intl.Segmenter splits text the way a phone does.
  //
  // A missing variation selector (U+FE0F) is ignored when matching, because the
  // same heart arrives with and without one depending on what it was typed on.
  const bare = (s) => s.replace(/️/g, '');
  const byBare = new Map([...registry.toStandIn].map(([glyph, c]) => [bare(glyph), c]));
  const allowed = new Set([...FONT_CHARS, ...FONT_CHARS.toLowerCase(), '\n']);
  const unknownOther = new Set();
  let swapped = 0;
  let kept = '';

  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)) {
    const known = byBare.get(bare(segment));
    if (known) {
      kept += known;
      swapped += 1;
      continue;
    }
    if (allowed.has(segment)) {
      kept += segment;
      continue;
    }
    // Past the ordinary punctuation blocks it is an emoji rather than a typo, so
    // it gets a stand-in of its own instead of being refused. This is the whole
    // reason a letter can now be added without anyone editing the game.
    if ([...segment].some((c) => c.codePointAt(0) > 0x2000)) {
      const standIn = nextStandIn(registry);
      registry.toStandIn.set(segment, standIn);
      registry.standIns.push(standIn);
      byBare.set(bare(segment), standIn);
      learned.push(segment);
      kept += standIn;
      swapped += 1;
      continue;
    }
    for (const c of segment) {
      if (allowed.has(c)) kept += c;
      else unknownOther.add(c);
    }
  }
  if (swapped) notes.push(`swapped ${swapped} emoji for their stand-ins`);
  if (learned.length) {
    notes.push(
      `taught the game ${learned.length} new emoji:  ${[...new Set(learned)].join('  ')}`,
    );
  }

  return { text: kept, notes, learned: [...new Set(learned)], literals, unknownOther: [...unknownOther] };
}

// Splits a whole letter file into its date and its pages, and says everything
// worth saying about it. Does not touch disk.
// Takes a text file exactly as it comes and works out what is in it. There is no
// format to get right and nothing to remember.
//
// A date on the first line is offered, not demanded: if the first line happens to
// look like one, it becomes the date stamped on the first sheet and the rest is
// the letter. If it does not, the whole file is the letter and it simply has no
// date on it - the page only stamps one where there is one to stamp.
//
// This used to insist on a date line and refuse anything without one, which made
// a plain text file the wrong shape for no good reason.
function parseLetter(raw) {
  const text = String(raw)
    .replace(/\r\n?/g, '\n')
    .replace(/^﻿/, '') // a byte-order mark, which Notepad can leave behind
    .trim();
  if (!text) return { error: 'empty' };

  const lines = text.split('\n');
  const first = lines[0].trim();
  const rest = lines.slice(1).join('\n').trim();

  // Only a whole line that is just a date counts, so a letter opening with
  // "Monday was lovely" keeps its first line as writing.
  if (DATE_SHAPE.test(first) && rest) return { date: first, body: rest };

  return { date: null, body: text };
}

const DATE_SHAPE = /^[A-Za-z]+\s+\d{1,2}\/\d{1,2}\/\d{2,4}$/;

// A blank line is a page break. That is the only rule, so that whoever is adding
// the letter is always the one deciding where a page ends.
function toPages(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

module.exports = {
  LINE_CHARS,
  SHEET_LINES,
  EMOJI_DATA,
  readRegistry,
  renderRegistry,
  nextStandIn,
  wrapLines,
  widen,
  linesFor,
  sheetsFor,
  checkDate,
  clean,
  parseLetter,
  toPages,
};

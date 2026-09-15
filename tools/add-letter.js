// Turns the plain-text letters in letters/ into js/data/letterData.js.
//
// This is the whole reason a letter no longer needs anyone to write code. What
// she puts in is his message, pasted as he sent it; what comes out is the game's
// data file, regenerated from scratch every run. Nothing here edits hand-written
// code, and re-running is always safe - if the generated file is ever damaged,
// running this again replaces it wholesale.
//
//   node tools/add-letter.js          (or just double-click ADD-LETTER.bat)
//
// The four things it does that a person would otherwise have to remember:
//
//   1. The curly apostrophe his keyboard types has no glyph in the font, so it
//      renders as a hole in the middle of a word. Same for em dashes and
//      ellipses. They are converted.
//   2. Emoji cannot sit in a page string - JavaScript measures a string by
//      UTF-16 unit, so one emoji counts as two and both the line wrap and the
//      per-character glyph list drift out of step with the text. Each one is
//      swapped for its one-character stand-in, which reserves an exact blank for
//      the real emoji to be drawn into at read time.
//   3. Those stand-ins are ordinary keyboard characters, so a '&' he actually
//      typed would come out as a wink. Literals are dealt with before the swap.
//   4. A page is a sheet of paper with a fixed size. Anything longer is carried
//      onto a second sheet by the reader, which is fine, but it should be said
//      out loud rather than discovered.
//
// It reports rather than guesses. An emoji it does not recognise stops the run
// with the character named, because the alternative is silently dropping
// something he wrote.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const LETTERS_DIR = path.join(ROOT, 'letters');
const BOOK_SCENE = path.join(ROOT, 'js', 'scenes', 'BookScene.js');
const OUT = path.join(ROOT, 'js', 'data', 'letterData.js');

// A sheet of paper, in characters. Mirrors BOOK_CHARS_PER_LINE and
// BOOK_TEXT_H / BOOK_LINE_H in BookScene.js.
const LINE_CHARS = 22;
const SHEET_LINES = 20;

// Everything the pixel font has a glyph for, plus the stand-ins, which are
// blanks it fills with real emoji. Anything else renders as empty space, so it
// is stripped and reported rather than left to disappear quietly.
const FONT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!?:-/'()<>~ ";

const COVER = { cover: 0xf7b6cb, coverDark: 0xe08fae };

// ---- reading the emoji table ----------------------------------------------

// Read out of BookScene.js rather than copied here, so the two cannot drift
// apart. If someone adds an emoji to the game, this picks it up for free.
function readEmojiMap() {
  const src = fs.readFileSync(BOOK_SCENE, 'utf8');
  const block = src.match(/const EMOJI = \{([\s\S]*?)\n\};/);
  if (!block) {
    throw new Error(
      'Could not find the EMOJI list inside js/scenes/BookScene.js.\n' +
        'That file has been changed in a way this tool did not expect.',
    );
  }
  const toStandIn = new Map();
  const standIns = [];
  for (const m of block[1].matchAll(/'(.)':\s*'([^']+)'/g)) {
    toStandIn.set(m[2], m[1]);
    standIns.push(m[1]);
  }
  if (standIns.length === 0) throw new Error('The EMOJI list in BookScene.js is empty.');
  return { toStandIn, standIns };
}

// ---- text ------------------------------------------------------------------

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

// Same rule as widenEmoji in BookScene.js: each stand-in is given a second slot
// before wrapping, so it has room to be read at the size of the writing. Counted
// here too, or the page-fullness numbers would be optimistic.
function widen(text, standIns) {
  const set = new Set(standIns);
  return text.replace(/./gsu, (c) => (set.has(c) ? `${c}_` : c));
}

function sheetsFor(text, standIns) {
  return Math.max(1, Math.ceil(wrapLines(widen(text, standIns)).length / SHEET_LINES));
}

function linesFor(text, standIns) {
  return wrapLines(widen(text, standIns)).length;
}

// ---- cleaning --------------------------------------------------------------

// Everything done to his words, in order, each one reported so nothing is
// changed behind her back.
function clean(raw, emoji, notes) {
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

  // Literal stand-in characters, dealt with BEFORE the emoji swap so a '&' he
  // typed is never mistaken for one this tool put there. '&' has an obvious
  // reading; the rest do not, so they go, loudly.
  const ampersands = count(/&/g);
  if (ampersands) {
    text = text.replace(/\s*&\s*/g, ' and ');
    notes.push(`wrote out ${ampersands} "&" as "and" (& is reserved for an emoji)`);
  }

  const reserved = emoji.standIns.filter((c) => c !== '&');
  const literals = {};
  for (const c of reserved) {
    const n = (text.match(new RegExp(`\\${c}`, 'g')) || []).length;
    if (n) literals[c] = n;
  }
  for (const c of Object.keys(literals)) {
    text = text.split(c).join('');
  }

  // The emoji swap, and the check for anything the font cannot draw, done one
  // whole emoji at a time.
  //
  // Whole matters. Plenty of emoji are several emoji glued together with
  // invisible joiners - the couple kissing is a woman, a heart, a kiss and a man.
  // Walking the text a character at a time, or swapping known emoji wherever
  // they occur, takes the heart out of the middle of that one and leaves the
  // rest behind as four separate "unknown emoji", which is both wrong and
  // impossible to act on. Intl.Segmenter splits text the way a phone does, so
  // each thing she would see as one emoji is looked at as one.
  //
  // A missing variation selector (U+FE0F) is ignored when matching, because
  // the same heart arrives with and without one depending on what it was typed
  // on, and it is the same heart.
  const bare = (s) => s.replace(/️/g, '');
  const byBare = new Map([...emoji.toStandIn].map(([glyph, c]) => [bare(glyph), c]));
  const allowed = new Set([...FONT_CHARS, ...FONT_CHARS.toLowerCase(), '\n']);
  const unknownEmoji = new Set();
  const unknownOther = new Set();
  let swapped = 0;
  let kept = '';
  for (const { segment } of new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(text)) {
    const standIn = byBare.get(bare(segment));
    if (standIn) {
      kept += standIn;
      swapped += 1;
      continue;
    }
    if (allowed.has(segment)) {
      kept += segment;
      continue;
    }
    // Past the ordinary punctuation blocks it is a pictograph or an emoji
    // rather than a typo, so it is reported whole, the way she would see it.
    if ([...segment].some((c) => c.codePointAt(0) > 0x2000)) {
      unknownEmoji.add(segment);
      continue;
    }
    for (const c of segment) {
      if (allowed.has(c)) kept += c;
      else unknownOther.add(c);
    }
  }
  if (swapped) notes.push(`swapped ${swapped} emoji for their stand-ins`);

  return { text: kept, literals, unknownEmoji: [...unknownEmoji], unknownOther: [...unknownOther] };
}

// ---- the date --------------------------------------------------------------

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Checked against a real calendar rather than taken on trust - the weekday and
// the date can disagree and nothing downstream would ever notice.
function checkDate(date, warn) {
  const m = date.match(/^([A-Za-z]+)\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) {
    warn(
      `the date "${date}" is not in the expected shape.\n` +
        '     It should look exactly like:  Saturday 12/09/2026\n' +
        '     (day name, then day/month/year). Used as written.',
    );
    return;
  }
  const [, weekday, d, mo, y] = m;
  const real = new Date(Date.UTC(+y, +mo - 1, +d, 12));
  if (real.getUTCDate() !== +d || real.getUTCMonth() !== +mo - 1) {
    warn(`there is no such date as ${d}/${mo}/${y}. Used as written.`);
    return;
  }
  const actual = WEEKDAYS[real.getUTCDay()];
  if (actual.toLowerCase() !== weekday.toLowerCase()) {
    warn(
      `${d}/${mo}/${y} was a ${actual}, not a ${weekday}.\n` +
        `     Change the first line of the file to:  ${actual} ${d}/${mo}/${y}`,
    );
  }
}

// ---- reading one letter file ----------------------------------------------

function readLetter(file, emoji, problems, warnings) {
  const name = path.basename(file);
  const num = name.match(/^letter(\d+)\.txt$/i);
  if (!num) {
    problems.push(
      `${name} is not named the way this tool expects.\n` +
        '   It has to be the word "letter" followed by a number, like letter3.txt',
    );
    return null;
  }

  // \r\n? rather than \r\n, so a lone carriage return - which pasting between
  // apps can leave behind - is a line break too rather than an unknown
  // character that gets stripped with a warning she cannot act on.
  const raw = fs.readFileSync(file, 'utf8').replace(/\r\n?/g, '\n');
  const lines = raw.split('\n');
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i += 1;
  if (i >= lines.length) {
    problems.push(`${name} is empty. It needs a date on the first line and his message below it.`);
    return null;
  }

  const date = lines[i].trim();
  const body = lines.slice(i + 1).join('\n').trim();
  if (!body) {
    problems.push(
      `${name} has a date but no message under it.\n` +
        '   Leave a blank line after the date, then paste what he wrote.',
    );
    return null;
  }

  const notes = [];
  const warn = (msg) => warnings.push(`${name}: ${msg}`);
  checkDate(date, warn);

  const result = clean(body, emoji, notes);

  if (result.unknownEmoji.length) {
    problems.push(
      `${name} uses ${result.unknownEmoji.length} emoji the game does not know yet:  ` +
        result.unknownEmoji.join('  ') +
        '\n   Nothing has been changed. See "An emoji it does not know" in LETTERS.md -' +
        '\n   either take those out of the letter, or have them added to the game.',
    );
    return null;
  }

  for (const [c, n] of Object.entries(result.literals)) {
    warn(
      `removed ${n} "${c}" that he typed. That character is reserved for an emoji,` +
        `\n     so leaving it in would have shown the wrong picture.`,
    );
  }
  if (result.unknownOther.length) {
    warn(
      `removed characters the writing cannot show:  ${result.unknownOther.join('  ')}` +
        '\n     They would have appeared as blank gaps.',
    );
  }

  // A blank line is a page break. That is the only rule, so that she is always
  // the one deciding where a page ends.
  const pages = result.text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (pages.length === 0) {
    problems.push(`${name} has nothing left in it once the unusable characters were taken out.`);
    return null;
  }

  for (const [n, page] of pages.entries()) {
    if (sheetsFor(page, emoji.standIns) > 1) {
      warn(
        `paragraph ${n + 1} is too long for one page, so it will be spread over ` +
          `${sheetsFor(page, emoji.standIns)}.` +
          '\n     That is fine. If you would rather choose where it breaks, put a blank' +
          '\n     line in the middle of it.',
      );
    }
  }

  return { id: `letter${+num[1]}`, n: +num[1], name, date, pages, notes };
}

// ---- writing the generated file -------------------------------------------

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

function render(letters) {
  const entries = letters
    .map((l) => {
      const pages = l.pages.map((p) => `      "${esc(p)}",`).join('\n\n');
      return [
        `  ${l.id}: {`,
        `    title: 'Letter ${l.n}',`,
        `    date: '${l.date}',`,
        `    cover: 0x${COVER.cover.toString(16)},`,
        `    coverDark: 0x${COVER.coverDark.toString(16)},`,
        '    bound: false,',
        "    icon: 'letter_closed',",
        '    pages: [',
        pages,
        '    ],',
        '  },',
      ].join('\n');
    })
    .join('\n');

  return `// GENERATED FILE - do not edit it by hand.
//
// Every letter in the game, written out by tools/add-letter.js from the
// plain-text files in letters/. Anything typed in here is lost the next time a
// letter is added.
//
// To change a letter, open its file in letters/ and run ADD-LETTER.bat again.
//
// His words are untouched bar the things the pixel font cannot draw: the curly
// apostrophes his keyboard types are the straight ones here and render
// identically, and each emoji is the one-character stand-in that reserves a
// blank for the real one to be drawn into. See the EMOJI table in
// js/scenes/BookScene.js.
//
// 'bound: false' is what makes each of these a letter rather than a book: it
// gives it the envelope to come out of, and takes away the spine, because a
// sheet out of an envelope has no binding to sit in.
export const LETTER_BOOKS = {
${entries}
};
`;
}

// ---- the commit message ----------------------------------------------------

// PUBLISH.bat asks for this rather than inventing one, so the history still
// says which letter went up even though nobody typed a message.
//
// Which letters actually changed is a question only git can answer, so it is
// asked. If it cannot answer - no git, not a repository, anything - the message
// falls back to something true but vague rather than failing the publish.
function commitMessage() {
  let changed = [];
  try {
    const out = execFileSync('git', ['status', '--porcelain', '-uall', '--', 'letters'], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    changed = [...out.matchAll(/letters\/letter(\d+)\.txt/g)].map((m) => +m[1]);
  } catch {
    changed = [];
  }

  const unique = [...new Set(changed)].sort((a, b) => a - b);
  if (unique.length === 1) return `Letter ${unique[0]}`;
  if (unique.length > 1) return `Letters ${unique.join(', ')}`;
  return 'The letters';
}

// ---- putting it together ---------------------------------------------------

function main() {
  if (process.argv.includes('--message')) {
    console.log(commitMessage());
    return;
  }

  if (!fs.existsSync(LETTERS_DIR)) {
    console.error(`\nThere is no "letters" folder in ${ROOT}.\n`);
    process.exit(1);
  }

  // Everything in the folder is a letter except the two files that are there to
  // explain the folder. Anything else misnamed still gets reported rather than
  // skipped, because a letter with a typo in its name should not just vanish.
  const files = fs
    .readdirSync(LETTERS_DIR)
    .filter(
      (f) =>
        f.toLowerCase().endsWith('.txt') &&
        !f.startsWith('_') &&
        f.toLowerCase() !== 'readme.txt',
    )
    .sort();

  if (files.length === 0) {
    console.error(
      '\nThere are no letters in the "letters" folder yet.\n\n' +
        'Make a copy of _TEMPLATE.txt, rename it letter3.txt, and put the date\n' +
        'and his message in it. Then run this again.\n',
    );
    process.exit(1);
  }

  const emoji = readEmojiMap();
  const problems = [];
  const warnings = [];
  const letters = [];

  for (const f of files) {
    const letter = readLetter(path.join(LETTERS_DIR, f), emoji, problems, warnings);
    if (letter) letters.push(letter);
  }

  if (problems.length) {
    console.error('\nSomething needs fixing before this can run:\n');
    problems.forEach((p) => console.error(` - ${p}\n`));
    console.error('Nothing has been changed. Fix the above and run it again.\n');
    process.exit(1);
  }

  const seen = new Map();
  for (const l of letters) {
    if (seen.has(l.id)) {
      console.error(
        `\nTwo files are both letter ${l.n}: ${seen.get(l.id)} and ${l.name}.\n` +
          'Rename one of them and run this again. Nothing has been changed.\n',
      );
      process.exit(1);
    }
    seen.set(l.id, l.name);
  }

  letters.sort((a, b) => a.n - b.n);

  console.log('');
  for (const l of letters) {
    const sheets = l.pages.map((p) => `${linesFor(p, emoji.standIns)}/${SHEET_LINES}`);
    console.log(`  ${l.name}  ->  Letter ${l.n}, ${l.date}`);
    console.log(`     ${l.pages.length} pages:  ${sheets.join('  ')}`);
    l.notes.forEach((n) => console.log(`     ${n}`));
    console.log('');
  }

  if (warnings.length) {
    console.log('  Worth a look:\n');
    warnings.forEach((w) => console.log(`   - ${w}\n`));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, render(letters), 'utf8');

  const total = letters.length;
  console.log(`  Saved. The game now has ${total} letter${total === 1 ? '' : 's'} in it.\n`);
}

try {
  main();
} catch (err) {
  console.error(`\nSomething went wrong and nothing was changed:\n\n  ${err.message}\n`);
  process.exit(1);
}

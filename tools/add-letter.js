// Turns the plain-text letters in letters/ into js/data/letterData.js.
//
// This is the whole reason a letter no longer needs anyone to write code. What
// goes in is his message, pasted as he sent it; what comes out is the game's
// data file, regenerated from scratch every run. Nothing here edits hand-written
// code, and re-running is always safe - if a generated file is ever damaged,
// running this again replaces it wholesale.
//
//   node tools/add-letter.js       (or double-click ADD-LETTER.bat, or use the
//                                   drop page from DROP-LETTER.bat)
//
// The rules it applies live in tools/letter-format.js, shared with the drop page
// so a preview can never disagree with what actually gets saved.
//
// It reports rather than guesses: everything it changes is named. The one thing
// it now decides on its own is a stand-in character for an emoji it has not seen
// before, which it takes from the Private Use Area and records in
// js/data/emojiData.js. That used to stop the run and need a person.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const F = require('./letter-format.js');

const ROOT = path.join(__dirname, '..');
const LETTERS_DIR = path.join(ROOT, 'letters');
const OUT = path.join(ROOT, 'js', 'data', 'letterData.js');

const COVER = { cover: 0xf7b6cb, coverDark: 0xe08fae };

// ---- reading one letter file ----------------------------------------------

function readLetter(file, registry, problems, warnings) {
  const name = path.basename(file);
  const num = name.match(/^letter(\d+)\.txt$/i);
  if (!num) {
    problems.push(
      `${name} is not named the way this tool expects.\n` +
        '   It has to be the word "letter" followed by a number, like letter3.txt',
    );
    return null;
  }

  const parsed = F.parseLetter(fs.readFileSync(file, 'utf8'));
  if (parsed.error === 'empty') {
    problems.push(`${name} is empty. It needs a date on the first line and his message below it.`);
    return null;
  }
  if (parsed.error === 'no-message') {
    // Whether the first line is a date decides which mistake this is: a letter
    // missing its message, or a file that is not a letter at all.
    const looksLikeDate = !F.checkDate(parsed.date)?.includes('not in the expected shape');
    problems.push(
      looksLikeDate
        ? `${name} has a date but no message under it.\n` +
          '   Leave a blank line after the date, then paste what he wrote.'
        : `${name} does not look like a letter. The first line should be the date,\n` +
          '   like Saturday 19/09/2026, then a blank line, then his message.\n' +
          `   Its first line is: "${parsed.date.slice(0, 60)}"`,
    );
    return null;
  }

  const warn = (msg) => warnings.push(`${name}: ${msg}`);
  const dateProblem = F.checkDate(parsed.date);
  if (dateProblem) warn(dateProblem);

  const result = F.clean(parsed.body, registry);

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

  const pages = F.toPages(result.text);
  if (pages.length === 0) {
    problems.push(`${name} has nothing left in it once the unusable characters were taken out.`);
    return null;
  }

  for (const [n, page] of pages.entries()) {
    // A run of emoji cannot wrap - the filler between them is deliberately not a
    // space, so a row of hearts never splits down the middle. That means a long
    // enough run is wider than the paper, and the line gets squeezed to fit
    // instead. Eleven in a row is where it starts, which no letter has come
    // close to, but being squeezed silently is not something to find out later.
    const longest = Math.max(
      ...F.wrapLines(F.widen(page, registry.standIns)).map((l) => l.length),
    );
    if (longest > F.LINE_CHARS) {
      warn(
        `paragraph ${n + 1} has a run of emoji too long to fit a line, so that line` +
          '\n     will be shrunk to fit and the emoji may touch. Splitting the run with' +
          '\n     a word or two between them is the fix.',
      );
    }

    const sheets = F.sheetsFor(page, registry.standIns);
    if (sheets > 1) {
      warn(
        `paragraph ${n + 1} is too long for one page, so it will be spread over ${sheets}.` +
          '\n     That is fine. If you would rather choose where it breaks, put a blank' +
          '\n     line in the middle of it.',
      );
    }
  }

  return {
    id: `letter${+num[1]}`,
    n: +num[1],
    name,
    date: parsed.date,
    pages,
    notes: result.notes,
    learned: result.learned,
  };
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
// blank for the real one to be drawn into. See js/data/emojiData.js.
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

// PUBLISH.bat asks for this rather than inventing one, so the history still says
// which letter went up even though nobody typed a message.
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

// Shared with the drop page, which needs the same work done without any of the
// printing. Returns what happened rather than deciding how to say it.
function build({ write = true } = {}) {
  if (!fs.existsSync(LETTERS_DIR)) throw new Error(`There is no "letters" folder in ${ROOT}.`);

  const files = fs
    .readdirSync(LETTERS_DIR)
    .filter(
      (f) =>
        f.toLowerCase().endsWith('.txt') && !f.startsWith('_') && f.toLowerCase() !== 'readme.txt',
    )
    .sort();

  const registry = F.readRegistry();
  const problems = [];
  const warnings = [];
  const letters = [];

  for (const f of files) {
    const letter = readLetter(path.join(LETTERS_DIR, f), registry, problems, warnings);
    if (letter) letters.push(letter);
  }

  const seen = new Map();
  for (const l of letters) {
    if (seen.has(l.id)) {
      problems.push(
        `Two files are both letter ${l.n}: ${seen.get(l.id)} and ${l.name}.\n` +
          '   Rename one of them.',
      );
    }
    seen.set(l.id, l.name);
  }

  letters.sort((a, b) => a.n - b.n);

  // Forget any automatically assigned emoji that no letter uses any more.
  //
  // Without this the registry only ever grows: a letter dropped in to look at
  // and then deleted, or a typo that happened to be a pictograph, would each
  // leave an entry behind for good. The twelve keyboard ones are never touched -
  // the two books are hand-written against them and are not scanned here, so
  // "unused" cannot be concluded about them.
  const usedStandIns = new Set(letters.flatMap((l) => [...l.pages.join('')]));
  for (const standIn of [...registry.standIns]) {
    const typeable = registry.typeable.includes(standIn);
    if (typeable || usedStandIns.has(standIn)) continue;
    registry.standIns.splice(registry.standIns.indexOf(standIn), 1);
    for (const [glyph, c] of registry.toStandIn) {
      if (c === standIn) registry.toStandIn.delete(glyph);
    }
  }

  // Nothing is written if anything at all was wrong, so a bad run can never
  // leave the game half-updated.
  if (write && problems.length === 0) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, render(letters), 'utf8');
    fs.writeFileSync(F.EMOJI_DATA, F.renderRegistry(registry), 'utf8');
  }

  return { letters, problems, warnings, registry, files };
}

function main() {
  if (process.argv.includes('--message')) {
    console.log(commitMessage());
    return;
  }

  if (!fs.existsSync(LETTERS_DIR)) {
    console.error(`\nThere is no "letters" folder in ${ROOT}.\n`);
    process.exit(1);
  }

  const result = build();

  if (result.files.length === 0) {
    console.error(
      '\nThere are no letters in the "letters" folder yet.\n\n' +
        'Make a copy of _TEMPLATE.txt, rename it letter3.txt, and put the date\n' +
        'and his message in it. Then run this again.\n',
    );
    process.exit(1);
  }

  if (result.problems.length) {
    console.error('\nSomething needs fixing before this can run:\n');
    result.problems.forEach((p) => console.error(` - ${p}\n`));
    console.error('Nothing has been changed. Fix the above and run it again.\n');
    process.exit(1);
  }

  console.log('');
  for (const l of result.letters) {
    const sheets = l.pages.map((p) => `${F.linesFor(p, result.registry.standIns)}/${F.SHEET_LINES}`);
    console.log(`  ${l.name}  ->  Letter ${l.n}, ${l.date}`);
    console.log(`     ${l.pages.length} pages:  ${sheets.join('  ')}`);
    l.notes.forEach((n) => console.log(`     ${n}`));
    console.log('');
  }

  if (result.warnings.length) {
    console.log('  Worth a look:\n');
    result.warnings.forEach((w) => console.log(`   - ${w}\n`));
  }

  const total = result.letters.length;
  console.log(`  Saved. The game now has ${total} letter${total === 1 ? '' : 's'} in it.\n`);
}

module.exports = { build, commitMessage, render, LETTERS_DIR, OUT };

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error(`\nSomething went wrong and nothing was changed:\n\n  ${err.message}\n`);
    process.exit(1);
  }
}

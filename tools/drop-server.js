// The local helper behind the drop page.
//
// Serves the game from this computer and does the work a letter needs: preview
// it, add it, publish it. Started by DROP-LETTER.bat.
//
// Why local rather than on the website: writing to the repo needs a GitHub key,
// and the website is a static site whose every line anyone can read, so a key
// cannot live there - with or without a password in front of it. On this
// computer git is already signed in, so none is needed at all. Nothing secret
// exists anywhere, which is a much better place to be than guarding one.
//
// It binds to 127.0.0.1, so nothing outside this machine can reach it, and every
// action carries a token minted at start-up and handed only to the page it
// serves - so a stray website open in another tab cannot quietly ask it to
// publish.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const F = require('./letter-format.js');
const { build, commitMessage } = require('./add-letter.js');

const ROOT = path.join(__dirname, '..');
const LETTERS_DIR = path.join(ROOT, 'letters');
const PORT = 4173;
const LIVE_URL = 'https://headfirstdownhill.github.io/heartbound/';

// Handed to the page it serves and required on every action.
const TOKEN = crypto.randomBytes(16).toString('hex');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
};

// ---- helpers ---------------------------------------------------------------

const send = (res, code, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(body);
};

const json = (res, code, obj) => send(res, code, JSON.stringify(obj));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      // A letter is a few kilobytes. Anything of this size is a mistake or a
      // file that is not text at all.
      if (data.length > 2_000_000) reject(new Error('That file is far too big to be a letter.'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const git = (args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });

function nextLetterNumber() {
  const used = fs
    .readdirSync(LETTERS_DIR)
    .map((f) => f.match(/^letter(\d+)\.txt$/i))
    .filter(Boolean)
    .map((m) => +m[1]);
  return used.length ? Math.max(...used) + 1 : 1;
}

// ---- the preview -----------------------------------------------------------

// Runs the real conversion against a throwaway copy of the emoji registry, so a
// letter that is only being looked at never teaches the game anything or leaves
// a trace. Nothing here touches disk.
function preview(text, number) {
  const parsed = F.parseLetter(text);
  if (parsed.error === 'empty') {
    return { ok: false, error: 'That file is empty. It needs a date on the first line and his message under it.' };
  }
  if (parsed.error === 'no-message') {
    // Whether the first line is a date decides which mistake this actually is:
    // a letter missing its message, or a file that is not a letter at all.
    // Saying "it has a date but no message" about a spreadsheet helps nobody.
    const looksLikeDate = !F.checkDate(parsed.date)?.includes('not in the expected shape');
    return {
      ok: false,
      error: looksLikeDate
        ? 'That has a date but no message under it. Leave a blank line after the date, then paste what he wrote.'
        : 'That does not look like a letter. The first line should be the date, like ' +
          `Saturday 19/09/2026, then a blank line, then his message.\nIts first line is: "${parsed.date.slice(0, 60)}"`,
    };
  }

  const registry = F.readRegistry();
  const known = new Set(registry.standIns);
  const result = F.clean(parsed.body, registry);
  const pages = F.toPages(result.text);
  if (!pages.length) {
    return { ok: false, error: 'There is nothing left in that once the characters the game cannot draw were taken out.' };
  }

  const warnings = [];
  const dateProblem = F.checkDate(parsed.date);
  if (dateProblem) warnings.push(dateProblem.replace(/\n\s+/g, ' '));

  // Dropping the same letter twice is an easy thing to do and there is nothing
  // in the shape of the file to stop it - it would just become the next number
  // and appear on the shelf twice.
  const squash = (s) => s.replace(/\s+/g, ' ').trim();
  for (const f of fs.readdirSync(LETTERS_DIR)) {
    if (!/^letter\d+\.txt$/i.test(f)) continue;
    const other = F.parseLetter(fs.readFileSync(path.join(LETTERS_DIR, f), 'utf8'));
    if (other.body && squash(other.body) === squash(parsed.body)) {
      warnings.push(
        `This is word for word the same as ${f}, which is already in the game. ` +
          'Adding it will put the same letter on the shelf twice.',
      );
    }
  }
  for (const [c, n] of Object.entries(result.literals)) {
    warnings.push(`Removed ${n} "${c}" he typed - that character is reserved for an emoji.`);
  }
  if (result.unknownOther.length) {
    warnings.push(`Removed characters the writing cannot show: ${result.unknownOther.join(' ')}`);
  }

  // What the page needs to draw the sheets: the wrapped lines exactly as the
  // game will break them, and the emoji to put back into the blanks.
  const glyphFor = {};
  for (const [glyph, standIn] of registry.toStandIn) glyphFor[standIn] = glyph;

  const sheets = [];
  pages.forEach((page, i) => {
    const lines = F.wrapLines(F.widen(page, registry.standIns));
    const per = F.SHEET_LINES;
    if (lines.length <= per) {
      sheets.push({ lines, from: i + 1, split: false });
    } else {
      // Same carry-on rule the reader uses: spread evenly rather than filling
      // the first sheet to the brim and leaving a stub.
      const count = Math.ceil(lines.length / per);
      const each = Math.ceil(lines.length / count);
      for (let s = 0; s < lines.length; s += each) {
        sheets.push({ lines: lines.slice(s, s + each), from: i + 1, split: true });
      }
      warnings.push(
        `Paragraph ${i + 1} is too long for one page, so it is spread over ${count}. ` +
          'That is fine - put a blank line in it if you would rather choose where it breaks.',
      );
    }
    if (lines.some((l) => l.length > F.LINE_CHARS)) {
      warnings.push(
        `Paragraph ${i + 1} has a run of emoji too long to fit a line, so it will be squeezed.`,
      );
    }
  });

  return {
    ok: true,
    number,
    date: parsed.date,
    notes: result.notes,
    warnings,
    learned: result.learned,
    known: [...known],
    glyphFor,
    maxLines: F.SHEET_LINES,
    lineChars: F.LINE_CHARS,
    sheets,
  };
}

// ---- actions ---------------------------------------------------------------

function addLetter(text, number) {
  const check = preview(text, number);
  if (!check.ok) return check;

  const file = path.join(LETTERS_DIR, `letter${number}.txt`);
  const body = String(text).replace(/\r\n?/g, '\n').trim() + '\n';
  fs.writeFileSync(file, body, 'utf8');

  let result;
  try {
    result = build();
  } catch (err) {
    fs.unlinkSync(file);
    return { ok: false, error: `${err.message}\nThe letter was not kept.` };
  }
  if (result.problems.length) {
    fs.unlinkSync(file);
    return { ok: false, error: result.problems.join('\n') + '\nThe letter was not kept.' };
  }

  // The single-file copy, so double-clicking heartbound.html shows it too.
  let built = '';
  try {
    built = execFileSync(
      'powershell',
      ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-File', path.join(ROOT, 'build.ps1')],
      { cwd: ROOT, encoding: 'utf8' },
    ).trim();
  } catch (err) {
    return {
      ok: true,
      warning: `The letter was saved, but rebuilding the offline copy failed:\n${err.message}`,
      number,
      total: result.letters.length,
    };
  }

  return { ok: true, number, total: result.letters.length, built, learned: check.learned };
}

// The site reads letters.json and copies it over the built-in letters, so the
// two must agree before anything goes out. If they do not, publishing would
// remove a letter from the shelf rather than add one - which is how a letter
// once appeared to vanish after being added successfully.
function checkInStep() {
  const asJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'js', 'data', 'letters.json'), 'utf8'));
  const asModule = fs.readFileSync(path.join(ROOT, 'js', 'data', 'letterData.js'), 'utf8');
  const inJson = Object.keys(asJson.letters).sort();
  const inModule = [...asModule.matchAll(/^ {2}(letter\d+): \{/gm)].map((m) => m[1]).sort();
  if (inJson.join(',') === inModule.join(',')) return null;
  return (
    'The two copies of the letters do not match, so nothing was published.\n' +
    `  letters.json has:   ${inJson.join(' ') || '(none)'}\n` +
    `  letterData.js has:  ${inModule.join(' ') || '(none)'}\n` +
    'Close this window, double-click DROP-LETTER.bat again, and re-add the letter.'
  );
}

function publish() {
  const mismatch = checkInStep();
  if (mismatch) return { ok: false, error: mismatch };

  const status = git(['status', '--porcelain', '-uall']).trim();
  if (!status) return { ok: false, error: 'Nothing has changed since the last time, so there is nothing to publish.' };

  const message = commitMessage();
  git(['add', '-A']);
  git(['commit', '-m', message]);
  git(['push', 'origin', 'HEAD']);
  return { ok: true, message, url: LIVE_URL };
}

// Confirms the change is genuinely on the website rather than claiming it after
// a guess at how long GitHub takes.
async function waitForLive(expect) {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`${LIVE_URL}js/data/letterData.js?n=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok && (await res.text()).includes(`letter${expect}: {`)) {
        return { ok: true, seconds: i * 5 };
      }
    } catch {
      // Offline or GitHub mid-deploy. Keep waiting.
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  return { ok: false };
}

// ---- the server ------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/__drop/')) {
    // The token is only ever given to the page this server itself serves, so a
    // website open in another tab cannot reach these.
    if (req.headers['x-drop-token'] !== TOKEN) return json(res, 403, { error: 'not allowed' });

    try {
      if (url.pathname === '/__drop/status') {
        return json(res, 200, { next: nextLetterNumber(), live: LIVE_URL });
      }
      if (req.method !== 'POST') return json(res, 405, { error: 'wrong method' });

      const body = JSON.parse(await readBody(req));

      if (url.pathname === '/__drop/preview') {
        return json(res, 200, preview(body.text, body.number ?? nextLetterNumber()));
      }
      if (url.pathname === '/__drop/add') {
        return json(res, 200, addLetter(body.text, body.number ?? nextLetterNumber()));
      }
      if (url.pathname === '/__drop/publish') {
        const out = publish();
        if (!out.ok) return json(res, 200, out);
        const live = await waitForLive(body.number ?? nextLetterNumber() - 1);
        return json(res, 200, { ...out, live });
      }
    } catch (err) {
      return json(res, 200, { ok: false, error: err.message });
    }
    return json(res, 404, { error: 'no such thing' });
  }

  // Everything else is the game itself, straight off disk.
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) return send(res, 403, 'no');

  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, 'not found', 'text/plain');

    // The drop page is injected here rather than being part of the game, so the
    // public site carries no trace of it at all - not a button, not a line of
    // code, nothing to find.
    if (rel === '/index.html') {
      const inject = `<script>window.__DROP_TOKEN=${JSON.stringify(TOKEN)};</script>\n<script type="module" src="/tools/AddLetterPanel.js"></script>\n</body>`;
      data = Buffer.from(String(data).replace('</body>', inject), 'utf8');
    }
    send(res, 200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
});

// Double-clicking DROP-LETTER.bat twice is an easy thing to do, and the bare
// crash it used to give was a page of stack trace about EADDRINUSE.
server.on('error', (err) => {
  console.log('');
  if (err.code === 'EADDRINUSE') {
    console.log('  This is already running in another window.');
    console.log('');
    console.log('  Switch to that window and use it, or close it and start again.');
    console.log(`  The page is at  http://localhost:${PORT}/`);
  } else {
    console.log(`  It could not start: ${err.message}`);
    console.log('');
    console.log('  You can still add letters with ADD-LETTER.bat and PUBLISH.bat.');
  }
  console.log('');
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}/`;
  console.log('');
  console.log('  The game is running on this computer.');
  console.log('');
  console.log(`      ${url}`);
  console.log('');
  console.log('  It should have opened by itself. In the game, press  Ctrl + Alt + B');
  console.log('  and a button will appear.');
  console.log('');
  console.log('  Leave this window open while you use it. Close it when you are done.');
  console.log('');
  if (process.argv.includes('--no-open')) return;
  try {
    execFileSync('cmd', ['/c', 'start', '', url]);
  } catch {
    // No browser to open; the address above still works.
  }
});

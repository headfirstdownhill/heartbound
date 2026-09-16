// The hidden door for adding a letter.
//
// Ctrl+Alt+B puts a button on screen; the button opens a panel you drop your
// .txt onto. It previews the letter exactly as the game will lay it out, adds
// it, and publishes it.
//
// This file is NOT part of the game - which is why it lives in tools/ rather
// than js/. It is never listed in build.ps1 and never referenced by
// index.html; tools/drop-server.js injects it when it serves the game from this
// computer. So the public website carries no trace of any of
// this: no button, no shortcut, no code to read. It also cannot work anywhere
// else, because everything it does goes through that local helper.
//
// Plain DOM rather than a Phaser scene, because dropping a file on a canvas is
// a browser thing, not a game thing, and this has no business being drawn in
// pixel art.

const TOKEN = window.__DROP_TOKEN;
if (TOKEN) {
  const call = async (what, body) => {
    const res = await fetch(`/__drop/${what}`, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', 'X-Drop-Token': TOKEN },
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.json();
  };

  const css = `
    #addletter-btn {
      position: fixed; right: 16px; bottom: 16px; z-index: 99998;
      font: 600 13px/1 ui-monospace, Consolas, monospace; letter-spacing: 1px;
      background: #e0559a; color: #2a0f1d; border: 3px solid #2a0f1d;
      padding: 12px 16px; cursor: pointer; box-shadow: 0 4px 0 #2a0f1d;
    }
    #addletter-btn:active { transform: translateY(3px); box-shadow: none; }
    #addletter { position: fixed; inset: 0; z-index: 99999; display: flex;
      background: rgba(10,8,16,.93); color: #f2eefb; overflow: auto;
      font: 14px/1.5 ui-monospace, Consolas, monospace; }
    #addletter .wrap { margin: auto; padding: 24px; width: min(860px, 94vw); }
    #addletter h2 { font-size: 16px; letter-spacing: 2px; color: #ff4d6d; margin: 0 0 4px; }
    #addletter .sub { color: #9a94b0; margin: 0 0 18px; }
    #addletter .drop { border: 3px dashed #6b6482; padding: 34px 18px; text-align: center;
      color: #b9b2cd; cursor: pointer; }
    #addletter .drop.over { border-color: #ff4d6d; color: #ffe08a; background: #1b1622; }
    #addletter textarea { width: 100%; min-height: 110px; margin-top: 12px; background: #15121c;
      color: #f2eefb; border: 2px solid #3a3350; padding: 10px; font: inherit; }
    #addletter .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-top: 14px; }
    #addletter button.act { font: inherit; letter-spacing: 1px; padding: 11px 18px; cursor: pointer;
      border: 3px solid #2a0f1d; background: #ffd23f; color: #2a0f1d; box-shadow: 0 4px 0 #2a0f1d; }
    #addletter button.act[disabled] { opacity: .4; cursor: default; box-shadow: none; }
    #addletter button.ghost { background: none; border: 2px solid #4a4363; color: #b9b2cd;
      box-shadow: none; padding: 10px 14px; font: inherit; cursor: pointer; }
    #addletter .note { color: #9fe0a0; margin: 3px 0; }
    #addletter .warn { color: #ffcf6a; margin: 3px 0; }
    #addletter .bad { color: #ff8091; margin: 3px 0; white-space: pre-wrap; }
    #addletter .sheets { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    #addletter .sheet { background: #f6f2e8; color: #241f2e; width: 250px; min-height: 300px;
      border: 5px solid #f7b6cb; padding: 14px 12px; position: relative;
      font: 12px/1.55 ui-monospace, Consolas, monospace; white-space: pre-wrap; word-break: break-word; }
    #addletter .sheet .stamp { color: #8b8399; font-size: 10px; text-align: right; margin-bottom: 8px; }
    #addletter .sheet .num { position: absolute; bottom: 4px; right: 8px; color: #b0a9bd; font-size: 10px; }
    #addletter .sheet.full { border-color: #ffcf6a; }
    #addletter .log { margin-top: 14px; white-space: pre-wrap; color: #b9b2cd; }
  `;

  let panel = null;
  let button = null;
  let current = null; // { text, number }

  // Phaser listens for keys on the window, so every key typed into the panel was
  // also reaching the game behind it - and the menu starts the game on Enter, so
  // pressing Enter for a new paragraph jumped to the character screen mid-letter.
  //
  // Two guards, because either alone can be defeated. The keyboard manager is
  // switched off while the panel is open, and keys are stopped at the panel on
  // the way out. Stopping them at the panel rather than at the window is the
  // important part: the event still reaches the text box it was typed into, and
  // only its journey onward to the game is cut.
  const gameKeys = (on) => {
    try {
      if (window.game?.input?.keyboard) window.game.input.keyboard.enabled = on;
    } catch {
      // No game on the page, or not started yet. Nothing to switch off.
    }
  };
  const holdKey = (ev) => ev.stopPropagation();

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  // Puts the real emoji back into the blanks their stand-ins left, so the
  // preview reads the way the page will.
  const show = (line, glyphFor) => {
    let out = '';
    for (const c of line) {
      if (glyphFor[c]) out += glyphFor[c];
      else if (c === '_') out += '';
      else out += c;
    }
    return out;
  };

  function open() {
    if (panel) return;
    panel = el('div');
    panel.id = 'addletter';
    const wrap = el('div', 'wrap');
    panel.appendChild(wrap);

    wrap.appendChild(el('h2', null, 'ADD A LETTER'));
    const sub = el(
      'p',
      'sub',
      'Drop any .txt file below, or paste what you wrote. No particular layout needed.',
    );
    wrap.appendChild(sub);

    const drop = el('div', 'drop', 'Drop the file here, or click to pick one');
    wrap.appendChild(drop);

    const paste = el('textarea');
    paste.placeholder =
      'Or just paste what you wrote.\n\nA blank line between paragraphs starts a new page.\nIf you want a date on the first sheet, put it on the very first line, like:  Saturday 19/09/2026';
    wrap.appendChild(paste);

    const row = el('div', 'row');
    const addBtn = el('button', 'act', 'ADD TO THE GAME');
    const pubBtn = el('button', 'act', 'PUBLISH');
    const closeBtn = el('button', 'ghost', 'CLOSE');
    addBtn.disabled = true;
    pubBtn.disabled = true;
    row.append(addBtn, pubBtn, closeBtn);
    wrap.appendChild(row);

    const log = el('div', 'log');
    const sheets = el('div', 'sheets');
    wrap.append(log, sheets);

    const say = (msg, cls = 'log') => {
      const line = el('div', cls, msg);
      log.appendChild(line);
      return line;
    };

    async function load(text) {
      log.textContent = '';
      sheets.textContent = '';
      addBtn.disabled = true;
      pubBtn.disabled = true;

      const status = await call('status');
      const number = status.next;
      const out = await call('preview', { text, number });
      if (!out.ok) {
        say(out.error, 'bad');
        return;
      }
      current = { text, number };

      say(out.date ? `Letter ${number}  -  ${out.date}` : `Letter ${number}  -  no date on it`);
      say(`${out.sheets.length} page${out.sheets.length === 1 ? '' : 's'}`);
      out.notes.forEach((n) => say(n, 'note'));
      out.warnings.forEach((w) => say(w, 'warn'));

      out.sheets.forEach((sheet, i) => {
        const div = el('div', 'sheet' + (sheet.lines.length >= out.maxLines ? ' full' : ''));
        if (i === 0 && out.date) div.appendChild(el('div', 'stamp', out.date));
        div.appendChild(
          document.createTextNode(sheet.lines.map((l) => show(l, out.glyphFor)).join('\n')),
        );
        div.appendChild(el('div', 'num', `${sheet.lines.length}/${out.maxLines}`));
        sheets.appendChild(div);
      });

      addBtn.disabled = false;
    }

    // --- getting the text in ---
    const picker = el('input');
    picker.type = 'file';
    picker.accept = '.txt,text/plain';
    picker.style.display = 'none';
    wrap.appendChild(picker);

    const readFile = (file) => {
      if (!file) return;
      if (file.size > 2_000_000) {
        say('That file is far too big to be a letter.', 'bad');
        return;
      }
      const r = new FileReader();
      r.onload = () => load(String(r.result));
      r.onerror = () => say('That file could not be read.', 'bad');
      r.readAsText(file, 'utf-8');
    };

    drop.addEventListener('click', () => picker.click());
    picker.addEventListener('change', () => readFile(picker.files[0]));
    ['dragenter', 'dragover'].forEach((e) =>
      drop.addEventListener(e, (ev) => {
        ev.preventDefault();
        drop.classList.add('over');
      }),
    );
    ['dragleave', 'drop'].forEach((e) =>
      drop.addEventListener(e, () => drop.classList.remove('over')),
    );
    drop.addEventListener('drop', (ev) => {
      ev.preventDefault();
      readFile(ev.dataTransfer.files[0]);
    });
    let typing = null;
    const onType = () => {
      clearTimeout(typing);
      typing = setTimeout(() => {
        if (paste.value.trim()) load(paste.value);
      }, 500);
    };
    paste.addEventListener('input', onType);
    paste.addEventListener('change', onType);

    // The whole panel accepts a drop, not just the dashed box - aiming is not
    // something anyone should have to do.
    panel.addEventListener('dragover', (ev) => ev.preventDefault());
    panel.addEventListener('drop', (ev) => {
      ev.preventDefault();
      if (ev.dataTransfer.files[0]) readFile(ev.dataTransfer.files[0]);
    });

    // --- the two actions ---
    addBtn.addEventListener('click', async () => {
      addBtn.disabled = true;
      const line = say('Adding it...');
      const out = await call('add', current);
      if (!out.ok) {
        line.textContent = '';
        say(out.error, 'bad');
        addBtn.disabled = false;
        return;
      }
      line.textContent = `Added. The game now has ${out.total} letters in it.`;
      if (out.learned?.length) say(`Taught the game: ${out.learned.join(' ')}`, 'note');
      if (out.warning) say(out.warning, 'warn');
      say('Nothing is online yet. Press PUBLISH when you are happy with it.', 'warn');
      pubBtn.disabled = false;
    });

    pubBtn.addEventListener('click', async () => {
      pubBtn.disabled = true;
      const line = say('Publishing, then waiting for the website to catch up...');
      const out = await call('publish', current);
      if (!out.ok) {
        line.textContent = '';
        say(out.error, 'bad');
        pubBtn.disabled = false;
        return;
      }
      line.textContent = `Published as "${out.message}".`;
      if (out.live?.ok) say(`It is live now. ${out.url}`, 'note');
      else
        say(
          `Pushed, but the website has not updated yet. Give it a few minutes: ${out.url}`,
          'warn',
        );
    });

    const shut = () => {
      ['keydown', 'keyup', 'keypress'].forEach((e) => panel.removeEventListener(e, holdKey));
      panel.remove();
      panel = null;
      gameKeys(true);
    };
    closeBtn.addEventListener('click', shut);
    panel.addEventListener('keydown', (ev) => ev.key === 'Escape' && shut());

    ['keydown', 'keyup', 'keypress'].forEach((e) => panel.addEventListener(e, holdKey));
    gameKeys(false);

    document.body.appendChild(panel);
    panel.tabIndex = -1;
    panel.focus();
  }

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // The door. Nothing is on screen until this is pressed.
  window.addEventListener('keydown', (ev) => {
    if (!ev.ctrlKey || !ev.altKey || ev.key.toLowerCase() !== 'b') return;
    ev.preventDefault();
    if (panel) return;
    if (button) {
      button.remove();
      button = null;
      return;
    }
    button = el('button', null, 'ADD A LETTER');
    button.id = 'addletter-btn';
    button.addEventListener('click', open);
    document.body.appendChild(button);
  });
}

// Fetches the newest letters before the game starts, going round the cache.
//
// Why this has to exist: GitHub Pages serves everything with
// `Cache-Control: max-age=600`. So for ten minutes after a letter is published,
// a browser that has the site open keeps using the copy it already has, and the
// new letter simply is not there. The file on the server is right; the browser
// is not looking at it. That is confusing enough on its own - "I added it and it
// is not there" - and worse when the person checking is the one who just
// published it.
//
// So the letters are ALSO written as plain data in letters.json, and this pulls
// that with `cache: 'no-store'` and a changing query, which no cache will answer
// from. The result is copied over the built-in tables, in place, so everything
// already holding a reference to them sees the new letters.
//
// Everything else - the game, the art, the two books - can stay cached. Only
// what changes daily is fetched.
//
// If the fetch fails, nothing happens and the built-in letters are used. That is
// the normal case for heartbound.html opened by double-clicking, where there is
// no server to ask and `fetch` on a file:// path is refused. The game must not
// care, so this never throws and never blocks.

import { LETTER_BOOKS } from './letterData.js';
import { EMOJI } from './emojiData.js';

// Relative to the page rather than to this module, because the single-file build
// strips module syntax and `import.meta` in a plain script is a syntax error
// that would take the whole game down.
const SOURCE = 'js/data/letters.json';

// Contents swapped rather than the object replaced: BookScene built its BOOKS
// table out of these at load time, so a new object here would be ignored.
function replace(target, next) {
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, next);
}

export async function refreshLiveData() {
  try {
    // The game waits for this, so it cannot be allowed to wait forever. On a
    // bad connection four seconds is the most this is worth; after that the
    // built-in letters are better than a black screen.
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 4000);
    const res = await fetch(`${SOURCE}?v=${Date.now()}`, {
      cache: 'no-store',
      signal: stop.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) return false;
    const data = await res.json();
    if (!data || typeof data.letters !== 'object' || typeof data.emoji !== 'object') return false;
    // Both or neither. A letter can carry an emoji the built-in table has never
    // heard of, and half an update would draw it as a blank.
    replace(EMOJI, data.emoji);
    replace(LETTER_BOOKS, data.letters);
    return true;
  } catch {
    return false;
  }
}

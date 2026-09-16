// GENERATED FILE - do not edit it by hand.
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
export const EMOJI = {
  '^': '❤️',
  '@': '😁',
  '#': '😎',
  '%': '🤬',
  '$': '🤤',
  '&': '😉',
  '*': '🥳',
  '+': '🪼',
  '=': '😋',
  ';': '💏',
  '|': '🤔',
  '{': '😴',
};

// The twelve above, and only those, are characters he could actually type. A
// stand-in that is reachable from a keyboard has to be taken out of his writing
// before the swap, or a '&' he wrote comes out as a wink. Everything assigned
// after this point is unreachable, so it never needs that treatment.
export const TYPEABLE_STAND_INS = '^@#%$&*+=;|{';

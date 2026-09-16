import { GAME_W } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { audio } from '../systems/AudioManager.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton, drawChunkyPanel, meadowBackdrop } from '../ui/MenuWidgets.js';
import { wrapText } from '../ui/SpeechBubble.js';
import { LETTER_BOOKS } from '../data/letterData.js';
import { EMOJI } from '../data/emojiData.js';

// What the book says, in order — one string per page.
//
// The words are yours, kept exactly as written, bar one slip of the finger. Only
// the breaks are a choice: they land on a sentence end wherever the writing
// allowed it and on a clause where it did not, balanced so every page carries
// about the same amount and none is crammed or left nearly bare. The only
// thing here with no character behind it is the heart you signed off with,
// which is why the last page ends on '~' — see the note in the font table.
//
// A string is a page. If one ever grows past what a sheet holds the reader
// carries it on evenly, but these are already sized to fit, so what is written
// here is what gets turned. Newlines are not honoured — start a new string.
const PAGES = [
  "Hi my sweetheart Jory! I met you on 11th July, on the first hour of a new day. The most amazing girl to ever exist, the prettiest, the cutest, the most beautiful and the sweetest girl.",

  "I find it so crazy how we were able to get along so well on the first day. Not even the first day, during the first 2 hours of meeting and talking to each other we got along so well.",

  "Somehow we were already aligning so much, finding so many similar stuff about each other right at the beginning, like us using that bot in the server for the first time.",

  "On top of that, I stayed up till 5am, talking to you. The nights before that all I did was sleep early, wake up, do my regular things, work, stress out, pray, eat, sleep.",

  "An autopilot day, nothing to highlight. And suddenly I meet you. By Allah I mean this, meeting you was like seeing a new star appear in the universe that just shone so bright and so beautifully.",

  "I couldn't believe my life, my eyes, my heart, that I had you to talk to, I had YOU, my amazing Jory, to spend time with. I've been waiting my whole life for you and I never knew I was until I met you.",

  "Ever since I met you, all I've known was spending time with you Jory, all I've known is looking forward to you, to your words, to your voice, to your face, to your eyes, to your lips, to the softness in your words, to your love.",

  "I find it so amazing that we both have unique birthdays, mine being after new years, yours being on 11/11, both of us having 5 names, saying the same things at the same time, we share the same thoughts, the same love,",

  "the way we sneeze when we look up at the sun, how our keyboards are equally messed up every night before we sleep or after we wake up, we understand each other so deeply despite knowing each other for the shortest time possible, yet it feels like I've known you my whole life.",

  "Even our song is love letter, which we found out after bonding over that movie I hold so close to my heart. I'm so glad I got to share that with you sweetheart. Even the song that I made, love letter, its first name was roses,",

  "the flower that you love and the meaning of your name, all before I even met you. Maybe I sound stupid, like a conspiracy theorist, but I can't help but think that you and I were going to meet one way or another always.",

  "The day I saw you, Wallah, my heart skipped a beat, it became so light and it started beating so much. Seeing your eyes, your skin, your eyebrows, your hair and the way it flowed across your face and down the sides of your face,",

  "the glasses you wore and the way they fit around your eyes, your lips and how perfect they look, the super sharp jawline that you have, the softness of your skin, the softness of your hands and the elegance of your nails,",

  "the elegance of you, and the way you described your body and the way you look, I couldn't help but think of how attractive you are, how beautiful you are, how elegant you are, how perfect you are Jory.",

  "I could never be sick of seeing you, I'll forever love seeing you, even if it's just the lashes on your eyes, or a strand of your hair. The way you carry yourself with so much beauty, so much elegance and perfection, amazes me, all I can do is just be in awe of you,",

  "be starstruck about you and fall in love with you all over again. I think the reason, and the moment we bonded so deeply was because of that movie, 18x2 beyond youthful days. You cried just as I did the first time I watched it.",

  "And it meant so much to me that you spent that time watching it with me, that night means so much more than you know to me sweetheart. There's just something between us and there has been something between us since forever that pulls us closer together.",

  "Ever since that day, that night of watching that movie together, all we knew was loving each other, and it's been that way since that day, and I love it. I love the way you listen to my stories or what I say about Islam to you. The way you listen so deeply,",

  "with interest and enthusiasm, the way you always find my stories funny, the way you love hearing them and are so present with me in every moment we are together, and how you even tell me your stories, and everything that you think.",

  "It makes me so happy. It's beautiful to me, and I hope that we'll always spend that kind of time together. The way you hold me up, the way you keep me on my feet, standing, with all your love, with all your warmth, it brought me to tears with how you do it all so amazingly.",

  "You're the only one that has stayed with me, held me, guided me through all the stress and constant overthinking that I had about my future, about everything around me.",

  "I've never seen such an amazing display of just being there for someone the way you have done it for me, and I'll always cherish that Jory. I love you for it, I love you for everything you are and have been to me. I love you my love.",

  "Every time I talk to you, my heart feels full, excited and so warm, so comfortably warm. Behind the screen while I text you, I laugh lightly, out of cherishment and love for you, because I can't contain the joy you give me from the way you are with me.",

  "I can't believe that you made me cry. You made me cry out of gratitude, out of love, out of feeling so cared for, by you Jory, only by you. I honestly don't know where I'd be if I never met you, I don't know how I'd make it past all that stress, all that worry,",

  "all that pressure without you. The way you care for me, the way you're strict with me, the way you scold me, the way you love me, the way you get mad at me, and the way you're able to make me do my best even when I'm not doing so well, it's so amazing to me sweetheart.",

  "It really is. You've got such a special gift within you, within your heart that you're able to change the way I am, with just your words, with just your love. You'd be such an amazing mother, such an amazing woman, such an amazing human being.",

  "I don't know what I'd do without you, I can't even see myself without you anymore. I love you so much. I love you Jory. The way we align so well, the way we talk, the music we listen to, the way we say and do the same things at the same time, it's all so beautiful to me.",

  "I hope you always love me, today, tomorrow, day after tomorrow, next week, next month, next year, next decade, next century, forever, because I'll always love you, forever my love. I hope we are together in the future, in love.",

  "I love you Jory, and I will never stop being a better man for you, I'll never stop loving you, never stop writing about you, never stop adoring you, never stop thinking about you, for the rest of my life, my sweetest, most beautiful sweetheart.",

  "I love you Jory, my pretty girl ~",
];

// The second book, written the night before she went back to school.
//
// Same rules as above: your words, your order, your line of thought. The only
// changes are the ones a pen would have made anyway — 'im' to 'I'm', 'dont' to
// 'don't', a lowercase 'i' to 'I'. Nothing rephrased, nothing tidied, nothing
// added.
//
// The emoji are yours too, and they are the real ones — '^' '@' '#' '%' '$' '&'
// '*' are stand-ins that the page swaps for the actual character, drawn by
// whatever emoji font the device has. See EMOJI below for why they cannot just
// be typed in here. One stand-in is one emoji, so the runs you wrote survive at
// the length you wrote them and still fit the column.
const SCHOOL_PAGES = [
  "Hi my baby, I was thinking of giving this to you while you're sleeping, but since this message is related to your school, I don't want to send it to you while you're sleeping and let this be the first thing you read.",

  "I know how much the school stuff stresses you out or bothers you. So since you have school tomorrow, I know today you'll think of it and maybe stress out or feel really anxious or nervous, so I'll send this message to you when today you feel that way @@",

  "I love you, that's the first thing I want you to know sweetheart. I love you so dearly, so deeply, and so so much baby.",

  "I know that it's been a while since you went to school that even writing with a pen or pencil might feel super weird.. like you might not even remember how to write or how your handwriting goes.",

  "I know a lot can go through your head, but don't worry baby, that's completely normal and it happens because you're entering a new grade, look at you growing baby ^*",

  "I'm so proud of you! You've made it so far already in school despite all of those hard times, you did so much hard work baby to get to where you are now.",

  "If I'm this proud, your parents must be even more proud of you baby.",

  "You're going to be anticipating a lot of things which is why you might feel anxious or nervous, and maybe you might feel a heavy heart, maybe you do right now, and that's okay baby, feel it.",

  "Let your heart be heavy, that means your heart is alive and tender, just the way it should be sweetheart ^",

  "Don't think so hard about tomorrow okay? It's the first day, not much happens on the first day anyway baby, if anything, it's just like going to the mall and coming back home quick. So take it really easy baby.",

  "And if somehow your teachers are super evil %% and they give you homework, come and give it to me immediately, I will help you SOLVE IT while you freshen up and get all dressed into new comfortable clothes,",

  "into your pretty black top and comfortable pyjamas, and then you better eat and drink plenty of water.",

  "I don't want you to at all be stressed out about us, I'm really understanding about all of this baby I promise. I've been through all the feelings you are feeling with school and your last year, and I want you to enjoy it as much as you can.",

  "Of course, since we met each other, your school days will be different, your days back at home will be different, and they'll be different for the better.",

  "So don't worry about us baby, don't worry about me. I'll be right here waiting for you, my beautiful princess to come back to me whenever she wants to and whenever she needs me.",

  "Baby I'm so proud of you, I'm so so proud of you, you're doing amazing already and I can't wait to see how much more amazing you get when you're in school.",

  "Working hard like a real student and being soo focused, IT'S SO CUTE I LOVE YOU ^^^^^^^^^^^",

  "And baby, if at all, your thoughts go out of control and you go into a spiral of thought, come to me right away, I'm your super cool psychologist with all the cures in the world ##",

  "But I really mean it baby, come to me okay? I'll take care of you, I'll get you all in shape and ready.",

  "When everything outside gets too much, come and stay inside with me, in my heart, and let me take care of you till you're ready to step out again.",

  "No matter what baby, I'll be right behind you. Come right back to me if it gets too noisy, too difficult, too stressful or too much to handle at all.",

  "I love you my jellyfish! Spend time with your friends, make new friends and have a good time as much as you can in school.",

  "And, whenever you can, bring a sweet treat to school, because you are my SUPER sweet sweetheart and because you deserve it baby @^",

  "You've got this baby, wear your uniform and look SUPER CUTE, don't you ever think once it looks bad on you %%",

  "Instead remind yourself that Tharuk (that's me by the way ##) loves, LOOOOOOVVVVVEEESS the way you look $$^&&^$^$^^",

  "Oh baby, my heart is so FULL of you I love you so much, I'm so glad we've made it this far together, now keep pushing through baby, I'm right behind you to hold you,",

  "you won't have to go through any of this alone, you won't have to ghost anyone, I'll keep your heart light, you'll be my angel, my beautiful girl, my amazing hard working schoolgirl!",

  "I LOVE YOU BABY, I love you so much, you've got this, keep your heart free and firm, and if you ever need a second one to keep pushing, hold my heart too, next to yours, it's full of love, it'll get you through whatever you need",

  "I love you Jory, I'm proud of you ^",

  "I love you",
];

// The letters are not written here any more. They live as plain text in
// letters/, and tools/add-letter.js turns them into js/data/letterData.js,
// which is where they arrive from.
//
// That is so one can be added without touching code at all: paste what you
// wrote into a text file, double-click ADD-LETTER.bat, and it is in the game.
// The tool does the two things that are easy to get wrong by hand - the curly
// apostrophes a phone keyboard types, which the font has no glyph for and which
// come out as a hole in the middle of a word, and the emoji, which cannot sit
// in a page string and have to be the stand-ins from the EMOJI table below.
//
// Your words are untouched otherwise, and where a page ends is still yours: a
// blank line in the text file is a page break, and nothing else is.

// The real emoji you wrote, keyed by the stand-in that sits in the page text,
// comes in from js/data/emojiData.js - which the letter tool writes and adds to
// by itself. See that file for why a stand-in is needed at all, and why the
// first twelve of them can never move.
//
// Whatever the device has. Every platform ships exactly one of these, so the
// first that resolves is the native set; the last is there only so a machine
// with none of them still measures something.
const EMOJI_FONT =
  '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';
// The blank that widens a stand-in to two slots. See widenEmoji for why the
// filler is not a space.
const EMOJI_PAD = '_';
// The stand-ins themselves, read fresh each time rather than captured once.
// Two reasons: they are mostly Private Use characters now, so the character
// class this used to be would be an escaping bug waiting to happen; and the
// table is replaced at start-up by the newest one off the server, which a set
// built at load time would have missed.
const emojiKeys = () => new Set(Object.keys(EMOJI));
// Sized to the pair of slots it now owns. Two advances is 26px, and an emoji is
// about 1.37 times as wide as its font size, so 18px lands at 25px and sits
// inside its own space. The artwork inside an emoji does not fill its box, so
// this draws at roughly the height of the 14px letters rather than towering
// over them — one slot could only carry 11px, which read as tiny beside them.
const EMOJI_SIZE = 18;

// Everything the inventory can open, keyed by what it passes in. Everything
// that differs between the two books lives here; the boards, the binding and
// the paper are the same book twice, because they were given by the same
// person and one of them looking like a different game's prop would say
// something neither of them means.
const BOOKS = {
  beautiful: {
    title: 'For My Beautiful Jory',
    pages: PAGES,
    cover: 0xe8557f,
    coverDark: 0xb83a5e,
    icon: 'book',
  },
  schoolgirl: {
    title: 'For My Schoolgirl Jory',
    pages: SCHOOL_PAGES,
    cover: 0x8e5bc4,
    coverDark: 0x5f3690,
    icon: 'book2',
  },
  // And every letter, from the generated file. Not books, and each one knows
  // it: `bound: false` drops the spine and the gutter, because a sheet out of
  // an envelope has no binding to sit in, and a letter with a spine down its
  // left edge is a book pretending otherwise.
  ...LETTER_BOOKS,
};

// What sits on the shelf. Four things, and it stays four things however many
// letters there are, which is the whole point of the LETTERS panel.
//
// The letters used to sit here one by one. That works until there are five or
// six of them and then it does not: the shelf grows a third row, the row pushes
// the buttons down, and the last one goes off the bottom of an 800-tall screen.
// You write one every school day, so that was a wall with a date on it. They
// have their own screen now and the shelf never moves again.
const SHELF = [
  { book: 'beautiful', label: 'BOOK 1' },
  { book: 'schoolgirl', label: 'BOOK 2' },
  // Not a book itself - it opens the list of them.
  { letters: true, label: 'LETTERS' },
  // The one thing that is hers to have rather than to read, so it has no book
  // behind it and nothing happens when it is pressed.
  { icon: 'ring', label: 'A RING' },
];
const DEFAULT_BOOK = 'beautiful';

// A fixed portrait page. The first pass sized the paper to its text, which for
// one short line came out wider than it was tall and read as a landscape card
// rather than a book. So the page is a fixed shape and the text is fitted into
// it instead of the other way round.
const BOOK_PAGE_W = 360;
const BOOK_PAGE_H = 480;
// Bound, not loose. The page carries the cover's colours as a frame and a spine
// down the gutter, so reading it feels like being inside the book she was given
// rather than looking at a sheet of paper on the grass.
// BOOK_EDGE matches drawChunkyPanel's own outline thickness, and BOOK_FRAME is
// the band it lays inside that when it is handed a frame colour.
const BOOK_EDGE = 4;
const BOOK_FRAME = 8;
const BOOK_SPINE_W = 26;
const BOOK_GUTTER_W = 8;
// The two cover colours are the one thing the books do not share, so they live
// on the book in BOOKS rather than here — everything else about the binding is
// deliberately identical between them.
// Two steps of shade where the paper turns into the binding, for the same
// reason the speech bubbles grade their bevels over two: one hard band reads as
// a drawn line, two read as a curve.
const BOOK_GUTTER_NEAR = 0xdcd4bf;
const BOOK_GUTTER_FAR = 0xeae4d5;
// Where the title breaks on the front board. Wrapped rather than hand-split, so
// a second book with a longer name lays itself out without being measured.
const BOOK_TITLE_WRAP = 10;
// The page edges showing past the boards down the fore edge and along the foot.
const BOOK_BLOCK_W = 14;
const BOOK_PAPER_DIM = 0xd9d2c0;
// The column left over once the frame, spine and gutter have taken their share.
const BOOK_TEXT_W = 288;
const BOOK_TEXT_H = 400;
// Semi-bold at scale 1 advances 13px a character and leaves 2px of trailing
// gap. Fitting needs those up front, before anything is laid out.
const BOOK_GLYPH_ADVANCE = 13;
const BOOK_GLYPH_TRAIL = 2;
const BOOK_LINE_H = 20;
// One size for the whole book, and the column width that follows from it.
const BOOK_SCALE = 1;
const BOOK_CHARS_PER_LINE = Math.floor(
  (BOOK_TEXT_W + BOOK_GLYPH_TRAIL) / (BOOK_GLYPH_ADVANCE * BOOK_SCALE),
);
const BOOK_INK = 0x241f2e;
// The date sits in a lighter hand than the letter. Full ink would read as the
// first line of the writing rather than as something stamped on the paper.
const BOOK_DATE_INK = 0x8b8399;
const BOOK_PAPER = 0xf6f2e8;

// One reward panel. Four things, two by two, which is the shape the shelf keeps
// for good now that the letters have gone to their own screen - so these are
// sized for that rather than for whatever fits next time something is added.
// Two across leaves 480 - 350 of margin, which is why they are wide again.
const REWARD_W = 170;
const REWARD_H = 150;
// Two to a row, and the grid still centres a short last row - it is written to
// survive a fifth thing, even though nothing is going to be added here now.
const SHELF_COLS = 2;
const SHELF_GAP = 10;
const SHELF_TOP = 232;
const SHELF_ROW_H = REWARD_H + 14;
// Every icon is drawn to this width whatever grid it came from. The books and
// the ring are 16 wide, the letter is 24, and left alone at a shared scale the
// letter would tower over them by half again.
const REWARD_ICON_W = 104;

// The letters list. A strip per letter rather than a panel, because a list is
// read down the page rather than scanned across it, and a date wants a line of
// its own under the name.
//
// Six to a screen is what fits between the title and the buttons at a row deep
// enough to hit with a thumb: rows at 196 through 556, the arrows at 634 and
// the way out at 712, on a screen 800 tall.
const LIST_ROWS = 6;
const LIST_W = 400;
const LIST_H = 64;
const LIST_TOP = 196;
const LIST_STEP = 72;
const LIST_ARROWS_Y = 634;
const LIST_BACK_Y = 712;

// Letters are keyed letter1, letter2, ... and sort by that number rather than
// by string, or letter10 would file itself between letter1 and letter2.
const letterNo = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

// What she gets for opening it: the rewards laid out side by side, and then the
// book itself if she wants to read it. Both views live in this one scene —
// they are the same moment, and a second scene for the pages would mean the
// writing lived somewhere other than the file the rest of the book is in.
export class BookScene extends Phaser.Scene {
  constructor() {
    super('Book');
  }

  // Doubles as the inventory. Arriving from the title screen changes only the
  // framing — the same things, the same books — so there is one place the
  // rewards live rather than a second screen to keep in step with this one.
  create(data) {
    this.fromMenu = data?.from === 'menu';
    this.page = 0;
    // Which book is open. Set before a cover is drawn and left alone after, so
    // closing one and opening the other is a change of this and a redraw.
    this.bookId = DEFAULT_BOOK;
    // Whether the open thing was reached through the letters list, which is
    // where closing it should put her back.
    this.fromLetters = false;
    this.letterPage = 0;
    // Phaser reuses this instance for the life of the page, so the view list
    // has to be emptied on entry as well as between views.
    this.view = [];
    // No petals here: the letter is the thing to look at, and a screen full
    // of drifting pink over a page of text is just harder to read.
    meadowBackdrop(this, 0.82, { petals: false, preset: 'book' });
    // The letter gets the cornfield track to itself.
    audio.music('cornfield');
    this.showRewards();
    // The white flash is the chest opening. Coming in from a menu there is
    // nothing to flash about, so it fades up out of black like every other
    // front-end screen.
    if (this.fromMenu) this.cameras.main.fadeIn(400, 0, 0, 0);
    else this.cameras.main.fadeIn(800, 255, 255, 255);
  }

  // Turns the authored pages into pages that actually fit the paper. Anything
  // short enough is left alone; anything longer than a page is carried onto as
  // many as it needs. The point is that whoever is writing can just write, and
  // never has to think about where a page ends or count characters.
  // Opening the letter, in three beats: the flap goes back, the card rises out
  // of it, and the card becomes the page she reads.
  //
  // The card is its own sprite sitting BEHIND the envelope, which is the whole
  // reason there are three textures rather than one picture of an opened one.
  // Behind the paper it is simply not visible; tweened upward it clears the top
  // edge the way a card actually comes out of an envelope. Baked into a single
  // image it could only ever be a still.
  //
  // Every step checks the sprite is still on a scene: these are timed callbacks,
  // and if she leaves mid-open they would otherwise land on destroyed objects.
  openLetter(id, fromList = false) {
    this.bookId = BOOKS[id] ? id : 'letter1';
    // Remembered so CLOSE, and a leftward turn off page one, go back where she
    // came from rather than always to the shelf.
    this.fromLetters = fromList;
    this.pages = this.buildPages();
    this.page = 0;
    this.clearView();

    const cx = GAME_W / 2;
    const cy = 300;

    const env = this.add.image(cx, cy, this.book.icon).setDepth(402);
    const scale = 280 / env.width;
    env.setScale(scale);
    this.track(env);

    // Level with the envelope and one layer under it, so none of it shows yet.
    const card = this.add.image(cx, cy, 'letter_card').setDepth(401).setScale(scale);
    this.track(card);

    const label = new PixelText(this, cx, cy + 210, 'OPENING IT', {
      scale: 1,
      color: 0xffe08a,
    });
    this.track(label.setDepth(600));

    // 1 - the flap goes back. The page turn is the right sound for it: same
    // paper, and it is already loaded.
    this.time.delayedCall(300, () => {
      if (!env.scene) return;
      audio.play('page');
      env.setTexture('letter_open');
    });

    // 2 - the card rises out, overshooting a little as it clears the paper.
    this.time.delayedCall(460, () => {
      if (!card.scene) return;
      this.tweens.add({
        targets: card,
        y: cy - env.displayHeight * 0.5,
        duration: 640,
        ease: 'Back.out',
      });
    });

    // 3 - it comes at the reader and turns into the page.
    this.time.delayedCall(1260, () => {
      if (!card.scene) return;
      audio.play('page');
      this.tweens.add({
        targets: card,
        scale: scale * 2.6,
        alpha: 0,
        duration: 420,
        ease: 'Quad.in',
      });
      this.tweens.add({ targets: [env, label.container], alpha: 0, duration: 320 });
      this.time.delayedCall(420, () => {
        if (this.scene.isActive()) this.showPage(0);
      });
    });
  }

  // The book currently open, and the sheets it has been laid out onto. Built on
  // the way in to a cover rather than up front, so the book she never opens is
  // never wrapped.
  openBook(id) {
    this.bookId = BOOKS[id] ? id : DEFAULT_BOOK;
    this.fromLetters = false;
    this.pages = this.buildPages();
    this.page = 0;
    this.clearView();

    const cx = GAME_W / 2;
    const cy = 300;
    const icon = this.add.image(cx, cy, this.book.icon).setDepth(402);
    icon.setScale(200 / icon.width);
    this.track(icon);
    const base = icon.scaleX;

    const label = new PixelText(this, cx, cy + 190, 'OPENING IT', {
      scale: 1,
      color: 0xffe08a,
    });
    this.track(label.setDepth(600));

    // 1 - picked up off the shelf.
    this.tweens.add({
      targets: icon,
      y: cy - 14,
      scaleX: base * 1.08,
      scaleY: base * 1.08,
      duration: 260,
      ease: 'Back.out',
    });

    // 2 - the front board swings. At this size that is the cover narrowing to
    // its own spine rather than any drawn hinge: there are not enough pixels
    // for a board at an angle, and the narrowing reads as the same motion.
    this.time.delayedCall(320, () => {
      if (!icon.scene) return;
      audio.play('page');
      this.tweens.add({ targets: icon, scaleX: base * 0.06, duration: 300, ease: 'Quad.in' });
    });

    // 3 - and it is open, at the size she reads it.
    this.time.delayedCall(640, () => {
      if (!icon.scene) return;
      this.tweens.add({ targets: [icon, label.container], alpha: 0, duration: 200 });
      this.time.delayedCall(200, () => {
        if (this.scene.isActive()) this.showCover();
      });
    });
  }

  // Where CLOSE and a leftward turn off page one go. A letter was reached
  // through the list, so it goes back to the list - and to the page of the list
  // she was on, not to the top of it.
  leaveBook() {
    if (this.fromLetters) this.showLetters(this.letterPage);
    else this.showRewards();
  }

  get book() {
    return BOOKS[this.bookId] ?? BOOKS[DEFAULT_BOOK];
  }

  buildPages() {
    const maxLines = Math.floor(BOOK_TEXT_H / (BOOK_LINE_H * BOOK_SCALE));
    const out = [];
    this.book.pages.forEach((text) => {
      const lines = this.wrapPage(text);
      if (lines.length <= maxLines) {
        out.push(lines);
        return;
      }
      // Spread evenly rather than filling sheets to the brim and leaving a
      // stub at the end: a page break should not be visible as a change in
      // density from one sheet to the next.
      const sheets = Math.ceil(lines.length / maxLines);
      const per = Math.ceil(lines.length / sheets);
      for (let i = 0; i < lines.length; i += per) out.push(lines.slice(i, i + per));
    });
    return out;
  }

  // Everything currently on screen that is not the backdrop.
  track(...objs) {
    objs.forEach((o) => this.view.push(o));
    return objs[0];
  }

  clearView() {
    // Every tween in here belongs to something in the view, and a tween left
    // running against a destroyed target throws on the next frame.
    this.tweens.killAll();
    this.view.forEach((o) => o.destroy());
    this.view = [];
  }

  // Buttons rebuild the view they are sitting in, so the swap is deferred a
  // frame rather than destroying a hit zone from inside its own handler.
  later(fn) {
    return () => this.time.delayedCall(0, fn);
  }

  // Driven through setAlpha rather than by tweening `alpha` directly, because a
  // MenuButton is a plain class over half a dozen loose objects, not a
  // GameObject — tweening its `alpha` sets a property nothing reads, and the
  // button stays on the initial 0 forever.
  fadeIn(target, delay) {
    target.setAlpha(0);
    const fade = { a: 0 };
    this.tweens.add({
      targets: fade,
      a: 1,
      duration: 420,
      delay,
      onUpdate: () => target.setAlpha(fade.a),
      onComplete: () => target.setAlpha(1),
    });
  }

  // ---- rewards -------------------------------------------------------------

  showRewards() {
    this.clearView();
    const cx = GAME_W / 2;

    // Scale 2, not 3: at 3 this string is wider than the screen, so PixelText
    // shrinks it to a fractional scale and the glyphs go soft. The rewards are
    // meant to be the loudest thing here anyway.
    const title = new PixelText(this, cx, 78, this.fromMenu ? 'YOUR THINGS' : 'YOU OPENED IT', {
      scale: 2,
      color: 0xff4d6d,
    });
    this.track(title.setDepth(600));

    // The name is remembered across sessions, but storage can be refused, so
    // the line has to still read properly without one.
    const name = GameState.playerName;
    const who = new PixelText(this, cx, 128, name ? `${name} - THESE ARE YOURS` : 'THESE ARE YOURS', {
      scale: 1,
      color: 0xffe08a,
    });
    this.track(who.setDepth(600));
    this.fadeIn(who.container, 300);

    // The books are the things you press. A button saying so would sit between
    // her and the reward it is describing; pressing the book itself is the
    // shorter route, and the ring stays inert so only the readable things light
    // up.
    //
    // Laid out from SHELF rather than by hand. Two to a row, a short last row
    // centred, and the rows pushed down from SHELF_TOP.
    const rows = Math.ceil(SHELF.length / SHELF_COLS);
    SHELF.forEach((it, i) => {
      const r = Math.floor(i / SHELF_COLS);
      const inRow = Math.min(SHELF_COLS, SHELF.length - r * SHELF_COLS);
      const col = i - r * SHELF_COLS;
      const x = cx + (col - (inRow - 1) / 2) * (REWARD_W + SHELF_GAP);
      const y = SHELF_TOP + r * SHELF_ROW_H;
      const entry = it.book ? BOOKS[it.book] : null;
      // The letters panel wears the same envelope the letters do, because it is
      // the pile of them rather than a thing of its own.
      const icon = entry ? entry.icon : it.letters ? 'letter_closed' : it.icon;
      // The ring has nothing behind it, so it is the one panel that never lights.
      const open = it.letters
        ? this.later(() => this.showLetters(0))
        : !it.book
          ? null
          : entry.bound === false
            ? this.later(() => this.openLetter(it.book, false))
            : this.later(() => this.openBook(it.book));
      this.reward(x, y, icon, it.label, i * 110, open);
    });

    const shelfBottom = SHELF_TOP + (rows - 1) * SHELF_ROW_H + REWARD_H / 2;
    const hintY = shelfBottom + 46;

    const hint = new PixelText(this, cx, hintY, '(TAP ONE TO READ IT)', {
      scale: 1,
      color: 0x9a94b0,
    });
    this.track(hint.setDepth(600));
    this.fadeIn(hint.container, 1000);
    // A slow breath on it, started after the fade so the two do not fight over
    // the same alpha.
    this.tweens.add({
      targets: hint.container,
      alpha: 0.45,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      delay: 1500,
      ease: 'Sine.inOut',
    });

    if (this.fromMenu) {
      // Nothing to play again from here — she came to look at them, not to win
      // them, so there is one way out and it goes back where she came from.
      const back = new MenuButton(this, cx, hintY + 84, 'BACK', {
        scale: 3,
        minWidth: 300,
        onPick: () => this.scene.start('Menu'),
      });
      this.track(back);
      this.fadeIn(back, 1200);
      return;
    }

    const again = new MenuButton(this, cx, hintY + 84, 'PLAY AGAIN', {
      scale: 3,
      minWidth: 300,
      onPick: () => this.scene.start('JoryIntro'),
    });
    const menu = new MenuButton(this, cx, hintY + 170, 'MAIN MENU', {
      scale: 2,
      minWidth: 300,
      onPick: () => this.scene.start('Menu'),
    });
    this.track(again, menu);
    this.fadeIn(again, 1200);
    this.fadeIn(menu, 1340);
  }

  // ---- the letters ---------------------------------------------------------

  // Every letter you have written, a screenful at a time.
  //
  // This screen exists because the shelf could not hold them. A letter a school
  // day is a number with no ceiling, and a grid of panels has one at about six.
  // Here the count costs nothing: a hundred letters is sixteen taps of an arrow
  // and not one pixel of layout that has to change.
  //
  // Newest first. She is opening this to read today's, and today's should not
  // be at the bottom of the last page.
  showLetters(page = 0) {
    this.clearView();
    const cx = GAME_W / 2;

    const ids = Object.keys(LETTER_BOOKS).sort((a, b) => letterNo(b) - letterNo(a));
    const pages = Math.max(1, Math.ceil(ids.length / LIST_ROWS));
    this.letterPage = Phaser.Math.Clamp(page, 0, pages - 1);
    const shown = ids.slice(this.letterPage * LIST_ROWS, (this.letterPage + 1) * LIST_ROWS);

    const title = new PixelText(this, cx, 78, 'LETTERS', { scale: 2, color: 0xff4d6d });
    this.track(title.setDepth(600));

    // Nothing to count on an empty shelf, and the line would read as an error
    // rather than as a fact.
    if (ids.length) {
      const count = new PixelText(
        this,
        cx,
        128,
        ids.length === 1 ? '1 LETTER' : `${ids.length} LETTERS`,
        { scale: 1, color: 0xffe08a },
      );
      this.track(count.setDepth(600));
      this.fadeIn(count.container, 260);
    } else {
      // Only reachable if every letter has been taken out again, but a blank
      // screen with a back button on it is a bug report waiting to happen.
      const none = new PixelText(this, cx, 300, 'NO LETTERS YET', {
        scale: 2,
        color: 0x9a94b0,
      });
      this.track(none.setDepth(600));
    }

    shown.forEach((id, i) => this.letterRow(cx, LIST_TOP + i * LIST_STEP, id, 120 + i * 90));

    // Only when there is somewhere to go. One screenful needs no arrows, and a
    // dead pair of them reads as something broken.
    if (pages > 1) {
      const arrow = { scale: 2, padX: 16, clickSound: null };
      const counter = new PixelText(
        this,
        cx,
        LIST_ARROWS_Y,
        `${this.letterPage + 1} / ${pages}`,
        { scale: 1, color: 0xffe08a },
      );
      this.track(counter.setDepth(600));

      if (this.letterPage > 0) {
        this.track(
          new MenuButton(this, cx - 132, LIST_ARROWS_Y, '<', {
            ...arrow,
            onPick: this.later(() => {
              audio.play('page');
              this.showLetters(this.letterPage - 1);
            }),
          }),
        );
      }
      if (this.letterPage < pages - 1) {
        this.track(
          new MenuButton(this, cx + 132, LIST_ARROWS_Y, '>', {
            ...arrow,
            onPick: this.later(() => {
              audio.play('page');
              this.showLetters(this.letterPage + 1);
            }),
          }),
        );
      }
    }

    const back = new MenuButton(this, cx, LIST_BACK_Y, 'BACK', {
      scale: 2,
      minWidth: 240,
      onPick: this.later(() => this.showRewards()),
    });
    this.track(back);
    this.fadeIn(back, 700);
  }

  // One letter on a pressable strip: the envelope, which number it is, and the
  // day it was written, so she can find one by when rather than by counting.
  //
  // Guarded the same way the shelf panels are - a press has to start here as
  // well as end here, so a drag that happens to finish over a row does not open
  // it.
  letterRow(cx, cy, id, delay) {
    const entry = LETTER_BOOKS[id];
    const panel = this.add.graphics().setDepth(400);
    const paint = (lit) =>
      drawChunkyPanel(panel, cx, cy, LIST_W, LIST_H, lit ? 0x342b45 : 0x1b1622, {});
    paint(false);
    this.track(panel);

    let held = false;
    const zone = this.add
      .zone(cx, cy, LIST_W, LIST_H)
      .setDepth(404)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerover', () => paint(true));
    zone.on('pointerout', () => {
      held = false;
      paint(false);
    });
    zone.on('pointerdown', () => {
      held = true;
      paint(true);
    });
    zone.on('pointerup', () => {
      const was = held;
      held = false;
      paint(false);
      if (was) this.openLetter(id, true);
    });
    this.track(zone);

    const left = cx - LIST_W / 2;
    const icon = this.add.image(left + 34, cy, 'letter_closed').setDepth(402);
    icon.setScale(44 / icon.width);
    this.track(icon);

    // Ranged from the left edge rather than centred, so the names and the dates
    // line up down the column whatever length they are.
    const name = new PixelText(this, left + 68, cy - 11, `LETTER ${letterNo(id)}`, {
      scale: 2,
      color: 0xffe08a,
      align: 'left',
      maxWidth: LIST_W - 90,
    });
    this.track(name.setDepth(403));

    const when = new PixelText(this, left + 68, cy + 15, entry.date ?? '', {
      scale: 1,
      color: 0x9a94b0,
      align: 'left',
      maxWidth: LIST_W - 90,
    });
    this.track(when.setDepth(403));

    this.fadeIn(name.container, delay);
    this.fadeIn(when.container, delay + 60);
  }

  // One reward on a lit panel, floating over a halo, so the pair reads as
  // things she won rather than as two icons on a background. Passing `onPick`
  // makes the whole panel pressable and gives it a lit state, which is the only
  // thing marking one of the two out as something to do rather than just have.
  reward(cx, cy, texture, label, delay, onPick = null) {
    const panel = this.add.graphics().setDepth(400);
    const paint = (lit) =>
      drawChunkyPanel(panel, cx, cy, REWARD_W, REWARD_H, lit ? 0x342b45 : 0x1b1622, {});
    paint(false);
    this.track(panel);

    if (onPick) {
      // Guarded the same way MenuButton is: a press has to start on the panel
      // as well as end there, so a drag that happens to finish here does not
      // count as a tap.
      let held = false;
      const zone = this.add
        .zone(cx, cy, REWARD_W, REWARD_H)
        .setDepth(404)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => paint(true));
      zone.on('pointerout', () => {
        held = false;
        paint(false);
      });
      zone.on('pointerdown', () => {
        held = true;
        paint(true);
      });
      zone.on('pointerup', () => {
        const was = held;
        held = false;
        paint(false);
        if (was) onPick();
      });
      this.track(zone);
    }

    const halo = this.add.ellipse(cx, cy + REWARD_H * 0.3, 74, 22, 0x8f6bb0, 0.5).setDepth(401);
    this.track(halo);
    this.tweens.add({
      targets: halo,
      scaleX: 1.25,
      alpha: 0.22,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      delay,
      ease: 'Sine.inOut',
    });

    const item = this.add.image(cx, cy - REWARD_H * 0.08, texture).setDepth(402).setScale(0);
    this.track(item);
    // Read off the texture rather than hard-coded, so a sprite drawn on a bigger
    // grid lands the same width on the shelf as one drawn on a smaller one.
    const iconScale = REWARD_ICON_W / item.width;
    this.tweens.add({ targets: item, scale: iconScale, duration: 620, delay, ease: 'Back.out' });
    this.tweens.add({
      targets: item,
      y: cy - REWARD_H * 0.16,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      delay: delay + 620,
      ease: 'Sine.inOut',
    });

    const name = new PixelText(this, cx, cy + REWARD_H * 0.45, label, { scale: 1, color: 0xffe08a });
    this.track(name.setDepth(403));
    this.fadeIn(name.container, delay + 500);
  }

  // ---- the book ------------------------------------------------------------

  // Every page in the book is set at the same size. An earlier version grew the
  // text on short pages so they filled the sheet, which made a page of few
  // words shout at the reader next to its neighbours. A book is one typeface at
  // one size all the way through, and the words carry their own weight — a page
  // with little on it is a pause, not a headline.
  wrapPage(text) {
    return wrapText(this.widenEmoji(text), BOOK_CHARS_PER_LINE);
  }

  // Gives every emoji a second slot to sit in.
  //
  // A letter is 11px in a 13px advance, and emoji artwork does not fill its own
  // box — at a size that fits one slot the drawing inside comes out visibly
  // smaller than the writing next to it. Two slots is 26px, which is room for
  // an emoji at a size that matches the text.
  //
  // The filler is '_' rather than a space on purpose. wrapText breaks on
  // whitespace, and a space here would let a run of eleven hearts wrap in the
  // middle of itself. '_' has no glyph, so it sets an empty slot exactly like a
  // space would, but the wrapper reads the run as one unbreakable word.
  widenEmoji(text) {
    const keys = emojiKeys();
    let out = '';
    for (const c of text) out += keys.has(c) ? `${c}${EMOJI_PAD}` : c;
    return out;
  }

  // The spine down the gutter: a band in the cover colour, crossed by the same
  // darker bindings the closed book carries on its spine, then two steps of
  // shade on the paper beside it so the sheet looks like it turns into the
  // binding rather than being butted up against a stripe.
  //
  // Whole-pixel rectangles only, no gradients — this has to sit in the same
  // world as the sprites, and a smooth ramp here would read as a different game.
  // `gutter` is the shading on the paper beside the spine. The front board has
  // no paper to curve, so it asks for the binding without it.
  drawBinding(cx, cy, opts = {}) {
    const { gutter = true, inset = BOOK_EDGE + BOOK_FRAME, depth = 401 } = opts;
    const g = this.add.graphics().setDepth(depth);
    const x = Math.round(cx - BOOK_PAGE_W / 2) + inset;
    const y = Math.round(cy - BOOK_PAGE_H / 2) + inset;
    const h = BOOK_PAGE_H - inset * 2;

    g.fillStyle(this.book.cover, 1);
    g.fillRect(x, y, BOOK_SPINE_W, h);

    g.fillStyle(this.book.coverDark, 1);
    const bands = 4;
    for (let i = 1; i <= bands; i++) {
      g.fillRect(x, y + Math.round((h * i) / (bands + 1)) - 3, BOOK_SPINE_W, 6);
    }
    // A shaded lip where the binding meets the paper.
    g.fillRect(x + BOOK_SPINE_W - 3, y, 3, h);

    if (gutter) {
      const half = BOOK_GUTTER_W / 2;
      g.fillStyle(BOOK_GUTTER_NEAR, 1);
      g.fillRect(x + BOOK_SPINE_W, y, half, h);
      g.fillStyle(BOOK_GUTTER_FAR, 1);
      g.fillRect(x + BOOK_SPINE_W + half, y, half, h);
    }

    this.track(g);
  }

  // -1 is the front board, 0 and up are the written pages. Turning left off
  // page one closes the book back to its cover rather than doing nothing.
  turnTo(n) {
    audio.play('page');
    // A letter has no front board to close back to, so page one turns left out
    // of the letter entirely instead of onto a cover that does not exist.
    if (n < 0) (this.book.bound === false ? this.leaveBook() : this.showCover());
    else this.showPage(n);
  }

  // The front board, built to the same plan as the little book she was handed:
  // pink boards, dark spine down the left, page edges showing along the fore
  // edge and the foot, and the heart on the front.
  showCover() {
    this.page = -1;
    this.clearView();
    const cx = GAME_W / 2;
    const cy = 282;

    const board = this.add.graphics().setDepth(400);
    drawChunkyPanel(board, cx, cy, BOOK_PAGE_W, BOOK_PAGE_H, this.book.cover, {});
    this.track(board);

    // The block of pages the cover is sitting on.
    const blocks = this.add.graphics().setDepth(401);
    const l = Math.round(cx - BOOK_PAGE_W / 2) + BOOK_EDGE;
    const t = Math.round(cy - BOOK_PAGE_H / 2) + BOOK_EDGE;
    const w = BOOK_PAGE_W - BOOK_EDGE * 2;
    const h = BOOK_PAGE_H - BOOK_EDGE * 2;
    blocks.fillStyle(BOOK_PAPER, 1);
    blocks.fillRect(l + w - BOOK_BLOCK_W, t, BOOK_BLOCK_W, h);
    blocks.fillRect(l, t + h - BOOK_BLOCK_W, w, BOOK_BLOCK_W);
    // Shaded where the boards overhang them, which is what gives the book depth.
    blocks.fillStyle(BOOK_PAPER_DIM, 1);
    blocks.fillRect(l + w - BOOK_BLOCK_W, t, 4, h);
    blocks.fillRect(l, t + h - BOOK_BLOCK_W, w, 4);
    this.track(blocks);

    // Spine over the top of the foot block, the way it sits on the real thing.
    this.drawBinding(cx, cy, { gutter: false, inset: BOOK_EDGE, depth: 402 });

    // Everything on the front is centred between the spine and the fore edge,
    // not on the board, or it would sit visibly off to the right.
    const midX = (l + BOOK_SPINE_W + (l + w - BOOK_BLOCK_W)) / 2;

    const plaque = this.add.graphics().setDepth(403);
    drawChunkyPanel(plaque, midX, cy - 84, 140, 140, BOOK_PAPER, { edge: 3, notch: 3, bevel: 3 });
    this.track(plaque);
    const emblem = this.add.image(midX, cy - 84, 'heart').setDepth(404).setScale(3);
    this.track(emblem);

    wrapText(this.book.title, BOOK_TITLE_WRAP).forEach((line, i) => {
      const y = cy + 58 + i * 42;
      // Stamped rather than printed: a dark offset behind cream lettering, so
      // the title reads against the pink instead of floating on it.
      const shade = new PixelText(this, midX + 2, y + 3, line, {
        scale: 2,
        color: this.book.coverDark,
        bold: true,
        maxWidth: BOOK_TEXT_W,
      });
      const text = new PixelText(this, midX, y, line, {
        scale: 2,
        color: BOOK_PAPER,
        bold: true,
        maxWidth: BOOK_TEXT_W,
      });
      this.track(shade.setDepth(404), text.setDepth(405));
      this.fadeIn(shade.container, 120 + i * 110);
      this.fadeIn(text.container, 120 + i * 110);
    });

    let y = cy + BOOK_PAGE_H / 2 + 46;
    const hint = new PixelText(this, cx, y, 'OPEN IT', { scale: 1, color: 0xffe08a });
    this.track(hint.setDepth(600));
    y += 62;

    this.track(
      new MenuButton(this, cx + 132, y, '>', {
        scale: 2,
        padX: 16,
        // Opening the book is a page turn like any other — same rule.
        clickSound: null,
        onPick: this.later(() => this.turnTo(0)),
      }),
    );
    y += 76;

    const close = new MenuButton(this, cx, y, 'CLOSE', {
      scale: 2,
      minWidth: 240,
      onPick: this.later(() => this.showRewards()),
    });
    this.track(close);
    this.fadeIn(close, 700);
  }

  // The real emoji, dropped into the blanks their stand-ins left behind.
  //
  // Drawn by the device's own font rather than out of the sprite sheet, so she
  // gets the faces her phone draws — the ones you meant — instead of somebody's
  // idea of them in five pixels.
  //
  // They go inside the line's own container, which is what makes this cheap:
  // they inherit its position, its depth and its fade-in, and they are
  // destroyed along with it when the page turns.
  drawEmoji(text, line) {
    for (let i = 0; i < line.length; i++) {
      const glyph = EMOJI[line[i]];
      if (!glyph) continue;
      const slot = text.pool[i];
      if (!slot) continue;
      // Stand-ins are widened to two slots before wrapping, so the emoji is
      // centred across this blank and the filler after it. Glyphs are drawn
      // from their left edge, so the middle of the pair is the far slot's left
      // edge plus half a glyph. Falls back to the single slot if the filler is
      // missing, which only happens if a page is written by hand without one.
      const pair = text.pool[i + 1] && line[i + 1] === EMOJI_PAD ? text.pool[i + 1] : slot;
      const mid = (slot.x + pair.x) / 2 + (text.glyphW * slot.scaleX) / 2;
      const e = this.add
        .text(mid, 0, glyph, {
          fontFamily: EMOJI_FONT,
          fontSize: `${EMOJI_SIZE}px`,
          // Only reached if the device has no colour emoji at all and falls back
          // to an outline: cream paper would swallow the default white.
          color: '#241f2e',
          // Colour emoji overhang the box the metrics promise, and Phaser crops
          // to that box.
          padding: { x: 3, y: 3 },
        })
        .setOrigin(0.5);
      text.container.add(e);
    }
  }

  showPage(n) {
    this.page = Phaser.Math.Clamp(n, 0, this.pages.length - 1);
    this.clearView();

    const cx = GAME_W / 2;
    const cy = 282;
    const lines = this.pages[this.page];
    const step = BOOK_LINE_H * BOOK_SCALE;

    const paper = this.add.graphics().setDepth(400);
    drawChunkyPanel(paper, cx, cy, BOOK_PAGE_W, BOOK_PAGE_H, BOOK_PAPER, {
      frame: this.book.cover,
      frameWidth: BOOK_FRAME,
    });
    this.track(paper);
    const bound = this.book.bound !== false;
    if (bound) this.drawBinding(cx, cy);

    // The spine eats into the left of the page, so the column sits right of
    // centre. Centring the text on the panel instead would push it into the
    // binding and leave a margin twice as wide down the outer edge.
    const faceL = cx - BOOK_PAGE_W / 2 + BOOK_EDGE + BOOK_FRAME;
    const faceR = cx + BOOK_PAGE_W / 2 - BOOK_EDGE - BOOK_FRAME;
    // Bound pages sit right of the spine so the column is not swallowed by the
    // gutter. A loose sheet has neither, so it centres on the paper.
    const textCx = bound
      ? (faceL + BOOK_SPINE_W + BOOK_GUTTER_W + faceR) / 2
      : (faceL + faceR) / 2;

    // The date, on the first sheet only, ranged right against the same margin
    // the writing uses. High enough that a full twenty-line page still clears
    // it: the text block is centred on the paper, so at its tallest it starts
    // twenty-odd pixels below this.
    if (this.page === 0 && this.book.date) {
      const stamp = new PixelText(this, textCx + BOOK_TEXT_W / 2, 70, this.book.date, {
        scale: 1,
        color: BOOK_DATE_INK,
        align: 'right',
        maxWidth: BOOK_TEXT_W,
      });
      this.track(stamp.setDepth(402));
      this.fadeIn(stamp.container, 120);
    }

    const top = cy - ((lines.length - 1) * step) / 2;
    lines.forEach((line, i) => {
      const t = new PixelText(this, textCx, top + i * step, line, {
        scale: BOOK_SCALE,
        color: BOOK_INK,
        bold: true,
        maxWidth: BOOK_TEXT_W,
      });
      this.track(t.setDepth(402));
      this.fadeIn(t.container, 160 + i * 110);

      // The heart you signed off with, in red. PixelText tints a whole string at
      // once, so this reaches for the single glyph that should not be ink —
      // safe because book pages are set once and never re-typed.
      const heart = line.indexOf('~');
      if (heart >= 0) t.pool[heart].setTint(0xff4d6d);

      this.drawEmoji(t, line);
    });

    let y = cy + BOOK_PAGE_H / 2 + 46;

    // Counts the pages the reader actually turns, which is not PAGES.length
    // once a long entry has been carried onto a second sheet. The cover is not
    // one of them, so it is not counted here either.
    const counter = new PixelText(this, cx, y, `PAGE ${this.page + 1} / ${this.pages.length}`, {
      scale: 1,
      color: 0xffe08a,
    });
    this.track(counter.setDepth(600));
    y += 62;

    // No click blip on the page arrows: the page turn is the sound of pressing
    // them, and the two together just muddle each other.
    const arrow = { scale: 2, padX: 16, clickSound: null };
    // Always a way to turn left: off page one it shuts the book to its cover.
    this.track(
      new MenuButton(this, cx - 132, y, '<', {
        ...arrow,
        onPick: this.later(() => this.turnTo(this.page - 1)),
      }),
    );
    if (this.page < this.pages.length - 1) {
      this.track(
        new MenuButton(this, cx + 132, y, '>', {
          ...arrow,
          onPick: this.later(() => this.turnTo(this.page + 1)),
        }),
      );
    }
    y += 76;

    const close = new MenuButton(this, cx, y, 'CLOSE', {
      scale: 2,
      minWidth: 240,
      onPick: this.later(() => this.leaveBook()),
    });
    this.track(close);
    this.fadeIn(close, 700);
  }
}

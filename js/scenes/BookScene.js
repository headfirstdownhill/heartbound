import { GAME_W } from '../core/Constants.js';
import { GameState } from '../core/GameState.js';
import { audio } from '../systems/AudioManager.js';
import { PixelText } from '../gfx/PixelText.js';
import { MenuButton, drawChunkyPanel, meadowBackdrop } from '../ui/MenuWidgets.js';
import { wrapText } from '../ui/SpeechBubble.js';

// What the book says, in order — one string per page.
//
// The words are his, kept exactly as written, bar one slip of the finger. Only
// the breaks are a choice: they land on a sentence end wherever the writing
// allowed it and on a clause where it did not, balanced so every page carries
// about the same amount and none is crammed or left nearly bare. The only
// thing here with no character behind it is the heart he signed off with,
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
// Same rules as above: his words, his order, his line of thought. The only
// changes are the ones a pen would have made anyway — 'im' to 'I'm', 'dont' to
// 'don't', a lowercase 'i' to 'I'. Nothing rephrased, nothing tidied, nothing
// added.
//
// The faces are his too. '~' is the heart the font already had; '@' '#' '%'
// '$' '&' '*' are the emoji he wrote, each drawn as a glyph in the font table
// rather than dropped — see the note beside them there. One character here is
// one face on the paper, so the runs he wrote at their full length still fit
// the column.
const SCHOOL_PAGES = [
  "Hi my baby, I was thinking of giving this to you while you're sleeping, but since this message is related to your school, I don't want to send it to you while you're sleeping and let this be the first thing you read.",

  "I know how much the school stuff stresses you out or bothers you. So since you have school tomorrow, I know today you'll think of it and maybe stress out or feel really anxious or nervous, so I'll send this message to you when today you feel that way @@",

  "I love you, that's the first thing I want you to know sweetheart. I love you so dearly, so deeply, and so so much baby.",

  "I know that it's been a while since you went to school that even writing with a pen or pencil might feel super weird.. like you might not even remember how to write or how your handwriting goes.",

  "I know a lot can go through your head, but don't worry baby, that's completely normal and it happens because you're entering a new grade, look at you growing baby ~*",

  "I'm so proud of you! You've made it so far already in school despite all of those hard times, you did so much hard work baby to get to where you are now.",

  "If I'm this proud, your parents must be even more proud of you baby.",

  "You're going to be anticipating a lot of things which is why you might feel anxious or nervous, and maybe you might feel a heavy heart, maybe you do right now, and that's okay baby, feel it.",

  "Let your heart be heavy, that means your heart is alive and tender, just the way it should be sweetheart ~",

  "Don't think so hard about tomorrow okay? It's the first day, not much happens on the first day anyway baby, if anything, it's just like going to the mall and coming back home quick. So take it really easy baby.",

  "And if somehow your teachers are super evil %% and they give you homework, come and give it to me immediately, I will help you SOLVE IT while you freshen up and get all dressed into new comfortable clothes,",

  "into your pretty black top and comfortable pyjamas, and then you better eat and drink plenty of water.",

  "I don't want you to at all be stressed out about us, I'm really understanding about all of this baby I promise. I've been through all the feelings you are feeling with school and your last year, and I want you to enjoy it as much as you can.",

  "Of course, since we met each other, your school days will be different, your days back at home will be different, and they'll be different for the better.",

  "So don't worry about us baby, don't worry about me. I'll be right here waiting for you, my beautiful princess to come back to me whenever she wants to and whenever she needs me.",

  "Baby I'm so proud of you, I'm so so proud of you, you're doing amazing already and I can't wait to see how much more amazing you get when you're in school.",

  "Working hard like a real student and being soo focused, IT'S SO CUTE I LOVE YOU ~~~~~~~~~~~",

  "And baby, if at all, your thoughts go out of control and you go into a spiral of thought, come to me right away, I'm your super cool psychologist with all the cures in the world ##",

  "But I really mean it baby, come to me okay? I'll take care of you, I'll get you all in shape and ready.",

  "When everything outside gets too much, come and stay inside with me, in my heart, and let me take care of you till you're ready to step out again.",

  "No matter what baby, I'll be right behind you. Come right back to me if it gets too noisy, too difficult, too stressful or too much to handle at all.",

  "I love you my jellyfish! Spend time with your friends, make new friends and have a good time as much as you can in school.",

  "And, whenever you can, bring a sweet treat to school, because you are my SUPER sweet sweetheart and because you deserve it baby @~",

  "You've got this baby, wear your uniform and look SUPER CUTE, don't you ever think once it looks bad on you %%",

  "Instead remind yourself that Tharuk (that's me by the way ##) loves, LOOOOOOVVVVVEEESS the way you look $$~&&~$~$~~",

  "Oh baby, my heart is so FULL of you I love you so much, I'm so glad we've made it this far together, now keep pushing through baby, I'm right behind you to hold you,",

  "you won't have to go through any of this alone, you won't have to ghost anyone, I'll keep your heart light, you'll be my angel, my beautiful girl, my amazing hard working schoolgirl!",

  "I LOVE YOU BABY, I love you so much, you've got this, keep your heart free and firm, and if you ever need a second one to keep pushing, hold my heart too, next to yours, it's full of love, it'll get you through whatever you need",

  "I love you Jory, I'm proud of you ~",

  "I love you",
];

// The books on the shelf, keyed by what the inventory passes in. Everything
// that differs between them lives here; the boards, the binding and the paper
// are the same book twice, because they were given by the same person and one
// of them looking like a different game's prop would say something neither of
// them means.
const BOOKS = {
  beautiful: { title: 'For My Beautiful Jory', pages: PAGES },
  schoolgirl: { title: 'For My Schoolgirl Jory', pages: SCHOOL_PAGES },
};
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
const BOOK_COVER = 0xe8557f;
const BOOK_COVER_DARK = 0xb83a5e;
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
const BOOK_PAPER = 0xf6f2e8;

// One reward panel. Three of them and their gaps have to live inside 480, which
// is what sets the width — the height is unchanged, so the row sits exactly
// where the pair used to.
const REWARD_W = 140;
const REWARD_H = 196;

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
  // The book currently open, and the sheets it has been laid out onto. Built on
  // the way in to a cover rather than up front, so the book she never opens is
  // never wrapped.
  openBook(id) {
    this.bookId = BOOKS[id] ? id : DEFAULT_BOOK;
    this.pages = this.buildPages();
    this.showCover();
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
    // Three across rather than two, so both books and the ring are all one tap
    // away. 480 wide will not carry three of the old 176-wide panels, so they
    // come in to 140 with a 10px gap — which is also why the labels are two
    // short words: at scale 1 a glyph advances 12px, so 11 characters is the
    // most a panel can hold without the name running past its own edges.
    this.reward(cx - 150, 292, 'book', 'A BOOK', 0, this.later(() => this.openBook('beautiful')));
    this.reward(cx, 292, 'book', 'SCHOOL', 160, this.later(() => this.openBook('schoolgirl')));
    this.reward(cx + 150, 292, 'ring', 'A RING', 320);

    const hint = new PixelText(this, cx, 418, '(TAP A BOOK TO READ IT)', {
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
      const back = new MenuButton(this, cx, 600, 'BACK', {
        scale: 3,
        minWidth: 300,
        onPick: () => this.scene.start('Menu'),
      });
      this.track(back);
      this.fadeIn(back, 1200);
      return;
    }

    const again = new MenuButton(this, cx, 555, 'PLAY AGAIN', {
      scale: 3,
      minWidth: 300,
      onPick: () => this.scene.start('JoryIntro'),
    });
    const menu = new MenuButton(this, cx, 650, 'MAIN MENU', {
      scale: 2,
      minWidth: 300,
      onPick: () => this.scene.start('Menu'),
    });
    this.track(again, menu);
    this.fadeIn(again, 1200);
    this.fadeIn(menu, 1340);
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

    const halo = this.add.ellipse(cx, cy + 56, 84, 24, 0x8f6bb0, 0.5).setDepth(401);
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

    const item = this.add.image(cx, cy - 10, texture).setDepth(402).setScale(0);
    this.track(item);
    this.tweens.add({ targets: item, scale: 4, duration: 620, delay, ease: 'Back.out' });
    this.tweens.add({
      targets: item,
      y: cy - 22,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      delay: delay + 620,
      ease: 'Sine.inOut',
    });

    const name = new PixelText(this, cx, cy + 78, label, { scale: 1, color: 0xffe08a });
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
    return wrapText(text, BOOK_CHARS_PER_LINE);
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

    g.fillStyle(BOOK_COVER, 1);
    g.fillRect(x, y, BOOK_SPINE_W, h);

    g.fillStyle(BOOK_COVER_DARK, 1);
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
    if (n < 0) this.showCover();
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
    drawChunkyPanel(board, cx, cy, BOOK_PAGE_W, BOOK_PAGE_H, BOOK_COVER, {});
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
        color: BOOK_COVER_DARK,
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

  showPage(n) {
    this.page = Phaser.Math.Clamp(n, 0, this.pages.length - 1);
    this.clearView();

    const cx = GAME_W / 2;
    const cy = 282;
    const lines = this.pages[this.page];
    const step = BOOK_LINE_H * BOOK_SCALE;

    const paper = this.add.graphics().setDepth(400);
    drawChunkyPanel(paper, cx, cy, BOOK_PAGE_W, BOOK_PAGE_H, BOOK_PAPER, {
      frame: BOOK_COVER,
      frameWidth: BOOK_FRAME,
    });
    this.track(paper);
    this.drawBinding(cx, cy);

    // The spine eats into the left of the page, so the column sits right of
    // centre. Centring the text on the panel instead would push it into the
    // binding and leave a margin twice as wide down the outer edge.
    const faceL = cx - BOOK_PAGE_W / 2 + BOOK_EDGE + BOOK_FRAME;
    const faceR = cx + BOOK_PAGE_W / 2 - BOOK_EDGE - BOOK_FRAME;
    const textCx = (faceL + BOOK_SPINE_W + BOOK_GUTTER_W + faceR) / 2;

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

      // The heart he signed off with, in red. PixelText tints a whole string at
      // once, so this reaches for the single glyph that should not be ink —
      // safe because book pages are set once and never re-typed.
      const heart = line.indexOf('~');
      if (heart >= 0) t.pool[heart].setTint(0xff4d6d);
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
      onPick: this.later(() => this.showRewards()),
    });
    this.track(close);
    this.fadeIn(close, 700);
  }
}

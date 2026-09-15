# How to add a letter

This is the whole thing, assuming you have never edited a file in this project
and do not want to learn how. **You will not touch any code.** You type his
letter into a text file and double-click two things.

If you only ever read one part of this, read [The five steps](#the-five-steps).
Everything after it is there for the day something doesn't go to plan.

---

## The five steps

1. **Copy** `letters/_TEMPLATE.txt` and rename the copy `letter3.txt`
2. **Type** the date on the first line, then paste his message underneath
3. **Double-click** `ADD-LETTER.bat`
4. **Double-click** `heartbound.html` and read the letter to check it
5. **Double-click** `PUBLISH.bat`

That's it. That's the entire process, forever, however many letters there are.

---

## Where everything is

Everything lives in one folder on your computer:

```
C:\Users\tharu\Downloads\Claude\HeartBoundV2
```

Inside it, the only four things you ever need:

| | |
|---|---|
| 📁 **`letters`** | A folder. One text file per letter. This is where you work. |
| ▶️ **`ADD-LETTER.bat`** | Double-click to put your letters into the game. |
| ▶️ **`PUBLISH.bat`** | Double-click to put the game online. |
| 🎮 **`heartbound.html`** | Double-click to play/read it on this computer. |

Everything else in that folder is the game itself. You never need to open any of
it, and nothing you do in `letters` can damage it.

---

## Step 1 — Make the file

Open the `letters` folder.

1. **Right-click** `_TEMPLATE.txt` → **Copy**
2. **Right-click** on empty space in the folder → **Paste**

You now have a file called `_TEMPLATE - Copy.txt`.

3. **Right-click** it → **Rename**
4. Type the next number up and press Enter.

> If `letter2.txt` is the newest one there, yours is **`letter3.txt`**.
>
> It must be the word `letter`, then a number, then `.txt` — nothing else. Not
> `Letter3.txt`, not `letter 3.txt`, not `letter3`.

**If you can't see the `.txt` part of the names:** Windows is hiding it. That's
fine — just type `letter3` when renaming and Windows keeps the `.txt` on for
you. (To show them: in the folder window, click **View** → tick **File name
extensions**.)

---

## Step 2 — Write the letter

**Double-click** your new `letter3.txt` to open it. It'll open in Notepad.

Delete what's in there, and put in two things:

### The date, on the first line

```
Saturday 12/09/2026
```

Day name, space, then day/month/year with slashes. **The day name has to match
the real date.** If you get it wrong, the tool tells you and says exactly what it
should have been — so it's not something you need to be careful about.

### A blank line, then his message

Press Enter twice after the date, then paste what he wrote.

```
Saturday 12/09/2026

Good morning my pretty baby, I hope you slept well ❤️❤️

I love you so much and I hope your day goes well today. Study hard
and drink enough water okay?

I'll be waiting for you to come back. I love you my jellyfish 🪼
```

### The one rule that matters

**A blank line between paragraphs. Each paragraph becomes one page of the
letter.**

That's it. That's the only thing you control and the only thing you need to
think about. Want two paragraphs on the same page? Delete the blank line between
them. Want one long paragraph split across two pages? Put a blank line in the
middle of it.

### Things you do NOT need to worry about

**Paste his message exactly as he sent it. Don't tidy it up.**

The tool handles all of this by itself, and tells you what it did:

- Curly apostrophes (the `’` his phone types) → fixed automatically
- Long dashes `—` and `…` → fixed automatically
- **Emoji** → handled automatically. Paste them in as he sent them.
- Capitals, spelling, his punctuation → left exactly alone

**Now save it.** In Notepad: **File** → **Save**. Or press **Ctrl+S**.

---

## Step 3 — Put it in the game

Go back to the main folder. **Double-click `ADD-LETTER.bat`.**

A black window opens and tells you what it did:

```
  ==========================================
    PUTTING YOUR LETTERS INTO THE GAME
  ==========================================

  letter1.txt  ->  Letter 1, Thursday 10/09/2026
     7 pages:  11/20  14/20  9/20  12/20  8/20  8/20  6/20
     swapped 11 emoji for their stand-ins

  letter3.txt  ->  Letter 3, Saturday 12/09/2026
     4 pages:  6/20  9/20  5/20  3/20
     straightened 4 curly apostrophes
     swapped 6 emoji for their stand-ins

  Saved. The game now has 3 letters in it.
```

**Reading that:**

- `4 pages` — how many pages her letter will have. One per paragraph.
- `6/20` — how full each page is. `6/20` means six lines out of the twenty that
  fit on a sheet. Low numbers are completely fine; a short page is a pause, not
  a mistake. Only a number **over 20** is worth acting on, and it tells you.
- The lines underneath are just it telling you what it tidied up.

If it says anything else, see [When it tells you something is
wrong](#when-it-tells-you-something-is-wrong) below. **It never half-does
anything** — either it works, or it changes nothing at all.

---

## Step 4 — Check it

**Double-click `heartbound.html`.** The game opens in your browser.

1. **INVENTORY** (the pink button)
2. **LETTERS**
3. Your new one is at the **top** — newest first
4. Tap it. The envelope opens and the card comes out.
5. **Read the whole thing, every page.**

What you're looking for:

- **Holes in the middle of words** — a character got through that the game can't
  draw. Rare, and the tool warns you, but eyes are the real test.
- **Missing emoji** — a gap where one should be.
- **The date** is top-right on the first page only. That's on purpose.
- **A page that looks too crammed** — go back to the text file and put a blank
  line where you'd rather it broke.

If something's wrong: fix the text file, save, and **double-click
`ADD-LETTER.bat` again**. It replaces the old version. You can do this as many
times as you like.

---

## Step 5 — Put it online

**Double-click `PUBLISH.bat`.**

It shows you a list of everything that's about to go online, then asks:

```
  Type  yes  and press Enter to publish:
```

**Type `yes` and press Enter.** Anything else — or just closing the window —
cancels it and nothing goes anywhere.

Then wait about a minute and open:

**https://headfirstdownhill.github.io/heartbound/**

> If it still looks the same, that's normal — your phone is showing you the old
> copy. Pull down to refresh, or wait a few minutes.

⚠️ **The website is public.** Anyone who finds the link can read the letters.
That's already true of the ones up there now — this is just worth knowing, since
publishing is now a button.

---

## When it tells you something is wrong

Every message either tool can give you, and what to do. **In every case on this
list, nothing has been changed and the game still works.**

### It stops and says "Something needs fixing"

| What it says | What to do |
|---|---|
| **"…is not named the way this tool expects"** | Rename the file. It has to be `letter` then a number then `.txt`, like `letter3.txt`. |
| **"…is empty"** | You saved a blank file. Open it and put the date and his message in. |
| **"…has a date but no message under it"** | Press Enter twice after the date, then paste his message. |
| **"…uses N emoji the game does not know yet"** | See [A new emoji](#a-new-emoji) below. It names exactly which ones. |
| **"Two files are both letter 3"** | You have two files with the same number. Rename one. |
| **"There are no letters in the letters folder yet"** | Your file isn't in the `letters` folder, or isn't named right. |
| **"…has nothing left in it"** | The message was entirely characters the game can't show. Almost certainly you pasted the wrong thing. |

### It works, but says "Worth a look"

These don't stop anything. It saved your letter and is telling you something.

| What it says | What to do |
|---|---|
| **"12/09/2026 was a Saturday, not a Monday"** | The day name doesn't match the date. It tells you the right one — fix the first line of the file and run it again. |
| **"the date … is not in the expected shape"** | Write it as `Saturday 12/09/2026`. It used what you typed anyway. |
| **"removed 1 '#' that he typed"** | A few keyboard characters are reserved for emoji, so they can't appear in the writing. `&` becomes "and" by itself; the others are removed. If one mattered, reword that line. |
| **"removed characters the writing cannot show"** | Something in his message has no letter shape in the game's font. It names them. Usually harmless. |
| **"paragraph 2 is too long for one page"** | Fine to ignore. If you'd rather choose where it breaks, put a blank line in the middle of that paragraph. |

### The black window says PROBLEM

| What it says | What to do |
|---|---|
| **"Node is not installed"** | Get it free from **https://nodejs.org** — big green button, install it, restart the computer. |
| **"Git is not installed"** | Get it free from **https://git-scm.com** — click through leaving everything as it is, restart the computer. |
| **"your letters were saved, but rebuilding the game failed"** | Your letters are safe. The website copy is fine; it's the double-click `heartbound.html` copy that didn't update. Ask an AI, using the prompt in the next section. |
| **"could not be sent to the website"** | Usually no internet, or GitHub asking who you are. Check the connection and run `PUBLISH.bat` again — it's safe to run twice and picks up where it left off. |
| **"Nothing has changed since last time"** | You haven't added anything since you last published, or you forgot `ADD-LETTER.bat`. |

### The black window closes instantly

It's finished and closed too fast to read. Both files end with "Press any key to
continue", so this shouldn't happen — but if it does, the letters are almost
certainly fine. Check with step 4.

---

## Changing or removing a letter

**To change one:** open its file in `letters`, edit it, save, and double-click
`ADD-LETTER.bat`. It replaces the old version. Then `PUBLISH.bat`.

**To remove one:** delete its file, then double-click `ADD-LETTER.bat`.

> ⚠️ The text file is the **only** copy of his words once it's in there. If you
> might want it back one day, drag it somewhere else instead of deleting it.

**The numbers don't have to be in a neat row.** If you delete `letter5.txt` the
rest carry on working perfectly; the list just goes 6, 4, 3.

---

## A new emoji

When the tool says it doesn't know an emoji, it's because this is the one thing
that does need a change inside the game. You have two options.

**The easy option:** take that emoji out of the letter file, or swap it for one
the game already knows:

> ❤️ 😁 😎 🤬 🤤 😉 🥳 🪼 😋 💏

**The proper option:** have it added to the game. It's a small change, but it is
code. Paste this into any AI chat, along with the emoji it named:

> I have a small web game in a folder on my Windows computer. I need to add
> support for a new emoji. There's a file at `js/scenes/BookScene.js` with a
> list in it that looks like this:
>
> ```
> const EMOJI = {
>   '^': '❤️',
>   '@': '😁',
> };
> const EMOJI_KEYS = /[\^@#%$&*+]/g;
> ```
>
> I need to add the emoji ⟨PASTE THE EMOJI HERE⟩ to it. Please tell me, in very
> simple steps, exactly what to type and where. I have never edited code before.
> Note that I need to add it to BOTH the list AND the `EMOJI_KEYS` line, and the
> character I pick must be one that has no letter shape in the game's font — the
> game already uses `^ @ # % $ & * + = ;` and `_`, and its font covers
> `A-Z 0-9 . , ! ? : - / ' ( ) < > ~`, so pick something outside all of that.

Afterwards, run `ADD-LETTER.bat` again — it reads that list out of the game, so
it'll pick up the new one on its own.

---

## Prompts for an AI

Copy-paste these into any AI chat. Each one is written to work on its own,
without the assistant knowing anything about this project.

### Turn his message into a letter file

> I need you to reformat a message into a plain text file for me. The rules:
>
> 1. The first line must be a date in the form `Saturday 12/09/2026` — day name,
>    then day/month/year. Work out the correct day name for the date I give you
>    and double-check it against a real calendar.
> 2. Then one blank line.
> 3. Then the message, with a blank line between each paragraph. Each paragraph
>    becomes one page, so aim for paragraphs of roughly 40 to 80 words — split
>    anything much longer at a sentence end, and keep short related thoughts
>    together.
> 4. Do not change his words, spelling, capitals or punctuation in any other
>    way. Keep the emoji exactly as they are.
> 5. Give me the result in a single code block so I can copy all of it at once.
>
> The date is: ⟨DATE⟩
>
> The message is:
>
> ⟨PASTE HIS MESSAGE⟩

### Check a letter before I use it

> Below is a plain text file. Please check it against these rules and tell me if
> anything is wrong:
>
> 1. First line is a date like `Saturday 12/09/2026`. Check the day name is
>    actually correct for that date.
> 2. Second line is blank.
> 3. Paragraphs are separated by blank lines. Each becomes one page, so flag any
>    paragraph longer than about 100 words.
> 4. These characters cannot appear in the writing because the game reserves
>    them for emoji: `& # % $ * + = ; @ ^` and `_`. Flag any you find.
>
> Just tell me what to fix. Don't rewrite it unless I ask.
>
> ⟨PASTE THE FILE⟩

### Something went wrong

> I have a small web game in a folder on my Windows computer. I ran a file
> called ADD-LETTER.bat by double-clicking it, and got the message below. I have
> never written code and I need very simple, literal instructions.
>
> Some background: the game is made of files in a folder. Letters are plain text
> files in a `letters` subfolder, one per letter, named like `letter3.txt`. A
> script at `tools/add-letter.js` turns them into `js/data/letterData.js`, and
> then `build.ps1` rebuilds `heartbound.html`. It needs Node.js installed.
>
> The message was:
>
> ⟨PASTE EVERYTHING FROM THE BLACK WINDOW⟩

### I want to change how the letters look

> I have a small Phaser 3 web game. The screen that lists the letters is a
> method called `showLetters` in `js/scenes/BookScene.js`, and each row is drawn
> by `letterRow` just below it. The layout numbers are constants near the top of
> the file called `LIST_ROWS`, `LIST_W`, `LIST_H`, `LIST_TOP`, `LIST_STEP`,
> `LIST_ARROWS_Y` and `LIST_BACK_Y`. The game screen is 480 wide and 800 tall.
>
> I want to ⟨WHAT YOU WANT⟩. Tell me exactly which lines to change and what to.
> After changing anything I run `build.ps1` to rebuild.

---

## What's actually going on

Not needed to use any of this. Here in case you're curious.

**Why the letters are text files.** They used to be written directly into the
game's code, which meant adding one needed someone who could write code. Now
they're plain text and a script converts them. The script rewrites the whole
generated file every time, so running it again always fixes whatever state
things are in.

**What the script actually changes.** Three things, all of which used to have to
be done by hand:

- The game's writing is drawn in a pixel font that was made by hand, letter by
  letter. It has shapes for `A-Z`, the numbers, and about a dozen punctuation
  marks — and nothing else. Anything it doesn't have comes out as a blank space,
  which is why a curly `’` turns into a hole in the middle of a word.
- Emoji can't go in the text directly. The game measures the writing to work out
  where lines break, and it counts an emoji as two characters instead of one, so
  everything after it drifts out of place. So each emoji is swapped for a single
  stand-in character that takes up exactly one space, and the real emoji is
  drawn into that gap when she reads it — using her own phone's emoji, which is
  why they look right on whatever she's holding.
- Because those stand-ins are ordinary keyboard characters, a `&` he actually
  typed would come out as 😉. That's why a few characters get removed or
  reworded, and why it tells you when it does.

**Why the letters have their own screen.** They used to sit on the shelf next to
the books, one panel each. That works for four or five things and then stops:
the shelf grows another row, the row pushes the buttons down, and the bottom one
goes off the edge of the screen. A letter every school day has no ceiling, so
they moved to a list that pages instead. The shelf is four things now and stays
four things.

**Why there are two copies of the game.** `heartbound.html` is the whole game
squashed into one file, which is why you can double-click it and it just runs.
The website uses the separate files instead. `ADD-LETTER.bat` updates both, so
you never have to think about it.

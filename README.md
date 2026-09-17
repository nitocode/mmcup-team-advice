# MMCup — Le Grand Sondage Officiel

A one page prank for the internal MMCup competition. The page asks who is going to win
and promises a free answer. Every keystroke reveals the next letter of
`TRUFFASSONS`, and so does every attempt to delete one.

No framework and no build step: `index.html`, one stylesheet, two scripts, the
team logos as wallpaper and the verdict clip. Open `index.html` to work on it.

## Languages

French and English, switched from the pills in the top left corner. The choice
is kept in `localStorage` and otherwise follows the browser. `assets/i18n.js`
holds both dictionaries: static text carries `data-i18n` (or `data-i18n-<attr>`
for placeholders, titles and labels), and anything written at runtime goes
through `MMCup.t(key)` and repaints on `MMCup.onChange`, so switching language
mid-countdown rewrites the warning that is already on screen.

## How the trap works

`assets/app.js` holds the whole mechanism.

- **Typing.** `keydown` is cancelled and `advance()` writes one more letter of
  the target word. `beforeinput` covers touch keyboards and dictation, and an
  `input` listener repairs anything that still slipped through. Paste, cut and
  drop are cancelled too.
- **Deleting.** Backspace and Delete also reveal a letter, and the first attempt
  arms a three second timer.
- **The verdict.** Submitting the form, that timer expiring, or the developer
  tools opening all call `finale()`, which types the word out over one second and
  then opens a modal playing `assets/video/verdict.mp4` in place. Closing the
  modal pauses and rewinds the clip and re-arms every trap, so the page can be
  handed to the next colleague without a reload.
- **Developer tools.** Four signals: the F12 and Ctrl/Cmd+Shift+I/J/C shortcuts,
  a viewport gap that grows after load, a console bait object whose getter only
  runs when a panel renders it, and a `debugger` statement that only costs time
  while the tools are open. The viewport check compares against the gap measured
  at load, so an embedded frame or a browser sidebar is not mistaken for a panel.

The guide dog button is carried over from the MMCup Team HQ globe, but here it
skips the ceremony and opens the clip straight away.

The clip is served from this repository rather than embedded from YouTube, which
is what keeps the ads out. Browsers refuse sound without a user gesture in some
situations, so playback falls back to muted with an "Activer le son" button
rather than sitting on a still frame.

Append `?safe=1` to keep every trap armed while reporting the trigger in the hint
line instead of opening the video. Useful to demonstrate the mechanism.

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`, which stages the static
files and publishes them with GitHub Pages. The repository needs Settings, Pages,
Source set to **GitHub Actions** once. The site is entirely static, so Pages can
also serve it straight from the `main` branch root instead.

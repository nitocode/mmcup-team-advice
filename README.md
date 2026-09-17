# MMCup — Le Grand Sondage Officiel

A one page prank for the internal MMCup competition. The page asks who won and
promises a free answer. Every keystroke reveals the next letter of
`TRUFFASSONS`, and so does every attempt to delete one.

No framework and no build step: `index.html`, one stylesheet, one script, and
the team logos as wallpaper. Open `index.html` to work on it.

## How the trap works

`assets/app.js` holds the whole mechanism.

- **Typing.** `keydown` is cancelled and `advance()` writes one more letter of
  the target word. `beforeinput` covers touch keyboards and dictation, and an
  `input` listener repairs anything that still slipped through. Paste, cut and
  drop are cancelled too.
- **Deleting.** Backspace and Delete also reveal a letter, and the first attempt
  arms a three second timer.
- **Leaving.** Submitting the form, that timer expiring, or the developer tools
  opening all call `finale()`, which types the word out over one second and then
  sends the browser to the video.
- **Developer tools.** Four signals: the F12 and Ctrl/Cmd+Shift+I/J/C shortcuts,
  a viewport gap that grows after load, a console bait object whose getter only
  runs when a panel renders it, and a `debugger` statement that only costs time
  while the tools are open. The viewport check compares against the gap measured
  at load, so an embedded frame or a browser sidebar is not mistaken for a panel.

The guide dog button is carried over from the MMCup Team HQ globe, but here it
skips the ceremony and goes straight to the video.

## Deployment

Pushes to `main` run `.github/workflows/deploy.yml`, which stages the static
files and publishes them with GitHub Pages. The repository needs Settings, Pages,
Source set to **GitHub Actions** once. The site is entirely static, so Pages can
also serve it straight from the `main` branch root instead.

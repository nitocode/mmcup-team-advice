/*
 * MMCup — the "free and fair" poll.
 *
 * Whatever key is pressed, the input reveals the next letter of TRUFFASSONS.
 * Trying to delete reveals a letter too, and arms a three second countdown.
 * Submitting, opening the developer tools or hitting that countdown all end
 * the same way: the word is typed out over one second, then the verdict modal
 * opens and plays the verdict clip in place. Closing it re-arms everything, so
 * the gag can be shown to the next colleague without a reload.
 */
;(function () {
  'use strict'

  var TARGET = 'TRUFFASSONS'
  var DELETE_GRACE_MS = 3000
  var TYPE_ANIMATION_MS = 1000

  // ?safe=1 keeps every trap but reports instead of opening the video, which
  // is handy to demonstrate the mechanism without the punchline.
  var SAFE = /[?&]safe=1(&|$)/.test(window.location.search)

  var input = document.getElementById('teamInput')
  var form = document.getElementById('voteForm')
  var hint = document.getElementById('hint')
  var guideDogButton = document.getElementById('guideDog')
  var modal = document.getElementById('videoModal')
  var modalClose = document.getElementById('modalClose')
  var modalBackdrop = document.getElementById('modalBackdrop')
  var video = document.getElementById('verdictVideo')
  var modalNote = document.getElementById('modalNote')
  var unmuteButton = document.getElementById('unmuteButton')

  var revealed = 0
  var deleteTimer = null
  var watchers = []
  var finished = false
  var modalOpen = false
  var wideRuns = 0
  var slowRuns = 0

  /* ---------------------------------------------------------------- input */

  function advance() {
    if (finished) return
    revealed = Math.min(revealed + 1, TARGET.length)
    input.value = TARGET.slice(0, revealed)
    var end = input.value.length
    try {
      input.setSelectionRange(end, end)
    } catch (err) {
      /* selection unsupported, nothing to pin */
    }
  }

  function say(message, blink) {
    hint.textContent = message
    hint.className = blink ? 'hint blink' : 'hint'
  }

  function noteDeleteAttempt() {
    if (deleteTimer || finished) return
    say('Effacer ? Le comité a déjà noté votre réponse...', true)
    deleteTimer = setTimeout(function () {
      finale('delete')
    }, DELETE_GRACE_MS)
  }

  // preventDefault on keydown cancels beforeinput, so the flag is cleared on
  // the next tick rather than by the event that would have followed.
  var handledInKeydown = false

  function markHandled() {
    handledInKeydown = true
    setTimeout(function () {
      handledInKeydown = false
    }, 0)
  }

  function isDevToolsCombo(e) {
    if (e.key === 'F12') return true
    var letter = String(e.key || '').toLowerCase()
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (letter === 'i' || letter === 'j' || letter === 'c')) {
      return true
    }
    // Safari on macOS: Cmd + Alt + I/J/C.
    if (e.metaKey && e.altKey && (letter === 'i' || letter === 'j' || letter === 'c')) return true
    // Firefox view-source is close enough to snooping.
    if ((e.ctrlKey || e.metaKey) && letter === 'u') return true
    return false
  }

  input.addEventListener('keydown', function (e) {
    if (finished) {
      e.preventDefault()
      return
    }
    if (isDevToolsCombo(e)) {
      e.preventDefault()
      finale('devtools')
      return
    }
    if (e.key === 'Tab') return
    if (e.key === 'Enter') {
      e.preventDefault()
      finale('submit')
      return
    }
    // Virtual keyboards report this; let beforeinput handle the real edit.
    if (e.key === 'Unidentified' || e.key === 'Process' || e.keyCode === 229) return

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      markHandled()
      noteDeleteAttempt()
      advance()
      return
    }
    // Keep the caret pinned to the end rather than letting it roam.
    if (
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown'
    ) {
      e.preventDefault()
      advance()
      return
    }
    if (String(e.key || '').length === 1) {
      e.preventDefault()
      markHandled()
      advance()
    }
  })

  // Covers touch keyboards, autocorrect, dictation and anything keydown missed.
  input.addEventListener('beforeinput', function (e) {
    if (e.cancelable) e.preventDefault()
    if (finished || handledInKeydown) return
    if (String(e.inputType || '').indexOf('delete') === 0) noteDeleteAttempt()
    advance()
  })

  // Last resort: if an edit still landed, put the word back.
  input.addEventListener('input', function () {
    if (finished) return
    var expected = TARGET.slice(0, revealed)
    if (input.value !== expected) {
      if (input.value.length < expected.length) noteDeleteAttempt()
      advance()
    }
  })

  ;['paste', 'drop', 'dragover'].forEach(function (type) {
    input.addEventListener(type, function (e) {
      e.preventDefault()
      if (type === 'paste') advance()
    })
  })

  input.addEventListener('cut', function (e) {
    e.preventDefault()
    noteDeleteAttempt()
    advance()
  })

  form.addEventListener('submit', function (e) {
    e.preventDefault()
    finale('submit')
  })

  guideDogButton.addEventListener('click', function () {
    // No ceremony here: the guide dog leads straight to the answer.
    if (SAFE) {
      say('[safe] vidéo neutralisée, déclencheur : chien guide', false)
      return
    }
    finished = true
    stopWatchers()
    clearTimeout(deleteTimer)
    openVideo()
  })

  /* ------------------------------------------------------- devtools watch */

  function addInterval(fn, delay) {
    watchers.push(setInterval(fn, delay))
  }

  function stopWatchers() {
    watchers.forEach(clearInterval)
    watchers = []
  }

  // A constant gap between the window and the viewport is normal (embedded
  // frames, sidebars). Only a gap that grows after load means a panel opened.
  var baseWidthGap = Math.max(0, (window.outerWidth || 0) - window.innerWidth)
  var baseHeightGap = Math.max(0, (window.outerHeight || 0) - window.innerHeight)

  function startWatchers() {
    stopWatchers()
    wideRuns = 0
    slowRuns = 0

    addInterval(function () {
      if (!window.outerWidth) return
      var widthGap = window.outerWidth - window.innerWidth
      var heightGap = window.outerHeight - window.innerHeight
      var opened = widthGap - baseWidthGap > 140 || heightGap - baseHeightGap > 140
      wideRuns = opened ? wideRuns + 1 : 0
      if (wideRuns >= 2) finale('devtools')
    }, 600)

    // A debugger statement only costs time while the tools are open. Three
    // consecutive slow runs, so a garbage collection pause is not a verdict.
    addInterval(function () {
      var started = Date.now()
      // eslint-disable-next-line no-debugger
      debugger
      slowRuns = Date.now() - started > 180 ? slowRuns + 1 : 0
      if (slowRuns >= 3) finale('devtools')
    }, 1200)
  }

  startWatchers()

  window.addEventListener('keydown', function (e) {
    if (modalOpen && e.key === 'Escape') {
      closeVideo()
      return
    }
    if (isDevToolsCombo(e)) {
      e.preventDefault()
      finale('devtools')
    }
  })

  /* ---------------------------------------------------------------- modal */

  function playVerdict() {
    video.currentTime = 0
    video.muted = false
    unmuteButton.hidden = true
    modalNote.hidden = false

    var attempt = video.play()
    if (!attempt || typeof attempt.catch !== 'function') return

    attempt.catch(function () {
      // The browser refused sound without a fresh gesture: play muted and
      // offer the switch rather than leaving a still frame.
      video.muted = true
      modalNote.hidden = true
      unmuteButton.hidden = false
      video.play().catch(function () {
        unmuteButton.hidden = true
        modalNote.hidden = false
        modalNote.textContent = 'Appuyez sur lecture pour connaître le verdict.'
      })
    })
  }

  function openVideo() {
    if (modalOpen) return
    modalOpen = true
    modal.hidden = false
    document.body.classList.add('modal-open')
    modalClose.focus()
    playVerdict()
  }

  function closeVideo() {
    if (!modalOpen) return
    modalOpen = false
    modal.hidden = true
    video.pause()
    video.currentTime = 0
    document.body.classList.remove('modal-open')
    resetTrap()
  }

  function resetTrap() {
    finished = false
    revealed = 0
    clearTimeout(deleteTimer)
    deleteTimer = null
    input.removeAttribute('readonly')
    input.value = ''
    say('', false)
    startWatchers()
    input.focus()
  }

  unmuteButton.addEventListener('click', function () {
    video.muted = false
    unmuteButton.hidden = true
    modalNote.hidden = false
    video.play()
  })

  modalClose.addEventListener('click', closeVideo)
  modalBackdrop.addEventListener('click', closeVideo)

  /* --------------------------------------------------------------- finale */

  function finale(reason) {
    if (finished) return
    finished = true
    stopWatchers()
    clearTimeout(deleteTimer)

    var messages = {
      devtools: 'Inspecter le code ? Le comité vous transmet le verdict.',
      submit: 'Vote enregistré. Verification en cours...',
      delete: 'Trop tard, le résultat est déjà certifié.',
    }
    say(messages[reason] || messages.submit, false)

    input.value = ''
    input.setAttribute('readonly', 'readonly')

    var step = TYPE_ANIMATION_MS / TARGET.length
    var index = 0
    var typer = setInterval(function () {
      index += 1
      input.value = TARGET.slice(0, index)
      if (index >= TARGET.length) {
        clearInterval(typer)
        if (SAFE) {
          say('[safe] vidéo neutralisée, déclencheur : ' + reason, false)
          return
        }
        setTimeout(openVideo, 120)
      }
    }, step)
  }

  /* ------------------------------------------------------ period flourish */

  var counter = document.getElementById('counter')
  if (counter) {
    var hits = parseInt(counter.textContent, 10) || 137
    setInterval(function () {
      hits += 1
      counter.textContent = String(hits).padStart(7, '0')
    }, 4000)
  }

  // Exposed only so the page can be checked without opening a panel.
  window.__mmcupFinale = finale
  window.__mmcupSafe = SAFE
})()

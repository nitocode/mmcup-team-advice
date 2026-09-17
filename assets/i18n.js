/*
 * Tiny translation layer for a page with no framework.
 *
 * Static text carries data-i18n (textContent) or data-i18n-<attr> attributes.
 * Runtime strings go through MMCup.t(key, vars); anything drawn from those has
 * to re-render on MMCup.onChange so a language switch repaints the whole page.
 */
window.MMCup = (function () {
  'use strict'

  var STORAGE_KEY = 'mmcup-advice-locale'

  var DICT = {
    fr: {
      'doc.title': 'MMCup 2026 — Le Grand Sondage Officiel',
      'doc.description':
        "Sondage officiel de la MMCup. Saisissez librement le nom de l'équipe gagnante.",
      kicker: '★ Édition 2026 ★',
      title: 'Qui va gagner la MMCup ?',
      subtitle: "Tapez le nom de l'équipe gagnante. Réponse totalement libre, promis juré.",
      ticker:
        '✦ SONDAGE OFFICIEL DE LA MMCUP ✦ 100 % INDEPENDANT ✦ AUCUNE INFLUENCE EXTERIEURE ✦ VOTEZ EN TOUTE LIBERTE ✦ RESULTATS CERTIFIES PAR NOS SERVICES ✦',
      'field.label': "Nom de l'équipe gagnante",
      'field.placeholder': 'Saisissez votre réponse ici...',
      vote: 'Valider mon vote',
      fineprint:
        'Votre vote est anonyme, chiffré, et relu par un comité de chiens indépendants.',
      'counter.label': 'Visiteurs',
      'badge.viewed': 'Best viewed in 1024 × 768',
      'badge.ie': 'Optimisé pour Internet Explorer 8',
      'badge.powered': 'Powered by HTML5 & friendship',
      copyright: "© 2026 Comité d'organisation de la MMCup — tous droits réservés",
      guideDog: 'Chien guide',
      'guideDog.title': 'Mode chien guide',
      'lang.switch': 'Changer de langue',
      'modal.title': '✦ Le verdict officiel ✦',
      'modal.close': 'Fermer',
      'modal.note': "Résultat certifié par le comité d'organisation.",
      'modal.unmute': 'Activer le son',
      'modal.pressPlay': 'Appuyez sur lecture pour connaître le verdict.',
      'hint.delete': 'Effacer ? Le comité a déjà noté votre réponse...',
      'final.devtools': 'Inspecter le code ? Le comité vous transmet le verdict.',
      'final.submit': 'Vote enregistré. Vérification en cours...',
      'final.delete': 'Trop tard, le résultat est déjà certifié.',
      safe: '[safe] vidéo neutralisée, déclencheur : {reason}',
      'reason.devtools': 'outils de développement',
      'reason.submit': 'validation',
      'reason.delete': 'effacement',
      'reason.guideDog': 'chien guide',
    },
    en: {
      'doc.title': 'MMCup 2026 — The Official Poll',
      'doc.description': "Official MMCup poll. Type the winning team's name, freely.",
      kicker: '★ 2026 Edition ★',
      title: 'Who is going to win the MMCup?',
      subtitle:
        'Type the name of the winning team. Completely free answer, cross our hearts.',
      ticker:
        '✦ OFFICIAL MMCUP POLL ✦ 100% INDEPENDENT ✦ NO OUTSIDE INFLUENCE ✦ VOTE FREELY ✦ RESULTS CERTIFIED BY OUR SERVICES ✦',
      'field.label': 'Name of the winning team',
      'field.placeholder': 'Type your answer here...',
      vote: 'Submit my vote',
      fineprint:
        'Your vote is anonymous, encrypted, and reviewed by a committee of independent dogs.',
      'counter.label': 'Visitors',
      'badge.viewed': 'Best viewed in 1024 × 768',
      'badge.ie': 'Optimised for Internet Explorer 8',
      'badge.powered': 'Powered by HTML5 & friendship',
      copyright: '© 2026 MMCup organising committee — all rights reserved',
      guideDog: 'Guide dog',
      'guideDog.title': 'Guide dog mode',
      'lang.switch': 'Switch language',
      'modal.title': '✦ The official verdict ✦',
      'modal.close': 'Close',
      'modal.note': 'Result certified by the organising committee.',
      'modal.unmute': 'Turn on sound',
      'modal.pressPlay': 'Press play to hear the verdict.',
      'hint.delete': 'Deleting? The committee already wrote your answer down...',
      'final.devtools': 'Inspecting the code? The committee is sending you the verdict.',
      'final.submit': 'Vote recorded. Verification under way...',
      'final.delete': 'Too late, the result is already certified.',
      safe: '[safe] video suppressed, trigger: {reason}',
      'reason.devtools': 'developer tools',
      'reason.submit': 'submit',
      'reason.delete': 'delete',
      'reason.guideDog': 'guide dog',
    },
  }

  var ATTRS = ['placeholder', 'title', 'aria-label', 'content']
  var listeners = []
  var locale = detect()

  function detect() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY)
      if (saved === 'fr' || saved === 'en') return saved
    } catch (err) {
      /* storage unavailable */
    }
    return String(navigator.language || 'fr').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en'
  }

  function t(key, vars) {
    var text = (DICT[locale] && DICT[locale][key]) || DICT.fr[key] || key
    if (!vars) return text
    return text.replace(/\{(\w+)\}/g, function (whole, name) {
      return Object.prototype.hasOwnProperty.call(vars, name) ? vars[name] : whole
    })
  }

  function apply() {
    document.documentElement.lang = locale
    document.title = t('doc.title')

    var nodes = document.querySelectorAll('[data-i18n]')
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'))
    }

    for (var a = 0; a < ATTRS.length; a++) {
      var attr = ATTRS[a]
      var tagged = document.querySelectorAll('[data-i18n-' + attr + ']')
      for (var j = 0; j < tagged.length; j++) {
        tagged[j].setAttribute(attr, t(tagged[j].getAttribute('data-i18n-' + attr)))
      }
    }

    var buttons = document.querySelectorAll('.lang-button')
    for (var b = 0; b < buttons.length; b++) {
      var active = buttons[b].getAttribute('data-locale') === locale
      buttons[b].setAttribute('aria-pressed', active ? 'true' : 'false')
      buttons[b].className = active ? 'lang-button is-active' : 'lang-button'
    }
  }

  function setLocale(next) {
    if (next !== 'fr' && next !== 'en') return
    if (next === locale) return
    locale = next
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch (err) {
      /* storage unavailable */
    }
    apply()
    for (var i = 0; i < listeners.length; i++) listeners[i](locale)
  }

  function onChange(fn) {
    listeners.push(fn)
  }

  var switcher = document.querySelector('.lang-switch')
  if (switcher) {
    switcher.addEventListener('click', function (e) {
      var button = e.target.closest ? e.target.closest('.lang-button') : null
      if (button) setLocale(button.getAttribute('data-locale'))
    })
  }

  apply()

  return {
    t: t,
    apply: apply,
    setLocale: setLocale,
    onChange: onChange,
    getLocale: function () {
      return locale
    },
  }
})()

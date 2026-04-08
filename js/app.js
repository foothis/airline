/**
 * SAS Airlines App — Main orchestrator
 * Handles: status bar clock, card open/close, call button bindings, state
 */

window.SAS_APP = (function() {
  'use strict';

  // ═══ APP STATE ═══
  const state = {
    inCall: false,
    authenticated: false,
    lastScreen: null,
    lastBookingRef: null,
    callDuration: null,
    openCards: []
  };

  // ═══ INIT ═══
  function init() {
    updateClock();
    setInterval(updateClock, 1000);

    // Add overlay backdrop to DOM
    const backdrop = document.createElement('div');
    backdrop.id = 'overlay-backdrop';
    backdrop.className = 'overlay-backdrop';
    backdrop.addEventListener('click', closeTopCard);
    document.body.appendChild(backdrop);

    // Add call status pill to DOM
    const pill = document.createElement('div');
    pill.id = 'call-status-pill';
    pill.className = 'call-status-pill';
    pill.textContent = 'On call with Sarah';
    document.body.appendChild(pill);

    // Bottom nav tabs
    document.querySelectorAll('.bottom-nav-item').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('is-active'));
        this.classList.add('is-active');
      });
    });

    // Initialize CTC
    window.SAS_CTC.init();

    console.log('[SAS App] Initialized. Demo mode: SAS_DEMO.trigger("screen") or URL hash #screen=booking');
  }

  // ═══ CARD MANAGEMENT ═══
  function openCard(id) {
    // Close any existing open card first (unless same)
    const existing = document.querySelector('.overlay-card.is-open');
    if (existing && existing.id !== id) {
      existing.classList.remove('is-open');
      const idx = state.openCards.indexOf(existing.id);
      if (idx > -1) state.openCards.splice(idx, 1);
    }

    const card = document.getElementById(id);
    if (!card) return;

    card.classList.add('is-open');
    state.openCards.push(id);
    state.lastScreen = id.replace('card-', '');

    // Show backdrop
    const backdrop = document.getElementById('overlay-backdrop');
    if (backdrop) backdrop.classList.add('is-visible');

    // Haptic feedback (mobile)
    if (navigator.vibrate) navigator.vibrate(8);
  }

  function closeCard(id) {
    const card = document.getElementById(id);
    if (!card) return;
    card.classList.remove('is-open');

    const idx = state.openCards.indexOf(id);
    if (idx > -1) state.openCards.splice(idx, 1);

    // Hide backdrop if no more open cards
    if (state.openCards.length === 0) {
      const backdrop = document.getElementById('overlay-backdrop');
      if (backdrop) backdrop.classList.remove('is-visible');
    }
  }

  function closeTopCard() {
    const top = state.openCards[state.openCards.length - 1];
    if (top) closeCard(top);
  }

  // ═══ CLOCK ═══
  function updateClock() {
    const el = document.getElementById('status-time');
    if (!el) return;
    const now = new Date();
    el.textContent = now.getHours().toString().padStart(2, '0') + ':' +
                     now.getMinutes().toString().padStart(2, '0');
  }

  // ═══ TRANSLATIONS ═══
  const i18n = {
    en: {
      'hero-eyebrow':        'Discover the world with SAS',
      'hero-headline':       'New<br>Destinations',
      'hero-sub':            'Travel between April 29 – Oct 31',
      'hero-cta':            'Book by April 14',
      'sw-from-label':       'From',
      'sw-from-city':        'Stockholm',
      'sw-to-label':         'To',
      'sw-to-value':         'Search',
      'sw-to-city':          'Destination',
      'offers-label':        'Offers right now',
      'offers-sub':          'Stockholm, one way, including taxes and fees',
      'offer-eyebrow':       'Find the lowest fares',
      'offer-headline':      'for your next trip',
      'holidays-headline':   'More vacation for less',
      'holidays-sub':        'Lower prices when you book flight + hotel together',
      'holidays-btn':        'Book now',
      'action-add-booking':  'Add Booking',
      'action-checkin':      'Check-In',
      'action-flightstatus': 'Flight Status',
      'action-feedback':     'Feedback',
      'nav-home':            'Home',
      'nav-mytrips':         'My trips',
      'nav-callsarah':       'Call Sarah',
      'nav-me':              'Me',
      'nav-more':            'More',
      'points-label':        'Points',
      'incall-name':         'Sarah · SAS AI',
    },
    sv: {
      'hero-eyebrow':        'Upptäck världen med SAS',
      'hero-headline':       'Nya<br>Destinationer',
      'hero-sub':            'Res mellan 29 apr – 31 okt',
      'hero-cta':            'Boka senast 14 april',
      'sw-from-label':       'Från',
      'sw-from-city':        'Stockholm',
      'sw-to-label':         'Till',
      'sw-to-value':         'Sök',
      'sw-to-city':          'Destination',
      'offers-label':        'Erbjudanden just nu',
      'offers-sub':          'Stockholm, enkel resa, inkl. skatter och avgifter',
      'offer-eyebrow':       'Hitta de lägsta priserna',
      'offer-headline':      'för din nästa resa',
      'holidays-headline':   'Mer semester för mindre',
      'holidays-sub':        'Lägre priser när du bokar flyg + hotell tillsammans',
      'holidays-btn':        'Boka nu',
      'action-add-booking':  'Lägg till bokning',
      'action-checkin':      'Checka in',
      'action-flightstatus': 'Flygstatus',
      'action-feedback':     'Återkoppling',
      'nav-home':            'Hem',
      'nav-mytrips':         'Mina resor',
      'nav-callsarah':       'Ring Sarah',
      'nav-me':              'Mig',
      'nav-more':            'Mer',
      'points-label':        'Poäng',
      'incall-name':         'Sarah · SAS AI',
    }
  };

  function applyTranslations(lang) {
    const t = i18n[lang] || i18n.en;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });
    // Elements with HTML content (e.g. <br>)
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      const key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });
  }

  // ═══ LANGUAGE TOGGLE ═══
  function toggleLang() {
    window.SAS_LANG = (window.SAS_LANG === 'sv') ? 'en' : 'sv';
    const flag = document.getElementById('lang-flag');
    const code = document.getElementById('lang-code');
    if (flag) flag.textContent = window.SAS_LANG === 'sv' ? '🇸🇪' : '🇬🇧';
    if (code) code.textContent = window.SAS_LANG === 'sv' ? 'SV' : 'EN';
    applyTranslations(window.SAS_LANG);
    console.log('[SAS App] Language:', window.SAS_LANG, '→ userId:', window.SAS_CONFIG.USER_ID);
    // Reinit widget so next call uses updated userId
    if (window.SAS_CTC) window.SAS_CTC.reinit();
  }

  // ═══ EXPOSE ═══
  return { init, openCard, closeCard, closeTopCard, toggleLang, state };

})();

// Global closeCard for use in onclick attributes
function closeCard(id) {
  window.SAS_APP.closeCard(id);
}

// Start app on DOM ready
document.addEventListener('DOMContentLoaded', window.SAS_APP.init);

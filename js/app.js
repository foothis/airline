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
    pill.innerHTML = '● On call with Sarah';
    document.body.appendChild(pill);

    // Bind call controls
    document.getElementById('call-btn-start').addEventListener('click', () => {
      window.SAS_CTC.startCall();
    });
    document.getElementById('btn-hangup') && document.getElementById('btn-hangup').addEventListener('click', () => {
      window.SAS_CTC.hangUp();
    });
    document.getElementById('btn-mute') && document.getElementById('btn-mute').addEventListener('click', () => {
      window.SAS_CTC.toggleMute();
    });
    document.getElementById('btn-speaker') && document.getElementById('btn-speaker').addEventListener('click', function() {
      this.classList.toggle('is-on');
    });

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

  // ═══ EXPOSE ═══
  return { init, openCard, closeCard, closeTopCard, state };

})();

// Global closeCard for use in onclick attributes
function closeCard(id) {
  window.SAS_APP.closeCard(id);
}

// Start app on DOM ready
document.addEventListener('DOMContentLoaded', window.SAS_APP.init);

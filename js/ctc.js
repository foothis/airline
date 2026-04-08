/**
 * Click-to-Call — Cognigy WebRTC Widget integration
 *
 * Widget script: webRTCWidget.js (loaded in index.html)
 * Init:          window.initWebRTCWidget(endpointUrl, options, callback)
 * Callback:      receives widget instance with event emitter
 * Key events:    newRTCSession → session.on('newInfo') ← SIP INFO co-browsing
 *                connected / disconnected
 *
 * Strategy:
 *  1. Load widget → initialise → hide its native UI with CSS
 *  2. Proxy our "Call Sarah" button → widget's .webrtc_widget_call_button
 *  3. newInfo on session → handleInfoReceived → drive overlay screens
 */

window.SAS_CTC = (function () {
  'use strict';

  let currentSession = null;
  let callTimer = null;
  let callSeconds = 0;
  let widgetReady = false;
  let widgetLang = null; // language at last widget init

  // ═══ INIT ═══════════════════════════════════════════════════════════════
  function init() {
    const endpointUrl = (window.SAS_CONFIG || {}).VG_ENDPOINT_URL;

    // Widget script may still be loading — retry
    if (typeof window.initWebRTCWidget !== 'function') {
      console.log('[SAS CTC] Widget not ready, retrying…');
      setTimeout(init, 300);
      return;
    }

    if (!endpointUrl || endpointUrl.includes('REPLACE_WITH')) {
      console.warn('[SAS CTC] No VG endpoint — demo mode');
      initDemoMode();
      return;
    }

    try {
      const userId = (window.SAS_CONFIG || {}).USER_ID || 'demoen';
      widgetLang = window.SAS_LANG || 'en';
      window.initWebRTCWidget(endpointUrl, { userId }, function (widget) {
        widgetReady = true;
        console.log('[SAS CTC] Widget ready (userId:', userId, ')', widget);

        if (!widget) { initDemoMode(); return; }

        // ── Session-level events ──────────────────────────────────────
        const bindSession = function (session) {
          currentSession = session;

          // ★ SIP INFO from Cognigy Send Metadata node
          session.on('newInfo', function (e) {
            const info = e.info || e;
            handleInfoReceived(info);
          });

          session.on('accepted', onCallConnected);
          session.on('confirmed', onCallConnected);
          session.on('ended',     onCallEnded);
          session.on('failed',    onCallEnded);
          session.on('terminated',onCallEnded);

          // Transcription (if enabled on the endpoint)
          session.on('transcription', function (data) {
            if (data && data.messages && data.messages.length) {
              const last = data.messages[data.messages.length - 1];
              if (last && last.text) updateTranscript(last.text, last.speaker);
            }
          });
        };

        // ── Widget / user-agent events ────────────────────────────────
        if (typeof widget.on === 'function') {
          widget.on('newRTCSession', function (e) {
            bindSession(e.session || e);
          });
          widget.on('connected',    onCallConnected);
          widget.on('disconnected', onCallEnded);
        }

        // Fallback: if widget exposes userAgent directly
        if (widget.userAgent && typeof widget.userAgent.on === 'function') {
          widget.userAgent.on('newRTCSession', function (e) {
            bindSession(e.session || e);
          });
        }
      });

      hideWidgetUI();
      bindCallButton();
      initDemoMode(); // always available for testing

    } catch (e) {
      console.error('[SAS CTC] Init failed:', e);
      initDemoMode();
    }
  }

  // ═══ HIDE WIDGET NATIVE UI ───────────────────────────────────────────────
  // Keep the widget alive (WebRTC needs it) but off-screen.
  // We drive calls by clicking the hidden widget buttons programmatically.
  function hideWidgetUI() {
    const s = document.createElement('style');
    s.id = 'sas-widget-hide';
    s.textContent = `
      /* Move widget container off-screen — keep it functional */
      #cognigy-ctc-widget,
      [class*="webrtc_widget"][class*="root"],
      [class*="webrtc_widget"][class*="container"],
      [class*="webrtc_widget"][class*="wrapper"],
      .privacy-dialog-card {
        position: fixed !important;
        left: -9999px !important;
        top: -9999px !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
    `;
    document.head.appendChild(s);
  }

  // ═══ BIND OUR BUTTONS TO WIDGET BUTTONS ─────────────────────────────────
  function bindCallButton() {
    const ourCallBtn = document.getElementById('call-btn-start');
    if (ourCallBtn) {
      ourCallBtn.addEventListener('click', startCall);
    }
    const ourHangup = document.getElementById('btn-hangup');
    if (ourHangup) {
      ourHangup.addEventListener('click', hangUp);
    }
    const ourMute = document.getElementById('btn-mute');
    if (ourMute) {
      ourMute.addEventListener('click', toggleMute);
    }
    const ourSpeaker = document.getElementById('btn-speaker');
    if (ourSpeaker) {
      ourSpeaker.addEventListener('click', function () {
        this.classList.toggle('is-on');
      });
    }
  }

  // ═══ CALL CONTROLS ───────────────────────────────────────────────────────
  // ═══ CABIN CHIME ─────────────────────────────────────────────────────────
  // Airport PA "bing-bong-bing" — three-note ascending chime with marimba
  // character: layered sine + triangle oscillators, sharp percussive attack.
  function playCabinChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Bing-bong-bing: C5 → E5 → G5, each note 0.38s apart
      const notes = [
        { freq: 523.25, start: 0.0  },  // C5 — bing
        { freq: 659.25, start: 0.38 },  // E5 — bong
        { freq: 784.00, start: 0.76 },  // G5 — bing
      ];

      notes.forEach(function(n) {
        const t = ctx.currentTime + n.start;

        // Primary tone — sine wave (fundamental)
        var osc1  = ctx.createOscillator();
        var gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = n.freq;
        gain1.gain.setValueAtTime(0, t);
        gain1.gain.linearRampToValueAtTime(0.28, t + 0.008); // sharp attack
        gain1.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
        osc1.connect(gain1); gain1.connect(ctx.destination);
        osc1.start(t); osc1.stop(t + 1.15);

        // Second harmonic — adds marimba 'clunk' at the front
        var osc2  = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.value = n.freq * 2.756; // inharmonic partial for wood character
        gain2.gain.setValueAtTime(0, t);
        gain2.gain.linearRampToValueAtTime(0.07, t + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
        osc2.connect(gain2); gain2.connect(ctx.destination);
        osc2.start(t); osc2.stop(t + 0.14);
      });
    } catch (e) { /* Audio not available — silent fallback */ }
  }

  // Mute any <audio> elements the widget tries to play as a ringtone
  function suppressWidgetRingtone() {
    // Mute existing audio elements
    document.querySelectorAll('audio').forEach(function(a) { a.muted = true; a.volume = 0; });
    // Watch for new ones the widget might inject
    if (window._ringtoneObserver) window._ringtoneObserver.disconnect();
    window._ringtoneObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeName === 'AUDIO') { node.muted = true; node.volume = 0; }
          if (node.querySelectorAll) node.querySelectorAll('audio').forEach(function(a) { a.muted = true; a.volume = 0; });
        });
      });
    });
    window._ringtoneObserver.observe(document.body, { childList: true, subtree: true });
    // Stop observing after 10s (call should be connected by then)
    setTimeout(function() { if (window._ringtoneObserver) window._ringtoneObserver.disconnect(); }, 10000);
  }

  function startCall() {
    playCabinChime();
    suppressWidgetRingtone();

    // Re-init widget if language changed since last init
    if (widgetReady && widgetLang && widgetLang !== (window.SAS_LANG || 'en')) {
      console.log('[SAS CTC] Language changed — reinitialising widget');
      widgetReady = false;
      init();
      setTimeout(startCall, 500);
      return;
    }
    if (!widgetReady) { initDemoMode(); onCallConnected(); return; }

    const btn = document.querySelector('.webrtc_widget_call_button');
    if (btn) {
      // Briefly make it pointer-events: auto so the click lands
      btn.style.pointerEvents = 'auto';
      btn.click();
      btn.style.pointerEvents = '';
      const callBtn = document.getElementById('call-btn-start');
      if (callBtn) callBtn.classList.add('is-ringing');
    } else {
      console.warn('[SAS CTC] Widget call button not found — demo mode');
      onCallConnected();
    }
  }

  function hangUp() {
    const btn = document.querySelector('.webrtc_widget_end_call_button');
    if (btn) {
      btn.style.pointerEvents = 'auto';
      btn.click();
      btn.style.pointerEvents = '';
    } else {
      onCallEnded();
    }
  }

  function toggleMute() {
    const btn = document.querySelector('.webrtc_widget_mute_button');
    if (btn) {
      btn.style.pointerEvents = 'auto';
      btn.click();
      btn.style.pointerEvents = '';
    }
    const ourBtn = document.getElementById('btn-mute');
    if (ourBtn) ourBtn.classList.toggle('is-muted');
  }

  // ═══ CALL STATE ──────────────────────────────────────────────────────────
  function onCallConnected() {
    const callBtn = document.getElementById('call-btn-start');
    if (callBtn) callBtn.classList.remove('is-ringing');

    const incallBar = document.getElementById('incall-bar');
    if (incallBar) incallBar.style.display = 'block';

    callSeconds = 0;
    callTimer = setInterval(function () {
      callSeconds++;
      const el = document.getElementById('call-duration');
      if (el) el.textContent = fmt(callSeconds);
      if (window.SAS_APP && window.SAS_APP.state)
        window.SAS_APP.state.callDuration = fmt(callSeconds);
    }, 1000);

    const pill = document.getElementById('call-status-pill');
    if (pill) pill.classList.add('is-visible');
  }

  function onCallEnded() {
    const incallBar = document.getElementById('incall-bar');
    if (incallBar) incallBar.style.display = 'none';

    clearInterval(callTimer);
    callSeconds = 0;
    currentSession = null;

    const pill = document.getElementById('call-status-pill');
    if (pill) pill.classList.remove('is-visible');

    document.querySelectorAll('.overlay-card.is-open').forEach(function (c) {
      c.classList.remove('is-open');
    });
    const backdrop = document.getElementById('overlay-backdrop');
    if (backdrop) backdrop.classList.remove('is-visible');
  }

  function fmt(s) {
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  }

  // ═══ SIP INFO HANDLER ────────────────────────────────────────────────────
  // Called when Cognigy's "Send Metadata" node fires.
  // Payload arrives as the `body` of the SIP INFO message.
  function handleInfoReceived(info) {
    const raw = (info && info.body)
              || (info && info.info && info.info.body)
              || (info && typeof info === 'string' ? info : null);

    let data;
    if (raw) {
      try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
      catch (e) { console.warn('[SAS CTC] Bad SIP INFO body:', raw); return; }
    } else if (info && (info.screen || info.transcript || info.handover)) {
      data = info; // demo mode / transcript-only payload
    } else {
      return;
    }

    console.log('[SAS CTC] ✦ Metadata:', data);

    if (window.SAS_APP && window.SAS_APP.state) {
      window.SAS_APP.state.lastScreen = data.screen;
      if (data.data && data.data.reference)
        window.SAS_APP.state.lastBookingRef = data.data.reference;
    }

    switch (data.screen) {
      case 'booking':    window.SAS_SCREENS.showBooking(data.data);    break;
      case 'flights':    window.SAS_SCREENS.showFlights(data.data);    break;
      case 'seat':       window.SAS_SCREENS.showSeat(data.data);       break;
      case 'faq':        window.SAS_SCREENS.showFAQ(data.data);        break;
      case 'escalation': window.SAS_SCREENS.showEscalation(data.data); break;
      case 'baggage':    showBaggageCard(data.data);                   break;
      case 'confirm':    showConfirmCard(data.data);                   break;
    }

    if (data.transcript) updateTranscript(data.transcript, data.speaker);
    if (data.handover === true) window.SAS_SCREENS.showEscalation(data);
  }

  function showBaggageCard(d) {
    if (!d) return;
    setEl('baggage-desc', (d.bags || 1) + ' extra bag added to ' + (d.flightNumber || 'your flight'));
    setEl('baggage-ref',    d.confirmation || '—');
    setEl('baggage-amount', (d.price || 399) + ' ' + (d.currency || 'SEK'));
    window.SAS_APP.openCard('card-baggage');
  }

  function showConfirmCard(d) {
    if (!d) return;
    setEl('confirm-desc',   d.description || 'Your flight has been confirmed');
    setEl('confirm-ref',    d.reference || '—');
    setEl('confirm-amount', d.price ? (d.currency || 'SEK') + ' ' + d.price.toLocaleString() + ' · Confirmed' : '');
    window.SAS_APP.openCard('card-booking-confirm');
  }

  // ═══ TRANSCRIPT ──────────────────────────────────────────────────────────
  function updateTranscript(text, speaker) {
    const el  = document.getElementById('transcript-text');
    const row = document.getElementById('transcript-row');
    if (!el || !row) return;

    el.textContent = (speaker === 'user' ? 'You: ' : '') + text;
    row.classList.remove('is-empty');

    // Reset animation so it replays on every new message
    el.style.animation = 'none';
    el.style.transform = 'translateX(0)';
    void el.offsetWidth; // force reflow

    // Calculate overflow: how far does the text extend past the container?
    const containerW = row.offsetWidth - 24; // minus padding
    const textW      = el.scrollWidth;
    const overflow   = textW - containerW;

    if (overflow > 0) {
      // Speed: ~80px/s (comfortable reading pace), min 2s, max 12s
      const duration = Math.min(12, Math.max(2, overflow / 80));
      el.style.setProperty('--scroll-dist', `-${overflow}px`);
      el.style.animation = `transcript-scroll ${duration}s ease-in-out forwards`;
    }

    clearTimeout(updateTranscript._t);
    updateTranscript._t = setTimeout(function () {
      row.classList.add('is-empty');
      el.style.animation = 'none';
      el.style.transform = 'translateX(0)';
    }, 12000);
  }

  // ═══ SEND TO AGENT ───────────────────────────────────────────────────────
  function sendToAgent(payload) {
    if (currentSession && typeof currentSession.sendInfo === 'function') {
      currentSession.sendInfo('', payload);
    }
  }

  // ═══ DEMO MODE ───────────────────────────────────────────────────────────
  function initDemoMode() {
    if (window.SAS_DEMO) return; // already set up

    window.SAS_DEMO = {
      trigger: function (screen, data) {
        handleInfoReceived({ screen: screen, data: data || demoData(screen) });
      },
      call:   function () { onCallConnected(); },
      hangup: function () { onCallEnded(); }
    };

    window.addEventListener('hashchange', function () {
      const m = window.location.hash.match(/^#screen=(.+)$/);
      if (m) handleInfoReceived({ screen: m[1], data: demoData(m[1]) });
    });

    console.log('[SAS CTC] Demo mode — SAS_DEMO.trigger("booking"|"flights"|"seat"|"faq"|"baggage"|"escalation")');
  }

  function demoData(screen) {
    const map = {
      booking: {
        reference: 'SK7234',
        passenger: { firstName: 'Erik', lastName: 'Johansson' },
        outbound: { flightNumber: 'SK 425', origin: 'ARN', destination: 'CPH',
          departureTime: '06:00', arrivalTime: '07:20', duration: '1h 20m',
          date: 'Apr 15, 2026', class: 'SAS Go', seat: '14C', baggage: '1 × 23kg' },
        status: 'Confirmed'
      },
      flights: {
        origin: 'ARN', destination: 'LHR', date: 'Mon 20 Apr', passengers: 1,
        results: [
          { flightNumber: 'SK 541', departureTime: '07:15', arrivalTime: '09:40', duration: '3h 25m', price: 1890, currency: 'SEK', class: 'SAS Go',       badge: 'cheapest' },
          { flightNumber: 'SK 543', departureTime: '11:30', arrivalTime: '13:55', duration: '3h 25m', price: 2450, currency: 'SEK', class: 'SAS Go Smart', badge: 'popular'  },
          { flightNumber: 'SK 545', departureTime: '16:45', arrivalTime: '19:10', duration: '3h 25m', price: 5295, currency: 'SEK', class: 'SAS Plus',     badge: 'fastest'  }
        ]
      },
      baggage: { bags: 1, price: 399, currency: 'SEK', flightNumber: 'SK 425',
        confirmation: 'BG' + Math.floor(100000 + Math.random() * 900000) },
      seat: { flightNumber: 'SK 425', route: 'ARN → CPH', newSeat: '12A',
        seatType: 'extra_legroom', features: ['34" legroom', 'Window', 'Exit row'],
        confirmation: 'SC' + Math.floor(100000 + Math.random() * 900000), price: 299, currency: 'SEK' },
      faq: { topic: 'baggage' },
      escalation: { queue: 'Premium Support', estimatedWait: 'Under 2 minutes',
        contextItems: ['Booking SK7234 retrieved', 'Customer verified', 'Seat change discussed'] }
    };
    return map[screen] || {};
  }

  function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ═══ REINIT (called when language changes) ───────────────────────────────
  function reinit() {
    widgetReady = false;
    currentSession = null;
    init();
  }

  // ═══ PUBLIC ──────────────────────────────────────────────────────────────
  return { init, reinit, startCall, hangUp, toggleMute, sendToAgent, handleInfoReceived };

})();

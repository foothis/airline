/**
 * Click-to-Call SDK integration
 * Uses @cognigy/cognigy-vg-browser-sdk
 *
 * SDK API:
 *   window.WebRTCSDK.createWebRTCClient({ endpointUrl, userId })
 *   client.connectAndCall()
 *   client.on('infoReceived', handler)   ← SIP INFO metadata from Cognigy Send Metadata node
 *   client.sendInfo('', { key: value })  ← send data back to Cognigy
 *   client.hangUp()
 *   client.toggleMute()
 */

window.SAS_CTC = (function() {
  'use strict';

  let client = null;
  let callTimer = null;
  let callSeconds = 0;

  // ═══ SDK INIT ═══
  function init() {
    const cfg = window.SAS_CONFIG || {};
    const endpointUrl = cfg.VG_ENDPOINT_URL;
    const userId = cfg.USER_ID || ('sas-' + Date.now());

    // Find SDK on window — different bundles expose it differently
    const SDK = window.WebRTCSDK || window.CognigyWebRTCSDK || window.default;

    if (!SDK || !SDK.createWebRTCClient) {
      console.warn('[SAS CTC] WebRTC SDK not available. Running in demo mode.');
      initDemoMode();
      return;
    }

    if (!endpointUrl || endpointUrl.includes('REPLACE_WITH')) {
      console.warn('[SAS CTC] VG endpoint not configured. Running in demo mode.');
      initDemoMode();
      return;
    }

    try {
      client = SDK.createWebRTCClient({ endpointUrl, userId });

      // ═══ EVENT: SIP INFO received from Cognigy (Send Metadata node) ═══
      client.on('infoReceived', handleInfoReceived);

      // ═══ EVENT: Call connected ═══
      client.on('connected', () => {
        console.log('[SAS CTC] Call connected');
        onCallConnected();
      });

      // ═══ EVENT: Call ended ═══
      client.on('disconnected', () => {
        console.log('[SAS CTC] Call disconnected');
        onCallEnded();
      });

      // ═══ EVENT: Error ═══
      client.on('error', (err) => {
        console.error('[SAS CTC] Error:', err);
      });

      // ═══ EVENT: Agent transcript (SIP INFO with transcript data) ═══
      client.on('transcriptReceived', (t) => {
        if (t && t.text) updateTranscript(t.text, t.speaker);
      });

      console.log('[SAS CTC] SDK initialized');
    } catch (e) {
      console.error('[SAS CTC] SDK init failed:', e);
      initDemoMode();
    }
  }

  // ═══════════════════════════════════════════════
  // CORE: Handle incoming SIP INFO from Cognigy
  // This is where the co-browsing magic happens.
  // Cognigy "Send Metadata" node → SIP INFO → here.
  // ═══════════════════════════════════════════════
  function handleInfoReceived(info) {
    // Normalize across SDK versions
    const raw = (info && info.info && info.info.body)
              || (info && info.body)
              || (info && typeof info === 'string' ? info : null);

    if (!raw) return;

    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      console.warn('[SAS CTC] Could not parse SIP INFO body:', raw);
      return;
    }

    console.log('[SAS CTC] Metadata received:', data);

    // ── Route to correct screen based on "screen" field ──
    if (data.screen && window.SAS_APP) {
      // Track state
      if (window.SAS_APP.state) {
        window.SAS_APP.state.lastScreen = data.screen;
        if (data.data && data.data.reference) {
          window.SAS_APP.state.lastBookingRef = data.data.reference;
        }
        if (data.data && data.data.authenticated) {
          window.SAS_APP.state.authenticated = true;
        }
      }

      switch (data.screen) {
        case 'booking':
          window.SAS_SCREENS && window.SAS_SCREENS.showBooking(data.data);
          break;
        case 'flights':
          window.SAS_SCREENS && window.SAS_SCREENS.showFlights(data.data);
          break;
        case 'baggage':
          showBaggageConfirmation(data.data);
          break;
        case 'seat':
          window.SAS_SCREENS && window.SAS_SCREENS.showSeat(data.data);
          break;
        case 'faq':
          window.SAS_SCREENS && window.SAS_SCREENS.showFAQ(data.data);
          break;
        case 'escalation':
          window.SAS_SCREENS && window.SAS_SCREENS.showEscalation(data.data);
          break;
        case 'confirm':
          showBookingConfirmation(data.data);
          break;
        default:
          console.log('[SAS CTC] Unknown screen:', data.screen);
      }
    }

    // ── Transcript from agent ──
    if (data.transcript) {
      updateTranscript(data.transcript, data.speaker || 'agent');
    }

    // ── Handover signal ──
    if (data.handover === true) {
      window.SAS_SCREENS && window.SAS_SCREENS.showEscalation(data);
    }
  }

  // ═══ BAGGAGE CONFIRMATION ═══
  function showBaggageConfirmation(d) {
    if (!d) return;
    setEl('baggage-desc', `${d.bags || 1} extra bag added to ${d.flightNumber || 'your flight'}`);
    setEl('baggage-ref', d.confirmation || '—');
    setEl('baggage-amount', `${d.price || 399} ${d.currency || 'SEK'}`);
    window.SAS_APP.openCard('card-baggage');
  }

  // ═══ BOOKING CONFIRMATION ═══
  function showBookingConfirmation(d) {
    if (!d) return;
    setEl('confirm-desc', d.description || 'Your flight has been confirmed');
    setEl('confirm-ref', d.reference || '—');
    setEl('confirm-amount', d.price ? `${d.currency || 'SEK'} ${d.price.toLocaleString()} · Confirmed` : '');
    window.SAS_APP.openCard('card-booking-confirm');
  }

  // ═══ TRANSCRIPT UPDATE ═══
  function updateTranscript(text, speaker) {
    const el = document.getElementById('transcript-text');
    const row = document.getElementById('transcript-row');
    if (!el || !row) return;

    const prefix = speaker === 'user' ? 'You: ' : '';
    el.textContent = prefix + text;
    row.classList.remove('is-empty');

    // Auto-clear after 6 seconds
    clearTimeout(updateTranscript._timer);
    updateTranscript._timer = setTimeout(() => {
      row.classList.add('is-empty');
    }, 6000);
  }

  // ═══ CALL FLOW ═══
  function startCall() {
    if (!client) {
      // Demo mode — simulate a call
      onCallConnected();
      return;
    }
    document.getElementById('call-btn-start').classList.add('is-ringing');
    client.connectAndCall().catch(err => {
      console.error('[SAS CTC] connectAndCall failed:', err);
      document.getElementById('call-btn-start').classList.remove('is-ringing');
    });
  }

  function hangUp() {
    if (client) {
      client.hangUp();
    } else {
      onCallEnded();
    }
  }

  function toggleMute() {
    if (client) client.toggleMute();
    const btn = document.getElementById('btn-mute');
    if (btn) btn.classList.toggle('is-muted');
  }

  function onCallConnected() {
    document.getElementById('call-btn-start').classList.remove('is-ringing');
    document.getElementById('bottom-idle').style.display = 'none';
    document.getElementById('bottom-incall').style.display = 'block';

    // Start call timer
    callSeconds = 0;
    callTimer = setInterval(() => {
      callSeconds++;
      updateDuration();
      if (window.SAS_APP && window.SAS_APP.state) {
        window.SAS_APP.state.callDuration = formatDuration(callSeconds);
      }
    }, 1000);

    // Show status pill
    const pill = document.getElementById('call-status-pill');
    if (pill) { pill.classList.add('is-visible'); }
  }

  function onCallEnded() {
    document.getElementById('bottom-idle').style.display = 'block';
    document.getElementById('bottom-incall').style.display = 'none';

    clearInterval(callTimer);
    callSeconds = 0;

    const pill = document.getElementById('call-status-pill');
    if (pill) pill.classList.remove('is-visible');

    // Close any open cards
    document.querySelectorAll('.overlay-card.is-open').forEach(c => {
      c.classList.remove('is-open');
    });
    document.getElementById('overlay-backdrop').classList.remove('is-visible');
  }

  function updateDuration() {
    const el = document.getElementById('call-duration');
    if (el) el.textContent = formatDuration(callSeconds);
  }

  function formatDuration(s) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }

  // ═══ SEND DATA TO COGNIGY (via SIP INFO) ═══
  function sendToAgent(payload) {
    if (!client || typeof client.sendInfo !== 'function') return;
    client.sendInfo('', payload)
      .then(() => console.log('[SAS CTC] Sent to agent:', payload))
      .catch(err => console.error('[SAS CTC] sendInfo failed:', err));
  }

  // ═══ DEMO MODE (no VG endpoint configured) ═══
  function initDemoMode() {
    console.log('[SAS CTC] Demo mode active — use URL params to trigger screens');

    // Allow triggering screens via URL hash for demos:
    // #screen=booking  #screen=flights  etc.
    window.addEventListener('hashchange', handleHashDemo);
    handleHashDemo();

    // Expose demo trigger function
    window.SAS_DEMO = {
      trigger: function(screen, data) {
        handleInfoReceived({ screen, data: data || getDefaultDemoData(screen) });
      },
      call: function() { onCallConnected(); },
      hangup: function() { onCallEnded(); }
    };

    // Bind call button anyway
    const startBtn = document.getElementById('call-btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        onCallConnected();
        // Auto-trigger booking screen after 2s for demo flow
        setTimeout(() => {
          window.SAS_DEMO.trigger('booking');
        }, 2000);
      });
    }
  }

  function handleHashDemo() {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const [screen, ...rest] = hash.split('=');
    if (screen === 'screen' && rest.length) {
      handleInfoReceived({ screen: rest[0], data: getDefaultDemoData(rest[0]) });
    }
  }

  function getDefaultDemoData(screen) {
    const defaults = {
      booking: {
        reference: 'SK7234',
        passenger: { firstName: 'Erik', lastName: 'Johansson' },
        outbound: {
          flightNumber: 'SK 425', origin: 'ARN', destination: 'CPH',
          departureTime: '06:00', arrivalTime: '07:20', duration: '1h 20m',
          date: 'Apr 15, 2026', class: 'SAS Go', seat: '14C', baggage: '1 × 23kg'
        },
        status: 'Confirmed'
      },
      flights: {
        origin: 'ARN', destination: 'LHR', date: 'Mon 20 Apr', passengers: 1,
        results: [
          { flightNumber: 'SK 541', departureTime: '07:15', arrivalTime: '09:40',
            duration: '3h 25m', price: 1890, currency: 'SEK', class: 'SAS Go', badge: 'cheapest' },
          { flightNumber: 'SK 543', departureTime: '11:30', arrivalTime: '13:55',
            duration: '3h 25m', price: 2450, currency: 'SEK', class: 'SAS Go Smart', badge: 'popular' },
          { flightNumber: 'SK 545', departureTime: '16:45', arrivalTime: '19:10',
            duration: '3h 25m', price: 5295, currency: 'SEK', class: 'SAS Plus', badge: 'fastest' }
        ]
      },
      baggage: {
        bags: 1, price: 399, currency: 'SEK',
        flightNumber: 'SK 425', confirmation: 'BG' + Math.floor(100000 + Math.random() * 900000)
      },
      seat: {
        flightNumber: 'SK 425', route: 'ARN → CPH',
        newSeat: '12A', seatType: 'extra_legroom',
        features: ['34" legroom', 'Window', 'Exit row'],
        confirmation: 'SC' + Math.floor(100000 + Math.random() * 900000),
        price: 299, currency: 'SEK'
      },
      faq: { topic: 'baggage', title: 'Baggage Allowance' },
      escalation: {
        queue: 'Premium Support', estimatedWait: 'Under 2 minutes',
        contextItems: ['Booking SK7234 retrieved', 'Customer verified', 'Seat change discussed']
      }
    };
    return defaults[screen] || {};
  }

  function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // ═══ PUBLIC API ═══
  return {
    init,
    startCall,
    hangUp,
    toggleMute,
    sendToAgent,
    handleInfoReceived // exposed for testing
  };

})();

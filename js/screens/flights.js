/**
 * Flight Search Results Screen
 * Triggered by metadata payload: { "screen": "flights", "data": { ... } }
 *
 * Expected Cognigy Send Metadata payload (from flight_booking tool):
 * {
 *   "screen": "flights",
 *   "data": {
 *     "origin": "ARN",
 *     "destination": "LHR",
 *     "date": "Apr 20, 2026",
 *     "passengers": 1,
 *     "results": [
 *       {
 *         "flightNumber": "SK 541",
 *         "departureTime": "07:15",
 *         "arrivalTime": "09:40",
 *         "duration": "3h 25m",
 *         "price": 1890,
 *         "currency": "SEK",
 *         "class": "SAS Go",
 *         "badge": "cheapest"
 *       },
 *       ...
 *     ]
 *   }
 * }
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

window.SAS_SCREENS.showFlights = function(data) {
  const d = data || {};
  const results = d.results || [];

  // Header
  const route = (d.origin && d.destination)
    ? `${d.origin} → ${d.destination}`
    : 'Search Results';
  document.getElementById('search-route').textContent = route;

  const meta = [
    d.date || '',
    d.passengers ? `${d.passengers} passenger${d.passengers > 1 ? 's' : ''}` : '1 passenger'
  ].filter(Boolean).join(' · ');
  document.getElementById('search-meta').textContent = meta;

  // Results
  const container = document.getElementById('flight-results');
  if (!container) return;

  if (!results.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#6B7280;">
        <div style="font-size:48px;margin-bottom:12px;">✈️</div>
        <div style="font-weight:600;margin-bottom:6px;">No flights found</div>
        <div style="font-size:13px;">Try different dates or destinations</div>
      </div>`;
    window.SAS_APP.openCard('card-flights');
    return;
  }

  const badgeMap = {
    cheapest: '<span class="frc-badge frc-badge--cheapest">Cheapest</span>',
    popular:  '<span class="frc-badge frc-badge--popular">Most Popular</span>',
    fastest:  '<span class="frc-badge frc-badge--fastest">Fastest</span>'
  };

  container.innerHTML = results.map((r, i) => `
    <div class="flight-result-card" data-idx="${i}" onclick="window.SAS_SCREENS.selectFlight(this, ${i})">
      <div class="frc-top">
        <div class="frc-times">
          <span class="frc-time">${r.departureTime || '—'}</span>
          <span class="frc-dash">→</span>
          <span class="frc-time">${r.arrivalTime || '—'}</span>
        </div>
        <div class="frc-price">
          <div class="frc-price-amount">${r.currency || 'SEK'} ${(r.price || 0).toLocaleString()}</div>
          <div class="frc-price-class">${r.class || 'SAS Go'}</div>
        </div>
      </div>
      <div class="frc-bottom">
        <div class="frc-meta">${r.flightNumber || ''} · ${r.duration || '—'} · Direct</div>
        ${badgeMap[r.badge] || ''}
      </div>
      <button class="frc-select-btn" onclick="window.SAS_SCREENS.bookFlight(${i}, event)">
        Select · ${r.currency || 'SEK'} ${(r.price || 0).toLocaleString()}
      </button>
    </div>
  `).join('');

  // Store results for selection
  window.SAS_SCREENS._flightResults = results;
  window.SAS_SCREENS._flightMeta = d;

  window.SAS_APP.openCard('card-flights');
};

window.SAS_SCREENS.selectFlight = function(el, idx) {
  document.querySelectorAll('.flight-result-card').forEach(c => c.classList.remove('is-selected'));
  el.classList.add('is-selected');
  // Scroll select button into view
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.SAS_SCREENS.bookFlight = function(idx, event) {
  event && event.stopPropagation();
  const results = window.SAS_SCREENS._flightResults || [];
  const meta = window.SAS_SCREENS._flightMeta || {};
  const flight = results[idx];
  if (!flight) return;

  // Generate booking reference
  const ref = 'SK' + Math.floor(1000 + Math.random() * 9000);

  document.getElementById('confirm-desc').textContent =
    `${meta.origin || ''} → ${meta.destination || ''} · ${flight.departureTime} · ${flight.class || 'SAS Go'}`;
  document.getElementById('confirm-ref').textContent = ref;
  document.getElementById('confirm-amount').textContent =
    `${flight.currency || 'SEK'} ${(flight.price || 0).toLocaleString()} · Confirmed`;

  window.SAS_APP.closeCard('card-flights');
  setTimeout(() => window.SAS_APP.openCard('card-booking-confirm'), 200);

  // Send selection back to Cognigy via SIP INFO
  window.SAS_CTC && window.SAS_CTC.sendToAgent({ flightSelected: { ...flight, bookingRef: ref } });
};

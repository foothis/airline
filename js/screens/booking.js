/**
 * Booking Details Screen
 * Triggered by metadata payload: { "screen": "booking", "data": { ... } }
 *
 * Expected Cognigy Send Metadata payload (from retrieve_booking tool):
 * {
 *   "screen": "booking",
 *   "data": {
 *     "reference": "SK7234",
 *     "passenger": { "firstName": "Erik", "lastName": "Johansson" },
 *     "outbound": {
 *       "flightNumber": "SK 425",
 *       "origin": "ARN",
 *       "destination": "CPH",
 *       "departureTime": "06:00",
 *       "arrivalTime": "07:20",
 *       "date": "Apr 15, 2026",
 *       "class": "SAS Go",
 *       "seat": "14C",
 *       "baggage": "1 x 23kg",
 *       "duration": "1h 20m"
 *     },
 *     "status": "Confirmed"
 *   }
 * }
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

window.SAS_SCREENS.showBooking = function(data) {
  const d = data || {};
  const outbound = d.outbound || {};
  const passenger = d.passenger || {};

  // Populate booking reference
  setEl('booking-ref', d.reference || '—');
  setEl('booking-passenger',
    passenger.firstName && passenger.lastName
      ? `${passenger.firstName} ${passenger.lastName}`
      : passenger.name || '—'
  );

  // Flight card
  setEl('booking-dep-time', outbound.departureTime || '—');
  setEl('booking-arr-time', outbound.arrivalTime || '—');
  setEl('booking-dep-code', outbound.origin || '—');
  setEl('booking-arr-code', outbound.destination || '—');
  setEl('booking-duration', outbound.duration || '—');
  setEl('booking-flight-num', outbound.flightNumber || '—');
  setEl('booking-date', outbound.date || '—');
  setEl('booking-class', outbound.class || '—');

  // Details grid
  setEl('booking-seat', outbound.seat || '—');
  setEl('booking-baggage', outbound.baggage || '—');
  setEl('booking-status', d.status || 'Confirmed');
  setEl('booking-ticket', outbound.class || '—');

  window.SAS_APP.openCard('card-booking');
};

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

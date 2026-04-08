/**
 * Escalation Screen
 * Triggered by: { "screen": "escalation", "data": { ... } }
 *
 * Expected payload (from escalate_to_agent tool):
 * {
 *   "screen": "escalation",
 *   "data": {
 *     "reason": "Customer requested human agent",
 *     "queue": "Premium Support",
 *     "estimatedWait": "Under 2 minutes",
 *     "contextItems": [
 *       "Booking SK7234 retrieved",
 *       "Authentication verified",
 *       "Seat change discussed"
 *     ],
 *     "agentName": "Customer Support"
 *   }
 * }
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

window.SAS_SCREENS.showEscalation = function(data) {
  const d = data || {};

  const queue = d.queue || 'Customer Support';
  const wait = d.estimatedWait || 'Under 2 minutes';
  const contextItems = d.contextItems || buildDefaultContext();

  document.getElementById('escalation-desc').textContent =
    `Connecting you to ${queue}`;
  document.getElementById('escalation-wait').textContent = wait;

  // Context items
  const ctxEl = document.getElementById('escalation-context');
  if (ctxEl) {
    ctxEl.innerHTML = contextItems.map(item => `
      <div class="escalation-context-item">
        <div class="escalation-context-dot"></div>
        <span>${item}</span>
      </div>
    `).join('');
  }

  window.SAS_APP.openCard('card-escalation');
};

function buildDefaultContext() {
  const items = [];
  // Pull from app state if available
  if (window.SAS_APP && window.SAS_APP.state) {
    const s = window.SAS_APP.state;
    if (s.lastBookingRef) items.push(`Booking ${s.lastBookingRef} reviewed`);
    if (s.authenticated) items.push('Customer identity verified');
    if (s.lastScreen) {
      const screenLabels = {
        booking: 'Booking details retrieved',
        seat: 'Seat change completed',
        baggage: 'Baggage added',
        flights: 'Flight search performed',
        faq: 'FAQ assistance provided'
      };
      const label = screenLabels[s.lastScreen];
      if (label) items.push(label);
    }
    if (s.callDuration) items.push(`Call duration: ${s.callDuration}`);
  }
  if (!items.length) {
    items.push('Conversation context transferred', 'Authentication status shared');
  }
  return items;
}

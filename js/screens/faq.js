/**
 * FAQ Screen
 * Triggered by: { "screen": "faq", "data": { "topic": "baggage" } }
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

const FAQ_CONTENT = {
  baggage: {
    category: 'Baggage',
    title: 'Baggage Allowance',
    html: `
      <p>Your baggage allowance depends on your ticket type:</p>
      <table class="faq-table">
        <thead><tr><th>Ticket</th><th>Cabin bag</th><th>Checked bag</th></tr></thead>
        <tbody>
          <tr><td>SAS Go Light</td><td>1 × 8 kg</td><td>Not included</td></tr>
          <tr><td>SAS Go</td><td>1 × 8 kg</td><td>1 × 23 kg</td></tr>
          <tr><td>SAS Plus</td><td>2 × 8 kg</td><td>2 × 23 kg</td></tr>
          <tr><td>SAS Business</td><td>2 × 8 kg</td><td>2 × 32 kg</td></tr>
        </tbody>
      </table>
      <p><strong>EuroBonus Gold and Diamond</strong> members receive one additional free checked bag on all fare types.</p>
      <p>Extra bags can be added from <strong>399 SEK</strong> when booked in advance.</p>
    `,
    related: ['Hand baggage dimensions', 'Sports & special equipment', 'Excess baggage fees', 'Lost baggage claims']
  },
  checkin: {
    category: 'Check-in',
    title: 'Check-in Options',
    html: `
      <p>SAS offers multiple ways to check in:</p>
      <p><strong>Online check-in</strong> opens <strong>30 hours before departure</strong> and closes 1 hour before. Available via the SAS app or flysas.com.</p>
      <p><strong>Airport counters</strong> close 45 minutes before departure on European routes and 60 minutes on long-haul.</p>
      <p><strong>Priority check-in</strong> is available for SAS Business, SAS Plus, and EuroBonus Gold and Diamond members.</p>
    `,
    related: ['Mobile boarding pass', 'Seat selection', 'Documents required', 'Travelling with children']
  },
  eurobonus: {
    category: 'EuroBonus',
    title: 'EuroBonus Loyalty Programme',
    html: `
      <p>EuroBonus is the SAS frequent flyer programme with four membership tiers:</p>
      <table class="faq-table">
        <thead><tr><th>Tier</th><th>Points / year</th><th>Key benefits</th></tr></thead>
        <tbody>
          <tr><td>Member</td><td>—</td><td>Base earning</td></tr>
          <tr><td>Silver</td><td>20,000+</td><td>Priority boarding, extra bag</td></tr>
          <tr><td>Gold</td><td>55,000+</td><td>Lounge access, upgrades</td></tr>
          <tr><td>Diamond</td><td>90,000+</td><td>Dedicated service line, max bonus</td></tr>
        </tbody>
      </table>
      <p>Points can be redeemed for <strong>award flights, upgrades, hotel stays</strong> and partner rewards. Points are valid for 2 years while the account is active.</p>
    `,
    related: ['How to earn points', 'Redeem for flights', 'Star Alliance benefits', 'Points expiry']
  },
  cancellation: {
    category: 'Booking Changes',
    title: 'Changes & Cancellations',
    html: `
      <p>Your options depend on the ticket type:</p>
      <p><strong>SAS Go Light:</strong> Non-refundable. Changes not permitted.</p>
      <p><strong>SAS Go:</strong> Changes for a fee (approx. SEK 350–700). Non-refundable.</p>
      <p><strong>SAS Plus:</strong> Free changes up to 24 hours before departure. Fully refundable.</p>
      <p><strong>SAS Business:</strong> Fully flexible — free changes and full refunds up to 2 hours before departure.</p>
      <p>If SAS cancels or delays your flight by 3+ hours, you are entitled to a full refund or free rebooking under EU Regulation 261/2004.</p>
    `,
    related: ['EU passenger rights', 'Travel insurance', 'Vouchers & travel credit', 'Name changes']
  },
  seat: {
    category: 'Seats',
    title: 'Seat Selection',
    html: `
      <p>Seat selection availability by fare:</p>
      <p><strong>SAS Go Light / Go:</strong> Seat assigned at check-in. Pre-selection available for a fee.</p>
      <p><strong>SAS Plus / Business:</strong> Preferred and standard seats included at booking.</p>
      <p><strong>Extra legroom seats</strong> (exit rows, bulkhead) available from <strong>299 SEK</strong> per flight.</p>
      <p>Families with children under 12 are automatically seated together free of charge when booking through the SAS app or website.</p>
    `,
    related: ['Exit row eligibility', 'Upgrade options', 'Family seating', 'SAS Plus cabin']
  }
};

function renderFAQ(topic) {
  const content = FAQ_CONTENT[topic] || FAQ_CONTENT['baggage'];

  document.getElementById('faq-category').textContent = content.category;
  document.getElementById('faq-title').textContent = content.title;
  document.getElementById('faq-answer').innerHTML = content.html;

  // Update active pill
  document.querySelectorAll('.faq-topic-pill').forEach(function(pill) {
    pill.classList.toggle('is-active', pill.dataset.topic === topic);
  });

  // Related questions
  const relatedEl = document.getElementById('faq-related');
  if (relatedEl && content.related && content.related.length) {
    relatedEl.innerHTML = `
      <div class="faq-related-label">Related Questions</div>
      ${content.related.map(q => `<div class="faq-related-item">${q}</div>`).join('')}
    `;
  }
}

// Wire up topic pill clicks
document.addEventListener('DOMContentLoaded', function() {
  document.addEventListener('click', function(e) {
    const pill = e.target.closest('.faq-topic-pill');
    if (pill && pill.dataset.topic) {
      renderFAQ(pill.dataset.topic);
    }
  });
});

window.SAS_SCREENS.showFAQ = function(data) {
  const d = data || {};
  const topic = (d.topic || 'baggage').toLowerCase();
  renderFAQ(topic);
  window.SAS_APP.openCard('card-faq');
};

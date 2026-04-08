/**
 * FAQ Screen
 * Triggered by: { "screen": "faq", "data": { ... } }
 *
 * Expected payload (from general_faq / Knowledge AI tool):
 * {
 *   "screen": "faq",
 *   "data": {
 *     "topic": "baggage",
 *     "title": "Baggage Allowance",
 *     "answer": "...",
 *     "related": ["Hand baggage rules", "Special items", "Excess baggage fees"]
 *   }
 * }
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

// Pre-built FAQ content for common topics (fallback / rich display)
const FAQ_CONTENT = {
  baggage: {
    category: 'Baggage',
    title: 'Baggage Allowance',
    html: `
      <p>Your baggage allowance depends on your ticket type and frequent flyer status:</p>
      <table class="faq-table">
        <thead><tr><th>Ticket</th><th>Cabin bag</th><th>Checked bag</th></tr></thead>
        <tbody>
          <tr><td>SAS Go Light</td><td>1 × 8kg</td><td>Not included</td></tr>
          <tr><td>SAS Go</td><td>1 × 8kg</td><td>1 × 23kg</td></tr>
          <tr><td>SAS Go Smart</td><td>1 × 8kg</td><td>1 × 23kg</td></tr>
          <tr><td>SAS Plus</td><td>2 × 8kg</td><td>2 × 23kg</td></tr>
          <tr><td>SAS Business</td><td>2 × 8kg</td><td>2 × 32kg</td></tr>
        </tbody>
      </table>
      <p>EuroBonus Gold and Diamond members receive <strong>one additional free checked bag</strong> on all fare types.</p>
      <p>Extra bags can be added for <strong>399 SEK / 449 NOK / 399 DKK</strong> per bag when booked in advance.</p>
    `,
    related: ['Hand baggage dimensions', 'Special & sports equipment', 'Excess baggage fees', 'Lost baggage claims']
  },
  checkin: {
    category: 'Check-in',
    title: 'Check-in Options',
    html: `
      <p>SAS offers multiple ways to check in for your flight:</p>
      <p><strong>Online check-in</strong> opens <strong>30 hours before departure</strong> and closes 1 hour before (international) or 40 minutes before (domestic).</p>
      <p><strong>Mobile check-in</strong> is available via the SAS app — your boarding pass is stored in your wallet automatically.</p>
      <p><strong>Airport check-in</strong> is available at self-service kiosks or staffed counters. Counter check-in closes 45 minutes before departure on most routes.</p>
    `,
    related: ['Seat selection at check-in', 'Upgrade at check-in', 'Documents required', 'Travel with children']
  },
  eurobonus: {
    category: 'EuroBonus',
    title: 'EuroBonus Frequent Flyer Program',
    html: `
      <p>EuroBonus is the SAS frequent flyer program with four membership tiers:</p>
      <table class="faq-table">
        <thead><tr><th>Tier</th><th>Points/year</th><th>Benefits</th></tr></thead>
        <tbody>
          <tr><td>Member</td><td>0–24,999</td><td>Base earning, partner benefits</td></tr>
          <tr><td>Silver</td><td>25,000+</td><td>Priority boarding, lounge access (domestic)</td></tr>
          <tr><td>Gold</td><td>50,000+</td><td>+1 free bag, Business lounge, upgrades</td></tr>
          <tr><td>Diamond</td><td>100,000+</td><td>All Gold benefits + dedicated line</td></tr>
        </tbody>
      </table>
      <p>Points can be used for <strong>award flights, upgrades, hotel stays</strong> and partner rewards across 200+ partners.</p>
    `,
    related: ['How to earn points', 'Redeem for flights', 'Partner airlines', 'Points expiry']
  },
  cancellation: {
    category: 'Booking',
    title: 'Cancellation & Refunds',
    html: `
      <p>Cancellation and refund options depend on your ticket type:</p>
      <p><strong>SAS Go Light:</strong> Non-refundable. Changes allowed for a fee of 350–700 SEK.</p>
      <p><strong>SAS Go / Go Smart:</strong> Changes allowed. Refund to travel credit possible within 24 hours of booking.</p>
      <p><strong>SAS Plus:</strong> Free changes up to 1 hour before departure. Full refund available.</p>
      <p><strong>SAS Business:</strong> Fully flexible. Free changes and full refunds at any time.</p>
      <p>All tickets are fully refundable if cancelled within <strong>24 hours of booking</strong>.</p>
    `,
    related: ['Flight disruption rights', 'Travel insurance', 'Name changes', 'Vouchers and travel credit']
  },
  seat: {
    category: 'Seat Selection',
    title: 'Seat Selection & Upgrades',
    html: `
      <p>Seat selection is available from the time of booking:</p>
      <p><strong>Standard seats</strong> are included in SAS Go Smart and above. Go and Go Light pay a selection fee.</p>
      <p><strong>Extra Legroom seats</strong> (Exit rows, bulkhead) add approximately <strong>8–10 extra inches</strong> of legroom. Available from <strong>299 SEK</strong> per flight.</p>
      <p><strong>SAS Plus zone</strong> seats offer a dedicated cabin with extra privacy and premium service from <strong>1,290 SEK</strong>.</p>
      <p>EuroBonus Gold and Diamond members can select any available seat free of charge.</p>
    `,
    related: ['Exit row rules', 'Traveling with family', 'Upgrade bidding', 'SAS Plus benefits']
  }
};

window.SAS_SCREENS.showFAQ = function(data) {
  const d = data || {};
  const topic = (d.topic || 'baggage').toLowerCase();

  // Use pre-built content if available, otherwise use answer from payload
  const content = FAQ_CONTENT[topic] || {
    category: d.category || 'Help',
    title: d.title || 'Frequently Asked Question',
    html: `<p>${d.answer || 'Please speak with Sarah for more details.'}</p>`,
    related: d.related || []
  };

  document.getElementById('faq-category').textContent = content.category;
  document.getElementById('faq-title').textContent = content.title;
  document.getElementById('faq-answer').innerHTML = content.html;

  // Related questions
  const relatedEl = document.getElementById('faq-related');
  if (relatedEl && content.related && content.related.length) {
    relatedEl.innerHTML = `
      <div class="faq-related-label">Related Questions</div>
      ${content.related.map(q => `
        <div class="faq-related-item">${q}</div>
      `).join('')}
    `;
  }

  window.SAS_APP.openCard('card-faq');
};

/**
 * FAQ Screen
 * Triggered by: { "screen": "faq", "data": { "sourceName": "travelling-with-pets" } }
 * sourceName maps directly to knowledge store source names.
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

// Map knowledge store sourceName → topic key
const SOURCE_TO_TOPIC = {
  'baggage-allowance':               'baggage',
  'check-in-and-boarding':           'checkin',
  'flight-changes-and-cancellations':'cancellation',
  'eurobonus-loyalty-programme':     'eurobonus',
  'seat-selection':                  'seat',
  'special-meals':                   'meals',
  'travelling-with-pets':            'pets',
  'lounge-access':                   'lounge',
  'delayed-cancelled-flight-rights': 'rights',
  'online-check-in-mobile-boarding-pass': 'checkin'
};

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
      <p><strong>Online check-in</strong> opens <strong>30 hours before departure</strong> and closes 1 hour before. Available via the SAS app or flysas.com. Your mobile boarding pass is saved to Apple Wallet or Google Pay automatically.</p>
      <p><strong>Airport counters</strong> close 45 minutes before departure on European routes and 60 minutes on long-haul.</p>
      <p><strong>Priority check-in</strong> is available for SAS Business, SAS Plus, and EuroBonus Gold and Diamond members.</p>
    `,
    related: ['Mobile boarding pass', 'Seat selection', 'Documents required', 'Travelling with children']
  },
  cancellation: {
    category: 'Changes & Cancellations',
    title: 'Flight Changes & Cancellations',
    html: `
      <p><strong>SAS Go Light:</strong> Non-refundable. Changes not permitted.</p>
      <p><strong>SAS Go:</strong> Changes for a fee (approx. SEK 350–700). Non-refundable.</p>
      <p><strong>SAS Plus:</strong> Free changes up to 24 hours before departure. Fully refundable.</p>
      <p><strong>SAS Business:</strong> Free changes and full refunds up to 2 hours before departure.</p>
      <p>If SAS cancels or delays your flight by <strong>3+ hours</strong>, you are entitled to a full refund or free rebooking under EU Regulation 261/2004.</p>
    `,
    related: ['EU passenger rights', 'Travel insurance', 'Vouchers & travel credit', 'Name changes']
  },
  eurobonus: {
    category: 'EuroBonus',
    title: 'EuroBonus Loyalty Programme',
    html: `
      <table class="faq-table">
        <thead><tr><th>Tier</th><th>Points / year</th><th>Key benefits</th></tr></thead>
        <tbody>
          <tr><td>Member</td><td>—</td><td>Base earning</td></tr>
          <tr><td>Silver</td><td>20,000+</td><td>Priority boarding, extra bag</td></tr>
          <tr><td>Gold</td><td>55,000+</td><td>Lounge access, upgrades</td></tr>
          <tr><td>Diamond</td><td>90,000+</td><td>Dedicated service, max bonus</td></tr>
        </tbody>
      </table>
      <p>Points can be redeemed for <strong>award flights, upgrades, hotel stays</strong> and partner rewards. Points are valid for 2 years while the account is active.</p>
    `,
    related: ['How to earn points', 'Redeem for flights', 'Star Alliance benefits', 'Points expiry']
  },
  seat: {
    category: 'Seats',
    title: 'Seat Selection',
    html: `
      <p><strong>SAS Go Light / Go:</strong> Seat assigned at check-in. Pre-selection available for a fee.</p>
      <p><strong>SAS Plus / Business:</strong> Preferred and standard seats included at booking.</p>
      <p><strong>Extra legroom seats</strong> (exit rows, bulkhead) available from <strong>299 SEK</strong> per flight.</p>
      <p>Families with children under 12 are automatically seated together free of charge when booking through the SAS app or website.</p>
    `,
    related: ['Exit row eligibility', 'Upgrade options', 'Family seating', 'SAS Plus cabin']
  },
  meals: {
    category: 'Special Meals',
    title: 'Special Meals & Dietary Needs',
    html: `
      <p>Special meals must be ordered at least <strong>24 hours before departure</strong> via Manage Booking on the SAS app or flysas.com.</p>
      <p>Available options include:</p>
      <table class="faq-table">
        <thead><tr><th>Code</th><th>Meal type</th></tr></thead>
        <tbody>
          <tr><td>VLML / VGML</td><td>Vegetarian / Vegan</td></tr>
          <tr><td>GFML</td><td>Gluten-free</td></tr>
          <tr><td>MOML / KSML</td><td>Halal / Kosher</td></tr>
          <tr><td>DBML</td><td>Diabetic</td></tr>
          <tr><td>CHML / BBML</td><td>Child / Baby</td></tr>
        </tbody>
      </table>
      <p>Primarily available on intercontinental and longer European routes. SAS cannot guarantee a fully allergen-free environment onboard.</p>
    `,
    related: ['Allergy information', 'Long-haul dining', 'SAS Business dining', 'Infant meals']
  },
  pets: {
    category: 'Travelling with Pets',
    title: 'Pets on SAS Flights',
    html: `
      <p><strong>In-cabin (European routes):</strong> Small dogs and cats are permitted if the pet and carrier together weigh up to <strong>8 kg</strong> and the carrier fits under the seat (max 55×40×23 cm).</p>
      <p>Fee: approx. <strong>SEK 600 / DKK 450 / NOK 600</strong> each way. Maximum 1 pet per passenger.</p>
      <p><strong>Checked baggage:</strong> Larger animals may travel as checked baggage in an IATA-approved container. Not available on all routes.</p>
      <p><strong>Assistance and guide dogs</strong> travel free in the cabin on all SAS-operated routes.</p>
      <p>Pre-booking required at least <strong>48 hours before departure</strong>.</p>
    `,
    related: ['Approved carrier dimensions', 'Restricted routes', 'Guide dog policy', 'International pet rules']
  },
  lounge: {
    category: 'Airport Lounges',
    title: 'SAS Lounge Access',
    html: `
      <p>SAS operates lounges at <strong>Stockholm Arlanda (ARN), Copenhagen (CPH)</strong> and <strong>Oslo Gardermoen (OSL)</strong>, plus selected international airports.</p>
      <p><strong>Who has access:</strong></p>
      <table class="faq-table">
        <thead><tr><th>Passenger type</th><th>Access</th></tr></thead>
        <tbody>
          <tr><td>SAS Business</td><td>All SAS / Star Alliance routes</td></tr>
          <tr><td>SAS Plus</td><td>Intercontinental routes</td></tr>
          <tr><td>EuroBonus Gold</td><td>Yes (self only)</td></tr>
          <tr><td>EuroBonus Diamond</td><td>Yes + 1 guest</td></tr>
          <tr><td>Star Alliance Gold</td><td>On SAS / Star Alliance flights</td></tr>
        </tbody>
      </table>
      <p>Facilities include hot and cold food, beverages, Wi-Fi, and showers. A valid same-day boarding pass is required.</p>
    `,
    related: ['Day pass purchase', 'Star Alliance lounges', 'Business class benefits', 'Lounge locations']
  },
  rights: {
    category: 'Passenger Rights',
    title: 'Delayed & Cancelled Flights',
    html: `
      <p>Under <strong>EU Regulation 261/2004</strong>:</p>
      <table class="faq-table">
        <thead><tr><th>Situation</th><th>Your rights</th></tr></thead>
        <tbody>
          <tr><td>Delay 2+ hrs</td><td>Meals, refreshments, 2 free calls</td></tr>
          <tr><td>Delay 5+ hrs</td><td>Full refund if you choose not to travel</td></tr>
          <tr><td>Overnight delay</td><td>Hotel + transport to/from hotel</td></tr>
          <tr><td>Cancellation</td><td>Full refund or re-routing</td></tr>
        </tbody>
      </table>
      <p>Compensation of <strong>EUR 250–600</strong> may also apply depending on route distance, unless caused by extraordinary circumstances.</p>
      <p>Submit claims at flysas.com under Customer Service &gt; Claims within 3 years of the flight date.</p>
    `,
    related: ['How to claim compensation', 'Extraordinary circumstances', 'Travel insurance', 'Strike disruptions']
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
  // Resolve topic: from sourceName (live flow) or direct topic key (demo/fallback)
  const topic = SOURCE_TO_TOPIC[d.sourceName] || d.topic || 'baggage';
  renderFAQ(topic);
  window.SAS_APP.openCard('card-faq');
};

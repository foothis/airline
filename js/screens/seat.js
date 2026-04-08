/**
 * Seat Change Screen
 * Triggered by: { "screen": "seat", "data": { ... } }
 *
 * Expected payload (from change_seat tool):
 * {
 *   "screen": "seat",
 *   "data": {
 *     "flightNumber": "SK 425",
 *     "route": "ARN → CPH",
 *     "newSeat": "12A",
 *     "seatType": "extra_legroom",
 *     "features": ["34\" legroom", "Window", "Exit row"],
 *     "confirmation": "SC789012",
 *     "price": 299,
 *     "currency": "SEK"
 *   }
 * }
 */
window.SAS_SCREENS = window.SAS_SCREENS || {};

// Cabin layout: rows 1-30, seats A B C | D E F
// Row 12 = exit row (extra legroom)
const EXTRA_LEGROOM_ROWS = [12, 13];
const OCCUPIED = ['1A','1C','1D','2B','3A','3F','4C','4D','5A','5E',
                  '6B','7A','7D','8C','9B','9F','10A','11C','11D',
                  '14A','14B','15D','16C','17E','18A','18F','20B','21D','22C'];

window.SAS_SCREENS.showSeat = function(data) {
  const d = data || {};
  const newSeat = d.newSeat || '12A';
  const seatType = d.seatType || 'extra_legroom';

  setEl('seat-flight', `${d.flightNumber || 'SK 425'} · ${d.route || 'ARN → CPH'}`);
  setEl('seat-number', newSeat);
  setEl('seat-ref', d.confirmation || '—');

  // Seat type label
  const typeLabels = {
    extra_legroom: 'Exit Row · Extra Legroom',
    sas_plus: 'SAS Plus · Business Zone',
    standard: 'Standard Seat'
  };
  setEl('seat-type', typeLabels[seatType] || typeLabels.standard);

  // Features
  const features = d.features || inferFeatures(newSeat, seatType);
  const featuresEl = document.querySelector('.seat-info-features');
  if (featuresEl) {
    featuresEl.innerHTML = features
      .map(f => `<span class="seat-feature">${f}</span>`)
      .join('');
  }

  // Render seat map (rows 10-17 for compact view around selected seat)
  renderSeatMap(newSeat, seatType);

  window.SAS_APP.openCard('card-seat');
};

function renderSeatMap(selectedSeat, seatType) {
  const map = document.getElementById('seat-map');
  if (!map) return;

  const rows = [9, 10, 11, 12, 13, 14, 15, 16];
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const [selLetter, selRow] = [selectedSeat.slice(-1), parseInt(selectedSeat)];

  // Header row
  map.innerHTML = `
    <div class="seat-row">
      <span class="seat-row-num"></span>
      ${['A','B','C','','D','E','F'].map(l =>
        l ? `<div class="seat-cell" style="background:none;color:#9CA3AF;font-size:10px;">${l}</div>`
          : `<div class="seat-aisle"></div>`
      ).join('')}
    </div>
  `;

  rows.forEach(row => {
    const isExtraLeg = EXTRA_LEGROOM_ROWS.includes(row);
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';

    rowEl.innerHTML = `<span class="seat-row-num">${row}</span>`;

    letters.forEach((letter, i) => {
      if (i === 3) {
        const aisle = document.createElement('div');
        aisle.className = 'seat-aisle';
        rowEl.appendChild(aisle);
      }

      const seatId = `${row}${letter}`;
      const isSelected = row === selRow && letter === selLetter;
      const isOccupied = OCCUPIED.includes(seatId) && !isSelected;

      const cell = document.createElement('div');
      cell.className = 'seat-cell';

      if (isSelected) {
        cell.className += isExtraLeg
          ? ' seat-cell--selected seat-cell--extra-legroom'
          : ' seat-cell--selected';
        cell.textContent = '✓';
      } else if (isOccupied) {
        cell.className += ' seat-cell--occupied';
      } else if (isExtraLeg) {
        cell.className += ' seat-cell--extra-legroom';
        cell.textContent = letter;
      } else {
        cell.className += ' seat-cell--available';
        cell.textContent = letter;
      }

      rowEl.appendChild(cell);
    });

    map.appendChild(rowEl);

    // Extra legroom divider
    if (isExtraLeg && row === EXTRA_LEGROOM_ROWS[0] - 1) {
      const divider = document.createElement('div');
      divider.style.cssText = 'font-size:9px;color:#9CA3AF;text-align:center;padding:2px 0;letter-spacing:0.3px;';
      divider.textContent = '— EXIT ROW —';
      map.appendChild(divider);
    }
  });
}

function inferFeatures(seat, type) {
  const features = [];
  const letter = seat.slice(-1);
  if (letter === 'A' || letter === 'F') features.push('Window');
  if (type === 'extra_legroom') features.push('34" legroom', 'Extra space');
  else if (type === 'sas_plus') features.push('Wider seat', 'Premium service', 'Power outlet');
  else features.push('Standard');
  return features;
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

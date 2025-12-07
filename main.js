import './style.css'

const billInput = document.getElementById('billAmount');
const orderTypeSelect = document.getElementById('orderType');
const tipPercentageDisplay = document.getElementById('tipPercentage');
const tipAmountDisplay = document.getElementById('tipAmount');
const totalPayDisplay = document.getElementById('totalPay');

// State
let state = {
  bill: 0,
  orderType: 'dinein',
  ratings: {
    food: 3,
    service: 3,
    ambiance: 3
  }
};

// Configuration
const CONFIG = {
  dinein: {
    base: 15,
    primary: 'service',
    weights: { service: 0.6, food: 0.3, ambiance: 0.1 }
  },
  takeout: {
    base: 5,
    primary: 'food',
    weights: { food: 0.8, service: 0.2, ambiance: 0.0 }
  },
  delivery: {
    base: 10,
    primary: 'service',
    weights: { service: 0.5, food: 0.5, ambiance: 0.0 }
  }
};

const CONSTANTS = {
  k: 0.2,
  A: 5.5
};

// Star Rating Logic
// Rating Logic
function initRating(id, key) {
  const container = document.getElementById(id);
  const segments = container.querySelectorAll('.segment');

  segments.forEach(segment => {
    segment.addEventListener('click', () => {
      const value = parseInt(segment.dataset.value);
      state.ratings[key] = value;
      updateSegments(container, value);
      calculate();
    });
  });

  // Initial state
  updateSegments(container, state.ratings[key]);
}

function updateSegments(container, value) {
  const segments = container.querySelectorAll('.segment');
  segments.forEach(segment => {
    const segVal = parseInt(segment.dataset.value);
    if (segVal <= value) {
      segment.classList.add('active');
    } else {
      segment.classList.remove('active');
    }
  });
  container.dataset.value = value;
}

// Algorithm
function calculate() {
  const config = CONFIG[state.orderType];
  const ratings = state.ratings;

  // Step 1: Map stars to centered scores z = r - 3
  // Step 2: Apply nonlinear transform S = tanh(z/2)
  const S = {};
  for (const [key, r] of Object.entries(ratings)) {
    const z = r - 3;
    S[key] = Math.tanh(z / 2);
  }

  // Step 3: Compute gated satisfaction term
  const P = config.primary;
  const Sp = S[P]; // Primary factor score
  const Wp = config.weights[P]; // Primary weight

  const C_primary = Wp * Sp;

  let C_support = 0;
  for (const [key, weight] of Object.entries(config.weights)) {
    if (key !== P) {
      C_support += weight * S[key];
    }
  }

  // B = C_primary + (1 + k * Sp) * C_support
  const B = C_primary + (1 + CONSTANTS.k * Sp) * C_support;

  // Step 4: Final tip percentage
  // Tip% = Base + A * B
  let tipPercent = config.base + CONSTANTS.A * B;

  // Clamp to reasonable limits (e.g., 0% to 100%, though formula handles it well)
  tipPercent = Math.max(0, tipPercent);

  // Calculate Amounts
  const bill = parseFloat(billInput.value) || 0;
  const tipAmount = bill * (tipPercent / 100);
  const totalPay = bill + tipAmount;

  // Update UI
  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  tipPercentageDisplay.textContent = `${tipPercent.toFixed(1)}%`;
  tipAmountDisplay.textContent = currencyFormatter.format(tipAmount);
  totalPayDisplay.textContent = currencyFormatter.format(totalPay);
}

// Event Listeners
billInput.addEventListener('input', () => calculate());
orderTypeSelect.addEventListener('change', (e) => {
  state.orderType = e.target.value;
  toggleAmbiance();
  calculate();
});

function toggleAmbiance() {
  const ambianceGroup = document.getElementById('ambianceStars').parentElement;
  if (state.orderType === 'dinein') {
    ambianceGroup.classList.remove('disabled');
  } else {
    ambianceGroup.classList.add('disabled');
  }
}

// Initialize
initRating('foodRating', 'food');
initRating('serviceRating', 'service');
initRating('ambianceStars', 'ambiance');
toggleAmbiance(); // Set initial state

// Modal Logic (Existing)
const modal = document.getElementById("helpModal");
const btn = document.getElementById("helpBtn");
const span = document.getElementsByClassName("close-btn")[0];

if (btn) btn.onclick = () => modal.style.display = "block";
if (span) span.onclick = () => modal.style.display = "none";
window.onclick = (event) => {
  if (event.target == modal) modal.style.display = "none";
}

// Theme Toggle Logic
const themeBtn = document.getElementById("themeBtn");
let isNormalMode = false;

themeBtn.addEventListener('click', () => {
  isNormalMode = !isNormalMode;
  if (isNormalMode) {
    document.body.classList.add('normal-mode');
    // Palette Icon
    themeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>';
    themeBtn.setAttribute('aria-label', 'Switch to Stealth Mode');
  } else {
    document.body.classList.remove('normal-mode');
    // Eye Icon
    themeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
    themeBtn.setAttribute('aria-label', 'Switch to Normal Mode');
  }
});

// Initial calculation
calculate();

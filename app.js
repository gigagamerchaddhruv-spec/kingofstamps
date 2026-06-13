let stampsData = [];
let activeFilter = 'all';
let audioCtx = null;

// --- Web Audio API UI Sound Synthesis Core ---
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playClickSound() {
  initAudio(); if (!audioCtx) return;
  const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  osc.type = 'triangle'; osc.frequency.setValueAtTime(120, audioCtx.currentTime); 
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
  osc.start(); osc.stop(audioCtx.currentTime + 0.05);
}

function playPopSound() {
  initAudio(); if (!audioCtx) return;
  const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  osc.type = 'sine'; osc.frequency.setValueAtTime(300, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.12);
  gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
  osc.start(); osc.stop(audioCtx.currentTime + 0.12);
}

// --- Store Interface Operations Routine ---
async function initStore() {
  try {
    const res = await fetch('catalog.json');
    stampsData = await res.json();
    renderGrid(stampsData);
    document.querySelectorAll('header button').forEach(btn => btn.addEventListener('mousedown', playClickSound));
  } catch (err) { console.error("Asset catalog initialization fault:", err); }
}

function setFilter(type) { activeFilter = type; filterCatalog(); }

function filterCatalog() {
  const query = document.getElementById('searchBar').value.toLowerCase();
  const filtered = stampsData.filter(stamp => {
    const matchesType = activeFilter === 'all' || stamp.type === activeFilter;
    const matchesSearch = stamp.name.toLowerCase().includes(query) || stamp.scott.toLowerCase().includes(query) || stamp.description.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
  renderGrid(filtered);
}

function renderGrid(items) {
  const grid = document.getElementById('stamp-grid'); grid.innerHTML = '';
  if (items.length === 0) { grid.innerHTML = '<p class="no-results">No matching stamps found.</p>'; return; }

  items.forEach(stamp => {
    const el = document.createElement('div'); el.className = 'card';
    
    // Stringify and escape item data payload to pass it safely into the native API button click listener
    const stampString = JSON.stringify(stamp).replace(/"/g, '&quot;');
    
    el.innerHTML = `
      <img src="${stamp.img}" alt="${stamp.name}" loading="lazy">
      <div class="card-info">
        <h3>${stamp.name}</h3>
        <p class="meta">Scott #${stamp.scott} | ${stamp.condition}</p>
        <p class="desc">${stamp.description}</p>
      </div>
      <div>
        <span class="price">$${stamp.price.toFixed(2)}</span>
        <button class="buy-button" onclick="nativeCheckout('${stampString}')">Buy Now</button>
      </div>`;
    grid.appendChild(el);
  });
}

// --- Native 100% Dependency-Free Browser Checkout Engine ---
async function nativeCheckout(stampDataRaw) {
  playPopSound(); // Trigger your custom synthesized audio reward feedback chime
  
  if (!window.PaymentRequest) {
    alert("Your browser does not support native web payments. To test, please access this site via a modern mobile browser (Safari/Chrome).");
    return;
  }

  try {
    const stamp = JSON.parse(stampDataRaw.replace(/&quot;/g, '"'));

    // 1. Declare Supported Transaction Methods (Visa, Mastercard, Apple Pay/Google Pay tokens)
    const supportedMethods = [{
      supportedMethods: 'basic-card',
      data: { supportedNetworks: ['visa', 'mastercard', 'amex', 'discover'] }
    }];

    // 2. Define the Active Invoice Pricing Totals
    const paymentDetails = {
      total: {
        label: 'Total Purchase Amount',
        amount: { currency: 'USD', value: stamp.price.toString() }
      },
      displayItems: [{
        label: `${stamp.name} (Scott #${stamp.scott})`,
        amount: { currency: 'USD', value: stamp.price.toString() }
      }]
    };

    // 3. User Shipping & Profile Parameters Options
    const options = { 
      requestShipping: true, 
      requestPayerEmail: true, 
      requestPayerPhone: true 
    };

    // Initialize Request and Invoke the Browser's Native Overlay UI Sheet
    const request = new PaymentRequest(supportedMethods, paymentDetails, options);
    const paymentResponse = await request.show();
    
    // ---> Your Secure Transaction Processing Hooks Happen Here <---
    console.log("Secure Card Details Token:", paymentResponse.details);
    console.log("Collector Delivery Address:", paymentResponse.shippingAddress);
    console.log("Collector Contact:", paymentResponse.payerEmail, paymentResponse.payerPhone);
    
    // Close the native browser card drawer UI successfully
    await paymentResponse.complete('success');
    alert(`Success! Order for "${stamp.name}" initialized. Detailed transaction records logged to your developer console.`);

  } catch (err) {
    console.error("Native transaction request interrupted or closed:", err);
  }
}

window.onload = initStore;

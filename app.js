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
    
    // Stringify and escape item data payload safely
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
        <!-- Invokes our bulletproof custom checkout function -->
        <button class="buy-button" onclick="checkout('${stampString}')">Buy Now</button>
      </div>`;
    grid.appendChild(el);
  });
}

// --- Native WhatsApp Checkout Hook API ---
function checkout(stampDataRaw) {
  playPopSound(); // Retain your custom synthesized audio reward chime
  
  const stamp = JSON.parse(stampDataRaw.replace(/&quot;/g, '"'));

  // 1. Put your real phone number here (with country code, no spaces or '+' symbol)
  const MY_PHONE_NUMBER = "919911321555"; 

  // 2. Build the template string order message
  const messageText = 
`👑 *NEW STAMP ORDER - KING OF STAMPS* 👑
---------------------------------------
📦 *Product:* ${stamp.name}
🔢 *Scott #:* ${stamp.scott}
✨ *Condition:* ${stamp.condition}
🆔 *SKU/ID:* ${stamp.id}
---------------------------------------
💰 *Price:* $${stamp.price.toFixed(2)}

Hello! I want to purchase this stamp from your collection. Please send your payment details/UPI ID so I can complete the transaction!`;

  // 3. Cleanly encode the text layout blocks into web-safe URL coordinates
  const encodedMessage = encodeURIComponent(messageText);
  const whatsappUrl = `https://whatsapp.com{MY_PHONE_NUMBER}&text=${encodedMessage}`;

  // 4. Force browser window redirect directly to the chat
  window.open(whatsappUrl, '_blank');
}

window.onload = initStore;

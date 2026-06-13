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
    
    // Stringify and escape item data payload safely to pass inside template attributes
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
        <button class="buy-button" onclick="checkout('${stampString}')">Buy Now</button>
      </div>`;
    grid.appendChild(el);
  });
}

// --- Native Device Mailto Invoice Hook ---
function checkout(stampDataRaw) {
  playPopSound(); // Execute your custom synthesized audio reward chime
  
  const stamp = JSON.parse(stampDataRaw.replace(/&quot;/g, '"'));

  // 1. Enter your real business contact email here
  const MY_EMAIL = "king@kingofstamps.store"; 
  
  // 2. Format a clean order identifier subject string
  const subjectText = `Order Request: SKU [${stamp.id}] - ${stamp.name}`;

  // 3. Build a highly clean text template payload body
  const bodyText = 
`KING OF STAMPS | ORDER INVOICE ENTRY REQUEST
============================================

PRODUCT SUMMARY DETAILS:
--------------------------------------------
• Stamp Name:   ${stamp.name}
• Scott Cat #:  ${stamp.scott}
• Condition:    ${stamp.condition}
• Unique SKU:   ${stamp.id}
• Price Cost:   $${stamp.price.toFixed(2)}

SHIPPING DETAILS (PLEASE COMPLETE BELOW):
--------------------------------------------
Full Name: 
Delivery Address Line 1:
City, State, ZIP:
Country Location:

--------------------------------------------
Hello! I would like to purchase this stamp from your collection. 
Please reply to this email with your payment details so we can coordinate fulfillment!`;

  // 4. Encode strings cleanly using standard URL specifications
  const encodedSubject = encodeURIComponent(subjectText);
  const encodedBody = encodeURIComponent(bodyText);
  
  // 5. Build standard RFC-compliant uniform resource mailto string
  const mailtoUrl = `mailto:${MY_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;

  // 6. Direct browser execution command that launches native system mail apps instantly
  window.location.href = mailtoUrl;
}

window.onload = initStore;

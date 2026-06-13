let stampsData = [];
let activeFilter = 'all';
let audioCtx = null;

// --- Initialize free EmailJS system right at startup ---
(function() {
  // Go to emailjs.com, sign up for free, and paste your Public Key here
  emailjs.init({ publicKey: "YOUR_EMAILJS_PUBLIC_KEY" });
})();

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
        <button class="buy-button" onclick="openCheckout('${stampString}')">Buy Now</button>
      </div>`;
    grid.appendChild(el);
  });
}

// --- Dynamic Modal Controls ---
function openCheckout(stampDataRaw) {
  playPopSound();
  const stamp = JSON.parse(stampDataRaw.replace(/&quot;/g, '"'));
  
  document.getElementById('modalTitle').innerText = stamp.name;
  document.getElementById('modalPrice').innerText = `$${stamp.price.toFixed(2)}`;
  document.getElementById('formStampId').value = stamp.id;
  document.getElementById('formStampName').value = stamp.name;
  
  document.getElementById('checkoutModal').style.display = 'flex';
}

function closeModal() {
  playClickSound();
  document.getElementById('checkoutModal').style.display = 'none';
  document.getElementById('orderForm').reset();
}

// --- Submit Forms Straight to Free Email API Payload ---
async function submitOrder(event) {
  event.preventDefault();
  playPopSound();
  
  const submitBtn = document.querySelector('.submit-order-btn');
  submitBtn.innerText = "SENDING...";
  submitBtn.disabled = true;

  const templateParams = {
    stamp_id: document.getElementById('formStampId').value,
    stamp_name: document.getElementById('formStampName').value,
    buyer_name: document.getElementById('custName').value,
    buyer_email: document.getElementById('custEmail').value,
    shipping_address: document.getElementById('custAddress').value
  };

  try {
    // 1. Go to emailjs.com -> add your email service -> add an email template layout
    // 2. Paste your unique Service ID and Template ID strings below:
    await emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams);
    
    alert("ORDER INVOICE SENT! Check your inbox, we will contact you to coordinate fulfillment.");
    closeModal();
  } catch (err) {
    console.error("EmailJS Transmission Failure:", err);
    alert("Failed to deliver order request. Please double check API configurations parameters.");
  } finally {
    submitBtn.innerText = "CONFIRM ORDER";
    submitBtn.disabled = false;
  }
}

window.onload = initStore;

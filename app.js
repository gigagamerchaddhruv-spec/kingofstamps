let stampsData = [];
let activeFilter = 'all';
let audioCtx = null;

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function playClickSound() {
  initAudio(); if (!audioCtx) return;
  const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
  osc.connect(gainNode); gainNode.connect(audioCtx.destination);
  osc.type = 'triangle'; osc.frequency.setValueAtTime(120, audioCtx.currentTime); 
  osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.05);
  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime); gainNode.gain.exponentialRampToValueAtTime(0.01, application_time => audioCtx.currentTime + 0.05);
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
  } catch (err) { console.error("Asset tracking layout fault:", err); }
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
    el.innerHTML = `
      <img src="${stamp.img}" alt="${stamp.name}" loading="lazy">
      <div class="card-info">
        <h3>${stamp.name}</h3>
        <p class="meta">Scott #${stamp.scott} | ${stamp.condition}</p>
        <p class="desc">${stamp.description}</p>
      </div>
      <div>
        <span class="price">$${stamp.price.toFixed(2)}</span>
        <button class="snipcart-add-item" data-item-id="${stamp.id}" data-item-name="${stamp.name}" data-item-price="${stamp.price}" data-item-url="/" data-item-image="${stamp.img}" ${stamp.type === 'individual' ? 'data-item-max-quantity="1"' : ''}>Add to Cart</button>
      </div>`;
    el.querySelector('.snipcart-add-item').addEventListener('mousedown', playPopSound);
    grid.appendChild(el);
  });
}
window.onload = initStore;
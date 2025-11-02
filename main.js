// public/main.js (frontend avec debug des erreurs)
const gamesList = document.getElementById('gamesList');
const previewArea = document.getElementById('previewArea');
const createBtn = document.getElementById('createBtn');

async function loadGames() {
  try {
    const res = await fetch('/api/games');
    if (!res.ok) {
      const text = await res.text();
      gamesList.innerHTML = `<p>Erreur chargement jeux: ${res.status} ${text}</p>`;
      return;
    }
    const data = await res.json();
    gamesList.innerHTML = '';
    if (!data.length) {
      gamesList.innerHTML = '<p>Aucun jeu publié.</p>';
      return;
    }
    data.forEach(g => {
      const div = document.createElement('div');
      div.className = 'game-card';
      div.innerHTML = `<div><strong>${escapeHtml(g.title)}</strong><br><small>${new Date(g.date).toLocaleString()}</small></div>
                       <button onclick="previewGame('${g.id}')">Voir</button>`;
      gamesList.appendChild(div);
    });
  } catch (err) {
    gamesList.innerHTML = `<p>Erreur réseau: ${escapeHtml(String(err))}</p>`;
  }
}

async function previewGame(id) {
  previewArea.innerHTML = `<iframe src="/play/${id}" sandbox="allow-scripts"></iframe>`;
}

createBtn.onclick = async () => {
  const title = document.getElementById('title').value.trim();
  const html = document.getElementById('html').value.trim();
  if (!title || !html) return alert('Merci de remplir le titre et le code HTML.');

  try {
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, html })
    });

    const text = await res.text();
    // si réponse JSON, on essaie de parser pour message utile
    let payload;
    try { payload = JSON.parse(text); } catch (e) { payload = { raw: text }; }

    if (res.ok) {
      alert('Jeu publié 🎉');
      document.getElementById('title').value = '';
      document.getElementById('html').value = '';
      loadGames();
    } else {
      const msg = payload.error || payload.raw || `HTTP ${res.status}`;
      alert('Erreur création: ' + msg);
      console.error('Create game failed:', res.status, payload);
    }
  } catch (err) {
    alert('Erreur réseau: ' + err.message);
    console.error('Fetch failed:', err);
  }
};

function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }

loadGames();

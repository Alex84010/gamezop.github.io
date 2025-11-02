const gamesList = document.getElementById('gamesList');
const previewArea = document.getElementById('previewArea');
const createBtn = document.getElementById('createBtn');

async function loadGames() {
  const res = await fetch('/api/games');
  const data = await res.json();
  gamesList.innerHTML = '';
  if (!data.length) {
    gamesList.innerHTML = '<p>Aucun jeu publié.</p>';
    return;
  }
  data.forEach(g => {
    const div = document.createElement('div');
    div.className = 'game-card';
    div.innerHTML = `<div><strong>${g.title}</strong><br><small>${new Date(g.date).toLocaleString()}</small></div>
                     <button onclick="previewGame('${g.id}')">Voir</button>`;
    gamesList.appendChild(div);
  });
}

async function previewGame(id) {
  previewArea.innerHTML = `<iframe src="/play/${id}" sandbox="allow-scripts"></iframe>`;
}

createBtn.onclick = async () => {
  const title = document.getElementById('title').value.trim();
  const html = document.getElementById('html').value.trim();
  if (!title || !html) return alert('Merci de remplir le titre et le code HTML.');

  const res = await fetch('/api/games', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, html })
  });

  if (res.ok) {
    alert('Jeu publié 🎉');
    document.getElementById('title').value = '';
    document.getElementById('html').value = '';
    loadGames();
  } else {
    alert('Erreur lors de la création du jeu.');
  }
};

loadGames();

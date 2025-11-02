const express = require('express');
const fs = require('fs');
const path = require('path');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const GAMES_DIR = path.join(__dirname, 'games');

if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR);

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

// Liste des jeux
app.get('/api/games', (req, res) => {
  const games = fs.readdirSync(GAMES_DIR)
    .map(folder => {
      const metaPath = path.join(GAMES_DIR, folder, 'meta.json');
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return { id: folder, title: meta.title, date: meta.date };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(games);
});

// Créer un nouveau jeu
app.post('/api/games', (req, res) => {
  const { title, html } = req.body;
  if (!title || !html) return res.status(400).json({ error: 'Titre et HTML requis' });

  const id = uuidv4();
  const folder = path.join(GAMES_DIR, id);
  fs.mkdirSync(folder);
  fs.writeFileSync(path.join(folder, 'index.html'), html);
  fs.writeFileSync(path.join(folder, 'meta.json'), JSON.stringify({
    title,
    date: new Date().toISOString()
  }));

  res.json({ id, title });
});

// Afficher un jeu
app.get('/play/:id', (req, res) => {
  const folder = path.join(GAMES_DIR, req.params.id);
  const file = path.join(folder, 'index.html');
  if (!fs.existsSync(file)) return res.status(404).send('Jeu introuvable.');
  res.sendFile(file);
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
